import { z } from 'zod';
import { normalizeMemoOutputReview } from '@/lib/memo/output-review';

export const OutputCapsuleCitationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  uri: z.string().optional(),
  sourceReceiptId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const OutputCapsuleGapSchema = z.object({
  id: z.string().min(1),
  claim: z.string().min(1),
  reason: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high']),
});

const BasePayloadSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  sections: z.array(z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
    citationIds: z.array(z.string()).default([]),
  })).default([]),
});

// Research memo diagnostics must survive the same shaped serializer as the body.
// Optional fields preserve older output payloads; invalid receipts remain unknown.
export const OptionsMemoPayloadSchema = BasePayloadSchema.extend({
  outputReview: z.unknown().transform(normalizeMemoOutputReview).optional(),
  sourceabilityScope: z.enum(['input_evidence', 'generated_answer']).optional(),
});

export const DailyReadPayloadSchema = BasePayloadSchema.extend({
  signals: z.array(z.string()).default([]),
  watchItems: z.array(z.string()).default([]),
});

export const CountryOnePagerPayloadSchema = BasePayloadSchema.extend({
  country: z.string().min(1),
  decisionContext: z.string().optional(),
  risks: z.array(z.string()).default([]),
});

export const CardPayloadSchema = BasePayloadSchema.extend({
  score: z.number().min(0).max(100).optional(),
  indicators: z.array(z.string()).default([]),
});

export const CompositePackPayloadSchema = BasePayloadSchema.extend({
  inputSummaries: z.array(z.object({
    templateId: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
  })).default([]),
});

export const BoardExecutivePackPayloadSchema = BasePayloadSchema.extend({
  meetingBrief: z.string().min(1),
  agenda: z.array(z.string()).default([]),
  roster: z.array(z.object({
    participantId: z.string().min(1),
    label: z.string().min(1),
    lens: z.string().min(1),
  })).default([]),
  transcript: z.array(z.object({
    turnId: z.string().min(1),
    round: z.number().int().positive(),
    participantId: z.string().min(1),
    state: z.string().min(1),
    claim: z.string().min(1),
    evidenceRefs: z.array(z.string()).default([]),
    critique: z.string().optional(),
    recommendation: z.string().optional(),
    confidence: z.enum(['high', 'medium', 'low']),
  })).default([]),
  topicClusters: z.array(z.object({
    topic: z.string().min(1),
    mentions: z.number().int().nonnegative(),
    participantIds: z.array(z.string()).default([]),
  })).default([]),
  consensus: z.array(z.string()).default([]),
  divergences: z.array(z.string()).default([]),
  decisionOptions: z.array(z.object({
    label: z.string().min(1),
    tradeoffs: z.string().min(1),
    preferredBy: z.array(z.string()).default([]),
  })).default([]),
  risks: z.array(z.string()).default([]),
  openQuestions: z.array(z.string()).default([]),
  evidenceStats: z.object({
    sourceCount: z.number().int().nonnegative(),
    documentCount: z.number().int().nonnegative(),
    sourcedParagraphCount: z.number().int().nonnegative(),
    unsupportedClaimCount: z.number().int().nonnegative(),
  }),
  confidenceDistribution: z.object({
    high: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    low: z.number().int().nonnegative(),
  }),
  nextActions: z.array(z.object({
    action: z.string().min(1),
    owner: z.string().min(1),
    urgency: z.string().min(1),
  })).default([]),
  memoId: z.string().min(1).optional(),
});

export const OUTPUT_CAPSULE_PAYLOAD_SCHEMAS = {
  'daily-read-v1': DailyReadPayloadSchema,
  'morning-brief-v1': DailyReadPayloadSchema,
  'country-one-pager-v1': CountryOnePagerPayloadSchema,
  'country-risk-card-v1': CardPayloadSchema,
  'actor-dossier-v1': BasePayloadSchema,
  'media-roundup-v1': BasePayloadSchema,
  'narrative-monitor-v1': BasePayloadSchema,
  'humanitarian-one-pager-v1': BasePayloadSchema,
  'risk-monitor-card-v1': CardPayloadSchema,
  'electoral-risk-card-v1': CardPayloadSchema,
  'governance-index-v1': CardPayloadSchema,
  'options-memo-v1': OptionsMemoPayloadSchema,
  'diplomatic-cable-v1': BasePayloadSchema,
  'talking-points-v1': BasePayloadSchema,
  'board-executive-pack-v1': BoardExecutivePackPayloadSchema,
  'country-pack-v1': CompositePackPayloadSchema,
} as const;

export type OutputCapsuleSchemaId = keyof typeof OUTPUT_CAPSULE_PAYLOAD_SCHEMAS;

export function validateOutputCapsulePayload(schemaId: string, payload: unknown) {
  const schema = OUTPUT_CAPSULE_PAYLOAD_SCHEMAS[schemaId as OutputCapsuleSchemaId];
  if (!schema) {
    throw new Error(`Unknown OutputCapsule schema: ${schemaId}`);
  }
  return schema.parse(payload);
}
