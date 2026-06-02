import { z } from 'zod';

import { deriveCapsuleQuality, type CapsuleQualityResult } from '@/lib/context/capsule-quality';
import {
  normalizeContextCapsuleV2,
  type ContextCapsuleNormalizeOptions,
  type ContextCapsuleV2,
} from '@/lib/context/capsule-v2';
import { migrateContextCapsuleV3ClaimLedger, normalizeContextCapsuleV3, type ContextCapsuleV3 } from '@/lib/context/capsule-v3';

export type CapsuleSchemaVersion = 1 | 2 | 3;
export type PraxisCapsuleV3 = ContextCapsuleV3;

export type CapsuleReadinessTier = 'red' | 'amber' | 'green';

export interface CapsuleReadinessBlock {
  score: number;
  tier: CapsuleReadinessTier;
  breakdown: Array<{
    id: string;
    label: string;
    score: number;
    maxScore: number;
  }>;
  diagnostics: Array<{
    code: string;
    message: string;
  }>;
  computedAt: string;
}

export const CapsuleV1Schema = z.object({
  schemaVersion: z.literal(1),
  capsuleId: z.string().min(1).max(160),
  ownerUid: z.string().min(1).max(160),
}).passthrough();

export const CapsuleV2Schema = z.object({
  schemaVersion: z.literal(2),
  capsuleId: z.string().min(1).max(160),
  ownerUid: z.string().min(1).max(160),
}).passthrough();

export const CapsuleV3Schema = z.object({
  schemaVersion: z.literal(3),
}).passthrough();

const EvidenceReceiptStanceSchema = z.enum(['supports', 'contradicts', 'mixed']);

export const EvidenceReceiptSchema = z.object({
  sourceId: z.string().min(1).max(160),
  url: z.string().max(1000).nullable().optional(),
  publisher: z.string().max(240).nullable().optional(),
  date: z.string().max(80).nullable().optional(),
  reliabilityTier: z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable().optional(),
  snippet: z.string().min(1).max(2000),
  charOffset: z.object({
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative(),
  }).nullable().optional(),
  page: z.number().int().positive().nullable().optional(),
  embedding: z.array(z.number()).max(1536).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  stance: EvidenceReceiptStanceSchema.optional(),
}).strict();

export const CapsuleClaimCausalLinksSchema = z.object({
  causes: z.array(z.string().min(1).max(160)).max(25).optional(),
  causedBy: z.array(z.string().min(1).max(160)).max(25).optional(),
  enables: z.array(z.string().min(1).max(160)).max(25).optional(),
  blocks: z.array(z.string().min(1).max(160)).max(25).optional(),
  escalates: z.array(z.string().min(1).max(160)).max(25).optional(),
  deEscalates: z.array(z.string().min(1).max(160)).max(25).optional(),
}).strict();

export const CapsuleClaimPatchSchema = z.object({
  claimId: z.string().min(1).max(160).optional(),
  text: z.string().min(1).max(2000),
  support: z.enum(['supported', 'partially_supported', 'unsupported', 'needs_source', 'disputed']).optional(),
  sourceRefIds: z.array(z.string().min(1).max(160)).max(50).optional(),
  caveat: z.string().max(1000).optional(),
  receipts: z.array(EvidenceReceiptSchema).max(20).optional(),
  validFrom: z.string().max(80).nullable().optional(),
  validUntil: z.string().max(80).nullable().optional(),
  asOf: z.string().max(80).nullable().optional(),
  causalLinks: CapsuleClaimCausalLinksSchema.optional(),
}).strict();

export const CapsuleAnyVersionSchema = z.discriminatedUnion('schemaVersion', [
  CapsuleV1Schema,
  CapsuleV2Schema,
  CapsuleV3Schema,
]);

const EnvelopeCoreRefsPatchSchema = z.object({
  userCoreId: z.string().min(1).max(160).nullable().optional(),
  teamCoreId: z.string().min(1).max(160).nullable().optional(),
  situationCoreId: z.string().min(1).max(160).nullable().optional(),
  pathCoreId: z.string().min(1).max(160).nullable().optional(),
  sourceCoreIds: z.array(z.string().min(1).max(160)).max(50).optional(),
  documentCoreIds: z.array(z.string().min(1).max(160)).max(50).optional(),
  graphCoreId: z.string().min(1).max(160).nullable().optional(),
  timeCoreId: z.string().min(1).max(160).nullable().optional(),
  outputCoreIds: z.array(z.string().min(1).max(160)).max(20).optional(),
  toolCoreIds: z.array(z.string().min(1).max(160)).max(20).optional(),
  objectiveCoreIds: z.array(z.string().min(1).max(160)).max(20).optional(),
  productCoreIds: z.array(z.string().min(1).max(160)).max(20).optional(),
  memoryCoreId: z.string().min(1).max(160).nullable().optional(),
  coreFreshness: z.record(z.string(), z.object({
    lastRefreshedAt: z.string().max(80).nullable().optional(),
    freshnessExpiresAt: z.string().max(80).nullable().optional(),
  })).optional(),
}).strict();

export const CapsuleEnvelopePatchSchema = z.object({
  label: z.string().min(1).max(160).optional(),
  summary: z.string().min(1).max(600).optional(),
  coreRefs: EnvelopeCoreRefsPatchSchema.optional(),
  sourceRefs: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
  claimLedger: z.array(CapsuleClaimPatchSchema).max(100).optional(),
  outputContracts: z.array(z.record(z.string(), z.unknown())).max(50).optional(),
  sourcePosture: z.record(z.string(), z.unknown()).nullable().optional(),
  agentPermissions: z.record(z.string(), z.unknown()).optional(),
  memoryPosture: z.record(z.string(), z.unknown()).optional(),
  humanTacitKnowledge: z.record(z.string(), z.unknown()).optional(),
  temporality: z.record(z.string(), z.unknown()).optional(),
  causality: z.record(z.string(), z.unknown()).optional(),
  ontologyBinding: z.record(z.string(), z.unknown()).optional(),
  embeddedGraph: z.record(z.string(), z.unknown()).optional(),
  latestGateState: z.enum([
    'none',
    'draft',
    'proposed',
    'moderation_required',
    'owner_review',
    'accepted',
    'applied',
    'rejected',
    'superseded',
  ]).optional(),
}).strict();

export type CapsuleEnvelopePatch = z.infer<typeof CapsuleEnvelopePatchSchema>;

export function upgradeV1toV2(capsule: unknown, options: ContextCapsuleNormalizeOptions = {}): ContextCapsuleV2 {
  const parsed = CapsuleV1Schema.parse(capsule);
  return normalizeContextCapsuleV2({ ...parsed, schemaVersion: 2 }, options);
}

export function upgradeV2toV3(capsule: ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions = {}): PraxisCapsuleV3 {
  const v2 = normalizeContextCapsuleV2(capsule, options);
  const body = isRecord(capsule) ? capsule : {};
  return normalizeContextCapsuleV3({
    ...v2,
    ...(isRecord(body.memoryPosture) ? { memoryPosture: body.memoryPosture } : {}),
    ...(isRecord(body.humanTacitKnowledge) ? { humanTacitKnowledge: body.humanTacitKnowledge } : {}),
    ...(isRecord(body.temporality) ? { temporality: body.temporality } : {}),
    ...(isRecord(body.causality) ? { causality: body.causality } : {}),
    ...(isRecord(body.ontologyBinding) ? { ontologyBinding: body.ontologyBinding } : {}),
    ...(isRecord(body.embeddedGraph) ? { embeddedGraph: body.embeddedGraph } : {}),
    ...(isRecord(body.graphLiteProjection) ? { graphLiteProjection: body.graphLiteProjection } : {}),
    ...(isRecord(body.grounding) ? { grounding: body.grounding } : {}),
  }, options);
}

export function normalizeToLatest(capsule: ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions = {}): PraxisCapsuleV3 {
  const body = isRecord(capsule) ? capsule : {};
  if (body.schemaVersion === 3 && isRecord(body.identity) && Array.isArray(body.sectionIds)) {
    return migrateContextCapsuleV3ClaimLedger(body as unknown as PraxisCapsuleV3);
  }
  if (body.schemaVersion === 3 && isRecord(body.v3)) {
    const nested = body.v3;
    if (isRecord(nested.identity) && Array.isArray(nested.sectionIds)) {
      return migrateContextCapsuleV3ClaimLedger({
        ...nested,
        ...(isRecord(body.memoryPosture)
          ? {
            memoryPosture: {
              ...(isRecord(nested.memoryPosture) ? nested.memoryPosture : {}),
              ...body.memoryPosture,
              cogneeMode: 'advisory-only',
            },
          }
          : {}),
      } as unknown as PraxisCapsuleV3);
    }
    return normalizeContextCapsuleV3({
      ...nested,
      ...(isRecord(body.memoryPosture) ? { memoryPosture: body.memoryPosture } : {}),
    }, options);
  }
  if (body.schemaVersion === 1) {
    return upgradeV2toV3(upgradeV1toV2(body, options), options);
  }
  return upgradeV2toV3(capsule, options);
}

export function readinessFromQuality(quality: CapsuleQualityResult, computedAt: string): CapsuleReadinessBlock {
  const score = clampScore(quality.score);
  return {
    score,
    tier: score >= 80 ? 'green' : score >= 50 ? 'amber' : 'red',
    breakdown: quality.breakdown.map((item) => ({
      id: item.id,
      label: item.label,
      score: clampScore(item.score),
      maxScore: Math.max(0, Math.round(item.maxScore)),
    })),
    diagnostics: quality.diagnostics.map((diagnostic) => ({
      code: diagnostic.code,
      message: diagnostic.message,
    })),
    computedAt,
  };
}

export function deriveReadinessBlock(capsule: unknown, computedAt: string): CapsuleReadinessBlock {
  return readinessFromQuality(deriveCapsuleQuality(capsule, { now: computedAt }), computedAt);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
