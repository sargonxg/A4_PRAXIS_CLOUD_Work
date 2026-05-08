'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { DeskTab } from '@/components/workbench/DeskTab';
import { ChapterSkeleton } from '@/components/workbench/chapter-skeleton';
import { StagedHeroToolNotice } from '@/components/workbench/staged-hero-tool-notice';
import { ToolGate } from '@/components/workbench/tool-gate';
import { WorkbenchChapterShell } from '@/components/workbench/chapter-shell';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import {
  WORKBENCH_CHAPTER_FLOW,
  type WorkbenchChapterId,
} from '@/lib/workbench/chapter-flow';
import type { MarketplaceHeroToolId } from '@/lib/tools/marketplace/stage-targets';
import { cn } from '@/lib/utils/cn';

const ResearchTab = dynamic(
  () => import('@/components/workbench/ResearchTab').then((module) => ({ default: module.ResearchTab })),
  { loading: () => <ChapterSkeleton title="Research" />, ssr: false },
);
const MemoStudio = dynamic(
  () => import('@/components/memo/MemoStudio').then((module) => ({ default: module.MemoStudio })),
  { loading: () => <ChapterSkeleton title="Memos" />, ssr: false },
);
const DraftTab = dynamic(
  () => import('@/components/workbench/draft/DraftTab').then((module) => ({ default: module.DraftTab })),
  { loading: () => <ChapterSkeleton title="Draft" />, ssr: false },
);
const ACHIndex = dynamic(
  () => import('@/components/sats/ACHWorkbench').then((module) => ({ default: module.ACHIndex })),
  { loading: () => <ChapterSkeleton title="ACH" />, ssr: false },
);
const ToolMarketplace = dynamic(
  () => import('@/components/tools/ToolMarketplace').then((module) => ({ default: module.ToolMarketplace })),
  { loading: () => <ChapterSkeleton title="Recipe library" />, ssr: false },
);
const BoardroomIndex = dynamic(
  () => import('@/components/boardroom/BoardroomWorkspace').then((module) => ({ default: module.BoardroomIndex })),
  { loading: () => <ChapterSkeleton title="Boardroom" />, ssr: false },
);

const DEFAULT_OPEN_CHAPTERS: WorkbenchChapterId[] = ['research', 'memos'];
const VALID_CHAPTER_IDS = new Set<WorkbenchChapterId>(WORKBENCH_CHAPTER_FLOW.map((chapter) => chapter.id));
const STAGED_HERO_TOOLS_BY_CHAPTER: Partial<Record<WorkbenchChapterId, MarketplaceHeroToolId[]>> = {
  desk: ['dashboard', 'situation-intelligence', 'conflict-graph'],
  research: ['source-scout'],
  draft: ['policy-memo', 'briefing', 'treaty-analyzer'],
  boardroom: ['brainstorming-table', 'scenarios', 'negotiation-prep'],
};

export function WorkbenchChapterRenderer() {
  const { caseId } = useWorkbenchScope();
  const [openSet, setOpenSet] = useState<Set<WorkbenchChapterId>>(() => new Set(DEFAULT_OPEN_CHAPTERS));

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('openChapter') as WorkbenchChapterId | null;
    if (!requested || requested === 'desk' || !VALID_CHAPTER_IDS.has(requested)) return;
    const frame = window.requestAnimationFrame(() => setOpenSet((prev) => new Set(prev).add(requested)));
    return () => window.cancelAnimationFrame(frame);
  }, []);

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
  const stagedHeroToolIds = STAGED_HERO_TOOLS_BY_CHAPTER[chapterId] ?? [];
  const stagedNotice = stagedHeroToolIds.length > 0 ? <StagedHeroToolNotice heroToolIds={stagedHeroToolIds} /> : null;
  if (chapterId === 'tools') return <ToolMarketplace />;
  const customChapter = caseModule.chapters?.[chapterId];
  if (customChapter) return <div data-testid={`workbench-${chapterId}-surface`}>{stagedNotice}{customChapter()}</div>;
  if (chapterId === 'desk') return <>{stagedNotice}<DeskTab /></>;
  if (chapterId === 'research') return <>{stagedNotice}<ResearchTab /></>;
  if (chapterId === 'memos') return <>{stagedNotice}<MemoStudio /></>;
  if (chapterId === 'draft') {
    return (
      <ToolGate>
        {stagedNotice}
        <DraftTab />
      </ToolGate>
    );
  }
  if (chapterId === 'ach') return <>{stagedNotice}<ACHIndex caseId={caseId} /></>;
  return (
    <ToolGate>
      {stagedNotice}
      <BoardroomIndex caseId={caseId} />
    </ToolGate>
  );
}
