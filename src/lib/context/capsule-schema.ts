import { z } from 'zod';

import { deriveCapsuleQuality, type CapsuleQualityResult } from '@/lib/context/capsule-quality';
import {
  normalizeContextCapsuleV2,
  type ContextCapsuleNormalizeOptions,
  type ContextCapsuleV2,
} from '@/lib/context/capsule-v2';
import { normalizeContextCapsuleV3, type ContextCapsuleV3 } from '@/lib/context/capsule-v3';

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
  claimLedger: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
  outputContracts: z.array(z.record(z.string(), z.unknown())).max(50).optional(),
  sourcePosture: z.record(z.string(), z.unknown()).nullable().optional(),
  agentPermissions: z.record(z.string(), z.unknown()).optional(),
  memoryPosture: z.record(z.string(), z.unknown()).optional(),
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
  }, options);
}

export function normalizeToLatest(capsule: ContextCapsuleV2 | unknown, options: ContextCapsuleNormalizeOptions = {}): PraxisCapsuleV3 {
  const body = isRecord(capsule) ? capsule : {};
  if (body.schemaVersion === 3 && isRecord(body.identity) && Array.isArray(body.sectionIds)) {
    return body as unknown as PraxisCapsuleV3;
  }
  if (body.schemaVersion === 3 && isRecord(body.v3)) {
    const nested = body.v3;
    if (isRecord(nested.identity) && Array.isArray(nested.sectionIds)) {
      return {
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
      } as unknown as PraxisCapsuleV3;
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
