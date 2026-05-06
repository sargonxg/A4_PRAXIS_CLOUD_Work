'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, RefreshCw } from 'lucide-react';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { buildMemoBlocksForCase, listMemoTemplates } from '@/lib/memo/templates/registry';
import type { MemoTemplateId } from '@/types/memo';
import { cn } from '@/lib/utils/cn';

export function MemoStudio() {
  const { caseModule } = useWorkbenchScope();
  const templates = listMemoTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<MemoTemplateId>('policy-memo');
  const blocks = useMemo(
    () => buildMemoBlocksForCase(caseModule, selectedTemplateId),
    [caseModule, selectedTemplateId],
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-navy-950">
            <FileText className="h-5 w-5 text-gold-600" />
            <h2 className="text-lg font-semibold">Memo Studio</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Launch foundation for cited work products: choose a template, auto-populate from the active case, preserve source receipts, and prepare for DOCX/PDF/Markdown export.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
            <RefreshCw className="h-4 w-4" />
            Refresh from graph
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white">
            <Download className="h-4 w-4" />
            Export draft
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
                return <h3 key={block.id} className="mb-4 text-xl font-semibold text-navy-950">{block.content}</h3>;
              }
              if (block.type === 'bullets') {
                return (
                  <div key={block.id} className="mb-5">
                    <p className="text-sm font-semibold text-navy-950">{block.title}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                      {(block.items ?? []).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                );
              }
              return (
                <p key={block.id} className="mb-4 text-sm leading-7 text-slate-700">
                  {block.content}
                  {block.citations.length ? <sup className="ml-1 text-gold-700">[{block.citations.length}]</sup> : null}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
