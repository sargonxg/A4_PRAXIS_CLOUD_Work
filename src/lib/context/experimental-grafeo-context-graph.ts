import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { z } from 'zod';

export const CONTEXT_GRAPH_SCHEMA_VERSION = 'praxis-context-graph-v0';
export const DEFAULT_CONTEXT_GRAPH_BACKEND = 'firestore_lite';

export const ContextGraphBackendSchema = z.enum(['firestore_lite', 'grafeo_experimental']);
export type ContextGraphBackend = z.infer<typeof ContextGraphBackendSchema>;

export const ContextGraphPipelineSchema = z.enum([
  'policy_analysis',
  'conflict_analysis',
  'procurement_compliance',
  'humanitarian_access',
]);
export type ContextGraphPipeline = z.infer<typeof ContextGraphPipelineSchema>;

export const ContextGraphOntologySchema = z.enum([
  'policy_core',
  'conflict_ontology',
  'procurement_compliance',
  'humanitarian_access',
]);
export type ContextGraphOntology = z.infer<typeof ContextGraphOntologySchema>;

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
  ontology: ContextGraphOntologySchema.optional(),
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

export const ContextGraphMaterialSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  sourceType: z.enum(['document', 'note', 'url', 'manual', 'dialectica_export']).default('document'),
  url: z.string().url().optional(),
  citation: z.string().optional(),
});
export type ContextGraphMaterial = z.input<typeof ContextGraphMaterialSchema>;

export const ExperimentalContextGraphIngestionSchema = z.object({
  contextCoreId: z.string().min(1),
  title: z.string().min(1),
  domain: z.string().min(1).default('policy'),
  ontology: ContextGraphOntologySchema.default('policy_core'),
  pipeline: ContextGraphPipelineSchema.optional(),
  summary: z.string().default(''),
  userIntent: z.string().default(''),
  materials: z.array(ContextGraphMaterialSchema).min(1).max(25),
});
export type ExperimentalContextGraphIngestion = z.input<typeof ExperimentalContextGraphIngestionSchema>;

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

export interface ContextGraphVisualization {
  layout: 'force-directed-lite';
  nodes: Array<{
    id: string;
    label: string;
    group: ExperimentalContextGraphNodeKind;
    title: string;
    properties: Record<string, unknown>;
  }>;
  links: Array<{
    source: string;
    target: string;
    label: ExperimentalContextGraphEdge['type'];
    value: number;
  }>;
}

export interface ContextCoreEvolution {
  contextCoreId: string;
  status: 'draft' | 'review_ready';
  readinessScore: number;
  recommendedOntology: ContextGraphOntology;
  nextActions: string[];
  canEmbed: boolean;
  embedLabel: string;
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
  visualization: ContextGraphVisualization;
  evolution: ContextCoreEvolution;
  promptBlock: string;
  createdAt: string;
}

export interface ContextGraphOntologyPreset {
  id: ContextGraphOntology;
  label: string;
  recommendedPipeline: ContextGraphPipeline;
  nodeKinds: ExperimentalContextGraphNodeKind[];
  requiredFields: string[];
  standardQuestions: string[];
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

export const CONTEXT_GRAPH_ONTOLOGY_PRESETS: ContextGraphOntologyPreset[] = [
  {
    id: 'conflict_ontology',
    label: 'Conflict ontology',
    recommendedPipeline: 'conflict_analysis',
    nodeKinds: ['actor', 'event', 'claim', 'constraint', 'assumption', 'evidence_gap', 'source_receipt'],
    requiredFields: ['actors', 'events', 'claims', 'constraints', 'assumptions', 'evidenceGaps', 'sourceReceipts'],
    standardQuestions: [
      'Which actors are tied to claims or events?',
      'Which claims conflict or lack source receipts?',
      'Which constraints block a confident conflict read?',
    ],
  },
  {
    id: 'policy_core',
    label: 'Policy analysis core',
    recommendedPipeline: 'policy_analysis',
    nodeKinds: ['actor', 'event', 'claim', 'constraint', 'assumption', 'evidence_gap', 'source_receipt'],
    requiredFields: ['stakeholders', 'policyClaims', 'constraints', 'implementationRisks', 'sourceReceipts'],
    standardQuestions: [
      'What policy claims are sourced?',
      'Which constraints must shape a recommendation?',
      'What evidence is missing before a memo can be review-ready?',
    ],
  },
  {
    id: 'procurement_compliance',
    label: 'Procurement and compliance core',
    recommendedPipeline: 'procurement_compliance',
    nodeKinds: ['actor', 'event', 'claim', 'constraint', 'assumption', 'evidence_gap', 'source_receipt'],
    requiredFields: ['vendors', 'requirements', 'constraints', 'deliveryEvents', 'sourceReceipts'],
    standardQuestions: [
      'Which requirements are unsupported?',
      'Which compliance constraints are explicit?',
      'Which delivery or vendor claims need receipts?',
    ],
  },
  {
    id: 'humanitarian_access',
    label: 'Humanitarian access core',
    recommendedPipeline: 'humanitarian_access',
    nodeKinds: ['actor', 'event', 'claim', 'constraint', 'assumption', 'evidence_gap', 'source_receipt'],
    requiredFields: ['actors', 'accessEvents', 'constraints', 'needsClaims', 'protectionGaps', 'sourceReceipts'],
    standardQuestions: [
      'Which access constraints are evidenced?',
      'Which needs claims are unsupported?',
      'Which events change the current access posture?',
    ],
  },
];

export function suggestContextGraphOntologies(input: { domain?: string; userIntent?: string; text?: string }): ContextGraphOntologyPreset[] {
  const haystack = `${input.domain ?? ''} ${input.userIntent ?? ''} ${input.text ?? ''}`.toLowerCase();
  const scored = CONTEXT_GRAPH_ONTOLOGY_PRESETS.map((preset) => ({
    preset,
    score:
      (haystack.includes('conflict') || haystack.includes('ceasefire') || haystack.includes('actor') ? Number(preset.id === 'conflict_ontology') * 4 : 0) +
      (haystack.includes('procurement') || haystack.includes('vendor') || haystack.includes('compliance') ? Number(preset.id === 'procurement_compliance') * 4 : 0) +
      (haystack.includes('humanitarian') || haystack.includes('access') || haystack.includes('protection') ? Number(preset.id === 'humanitarian_access') * 4 : 0) +
      (haystack.includes('policy') || haystack.includes('memo') || haystack.includes('regulation') ? Number(preset.id === 'policy_core') * 3 : 0),
  }));
  return scored.sort((a, b) => b.score - a.score).map((item) => item.preset);
}

export function ingestMaterialsToExperimentalContextGraph(
  input: ExperimentalContextGraphIngestion,
  options: { backend?: ContextGraphBackend; now?: () => Date } = {},
): ExperimentalContextGraph {
  const parsed = ExperimentalContextGraphIngestionSchema.parse(input);
  const preset = CONTEXT_GRAPH_ONTOLOGY_PRESETS.find((item) => item.id === parsed.ontology) ?? CONTEXT_GRAPH_ONTOLOGY_PRESETS[0];
  const captured = parsed.materials.map(captureMaterial).reduce<CapturedLiteStructuredText>(
    (acc, item) => ({
      actors: uniqueStrings([...acc.actors, ...item.actors]),
      claims: [...acc.claims, ...item.claims],
      events: [...acc.events, ...item.events],
      constraints: uniqueStrings([...acc.constraints, ...item.constraints]),
      assumptions: uniqueStrings([...acc.assumptions, ...item.assumptions]),
      evidenceGaps: uniqueStrings([...acc.evidenceGaps, ...item.evidenceGaps]),
      sourceReceipts: mergeSourceReceipts([...acc.sourceReceipts, ...item.sourceReceipts]),
    }),
    { actors: [], claims: [], events: [], constraints: [], assumptions: [], evidenceGaps: [], sourceReceipts: [] },
  );

  return buildExperimentalContextGraph(
    {
      contextCoreId: parsed.contextCoreId,
      title: parsed.title,
      domain: parsed.domain,
      pipeline: parsed.pipeline ?? preset.recommendedPipeline,
      ontology: parsed.ontology,
      summary: parsed.summary || summarizeMaterials(parsed.materials),
      actors: captured.actors,
      claims: captured.claims,
      events: captured.events,
      constraints: captured.constraints,
      assumptions: captured.assumptions,
      evidenceGaps: captured.evidenceGaps,
      sourceReceipts: captured.sourceReceipts,
    },
    options,
  );
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
      ontology: merged.ontology ?? ontologyForPipeline(merged.pipeline),
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
    visualization: { layout: 'force-directed-lite', nodes: [], links: [] },
    evolution: {
      contextCoreId: merged.contextCoreId,
      status: 'draft',
      readinessScore: 0,
      recommendedOntology: merged.ontology ?? ontologyForPipeline(merged.pipeline),
      nextActions: [],
      canEmbed: false,
      embedLabel: 'Not ready to embed',
    },
    promptBlock: '',
    createdAt,
  };
  graph.visualization = buildContextGraphVisualization(graph);
  graph.evolution = evolveContextCoreFromGraph(graph, merged.ontology ?? ontologyForPipeline(merged.pipeline));
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
readiness=${graph.evolution.readinessScore}
embed=${graph.evolution.canEmbed ? 'ready' : 'not-ready'}
counts=${Object.entries(counts).map(([kind, count]) => `${kind}=${count}`).join(', ')}

Standard graph queries:
${findings || '- No findings.'}

Next context-core actions:
${graph.evolution.nextActions.map((action) => `- ${action}`).join('\n') || '- No deterministic next action.'}

Use this as a review aid only. Treat unsupported gaps and conflicting claims as gaps, not facts.`;
}

export function buildContextGraphVisualization(graph: ExperimentalContextGraph): ContextGraphVisualization {
  return {
    layout: 'force-directed-lite',
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      group: node.kind,
      title: `${node.kind}: ${node.label}`,
      properties: node.properties,
    })),
    links: graph.edges.map((edgeItem) => ({
      source: edgeItem.source,
      target: edgeItem.target,
      label: edgeItem.type,
      value: edgeItem.type === 'CONFLICTS_WITH' ? 3 : edgeItem.type === 'SUPPORTED_BY' ? 2 : 1,
    })),
  };
}

export function evolveContextCoreFromGraph(graph: ExperimentalContextGraph, ontology: ContextGraphOntology): ContextCoreEvolution {
  const counts = countKinds(graph.nodes);
  const unsupported = graph.queryResults.find((item) => item.id === 'claims_without_sources')?.count ?? 0;
  const conflicts = graph.queryResults.find((item) => item.id === 'conflicting_claims')?.count ?? 0;
  const gaps = graph.queryResults.find((item) => item.id === 'evidence_gaps')?.count ?? 0;
  const hasSource = (counts.source_receipt ?? 0) > 0;
  const hasClaims = (counts.claim ?? 0) > 0;
  const hasConstraints = (counts.constraint ?? 0) > 0;
  const hasEvents = (counts.event ?? 0) > 0;
  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      (hasSource ? 25 : 0) +
        (hasClaims ? 20 : 0) +
        (hasConstraints ? 15 : 0) +
        (hasEvents ? 15 : 0) +
        Math.max(0, 25 - unsupported * 5 - conflicts * 8 - gaps * 3),
    ),
  );
  const nextActions = [
    !hasSource ? 'Attach at least one source receipt before treating claims as grounded.' : null,
    unsupported > 0 ? `Find receipts or rewrite ${unsupported} unsupported claim(s) as gaps.` : null,
    conflicts > 0 ? `Review ${conflicts} conflicting claim pair(s) before memo synthesis.` : null,
    gaps > 0 ? `Resolve or accept ${gaps} evidence gap(s) before locking this context core.` : null,
    !hasConstraints ? 'Add explicit legal, policy, implementation, or access constraints.' : null,
    !hasEvents ? 'Add dated events so KAIROS-style temporal review can run later.' : null,
  ].filter((item): item is string => Boolean(item));

  return {
    contextCoreId: graph.contextCoreId,
    status: readinessScore >= 70 && conflicts === 0 ? 'review_ready' : 'draft',
    readinessScore,
    recommendedOntology: ontology,
    nextActions: nextActions.length ? nextActions : ['Context core is review-ready for Ask PRAXIS and memo handover.'],
    canEmbed: readinessScore >= 60 && hasSource,
    embedLabel: readinessScore >= 60 && hasSource ? 'Embeddable Context Core Lite graph' : 'Needs receipts before embedding',
  };
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

function captureMaterial(material: z.infer<typeof ContextGraphMaterialSchema>): CapturedLiteStructuredText {
  const structured = captureLiteStructuredText(material.text);
  const sourceReceipt: ContextGraphSourceReceipt = {
    id: material.id,
    title: material.title,
    url: material.url,
    citation: material.citation ?? `${material.sourceType}:${material.id}`,
    excerpt: firstSentence(material.text),
  };
  const claims = [...structured.claims];
  const constraints = [...structured.constraints];
  const assumptions = [...structured.assumptions];
  const evidenceGaps = [...structured.evidenceGaps];
  const events = [...structured.events];

  for (const sentence of splitSentences(material.text)) {
    const lower = sentence.toLowerCase();
    if (/^(actor|claim|event|constraint|assumption|gap|source)\s*:/i.test(sentence)) continue;
    if (/\b(must|shall|required|constraint|legal review|compliance|rule|policy requires)\b/.test(lower)) {
      constraints.push(sentence);
      continue;
    }
    if (/\b(assume|assuming|likely|estimate|unclear)\b/.test(lower)) {
      assumptions.push(sentence);
      continue;
    }
    if (/\b(missing|gap|unknown|unverified|unsupported|no source)\b/.test(lower)) {
      evidenceGaps.push(sentence);
      continue;
    }
    if (extractDate(sentence)) {
      events.push({ label: sentence, date: extractDate(sentence), actorIds: [], sourceIds: [material.id] });
    }
    if (sentence.length > 24) {
      claims.push({
        id: stableId('claim', `${material.id}:${sentence}`),
        text: sentence,
        kind: 'sourced_fact',
        sourceIds: [material.id],
        actorIds: [],
      });
    }
  }

  return {
    actors: structured.actors,
    claims,
    events,
    constraints: uniqueStrings(constraints),
    assumptions: uniqueStrings(assumptions),
    evidenceGaps: uniqueStrings(evidenceGaps),
    sourceReceipts: mergeSourceReceipts([sourceReceipt, ...structured.sourceReceipts]),
  };
}

function summarizeMaterials(materials: Array<z.infer<typeof ContextGraphMaterialSchema>>): string {
  const titles = materials.map((item) => item.title).slice(0, 3).join(', ');
  return `Context graph built from ${materials.length} material(s)${titles ? `: ${titles}` : ''}.`;
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
  if (pipeline === 'procurement_compliance') {
    return [...shared, 'requirements traceability', 'vendor and delivery posture', 'compliance constraint review'];
  }
  if (pipeline === 'humanitarian_access') {
    return [...shared, 'access constraint map', 'protection gap review', 'needs claim support'];
  }
  return [...shared, 'policy constraint readiness', 'stakeholder impact map', 'implementation risk posture'];
}

function ontologyForPipeline(pipeline: ContextGraphPipeline): ContextGraphOntology {
  if (pipeline === 'conflict_analysis') return 'conflict_ontology';
  if (pipeline === 'procurement_compliance') return 'procurement_compliance';
  if (pipeline === 'humanitarian_access') return 'humanitarian_access';
  return 'policy_core';
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

function splitSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+|\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 80);
}

function firstSentence(value: string): string | undefined {
  return splitSentences(value)[0]?.slice(0, 500);
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
