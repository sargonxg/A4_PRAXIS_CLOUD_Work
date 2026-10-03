import { z } from 'zod';
import { CognitiveCapsuleSchema } from '@/lib/cognitive-capsule/schema';
import { compileContext, renderContext, lockContext, COMPILER_VERSION, WORKER_ROLES, type CognitiveWorkerRole } from '@/lib/cognitive-capsule/compiler';
import { contentDigest } from '@/lib/cognitive-capsule/integrity';
import type { CognitiveCapsule } from '@/lib/cognitive-capsule/types';
import type { ContextFacts } from '@/lib/cognitive-capsule/graph';

const id = z.string().min(1).max(240);
const refs = z.array(id).max(300);
const text = z.string().min(1).max(64000);
const time = z.iso.datetime({ offset: true });
export const RunIdentitySchema = z.object({ ownerUid: id, runId: id, capsuleId: id }).strict();
export type RunIdentity = z.infer<typeof RunIdentitySchema>;
const common = { ...RunIdentitySchema.shape, id, createdAt: time, updatedAt: time, objectRefs: refs, knowledgeRefs: refs, evidenceRefs: refs };
export const WorkingObjectSchema = z.discriminatedUnion('kind', [
  z.object({ ...common, kind: z.literal('WorkingClaim'), text, modality: z.enum(['asserted', 'possible', 'conditional', 'unknown']), supportStatus: z.enum(['unverified', 'supported', 'contradicted', 'unknown']) }).strict(),
  z.object({ ...common, kind: z.literal('WorkingQuestion'), text, status: z.enum(['open', 'resolved', 'needs_evidence']) }).strict(),
  z.object({ ...common, kind: z.literal('WorkingHypothesis'), text, status: z.enum(['proposed', 'disconfirmed', 'unresolved']), disconfirmingChecks: z.array(text).max(100) }).strict(),
  z.object({ ...common, kind: z.literal('WorkingEvidenceSpan'), sourceId: id, sourceVersion: id, quote: text, anchorStatus: z.enum(['exact', 'excerpt', 'unresolved']), supportStatus: z.enum(['unverified', 'verified', 'contradicted', 'unknown']) }).strict(),
  z.object({ ...common, kind: z.literal('WorkingEntityResolution'), candidateIds: refs, relation: z.enum(['same_entity', 'alias', 'renamed', 'splinter', 'merged', 'affiliated', 'unresolved']), status: z.enum(['proposed', 'needs_review']), validFrom: time.optional(), validUntil: time.optional() }).strict(),
  z.object({ ...common, kind: z.literal('WorkingTimelineEvent'), text, earliest: time, latest: time, certainty: z.enum(['exact', 'interval', 'unknown']) }).strict(),
  z.object({ ...common, kind: z.literal('WorkingAnalysis'), text, role: z.enum(WORKER_ROLES), inferenceStatus: z.literal('analysis-not-fact') }).strict(),
  z.object({ ...common, kind: z.literal('WorkingDraftBlock'), text, reviewState: z.literal('draft') }).strict(),
  z.object({ ...common, kind: z.literal('WorkingReviewIssue'), text, severity: z.enum(['info', 'needs_review', 'blocking']), status: z.enum(['open', 'resolved']) }).strict(),
  z.object({ ...common, kind: z.literal('CapsuleChangeProposal'), targetIds: refs, changeSummary: text, reviewState: z.literal('proposed'), promotion: z.literal('human-review-required') }).strict(),
]).superRefine((v, ctx) => {
  if (Date.parse(v.updatedAt) < Date.parse(v.createdAt)) ctx.addIssue({ code: 'custom', message: 'Update precedes creation.' });
  if (v.kind === 'WorkingEvidenceSpan' && v.anchorStatus === 'unresolved' && v.supportStatus === 'verified') ctx.addIssue({ code: 'custom', message: 'Unresolved evidence cannot be verified.' });
  if (v.kind === 'WorkingTimelineEvent' && Date.parse(v.latest) < Date.parse(v.earliest)) ctx.addIssue({ code: 'custom', message: 'Timeline interval is reversed.' });
  if (v.kind === 'WorkingEntityResolution' && v.validFrom && v.validUntil && Date.parse(v.validUntil) < Date.parse(v.validFrom)) ctx.addIssue({ code: 'custom', message: 'Entity validity is reversed.' });
  if (v.kind === 'WorkingClaim' && v.supportStatus === 'supported' && !v.evidenceRefs.length) ctx.addIssue({ code: 'custom', message: 'Supported claims require evidence references.' });
});
export type WorkingObject = z.infer<typeof WorkingObjectSchema>;
export type WorkingClaim = Extract<WorkingObject, { kind: 'WorkingClaim' }>;
export type WorkingQuestion = Extract<WorkingObject, { kind: 'WorkingQuestion' }>;
export type WorkingHypothesis = Extract<WorkingObject, { kind: 'WorkingHypothesis' }>;
export type WorkingEvidence = Extract<WorkingObject, { kind: 'WorkingEvidenceSpan' }>;
export type WorkingEntityResolution = Extract<WorkingObject, { kind: 'WorkingEntityResolution' }>;
export type WorkingTimelineEvent = Extract<WorkingObject, { kind: 'WorkingTimelineEvent' }>;
export type WorkingAnalysis = Extract<WorkingObject, { kind: 'WorkingAnalysis' }>;
export type WorkingDraftBlock = Extract<WorkingObject, { kind: 'WorkingDraftBlock' }>;
export type WorkingReviewIssue = Extract<WorkingObject, { kind: 'WorkingReviewIssue' }>;
export type CapsuleChangeProposal = Extract<WorkingObject, { kind: 'CapsuleChangeProposal' }>;
export const BlackboardSchema = z.object({ ...RunIdentitySchema.shape, schemaVersion: z.literal('run-blackboard/0.1.0'), revision: z.number().int().nonnegative(), knowledgeIds: refs, evidenceIds: refs, entityIds: refs.default([]), statementIds: refs.default([]), objects: z.array(WorkingObjectSchema).max(300) }).strict();
export type CognitiveBlackboard = z.infer<typeof BlackboardSchema>;
function sameIdentity(value: RunIdentity, expected: RunIdentity) {
  if (value.ownerUid !== expected.ownerUid || value.runId !== expected.runId || value.capsuleId !== expected.capsuleId) throw new Error('Blackboard run/owner/capsule identity mismatch.');
}
export function createBlackboard(identity: RunIdentity, anchors: { knowledgeIds?: string[]; evidenceIds?: string[]; entityIds?: string[]; statementIds?: string[] } = {}): CognitiveBlackboard {
  return BlackboardSchema.parse({ ...identity, schemaVersion: 'run-blackboard/0.1.0', revision: 0, knowledgeIds: anchors.knowledgeIds ?? [], evidenceIds: anchors.evidenceIds ?? [], entityIds: anchors.entityIds ?? [], statementIds: anchors.statementIds ?? [], objects: [] });
}
export function validateBlackboard(value: unknown, identity: RunIdentity): CognitiveBlackboard {
  const b = BlackboardSchema.parse(value); sameIdentity(b, identity);
  const ids = new Set(b.objects.map((o) => o.id));
  if (ids.size !== b.objects.length) throw new Error('Duplicate blackboard object IDs.');
  for (const o of b.objects) {
    sameIdentity(o, identity);
    if (o.objectRefs.some((r) => !ids.has(r) || r === o.id) || o.knowledgeRefs.some((r) => !b.knowledgeIds.includes(r)) || o.evidenceRefs.some((r) => !b.evidenceIds.includes(r))) throw new Error('Missing or invalid blackboard reference.');
    if (o.kind === 'WorkingEntityResolution' && o.candidateIds.some((r) => !b.entityIds.includes(r))) throw new Error('Missing entity candidate reference.');
    if (o.kind === 'CapsuleChangeProposal' && o.targetIds.some((r) => ![...b.entityIds, ...b.statementIds, ...b.knowledgeIds].includes(r))) throw new Error('Missing canonical proposal target reference.');
  }
  return b;
}
export function appendWorkingObject(value: CognitiveBlackboard, object: unknown): CognitiveBlackboard {
  const b = validateBlackboard(value, value); const o = WorkingObjectSchema.parse(object); sameIdentity(o, b);
  if (b.objects.some((row) => row.id === o.id)) throw new Error('Duplicate blackboard object ID.');
  return validateBlackboard({ ...b, revision: b.revision + 1, objects: [...b.objects, o] }, b);
}
export function updateWorkingObject(value: CognitiveBlackboard, object: unknown): CognitiveBlackboard {
  const b = validateBlackboard(value, value); const o = WorkingObjectSchema.parse(object); sameIdentity(o, b);
  const previous = b.objects.find((row) => row.id === o.id);
  if (!previous || previous.kind !== o.kind || previous.createdAt !== o.createdAt || Date.parse(o.updatedAt) < Date.parse(previous.updatedAt)) throw new Error('Invalid working-object update.');
  return validateBlackboard({ ...b, revision: b.revision + 1, objects: b.objects.map((row) => row.id === o.id ? o : row) }, b);
}

export interface FreezeRunContextInput extends RunIdentity {
  capsuleVersion: number; cognition: CognitiveCapsule; objective: string; scope: string; asOf: string;
  facts?: ContextFacts; runtime: Parameters<typeof lockContext>[1]; evidenceDependencies: Array<{ id: string; digest: string }>;
}
export function freezeRunContext(input: FreezeRunContextInput) {
  const identity = RunIdentitySchema.parse({ ownerUid: input.ownerUid, runId: input.runId, capsuleId: input.capsuleId });
  const cognition = CognitiveCapsuleSchema.parse(input.cognition);
  if (cognition.capsuleId !== identity.capsuleId || !Number.isSafeInteger(input.capsuleVersion) || input.capsuleVersion < 1) throw new Error('Exact cognition/capsule identity is required.');
  const scopes = Array.from(new Set([input.scope, ...cognition.knowledge.filter((k) => k.reviewState === 'accepted').flatMap((k) => k.scope)]));
  const views = Object.fromEntries(WORKER_ROLES.map((role) => [role, [compileContext(cognition, { objective: input.objective, role, scope: input.scope, scopes, asOf: input.asOf, facts: input.facts, maxChars: 12000 })]])) as Record<CognitiveWorkerRole, ReturnType<typeof compileContext>[]>;
  const locks = Object.fromEntries(WORKER_ROLES.map((role) => [role, views[role].map((view) => lockContext(view, input.runtime))]));
  const body = { ...identity, lockVersion: 'run-context-lock/0.1.0' as const, compilerVersion: COMPILER_VERSION, capsuleVersion: input.capsuleVersion,
    cognition, objective: input.objective, scope: input.scope, asOf: input.asOf, facts: structuredClone(input.facts ?? {}), runtime: structuredClone(input.runtime), evidenceDependencies: structuredClone(input.evidenceDependencies), views, locks };
  return { ...body, lockDigest: contentDigest(body) };
}
export type RunContextLock = ReturnType<typeof freezeRunContext>;
export function compileLockedRole(lock: RunContextLock, identity: RunIdentity, role: CognitiveWorkerRole): string {
  sameIdentity(lock, identity);
  const { lockDigest, ...body } = lock;
  if (lock.compilerVersion !== COMPILER_VERSION || contentDigest(body) !== lockDigest) throw new Error('Stale or corrupted compiler context lock.');
  return lock.views[role].map(renderContext).join('\n\n');
}
export function assertRunContextReplay(lock: RunContextLock, current: FreezeRunContextInput): RunContextLock {
  // Retain the original date on retries; a new clock tick does not alter the frozen view.
  const expected = freezeRunContext({ ...current, asOf: lock.asOf });
  sameIdentity(lock, current);
  if (expected.lockDigest !== lock.lockDigest) throw new Error('Stale replay dependencies: restart from the reviewed capsule.');
  compileLockedRole(lock, current, 'writer');
  return structuredClone(lock);
}
