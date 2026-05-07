'use client';

import type { ReactNode } from 'react';
import { Activity, Boxes, GitBranch } from 'lucide-react';
import { PraxisGraphView } from '@/components/graph/PraxisGraphView';
import { OntologySchemaViewer } from '@/components/ontology/OntologySchemaViewer';
import { ContextHealthChip } from '@/components/workbench/context-health-chip';
import { ContextTab } from '@/components/workbench/ContextTab';
import { LibraryTab } from '@/components/workbench/LibraryTab';
import { EmptyStateGuidance } from '@/components/workbench/empty-state/EmptyStateGuidance';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { buildWorkbenchCaseGraph } from '@/lib/graph/workbench-case-graph';
import type { WorkspaceTabId } from '@/types/workbench';

export function WorkbenchTabContent({ activeTab }: { activeTab: WorkspaceTabId }) {
  if (activeTab === 'context') return <ContextTab />;
  if (activeTab === 'library') return <LibraryTab />;
  if (activeTab === 'ontology') return <GuidedSurface tabId="ontology"><OntologySchemaViewer /></GuidedSurface>;
  if (activeTab === 'graph') return <WorkbenchGraphPanel />;
  return <WorkbenchTabPanel tabId={activeTab} />;
}

function WorkbenchGraphPanel() {
  const { caseModule } = useWorkbenchScope();
  return (
    <GuidedSurface tabId="graph">
      <PraxisGraphView graph={buildWorkbenchCaseGraph(caseModule)} />
    </GuidedSurface>
  );
}

function GuidedSurface({ tabId, children }: { tabId: WorkspaceTabId; children: ReactNode }) {
  const { caseModule, situation } = useWorkbenchScope();
  return (
    <div className="space-y-4">
      <EmptyStateGuidance tabId={tabId} caseModule={caseModule} userRole={situation.userRole} />
      {children}
    </div>
  );
}

function WorkbenchTabPanel({ tabId }: { tabId: WorkspaceTabId }) {
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
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">{body}</p>
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
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">{label}</p>
      <p className="mt-1 font-mono text-2xl font-semibold text-navy-950">{value}</p>
    </div>
  );
}

const TAB_TITLES: Record<WorkspaceTabId, string> = {
  context: 'Context Studio',
  library: 'Library',
  ontology: 'Ontology',
  graph: 'Graph',
};

const TAB_BODY: Record<WorkspaceTabId, string> = {
  context: 'Build the case before analysis: scope, sources, documents, actors, claims, and graph proposals.',
  library: 'Keep source receipts, documents, saved claims, and decision products tied to the active case.',
  ontology: 'Inspect the active case ontology, primitive mapping, validators, and tool requirements.',
  graph: 'Inspect graph primitives, truth layers, provenance coverage, and graph projection health.',
};

const TAB_ICONS: Partial<Record<WorkspaceTabId, typeof Activity>> = {
  ontology: Boxes,
  graph: GitBranch,
};
