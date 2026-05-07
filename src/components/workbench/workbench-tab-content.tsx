'use client';

import type { ReactNode } from 'react';
import { Activity, BookOpen, Boxes, FileText, GitBranch, GitBranchPlus, Library, Search, Store, Users } from 'lucide-react';
import { BoardroomIndex } from '@/components/boardroom/BoardroomWorkspace';
import { PraxisGraphCanvas } from '@/components/graph/PraxisGraphCanvas';
import { MemoStudio } from '@/components/memo/MemoStudio';
import { OntologySchemaViewer } from '@/components/ontology/OntologySchemaViewer';
import { ACHIndex } from '@/components/sats/ACHWorkbench';
import { ToolMarketplace } from '@/components/tools/ToolMarketplace';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { ContextTab } from '@/components/workbench/ContextTab';
import { DeskTab } from '@/components/workbench/DeskTab';
import { LibraryTab } from '@/components/workbench/LibraryTab';
import { ResearchTab } from '@/components/workbench/ResearchTab';
import { DraftTab } from '@/components/workbench/draft/DraftTab';
import { EmptyStateGuidance } from '@/components/workbench/empty-state/EmptyStateGuidance';
import { ToolGate } from '@/components/workbench/tool-gate';
import { WorkbenchChapterRenderer } from '@/components/workbench/chapter-renderer';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { buildWorkbenchCaseGraph } from '@/lib/graph/workbench-case-graph';
import type { WorkbenchTabId } from '@/types/workbench';

export function WorkbenchTabContent({ activeTab }: { activeTab: WorkbenchTabId }) {
  if (activeTab === 'chapters') return <WorkbenchChapterRenderer />;
  if (activeTab === 'desk') return <DeskTab />;
  if (activeTab === 'context') return <ContextTab />;
  if (activeTab === 'library') return <LibraryTab />;
  if (activeTab === 'research') return <ResearchTab />;
  if (activeTab === 'ontology') return <GuidedSurface tabId="ontology"><OntologySchemaViewer /></GuidedSurface>;
  if (activeTab === 'graph') return <WorkbenchGraphPanel />;
  if (activeTab === 'ach') return <WorkbenchACHPanel />;
  if (activeTab === 'tools') return <GuidedSurface tabId="tools"><ToolMarketplace /></GuidedSurface>;
  if (activeTab === 'memos') return <GuidedSurface tabId="memos"><MemoStudio /></GuidedSurface>;
  if (activeTab === 'boardroom') {
    return (
      <ToolGate>
        <GuidedSurface tabId="boardroom">
          <WorkbenchBoardroomPanel />
        </GuidedSurface>
      </ToolGate>
    );
  }
  if (activeTab === 'draft') {
    return (
      <ToolGate>
        <DraftTab />
      </ToolGate>
    );
  }
  return <WorkbenchTabPanel tabId={activeTab} />;
}

function WorkbenchACHPanel() {
  const { caseId } = useWorkbenchScope();
  return (
    <GuidedSurface tabId="ach">
      <ACHIndex caseId={caseId} />
    </GuidedSurface>
  );
}

function WorkbenchBoardroomPanel() {
  const { caseId } = useWorkbenchScope();
  return <BoardroomIndex caseId={caseId} />;
}

function WorkbenchGraphPanel() {
  const { caseModule } = useWorkbenchScope();
  return (
    <GuidedSurface tabId="graph">
      <PraxisGraphCanvas graph={buildWorkbenchCaseGraph(caseModule)} />
    </GuidedSurface>
  );
}

function GuidedSurface({ tabId, children }: { tabId: WorkbenchTabId; children: ReactNode }) {
  const { caseModule, situation } = useWorkbenchScope();
  return (
    <div className="space-y-4">
      <EmptyStateGuidance tabId={tabId} caseModule={caseModule} userRole={situation.userRole} />
      {children}
    </div>
  );
}

function WorkbenchTabPanel({ tabId }: { tabId: WorkbenchTabId }) {
  const { situation, caseModule } = useWorkbenchScope();
  const Icon = TAB_ICONS[tabId] ?? Activity;
  const title = TAB_TITLES[tabId];
  const body = TAB_BODY[tabId];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-navy-900">
            <Icon className="h-5 w-5 text-gold-600" />
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">{body}</p>
        </div>
        <ContextHealthChip />
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="Risk" value={String(Math.round(situation.riskScore * 10))} />
        <Metric label="Glasl" value={String(situation.glaslStage ?? '-')} />
        <Metric label="Sources" value={String(caseModule.sources.length)} />
        <Metric label="Graph nodes" value={String(situation.graphEntities ?? 0)} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold text-navy-950">{value}</p>
    </div>
  );
}

const TAB_TITLES: Record<WorkbenchTabId, string> = {
  chapters: 'Chapters',
  desk: 'Desk',
  context: 'Context Studio',
  library: 'Library',
  research: 'Research',
  ontology: 'Ontology',
  graph: 'Graph',
  ach: 'ACH',
  tools: 'Tools',
  memos: 'Memos',
  boardroom: 'Boardroom',
  draft: 'Draft',
};

const TAB_BODY: Record<WorkbenchTabId, string> = {
  chapters: 'The default case flow.',
  desk: 'A compact overview of case health, risk, source coverage, activity, and next best actions.',
  context: 'Build the case before analysis: scope, sources, documents, actors, claims, and graph proposals.',
  library: 'Keep source receipts, documents, saved claims, and decision products tied to the active case.',
  research: 'Run source discovery and research collection against the active case context.',
  ontology: 'Inspect the active case ontology, primitive mapping, validators, and tool requirements.',
  graph: 'Inspect graph primitives, truth layers, provenance coverage, and graph projection health.',
  ach: 'Open and maintain Analysis of Competing Hypotheses matrices for competing explanations.',
  tools: 'Browse the curated ontology-aware tool marketplace for the active case.',
  memos: 'Create cited memos, talking points, sit-reps, and policy notes from the active case graph.',
  boardroom: 'Use advisor deliberation on top of the locked context.',
  draft: 'Create decision-ready products with paragraph-level provenance.',
};

const TAB_ICONS: Partial<Record<WorkbenchTabId, typeof Activity>> = {
  desk: Activity,
  context: BookOpen,
  library: Library,
  research: Search,
  ontology: Boxes,
  graph: GitBranch,
  ach: GitBranchPlus,
  tools: Store,
  memos: FileText,
  boardroom: Users,
  draft: FileText,
};
