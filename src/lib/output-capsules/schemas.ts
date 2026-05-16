import { z } from 'zod';

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
  'options-memo-v1': BasePayloadSchema,
  'diplomatic-cable-v1': BasePayloadSchema,
  'talking-points-v1': BasePayloadSchema,
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
