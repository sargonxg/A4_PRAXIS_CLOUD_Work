import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { z } from 'zod';

export const CONTEXT_GRAPH_SCHEMA_VERSION = 'praxis-context-graph-v0';
export const DEFAULT_CONTEXT_GRAPH_BACKEND = 'firestore_lite';

export const ContextGraphBackendSchema = z.enum(['firestore_lite', 'grafeo_experimental']);
export type ContextGraphBackend = z.infer<typeof ContextGraphBackendSchema>;

export const ContextGraphPipelineSchema = z.enum(['policy_analysis', 'conflict_analysis']);
export type ContextGraphPipeline = z.infer<typeof ContextGraphPipelineSchema>;

export const ContextGraphClaimKindSchema = z.enum([
  'sourced_fact',
  'inferred_claim',
  'assumption',
  'unsupported_gap',
  'conflicting_claim',
]);
export type ContextGraphClaimKind = z.infer<typeof ContextGraphClaimKindSchema>;

export const SourceReceiptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url().optional(),
  citation: z.string().optional(),
  excerpt: z.string().optional(),
});
export type ContextGraphSourceReceipt = z.infer<typeof SourceReceiptSchema>;

const ClaimInputSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  kind: ContextGraphClaimKindSchema.default('inferred_claim'),
  sourceIds: z.array(z.string()).default([]),
  actorIds: z.array(z.string()).default([]),
});

const EventInputSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  date: z.string().optional(),
  actorIds: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).default([]),
});

export const ExperimentalContextGraphInputSchema = z.object({
  contextCoreId: z.string().min(1),
  title: z.string().min(1),
  domain: z.string().min(1).default('policy'),
  pipeline: ContextGraphPipelineSchema.default('policy_analysis'),
  summary: z.string().default(''),
  rawText: z.string().default(''),
  actors: z.array(z.string()).default([]),
  claims: z.array(ClaimInputSchema).default([]),
  events: z.array(EventInputSchema).default([]),
  constraints: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  evidenceGaps: z.array(z.string()).default([]),
  sourceReceipts: z.array(SourceReceiptSchema).default([]),
});
export type ExperimentalContextGraphInput = z.input<typeof ExperimentalContextGraphInputSchema>;
type ParsedExperimentalContextGraphInput = z.infer<typeof ExperimentalContextGraphInputSchema>;
type CapturedLiteStructuredText = Pick<
  ParsedExperimentalContextGraphInput,
  'actors' | 'claims' | 'events' | 'constraints' | 'assumptions' | 'evidenceGaps' | 'sourceReceipts'
>;

export type ExperimentalContextGraphNodeKind =
  | 'context_core'
  | 'actor'
  | 'event'
  | 'claim'
  | 'constraint'
  | 'assumption'
  | 'evidence_gap'
  | 'source_receipt'
  | 'analysis_standard';

export interface ExperimentalContextGraphNode {
  id: string;
  kind: ExperimentalContextGraphNodeKind;
  label: string;
  properties: Record<string, unknown>;
}

export interface ExperimentalContextGraphEdge {
  id: string;
  source: string;
  target: string;
  type:
    | 'HAS_ACTOR'
    | 'HAS_EVENT'
    | 'HAS_CLAIM'
    | 'HAS_CONSTRAINT'
    | 'HAS_ASSUMPTION'
    | 'HAS_GAP'
    | 'HAS_SOURCE'
    | 'SUPPORTED_BY'
    | 'INVOLVES_ACTOR'
    | 'CONFLICTS_WITH'
    | 'EVALUATED_BY';
  properties: Record<string, unknown>;
}

export interface ContextGraphQueryResult {
  id: string;
  label: string;
  purpose: string;
  gql: string;
  count: number;
  findings: string[];
}

export interface ExperimentalContextGraph {
  schemaVersion: typeof CONTEXT_GRAPH_SCHEMA_VERSION;
  backend: ContextGraphBackend;
  contextCoreId: string;
  title: string;
  domain: string;
  pipeline: ContextGraphPipeline;
  nodes: ExperimentalContextGraphNode[];
  edges: ExperimentalContextGraphEdge[];
  queryResults: ContextGraphQueryResult[];
  promptBlock: string;
  createdAt: string;
}

export interface GrafeoMirrorResult {
  enabled: boolean;
  ok: boolean;
  backend: ContextGraphBackend;
  nodeCount: number;
  edgeCount: number;
  artifactPath?: string;
  error?: string;
}

type GrafeoDb = {
  createNode(labels: string[], properties?: object | null): { id: number };
  createEdge(sourceId: number, targetId: number, edgeType: string, properties?: object | null): { id: number };
  save(path: string): void;
  close(): void;
  version?: () => string;
};

export function resolveContextGraphBackend(value = process.env.PRAXIS_CONTEXT_GRAPH_BACKEND): ContextGraphBackend {
  const parsed = ContextGraphBackendSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_CONTEXT_GRAPH_BACKEND;
}

export function buildExperimentalContextGraph(
  input: ExperimentalContextGraphInput,
  options: { backend?: ContextGraphBackend; now?: () => Date } = {},
): ExperimentalContextGraph {
  const parsed = ExperimentalContextGraphInputSchema.parse(input);
  const captured = captureLiteStructuredText(parsed.rawText);
  const merged: ParsedExperimentalContextGraphInput = {
    ...parsed,
    actors: uniqueStrings([...parsed.actors, ...captured.actors]),
    claims: [...parsed.claims, ...captured.claims],
    events: [...parsed.events, ...captured.events],
    constraints: uniqueStrings([...parsed.constraints, ...captured.constraints]),
    assumptions: uniqueStrings([...parsed.assumptions, ...captured.assumptions]),
    evidenceGaps: uniqueStrings([...parsed.evidenceGaps, ...captured.evidenceGaps]),
    sourceReceipts: mergeSourceReceipts([...parsed.sourceReceipts, ...captured.sourceReceipts]),
  };

  const createdAt = (options.now?.() ?? new Date()).toISOString();
  const nodes: ExperimentalContextGraphNode[] = [];
  const edges: ExperimentalContextGraphEdge[] = [];
  const contextId = stableId('context', merged.contextCoreId);

  nodes.push({
    id: contextId,
    kind: 'context_core',
    label: merged.title,
    properties: {
      contextCoreId: merged.contextCoreId,
      domain: merged.domain,
      pipeline: merged.pipeline,
      summary: merged.summary,
      createdAt,
      source: 'praxis_context_core_lite',
    },
  });

  const actorIds = new Map<string, string>();
  for (const actor of merged.actors) {
    const id = stableId('actor', actor);
    actorIds.set(actor, id);
    nodes.push({ id, kind: 'actor', label: actor, properties: { name: actor } });
    edges.push(edge(contextId, id, 'HAS_ACTOR'));
  }

  const sourceIds = new Set<string>();
  for (const source of merged.sourceReceipts) {
    const id = stableId('source', source.id);
    sourceIds.add(source.id);
    nodes.push({
      id,
      kind: 'source_receipt',
      label: source.title,
      properties: { ...source },
    });
    edges.push(edge(contextId, id, 'HAS_SOURCE'));
  }

  const claimNodes: ExperimentalContextGraphNode[] = [];
  for (const claim of merged.claims) {
    const id = stableId('claim', claim.id ?? claim.text);
    const node: ExperimentalContextGraphNode = {
      id,
      kind: 'claim',
      label: claim.text,
      properties: {
        text: claim.text,
        kind: claim.kind,
        sourceIds: claim.sourceIds,
        actorIds: claim.actorIds,
        hasSource: claim.sourceIds.some((sourceId) => sourceIds.has(sourceId)),
      },
    };
    nodes.push(node);
    claimNodes.push(node);
    edges.push(edge(contextId, id, 'HAS_CLAIM', { kind: claim.kind }));
    for (const sourceId of claim.sourceIds) {
      edges.push(edge(id, stableId('source', sourceId), 'SUPPORTED_BY'));
    }
    for (const actorId of resolveActorRefs(claim.actorIds, actorIds)) {
      edges.push(edge(id, actorId, 'INVOLVES_ACTOR'));
    }
  }

  for (const pair of detectConflictingClaimPairs(claimNodes)) {
    edges.push(edge(pair[0].id, pair[1].id, 'CONFLICTS_WITH', { reason: 'deterministic polarity mismatch' }));
  }

  for (const eventItem of merged.events) {
    const id = stableId('event', eventItem.id ?? `${eventItem.label}:${eventItem.date ?? ''}`);
    nodes.push({
      id,
      kind: 'event',
      label: eventItem.label,
      properties: { label: eventItem.label, date: eventItem.date, sourceIds: eventItem.sourceIds },
    });
    edges.push(edge(contextId, id, 'HAS_EVENT', { date: eventItem.date }));
    for (const actorId of resolveActorRefs(eventItem.actorIds, actorIds)) {
      edges.push(edge(id, actorId, 'INVOLVES_ACTOR'));
    }
  }

  for (const value of merged.constraints) {
    const id = stableId('constraint', value);
    nodes.push({ id, kind: 'constraint', label: value, properties: { text: value } });
    edges.push(edge(contextId, id, 'HAS_CONSTRAINT'));
  }

  for (const value of merged.assumptions) {
    const id = stableId('assumption', value);
    nodes.push({ id, kind: 'assumption', label: value, properties: { text: value } });
    edges.push(edge(contextId, id, 'HAS_ASSUMPTION'));
  }

  for (const value of merged.evidenceGaps) {
    const id = stableId('gap', value);
    nodes.push({ id, kind: 'evidence_gap', label: value, properties: { text: value, severity: inferGapSeverity(value) } });
    edges.push(edge(contextId, id, 'HAS_GAP'));
  }

  for (const standard of standardsForPipeline(merged.pipeline)) {
    const id = stableId('standard', standard);
    nodes.push({ id, kind: 'analysis_standard', label: standard, properties: { pipeline: merged.pipeline } });
    edges.push(edge(contextId, id, 'EVALUATED_BY'));
  }

  const queryResults = runStandardContextGraphQueries({ nodes, edges, pipeline: merged.pipeline });
  const graph: ExperimentalContextGraph = {
    schemaVersion: CONTEXT_GRAPH_SCHEMA_VERSION,
    backend: options.backend ?? DEFAULT_CONTEXT_GRAPH_BACKEND,
    contextCoreId: merged.contextCoreId,
    title: merged.title,
    domain: merged.domain,
    pipeline: merged.pipeline,
    nodes,
    edges,
    queryResults,
    promptBlock: '',
    createdAt,
  };
  graph.promptBlock = renderExperimentalContextGraphPromptBlock(graph);
  return graph;
}

export async function mirrorContextGraphToGrafeo(
  graph: ExperimentalContextGraph,
  options: { backend?: ContextGraphBackend; artifactPath?: string | null } = {},
): Promise<GrafeoMirrorResult> {
  const backend = options.backend ?? resolveContextGraphBackend();
  if (backend !== 'grafeo_experimental') {
    return { enabled: false, ok: true, backend, nodeCount: graph.nodes.length, edgeCount: graph.edges.length };
  }

  let db: GrafeoDb | null = null;
  try {
    const { GrafeoDB } = await loadGrafeoModule();
    db = GrafeoDB.create() as GrafeoDb;
    const grafeoIds = new Map<string, number>();
    for (const node of graph.nodes) {
      const created = db.createNode([toGrafeoLabel(node.kind)], {
        id: node.id,
        label: node.label,
        kind: node.kind,
        ...sanitizeGrafeoProperties(node.properties),
      });
      grafeoIds.set(node.id, created.id);
    }
    for (const relation of graph.edges) {
      const source = grafeoIds.get(relation.source);
      const target = grafeoIds.get(relation.target);
      if (source === undefined || target === undefined) continue;
      db.createEdge(source, target, relation.type, {
        id: relation.id,
        source: relation.source,
        target: relation.target,
        ...sanitizeGrafeoProperties(relation.properties),
      });
    }

    const artifactPath = resolveGrafeoArtifactPath(graph, options.artifactPath);
    if (artifactPath) {
      await mkdir(dirname(artifactPath), { recursive: true });
      db.save(artifactPath);
    }
    return {
      enabled: true,
      ok: true,
      backend,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      artifactPath: artifactPath ?? undefined,
    };
  } catch (err) {
    return {
      enabled: true,
      ok: false,
      backend,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      artifactPath: options.artifactPath ?? undefined,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    db?.close();
  }
}

async function loadGrafeoModule(): Promise<{ GrafeoDB: { create: () => GrafeoDb } }> {
  // Keep the optional native/asset-heavy Grafeo package out of normal Next.js
  // route tracing. The experimental mirror path is disabled unless explicitly
  // requested with backend=grafeo_experimental.
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<{ GrafeoDB: { create: () => GrafeoDb } }>;
  return dynamicImport('@grafeo-db/js');
}

export function renderExperimentalContextGraphPromptBlock(graph: ExperimentalContextGraph): string {
  const counts = countKinds(graph.nodes);
  const findings = graph.queryResults
    .map((result) => `- ${result.label}: ${result.count} finding(s)${result.findings.length ? `; ${result.findings.join('; ')}` : ''}`)
    .join('\n');
  return `## Experimental PRAXIS Context Graph
schema=${graph.schemaVersion}
backend=${graph.backend}
contextCoreId=${graph.contextCoreId}
pipeline=${graph.pipeline}
domain=${graph.domain}
nodes=${graph.nodes.length}
edges=${graph.edges.length}
counts=${Object.entries(counts).map(([kind, count]) => `${kind}=${count}`).join(', ')}

Standard graph queries:
${findings || '- No findings.'}

Use this as a review aid only. Treat unsupported gaps and conflicting claims as gaps, not facts.`;
}

function runStandardContextGraphQueries(input: {
  nodes: ExperimentalContextGraphNode[];
  edges: ExperimentalContextGraphEdge[];
  pipeline: ContextGraphPipeline;
}): ContextGraphQueryResult[] {
  const claims = input.nodes.filter((node) => node.kind === 'claim');
  const gaps = input.nodes.filter((node) => node.kind === 'evidence_gap');
  const assumptions = input.nodes.filter((node) => node.kind === 'assumption');
  const events = input.nodes.filter((node) => node.kind === 'event');
  const conflictEdges = input.edges.filter((edgeItem) => edgeItem.type === 'CONFLICTS_WITH');
  const unsupportedClaims = claims.filter((node) => node.properties.kind === 'unsupported_gap' || node.properties.hasSource === false);
  const constraints = input.nodes.filter((node) => node.kind === 'constraint');

  return [
    {
      id: 'claims_without_sources',
      label: 'Claims without source receipts',
      purpose: 'Prevent unsourced facts from entering Ask PRAXIS as settled context.',
      gql: "MATCH (c:Claim) WHERE c.hasSource = false RETURN c.id, c.label",
      count: unsupportedClaims.length,
      findings: unsupportedClaims.map((node) => node.label).slice(0, 6),
    },
    {
      id: 'conflicting_claims',
      label: 'Conflicting claims',
      purpose: 'Keep contradiction visible during policy or conflict analysis.',
      gql: "MATCH (a:Claim)-[:CONFLICTS_WITH]->(b:Claim) RETURN a.label, b.label",
      count: conflictEdges.length,
      findings: conflictEdges.map((edgeItem) => `${labelFor(input.nodes, edgeItem.source)} conflicts with ${labelFor(input.nodes, edgeItem.target)}`).slice(0, 6),
    },
    {
      id: 'assumption_load',
      label: 'Assumption load',
      purpose: 'Expose how much of the core depends on analyst assumptions.',
      gql: "MATCH (a:Assumption) RETURN count(a)",
      count: assumptions.length,
      findings: assumptions.map((node) => node.label).slice(0, 6),
    },
    {
      id: 'evidence_gaps',
      label: 'Evidence gaps',
      purpose: 'List missing evidence before memo drafting or handover.',
      gql: "MATCH (g:EvidenceGap) RETURN g.label, g.severity",
      count: gaps.length,
      findings: gaps.map((node) => `${node.label} (${String(node.properties.severity ?? 'medium')})`).slice(0, 6),
    },
    {
      id: 'temporal_coverage',
      label: 'Temporal coverage',
      purpose: 'Check whether the context has dated events for change-over-time analysis.',
      gql: "MATCH (e:Event) RETURN e.date, e.label ORDER BY e.date",
      count: events.filter((node) => Boolean(node.properties.date)).length,
      findings: events.map((node) => `${String(node.properties.date ?? 'undated')}: ${node.label}`).slice(0, 6),
    },
    {
      id: input.pipeline === 'conflict_analysis' ? 'conflict_constraint_readiness' : 'policy_constraint_readiness',
      label: input.pipeline === 'conflict_analysis' ? 'Conflict constraint readiness' : 'Policy constraint readiness',
      purpose: 'Verify the core has explicit constraints before recommendation or risk synthesis.',
      gql: "MATCH (c:Constraint) RETURN c.label",
      count: constraints.length,
      findings: constraints.map((node) => node.label).slice(0, 6),
    },
  ];
}

function captureLiteStructuredText(rawText: string): CapturedLiteStructuredText {
  const result: CapturedLiteStructuredText = {
    actors: [],
    claims: [],
    events: [],
    constraints: [],
    assumptions: [],
    evidenceGaps: [],
    sourceReceipts: [],
  };
  for (const line of rawText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
    const match = /^(actor|claim|event|constraint|assumption|gap|source)\s*:\s*(.+)$/i.exec(line);
    if (!match) continue;
    const [, kind, value] = match;
    if (kind.toLowerCase() === 'actor') result.actors.push(value);
    if (kind.toLowerCase() === 'claim') result.claims.push({ text: value, kind: inferClaimKind(value), sourceIds: [], actorIds: [] });
    if (kind.toLowerCase() === 'event') result.events.push({ label: value, date: extractDate(value), actorIds: [], sourceIds: [] });
    if (kind.toLowerCase() === 'constraint') result.constraints.push(value);
    if (kind.toLowerCase() === 'assumption') result.assumptions.push(value);
    if (kind.toLowerCase() === 'gap') result.evidenceGaps.push(value);
    if (kind.toLowerCase() === 'source') {
      const id = stableId('source', value);
      result.sourceReceipts.push({ id, title: value });
    }
  }
  return result;
}

function inferClaimKind(value: string): ContextGraphClaimKind {
  const text = value.toLowerCase();
  if (text.includes('unsupported') || text.includes('unknown')) return 'unsupported_gap';
  if (text.includes('conflict') || text.includes('contradict')) return 'conflicting_claim';
  if (text.includes('assume') || text.includes('likely')) return 'assumption';
  return 'inferred_claim';
}

function detectConflictingClaimPairs(nodes: ExperimentalContextGraphNode[]): [ExperimentalContextGraphNode, ExperimentalContextGraphNode][] {
  const pairs: [ExperimentalContextGraphNode, ExperimentalContextGraphNode][] = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = String(nodes[i].properties.text ?? nodes[i].label).toLowerCase();
      const b = String(nodes[j].properties.text ?? nodes[j].label).toLowerCase();
      if (sharesToken(a, b) && hasPolarityMismatch(a, b)) pairs.push([nodes[i], nodes[j]]);
    }
  }
  return pairs;
}

function hasPolarityMismatch(a: string, b: string): boolean {
  const neg = /\b(no|not|never|cannot|without|failed|denies|rejects)\b/;
  const pos = /\b(has|will|can|supports|confirms|accepts|commits|requires)\b/;
  return (neg.test(a) && pos.test(b)) || (pos.test(a) && neg.test(b));
}

function sharesToken(a: string, b: string): boolean {
  const stop = new Set(['the', 'and', 'that', 'with', 'from', 'this', 'will', 'can', 'has']);
  const tokens = new Set(a.split(/[^a-z0-9]+/).filter((item) => item.length > 3 && !stop.has(item)));
  return b.split(/[^a-z0-9]+/).some((item) => tokens.has(item));
}

function standardsForPipeline(pipeline: ContextGraphPipeline): string[] {
  const shared = ['source coverage', 'claim support', 'assumption load', 'evidence gap pressure', 'temporal coverage'];
  if (pipeline === 'conflict_analysis') {
    return [...shared, 'actor commitment map', 'conflicting claim review', 'constraint and risk posture'];
  }
  return [...shared, 'policy constraint readiness', 'stakeholder impact map', 'implementation risk posture'];
}

function edge(
  source: string,
  target: string,
  type: ExperimentalContextGraphEdge['type'],
  properties: Record<string, unknown> = {},
): ExperimentalContextGraphEdge {
  return {
    id: stableId('edge', `${source}:${type}:${target}:${JSON.stringify(properties)}`),
    source,
    target,
    type,
    properties,
  };
}

function stableId(prefix: string, value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 96);
  return `${prefix}:${normalized || 'item'}`;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function mergeSourceReceipts(values: ContextGraphSourceReceipt[]): ContextGraphSourceReceipt[] {
  const byId = new Map<string, ContextGraphSourceReceipt>();
  for (const value of values) byId.set(value.id, value);
  return [...byId.values()];
}

function resolveActorRefs(values: string[], actorIds: Map<string, string>): string[] {
  return values.map((value) => actorIds.get(value) ?? stableId('actor', value)).filter(Boolean);
}

function extractDate(value: string): string | undefined {
  return /\b\d{4}-\d{2}-\d{2}\b/.exec(value)?.[0] ?? /\b\d{4}\b/.exec(value)?.[0];
}

function inferGapSeverity(value: string): 'high' | 'medium' | 'low' {
  const text = value.toLowerCase();
  if (text.includes('legal') || text.includes('source') || text.includes('missing') || text.includes('contradict')) return 'high';
  if (text.includes('date') || text.includes('actor')) return 'medium';
  return 'low';
}

function countKinds(nodes: ExperimentalContextGraphNode[]): Record<string, number> {
  return nodes.reduce<Record<string, number>>((acc, node) => {
    acc[node.kind] = (acc[node.kind] ?? 0) + 1;
    return acc;
  }, {});
}

function labelFor(nodes: ExperimentalContextGraphNode[], id: string): string {
  return nodes.find((node) => node.id === id)?.label ?? id;
}

function toGrafeoLabel(kind: ExperimentalContextGraphNodeKind): string {
  return kind.split('_').map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join('');
}

function sanitizeGrafeoProperties(properties: Record<string, unknown>): Record<string, string | number | boolean> {
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') clean[key] = value;
    else if (Array.isArray(value)) clean[key] = value.join(',');
  }
  return clean;
}

function resolveGrafeoArtifactPath(graph: ExperimentalContextGraph, explicit?: string | null): string | null {
  if (explicit) return explicit;
  const root = process.env.PRAXIS_GRAFEO_CONTEXT_DIR;
  if (!root) return null;
  return join(root, `${stableId('core', graph.contextCoreId).replace(/:/g, '-')}.grafeo`);
}
