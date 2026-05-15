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
const PraxisWriter = dynamic(
  () => import('@/components/writer/PraxisWriter').then((module) => ({ default: module.PraxisWriter })),
  { loading: () => <ChapterSkeleton title="Write" />, ssr: false },
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

const VALID_CHAPTER_IDS = new Set<WorkbenchChapterId>(WORKBENCH_CHAPTER_FLOW.map((chapter) => chapter.id));
const STAGED_HERO_TOOLS_BY_CHAPTER: Partial<Record<WorkbenchChapterId, MarketplaceHeroToolId[]>> = {
  desk: ['dashboard', 'situation-intelligence', 'conflict-graph'],
  research: ['source-scout'],
  draft: ['policy-memo', 'briefing', 'treaty-analyzer'],
  boardroom: ['brainstorming-table', 'scenarios', 'negotiation-prep'],
};

export function WorkbenchChapterRenderer({ initialOpenChapter }: { initialOpenChapter?: string | null }) {
  const { caseId } = useWorkbenchScope();
  const [openChapter, setOpenChapter] = useState<WorkbenchChapterId | null>(() => {
    return initialOpenChapter && initialOpenChapter !== 'desk' && VALID_CHAPTER_IDS.has(initialOpenChapter as WorkbenchChapterId)
      ? initialOpenChapter as WorkbenchChapterId
      : null;
  });

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('openChapter') as WorkbenchChapterId | null;
    if (!requested || requested === 'desk' || !VALID_CHAPTER_IDS.has(requested)) return;
    const frame = window.requestAnimationFrame(() => setOpenChapter(requested));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleChapter = useCallback((id: WorkbenchChapterId) => {
    if (id === 'desk') return;
    setOpenChapter((current) => (current === id ? null : id));
  }, []);

  return (
    <div className="space-y-5" data-testid="workspace-chapter-desk">
      <section className="rounded-lg border border-navy-200 bg-white p-4 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-500">Case desk</p>
            <h2 className="mt-1 text-lg font-semibold text-navy-950">Open the one workspace panel you need.</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
              Desk stays visible. Research, Memo, Draft, ACH, Tools, and Boardroom open one at a time so the case page stays readable.
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
                  openChapter === chapter.id
                    ? 'border-navy-800 bg-navy-950 text-white'
                    : 'border-slate-300 bg-white text-slate-800 hover:border-navy-300',
                )}
                aria-pressed={openChapter === chapter.id}
              >
                {chapter.navLabel}
              </button>
            ))}
          </div>
        </div>
      </section>

      {WORKBENCH_CHAPTER_FLOW.map((chapter) => {
        const active = chapter.alwaysOn || openChapter === chapter.id;
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
  if (chapterId === 'tools') return <div data-testid="workbench-tools-surface">{stagedNotice}<ToolMarketplace /></div>;
  const customChapter = caseModule.chapters?.[chapterId];
  if (customChapter) return <div data-testid={`workbench-${chapterId}-surface`}>{stagedNotice}{customChapter()}</div>;
  if (chapterId === 'desk') return <>{stagedNotice}<DeskTab /></>;
  if (chapterId === 'research') return <>{stagedNotice}<ResearchTab /></>;
  if (chapterId === 'memos') {
    return (
      <div data-testid="workbench-memos-surface">
        {stagedNotice}
        <PraxisWriter mode="memo" title="Policy memo" templateId="policy-memo" />
      </div>
    );
  }
  if (chapterId === 'draft') {
    return (
      <div data-testid="workbench-draft-surface">
        <ToolGate>
          {stagedNotice}
          <PraxisWriter mode="draft" title="Working draft" templateId="policy-memo" />
        </ToolGate>
      </div>
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
