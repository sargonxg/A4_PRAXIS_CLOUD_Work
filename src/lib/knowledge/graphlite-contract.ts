import { z } from 'zod';

export const GRAPHLITE_CLI_CRATE = 'gql-cli';
export const GRAPHLITE_CLI_VERSION = '0.0.1';

export const GraphLiteStatusSchema = z.enum(['enabled', 'disabled', 'degraded']);
export const GraphLiteWorkspaceModeSchema = z.enum(['owner', 'owner-capsule']);

export const GraphLiteAdvisoryHitSchema = z.object({
  id: z.string().min(1).max(200),
  text: z.string().min(1).max(4000),
  score: z.number().min(0).max(1),
  sourceId: z.string().min(1).max(240).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const GraphLiteCapsuleScopeSchema = z.object({
  uid: z.string().min(1).max(200),
  capsuleId: z.string().min(1).max(200),
  workspaceId: z.string().min(1).max(240),
  collectionId: z.string().min(1).max(240),
});

export const GraphLiteCapsuleCoreKindSchema = z.enum([
  'identity',
  'user',
  'situation',
  'path',
  'source',
  'document',
  'graph',
  'time',
  'tool',
  'objective',
  'product',
  'output',
  'memory',
  'ontology',
  'governance',
  'review',
]);

export const GraphLiteCapsuleSegmentSchema = z.object({
  id: z.string().min(1).max(240),
  coreKind: GraphLiteCapsuleCoreKindSchema,
  label: z.string().min(1).max(300),
  text: z.string().min(1).max(4000),
  refIds: z.array(z.string().min(1).max(240)).default([]),
  sourceIds: z.array(z.string().min(1).max(240)).default([]),
  documentIds: z.array(z.string().min(1).max(240)).default([]),
  runIds: z.array(z.string().min(1).max(240)).default([]),
  ontologyIds: z.array(z.string().min(1).max(240)).default([]),
  advisoryOnly: z.literal(true),
  reviewRequired: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const GraphLiteCapsuleSyncRequestSchema = GraphLiteCapsuleScopeSchema.extend({
  capsuleVersion: z.number().int().nonnegative(),
  schemaVersion: z.string().min(1).max(80),
  sourceRefs: z.array(z.string().min(1).max(240)).default([]),
  documentRefs: z.array(z.string().min(1).max(240)).default([]),
  graphRefs: z.array(z.string().min(1).max(240)).default([]),
  toolRefs: z.array(z.string().min(1).max(240)).default([]),
  outputRefs: z.array(z.string().min(1).max(240)).default([]),
  memoryRefs: z.array(z.string().min(1).max(240)).default([]),
  ontologyRefs: z.array(z.string().min(1).max(240)).default([]),
  segments: z.array(GraphLiteCapsuleSegmentSchema).default([]),
  advisoryOnly: z.literal(true),
});

export const GraphLiteRecallRequestSchema = GraphLiteCapsuleScopeSchema.extend({
  query: z.string().min(1).max(4000),
  limit: z.number().int().positive().max(20).default(6),
  includeExplainability: z.boolean().default(true),
  advisoryOnly: z.literal(true),
});

export const GraphLiteRecallResponseSchema = z.object({
  status: GraphLiteStatusSchema,
  hits: z.array(GraphLiteAdvisoryHitSchema).default([]),
  graphCandidateIds: z.array(z.string().min(1).max(240)).default([]),
  explainabilityIds: z.array(z.string().min(1).max(240)).default([]),
  warning: z.string().min(1).max(500).optional(),
});

export const GraphLiteGraphProposalRequestSchema = GraphLiteCapsuleScopeSchema.extend({
  candidateIds: z.array(z.string().min(1).max(240)).min(1).max(100),
  advisoryOnly: z.literal(true),
});

export const GraphLiteStatusResponseSchema = GraphLiteCapsuleScopeSchema.extend({
  status: GraphLiteStatusSchema,
  syncedCapsuleVersion: z.number().int().nonnegative().nullable().default(null),
  lastSyncedAt: z.string().datetime().nullable().default(null),
  collectionReady: z.boolean().default(false),
  reason: z.string().max(500).optional(),
});

export type GraphLiteRecallResponse = z.infer<typeof GraphLiteRecallResponseSchema>;
export type GraphLiteCapsuleSyncRequest = z.infer<typeof GraphLiteCapsuleSyncRequestSchema>;
export type GraphLiteCapsuleSegment = z.infer<typeof GraphLiteCapsuleSegmentSchema>;
export type GraphLiteWorkspaceMode = z.infer<typeof GraphLiteWorkspaceModeSchema>;

export function buildGraphLiteWorkspaceId(input: {
  uid: string;
  capsuleId: string;
  mode?: string;
}): string {
  const mode = GraphLiteWorkspaceModeSchema.catch('owner-capsule').parse(input.mode);
  const uid = cleanGraphLiteIdentifier(input.uid);
  const capsuleId = cleanGraphLiteIdentifier(input.capsuleId);
  return mode === 'owner'
    ? `owner_${uid}`
    : `owner_${uid}__capsule_${capsuleId}`;
}

export function buildGraphLiteCollectionId(input: {
  uid: string;
  capsuleId: string;
  prefix?: string;
}): string {
  return [
    cleanGraphLiteIdentifier(input.prefix ?? 'praxis'),
    cleanGraphLiteIdentifier(input.uid),
    cleanGraphLiteIdentifier(input.capsuleId),
  ].join('__');
}

function cleanGraphLiteIdentifier(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'default';
}
