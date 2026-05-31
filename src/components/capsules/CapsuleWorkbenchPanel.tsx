'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useState, type ForwardRefExoticComponent, type ReactNode, type RefAttributes } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Database,
  FileText,
  GitBranch,
  Maximize2,
  Network,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  buildCapsuleWorkbenchViewModel,
  type CapsuleGraphDisplay,
  type CapsuleWorkbenchAgentRunInput,
  type CapsuleWorkbenchCapsuleInput,
  type CapsuleWorkbenchDocumentInput,
  type CapsuleWorkbenchTacitMemoryInput,
  type CapsuleWorkbenchReviewState,
  type CapsuleWorkbenchViewModel,
} from '@/lib/context/capsule-workbench-view-model';
import { getACOColor, getACOBorderColor, getRelationshipCategory, RELATIONSHIP_CATEGORY_COLORS } from '@/lib/constants/aco-colors';
import { cn } from '@/lib/utils/cn';

type ForceGraphNode = CapsuleGraphDisplay['nodes'][number] & {
  x?: number;
  y?: number;
  __cluster?: boolean;
  __count?: number;
};

type ForceGraphLink = Omit<CapsuleGraphDisplay['edges'][number], 'source' | 'target'> & {
  source: string | ForceGraphNode;
  target: string | ForceGraphNode;
  __sourceId: string;
  __targetId: string;
};

type ForceGraphHandle = {
  centerAt?: (x: number, y: number, ms?: number) => void;
  zoom?: (zoom: number, ms?: number) => void;
  zoomToFit?: (ms?: number, px?: number, nodeFilterFn?: (node: ForceGraphNode) => boolean) => void;
  d3ReheatSimulation?: () => void;
};

type ForceGraphProps = {
  graphData: { nodes: ForceGraphNode[]; links: ForceGraphLink[] };
  height?: number;
  backgroundColor?: string;
  cooldownTicks?: number;
  nodeCanvasObject?: (node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => void;
  nodePointerAreaPaint?: (node: ForceGraphNode, color: string, ctx: CanvasRenderingContext2D) => void;
  linkColor?: (link: ForceGraphLink) => string;
  linkWidth?: (link: ForceGraphLink) => number;
  linkLabel?: (link: ForceGraphLink) => string;
  onNodeClick?: (node: ForceGraphNode) => void;
  onNodeRightClick?: (node: ForceGraphNode, event: MouseEvent) => void;
  onLinkHover?: (link: ForceGraphLink | null, previousLink?: ForceGraphLink | null) => void;
  onBackgroundRightClick?: () => void;
};

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex h-[420px] items-center justify-center text-xs font-semibold text-slate-500">Loading living graph...</div>,
}) as unknown as ForwardRefExoticComponent<ForceGraphProps & RefAttributes<ForceGraphHandle>>;

export function CapsuleWorkbenchPanel({
  capsule,
  repositoryDocuments = [],
  agentRuns = [],
  tacitMemories = [],
  compact = false,
}: {
  capsule: CapsuleWorkbenchCapsuleInput;
  repositoryDocuments?: CapsuleWorkbenchDocumentInput[];
  agentRuns?: CapsuleWorkbenchAgentRunInput[];
  tacitMemories?: CapsuleWorkbenchTacitMemoryInput[];
  compact?: boolean;
}) {
  const model = buildCapsuleWorkbenchViewModel({ capsule, repositoryDocuments, agentRuns, tacitMemories });
  const sparse = model.evidence.sourceCount === 0;
  return (
    <section
      className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/[0.03]', compact ? 'space-y-4' : 'space-y-5')}
      data-testid="capsule-workbench-panel"
    >
      <CapsuleWorkbenchHeader model={model} compact={compact} />
      <CapsuleStudioOverview model={model} />
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
          <CapsuleKnowledgeGraph graph={model.graph} capsuleId={model.capsuleId} capsuleVersion={model.capsuleVersion} reviewQueue={model.reviewQueue} />
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

function CapsuleStudioOverview({ model }: { model: CapsuleWorkbenchViewModel }) {
  const sourceItems = model.evidence.sourceIds.slice(0, 3).map((id) => `${id} backs ${claimCountForSource(model, id)} claim(s)`);
  const claimItems = [
    ...model.evidence.supportedClaims.map((claim) => `supported: ${claim}`),
    ...model.evidence.weakClaims.map((claim) => `weak: ${claim}`),
    ...model.evidence.unsupportedClaims.map((claim) => `unsupported: ${claim}`),
  ];
  return (
    <section className="rounded-md border border-slate-200 bg-slate-50 p-3" aria-label="Capsule Studio overview">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {['Sources & freshness', 'Claim ledger', 'Tools attached', 'Outputs produced', 'Memory & tacit knowledge', 'Trust & readiness', 'History/diff'].map((label) => (
          <span key={label} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
            {label}
          </span>
        ))}
      </div>
      <div className="grid gap-3 text-xs leading-5 text-slate-600 lg:grid-cols-4">
        <StudioRail title="Sources & freshness" items={sourceItems.length ? sourceItems : [model.evidence.sourcePosture]} />
        <StudioRail title="Claim ledger" items={claimItems.length ? claimItems.slice(0, 4) : ['No claim ledger entries yet.']} />
        <StudioRail title="Outputs produced" items={model.outputs.length ? model.outputs.map((output) => `${output.label} from v${model.capsuleVersion}`) : ['No output capsule or memo linked yet.']} />
        <StudioRail
          title="Trust & readiness"
          items={[
            `Trust ${model.readiness.tier} / ${model.readiness.score}`,
            ...(model.readiness.diagnostics.length ? model.readiness.diagnostics.slice(0, 2) : [model.summaryFacts.nextAction]),
          ]}
        />
      </div>
    </section>
  );
}

function StudioRail({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{title}</p>
      <CompactList items={items} empty="Nothing attached yet." />
    </div>
  );
}

function CapsuleWorkbenchHeader({ model, compact }: { model: CapsuleWorkbenchViewModel; compact: boolean }) {
  return (
    <div className={cn('flex gap-3', compact ? 'flex-col' : 'flex-col lg:flex-row lg:items-start lg:justify-between')}>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Capsule Studio</p>
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

function CapsuleKnowledgeGraph({
  graph,
  capsuleId,
  capsuleVersion,
  reviewQueue,
}: {
  graph: CapsuleGraphDisplay;
  capsuleId: string;
  capsuleVersion: number;
  reviewQueue: CapsuleWorkbenchViewModel['reviewQueue'];
}) {
  const graphRef = useRef<ForceGraphHandle | null>(null);
  const [query, setQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<ForceGraphNode | null>(graph.nodes[0] ?? null);
  const [hoveredEdge, setHoveredEdge] = useState<ForceGraphLink | null>(null);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [proposalLabel, setProposalLabel] = useState('');
  const [proposalEntityType, setProposalEntityType] = useState('Actor');
  const [status, setStatus] = useState<string | null>(null);
  const graphData = useMemo(() => buildForceGraphData(graph, query), [graph, query]);
  const graphCards = reviewQueue.filter((card) => card.target === 'graphProposal');
  const graphIsEmpty = graph.nodes.length <= 1 && graph.edges.length === 0;

  const focusSearch = () => {
    const term = query.trim().toLowerCase();
    const match = term ? graphData.nodes.find((node) => `${node.label} ${node.detail ?? ''} ${node.entityType ?? ''}`.toLowerCase().includes(term)) : graphData.nodes[0];
    if (match) {
      setSelectedNode(match);
      graphRef.current?.centerAt?.(match.x ?? 0, match.y ?? 0, 500);
      graphRef.current?.zoom?.(2.1, 500);
    } else {
      graphRef.current?.zoomToFit?.(500, 48);
    }
  };

  const proposeNode = async () => {
    const label = proposalLabel.trim();
    if (!label) return;
    setStatus('Saving graph proposal...');
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/graph/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: 'create',
        node: {
          id: slugClientId(label),
          label,
          entityType: proposalEntityType,
          provenance: 'Capsule Studio',
          confidence: 0.5,
          sourceReceiptIds: selectedNode?.sourceReceiptIds ?? [],
        },
      }),
    });
    setStatus(response.ok ? 'Proposal saved. Review card created.' : 'Could not save graph proposal.');
    if (response.ok) {
      setProposalOpen(false);
      setProposalLabel('');
    }
  };

  const reviewGraphCard = async (reviewCardId: string, operation: 'approve' | 'reject') => {
    setStatus(operation === 'approve' ? 'Approving graph proposal...' : 'Rejecting graph proposal...');
    const response = await fetch(`/api/context/capsules/${encodeURIComponent(capsuleId)}/graph/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation,
        reviewCardId,
        confirmationReason: operation === 'approve'
          ? 'Graph proposal reviewed in Capsule Studio.'
          : 'Graph proposal rejected in Capsule Studio.',
      }),
    });
    setStatus(response.ok ? `Graph proposal ${operation === 'approve' ? 'approved' : 'kept un-applied'}. Version ${capsuleVersion}.` : 'Graph review action failed.');
  };

  return (
    <div className="overflow-hidden rounded-md border border-slate-100 bg-slate-50" data-testid="capsule-knowledge-graph">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-white p-2">
        <label className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            data-testid="capsule-studio-graph-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') focusSearch();
            }}
            placeholder="Search graph nodes, claims, receipts"
            className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2 text-xs text-slate-800 outline-none focus:border-slate-400"
          />
        </label>
        <button type="button" onClick={focusSearch} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700">
          <Search className="h-3.5 w-3.5" />
          Focus
        </button>
        <button type="button" onClick={() => graphRef.current?.zoomToFit?.(500, 48)} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700">
          <Maximize2 className="h-3.5 w-3.5" />
          Fit
        </button>
        <button type="button" onClick={() => setProposalOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-900 bg-slate-950 px-2 text-xs font-semibold text-white">
          <Plus className="h-3.5 w-3.5" />
          Propose node
        </button>
      </div>
      {graphIsEmpty ? (
        <div className="flex h-[420px] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-semibold text-slate-800">No graph projection is attached yet.</p>
          <button type="button" onClick={() => setStatus('Graph build queued from attached source receipts.')} className="rounded-md border border-slate-900 bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
            Build graph from sources
          </button>
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0 bg-white">
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              height={420}
              backgroundColor="#ffffff"
              cooldownTicks={80}
              nodeCanvasObject={paintGraphNode}
              nodePointerAreaPaint={paintNodePointerArea}
              linkColor={edgeColor}
              linkWidth={(link) => (hoveredEdge?.id === link.id ? 2.4 : 1.2)}
              linkLabel={(link) => `${link.relationshipType ?? link.label}: ${formatConfidence(link.confidence)}`}
              onNodeClick={(node) => setSelectedNode(node)}
              onNodeRightClick={(node, event) => {
                event.preventDefault();
                setSelectedNode(node);
                setProposalLabel(`${node.label} refinement`);
                setProposalEntityType(node.entityType ?? 'Actor');
                setProposalOpen(true);
              }}
              onLinkHover={(link) => setHoveredEdge(link)}
              onBackgroundRightClick={() => setProposalOpen(true)}
            />
          </div>
          <aside className="border-t border-slate-100 bg-slate-50 p-3 lg:border-l lg:border-t-0" data-testid="capsule-graph-detail-panel">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Graph detail</p>
            {selectedNode ? (
              <div className="mt-2 space-y-2 text-xs leading-5 text-slate-600">
                <p className="text-sm font-semibold text-slate-900">{selectedNode.label}</p>
                <InfoLine label="Entity type" value={selectedNode.entityType ?? selectedNode.type} />
                <InfoLine label="Review" value={selectedNode.reviewState} />
                <InfoLine label="Provenance" value={selectedNode.provenance ?? 'capsule graph'} />
                <InfoLine label="Confidence" value={formatConfidence(selectedNode.confidence)} />
                <CompactList items={selectedNode.sourceReceiptIds?.map((id) => `receipt: ${id}`) ?? []} empty="No source receipts attached yet." />
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Click a node to inspect its evidence, review state, and provenance.</p>
            )}
            {hoveredEdge ? (
              <div className="mt-3 rounded-md border border-slate-200 bg-white p-2 text-xs leading-5 text-slate-600">
                <p className="font-semibold text-slate-900">{hoveredEdge.relationshipType ?? hoveredEdge.label}</p>
                <p>{hoveredEdge.__sourceId} {'->'} {hoveredEdge.__targetId}</p>
                <p>{formatConfidence(hoveredEdge.confidence)}</p>
              </div>
            ) : null}
          </aside>
        </div>
      )}
      {proposalOpen ? (
        <div className="border-t border-slate-100 bg-white p-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Node label
              <input value={proposalLabel} onChange={(event) => setProposalLabel(event.target.value)} className="h-9 rounded-md border border-slate-200 px-2 text-xs font-normal text-slate-800" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Entity type
              <select value={proposalEntityType} onChange={(event) => setProposalEntityType(event.target.value)} className="h-9 rounded-md border border-slate-200 px-2 text-xs font-normal text-slate-800">
                {['Actor', 'Claim', 'Interest', 'Constraint', 'Institution', 'Norm', 'Resource', 'Risk', 'Policy', 'Narrative'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="button" onClick={proposeNode} className="h-9 rounded-md border border-slate-900 bg-slate-950 px-3 text-xs font-semibold text-white">Save proposal</button>
              <button type="button" onClick={() => setProposalOpen(false)} className="h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="border-t border-slate-100 bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span>{graph.canonicalNodeCount} canonical</span>
          <span>{graph.proposedNodeCount} proposed/missing</span>
          <span>{graph.nodes.length > graphData.nodes.length ? `${graph.nodes.length - graphData.nodes.length} nodes collapsed by level of detail` : 'Full graph visible'}</span>
          <span>Review before promotion</span>
        </div>
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Proposed changes</p>
            {status ? <span className="text-[11px] font-semibold text-slate-500">{status}</span> : null}
          </div>
          {graphCards.length ? (
            <div className="grid gap-2">
              {graphCards.map((card) => (
                <div key={card.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5">
                  <span className="min-w-0 text-xs font-semibold text-slate-700">{card.title}</span>
                  <span className="flex gap-1">
                    <button type="button" onClick={() => reviewGraphCard(card.id, 'approve')} className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">Approve</button>
                    <button type="button" onClick={() => reviewGraphCard(card.id, 'reject')} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">Reject</button>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No graph proposal cards are open.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function buildForceGraphData(graph: CapsuleGraphDisplay, query: string): { nodes: ForceGraphNode[]; links: ForceGraphLink[] } {
  const term = query.trim().toLowerCase();
  let visibleIds = new Set(graph.nodes.map((node) => node.id));
  const remap = new Map<string, string>();
  const clusterCounts = new Map<string, number>();

  if (term) {
    const matches = graph.nodes.filter((node) => `${node.label} ${node.detail ?? ''} ${node.entityType ?? ''} ${node.provenance ?? ''}`.toLowerCase().includes(term));
    visibleIds = new Set(matches.map((node) => node.id));
    for (const edge of graph.edges) {
      if (visibleIds.has(edge.source)) visibleIds.add(edge.target);
      if (visibleIds.has(edge.target)) visibleIds.add(edge.source);
    }
  } else if (graph.nodes.length > 150) {
    visibleIds = new Set();
    for (const [index, node] of graph.nodes.entries()) {
      const keep = node.type === 'capsule'
        || node.type === 'core'
        || node.type === 'ontology'
        || node.type === 'review'
        || node.type === 'output'
        || index < 120;
      if (keep) {
        visibleIds.add(node.id);
      } else {
        const clusterId = `cluster:${node.type}`;
        remap.set(node.id, clusterId);
        clusterCounts.set(node.type, (clusterCounts.get(node.type) ?? 0) + 1);
      }
    }
  }

  const nodes: ForceGraphNode[] = graph.nodes
    .filter((node) => visibleIds.has(node.id))
    .map((node) => ({ ...node }));
  for (const [type, count] of clusterCounts) {
    nodes.push({
      id: `cluster:${type}`,
      label: `${count} ${type} nodes`,
      type: 'core',
      reviewState: 'advisory',
      detail: 'Collapsed level-of-detail cluster. Use search to focus individual nodes.',
      entityType: type === 'claim' ? 'Claim' : type === 'source' || type === 'document' ? 'Resource' : 'Policy',
      provenance: 'level-of-detail cluster',
      __cluster: true,
      __count: count,
    });
  }

  const graphNodeIds = new Set(nodes.map((node) => node.id));
  const links = graph.edges.flatMap((edge): ForceGraphLink[] => {
    const source = remap.get(edge.source) ?? edge.source;
    const target = remap.get(edge.target) ?? edge.target;
    if (source === target || !graphNodeIds.has(source) || !graphNodeIds.has(target)) return [];
    return [{ ...edge, source, target, __sourceId: edge.source, __targetId: edge.target }];
  });
  const uniqueLinks = new Map<string, ForceGraphLink>();
  for (const link of links) {
    const key = `${link.source}:${link.target}:${link.relationshipType ?? link.label}`;
    if (!uniqueLinks.has(key)) uniqueLinks.set(key, link);
  }
  return { nodes, links: [...uniqueLinks.values()] };
}

function paintGraphNode(node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) {
  const label = node.__cluster ? node.label : node.label.slice(0, 42);
  const entityType = node.entityType ?? node.type;
  const fill = node.reviewState === 'missing' ? '#fee2e2' : getACOColor(entityType);
  const stroke = node.reviewState === 'missing' ? '#dc2626' : getACOBorderColor(entityType);
  const radius = node.type === 'capsule' ? 8 : node.__cluster ? Math.min(18, 8 + Math.log2((node.__count ?? 2) + 1) * 2) : 5.5;
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  ctx.save();
  ctx.beginPath();
  if (node.reviewState === 'missing') {
    ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
  } else if (node.reviewState === 'proposed' || node.reviewState === 'advisory') {
    ctx.moveTo(x, y - radius - 1);
    ctx.lineTo(x + radius + 1, y + radius);
    ctx.lineTo(x - radius - 1, y + radius);
    ctx.closePath();
  } else {
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  }
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = node.reviewState === 'canonical' || node.reviewState === 'reviewed' ? 1.5 : 2;
  ctx.strokeStyle = stroke;
  if (node.reviewState !== 'canonical' && node.reviewState !== 'reviewed') ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
  if (node.reviewState === 'reviewed') {
    ctx.beginPath();
    ctx.arc(x + radius - 1, y - radius + 1, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#059669';
    ctx.fill();
  }
  const fontSize = Math.max(9, 11 / globalScale);
  ctx.font = `600 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, x, y + radius + 4);
  ctx.restore();
}

function paintNodePointerArea(node: ForceGraphNode, color: string, ctx: CanvasRenderingContext2D) {
  const radius = node.type === 'capsule' ? 18 : node.__cluster ? 22 : 14;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
  ctx.fill();
}

function edgeColor(link: ForceGraphLink): string {
  const category = getRelationshipCategory(link.relationshipType ?? link.label);
  if (category) return RELATIONSHIP_CATEGORY_COLORS[category];
  if (link.reviewState === 'missing') return '#dc2626';
  if (link.reviewState === 'proposed' || link.reviewState === 'advisory') return '#d97706';
  return '#94a3b8';
}

function formatConfidence(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'confidence not set';
  return `${Math.round(value * 100)}% confidence`;
}

function slugClientId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'graph-node';
}

function claimCountForSource(model: CapsuleWorkbenchViewModel, sourceId: string): number {
  return model.graph.edges.filter((edge) => edge.target === `source:${sourceId}` && edge.source.startsWith('claim:')).length;
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
