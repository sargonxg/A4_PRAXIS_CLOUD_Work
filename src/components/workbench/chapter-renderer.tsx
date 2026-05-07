'use client';

import { useCallback, useState } from 'react';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { WorkbenchChapterShell } from '@/components/workbench/chapter-shell';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { renderLayeredChapterContent, type SuggestedChapterItem } from '@/lib/workbench/chapter-content-layer';
import {
  WORKBENCH_CHAPTER_FLOW,
  type WorkbenchChapterId,
} from '@/lib/workbench/chapter-flow';

export function WorkbenchChapterRenderer() {
  const { caseModule } = useWorkbenchScope();
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

  const onSuggestionAccept = useCallback((_item: SuggestedChapterItem) => {
    // Pack 26 backend follow-up wires accepted AI suggestions into the review
    // queue. The current layer keeps all generated content advisory.
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
            {caseModule.chapters?.[chapter.id]?.() ?? renderLayeredChapterContent({
              caseModule,
              chapterId: chapter.id,
              onSuggestionAccept,
            })}
          </WorkbenchChapterShell>
        </div>
      ))}
    </div>
  );
}
