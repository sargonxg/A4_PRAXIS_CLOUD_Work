'use client';

import { useCallback, useState } from 'react';
import { BoardroomIndex } from '@/components/boardroom/BoardroomWorkspace';
import { MemoStudio } from '@/components/memo/MemoStudio';
import { ACHIndex } from '@/components/sats/ACHWorkbench';
import { ToolMarketplace } from '@/components/tools/ToolMarketplace';
import { DeskTab } from '@/components/workbench/DeskTab';
import { DraftTab } from '@/components/workbench/draft/DraftTab';
import { ResearchTab } from '@/components/workbench/ResearchTab';
import { ToolGate } from '@/components/workbench/tool-gate';
import { WorkbenchChapterShell } from '@/components/workbench/chapter-shell';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import {
  WORKBENCH_CHAPTER_FLOW,
  type WorkbenchChapterId,
} from '@/lib/workbench/chapter-flow';
import { cn } from '@/lib/utils/cn';

const DEFAULT_OPEN_CHAPTERS: WorkbenchChapterId[] = ['research', 'memos', 'tools'];

export function WorkbenchChapterRenderer() {
  const { caseId } = useWorkbenchScope();
  const [openSet, setOpenSet] = useState<Set<WorkbenchChapterId>>(() => new Set(DEFAULT_OPEN_CHAPTERS));

  const toggleChapter = useCallback((id: WorkbenchChapterId) => {
    if (id === 'desk') return;
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="space-y-5" data-testid="workspace-chapter-desk">
      <section className="rounded-lg border border-navy-200 bg-white p-4 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-500">Chapter desk</p>
            <h2 className="mt-1 text-lg font-semibold text-navy-950">Seven work chapters for case work</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
              Desk is always on. Toggle the other chapters as panes without leaving this case workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {WORKBENCH_CHAPTER_FLOW.filter((chapter) => !chapter.alwaysOn).map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                onClick={() => toggleChapter(chapter.id)}
                className={cn(
                  'rounded-md border px-3 py-2 text-xs font-semibold transition',
                  openSet.has(chapter.id)
                    ? 'border-navy-800 bg-navy-950 text-white'
                    : 'border-slate-300 bg-white text-slate-800 hover:border-navy-300',
                )}
                aria-pressed={openSet.has(chapter.id)}
              >
                {chapter.navLabel}
              </button>
            ))}
          </div>
        </div>
      </section>

      {WORKBENCH_CHAPTER_FLOW.map((chapter) => {
        const active = chapter.alwaysOn || openSet.has(chapter.id);
        return (
          <WorkbenchChapterShell
            key={chapter.id}
            chapter={chapter}
            active={active}
            locked={chapter.alwaysOn}
            onOpen={toggleChapter}
          >
            <ChapterContent chapterId={chapter.id} caseId={caseId} />
          </WorkbenchChapterShell>
        );
      })}
    </div>
  );
}

function ChapterContent({ chapterId, caseId }: { chapterId: WorkbenchChapterId; caseId: string }) {
  const { caseModule } = useWorkbenchScope();
  const customChapter = caseModule.chapters?.[chapterId];
  if (customChapter) return <div data-testid={`workbench-${chapterId}-surface`}>{customChapter()}</div>;
  if (chapterId === 'desk') return <DeskTab />;
  if (chapterId === 'research') return <ResearchTab />;
  if (chapterId === 'memos') return <MemoStudio />;
  if (chapterId === 'draft') {
    return (
      <ToolGate>
        <DraftTab />
      </ToolGate>
    );
  }
  if (chapterId === 'ach') return <ACHIndex caseId={caseId} />;
  if (chapterId === 'tools') return <ToolMarketplace />;
  return (
    <ToolGate>
      <BoardroomIndex caseId={caseId} />
    </ToolGate>
  );
}
