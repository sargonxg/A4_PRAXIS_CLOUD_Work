'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ForwardRefExoticComponent, type ReactNode, type RefAttributes } from 'react';
import { Maximize2, Plus, Search } from 'lucide-react';
import {
  getACOBorderColor,
  getACOColor,
  getRelationshipCategory,
  RELATIONSHIP_CATEGORIES,
  RELATIONSHIP_CATEGORY_COLORS,
  type RelationshipCategory,
} from '@/lib/constants/aco-colors';
import { cn } from '@/lib/utils/cn';
import { formatConfidence } from '@/components/capsules/workbench/CapsuleWorkbenchSections';
import type { CapsuleClaimDisplay } from '@/lib/context/capsule-workbench-view-model';
import {
  CapsuleGraphWhyPanel,
  type CapsuleGraphWhyPanelContradiction,
  type CapsuleGraphWhyPanelSelection,
} from '@/components/capsules/viewers/CapsuleGraphWhyPanel';

type CapsuleGraphConfidenceKind = 'EXTRACTED' | 'INFERRED' | 'AMBIGUOUS' | 'ASSESSED';
type CapsuleGraphInvalidationReason = 'CONTRADICTED' | 'SOURCE_RETRACTED' | 'TEMPORAL_EXPIRY' | 'HUMAN_OVERRIDE';
type CapsuleGraphGeneratedBy = {
  actorType: 'model' | 'human';
  actorId: string;
  at: string;
  activity: 'extraction' | 'proposal' | 'review_decision' | 'import' | 'quality_review';
};

type CapsuleGraphViewerStats = {
  totalNodes: number;
  totalEdges: number;
  sourceBackedClaims: number;
  unsupportedClaims: number;
  boundaryNodes: number;
  reviewGatedNodes: number;
  temporalNodes: number;
  provenanceCoveragePct: number;
  densityLabel: string;
};

type TemporalGraphElement = {
  validFrom?: string;
  validUntil?: string;
  asOf?: string;
  recordedAt?: string;
  invalidatedAt?: string;
  supersededBy?: string;
  invalidationReason?: string;
  generatedBy?: Pick<CapsuleGraphGeneratedBy, 'at'>;
};

export type CapsuleGraphViewerNode = {
  id: string;
  label: string;
  type: string;
  reviewState: string;
  detail?: string;
  entityType?: string;
  provenance?: string;
  confidence?: number | null;
  confidenceKind?: CapsuleGraphConfidenceKind;
  sourceReceiptIds?: string[];
  linkedClaimIds?: string[];
  version?: number | null;
  validFrom?: string;
  validUntil?: string;
  asOf?: string;
  recordedAt?: string;
  invalidatedAt?: string;
  supersededBy?: string;
  invalidationReason?: CapsuleGraphInvalidationReason;
  rationale?: string;
  derivedFrom?: string[];
  generatedBy?: CapsuleGraphGeneratedBy;
};

export type CapsuleGraphViewerEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  reviewState: string;
  relationshipType?: string;
  provenance?: string;
  judgeRationale?: string;
  confidence?: number | null;
  confidenceKind?: CapsuleGraphConfidenceKind;
  sourceReceiptIds?: string[];
  validFrom?: string;
  validUntil?: string;
  asOf?: string;
  recordedAt?: string;
  invalidatedAt?: string;
  supersededBy?: string;
  invalidationReason?: CapsuleGraphInvalidationReason;
  rationale?: string;
  derivedFrom?: string[];
  generatedBy?: CapsuleGraphGeneratedBy;
};

export type CapsuleGraphProposalIntent = 'open' | 'refine' | 'background';

export type CapsuleGraphViewerProps = {
  nodes: CapsuleGraphViewerNode[];
  edges: CapsuleGraphViewerEdge[];
  onSelect?: (node: CapsuleGraphViewerNode | null) => void;
  onOpenClaim?: (claimId: string) => void;
  editable?: boolean;
  height?: number;
  compact?: boolean;
  canonicalNodeCount?: number;
  proposedNodeCount?: number;
  graphStats?: CapsuleGraphViewerStats;
  onProposalIntent?: (node: CapsuleGraphViewerNode | null, intent: CapsuleGraphProposalIntent) => void;
  onBuildFromSources?: () => void;
  proposalForm?: ReactNode;
  reviewCards?: ReactNode;
  claims?: CapsuleClaimDisplay[];
};

type ForceGraphNode = CapsuleGraphViewerNode & {
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  __labelPriority?: boolean;
  __cluster?: boolean;
  __count?: number;
  __opacity?: number;
  __invalidated?: boolean;
  __visibleInvalidated?: boolean;
  __selected?: boolean;
};

type ForceGraphLink = Omit<CapsuleGraphViewerEdge, 'source' | 'target'> & {
  source: string | ForceGraphNode;
  target: string | ForceGraphNode;
  __sourceId: string;
  __targetId: string;
  __opacity?: number;
  __invalidated?: boolean;
  __visibleInvalidated?: boolean;
  __selected?: boolean;
  __category?: RelationshipCategory | null;
};

type GraphSelection =
  | { kind: 'node'; item: ForceGraphNode }
  | { kind: 'edge'; item: ForceGraphLink }
  | null;

type TemporalMode = 'event' | 'transaction';

type ForceGraphHandle = {
  centerAt?: (x: number, y: number, ms?: number) => void;
  zoom?: (zoom: number, ms?: number) => void;
  zoomToFit?: (ms?: number, px?: number, nodeFilterFn?: (node: ForceGraphNode) => boolean) => void;
  d3ReheatSimulation?: () => void;
};

type ForceGraphProps = {
  graphData: { nodes: ForceGraphNode[]; links: ForceGraphLink[] };
  height?: number;
  width?: number;
  backgroundColor?: string;
  cooldownTicks?: number;
  nodeCanvasObject?: (node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => void;
  nodePointerAreaPaint?: (node: ForceGraphNode, color: string, ctx: CanvasRenderingContext2D) => void;
  linkCanvasObject?: (link: ForceGraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => void;
  linkCanvasObjectMode?: (link: ForceGraphLink) => 'replace' | 'before' | 'after';
  linkColor?: (link: ForceGraphLink) => string;
  linkWidth?: (link: ForceGraphLink) => number;
  linkLabel?: (link: ForceGraphLink) => string;
  onNodeClick?: (node: ForceGraphNode) => void;
  onNodeHover?: (node: ForceGraphNode | null) => void;
  nodeLabel?: (node: ForceGraphNode) => string;
  onEngineStop?: () => void;
  onNodeRightClick?: (node: ForceGraphNode, event: MouseEvent) => void;
  onLinkClick?: (link: ForceGraphLink) => void;
  onLinkHover?: (link: ForceGraphLink | null, previousLink?: ForceGraphLink | null) => void;
  onBackgroundRightClick?: () => void;
};

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <div className="flex h-[420px] items-center justify-center text-xs font-semibold text-slate-500">Loading living graph...</div>,
}) as unknown as ForwardRefExoticComponent<ForceGraphProps & RefAttributes<ForceGraphHandle>>;

const DIMMED_ELEMENT_STYLE = { opacity: 0.12 };
const DIMMED_OPACITY = DIMMED_ELEMENT_STYLE.opacity;
const INVALIDATED_VISIBLE_OPACITY = 0.35;
const INVALIDATED_HIDDEN_OPACITY = 0.04;
const DAY_MS = 24 * 60 * 60 * 1000;

const RELATIONSHIP_LENS_OPTIONS: Array<{ category: RelationshipCategory; label: string }> = (
  Object.keys(RELATIONSHIP_CATEGORIES) as RelationshipCategory[]
).map((category) => ({ category, label: categoryLabel(category) ?? category }));

function CapsuleGraphViewerComponent({
  nodes,
  edges,
  onSelect,
  onOpenClaim,
  editable = true,
  height = 420,
  canonicalNodeCount = 0,
  proposedNodeCount = 0,
  graphStats,
  onProposalIntent,
  onBuildFromSources,
  proposalForm = null,
  reviewCards = null,
  claims = [],
  compact = false,
}: CapsuleGraphViewerProps) {
  const graphRef = useRef<ForceGraphHandle | null>(null);
  const [query, setQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<GraphSelection>(() => (
    nodes[0] ? { kind: 'node', item: nodes[0] as ForceGraphNode } : null
  ));
  const [hoveredEdge, setHoveredEdge] = useState<ForceGraphLink | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<RelationshipCategory>>(() => new Set());
  const [showInvalidated, setShowInvalidated] = useState(false);
  const [temporalMode, setTemporalMode] = useState<TemporalMode>('transaction');
  const [scrubberValue, setScrubberValue] = useState<number | null>(null);
  const [referenceTimeMs] = useState(() => Date.now());
  const [listKind, setListKind] = useState<'nodes' | 'edges'>('nodes');
  const [listLimit, setListLimit] = useState(50);
  const graphContainer = useRef<HTMLDivElement>(null);
  const [graphWidth, setGraphWidth] = useState(600);
  const measuredWidth = useRef<number | null>(null);
  const engineInitialized = useRef(false);
  const initialFitDone = useRef(false);
  const fitInitialGraph = useCallback(() => {
    if (initialFitDone.current || !engineInitialized.current || measuredWidth.current !== graphWidth || !graphRef.current?.zoomToFit) return;
    initialFitDone.current = true;
    graphRef.current.zoomToFit(0, 52);
  }, [graphWidth]);
  const graphIsEmpty = nodes.length <= 1 && edges.length === 0;
  useEffect(() => {
    if (!graphContainer.current || typeof ResizeObserver === 'undefined') return;
    let fitFrame: number | null = null;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry || entry.contentRect.width <= 0) return;
      const width = Math.round(entry.contentRect.width);
      measuredWidth.current = width;
      if (width !== graphWidth) engineInitialized.current = false;
      setGraphWidth(width);
      // Covers measurement arriving after the engine already stopped at the same width.
      if (engineInitialized.current) fitFrame = requestAnimationFrame(fitInitialGraph);
    });
    observer.observe(graphContainer.current);
    return () => { observer.disconnect(); if (fitFrame !== null) cancelAnimationFrame(fitFrame); };
  }, [graphIsEmpty, graphWidth, fitInitialGraph]);

  const graphData = useMemo(() => buildForceGraphData({ nodes, edges }, query, selectedElement, graphWidth, height), [nodes, edges, query, selectedElement, graphWidth, height]);
  const temporalBounds = useMemo(() => buildTemporalBounds(nodes, edges, referenceTimeMs), [edges, nodes, referenceTimeMs]);
  const nowPosition = positionForTime(referenceTimeMs, temporalBounds);
  const scrubberPosition = scrubberValue ?? nowPosition;
  const selectedTimeMs = timeForPosition(scrubberPosition, temporalBounds);
  // Resolve against the current version rather than displaying a stale selected snapshot.
  const currentSelection: GraphSelection = useMemo(() => selectedElement?.kind === 'node'
    ? (() => { const node = nodes.find((item) => item.id === selectedElement.item.id) ?? graphData.nodes.find((item) => item.id === selectedElement.item.id); return node ? { kind: 'node', item: { ...selectedElement.item, ...node } } : null; })()
    : selectedElement?.kind === 'edge'
      ? (() => { const edge = edges.find((item) => item.id === selectedElement.item.id); return edge ? { kind: 'edge', item: { ...edge, __sourceId: edge.source, __targetId: edge.target } } : null; })()
      : null, [selectedElement, nodes, edges, graphData.nodes]);
  const selectedNode = currentSelection?.kind === 'node' ? currentSelection.item : null;
  const nodeLabelById = useMemo(() => buildNodeLabelMap(nodes, graphData.nodes), [nodes, graphData.nodes]);

  const styledGraphData = useMemo(() => applyGraphStyling({
    graphData,
    activeCategories,
    temporalMode,
    selectedTimeMs,
    showInvalidated,
    selectedElement: currentSelection,
  }), [activeCategories, graphData, currentSelection, selectedTimeMs, showInvalidated, temporalMode]);

  const panelSelection = useMemo(
    () => panelSelectionFrom(currentSelection, nodeLabelById),
    [nodeLabelById, currentSelection],
  );
  const contradictions = useMemo(
    () => contradictionsForSelection(currentSelection, graphData.links, nodeLabelById),
    [graphData.links, nodeLabelById, currentSelection],
  );
  const selectedReceipts = claims.filter((claim) => {
    const ids = currentSelection?.item.derivedFrom ?? [];
    return ids.includes(claim.claimId) || (currentSelection?.kind === 'node' && (currentSelection.item.linkedClaimIds?.includes(claim.claimId) || currentSelection.item.id === claim.claimId || currentSelection.item.id === `claim:${claim.claimId}`));
  }).flatMap((claim) => claim.receipts);
  const explicitReceiptIds = new Set(currentSelection?.item.sourceReceiptIds ?? []);
  if (currentSelection?.kind === 'node' && (currentSelection.item.type === 'source' || currentSelection.item.type === 'document')) explicitReceiptIds.add(currentSelection.item.id.replace(/^(source|document):/, ''));
  const receipts = [...selectedReceipts, ...claims.flatMap((claim) => claim.receipts).filter((receipt) => explicitReceiptIds.has(receipt.sourceId))]
    .filter((receipt, index, all) => all.findIndex((other) => other.sourceId === receipt.sourceId && other.snippet === receipt.snippet && other.page === receipt.page && other.charOffset === receipt.charOffset) === index);
  const listQuery = query.trim().toLowerCase();
  const listNodes = nodes.filter((node) => `${node.label} ${node.detail ?? ''} ${node.id}`.toLowerCase().includes(listQuery));
  const listEdges = edges.filter((edge) => `${edge.label} ${edge.relationshipType ?? ''} ${nodeLabelById.get(edge.source) ?? edge.source} ${nodeLabelById.get(edge.target) ?? edge.target}`.toLowerCase().includes(listQuery));
  const listItems = listKind === 'nodes' ? listNodes : listEdges;

  const focusSearch = useCallback(() => {
    const term = query.trim().toLowerCase();
    const match = term ? graphData.nodes.find((node) => `${node.label} ${node.detail ?? ''} ${node.entityType ?? ''}`.toLowerCase().includes(term)) : graphData.nodes[0];
    if (match) {
      setSelectedElement({ kind: 'node', item: match });
      onSelect?.(match);
      graphRef.current?.centerAt?.(match.x ?? 0, match.y ?? 0, graphAnimationDuration());
      graphRef.current?.zoom?.(2.1, graphAnimationDuration());
    } else {
      graphRef.current?.zoomToFit?.(graphAnimationDuration(), 48);
    }
  }, [graphData.nodes, onSelect, query, setSelectedElement]);

  const selectElementById = useCallback((elementId: string) => {
    const node: ForceGraphNode | undefined = graphData.nodes.find((candidate) => candidate.id === elementId) ?? nodes.find((candidate) => candidate.id === elementId);
    if (node) {
      setSelectedElement({ kind: 'node', item: node });
      onSelect?.(node);
      graphRef.current?.centerAt?.(node.x ?? 0, node.y ?? 0, graphAnimationDuration());
      graphRef.current?.zoom?.(2.1, graphAnimationDuration());
      return;
    }
    const edge = edges.find((candidate) => candidate.id === elementId);
    const link = graphData.links.find((candidate) => candidate.id === elementId) ?? (edge ? { ...edge, __sourceId: edge.source, __targetId: edge.target } : null);
    if (link) {
      setSelectedElement({ kind: 'edge', item: link });
      onSelect?.(null);
    }
  }, [edges, graphData.links, graphData.nodes, nodes, onSelect, setSelectedElement]);

  const toggleCategory = useCallback((category: RelationshipCategory) => {
    setActiveCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, [setActiveCategories]);

  return (
    <>
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
            aria-label="Search the evidence map"
            className="min-h-11 w-full rounded-md border border-slate-200 bg-white pl-8 pr-2 text-sm text-slate-800 outline-none focus:border-[color:var(--color-praxis-emerald-700)]"
          />
        </label>
        <button type="button" onClick={focusSearch} className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
          <Search className="h-3.5 w-3.5" />
          Focus
        </button>
        <button type="button" onClick={() => graphRef.current?.zoomToFit?.(graphAnimationDuration(), 48)} className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
          <Maximize2 className="h-3.5 w-3.5" />
          Fit
        </button>
        {editable ? (
          <button type="button" onClick={() => onProposalIntent?.(selectedNode, 'open')} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-900 bg-slate-950 px-2 text-xs font-semibold text-white">
            <Plus className="h-3.5 w-3.5" />
            Propose node
          </button>
        ) : null}
      </div>

      {!compact ? <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-2 py-2" data-testid="capsule-graph-lens-bar">
        <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">ACO lenses</span>
        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">Context / boundary</span>
        {RELATIONSHIP_LENS_OPTIONS.map(({ category, label }) => {
          const active = activeCategories.has(category);
          return (
            <button
              key={category}
              type="button"
              data-testid={`capsule-graph-lens-${category}`}
              aria-pressed={active}
              onClick={() => toggleCategory(category)}
              className={cn(
                'rounded-md border px-2 py-1 text-[11px] font-semibold',
                active ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
              )}
            >
              {label}
            </button>
          );
        })}
        <button
          type="button"
          data-testid="capsule-graph-invalidated-toggle"
          aria-pressed={showInvalidated}
          onClick={() => setShowInvalidated((value) => !value)}
          className={cn(
            'rounded-md border px-2 py-1 text-[11px] font-semibold',
            showInvalidated ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
          )}
        >
          Invalidated
        </button>
      </div> : null}

      {graphStats && !compact ? (
        <div className="grid grid-cols-2 gap-px border-b border-slate-100 bg-slate-100 text-xs sm:grid-cols-4 lg:grid-cols-8" data-testid="capsule-graph-stats">
          {graphStatItems(graphStats).map((item) => (
            <div key={item.label} className="min-w-0 bg-white px-2.5 py-2">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{item.label}</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {graphIsEmpty ? (
        <div className="flex h-[420px] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-semibold text-slate-800">No graph projection is attached yet.</p>
          {onBuildFromSources ? <button type="button" onClick={onBuildFromSources} className="rounded-md border border-slate-900 bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
            Build graph from sources
          </button> : <p className="text-sm leading-6 text-slate-600">Add source material and review its proposals to build the evidence map.</p>}
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div ref={graphContainer} className="min-w-0 overflow-hidden bg-[#f6f9f7]" aria-label="Interactive projection of recorded context">
            <ForceGraph2D
              ref={graphRef}
              graphData={styledGraphData}
              height={height}
              width={graphWidth}
              backgroundColor="#f6f9f7"
              cooldownTicks={1}
              nodeCanvasObject={(node, ctx, scale) => paintGraphNode(node, ctx, scale, node.id === hoveredNodeId)}
              nodeLabel={(node) => node.label}
              onEngineStop={() => { engineInitialized.current = true; fitInitialGraph(); }}
              nodePointerAreaPaint={paintNodePointerArea}
              linkCanvasObject={paintGraphLink}
              linkCanvasObjectMode={() => 'replace'}
              linkColor={edgeColor}
              linkWidth={(link) => (hoveredEdge?.id === link.id ? 2.4 : Math.max(0.35, 1.2 * (link.__opacity ?? 1)))}
              linkLabel={(link) => `${link.relationshipType ?? link.label}: ${formatConfidence(link.confidence)}`}
              onNodeClick={(node) => {
                setSelectedElement({ kind: 'node', item: node });
                onSelect?.(node);
              }}
              onNodeHover={(node) => setHoveredNodeId(node?.id ?? null)}
              onNodeRightClick={(node, event) => {
                event.preventDefault();
                setSelectedElement({ kind: 'node', item: node });
                onSelect?.(node);
                onProposalIntent?.(node, 'refine');
              }}
              onLinkClick={(link) => {
                setSelectedElement({ kind: 'edge', item: link });
                onSelect?.(null);
              }}
              onLinkHover={(link) => setHoveredEdge(link)}
              onBackgroundRightClick={() => onProposalIntent?.(selectedNode, 'background')}
            />
          </div>
          <aside data-testid="capsule-graph-detail-panel">
            <CapsuleGraphWhyPanel
              selection={panelSelection}
              contradictions={contradictions}
              onOpenClaim={onOpenClaim}
              onSelectElement={selectElementById}
              receipts={receipts}
            />
          </aside>
        </div>
      )}

      <section className="border-t border-slate-200 bg-white p-3" aria-label="Evidence map list" data-testid="capsule-graph-keyboard-list">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">Explore the map</h3>
          <div className="flex gap-1" aria-label="Map items">
            {(['nodes', 'edges'] as const).map((kind) => <button key={kind} type="button" aria-pressed={listKind === kind} onClick={() => { setListKind(kind); setListLimit(50); }} className={cn('min-h-11 rounded-md border px-3 text-sm font-semibold', listKind === kind ? 'border-[color:var(--color-praxis-emerald-700)] bg-[color:var(--color-praxis-emerald-50)] text-[color:var(--color-praxis-emerald-700)]' : 'border-slate-200 text-slate-700')}>{kind === 'nodes' ? `Items (${listNodes.length})` : `Relationships (${listEdges.length})`}</button>)}
          </div>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-600">The list and map open the same evidence. Use Tab and Enter to inspect any item or relationship.</p>
        <div className="mt-3 grid max-h-72 gap-1 overflow-y-auto sm:grid-cols-2">
          {listItems.slice(0, listLimit).map((item) => <button key={item.id} type="button" aria-pressed={currentSelection?.item.id === item.id} onClick={() => selectElementById(item.id)} className={cn('min-h-11 min-w-0 rounded-md border px-3 py-2 text-left text-sm', currentSelection?.item.id === item.id ? 'border-[color:var(--color-praxis-emerald-500)] bg-[color:var(--color-praxis-emerald-50)]' : 'border-slate-200 hover:bg-slate-50')}>
            <span className="block break-words font-semibold text-slate-900">{'source' in item ? `${nodeLabelById.get(item.source) ?? item.source} → ${item.label} → ${nodeLabelById.get(item.target) ?? item.target}` : item.label}</span>
            <span className="mt-1 block text-xs text-slate-600">{'type' in item ? item.type : 'relationship'} · {item.reviewState} · {formatConfidence(item.confidence)}</span>
          </button>)}
        </div>
        {!listItems.length ? <p className="mt-3 text-sm text-slate-600">No matching {listKind === 'nodes' ? 'items' : 'relationships'}.</p> : null}
        {listItems.length > listLimit ? <button type="button" onClick={() => setListLimit((limit) => limit + 50)} className="mt-3 min-h-11 px-3 text-sm font-semibold text-[color:var(--color-praxis-emerald-700)] underline">Show more {listKind === 'nodes' ? 'items' : 'relationships'}</button> : null}
      </section>

      {!compact ? <div className="border-t border-slate-100 bg-white px-3 py-2" data-testid="capsule-graph-temporal-scrubber">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Bi-temporal</span>
          <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setTemporalMode('event')}
              className={cn('rounded px-2 py-1 text-[11px] font-semibold', temporalMode === 'event' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500')}
            >
              As it was
            </button>
            <button
              type="button"
              onClick={() => setTemporalMode('transaction')}
              className={cn('rounded px-2 py-1 text-[11px] font-semibold', temporalMode === 'transaction' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500')}
            >
              As we knew it
            </button>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(scrubberPosition)}
            onChange={(event) => setScrubberValue(Number(event.target.value))}
            aria-label="Capsule graph bi-temporal position"
            className="h-2 min-w-[12rem] flex-1 accent-emerald-700"
          />
          <span className="font-mono text-[10px] font-semibold text-slate-500">{new Date(selectedTimeMs).toISOString().slice(0, 10)}</span>
        </div>
      </div> : null}

      {proposalForm}
      <div className="border-t border-slate-100 bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span>{canonicalNodeCount} canonical</span>
          <span>{proposedNodeCount} proposed/missing</span>
          {graphStats ? <span>{graphStats.boundaryNodes} Boundary</span> : null}
          {graphStats ? <span>{graphStats.provenanceCoveragePct}% provenance</span> : null}
          <span>{nodes.length > graphData.nodes.length ? `${nodes.length - graphData.nodes.length} items grouped in the map; all are available in the list` : 'All recorded items visible'}</span>
          <span>Recorded context projection</span>
          <span>Review before promotion</span>
        </div>
        {reviewCards}
      </div>
    </>
  );
}

export const CapsuleGraphViewer = memo(CapsuleGraphViewerComponent);
export default CapsuleGraphViewerComponent;

function graphStatItems(stats: CapsuleGraphViewerStats): Array<{ label: string; value: string }> {
  return [
    { label: 'Density', value: stats.densityLabel },
    { label: 'Nodes', value: String(stats.totalNodes) },
    { label: 'Edges', value: String(stats.totalEdges) },
    { label: 'Sourced', value: String(stats.sourceBackedClaims) },
    { label: 'Unsupported', value: String(stats.unsupportedClaims) },
    { label: 'Boundary', value: String(stats.boundaryNodes) },
    { label: 'Review gated', value: String(stats.reviewGatedNodes) },
    { label: 'Provenance', value: `${stats.provenanceCoveragePct}%` },
  ];
}

function graphAnimationDuration(): number {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 450;
}

function buildForceGraphData(graph: { nodes: CapsuleGraphViewerNode[]; edges: CapsuleGraphViewerEdge[] }, query: string, selection: GraphSelection, width: number, height: number): { nodes: ForceGraphNode[]; links: ForceGraphLink[] } {
  const term = query.trim().toLowerCase();
  const pinnedIds = new Set(selection?.kind === 'node' ? [selection.item.id] : selection?.kind === 'edge' ? [selection.item.__sourceId, selection.item.__targetId] : []);
  let visibleIds = new Set(graph.nodes.map((node) => node.id));
  const remap = new Map<string, string>();
  const clusterCounts = new Map<string, number>();

  if (term) {
    const matches = graph.nodes.filter((node) => `${node.label} ${node.detail ?? ''} ${node.entityType ?? ''} ${node.provenance ?? ''}`.toLowerCase().includes(term));
    visibleIds = new Set([...matches.map((node) => node.id), ...pinnedIds]);
    for (const edge of graph.edges) {
      if (visibleIds.has(edge.source)) visibleIds.add(edge.target);
      if (visibleIds.has(edge.target)) visibleIds.add(edge.source);
    }
  } else if (graph.nodes.length > 150) {
    visibleIds = new Set();
    for (const [index, node] of graph.nodes.entries()) {
      const keep = pinnedIds.has(node.id) || node.type === 'capsule'
        || node.type === 'core'
        || node.type === 'ontology'
        || node.type === 'review'
        || node.type === 'boundary'
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
    const key = selection?.kind === 'edge' && selection.item.id === link.id ? `selected:${link.id}` : `${String(link.source)}:${String(link.target)}:${link.relationshipType ?? link.label}`;
    if (!uniqueLinks.has(key)) uniqueLinks.set(key, link);
  }
  return { nodes: placeGraphNodes(nodes, width, height), links: [...uniqueLinks.values()] };
}

/** Recorded types determine visual grouping; stable positions are ready before simulation. */
function placeGraphNodes(nodes: ForceGraphNode[], width: number, height: number): ForceGraphNode[] {
  if (!nodes.length) return nodes;
  const center = nodes.find((node) => node.type === 'capsule') ?? nodes[0];
  const sorted = nodes.filter((node) => node.id !== center.id).sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
  const primary = sorted.filter((node) => node.type === 'core' || node.__cluster);
  const supporting = sorted.filter((node) => node.type !== 'core' && !node.__cluster);
  const tracks: Array<{ members: ForceGraphNode[]; primary: boolean }> = [];
  for (let start = 0; start < primary.length; start += 12) tracks.push({ members: primary.slice(start, start + 12), primary: true });
  for (let start = 0; start < supporting.length; start += 18) tracks.push({ members: supporting.slice(start, start + 18), primary: false });
  const positions = new Map<string, { x: number; y: number; __labelPriority: boolean }>([[center.id, { x: 0, y: 0, __labelPriority: true }]]);
  const radiusX = Math.max(80, width / 2 - 60);
  const radiusY = Math.max(72, height / 2 - 55);
  tracks.forEach((track, ring) => {
    const fraction = (ring + 1) / tracks.length;
    track.members.forEach((node, index) => {
      const angle = -Math.PI / 2 + (index / track.members.length) * 2 * Math.PI + (ring % 2 ? Math.PI / track.members.length : 0);
      positions.set(node.id, { x: Math.cos(angle) * radiusX * fraction, y: Math.sin(angle) * radiusY * fraction,
        __labelPriority: track.primary && index % Math.ceil(track.members.length / 6) === 0 });
    });
  });
  return nodes.map((node) => { const position = positions.get(node.id)!; return { ...node, ...position, fx: position.x, fy: position.y }; });
}

function applyGraphStyling({
  graphData,
  activeCategories,
  temporalMode,
  selectedTimeMs,
  showInvalidated,
  selectedElement,
}: {
  graphData: { nodes: ForceGraphNode[]; links: ForceGraphLink[] };
  activeCategories: Set<RelationshipCategory>;
  temporalMode: TemporalMode;
  selectedTimeMs: number;
  showInvalidated: boolean;
  selectedElement: GraphSelection;
}): { nodes: ForceGraphNode[]; links: ForceGraphLink[] } {
  const matchingEdgeIds = new Set<string>();
  const matchingNodeIds = new Set<string>();
  const categoryFilterActive = activeCategories.size > 0;

  for (const link of graphData.links) {
    const category = categoryForRelation(link.relationshipType ?? link.label);
    const categoryMatch = !categoryFilterActive || (category ? activeCategories.has(category) : false);
    if (categoryMatch) {
      matchingEdgeIds.add(link.id);
      matchingNodeIds.add(link.__sourceId);
      matchingNodeIds.add(link.__targetId);
    }
  }

  const nodeIds = new Set(graphData.nodes.map((node) => node.id));
  const links = graphData.links.map((link) => {
    let opacity = 1;
    const invalidated = isInvalidated(link);
    const category = categoryForRelation(link.relationshipType ?? link.label);
    const categoryMatch = !categoryFilterActive || matchingEdgeIds.has(link.id);
    if (!categoryMatch) opacity = Math.min(opacity, DIMMED_OPACITY);
    if (!isElementValidAt(link, temporalMode, selectedTimeMs)) opacity = Math.min(opacity, DIMMED_OPACITY);
    if (invalidated) opacity = showInvalidated ? Math.min(categoryMatch ? 1 : DIMMED_OPACITY, INVALIDATED_VISIBLE_OPACITY) : INVALIDATED_HIDDEN_OPACITY;
    return {
      ...link,
      __category: category,
      __opacity: opacity,
      __invalidated: invalidated,
      __visibleInvalidated: invalidated && showInvalidated,
      __selected: selectedElement?.kind === 'edge' && selectedElement.item.id === link.id,
    };
  });

  const nodes = graphData.nodes.map((node) => {
    let opacity = 1;
    const invalidated = isInvalidated(node);
    const categoryMatch = !categoryFilterActive || matchingNodeIds.has(node.id) || !nodeIds.has(node.id);
    if (!categoryMatch) opacity = Math.min(opacity, DIMMED_OPACITY);
    if (!isElementValidAt(node, temporalMode, selectedTimeMs)) opacity = Math.min(opacity, DIMMED_OPACITY);
    if (invalidated) opacity = showInvalidated ? Math.min(categoryMatch ? 1 : DIMMED_OPACITY, INVALIDATED_VISIBLE_OPACITY) : INVALIDATED_HIDDEN_OPACITY;
    return {
      ...node,
      __opacity: opacity,
      __invalidated: invalidated,
      __visibleInvalidated: invalidated && showInvalidated,
      __selected: selectedElement?.kind === 'node' && selectedElement.item.id === node.id,
    };
  });

  return { nodes, links };
}

function paintGraphNode(node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number, hovered: boolean) {
  const entityType = node.entityType ?? node.type;
  const fill = node.reviewState === 'missing' ? '#fee2e2' : getACOColor(entityType);
  const stroke = node.reviewState === 'missing' ? '#dc2626' : getACOBorderColor(entityType);
  const radius = node.type === 'capsule' ? 8 : node.type === 'boundary' ? 6.5 : node.__cluster ? Math.min(18, 8 + Math.log2((node.__count ?? 2) + 1) * 2) : 5.5;
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const opacity = node.__opacity ?? 1;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  if (node.type === 'boundary') {
    ctx.moveTo(x, y - radius - 2);
    ctx.lineTo(x + radius + 2, y);
    ctx.lineTo(x, y + radius + 2);
    ctx.lineTo(x - radius - 2, y);
    ctx.closePath();
  } else if (node.reviewState === 'missing') {
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
  ctx.lineWidth = node.__selected ? 2.8 : node.reviewState === 'canonical' || node.reviewState === 'reviewed' ? 1.5 : 2;
  ctx.strokeStyle = node.__selected ? '#0f172a' : stroke;
  if (node.__visibleInvalidated || (node.reviewState !== 'canonical' && node.reviewState !== 'reviewed')) ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
  if (node.reviewState === 'reviewed') {
    ctx.beginPath();
    ctx.arc(x + radius - 1, y - radius + 1, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#059669';
    ctx.fill();
  }
  if (!node.__selected && !hovered && !node.__labelPriority) { ctx.restore(); return; }
  const emphasized = Boolean(node.__selected || hovered);
  const labelLimit = emphasized ? 46 : 18;
  const rawLabel = node.label.length > labelLimit ? `${node.label.slice(0, labelLimit - 1).trimEnd()}…` : node.label;
  const label = node.__visibleInvalidated ? `~~ ${rawLabel}` : rawLabel;
  const fontSize = 11 / Math.max(globalScale, 0.25);
  const labelY = y + radius + 4;
  ctx.font = `600 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
  const splitAt = label.lastIndexOf(' ', 24) >= 10 ? label.lastIndexOf(' ', 24) : 24;
  const lines = emphasized && label.length > 24 ? [label.slice(0, splitAt).trimEnd(), label.slice(splitAt).trimStart()] : [label];
  const labelWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
  ctx.fillStyle = '#f6f9f7';
  ctx.fillRect(x - labelWidth / 2 - 3 / globalScale, labelY - 2 / globalScale, labelWidth + 6 / globalScale, fontSize * 1.35 * lines.length);
  ctx.fillStyle = emphasized ? '#0f172a' : '#475569';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  lines.forEach((line, index) => ctx.fillText(line, x, labelY + index * fontSize * 1.3));
  if (node.__visibleInvalidated) {
    const width = ctx.measureText(label).width;
    ctx.beginPath();
    ctx.moveTo(x - width / 2, labelY + fontSize * 0.55);
    ctx.lineTo(x + width / 2, labelY + fontSize * 0.55);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#334155';
    ctx.stroke();
  }
  ctx.restore();
}

function paintGraphLink(link: ForceGraphLink, ctx: CanvasRenderingContext2D) {
  const source = typeof link.source === 'object' ? link.source : null;
  const target = typeof link.target === 'object' ? link.target : null;
  if (!source || !target) return;
  const opacity = link.__opacity ?? 1;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.beginPath();
  ctx.moveTo(source.x ?? 0, source.y ?? 0);
  ctx.lineTo(target.x ?? 0, target.y ?? 0);
  ctx.lineWidth = link.__selected ? 2.6 : Math.max(0.35, 1.2 * opacity);
  ctx.strokeStyle = link.__selected ? '#0f172a' : edgeColor(link);
  if (link.__visibleInvalidated || link.reviewState === 'proposed' || link.reviewState === 'advisory' || link.reviewState === 'missing') ctx.setLineDash([4, 3]);
  ctx.stroke();
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
  const category = link.__category ?? categoryForRelation(link.relationshipType ?? link.label);
  if (category) return RELATIONSHIP_CATEGORY_COLORS[category];
  if (link.reviewState === 'missing') return '#dc2626';
  if (link.reviewState === 'proposed' || link.reviewState === 'advisory') return '#d97706';
  return '#64748b';
}

function panelSelectionFrom(selection: GraphSelection, nodeLabelById: Map<string, string>): CapsuleGraphWhyPanelSelection | null {
  if (!selection) return null;
  if (selection.kind === 'node') {
    const node = selection.item;
    return {
      kind: 'node',
      id: node.id,
      label: node.label,
      acoType: node.entityType ?? node.type,
      reviewState: node.reviewState,
      confidence: node.confidence,
      confidenceKind: node.confidenceKind,
      rationale: node.rationale,
      detail: node.detail,
      provenance: node.provenance,
      sourceReceiptIds: node.sourceReceiptIds,
      version: node.version,
      validFrom: node.validFrom,
      validUntil: node.validUntil,
      asOf: node.asOf,
      recordedAt: node.recordedAt,
      derivedFrom: node.derivedFrom,
      generatedBy: node.generatedBy,
      invalidatedAt: node.invalidatedAt,
      invalidationReason: node.invalidationReason,
      supersededBy: node.supersededBy,
    };
  }
  const edge = selection.item;
  return {
    kind: 'edge',
    id: edge.id,
    label: edge.relationshipType ?? edge.label,
    acoType: categoryLabel(categoryForRelation(edge.relationshipType ?? edge.label)) ?? edge.relationshipType ?? edge.label,
    reviewState: edge.reviewState,
    confidence: edge.confidence,
    confidenceKind: edge.confidenceKind,
    rationale: edge.rationale,
    provenance: edge.provenance,
    sourceReceiptIds: edge.sourceReceiptIds,
    validFrom: edge.validFrom,
    validUntil: edge.validUntil,
    asOf: edge.asOf,
    recordedAt: edge.recordedAt,
    derivedFrom: edge.derivedFrom,
    generatedBy: edge.generatedBy,
    invalidatedAt: edge.invalidatedAt,
    invalidationReason: edge.invalidationReason,
    supersededBy: edge.supersededBy,
    sourceLabel: nodeLabelById.get(edge.__sourceId) ?? edge.__sourceId,
    targetLabel: nodeLabelById.get(edge.__targetId) ?? edge.__targetId,
    judgeRationale: edge.judgeRationale,
  };
}

function contradictionsForSelection(selection: GraphSelection, links: ForceGraphLink[], nodeLabelById: Map<string, string>): CapsuleGraphWhyPanelContradiction[] {
  if (!selection) return [];
  const items: CapsuleGraphWhyPanelContradiction[] = [];
  if (selection.kind === 'node') {
    const selectedId = selection.item.id;
    for (const link of links) {
      if (!isContradictionLink(link) || (link.__sourceId !== selectedId && link.__targetId !== selectedId)) continue;
      const otherId = link.__sourceId === selectedId ? link.__targetId : link.__sourceId;
      items.push({
        id: link.id,
        elementId: otherId,
        label: nodeLabelById.get(otherId) ?? otherId,
        judgeRationale: link.judgeRationale,
      });
    }
    return items;
  }
  const edge = selection.item;
  if (isContradictionLink(edge)) {
    items.push({
      id: edge.id,
      elementId: edge.__targetId,
      label: `${nodeLabelById.get(edge.__sourceId) ?? edge.__sourceId} contradicts ${nodeLabelById.get(edge.__targetId) ?? edge.__targetId}`,
      judgeRationale: edge.judgeRationale,
    });
  }
  return items;
}

function buildNodeLabelMap(nodes: CapsuleGraphViewerNode[], graphNodes: ForceGraphNode[]): Map<string, string> {
  const map = new Map(nodes.map((node) => [node.id, node.label]));
  for (const node of graphNodes) map.set(node.id, node.label);
  return map;
}

function buildTemporalBounds(nodes: CapsuleGraphViewerNode[], edges: CapsuleGraphViewerEdge[], now: number): { min: number; max: number } {
  const times = [...nodes, ...edges]
    .flatMap((element) => elementTimes(element))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!times.length) return { min: now - 30 * DAY_MS, max: now };
  return { min: Math.min(now, ...times), max: Math.max(now, ...times) };
}

function positionForTime(timeMs: number, bounds: { min: number; max: number }): number {
  if (bounds.max <= bounds.min) return 100;
  return clamp(((timeMs - bounds.min) / (bounds.max - bounds.min)) * 100, 0, 100);
}

function timeForPosition(position: number, bounds: { min: number; max: number }): number {
  if (bounds.max <= bounds.min) return bounds.max;
  return bounds.min + (bounds.max - bounds.min) * (clamp(position, 0, 100) / 100);
}

function elementTimes(element: TemporalGraphElement): number[] {
  return [element.validFrom, element.validUntil, element.asOf, element.recordedAt, element.invalidatedAt, element.generatedBy?.at]
    .map(parseTime)
    .filter((value): value is number => typeof value === 'number');
}

function isElementValidAt(element: TemporalGraphElement, mode: TemporalMode, timeMs: number): boolean {
  if (mode === 'event') {
    const validFrom = parseTime(element.validFrom ?? element.asOf);
    const validUntil = parseTime(element.validUntil);
    if (validFrom !== null && timeMs < validFrom) return false;
    if (validUntil !== null && timeMs > validUntil) return false;
    return true;
  }
  const recordedAt = parseTime(element.recordedAt);
  const invalidatedAt = parseTime(element.invalidatedAt);
  if (recordedAt !== null && timeMs < recordedAt) return false;
  if (invalidatedAt !== null && timeMs >= invalidatedAt) return false;
  return true;
}

function parseTime(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isInvalidated(element: TemporalGraphElement): boolean {
  return Boolean(element.invalidatedAt || element.supersededBy || element.invalidationReason);
}

function categoryForRelation(relation: string | undefined): RelationshipCategory | null {
  const normalized = normalizeRelation(relation);
  return normalized ? getRelationshipCategory(normalized) : null;
}

function normalizeRelation(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function isContradictionLink(link: Pick<ForceGraphLink, 'relationshipType' | 'label'>): boolean {
  return normalizeRelation(link.relationshipType ?? link.label).includes('contradicts');
}

function categoryLabel(category: RelationshipCategory | null): string | null {
  if (!category) return null;
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
