'use client';

import type { ReactNode } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileText,
  GitBranch,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  buildCapsuleWorkbenchViewModel,
  type CapsuleGraphDisplay,
  type CapsuleWorkbenchAgentRunInput,
  type CapsuleWorkbenchCapsuleInput,
  type CapsuleWorkbenchDocumentInput,
  type CapsuleWorkbenchReviewState,
  type CapsuleWorkbenchViewModel,
} from '@/lib/context/capsule-workbench-view-model';
import { cn } from '@/lib/utils/cn';

export function CapsuleWorkbenchPanel({
  capsule,
  repositoryDocuments = [],
  agentRuns = [],
  compact = false,
}: {
  capsule: CapsuleWorkbenchCapsuleInput;
  repositoryDocuments?: CapsuleWorkbenchDocumentInput[];
  agentRuns?: CapsuleWorkbenchAgentRunInput[];
  compact?: boolean;
}) {
  const model = buildCapsuleWorkbenchViewModel({ capsule, repositoryDocuments, agentRuns });
  const sparse = model.evidence.sourceCount === 0;
  return (
    <section
      className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]', compact ? 'space-y-4' : 'space-y-5')}
      data-testid="capsule-workbench-panel"
    >
      <CapsuleWorkbenchHeader model={model} compact={compact} />
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]')}>
        <WorkbenchSection title="Overview" icon={ShieldCheck}>
          <div className="grid gap-2 text-sm leading-6 text-slate-600">
            <InfoLine label="Domain" value={model.summaryFacts.domain ?? 'Policy work'} />
            <InfoLine label="Jurisdiction" value={model.summaryFacts.jurisdiction ?? 'Review before local use'} />
            <InfoLine label="Output goal" value={model.summaryFacts.outputGoal ?? 'No output target set'} />
            <InfoLine label="Next action" value={model.summaryFacts.nextAction} strong />
          </div>
        </WorkbenchSection>
        <WorkbenchSection title="Evidence" icon={Database}>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
            <StatePill state={model.evidence.sourceCount ? 'canonical' : 'missing'} label={model.evidence.sourcePosture || 'No source receipts attached yet.'} />
            <StatePill state={model.evidence.unsupportedClaims.length ? 'proposed' : 'canonical'} label={`${model.evidence.unsupportedClaims.length} unsupported`} />
            <StatePill state={model.evidence.dateChecks.length ? 'proposed' : 'canonical'} label={`${model.evidence.dateChecks.length} date checks`} />
          </div>
          <CompactList
            items={model.evidence.gaps.length ? model.evidence.gaps : sparse ? ['No source receipts attached yet.'] : ['No evidence gap recorded.']}
            empty="No evidence gap recorded."
          />
        </WorkbenchSection>
      </div>
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : '2xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]')}>
        <WorkbenchSection title="Anatomy" icon={BrainCircuit}>
          <div className="grid gap-2 sm:grid-cols-2">
            {model.anatomy.map((core) => (
              <div key={core.kind} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{core.kind}</p>
                  <StateDot state={core.reviewState} />
                </div>
                <p className="mt-1 truncate text-xs font-semibold text-slate-800">{core.status === 'present' ? core.ids.join(', ') : core.label}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{core.description}</p>
              </div>
            ))}
          </div>
        </WorkbenchSection>
        <WorkbenchSection title="Graph / Ontology" icon={Network}>
          <CapsuleKnowledgeGraph graph={model.graph} />
          <div className="mt-3 grid gap-2">
            {[...model.ontology.active, ...model.ontology.proposed, ...model.ontology.missing].slice(0, 4).map((ontology) => (
              <div key={ontology.id} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-800">{ontology.label}</p>
                  <StatePill state={ontology.reviewState} label={ontology.role} />
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
                  {ontology.requiredRelations[0] ?? (ontology.primitiveCoverage.join(', ') || 'Ontology proposal needs review.')}
                </p>
              </div>
            ))}
          </div>
        </WorkbenchSection>
      </div>
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'xl:grid-cols-2')}>
        <WorkbenchSection title="Tacit Knowledge" icon={Sparkles}>
          <div className="mb-2 flex flex-wrap gap-2 text-[11px] font-semibold">
            <StatePill state="canonical" label={`${model.tacitKnowledge.contextReadyCount} context-ready`} />
            <StatePill state="advisory" label={`Advisory memory ${model.tacitKnowledge.advisoryCount}`} />
          </div>
          <CompactList
            items={model.tacitKnowledge.items.length
              ? model.tacitKnowledge.items.map((item) => `${item.type}: ${item.summary}`)
              : ['No tacit knowledge cards yet. Add reviewer caveats, decisions, assumptions, or handover notes.']}
            empty="No tacit knowledge cards yet."
          />
        </WorkbenchSection>
        <WorkbenchSection title="Agent Workflow" icon={GitBranch}>
          <div className="grid gap-2">
            {model.agents.recentRuns.length ? model.agents.recentRuns.map((run) => (
              <div key={run.runId} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-slate-800">{run.label}</p>
                  <span className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">{run.status.replaceAll('_', ' ')}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{run.objective}</p>
              </div>
            )) : <p className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">No agent run receipts yet.</p>}
            <CompactList items={model.agents.nextActions} empty="No agent action suggested." />
          </div>
        </WorkbenchSection>
      </div>
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'xl:grid-cols-2')}>
        <WorkbenchSection title="Outputs" icon={FileText}>
          <CompactList
            items={model.outputs.length ? model.outputs.map((output) => `${output.type}: ${output.label}`) : ['No memo, brief, handover, or output capsule is attached yet.']}
            empty="No outputs attached yet."
          />
        </WorkbenchSection>
        <WorkbenchSection title="Review Queue" icon={AlertTriangle}>
          <div className="mb-2">
            <StatePill state="proposed" label="proposals stay review-gated" />
          </div>
          <CompactList
            items={model.reviewQueue.map((item) => `${item.target}: ${item.title}`)}
            empty="No review cards are open."
          />
        </WorkbenchSection>
      </div>
    </section>
  );
}

function CapsuleWorkbenchHeader({ model, compact }: { model: CapsuleWorkbenchViewModel; compact: boolean }) {
  return (
    <div className={cn('flex gap-3', compact ? 'flex-col' : 'flex-col lg:flex-row lg:items-start lg:justify-between')}>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Capsule Workbench</p>
        <h3 className="mt-1 text-base font-semibold leading-6 text-slate-950">{model.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{model.summary}</p>
      </div>
      <div className="grid min-w-[12rem] grid-cols-3 gap-1.5 text-center">
        <Metric label="Ready" value={`${model.readiness.score}`} tone={model.readiness.tier} />
        <Metric label="Graph" value={`${model.graph.nodes.length}`} />
        <Metric label="Review" value={`${model.reviewQueue.length}`} tone={model.reviewQueue.length ? 'amber' : 'green'} />
      </div>
    </div>
  );
}

function WorkbenchSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof ShieldCheck;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{title}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function CapsuleKnowledgeGraph({ graph }: { graph: CapsuleGraphDisplay }) {
  const nodes = graph.nodes.slice(0, 14);
  const width = 520;
  const height = 260;
  const centerX = width / 2;
  const centerY = height / 2;
  const positions = new Map(nodes.map((node, index) => {
    if (index === 0) return [node.id, { x: centerX, y: centerY }] as const;
    const angle = ((Math.PI * 2) / Math.max(1, nodes.length - 1)) * (index - 1) - Math.PI / 2;
    const radius = index % 2 === 0 ? 95 : 112;
    return [node.id, { x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius }] as const;
  }));
  const visibleEdges = graph.edges.filter((edge) => positions.has(edge.source) && positions.has(edge.target)).slice(0, 18);
  return (
    <div className="overflow-hidden rounded-md border border-slate-100 bg-slate-50" data-testid="capsule-knowledge-graph">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Capsule knowledge graph" className="h-64 w-full">
        {visibleEdges.map((edge) => {
          const source = positions.get(edge.source)!;
          const target = positions.get(edge.target)!;
          return (
            <line
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={edge.reviewState === 'canonical' ? '#94a3b8' : '#f59e0b'}
              strokeDasharray={edge.reviewState === 'canonical' ? undefined : '4 4'}
              strokeWidth="1.5"
            />
          );
        })}
        {nodes.map((node) => {
          const position = positions.get(node.id)!;
          const canonical = node.reviewState === 'canonical' || node.reviewState === 'reviewed';
          return (
            <g key={node.id}>
              <circle
                cx={position.x}
                cy={position.y}
                r={node.type === 'capsule' ? 26 : 18}
                fill={canonical ? '#0f172a' : node.reviewState === 'missing' ? '#fee2e2' : '#fef3c7'}
                stroke={canonical ? '#0f172a' : node.reviewState === 'missing' ? '#ef4444' : '#d97706'}
                strokeWidth="1.5"
              />
              <text
                x={position.x}
                y={position.y + (node.type === 'capsule' ? 42 : 32)}
                textAnchor="middle"
                className="fill-slate-700 text-[10px] font-semibold"
              >
                {node.label.slice(0, 22)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-500">
        <span>{graph.canonicalNodeCount} canonical</span>
        <span>{graph.proposedNodeCount} proposed/missing</span>
        <span>Review before promotion</span>
      </div>
    </div>
  );
}

function CompactList({ items, empty }: { items: string[]; empty: string }) {
  const clean = items.filter(Boolean).slice(0, 5);
  return (
    <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
      {clean.length ? clean.map((item, index) => (
        <li key={`${item}-${index}`} className="rounded-md bg-slate-50 px-2 py-1.5">{item}</li>
      )) : <li className="rounded-md border border-dashed border-slate-200 px-2 py-1.5 text-slate-500">{empty}</li>}
    </ul>
  );
}

function InfoLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <span className={cn('min-w-0', strong ? 'font-semibold text-slate-900' : 'text-slate-600')}>{value}</span>
    </p>
  );
}

function Metric({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'red' | 'amber' | 'green' | 'slate' }) {
  const toneClass = {
    red: 'border-rose-200 bg-rose-50 text-rose-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }[tone];
  return (
    <span className={cn('rounded-md border px-2 py-1.5', toneClass)}>
      <span className="block text-sm font-semibold">{value}</span>
      <span className="block text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</span>
    </span>
  );
}

function StatePill({ state, label }: { state: CapsuleWorkbenchReviewState | string; label: string }) {
  return (
    <span className={cn('rounded-md border px-2 py-1 text-[10px] font-semibold', stateClass(state))}>
      {label}
    </span>
  );
}

function StateDot({ state }: { state: CapsuleWorkbenchReviewState }) {
  if (state === 'canonical' || state === 'reviewed') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (state === 'missing') return <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />;
  return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
}

function stateClass(state: string): string {
  if (state === 'canonical' || state === 'reviewed' || state === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (state === 'missing') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (state === 'advisory') return 'border-sky-200 bg-sky-50 text-sky-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}
