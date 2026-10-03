import { z } from 'zod';

export const COGNITIVE_SCHEMA_VERSION = 'cognitive-capsule/vNext' as const;
export const COGNITIVE_LAYERS = ['world', 'epistemic', 'argument', 'expertise', 'language', 'procedure', 'temporal', 'case', 'normative', 'provenance'] as const;
const text = z.string().trim().min(1).max(4000);
const id = z.string().trim().min(1).max(240);
const ids = z.array(id).max(200).default([]);
const texts = z.array(text).max(100).default([]);
export const ReviewStateSchema = z.enum(['proposed', 'reviewed', 'accepted', 'rejected', 'superseded']);
export const ProvenanceActorSchema = z.object({ type: z.enum(['human', 'model', 'rule', 'import']), id, at: z.iso.datetime({ offset: true }) }).strict();
export const KnowledgeProvenanceSchema = z.object({
  generatedBy: ProvenanceActorSchema, sourceRefs: ids,
  derivedFrom: ids, reviewedBy: ProvenanceActorSchema.optional(), reviewedAt: z.iso.datetime({ offset: true }).optional(),
  confidenceKind: z.enum(['human-authored', 'human-confirmed', 'model-extracted', 'model-proposed', 'rule-inferred', 'imported', 'derived', 'expert-practice-rule']).default('model-proposed'),
}).strict();
export const ConditionSchema = z.object({ kind: z.enum(['context', 'node', 'statement']), key: id,
  operator: z.enum(['present', 'absent', 'equals']), value: z.union([z.string().max(4000), z.number().finite(), z.boolean()]).optional(),
}).strict().refine((c) => c.operator !== 'equals' || c.value !== undefined, 'Equality conditions require a value.');
const conditions = z.array(ConditionSchema).max(100).default([]);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}(?:T.*)?$/, 'Use an ISO date or timestamp.')
  .refine((v) => Number.isFinite(Date.parse(v)) && new Date(Date.parse(v)).toISOString().startsWith(v.slice(0, 10)), 'Invalid date.');
const common = {
  id, label: text, scope: z.array(id).min(1).max(30), provenance: KnowledgeProvenanceSchema,
  reviewState: ReviewStateSchema.default('proposed'), migrationStatus: z.enum(['native', 'needs_review']).default('native'),
  validFrom: date.optional(), validUntil: date.optional(),
  reviewDecision: z.enum(['accept', 'edit_accept', 'reject', 'need_evidence']).optional(), reviewNote: text.optional(),
};
function reviewAndTime(v: { reviewState: string; provenance: z.infer<typeof KnowledgeProvenanceSchema>; validFrom?: string; validUntil?: string }, ctx: z.RefinementCtx) {
  if (['accepted', 'reviewed'].includes(v.reviewState) && (!v.provenance.reviewedAt || v.provenance.reviewedBy?.type !== 'human'))
    ctx.addIssue({ code: 'custom', path: ['provenance'], message: 'Reviewed knowledge requires a named human and review timestamp.' });
  if (v.validFrom && v.validUntil && Date.parse(v.validUntil) < Date.parse(v.validFrom))
    ctx.addIssue({ code: 'custom', path: ['validUntil'], message: 'Validity end precedes start.' });
}
export const EvidenceSpanSchema = z.object({
  id, sourceId: id, sourceVersion: id, quote: z.string().min(1).max(4000).refine(value => value.trim().length > 0, 'Evidence quote cannot be blank.'),
  uri: z.string().max(2000).optional(), page: z.number().int().positive().optional(),
  start: z.number().int().nonnegative().optional(), end: z.number().int().nonnegative().optional(),
  prefix: z.string().max(2000).optional(), suffix: z.string().max(2000).optional(),
  quoteHash: z.string().max(160).optional(), sourceHash: z.string().max(160).optional(),
  documentId: id.optional(), chunkId: id.optional(), citationId: id.optional(),
  geometry: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().min(0).max(1), height: z.number().min(0).max(1) }).strict().optional(),
  anchorStatus: z.enum(['exact', 'excerpt', 'unresolved']).default('excerpt'),
  stance: z.enum(['supports', 'contradicts', 'qualifies', 'mixed']).default('supports'),
}).strict().superRefine((v, ctx) => {
  if ((v.start === undefined) !== (v.end === undefined) || (v.start !== undefined && v.end !== undefined && v.end <= v.start))
    ctx.addIssue({ code: 'custom', path: ['end'], message: 'Offsets require both endpoints and a positive span.' });
  if (v.geometry && (v.geometry.x + v.geometry.width > 1.001 || v.geometry.y + v.geometry.height > 1.001))
    ctx.addIssue({ code: 'custom', path: ['geometry'], message: 'Bounding box extends beyond the page.' });
});
export const CognitiveNodeSchema = z.object({ id, type: id, label: text, layer: z.enum(COGNITIVE_LAYERS),
  reviewState: ReviewStateSchema.default('proposed'), provenance: KnowledgeProvenanceSchema,
  validFrom: date.optional(), validUntil: date.optional(),
}).strict().superRefine(reviewAndTime);
export const CognitiveStatementSchema = z.object({
  id, subject: id, predicate: id, object: z.union([z.object({ node: id }).strict(), z.object({ literal: z.union([z.string().min(1).max(4000).refine(value => value.trim().length > 0, 'Literal wording cannot be blank.'), z.number().finite(), z.boolean()]) }).strict()]),
  layer: z.enum(COGNITIVE_LAYERS), polarity: z.enum(['positive', 'negative', 'mixed']),
  modality: z.enum(['asserted', 'possible', 'probable', 'conditional', 'counterfactual', 'desired', 'obligatory']).optional(),
  strength: text.optional(), conditions, exceptions: conditions,
  validFrom: date.optional(), validUntil: date.optional(), observedAt: date.optional(),
  assertedBy: id.optional(), addressedTo: ids, audience: ids,
  channel: z.enum(['public', 'private', 'confidential', 'internal']).optional(),
  speechAct: text.optional(), language: z.string().max(40).optional(), wordingRef: id.optional(),
  sourceRefs: ids, rationaleRef: id.optional(), annotations: ids,
  reviewState: ReviewStateSchema.default('proposed'), provenance: KnowledgeProvenanceSchema,
}).strict().superRefine((v, ctx) => {
  reviewAndTime(v, ctx);
  if (v.reviewState === 'accepted' && ['world', 'epistemic', 'temporal'].includes(v.layer) && !v.sourceRefs.length)
    ctx.addIssue({ code: 'custom', path: ['sourceRefs'], message: 'Accepted factual assertions require evidence spans.' });
  if (['ALIAS_OF', 'FORMERLY_KNOWN_AS', 'SPLINTERED_FROM', 'MERGED_INTO', 'INTEGRATED_INTO', 'DISSOLVED_INTO', 'MEMBER_OF', 'AFFILIATED_WITH'].includes(v.predicate) && !v.validFrom)
    ctx.addIssue({ code: 'custom', path: ['validFrom'], message: 'Organizational identity relations require a validity start.' });
  if (v.speechAct && !v.assertedBy)
    ctx.addIssue({ code: 'custom', path: ['assertedBy'], message: 'Speech acts require a speaker (use an explicit unknown speaker node).'});
});
const variants = [
  z.object({ ...common, kind: z.literal('cue'), description: text, suggests: ids, significance: z.enum(['weak', 'moderate', 'strong', 'context_dependent']).default('context_dependent'), onlyWhen: conditions, falsePositiveConditions: conditions, followUpChecks: texts, doNotInfer: texts, examples: ids }).strict(),
  z.object({ ...common, kind: z.literal('pattern'), expectedCues: conditions, optionalCues: conditions, disconfirmingCues: conditions, interpretation: text, likelyEvolution: texts, recommendedChecks: texts, failureConditions: conditions }).strict(),
  z.object({ ...common, kind: z.literal('heuristic'), when: conditions, attendTo: ids, interpretation: text, action: text.optional(), exceptions: conditions, failureModes: texts, nextChecks: texts, rationale: text, cases: ids }).strict(),
  z.object({ ...common, kind: z.literal('distinction'), conceptA: text, conceptB: text, explanation: text, whyItMatters: text, decisionTests: texts, commonMistake: text, examples: texts, counterexamples: texts, expertRefs: ids }).strict(),
  z.object({ ...common, kind: z.literal('exception'), ruleRefs: ids, when: conditions, explanation: text, requiredChecks: texts }).strict(),
  z.object({ ...common, kind: z.literal('redFlag'), description: text, onlyWhen: conditions, possibleSignificance: text, doNotInfer: texts, nextEvidence: texts }).strict(),
  z.object({ ...common, kind: z.literal('question'), question: text, whyItMatters: text, resolves: ids, requiredEvidence: texts }).strict(),
  z.object({ ...common, kind: z.literal('languageRule'), expression: text, language: z.string().min(2).max(40), meaning: text, domain: text, speechAct: text.optional(), audience: texts, preferredAlternatives: texts, avoidAlternatives: texts, implications: texts, nonImplications: texts, examples: ids }).strict(),
  z.object({ ...common, kind: z.literal('procedure'), purpose: text, inputs: texts, outputs: texts,
    steps: z.array(z.object({ id, instruction: text, requires: ids, produces: ids, precedes: ids, checks: texts, branches: conditions, stopIf: conditions, escalateIf: conditions }).strict()).max(100).default([]),
    stopConditions: conditions, escalationConditions: conditions }).strict(),
  z.object({ ...common, kind: z.literal('case'), situation: text, cues: ids, interpretation: text, decision: text, outcome: text.optional(), lessons: texts, analogyDimensions: texts, nonTransferableDimensions: texts, reviewedBy: ids }).strict(),
  z.object({ ...common, kind: z.literal('unknown'), description: text, requiredEvidence: texts, outOfScope: z.boolean().default(false) }).strict(),
  z.object({ ...common, kind: z.literal('revisionTrigger'), when: conditions, affectedIds: ids, action: text }).strict(),
] as const;
export const ProcedureStepsSchema = variants[8].shape.steps;
export const KnowledgeSchema = z.discriminatedUnion('kind', variants).superRefine((v, ctx) => {
  reviewAndTime(v, ctx);
  if (v.reviewState === 'accepted' && v.migrationStatus === 'needs_review')
    ctx.addIssue({ code: 'custom', path: ['migrationStatus'], message: 'Complete the expert structure before acceptance.' });
  if (v.kind === 'heuristic' && v.reviewState === 'accepted' && !v.when.length)
    ctx.addIssue({ code: 'custom', path: ['when'], message: 'Accepted heuristics require applicability conditions.' });
  if (v.kind === 'case' && v.reviewState === 'accepted' && !v.analogyDimensions.length)
    ctx.addIssue({ code: 'custom', path: ['analogyDimensions'], message: 'Reviewed cases require explicit analogy dimensions.' });
});
export const CognitiveCapsuleSchema = z.object({
  schemaVersion: z.literal(COGNITIVE_SCHEMA_VERSION), capsuleId: id,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  profile: z.enum(['situation', 'expertise', 'method', 'language', 'organization', 'role', 'casebook', 'output']).default('expertise'),
  nodes: z.array(CognitiveNodeSchema).max(5000).default([]),
  statements: z.array(CognitiveStatementSchema).max(10000).default([]),
  evidence: z.array(EvidenceSpanSchema).max(10000).default([]), knowledge: z.array(KnowledgeSchema).max(2000).default([]),
  dependencies: z.array(z.object({ name: z.string().regex(/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/), version: z.string().regex(/^\d+\.\d+\.\d+$/), digest: z.string().regex(/^sha256:[a-f0-9]{64}$/) }).strict()).max(100).default([]),
  rights: z.object({ mode: z.enum(['open', 'private', 'organization', 'licensed']), license: text.optional(), author: id.optional() }).strict().default({ mode: 'private' }),
  legacy: z.object({ capsuleVersion: z.number().int().nonnegative(), schemaVersion: z.literal(3) }).strict().optional(),
}).strict();
export function createCognitiveCapsule(capsuleId: string, version = '0.1.0'): z.infer<typeof CognitiveCapsuleSchema> {
  return CognitiveCapsuleSchema.parse({ schemaVersion: COGNITIVE_SCHEMA_VERSION, capsuleId, version });
}
/** Refinements remain enforced by the runtime validator; JSON Schema is the portable structural contract. */
export function cognitiveJsonSchema() { return z.toJSONSchema(CognitiveCapsuleSchema, { unrepresentable: 'throw' }); }
