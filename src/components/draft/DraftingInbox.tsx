import Link from 'next/link';
import { FileText, Filter, Plus } from 'lucide-react';
import { getDraftCase, listDraftShells, listDraftTemplates, type DraftShellRecord, type DraftStatus } from '@/lib/draft/api';

const STATUS_LABELS: Record<DraftStatus, string> = {
  new: 'New',
  working: 'Working',
  review: 'Review',
  'export-ready': 'Export ready',
};

export function DraftingInbox({
  query,
  templateId,
  status,
}: {
  query?: string;
  templateId?: string;
  status?: string;
}) {
  const templates = listDraftTemplates();
  const drafts = listDraftShells().filter((draft) => {
    const search = (query ?? '').trim().toLowerCase();
    if (templateId && draft.templateId !== templateId) return false;
    if (status && draft.status !== status) return false;
    if (!search) return true;
    return `${draft.title} ${draft.summary} ${draft.workEpisode}`.toLowerCase().includes(search);
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-slate-500">PRAXIS drafting</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Drafting Studio</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-650">
                Assemble context-grounded briefings, review source posture, auto-fill MVP templates, and refine sections with visible citations.
              </p>
            </div>
            <Link
              href={`/app/workbench/${encodeURIComponent(listDraftShells()[0]?.caseId ?? 'syria-2026')}?openChapter=memos`}
              className="inline-flex h-10 items-center justify-center gap-2 border border-slate-900 bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              New draft
            </Link>
          </div>
          <form className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]">
            <label className="flex h-10 items-center gap-2 border border-slate-300 bg-white px-3">
              <Filter className="h-4 w-4 text-slate-500" />
              <span className="sr-only">Search drafts</span>
              <input name="q" defaultValue={query ?? ''} placeholder="Search drafts" className="w-full bg-transparent text-sm outline-none" />
            </label>
            <select name="template" defaultValue={templateId ?? ''} className="h-10 border border-slate-300 bg-white px-3 text-sm">
              <option value="">All templates</option>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.label}</option>)}
            </select>
            <select name="status" defaultValue={status ?? ''} className="h-10 border border-slate-300 bg-white px-3 text-sm">
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <button className="h-10 border border-slate-900 bg-white px-4 text-sm font-semibold text-slate-950 hover:bg-slate-100">Filter</button>
          </form>
        </header>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {drafts.map((draft) => <DraftCard key={draft.id} draft={draft} />)}
        </section>

        {drafts.length === 0 ? (
          <section className="border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-slate-950">No drafts match this filter.</p>
            <p className="mt-2 text-sm text-slate-600">Start a new draft from a Context or clear the filters.</p>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function DraftCard({ draft }: { draft: DraftShellRecord }) {
  const caseModule = getDraftCase(draft.caseId);
  const template = listDraftTemplates().find((item) => item.id === draft.templateId);

  return (
    <Link href={`/draft/${draft.id}`} className="grid min-h-72 gap-4 border border-slate-200 bg-white p-4 hover:border-slate-500">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700">
          <FileText className="h-5 w-5" />
        </span>
        <span className="border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">{STATUS_LABELS[draft.status]}</span>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">{template?.label ?? draft.templateId}</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">{draft.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-650">{draft.summary}</p>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-xs text-slate-600">
        <div>
          <dt>Context</dt>
          <dd className="mt-1 font-semibold text-slate-900">{caseModule.manifest.name}</dd>
        </div>
        <div>
          <dt>Episode</dt>
          <dd className="mt-1 font-semibold text-slate-900">{draft.workEpisode}</dd>
        </div>
        <div>
          <dt>Modified</dt>
          <dd className="mt-1 font-semibold text-slate-900">{draft.updatedAt.slice(0, 10)}</dd>
        </div>
        <div>
          <dt>Export</dt>
          <dd className="mt-1 font-semibold text-slate-900">{exportLabel(draft.exportState)}</dd>
        </div>
      </dl>
    </Link>
  );
}

function exportLabel(state: DraftShellRecord['exportState']) {
  if (state === 'manifest-ready') return 'Manifest ready';
  if (state === 'local-only') return 'Local package';
  return 'Phase 6';
}
