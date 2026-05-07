'use client';

import { useMemo, useState } from 'react';
import { FileText, ShieldCheck } from 'lucide-react';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { AppendixPicker } from '@/components/workbench/draft/AppendixPicker';
import { CoverPageEditor } from '@/components/workbench/draft/CoverPageEditor';
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
  const { caseModule, user } = useWorkbenchScope();
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
  const selectedMemos = memoOptions.filter((memo) => selectedMemoIds.includes(memo.id));

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

  async function exportPackage() {
    const markdown = renderDraftMarkdown({
      caseModule,
      memos: selectedMemos,
      primaryMemoId,
      appendices,
      selectedAppendixIds,
      coverPage,
      redactions,
      settings,
    });

    const filenameRoot = `${caseModule.id}-briefing-package`;
    if (settings.format === 'markdown') {
      download(`${filenameRoot}.md`, 'text/markdown;charset=utf-8', markdown);
      return;
    }

    if (settings.format === 'docx') {
      const [{ Document, HeadingLevel, Packer, Paragraph }] = await Promise.all([import('docx')]);
      const plainText = renderDraftPlainText(coverPage.title, markdown);
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
    for (const line of renderDraftPlainText(coverPage.title, markdown).split('\n')) {
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
          <span className="inline-flex items-center gap-1 rounded-full bg-diplomatic-blue/10 px-2.5 py-1 text-xs font-semibold text-diplomatic-blue">
            <ShieldCheck className="h-3.5 w-3.5" />
            Redaction aware
          </span>
          <span className="rounded-full bg-gold-100 px-2.5 py-1 text-xs font-semibold text-gold-800">Manifest embedded</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">DOCX/PDF/Markdown</span>
        </div>
      </div>

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
        exportSummary={exportSummary}
        onSettingsChange={setSettings}
        onExport={exportPackage}
      />
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
