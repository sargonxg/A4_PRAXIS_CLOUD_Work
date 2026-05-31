import { z } from 'zod';

export const TrustGraphStatusSchema = z.enum(['enabled', 'disabled', 'degraded']);
export const TrustGraphWorkspaceModeSchema = z.enum(['owner', 'owner-capsule']);

export const TrustGraphAdvisoryHitSchema = z.object({
  id: z.string().min(1).max(200),
  text: z.string().min(1).max(4000),
  score: z.number().min(0).max(1),
  sourceId: z.string().min(1).max(240).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const TrustGraphCapsuleScopeSchema = z.object({
  uid: z.string().min(1).max(200),
  capsuleId: z.string().min(1).max(200),
  workspaceId: z.string().min(1).max(240),
  collectionId: z.string().min(1).max(240),
});

export const TrustGraphCapsuleCoreKindSchema = z.enum([
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

export const TrustGraphCapsuleSegmentSchema = z.object({
  id: z.string().min(1).max(240),
  coreKind: TrustGraphCapsuleCoreKindSchema,
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

export const TrustGraphCapsuleSyncRequestSchema = TrustGraphCapsuleScopeSchema.extend({
  capsuleVersion: z.number().int().nonnegative(),
  schemaVersion: z.string().min(1).max(80),
  sourceRefs: z.array(z.string().min(1).max(240)).default([]),
  documentRefs: z.array(z.string().min(1).max(240)).default([]),
  graphRefs: z.array(z.string().min(1).max(240)).default([]),
  toolRefs: z.array(z.string().min(1).max(240)).default([]),
  outputRefs: z.array(z.string().min(1).max(240)).default([]),
  memoryRefs: z.array(z.string().min(1).max(240)).default([]),
  ontologyRefs: z.array(z.string().min(1).max(240)).default([]),
  segments: z.array(TrustGraphCapsuleSegmentSchema).default([]),
  advisoryOnly: z.literal(true),
});

export const TrustGraphRecallRequestSchema = TrustGraphCapsuleScopeSchema.extend({
  query: z.string().min(1).max(4000),
  limit: z.number().int().positive().max(20).default(6),
  includeExplainability: z.boolean().default(true),
  advisoryOnly: z.literal(true),
});

export const TrustGraphRecallResponseSchema = z.object({
  status: TrustGraphStatusSchema,
  hits: z.array(TrustGraphAdvisoryHitSchema).default([]),
  graphCandidateIds: z.array(z.string().min(1).max(240)).default([]),
  explainabilityIds: z.array(z.string().min(1).max(240)).default([]),
  warning: z.string().min(1).max(500).optional(),
});

export const TrustGraphGraphProposalRequestSchema = TrustGraphCapsuleScopeSchema.extend({
  candidateIds: z.array(z.string().min(1).max(240)).min(1).max(100),
  advisoryOnly: z.literal(true),
});

export const TrustGraphStatusResponseSchema = TrustGraphCapsuleScopeSchema.extend({
  status: TrustGraphStatusSchema,
  syncedCapsuleVersion: z.number().int().nonnegative().nullable().default(null),
  lastSyncedAt: z.string().datetime().nullable().default(null),
  collectionReady: z.boolean().default(false),
  reason: z.string().max(500).optional(),
});

export type TrustGraphRecallResponse = z.infer<typeof TrustGraphRecallResponseSchema>;
export type TrustGraphCapsuleSyncRequest = z.infer<typeof TrustGraphCapsuleSyncRequestSchema>;
export type TrustGraphCapsuleSegment = z.infer<typeof TrustGraphCapsuleSegmentSchema>;
export type TrustGraphWorkspaceMode = z.infer<typeof TrustGraphWorkspaceModeSchema>;

export function buildTrustGraphWorkspaceId(input: {
  uid: string;
  capsuleId: string;
  mode?: string;
}): string {
  const mode = TrustGraphWorkspaceModeSchema.catch('owner-capsule').parse(input.mode);
  const uid = cleanTrustGraphIdentifier(input.uid);
  const capsuleId = cleanTrustGraphIdentifier(input.capsuleId);
  return mode === 'owner'
    ? `owner_${uid}`
    : `owner_${uid}__capsule_${capsuleId}`;
}

export function buildTrustGraphCollectionId(input: {
  uid: string;
  capsuleId: string;
  prefix?: string;
}): string {
  return [
    cleanTrustGraphIdentifier(input.prefix ?? 'praxis'),
    cleanTrustGraphIdentifier(input.uid),
    cleanTrustGraphIdentifier(input.capsuleId),
  ].join('__');
}

function cleanTrustGraphIdentifier(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'default';
}
