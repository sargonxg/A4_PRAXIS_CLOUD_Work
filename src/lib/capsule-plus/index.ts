import JSZip from 'jszip';
import { z } from 'zod';

export const CAPSULE_PLUS_SCHEMA_VERSION = 'capsule-plus.v1';
export const CAPSULE_PLUS_RUNTIME_LABEL = 'Postgres embedded graph';

export const CapsulePlusReviewStateSchema = z.enum(['draft', 'proposed', 'approved', 'rejected']);
export const CapsulePlusNodeTypeSchema = z.enum([
  'Actor',
  'Claim',
  'Commitment',
  'Decision',
  'Deadline',
  'Event',
  'OpenQuestion',
  'Output',
  'Risk',
  'Rule',
  'Source',
]);
export const CapsulePlusEdgeTypeSchema = z.enum([
  'AUTHORED_BY',
  'CITED_BY',
  'CONSTRAINS',
  'CONTRADICTS',
  'DEPENDS_ON',
  'INVOLVES',
  'OWNED_BY',
  'PRECEDES',
  'SUPPORTED_BY',
  'SUPPORTS',
  'TRIGGERS_REVIEW',
]);

export const CapsulePlusProvenanceSchema = z.object({
  sourceIds: z.array(z.string().min(1).max(160)).default([]),
  documentIds: z.array(z.string().min(1).max(160)).default([]),
  runIds: z.array(z.string().min(1).max(160)).default([]),
  confidence: z.number().min(0).max(1),
  reviewState: CapsulePlusReviewStateSchema,
}).refine(
  (value) => value.sourceIds.length > 0 || value.documentIds.length > 0 || value.runIds.length > 0,
  'Capsule+ graph provenance requires at least one source, document, or run id.',
);

const CapsulePlusRowBaseSchema = z.object({
  id: z.string().min(1).max(160),
  capsuleId: z.string().min(1).max(160),
  ownerUid: z.string().min(1).max(160),
  properties: z.record(z.string(), z.unknown()).default({}),
  provenance: CapsulePlusProvenanceSchema,
  reviewState: CapsulePlusReviewStateSchema,
});

export const CapsulePlusGraphNodeSchema = CapsulePlusRowBaseSchema.extend({
  type: CapsulePlusNodeTypeSchema,
  label: z.string().min(1).max(300),
});

export const CapsulePlusGraphEdgeSchema = CapsulePlusRowBaseSchema.extend({
  type: CapsulePlusEdgeTypeSchema,
  fromNodeId: z.string().min(1).max(160),
  toNodeId: z.string().min(1).max(160),
  label: z.string().max(300).optional(),
});

export const CapsulePlusGraphProposalSchema = z.object({
  proposalId: z.string().min(1).max(160),
  capsuleId: z.string().min(1).max(160),
  ownerUid: z.string().min(1).max(160),
  graphVersion: z.number().int().nonnegative(),
  ontologyStackId: z.string().min(1).max(160).nullable().default(null),
  reviewCardId: z.string().min(1).max(160).nullable().default(null),
  nodes: z.array(CapsulePlusGraphNodeSchema).default([]),
  edges: z.array(CapsulePlusGraphEdgeSchema).default([]),
  unsupportedClaims: z.array(z.string().min(1).max(300)).default([]),
  reviewState: CapsulePlusReviewStateSchema,
  createdAt: z.string().datetime(),
});

export const CapsulePlusManifestSchema = z.object({
  capsuleId: z.string().min(1).max(160),
  ownerUid: z.string().min(1).max(160),
  schemaVersion: z.literal(CAPSULE_PLUS_SCHEMA_VERSION),
  graphVersion: z.number().int().nonnegative(),
  exportedAt: z.string().datetime(),
  runtimeLabel: z.literal(CAPSULE_PLUS_RUNTIME_LABEL),
});

export const CapsulePlusSourceReceiptSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().min(1).max(300),
  url: z.string().max(1000).optional(),
  capturedAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const CapsulePlusBundleSchema = z.object({
  manifest: CapsulePlusManifestSchema,
  capsule: z.object({
    capsuleId: z.string().min(1).max(160),
    ownerUid: z.string().min(1).max(160),
  }).passthrough(),
  nodes: z.array(CapsulePlusGraphNodeSchema).default([]),
  edges: z.array(CapsulePlusGraphEdgeSchema).default([]),
  proposals: z.array(CapsulePlusGraphProposalSchema).default([]),
  sourceReceipts: z.array(CapsulePlusSourceReceiptSchema).default([]),
}).superRefine((bundle, ctx) => {
  const { capsuleId, ownerUid } = bundle.manifest;
  if (bundle.capsule.capsuleId !== capsuleId || bundle.capsule.ownerUid !== ownerUid) {
    ctx.addIssue({ code: 'custom', message: 'Capsule metadata must match the Capsule+ manifest.' });
  }
  for (const row of [...bundle.nodes, ...bundle.edges, ...bundle.proposals]) {
    if (row.capsuleId !== capsuleId || row.ownerUid !== ownerUid) {
      ctx.addIssue({ code: 'custom', message: 'Capsule+ graph rows must stay owner and capsule scoped.' });
    }
  }
});

export type CapsulePlusGraphNode = z.infer<typeof CapsulePlusGraphNodeSchema>;
export type CapsulePlusGraphEdge = z.infer<typeof CapsulePlusGraphEdgeSchema>;
export type CapsulePlusGraphProposal = z.infer<typeof CapsulePlusGraphProposalSchema>;
export type CapsulePlusBundle = z.infer<typeof CapsulePlusBundleSchema>;

export const DECISION_CLOCK_CAPSULE_PLUS = {
  capsuleId: 'starter-tool-decision-clock-capsule-plus',
  name: 'Decision Clock Capsule+',
  category: 'temporality / crisis / operations',
  uiLabel: 'Capsule+ Graph',
  runtimeLabel: CAPSULE_PLUS_RUNTIME_LABEL,
  purpose: 'Map deadlines, stale assumptions, actors, commitments, trigger events, and decision windows.',
  starterNodeTypes: ['Decision', 'Deadline', 'Actor', 'Claim', 'Source', 'Commitment', 'Risk', 'OpenQuestion'],
  starterEdgeTypes: ['PRECEDES', 'DEPENDS_ON', 'SUPPORTED_BY', 'OWNED_BY', 'CONSTRAINS', 'TRIGGERS_REVIEW'],
} as const;

export function buildCapsulePlusManifest(input: {
  capsuleId: string;
  ownerUid: string;
  graphVersion?: number;
  exportedAt?: string;
}) {
  return CapsulePlusManifestSchema.parse({
    capsuleId: input.capsuleId,
    ownerUid: input.ownerUid,
    schemaVersion: CAPSULE_PLUS_SCHEMA_VERSION,
    graphVersion: input.graphVersion ?? 1,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    runtimeLabel: CAPSULE_PLUS_RUNTIME_LABEL,
  });
}

export function buildPraxisCapsuleFilename(input: {
  label?: string | null;
  capsuleId: string;
  scope?: string | null;
  tags?: string[];
  exportedAt?: string;
}): string {
  const year = new Date(input.exportedAt ?? Date.now()).getUTCFullYear();
  const domainTag = input.tags?.find((tag) => tag.startsWith('domain:'))?.split(':')[1]
    ?? input.tags?.find((tag) => /^[a-z][a-z0-9-]{2,32}$/i.test(tag));
  const prefix = cleanFilenamePart(domainTag ?? input.scope ?? input.label ?? 'capsule').toLowerCase() || 'capsule';
  const code = cleanFilenamePart(input.capsuleId).replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  return `${prefix}_${code}_${year}.praxis`;
}

export async function buildCapsulePlusExportBundle(input: CapsulePlusBundle): Promise<Buffer> {
  const bundle = CapsulePlusBundleSchema.parse(input);
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify(bundle.manifest, null, 2));
  zip.file('capsule.json', JSON.stringify(bundle.capsule, null, 2));
  zip.file('graph/nodes.jsonl', toJsonl(bundle.nodes));
  zip.file('graph/edges.jsonl', toJsonl(bundle.edges));
  zip.file('graph/proposals.jsonl', toJsonl(bundle.proposals));
  zip.file('receipts/source-receipts.jsonl', toJsonl(bundle.sourceReceipts));
  zip.file('sql/postgres-seed.sql', buildPostgresSeedSql(bundle));
  zip.file('README.md', buildBundleReadme(bundle));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function parseCapsulePlusImportBundle(
  buffer: Buffer | ArrayBuffer | Uint8Array,
  options: { ownerUid: string },
): Promise<CapsulePlusBundle> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const manifest = CapsulePlusManifestSchema.parse(JSON.parse(await requiredZipText(zip, 'manifest.json')));
    if (manifest.ownerUid !== options.ownerUid) {
      throw new Error('Capsule+ bundle owner does not match authenticated user.');
    }
    const bundle = CapsulePlusBundleSchema.parse({
      manifest,
      capsule: JSON.parse(await requiredZipText(zip, 'capsule.json')),
      nodes: parseJsonl(await optionalZipText(zip, 'graph/nodes.jsonl'), CapsulePlusGraphNodeSchema),
      edges: parseJsonl(await optionalZipText(zip, 'graph/edges.jsonl'), CapsulePlusGraphEdgeSchema),
      proposals: parseJsonl(await optionalZipText(zip, 'graph/proposals.jsonl'), CapsulePlusGraphProposalSchema),
      sourceReceipts: parseJsonl(await optionalZipText(zip, 'receipts/source-receipts.jsonl'), CapsulePlusSourceReceiptSchema),
    });
    if ([...bundle.nodes, ...bundle.edges].some((row) => row.reviewState === 'rejected')) {
      throw new Error('Rejected Capsule+ graph rows cannot be imported as canonical rows.');
    }
    return bundle;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown parse failure';
    throw new Error(`Invalid Capsule+ bundle: ${message}`);
  }
}

export function buildPostgresSeedSql(bundle: CapsulePlusBundle): string {
  const parsed = CapsulePlusBundleSchema.parse(bundle);
  const statements = [
    '-- PRAXIS Capsule+ v1 Postgres seed',
    '-- Import through PRAXIS when possible so review and ownership gates are enforced.',
    'BEGIN;',
  ];
  for (const node of parsed.nodes) {
    statements.push(`INSERT INTO graph_nodes (id, owner_uid, capsule_id, node_type, label, properties, provenance, review_state)
VALUES (${sql(node.id)}, ${sql(node.ownerUid)}, ${sql(node.capsuleId)}, ${sql(node.type)}, ${sql(node.label)}, ${sqlJson(node.properties)}, ${sqlJson(node.provenance)}, ${sql(node.reviewState)})
ON CONFLICT (id) DO NOTHING;`);
  }
  for (const edge of parsed.edges) {
    statements.push(`INSERT INTO graph_edges (id, owner_uid, capsule_id, from_node_id, to_node_id, edge_type, label, properties, provenance, review_state)
VALUES (${sql(edge.id)}, ${sql(edge.ownerUid)}, ${sql(edge.capsuleId)}, ${sql(edge.fromNodeId)}, ${sql(edge.toNodeId)}, ${sql(edge.type)}, ${sql(edge.label ?? null)}, ${sqlJson(edge.properties)}, ${sqlJson(edge.provenance)}, ${sql(edge.reviewState)})
ON CONFLICT (id) DO NOTHING;`);
  }
  statements.push('COMMIT;');
  return `${statements.join('\n')}\n`;
}

function buildBundleReadme(bundle: CapsulePlusBundle): string {
  return [
    `# ${String(bundle.capsule.label ?? bundle.manifest.capsuleId)}`,
    '',
    'This is a portable PRAXIS Capsule+ bundle.',
    '',
    `- Schema: ${bundle.manifest.schemaVersion}`,
    `- Runtime: ${bundle.manifest.runtimeLabel}`,
    `- Graph version: ${bundle.manifest.graphVersion}`,
    `- Nodes: ${bundle.nodes.length}`,
    `- Edges: ${bundle.edges.length}`,
    `- Proposals: ${bundle.proposals.length}`,
    '',
    'Import through PRAXIS to preserve owner checks and review-gated graph promotion.',
  ].join('\n');
}

function toJsonl(rows: unknown[]): string {
  return rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '');
}

function cleanFilenamePart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

function parseJsonl<T>(text: string, schema: z.ZodType<T>): T[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => schema.parse(JSON.parse(line)));
}

async function requiredZipText(zip: JSZip, path: string): Promise<string> {
  const file = zip.file(path);
  if (!file) throw new Error(`${path} is missing`);
  return file.async('string');
}

async function optionalZipText(zip: JSZip, path: string): Promise<string> {
  return zip.file(path)?.async('string') ?? '';
}

function sql(value: string | null): string {
  if (value === null) return 'NULL';
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown): string {
  return `${sql(JSON.stringify(value))}::jsonb`;
}
