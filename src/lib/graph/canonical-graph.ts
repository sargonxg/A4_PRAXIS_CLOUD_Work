import { z } from 'zod';
import type { GraphData, GraphEdge, GraphNode } from '@/lib/firebase/graph-service';

export const CANONICAL_GRAPH_SCHEMA_VERSION = 'canonical-graph-v1';

export const GraphEvidenceEnvelopeSchema = z.object({
  sourceReceiptId: z.string().optional(),
  documentId: z.string().optional(),
  chunkId: z.string().optional(),
  url: z.string().url().optional(),
  title: z.string().optional(),
  domain: z.string().optional(),
  fragment: z.string().max(1200).optional(),
  extractor: z.string().optional(),
  toolRunId: z.string().optional(),
  confidenceRationale: z.string().max(1200).optional(),
});

export const TemporalAssertionSchema = z.object({
  id: z.string(),
  subjectId: z.string(),
  predicate: z.string(),
  objectId: z.string().optional(),
  literal: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  observedAt: z.string().optional(),
  recordedAt: z.string(),
  sourceIds: z.array(z.string()).default([]),
  confidence: z.union([z.string(), z.number()]).default('INFERRED'),
  status: z.enum(['proposed', 'active', 'superseded', 'rejected']).default('active'),
  supersedes: z.string().optional(),
  supersededBy: z.string().optional(),
});

export type GraphEvidenceEnvelope = z.infer<typeof GraphEvidenceEnvelopeSchema>;
export type TemporalAssertion = z.infer<typeof TemporalAssertionSchema>;

export const BiTemporalFieldsSchema = z.object({
  validFrom: z.string().nullable().optional(),
  validTo: z.string().nullable().optional(),
  assertedFrom: z.string().nullable().optional(),
  assertedTo: z.string().nullable().optional(),
});
export type BiTemporalFields = z.infer<typeof BiTemporalFieldsSchema>;

const NODE_SOURCE_VALUES = ['extraction', 'manual', 'ai-chat', 'pipeline', 'web-research'] as const;
type NodeSource = (typeof NODE_SOURCE_VALUES)[number];

function normalizeId(value: string): string {
  return value.trim().replace(/\s+/g, '-').replace(/[^A-Za-z0-9_.:-]/g, '').toLowerCase();
}

function normalizeType(value: string): string {
  return value.trim().replace(/\s+/g, '_').toLowerCase();
}

function normalizeSource(value: unknown): NodeSource {
  return NODE_SOURCE_VALUES.includes(value as NodeSource) ? (value as NodeSource) : 'extraction';
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function evidenceFromMetadata(metadata: Record<string, unknown> | undefined, source?: GraphNode['source']): GraphEvidenceEnvelope[] {
  if (!metadata) return source ? [{ extractor: source }] : [];
  const existing = metadata.evidence;
  if (Array.isArray(existing)) {
    return existing
      .map((item) => GraphEvidenceEnvelopeSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data);
  }
  const envelope = GraphEvidenceEnvelopeSchema.safeParse({
    sourceReceiptId: stringValue(metadata.sourceReceiptId),
    documentId: stringValue(metadata.documentId),
    chunkId: stringValue(metadata.chunkId),
    url: stringValue(metadata.source_url) ?? stringValue(metadata.sourceUrl),
    title: stringValue(metadata.source_name) ?? stringValue(metadata.sourceName),
    fragment: stringValue(metadata.fragment),
    extractor: source ?? stringValue(metadata.extractor),
    confidenceRationale: stringValue(metadata.confidenceRationale),
  });
  return envelope.success && Object.values(envelope.data).some(Boolean) ? [envelope.data] : [];
}

export function normalizeGraphNode(node: GraphNode): GraphNode & BiTemporalFields {
  const id = normalizeId(node.id || node.label);
  const metadata = node.metadata ?? {};
  const source = normalizeSource(node.source);
  return {
    ...node,
    id,
    type: normalizeType(node.type || 'unknown'),
    label: node.label?.trim() || id,
    properties: node.properties ?? {},
    createdAt: node.createdAt || new Date().toISOString(),
    validFrom: (node as GraphNode & { validFrom?: string | null }).validFrom ?? stringValue(metadata.validFrom) ?? null,
    validTo: (node as GraphNode & { validTo?: string | null }).validTo ?? stringValue(metadata.validTo) ?? null,
    assertedFrom: (node as GraphNode & { assertedFrom?: string | null }).assertedFrom ?? node.createdAt ?? new Date().toISOString(),
    assertedTo: (node as GraphNode & { assertedTo?: string | null }).assertedTo ?? null,
    source,
    metadata: {
      ...metadata,
      evidence: evidenceFromMetadata(metadata, source),
      canonicalType: normalizeType(node.type || 'unknown'),
      updatedAt: stringValue(metadata.updatedAt),
    },
  };
}

export function normalizeGraphEdge(edge: GraphEdge, index = 0): GraphEdge & BiTemporalFields {
  const source = normalizeId(edge.source);
  const target = normalizeId(edge.target);
  const type = normalizeType(edge.type || 'related_to');
  const metadata = edge.metadata ?? {};
  return {
    ...edge,
    id: normalizeId(edge.id || `${source}__${type}__${target}__${index}`),
    source,
    target,
    type,
    weight: Number.isFinite(edge.weight) ? edge.weight : 1,
    label: edge.label?.trim() || type,
    validFrom: (edge as GraphEdge & { validFrom?: string | null }).validFrom ?? stringValue(metadata.validFrom) ?? null,
    validTo: (edge as GraphEdge & { validTo?: string | null }).validTo ?? stringValue(metadata.validTo) ?? null,
    assertedFrom: (edge as GraphEdge & { assertedFrom?: string | null }).assertedFrom ?? stringValue(metadata.createdAt) ?? new Date().toISOString(),
    assertedTo: (edge as GraphEdge & { assertedTo?: string | null }).assertedTo ?? null,
    metadata: {
      ...metadata,
      evidence: evidenceFromMetadata(metadata),
      canonicalType: type,
    },
  };
}

export function normalizeCanonicalGraph(graph: GraphData | null | undefined): GraphData {
  const nodes = (graph?.nodes ?? []).map(normalizeGraphNode);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = (graph?.edges ?? [])
    .map(normalizeGraphEdge)
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  const entityTypeCounts: Record<string, number> = {};
  for (const node of nodes) entityTypeCounts[node.type] = (entityTypeCounts[node.type] ?? 0) + 1;
  const assertions = (graph?.assertions ?? [])
    .map((assertion) => TemporalAssertionSchema.safeParse(assertion))
    .filter((result) => result.success)
    .map((result) => result.data);

  return {
    ...graph,
    nodes,
    edges,
    assertions,
    version: graph?.version ?? '2.0',
    schemaVersion: CANONICAL_GRAPH_SCHEMA_VERSION,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    entityTypeCounts,
    lastUpdated: graph?.lastUpdated ?? new Date().toISOString(),
  };
}

export function buildTemporalAssertionsFromGraph(graph: GraphData): TemporalAssertion[] {
  const normalized = normalizeCanonicalGraph(graph);
  const assertions: TemporalAssertion[] = [];
  const recordedAt = normalized.lastUpdated ?? new Date().toISOString();
  for (const node of normalized.nodes) {
    const metadata = node.metadata ?? {};
    const validFrom = stringValue(metadata.valid_from) ?? stringValue(metadata.validFrom) ?? stringValue(metadata.date);
    const validTo = stringValue(metadata.valid_until) ?? stringValue(metadata.validTo);
    if (!validFrom && !validTo) continue;
    assertions.push({
      id: `${node.id}:exists:${validFrom ?? recordedAt}`,
      subjectId: node.id,
      predicate: 'exists',
      validFrom,
      validTo,
      observedAt: stringValue(metadata.observedAt),
      recordedAt,
      sourceIds: evidenceFromMetadata(metadata, node.source).map((item) => item.sourceReceiptId ?? item.documentId ?? item.url ?? '').filter(Boolean),
      confidence: typeof metadata.confidence === 'string' || typeof metadata.confidence === 'number' ? metadata.confidence : 'INFERRED',
      status: 'active',
    });
  }
  return assertions;
}
