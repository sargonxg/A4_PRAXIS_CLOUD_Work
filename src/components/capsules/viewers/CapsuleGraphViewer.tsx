'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useMemo, useRef, useState, type ForwardRefExoticComponent, type ReactNode, type RefAttributes } from 'react';
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
  canonicalNodeCount?: number;
  proposedNodeCount?: number;
  graphStats?: CapsuleGraphViewerStats;
  onProposalIntent?: (node: CapsuleGraphViewerNode | null, intent: CapsuleGraphProposalIntent) => void;
  onBuildFromSources?: () => void;
  proposalForm?: ReactNode;
  reviewCards?: ReactNode;
};

type ForceGraphNode = CapsuleGraphViewerNode & {
  x?: number;
  y?: number;
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
}: CapsuleGraphViewerProps) {
  const graphRef = useRef<ForceGraphHandle | null>(null);
  const [query, setQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<GraphSelection>(() => (
    nodes[0] ? { kind: 'node', item: nodes[0] as ForceGraphNode } : null
  ));
  const [hoveredEdge, setHoveredEdge] = useState<ForceGraphLink | null>(null);
  const [activeCategories, setActiveCategories] = useState<Set<RelationshipCategory>>(() => new Set());
  const [showInvalidated, setShowInvalidated] = useState(false);
  const [temporalMode, setTemporalMode] = useState<TemporalMode>('transaction');
  const [scrubberValue, setScrubberValue] = useState<number | null>(null);
  const [referenceTimeMs] = useState(() => Date.now());

  const graphData = useMemo(() => buildForceGraphData({ nodes, edges }, query), [nodes, edges, query]);
  const graphIsEmpty = nodes.length <= 1 && edges.length === 0;
  const temporalBounds = useMemo(() => buildTemporalBounds(nodes, edges, referenceTimeMs), [edges, nodes, referenceTimeMs]);
  const nowPosition = positionForTime(referenceTimeMs, temporalBounds);
  const scrubberPosition = scrubberValue ?? nowPosition;
  const selectedTimeMs = timeForPosition(scrubberPosition, temporalBounds);
  const selectedNode = selectedElement?.kind === 'node' ? selectedElement.item : null;
  const nodeLabelById = useMemo(() => buildNodeLabelMap(nodes, graphData.nodes), [nodes, graphData.nodes]);

  const styledGraphData = useMemo(() => applyGraphStyling({
    graphData,
    activeCategories,
    temporalMode,
    selectedTimeMs,
    showInvalidated,
    selectedElement,
  }), [activeCategories, graphData, selectedElement, selectedTimeMs, showInvalidated, temporalMode]);

  const panelSelection = useMemo(
    () => panelSelectionFrom(selectedElement, nodeLabelById),
    [nodeLabelById, selectedElement],
  );
  const contradictions = useMemo(
    () => contradictionsForSelection(selectedElement, graphData.links, nodeLabelById),
    [graphData.links, nodeLabelById, selectedElement],
  );

  const focusSearch = useCallback(() => {
    const term = query.trim().toLowerCase();
    const match = term ? graphData.nodes.find((node) => `${node.label} ${node.detail ?? ''} ${node.entityType ?? ''}`.toLowerCase().includes(term)) : graphData.nodes[0];
    if (match) {
      setSelectedElement({ kind: 'node', item: match });
      onSelect?.(match);
      graphRef.current?.centerAt?.(match.x ?? 0, match.y ?? 0, 500);
      graphRef.current?.zoom?.(2.1, 500);
    } else {
      graphRef.current?.zoomToFit?.(500, 48);
    }
  }, [graphData.nodes, onSelect, query]);

  const selectElementById = useCallback((elementId: string) => {
    const node = graphData.nodes.find((candidate) => candidate.id === elementId);
    if (node) {
      setSelectedElement({ kind: 'node', item: node });
      onSelect?.(node);
      graphRef.current?.centerAt?.(node.x ?? 0, node.y ?? 0, 500);
      graphRef.current?.zoom?.(2.1, 500);
      return;
    }
    const link = graphData.links.find((candidate) => candidate.id === elementId);
    if (link) {
      setSelectedElement({ kind: 'edge', item: link });
      onSelect?.(null);
    }
  }, [graphData.links, graphData.nodes, onSelect]);

  const toggleCategory = useCallback((category: RelationshipCategory) => {
    setActiveCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

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
        {editable ? (
          <button type="button" onClick={() => onProposalIntent?.(selectedNode, 'open')} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-900 bg-slate-950 px-2 text-xs font-semibold text-white">
            <Plus className="h-3.5 w-3.5" />
            Propose node
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-2 py-2" data-testid="capsule-graph-lens-bar">
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
      </div>

      {graphStats ? (
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
          <button type="button" onClick={onBuildFromSources} className="rounded-md border border-slate-900 bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
            Build graph from sources
          </button>
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="min-w-0 bg-white">
            <ForceGraph2D
              ref={graphRef}
              graphData={styledGraphData}
              height={height}
              backgroundColor="#ffffff"
              cooldownTicks={80}
              nodeCanvasObject={paintGraphNode}
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
            />
          </aside>
        </div>
      )}

      <div className="border-t border-slate-100 bg-white px-3 py-2" data-testid="capsule-graph-temporal-scrubber">
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
      </div>

      {proposalForm}
      <div className="border-t border-slate-100 bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span>{canonicalNodeCount} canonical</span>
          <span>{proposedNodeCount} proposed/missing</span>
          {graphStats ? <span>{graphStats.boundaryNodes} Boundary</span> : null}
          {graphStats ? <span>{graphStats.provenanceCoveragePct}% provenance</span> : null}
          <span>{nodes.length > graphData.nodes.length ? `${nodes.length - graphData.nodes.length} nodes collapsed by level of detail` : 'Full graph visible'}</span>
          <span>GraphLite advisory projection</span>
          <span>Firestore canonical</span>
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

function buildForceGraphData(graph: { nodes: CapsuleGraphViewerNode[]; edges: CapsuleGraphViewerEdge[] }, query: string): { nodes: ForceGraphNode[]; links: ForceGraphLink[] } {
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
    const key = `${String(link.source)}:${String(link.target)}:${link.relationshipType ?? link.label}`;
    if (!uniqueLinks.has(key)) uniqueLinks.set(key, link);
  }
  return { nodes, links: [...uniqueLinks.values()] };
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

function paintGraphNode(node: ForceGraphNode, ctx: CanvasRenderingContext2D, globalScale: number) {
  const rawLabel = node.__cluster ? node.label : node.label.slice(0, 42);
  const label = node.__visibleInvalidated ? `~~ ${rawLabel}` : rawLabel;
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
  const fontSize = Math.max(9, 11 / globalScale);
  const labelY = y + radius + 4;
  ctx.font = `600 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = '#334155';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(label, x, labelY);
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
