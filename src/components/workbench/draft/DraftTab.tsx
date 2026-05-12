'use client';

import { useMemo, useState } from 'react';
import { FileSearch, FileText, Save } from 'lucide-react';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { AppendixPicker } from '@/components/workbench/draft/AppendixPicker';
import { CoverPageEditor } from '@/components/workbench/draft/CoverPageEditor';
import { DraftCompanion } from '@/components/workbench/draft/DraftCompanion';
import { ExportControls } from '@/components/workbench/draft/ExportControls';
import { MemosSelection } from '@/components/workbench/draft/MemosSelection';
import { RedactionSettings } from '@/components/workbench/draft/RedactionSettings';
import {
  buildDefaultCoverPage,
  buildDraftAppendices,
  buildDraftMemoOptions,
  defaultBlockRedactions,
  renderDraftMarkdown,
  renderDraftPlainText,
  type DraftAudience,
  type DraftExportSettings,
} from '@/lib/workbench/draft-assembly-state';

export function DraftTab() {
  const { caseId, caseModule, user } = useWorkbenchScope();
  const isDemoWorkbench = caseModule.kind === 'example' || user?.isDemo === true;
  const memoOptions = useMemo(() => buildDraftMemoOptions(caseModule), [caseModule]);
  const appendices = useMemo(() => buildDraftAppendices(caseModule), [caseModule]);
  const [selectedMemoIds, setSelectedMemoIds] = useState<string[]>(() => memoOptions.slice(0, 2).map((memo) => memo.id));
  const [primaryMemoId, setPrimaryMemoId] = useState(() => memoOptions[0]?.id ?? '');
  const [selectedAppendixIds, setSelectedAppendixIds] = useState<string[]>(() => appendices.slice(0, 3).map((appendix) => appendix.id));
  const [coverPage, setCoverPage] = useState(() => buildDefaultCoverPage(caseModule, user?.name ?? 'PRAXIS analyst'));
  const [settings, setSettings] = useState<DraftExportSettings>({
    audience: 'internal',
    format: 'markdown',
    embedC2pa: true,
    embedAuditManifest: true,
  });
  const [redactions, setRedactions] = useState(() => defaultBlockRedactions(memoOptions));
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [backendDraftId, setBackendDraftId] = useState<string | null>(null);
  const [citationNote, setCitationNote] = useState<string | null>(null);
  const selectedMemos = memoOptions.filter((memo) => selectedMemoIds.includes(memo.id));
  const selectedAppendices = appendices.filter((appendix) => selectedAppendixIds.includes(appendix.id));

  function toggleMemo(memoId: string) {
    setSelectedMemoIds((current) => {
      const next = current.includes(memoId)
        ? current.filter((id) => id !== memoId)
        : [...current, memoId];
      if (!next.includes(primaryMemoId)) setPrimaryMemoId(next[0] ?? '');
      return next;
    });
  }

  function toggleAppendix(appendixId: string) {
    setSelectedAppendixIds((current) => (
      current.includes(appendixId)
        ? current.filter((id) => id !== appendixId)
        : [...current, appendixId]
    ));
  }

  function changeRedaction(blockId: string, level: DraftAudience) {
    setRedactions((current) => ({ ...current, [blockId]: level }));
  }

  function buildMarkdown() {
    return renderDraftMarkdown({
      caseModule,
      memos: selectedMemos,
      primaryMemoId,
      appendices,
      selectedAppendixIds,
      coverPage,
      redactions,
      settings,
    });
  }

  async function persistDraft(markdown = buildMarkdown()): Promise<string | null> {
    if (isDemoWorkbench) {
      setExportNote('Draft held locally; chapter backend save unavailable.');
      return null;
    }
    const response = await fetch('/api/backend/chapters/drafts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        case_id: caseId,
        title: coverPage.title,
        body: markdown,
        citations: selectedMemos.flatMap((memo) => memo.blocks.flatMap((block) => block.citations)),
        metadata: {
          audience: settings.audience,
          format: settings.format,
          primaryMemoId,
          memoIds: selectedMemos.map((memo) => memo.id),
          appendixIds: selectedAppendixIds,
          redactionSummary: redactions,
        },
      }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (response?.ok && payload.draft?.id) {
      setBackendDraftId(payload.draft.id);
      setExportNote('Draft saved to the chapter backend.');
      return payload.draft.id;
    }
    setExportNote('Draft held locally; chapter backend save unavailable.');
    return null;
  }

  async function findCitations() {
    const draftId = backendDraftId ?? await persistDraft();
    if (!draftId) {
      setCitationNote('Save the draft before citation lookup.');
      return;
    }
    const response = await fetch(`/api/backend/chapters/drafts/${encodeURIComponent(draftId)}/cite`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: `${coverPage.title} ${selectedMemos.map((memo) => memo.title).join(' ')}`, top_k: 5 }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (response?.ok) {
      setCitationNote((payload.hits?.length ?? 0) > 0 ? `Found ${payload.hits.length} citation hit(s).` : 'Citation lookup ran; no source hits yet.');
      return;
    }
    setCitationNote('Citation lookup unavailable.');
  }

  async function exportPackage() {
    const markdown = buildMarkdown();
    const plainText = renderDraftPlainText(coverPage.title, markdown);
    const draftId = await persistDraft(markdown);
    if (!isDemoWorkbench && draftId && settings.format !== 'markdown') {
      await fetch(`/api/backend/chapters/drafts/${encodeURIComponent(draftId)}/export?format=${settings.format}`, { method: 'POST' }).catch(() => null);
    }
    if (!isDemoWorkbench) {
      const persistResponse = await fetch(`/api/cases/${encodeURIComponent(caseId)}/draft/export`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: coverPage.title,
          format: settings.format,
          audience: settings.audience,
          markdown,
          plainText,
          primaryMemoId,
          memoIds: selectedMemos.map((memo) => memo.id),
          appendixIds: selectedAppendixIds,
          coverPage,
          embedC2pa: settings.embedC2pa,
          embedAuditManifest: settings.embedAuditManifest,
          redactionSummary: redactions,
        }),
      }).catch(() => null);
      const persistPayload = await persistResponse?.json().catch(() => ({}));
      if (persistResponse?.ok) {
        setExportNote(persistPayload.mode === 'persisted'
          ? 'Export manifest persisted to this case library.'
          : 'Demo export manifest generated for this session.');
      } else {
        setExportNote('Download prepared locally; server export persistence was unavailable.');
      }
    } else {
      setExportNote('Demo export manifest generated for this session.');
    }

    const filenameRoot = `${caseModule.id}-briefing-package`;
    if (settings.format === 'markdown') {
      download(`${filenameRoot}.md`, 'text/markdown;charset=utf-8', markdown);
      return;
    }

    if (settings.format === 'docx') {
      const [{ Document, HeadingLevel, Packer, Paragraph }] = await Promise.all([import('docx')]);
      const doc = new Document({
        sections: [{
          children: plainText.split('\n').filter(Boolean).map((line, index) => (
            new Paragraph({
              text: line,
              heading: index === 0 ? HeadingLevel.TITLE : undefined,
            })
          )),
        }],
      });
      const blob = await Packer.toBlob(doc);
      download(`${filenameRoot}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', blob);
      return;
    }

    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 48;
    let y = margin;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    for (const line of plainText.split('\n')) {
      const wrapped = pdf.splitTextToSize(line || ' ', 500) as string[];
      for (const segment of wrapped) {
        if (y > 760) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(segment, margin, y);
        y += 14;
      }
    }
    pdf.save(`${filenameRoot}.pdf`);
  }

  const exportSummary = `${selectedMemos.length} memo${selectedMemos.length === 1 ? '' : 's'}, ${selectedAppendixIds.length} appendices, ${settings.audience} audience, ${settings.format.toUpperCase()} output.`;

  return (
    <section data-testid="workbench-draft-surface" className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-navy-950">
              <FileText className="h-5 w-5 text-gold-600" />
              <h2 className="text-lg font-semibold">Briefing Assembly</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Turn memo drafts into a decision-ready briefing package with cover metadata, appendix inventory, audience redaction controls, and an embedded manifest.
            </p>
          </div>
          <ContextHealthChip />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void persistDraft()}
            className="inline-flex items-center gap-1 rounded-md border border-navy-300 bg-white px-2.5 py-1 text-xs font-semibold text-navy-900"
          >
            <Save className="h-3.5 w-3.5" />
            Save draft
          </button>
          <button
            type="button"
            onClick={() => void findCitations()}
            className="inline-flex items-center gap-1 rounded-md border border-navy-300 bg-white px-2.5 py-1 text-xs font-semibold text-navy-900"
          >
            <FileSearch className="h-3.5 w-3.5" />
            Find citations
          </button>
        </div>
        {citationNote ? <p className="mt-3 text-sm font-semibold text-navy-900">{citationNote}</p> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <MemosSelection
            memoOptions={memoOptions}
            selectedMemoIds={selectedMemoIds}
            primaryMemoId={primaryMemoId}
            onToggleMemo={toggleMemo}
            onSetPrimary={setPrimaryMemoId}
          />
          <CoverPageEditor value={coverPage} onChange={setCoverPage} />
          <AppendixPicker appendices={appendices} selectedAppendixIds={selectedAppendixIds} onToggleAppendix={toggleAppendix} />
          <RedactionSettings
            audience={settings.audience}
            selectedMemos={selectedMemos}
            redactions={redactions}
            onAudienceChange={(audience) => setSettings((current) => ({ ...current, audience }))}
            onRedactionChange={changeRedaction}
          />
          <ExportControls
            settings={settings}
            disabled={selectedMemos.length === 0}
            exportSummary={exportNote ? `${exportSummary} ${exportNote}` : exportSummary}
            onSettingsChange={setSettings}
            onExport={exportPackage}
          />
        </div>
        <div className="xl:sticky xl:top-4 xl:self-start">
          <DraftCompanion
            caseId={caseId}
            selectedMemos={selectedMemos}
            selectedAppendices={selectedAppendices}
            primaryMemoId={primaryMemoId}
            settings={settings}
          />
        </div>
      </div>
    </section>
  );
}

function download(name: string, type: string, content: BlobPart) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
