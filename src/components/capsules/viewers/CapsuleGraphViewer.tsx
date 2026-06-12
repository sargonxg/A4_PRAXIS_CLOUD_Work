'use client';

import dynamic from 'next/dynamic';
import { memo, useMemo, useRef, useState, type ForwardRefExoticComponent, type ReactNode, type RefAttributes } from 'react';
import { Maximize2, Plus, Search } from 'lucide-react';
import { getACOColor, getACOBorderColor, getRelationshipCategory, RELATIONSHIP_CATEGORY_COLORS } from '@/lib/constants/aco-colors';
import { CompactList, formatConfidence, InfoLine } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export type CapsuleGraphViewerNode = {
  id: string;
  label: string;
  type: string;
  reviewState: string;
  detail?: string;
  entityType?: string;
  provenance?: string;
  confidence?: number | null;
  confidenceKind?: 'EXTRACTED' | 'INFERRED' | 'ASSESSED';
  sourceReceiptIds?: string[];
  linkedClaimIds?: string[];
  version?: number | null;
  recordedAt?: string;
  invalidatedAt?: string;
  supersededBy?: string;
  invalidationReason?: 'CONTRADICTED' | 'SOURCE_RETRACTED' | 'TEMPORAL_EXPIRY' | 'HUMAN_OVERRIDE';
  rationale?: string;
  derivedFrom?: string[];
  generatedBy?: {
    actorType: 'model' | 'human';
    actorId: string;
    at: string;
    activity: 'extraction' | 'proposal' | 'review_decision' | 'import' | 'quality_review';
  };
};

export type CapsuleGraphViewerEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  reviewState: string;
  relationshipType?: string;
  judgeRationale?: string;
  confidence?: number | null;
  confidenceKind?: 'EXTRACTED' | 'INFERRED' | 'ASSESSED';
  sourceReceiptIds?: string[];
  recordedAt?: string;
  invalidatedAt?: string;
  supersededBy?: string;
  invalidationReason?: 'CONTRADICTED' | 'SOURCE_RETRACTED' | 'TEMPORAL_EXPIRY' | 'HUMAN_OVERRIDE';
  rationale?: string;
  derivedFrom?: string[];
  generatedBy?: {
    actorType: 'model' | 'human';
    actorId: string;
    at: string;
    activity: 'extraction' | 'proposal' | 'review_decision' | 'import' | 'quality_review';
  };
};

export type CapsuleGraphProposalIntent = 'open' | 'refine' | 'background';

export type CapsuleGraphViewerProps = {
  nodes: CapsuleGraphViewerNode[];
  edges: CapsuleGraphViewerEdge[];
  onSelect?: (node: CapsuleGraphViewerNode | null) => void;
  editable?: boolean;
  height?: number;
  canonicalNodeCount?: number;
  proposedNodeCount?: number;
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
};

type ForceGraphLink = Omit<CapsuleGraphViewerEdge, 'source' | 'target'> & {
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

function CapsuleGraphViewerComponent({
  nodes,
  edges,
  onSelect,
  editable = true,
  height = 420,
  canonicalNodeCount = 0,
  proposedNodeCount = 0,
  onProposalIntent,
  onBuildFromSources,
  proposalForm = null,
  reviewCards = null,
}: CapsuleGraphViewerProps) {
  const graphRef = useRef<ForceGraphHandle | null>(null);
  const [query, setQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<ForceGraphNode | null>(nodes[0] ?? null);
  const [hoveredEdge, setHoveredEdge] = useState<ForceGraphLink | null>(null);
  const graphData = useMemo(() => buildForceGraphData({ nodes, edges }, query), [nodes, edges, query]);
  const graphIsEmpty = nodes.length <= 1 && edges.length === 0;

  const focusSearch = () => {
    const term = query.trim().toLowerCase();
    const match = term ? graphData.nodes.find((node) => `${node.label} ${node.detail ?? ''} ${node.entityType ?? ''}`.toLowerCase().includes(term)) : graphData.nodes[0];
    if (match) {
      setSelectedNode(match);
      onSelect?.(match);
      graphRef.current?.centerAt?.(match.x ?? 0, match.y ?? 0, 500);
      graphRef.current?.zoom?.(2.1, 500);
    } else {
      graphRef.current?.zoomToFit?.(500, 48);
    }
  };

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
      {graphIsEmpty ? (
        <div className="flex h-[420px] flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-sm font-semibold text-slate-800">No graph projection is attached yet.</p>
          <button type="button" onClick={onBuildFromSources} className="rounded-md border border-slate-900 bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
            Build graph from sources
          </button>
        </div>
      ) : (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0 bg-white">
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              height={height}
              backgroundColor="#ffffff"
              cooldownTicks={80}
              nodeCanvasObject={paintGraphNode}
              nodePointerAreaPaint={paintNodePointerArea}
              linkColor={edgeColor}
              linkWidth={(link) => (hoveredEdge?.id === link.id ? 2.4 : 1.2)}
              linkLabel={(link) => `${link.relationshipType ?? link.label}: ${formatConfidence(link.confidence)}`}
              onNodeClick={(node) => {
                setSelectedNode(node);
                onSelect?.(node);
              }}
              onNodeRightClick={(node, event) => {
                event.preventDefault();
                setSelectedNode(node);
                onSelect?.(node);
                onProposalIntent?.(node, 'refine');
              }}
              onLinkHover={(link) => setHoveredEdge(link)}
              onBackgroundRightClick={() => onProposalIntent?.(selectedNode, 'background')}
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
      {proposalForm}
      <div className="border-t border-slate-100 bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span>{canonicalNodeCount} canonical</span>
          <span>{proposedNodeCount} proposed/missing</span>
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
