import Link from 'next/link';
import { Download, Save, ShieldCheck } from 'lucide-react';
import { AutoFillButton } from '@/components/draft/AutoFillButton';
import { BlockEditor } from '@/components/draft/BlockEditor';
import { ContextPanel } from '@/components/draft/ContextPanel';
import { getDraftCase, getDraftTemplate, listDraftTemplates, type DraftShellRecord } from '@/lib/draft/api';

export function DraftingShell({ draft }: { draft: DraftShellRecord }) {
  const caseModule = getDraftCase(draft.caseId);
  const template = getDraftTemplate(draft.templateId);
  const templates = listDraftTemplates();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                <Link href="/draft" className="hover:text-slate-950">Drafting Studio</Link>
                <span className="px-2">/</span>
                <span>{draft.id === 'new' ? 'New draft' : draft.title}</span>
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{draft.title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">{draft.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AutoFillButton draftId={draft.id} templateId={draft.templateId} />
              <button type="button" className="inline-flex h-10 items-center gap-2 border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Save className="h-4 w-4" />
                Save shell
              </button>
              <button type="button" className="inline-flex h-10 items-center gap-2 border border-slate-900 bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800">
                <Download className="h-4 w-4" />
                Export preview
              </button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[240px_240px_minmax(0,1fr)]">
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Template</span>
              <select defaultValue={template.id} className="h-10 border border-slate-300 bg-white px-3">
                {templates.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-semibold text-slate-700">Work episode</span>
              <select defaultValue={draft.workEpisode} className="h-10 border border-slate-300 bg-white px-3">
                <option>{draft.workEpisode}</option>
                <option>Current assessment</option>
                <option>Package review</option>
              </select>
            </label>
            <div className="flex items-end">
              <div className="flex min-h-10 w-full items-center gap-2 border border-slate-200 bg-slate-50 px-3 text-sm text-slate-650">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Export controls are visible. Auto-fill and refinements return review-required proposals; signed artifacts remain production export work.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <BlockEditor draftId={draft.id} blocks={draft.blocks} />
        <ContextPanel caseModule={caseModule} draft={draft} />
      </div>
    </main>
  );
}
