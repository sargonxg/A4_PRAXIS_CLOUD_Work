import type { GraphData, GraphEdge, GraphNode } from '@/lib/firebase/graph-service';
import type { GraphUpdateProposal } from '@/lib/firebase/graph-updates-service';
import { normalizeCanonicalGraph } from '@/lib/graph/canonical-graph';
import { generateGraphRepairSuggestions, type GraphRepairSuggestion } from '@/lib/graph/graph-repair';

export const GRAPHOPS_SCHEMA_VERSION = 'graphops-v0.1';

export const POLICY_CORE_NODE_TYPES = [
  'actor',
  'claim',
  'interest',
  'constraint',
  'leverage',
  'commitment',
  'event',
  'narrative',
  'institution',
  'norm',
  'resource',
  'risk',
  'policy',
  'grievance',
  'source',
  'document_fragment',
  'location',
  'scenario',
  'recommendation',
  'legal_instrument',
  'sanction',
] as const;

export type PolicyCoreNodeType = (typeof POLICY_CORE_NODE_TYPES)[number];

export type GraphOpsBackend = 'firestore-canonical' | 'neo4j-derived-index' | 'unknown';

export interface GraphOpsTemporalCoverage {
  nodeTemporalCount: number;
  edgeTemporalCount: number;
  totalTemporalCount: number;
  coveragePct: number;
  earliest: string | null;
  latest: string | null;
}

export interface GraphOpsProvenanceCoverage {
  citedNodeCount: number;
  citedEdgeCount: number;
  citedTotalCount: number;
  coveragePct: number;
  sourceKinds: string[];
}

export interface GraphOpsSummary {
  schemaVersion: typeof GRAPHOPS_SCHEMA_VERSION;
  backend: GraphOpsBackend;
  nodeCount: number;
  edgeCount: number;
  approvedCount: number;
  proposedCount: number;
  lowConfidenceCount: number;
  orphanNodeCount: number;
  temporal: GraphOpsTemporalCoverage;
  provenance: GraphOpsProvenanceCoverage;
  nodeTypes: Record<string, number>;
  edgeTypes: Record<string, number>;
  snapshotCount: number;
  latestSnapshotAt: string | null;
  maintenanceActions: string[];
  repairSuggestions: GraphRepairSuggestion[];
  generatedAt: string;
}

interface BuildGraphOpsSummaryInput {
  graph: GraphData | null;
  proposals?: GraphUpdateProposal[];
  snapshotIds?: string[];
  backend?: GraphOpsBackend;
  now?: string;
}

function normalizeType(type: unknown): string {
  return String(type ?? 'unknown').trim().toLowerCase().replace(/\s+/g, '_') || 'unknown';
}

function isLowConfidence(value: unknown): boolean {
  if (typeof value === 'number') return value < 0.55;
  if (typeof value !== 'string') return false;
  const normalized = value.toLowerCase();
  return normalized.includes('ambiguous') || normalized.includes('low') || normalized.includes('uncertain');
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function collectTemporalValues(nodeOrEdge: GraphNode | GraphEdge): string[] {
  const metadata = nodeOrEdge.metadata ?? {};
  const values = [
    firstString(metadata.valid_from, metadata.validFrom, metadata.date, metadata.observedAt, metadata.recordedAt),
    firstString(metadata.valid_until, metadata.validUntil),
  ];
  if ('createdAt' in nodeOrEdge) values.push(firstString(nodeOrEdge.createdAt));
  return values.filter((value): value is string => Boolean(value));
}

function hasTemporalData(nodeOrEdge: GraphNode | GraphEdge): boolean {
  return collectTemporalValues(nodeOrEdge).length > 0;
}

function hasProvenance(nodeOrEdge: GraphNode | GraphEdge): boolean {
  const metadata = nodeOrEdge.metadata ?? {};
  return Boolean(
    ('source' in nodeOrEdge && nodeOrEdge.source) ||
      firstString(metadata.source_url, metadata.sourceUrl, metadata.source_name, metadata.sourceName) ||
      Array.isArray(metadata.sourceReceipts) && metadata.sourceReceipts.length > 0 ||
      Array.isArray(metadata.sourceDocIds) && metadata.sourceDocIds.length > 0 ||
      Array.isArray(metadata.documentFragments) && metadata.documentFragments.length > 0
  );
}

function provenanceKinds(items: Array<GraphNode | GraphEdge>): string[] {
  const kinds = new Set<string>();
  for (const item of items) {
    const metadata = item.metadata ?? {};
    if ('source' in item && item.source) kinds.add(String(item.source));
    if (metadata.source_url || metadata.sourceUrl) kinds.add('url');
    if (metadata.source_name || metadata.sourceName) kinds.add('named-source');
    if (Array.isArray(metadata.sourceReceipts) && metadata.sourceReceipts.length > 0) kinds.add('source-receipt');
    if (Array.isArray(metadata.sourceDocIds) && metadata.sourceDocIds.length > 0) kinds.add('document');
    if (Array.isArray(metadata.documentFragments) && metadata.documentFragments.length > 0) kinds.add('fragment');
  }
  return Array.from(kinds).sort();
}

function countTypes<T extends { type: string }>(items: T[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const type = normalizeType(item.type);
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});
}

function latestSnapshot(snapshotIds: string[]): string | null {
  const timestamps = snapshotIds
    .map((id) => id.replace(/^snapshot-/, ''))
    .filter((id) => !Number.isNaN(Date.parse(id)))
    .sort();
  return timestamps.at(-1) ?? null;
}

export function buildGraphOpsSummary(input: BuildGraphOpsSummaryInput): GraphOpsSummary {
  const graph = normalizeCanonicalGraph(input.graph);
  const nodes = graph.nodes;
  const edges = graph.edges;
  const proposals = input.proposals ?? [];
  const totalItems = nodes.length + edges.length;
  const citedNodeCount = nodes.filter(hasProvenance).length;
  const citedEdgeCount = edges.filter(hasProvenance).length;
  const nodeTemporalCount = nodes.filter(hasTemporalData).length;
  const edgeTemporalCount = edges.filter(hasTemporalData).length;
  const temporalValues = [...nodes, ...edges].flatMap(collectTemporalValues).filter((value) => !Number.isNaN(Date.parse(value))).sort();
  const connectedNodeIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  const orphanNodeCount = nodes.filter((node) => !connectedNodeIds.has(node.id)).length;
  const lowConfidenceCount = [...nodes, ...edges].filter((item) => isLowConfidence(item.metadata?.confidence)).length;

  const maintenanceActions: string[] = [];
  if (nodes.length === 0) maintenanceActions.push('Seed graph from documents or grounded search before running graph-dependent tools.');
  if (proposals.length > 0) maintenanceActions.push(`Review ${proposals.length} pending graph proposal${proposals.length === 1 ? '' : 's'} before relying on graph analytics.`);
  if (totalItems > 0 && citedNodeCount + citedEdgeCount < Math.ceil(totalItems * 0.5)) {
    maintenanceActions.push('Improve provenance: link more nodes and relationships to source receipts or document fragments.');
  }
  if (totalItems > 0 && nodeTemporalCount + edgeTemporalCount < Math.ceil(totalItems * 0.35)) {
    maintenanceActions.push('Add temporal anchors: dates, valid-from, valid-until, or observed-at fields for policy change tracking.');
  }
  if (lowConfidenceCount > 0) maintenanceActions.push(`Resolve ${lowConfidenceCount} low-confidence or ambiguous graph item${lowConfidenceCount === 1 ? '' : 's'}.`);
  if (orphanNodeCount > 0 && nodes.length > 3) maintenanceActions.push(`Connect or archive ${orphanNodeCount} orphan node${orphanNodeCount === 1 ? '' : 's'} so visual analytics remain meaningful.`);
  const repairSuggestions = generateGraphRepairSuggestions(graph).slice(0, 12);
  if (repairSuggestions.some((suggestion) => suggestion.severity === 'critical')) {
    maintenanceActions.unshift('Run graph repair: at least one critical structural issue is present.');
  }
  if (maintenanceActions.length === 0) maintenanceActions.push('Graph is ready for Ask PRAXIS, timeline review, and stakeholder analysis.');

  return {
    schemaVersion: GRAPHOPS_SCHEMA_VERSION,
    backend: input.backend ?? 'unknown',
    nodeCount: nodes.length,
    edgeCount: edges.length,
    approvedCount: totalItems,
    proposedCount: proposals.length,
    lowConfidenceCount,
    orphanNodeCount,
    temporal: {
      nodeTemporalCount,
      edgeTemporalCount,
      totalTemporalCount: nodeTemporalCount + edgeTemporalCount,
      coveragePct: totalItems ? Math.round(((nodeTemporalCount + edgeTemporalCount) / totalItems) * 100) : 0,
      earliest: temporalValues[0] ?? null,
      latest: temporalValues.at(-1) ?? null,
    },
    provenance: {
      citedNodeCount,
      citedEdgeCount,
      citedTotalCount: citedNodeCount + citedEdgeCount,
      coveragePct: totalItems ? Math.round(((citedNodeCount + citedEdgeCount) / totalItems) * 100) : 0,
      sourceKinds: provenanceKinds([...nodes, ...edges]),
    },
    nodeTypes: countTypes(nodes),
    edgeTypes: countTypes(edges),
    snapshotCount: input.snapshotIds?.length ?? 0,
    latestSnapshotAt: latestSnapshot(input.snapshotIds ?? []),
    maintenanceActions,
    repairSuggestions,
    generatedAt: input.now ?? new Date().toISOString(),
  };
}
