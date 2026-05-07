'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, RefreshCw, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { createMemoVersion, memoBlocksToMarkdown, memoBlocksToPlainText } from '@/lib/memo/export';
import { buildMemoBlocksForCase, listMemoTemplates } from '@/lib/memo/templates/registry';
import type { MemoBlock, MemoTemplateId, MemoVersion } from '@/types/memo';
import { cn } from '@/lib/utils/cn';

export function MemoStudio() {
  const { caseId, caseModule } = useWorkbenchScope();
  const { user } = useAuth();
  const templates = listMemoTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<MemoTemplateId>('policy-memo');
  const generatedBlocks = useMemo(
    () => buildMemoBlocksForCase(caseModule, selectedTemplateId),
    [caseModule, selectedTemplateId],
  );
  const [blocks, setBlocks] = useState<MemoBlock[]>(generatedBlocks);
  const [versions, setVersions] = useState<MemoVersion[]>([]);
  const [status, setStatus] = useState('Draft ready');
  const [backendMemoId, setBackendMemoId] = useState<string | null>(null);
  const title = `${templates.find((template) => template.id === selectedTemplateId)?.label ?? 'Memo'}: ${caseModule.manifest.name}`;
  const storageKey = `praxis:memo:${caseModule.id}:${selectedTemplateId}`;
  const graphSnapshotId = `${caseModule.id}:${caseModule.truthLayers.claim.lastUpdated}`;

  useEffect(() => {
    let cancelled = false;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { blocks?: MemoBlock[]; versions?: MemoVersion[] };
        setBlocks(parsed.blocks?.length ? parsed.blocks : generatedBlocks);
        setVersions(parsed.versions ?? []);
        setStatus(parsed.blocks?.length ? 'Draft restored' : 'Draft ready');
      }
    } catch {
      setStatus('Draft ready');
    }
    fetch(`/api/memos?caseId=${encodeURIComponent(caseModule.id)}&templateId=${encodeURIComponent(selectedTemplateId)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { versions?: MemoVersion[] } | null) => {
        if (cancelled || !data?.versions?.length) return;
        const latest = data.versions.at(-1);
        if (!latest?.blocks?.length) return;
        setBlocks(latest.blocks);
        setVersions(data.versions);
        setStatus('Server draft restored');
        saveLocalDraft(storageKey, latest.blocks, data.versions);
      })
      .catch(() => {
        if (!cancelled && !hasLocalDraft(storageKey)) {
          setBlocks(generatedBlocks);
          setVersions([]);
        }
      });
    if (!hasLocalDraft(storageKey)) {
      setBlocks(generatedBlocks);
      setVersions([]);
    }
    return () => { cancelled = true; };
  }, [caseModule.id, generatedBlocks, selectedTemplateId, storageKey]);

  function persist(nextBlocks: MemoBlock[], nextVersions = versions, nextStatus = 'Draft saved', changeNote?: string) {
    setBlocks(nextBlocks);
    setVersions(nextVersions);
    setStatus(nextStatus);
    saveLocalDraft(storageKey, nextBlocks, nextVersions);
    if (user && !user.isDemo && changeNote) {
      fetch('/api/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: caseModule.id,
          templateId: selectedTemplateId,
          title,
          blocks: nextBlocks,
          graphSnapshotId,
          changeNote,
        }),
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { versions?: MemoVersion[] } | null) => {
          if (!data?.versions?.length) return;
          setVersions(data.versions);
          saveLocalDraft(storageKey, nextBlocks, data.versions);
          setStatus(`Server version ${data.versions.at(-1)?.versionNumber ?? data.versions.length} saved`);
        })
        .catch(() => setStatus(`${nextStatus} locally`));
    }
  }

  function saveLocalDraft(key: string, nextBlocks: MemoBlock[], nextVersions: MemoVersion[]) {
    try {
      window.localStorage.setItem(key, JSON.stringify({ blocks: nextBlocks, versions: nextVersions }));
    } catch {
      setStatus('Draft held in this tab');
    }
  }

  function hasLocalDraft(key: string): boolean {
    try {
      return window.localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  function updateBlock(blockId: string, value: string) {
    persist(
      blocks.map((block) => (block.id === blockId ? { ...block, content: value } : block)),
      versions,
      'Draft edited',
    );
  }

  function updateBullet(blockId: string, index: number, value: string) {
    persist(
      blocks.map((block) => {
        if (block.id !== blockId) return block;
        const items = [...(block.items ?? [])];
        items[index] = value;
        return { ...block, items };
      }),
      versions,
      'Draft edited',
    );
  }

  function saveVersion(note: string) {
    const version = createMemoVersion({
      memoId: `${caseModule.id}-${selectedTemplateId}`,
      templateId: selectedTemplateId,
      title,
      authorUid: 'local-draft',
      graphSnapshotId: `${caseModule.id}:${caseModule.truthLayers.claim.lastUpdated}`,
      blocks,
      previousVersions: versions,
      changeNote: note,
    });
    persist(blocks, [...versions, version], `Version ${version.versionNumber} saved`, note);
    void persistChapterMemo(note, blocks);
  }

  async function persistChapterMemo(changeNote: string, nextBlocks: MemoBlock[]): Promise<string | null> {
    const response = await fetch('/api/backend/chapters/memos', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        case_id: caseId,
        title,
        body: memoBlocksToMarkdown(title, nextBlocks),
        source_kind: 'memo-studio',
        metadata: {
          templateId: selectedTemplateId,
          graphSnapshotId,
          changeNote,
          blockCount: nextBlocks.length,
        },
      }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (response?.ok && payload.memo?.id) {
      setBackendMemoId(payload.memo.id);
      setStatus(payload.cognee?.ok ? 'Chapter memo saved to memory' : 'Chapter memo saved; memory queued');
      return payload.memo.id;
    }
    setStatus('Draft saved locally; chapter memo backend unavailable');
    return null;
  }

  async function suggestContent() {
    const memoId = backendMemoId ?? await persistChapterMemo('Prepared for content suggestion', blocks);
    if (!memoId) {
      setStatus('Save a version before requesting memo assistance');
      return;
    }
    const response = await fetch(`/api/backend/chapters/memos/${encodeURIComponent(memoId)}/assist`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        case_id: caseId,
        query: `Improve the memo "${title}" with source-grounded additions.`,
      }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => ({}));
    if (response?.ok) {
      setStatus((payload.hits?.length ?? 0) > 0 ? `Memo assistance found ${payload.hits.length} source hit(s)` : 'Memo assistance ran; no source hits yet');
      return;
    }
    setStatus('Memo assistance unavailable');
  }

  function refreshFromGraph() {
    const refreshed = buildMemoBlocksForCase(caseModule, selectedTemplateId);
    const version = createMemoVersion({
      memoId: `${caseModule.id}-${selectedTemplateId}`,
      templateId: selectedTemplateId,
      title,
      authorUid: 'local-draft',
      graphSnapshotId,
      blocks: refreshed,
      previousVersions: versions,
      changeNote: 'Refreshed from active case graph',
    });
    persist(refreshed, [...versions, version], `Graph refresh saved as v${version.versionNumber}`, 'Refreshed from active case graph');
  }

  function download(name: string, type: string, content: BlobPart) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function exportMarkdown() {
    saveVersion('Exported Markdown draft');
    download(`${caseModule.id}-${selectedTemplateId}.md`, 'text/markdown;charset=utf-8', memoBlocksToMarkdown(title, blocks));
  }

  async function exportDocx() {
    saveVersion('Exported DOCX draft');
    const [{ Document, Packer, Paragraph, TextRun, HeadingLevel }] = await Promise.all([import('docx')]);
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
          ...memoBlocksToPlainText(title, blocks).split('\n').filter(Boolean).map((line) => (
            new Paragraph({ children: [new TextRun(line)] })
          )),
        ],
      }],
    });
    const blob = await Packer.toBlob(doc);
    download(`${caseModule.id}-${selectedTemplateId}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', blob);
  }

  async function exportPdf() {
    saveVersion('Exported PDF draft');
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 48;
    let y = margin;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(title, margin, y);
    y += 28;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    for (const line of memoBlocksToPlainText(title, blocks).split('\n')) {
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
    pdf.save(`${caseModule.id}-${selectedTemplateId}.pdf`);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-navy-950">
            <FileText className="h-5 w-5 text-gold-600" />
            <h2 className="text-lg font-semibold">Memo Studio</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Create cited work products from the active case graph, edit the generated blocks, keep local and server-backed versions, and export Markdown, DOCX, or PDF drafts.
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">{status} · {versions.length} saved versions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={refreshFromGraph} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
            <RefreshCw className="h-4 w-4" />
            Refresh from graph
          </button>
          <button type="button" onClick={() => saveVersion('Manual save')} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
            <Save className="h-4 w-4" />
            Save version
          </button>
          <button type="button" onClick={() => void suggestContent()} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
            <RefreshCw className="h-4 w-4" />
            Suggest content
          </button>
          <button type="button" onClick={exportMarkdown} className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white">
            <Download className="h-4 w-4" />
            Markdown
          </button>
          <button type="button" onClick={exportDocx} className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white">
            <Download className="h-4 w-4" />
            DOCX
          </button>
          <button type="button" onClick={exportPdf} className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white">
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelectedTemplateId(template.id)}
              className={cn(
                'w-full rounded-md border p-3 text-left transition',
                selectedTemplateId === template.id
                  ? 'border-gold-300 bg-gold-50 text-navy-950'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
              )}
            >
              <p className="text-sm font-semibold">{template.label}</p>
              <p className="mt-1 text-xs leading-5">{template.description}</p>
            </button>
          ))}
        </aside>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="mx-auto max-w-3xl rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            {blocks.map((block) => {
              if (block.type === 'heading') {
                return (
                  <input
                    key={block.id}
                    value={block.content}
                    onChange={(event) => updateBlock(block.id, event.target.value)}
                    className="mb-4 w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-xl font-semibold text-navy-950 outline-none focus:border-gold-300 focus:bg-gold-50"
                  />
                );
              }
              if (block.type === 'bullets') {
                return (
                  <div key={block.id} className="mb-5">
                    <p className="text-sm font-semibold text-navy-950">{block.title}</p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                      {(block.items ?? []).map((item, index) => (
                        <li key={`${block.id}-${index}`} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <input
                            value={item}
                            onChange={(event) => updateBullet(block.id, index, event.target.value)}
                            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 outline-none focus:border-gold-300 focus:bg-gold-50"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return (
                <label key={block.id} className="mb-4 block text-sm leading-7 text-slate-700">
                  <textarea
                    value={block.content}
                    onChange={(event) => updateBlock(block.id, event.target.value)}
                    rows={Math.max(3, Math.ceil(block.content.length / 90))}
                    className="w-full resize-y rounded-md border border-transparent bg-transparent px-2 py-1 outline-none focus:border-gold-300 focus:bg-gold-50"
                  />
                  {block.citations.length ? <sup className="ml-1 text-gold-700">[{block.citations.length}]</sup> : null}
                </label>
              );
            })}
            {versions.length ? (
              <div className="mt-6 border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Version history</p>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  {versions.slice(-4).map((version) => (
                    <p key={version.id}>v{version.versionNumber} · {version.changeNote ?? 'Saved'} · {new Date(version.createdAt).toLocaleString()}</p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
