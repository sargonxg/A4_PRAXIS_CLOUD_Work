'use client';

import { useCallback, useState } from 'react';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { WorkbenchChapterShell } from '@/components/workbench/chapter-shell';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import {
  WORKBENCH_CHAPTER_FLOW,
  type WorkbenchChapterId,
} from '@/lib/workbench/chapter-flow';

export function WorkbenchChapterRenderer() {
  const { caseModule, situation } = useWorkbenchScope();
  const [openSet, setOpenSet] = useState<Set<WorkbenchChapterId>>(
    () => new Set(WORKBENCH_CHAPTER_FLOW.map((chapter) => chapter.id)),
  );

  const toggleChapter = useCallback((id: WorkbenchChapterId) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="space-y-5">
      {WORKBENCH_CHAPTER_FLOW.map((chapter) => (
        <div key={chapter.id} className="space-y-4">
          {chapter.id === 'dialectica-reasoning' ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">Context | Tools divider</p>
                  <p className="mt-1 text-sm text-amber-900">Above: context. Below: tools that consume the context.</p>
                </div>
                <ContextHealthChip />
              </div>
            </div>
          ) : null}
          <WorkbenchChapterShell chapter={chapter} active={openSet.has(chapter.id)} onOpen={toggleChapter}>
            {caseModule.chapters?.[chapter.id]?.() ?? <GenericChapterContent chapterId={chapter.id} situationName={situation.name} />}
          </WorkbenchChapterShell>
        </div>
      ))}
    </div>
  );
}

function GenericChapterContent({ chapterId, situationName }: { chapterId: WorkbenchChapterId; situationName: string }) {
  const copy: Record<WorkbenchChapterId, string> = {
    'situation-frame': 'Frame the mandate, question, actors, constraints, and change indicators for this case.',
    'source-receipts': 'Attach public sources, private documents, retrieved snippets, and reliability notes.',
    'conflict-graph': 'Review graph primitives, pending proposals, provenance coverage, and confidence gaps.',
    'dialectica-reasoning': 'Run graph-grounded recipes only after the context is strong enough to defend.',
    'decision-product': 'Produce cited memos, briefings, talking points, and export manifests from the locked context.',
  };
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-650">
      <p className="font-semibold text-navy-900">{situationName}</p>
      <p className="mt-1">{copy[chapterId]}</p>
    </div>
  );
}
