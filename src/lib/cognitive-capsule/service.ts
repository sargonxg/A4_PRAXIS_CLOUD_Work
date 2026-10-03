import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getCapsule, createCapsuleReviewCard, decideCognitiveCapsuleReviewCard, listCapsuleReviewCardsPage, type CapsuleServiceDeps, type PraxisCapsule } from '@/lib/context/capsule-service';
import { normalizeToLatest } from '@/lib/context/capsule-schema';
import { CognitiveCapsuleSchema, ConditionSchema, KnowledgeSchema } from './schema';
import { fromV3 } from './from-v3';
import { CognitiveGraph } from './graph';
import { proposeKnowledge } from './review';
import { cognitiveQuality } from './quality';
import { proposeFromExpertInterview } from './interview';

const text = z.string().trim().min(1).max(4000);
const refs = z.array(z.string().trim().min(1).max(240)).max(30);
export const CognitiveKnowledgeCaptureSchema = z.object({
  kind: z.enum(['cue', 'pattern', 'heuristic', 'distinction', 'exception', 'redFlag', 'question', 'languageRule', 'procedure', 'case', 'unknown', 'revisionTrigger']),
  label: z.string().trim().min(1).max(240), scope: refs.min(1), body: text,
  terms: z.array(text).max(2).optional(), rationale: text.optional(), sourceRefs: refs.optional(),
  when: z.array(ConditionSchema).max(30).optional(), exceptions: z.array(ConditionSchema).max(30).optional(),
  checks: z.array(text).max(30).optional(), nonImplications: z.array(text).max(30).optional(),
  implications: z.array(text).max(30).optional(), avoidAlternatives: z.array(text).max(30).optional(),
  language: z.string().min(2).max(40).optional(), speechAct: text.optional(),
  situation: text.optional(), decision: text.optional(), outcome: text.optional(), analogyDimensions: z.array(text).max(30).optional(),
  affectedIds: refs.optional(), ruleRefs: refs.optional(),
}).strict().superRefine((value, context) => {
  if (value.kind === 'distinction' && value.terms?.length !== 2) context.addIssue({ code: 'custom', path: ['terms'], message: 'Name both concepts in a distinction.' });
  if (value.kind === 'case') {
    if (!value.situation) context.addIssue({ code: 'custom', path: ['situation'], message: 'Describe the actual case situation.' });
    if (!value.decision) context.addIssue({ code: 'custom', path: ['decision'], message: 'State the actual decision made in this case.' });
  }
  if (value.kind === 'languageRule' && !value.language) context.addIssue({ code: 'custom', path: ['language'], message: 'Name the language of this expression.' });
});
export type CognitiveKnowledgeCapture = z.infer<typeof CognitiveKnowledgeCaptureSchema>;
export const CognitiveKnowledgeDecisionSchema = z.object({
  reviewCardId: z.string().trim().min(1).max(160), decision: z.enum(['accept', 'edit_accept', 'reject', 'need_evidence']),
  reason: z.string().trim().min(1).max(600), edited: KnowledgeSchema.optional(),
}).strict().superRefine((value, context) => {
  if (value.decision === 'edit_accept' && !value.edited) context.addIssue({ code: 'custom', path: ['edited'], message: 'Supply the edited knowledge before accepting.' });
  if (value.decision !== 'edit_accept' && value.edited) context.addIssue({ code: 'custom', path: ['edited'], message: 'Edits require the edit and accept decision.' });
});

function cognitionOf(capsule: PraxisCapsule) {
  const cognition = capsule.cognition ? CognitiveCapsuleSchema.parse(capsule.cognition) : fromV3(capsule.v3 ?? normalizeToLatest(capsule));
  if (cognition.capsuleId !== capsule.capsuleId) throw new Error('Cognition identity does not match the capsule.');
  return cognition;
}

export async function getCognitiveCapsuleInventory(uid: string, capsuleId: string, options: { cursor?: string } = {}, deps?: CapsuleServiceDeps) {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule || capsule.ownerUid !== uid) return null;
  const cognition = cognitionOf(capsule);
  const graph = new CognitiveGraph(cognition);
  const page = await listCapsuleReviewCardsPage(uid, capsuleId, { limit: 50, cursor: options.cursor }, deps);
  const cards = page.cards.filter((card) => card.proposedEnvelopePatch.cognition).map((card) => ({
    reviewCardId: card.reviewCardId, title: card.title, state: card.state, cognitiveKnowledgeIds: card.cognitiveKnowledgeIds ?? [],
    proposedEnvelopePatch: { cognition: { knowledge: card.proposedEnvelopePatch.cognition!.knowledge.filter((item) => card.cognitiveKnowledgeIds?.includes(item.id)) } },
  }));
  return { capsuleId, capsuleVersion: capsule.version, allowDownload: capsule.access?.allowDownload === true, cognition, quality: cognitiveQuality(cognition), validation: graph.validate(), jsonLd: graph.toJsonLd(),
    reviewCards: cards, nextCursor: page.nextCursor, hasMore: page.hasMore };
}

function contentFields(input: CognitiveKnowledgeCapture): Record<string, unknown> {
  const checks = input.checks ?? [];
  const rationale = input.rationale ?? input.body;
  switch (input.kind) {
    case 'cue': return { description: input.body, followUpChecks: checks, onlyWhen: input.when ?? [], doNotInfer: input.nonImplications ?? [] };
    case 'pattern': return { interpretation: input.body, expectedCues: input.when ?? [], disconfirmingCues: input.exceptions ?? [], recommendedChecks: checks };
    case 'heuristic': return { interpretation: input.body, rationale, when: input.when ?? [], exceptions: input.exceptions ?? [], nextChecks: checks };
    case 'distinction': return { conceptA: input.terms![0], conceptB: input.terms![1], explanation: input.body, whyItMatters: rationale, commonMistake: input.label, decisionTests: checks };
    case 'exception': return { explanation: input.body, when: input.when ?? [], ruleRefs: input.ruleRefs ?? [], requiredChecks: checks };
    case 'redFlag': return { description: input.body, possibleSignificance: rationale, onlyWhen: input.when ?? [], doNotInfer: input.nonImplications ?? [], nextEvidence: checks };
    case 'question': return { question: input.label, whyItMatters: input.body, requiredEvidence: checks };
    case 'languageRule': return { expression: input.label, language: input.language!, meaning: input.body, domain: input.scope[0], speechAct: input.speechAct,
      implications: input.implications ?? [], nonImplications: input.nonImplications ?? [], avoidAlternatives: input.avoidAlternatives ?? [] };
    case 'procedure': return { purpose: input.body, steps: checks.map((instruction, index) => ({ id: `step-${index + 1}`, instruction })), stopConditions: input.exceptions ?? [] };
    case 'case': return { situation: input.situation!, interpretation: input.body, decision: input.decision!,
      outcome: input.outcome, analogyDimensions: input.analogyDimensions ?? [], lessons: checks };
    case 'unknown': return { description: input.body, requiredEvidence: checks };
    case 'revisionTrigger': return { when: input.when ?? [], affectedIds: input.affectedIds ?? [], action: input.body };
  }
}

export async function proposeCognitiveKnowledge(uid: string, capsuleId: string, value: unknown, deps?: CapsuleServiceDeps) {
  const input = CognitiveKnowledgeCaptureSchema.parse(value);
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule || capsule.ownerUid !== uid) return null;
  if (capsule.archivedAt) throw Object.assign(new Error('Restore the archived capsule before capturing expertise.'), { status: 409 });
  const cognition = cognitionOf(capsule);
  const timestamp = (deps?.now?.() ?? new Date()).toISOString();
  const actor = { type: 'human' as const, id: uid, at: timestamp };
  const sourceRefs = Array.from(new Set((input.sourceRefs ?? []).flatMap((id) => {
    const spans = cognition.evidence.filter((span) => span.anchorStatus !== 'unresolved' && (span.id === id || span.sourceId === id));
    if (!spans.length) throw Object.assign(new Error(`Attach an evidence excerpt for source reference ${id} before using it in expertise.`), { status: 400 });
    return spans.map((span) => span.id);
  })));
  const knowledge = proposeKnowledge({ id: `expertise-${randomUUID()}`, kind: input.kind, label: input.label, scope: input.scope,
    provenance: { generatedBy: actor, sourceRefs, confidenceKind: 'human-authored' }, ...contentFields(input) }, actor);
  const next = CognitiveCapsuleSchema.parse({ ...cognition, knowledge: [...cognition.knowledge, knowledge] });
  if (Buffer.byteLength(JSON.stringify(next), 'utf8') > 500_000) throw Object.assign(new Error('This capsule is too large for another expertise proposal. Split it into smaller capsules.'), { status: 413 });
  const card = await createCapsuleReviewCard(uid, capsuleId, { title: `${input.kind}: ${input.label}`, sourceType: 'user', target: 'capsuleEnvelope', state: 'proposed',
    evidence: sourceRefs.map((id) => ({ id, label: id, advisory: false, sourceType: 'expert-capture' })), proposedEnvelopePatch: { cognition: next } }, { ...deps, requireWritableOwner: true });
  return { card, knowledge };
}

export async function decideCognitiveKnowledge(uid: string, capsuleId: string, value: unknown, deps?: CapsuleServiceDeps) {
  const input = CognitiveKnowledgeDecisionSchema.parse(value);
  return decideCognitiveCapsuleReviewCard(uid, capsuleId, input.reviewCardId, input, { ...deps, requireWritableOwner: true });
}

export async function proposeCognitiveInterview(uid: string, capsuleId: string, value: unknown, deps?: CapsuleServiceDeps) {
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule || capsule.ownerUid !== uid) return null;
  if (capsule.archivedAt) throw Object.assign(new Error('Restore the archived capsule before interviewing.'), { status: 409 });
  const cognition = cognitionOf(capsule);
  const at = (deps?.now?.() ?? new Date()).toISOString();
  const result = proposeFromExpertInterview(value, { capsule: cognition, author: { type: 'human', id: uid, at }, proposalId: `interview-${randomUUID()}` });
  if (result.status === 'needs_answers') return result;
  const next = CognitiveCapsuleSchema.parse({ ...cognition, knowledge: [...cognition.knowledge, ...result.proposals] });
  if (Buffer.byteLength(JSON.stringify(next), 'utf8') > 500_000) throw Object.assign(new Error('Split this capsule before adding an interview.'), { status: 413 });
  const card = await createCapsuleReviewCard(uid, capsuleId, { title: `Interview: ${result.proposals[0].label}`, sourceType: 'user', target: 'capsuleEnvelope', state: 'proposed',
    evidence: Array.from(new Set(result.proposals.flatMap((k) => k.provenance.sourceRefs))).map((id) => ({ id, label: id, advisory: false, sourceType: 'expert-interview' })),
    proposedEnvelopePatch: { cognition: next } }, { ...deps, requireWritableOwner: true });
  return { ...result, card };
}
