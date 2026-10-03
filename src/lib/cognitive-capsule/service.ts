import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Transaction } from 'firebase-admin/firestore';
import { getCapsule, createCapsuleReviewCard, decideCognitiveCapsuleReviewCard, listCapsuleReviewCardsPage, stageCognitiveCapsuleDraft, type CapsuleServiceDeps, type PraxisCapsule } from '@/lib/context/capsule-service';
import type { CognitiveCapsule } from './types';
import { normalizeToLatest } from '@/lib/context/capsule-schema';
import { CognitiveCapsuleSchema, ConditionSchema, KnowledgeSchema, ProcedureStepsSchema, CognitiveNodeSchema, CognitiveStatementSchema } from './schema';
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
  validFrom: z.string().max(80).optional(), validUntil: z.string().max(80).optional(), originRef: z.string().trim().min(1).max(240).optional(),
  suggests: refs.optional(), significance: z.enum(['weak', 'moderate', 'strong', 'context_dependent']).optional(),
  falsePositiveConditions: z.array(ConditionSchema).max(30).optional(), exampleRefs: refs.optional(),
  optionalCues: z.array(ConditionSchema).max(30).optional(), failureConditions: z.array(ConditionSchema).max(30).optional(), likelyEvolution: z.array(text).max(30).optional(),
  attendTo: refs.optional(), action: text.optional(), failureModes: z.array(text).max(30).optional(), caseRefs: refs.optional(),
  commonMistake: text.optional(), examples: z.array(text).max(30).optional(), counterexamples: z.array(text).max(30).optional(), expertRefs: refs.optional(),
  resolves: refs.optional(), inputs: z.array(text).max(30).optional(), outputs: z.array(text).max(30).optional(),
  escalationConditions: z.array(ConditionSchema).max(30).optional(), structuredSteps: ProcedureStepsSchema.optional(),
  cues: refs.optional(), nonTransferableDimensions: z.array(text).max(30).optional(), outOfScope: z.boolean().optional(),
  audience: z.array(text).max(30).optional(), preferredAlternatives: z.array(text).max(30).optional(),
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
  reason: z.string().trim().min(1).max(600), edited: z.union([KnowledgeSchema, CognitiveNodeSchema, CognitiveStatementSchema]).optional(),
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
    cognitiveNodeIds: card.cognitiveNodeIds ?? [], cognitiveStatementIds: card.cognitiveStatementIds ?? [], cognitiveSupersededIds: card.cognitiveSupersededIds ?? [],
    cognitiveProfileChanged: card.cognitiveProfileChanged === true,
    evidence: card.evidence, applyMetadata: card.applyMetadata, createdAt: card.createdAt, updatedAt: card.updatedAt,
    proposedEnvelopePatch: { cognition: { ...card.proposedEnvelopePatch.cognition!,
      nodes: card.proposedEnvelopePatch.cognition!.nodes.filter((item) => card.cognitiveNodeIds?.includes(item.id)),
      statements: card.proposedEnvelopePatch.cognition!.statements.filter((item) => card.cognitiveStatementIds?.includes(item.id)),
      knowledge: card.proposedEnvelopePatch.cognition!.knowledge.filter((item) => card.cognitiveKnowledgeIds?.includes(item.id)) } },
  }));
  return { capsuleId, capsuleVersion: capsule.version, hasSavedCognition: Boolean(capsule.cognition), allowDownload: capsule.access?.allowDownload === true, cognition, quality: cognitiveQuality(cognition), validation: graph.validate(), jsonLd: graph.toJsonLd(),
    reviewCards: cards, nextCursor: page.nextCursor, hasMore: page.hasMore };
}

function contentFields(input: CognitiveKnowledgeCapture): Record<string, unknown> {
  const checks = input.checks ?? [];
  const rationale = input.rationale ?? input.body;
  switch (input.kind) {
    case 'cue': return { description: input.body, followUpChecks: checks, onlyWhen: input.when ?? [], doNotInfer: input.nonImplications ?? [], suggests: input.suggests ?? [], significance: input.significance ?? 'context_dependent', falsePositiveConditions: input.falsePositiveConditions ?? [], examples: input.exampleRefs ?? [] };
    case 'pattern': return { interpretation: input.body, expectedCues: input.when ?? [], disconfirmingCues: input.exceptions ?? [], recommendedChecks: checks, optionalCues: input.optionalCues ?? [], failureConditions: input.failureConditions ?? [], likelyEvolution: input.likelyEvolution ?? [] };
    case 'heuristic': return { interpretation: input.body, rationale, when: input.when ?? [], exceptions: input.exceptions ?? [], nextChecks: checks, attendTo: input.attendTo ?? [], action: input.action, failureModes: input.failureModes ?? [], cases: input.caseRefs ?? [] };
    case 'distinction': return { conceptA: input.terms![0], conceptB: input.terms![1], explanation: input.body, whyItMatters: rationale, commonMistake: input.commonMistake ?? input.label, decisionTests: checks, examples: input.examples ?? [], counterexamples: input.counterexamples ?? [], expertRefs: input.expertRefs ?? [] };
    case 'exception': return { explanation: input.body, when: input.when ?? [], ruleRefs: input.ruleRefs ?? [], requiredChecks: checks };
    case 'redFlag': return { description: input.body, possibleSignificance: rationale, onlyWhen: input.when ?? [], doNotInfer: input.nonImplications ?? [], nextEvidence: checks };
    case 'question': return { question: input.label, whyItMatters: input.body, requiredEvidence: checks, resolves: input.resolves ?? [] };
    case 'languageRule': return { expression: input.label, language: input.language!, meaning: input.body, domain: input.scope[0], speechAct: input.speechAct,
      implications: input.implications ?? [], nonImplications: input.nonImplications ?? [], avoidAlternatives: input.avoidAlternatives ?? [], examples: input.exampleRefs ?? [], audience: input.audience ?? [], preferredAlternatives: input.preferredAlternatives ?? [] };
    case 'procedure': return { purpose: input.body, steps: input.structuredSteps ?? checks.map((instruction, index) => ({ id: `step-${index + 1}`, instruction })), stopConditions: input.exceptions ?? [], escalationConditions: input.escalationConditions ?? [], inputs: input.inputs ?? [], outputs: input.outputs ?? [] };
    case 'case': return { situation: input.situation!, interpretation: input.body, decision: input.decision!,
      outcome: input.outcome, analogyDimensions: input.analogyDimensions ?? [], lessons: checks, cues: input.cues ?? [], nonTransferableDimensions: input.nonTransferableDimensions ?? [] };
    case 'unknown': return { description: input.body, requiredEvidence: checks, outOfScope: input.outOfScope ?? false };
    case 'revisionTrigger': return { when: input.when ?? [], affectedIds: input.affectedIds ?? [], action: input.body };
  }
}

export async function proposeCognitiveKnowledge(uid: string, capsuleId: string, value: unknown, deps?: CapsuleServiceDeps, authorship?: { type: 'human' | 'model'; id: string; expectedCapsuleVersion?: number }) {
  const input = CognitiveKnowledgeCaptureSchema.parse(value);
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule || capsule.ownerUid !== uid) return null;
  if (capsule.archivedAt) throw Object.assign(new Error('Restore the archived capsule before capturing expertise.'), { status: 409 });
  if (authorship?.expectedCapsuleVersion !== undefined && capsule.version !== authorship.expectedCapsuleVersion) throw Object.assign(new Error('The capsule changed after proposal generation. Reload and generate a new proposal.'), { status: 409 });
  const cognition = cognitionOf(capsule);
  const timestamp = (deps?.now?.() ?? new Date()).toISOString();
  const actor = { type: authorship?.type ?? 'human', id: authorship?.type === 'model' ? authorship.id : uid, at: timestamp };
  const sourceRefs = Array.from(new Set((input.sourceRefs ?? []).flatMap((id) => {
    const spans = cognition.evidence.filter((span) => span.anchorStatus !== 'unresolved' && (span.id === id || span.sourceId === id));
    if (!spans.length) throw Object.assign(new Error(`Attach an evidence excerpt for source reference ${id} before using it in expertise.`), { status: 400 });
    return spans.map((span) => span.id);
  })));
  const knowledge = proposeKnowledge({ id: `expertise-${randomUUID()}`, kind: input.kind, label: input.label, scope: input.scope,
    ...(input.validFrom ? { validFrom: input.validFrom } : {}), ...(input.validUntil ? { validUntil: input.validUntil } : {}),
    provenance: { generatedBy: actor, sourceRefs, derivedFrom: input.originRef ? [input.originRef] : [], confidenceKind: actor.type === 'model' ? 'model-proposed' : 'human-authored' }, ...contentFields(input) }, actor);
  const next = CognitiveCapsuleSchema.parse({ ...cognition, knowledge: [...cognition.knowledge, knowledge] });
  const existingIssues = new Set(new CognitiveGraph(cognition).validate().map((issue) => JSON.stringify(issue)));
  const newIssue = new CognitiveGraph(next).validate().find((issue) => !existingIssues.has(JSON.stringify(issue)));
  if (newIssue) throw Object.assign(new Error(newIssue.message), { status: 400 });
  if (Buffer.byteLength(JSON.stringify(next), 'utf8') > 500_000) throw Object.assign(new Error('This capsule is too large for another expertise proposal. Split it into smaller capsules.'), { status: 413 });
  const card = await createCapsuleReviewCard(uid, capsuleId, { expectedCapsuleVersion: capsule.version, title: `${input.kind}: ${input.label}`, sourceType: actor.type === 'model' ? 'agent' : 'user', target: 'capsuleEnvelope', state: 'proposed',
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
  const card = await createCapsuleReviewCard(uid, capsuleId, { expectedCapsuleVersion: capsule.version, title: `Interview: ${result.proposals[0].label}`, sourceType: 'user', target: 'capsuleEnvelope', state: 'proposed',
    evidence: Array.from(new Set(result.proposals.flatMap((k) => k.provenance.sourceRefs))).map((id) => ({ id, label: id, advisory: false, sourceType: 'expert-interview' })),
    proposedEnvelopePatch: { cognition: next } }, { ...deps, requireWritableOwner: true });
  return { ...result, card };
}

const { provenance: _nodeProvenance, reviewState: _nodeState, ...nodeFields } = CognitiveNodeSchema.shape;
const { provenance: _statementProvenance, reviewState: _statementState, ...statementFields } = CognitiveStatementSchema.shape;
export const CognitiveGraphProposalSchema = z.object({ operation: z.literal('graph-proposal'), baseVersion: z.number().int().positive(),
  profile: CognitiveCapsuleSchema.shape.profile.unwrap().optional(),
  nodes: z.array(z.object({ ...nodeFields, reviewState: z.enum(['proposed', 'superseded']).default('proposed') }).strict()).max(100).default([]),
  statements: z.array(z.object({ ...statementFields, reviewState: z.enum(['proposed', 'superseded']).default('proposed') }).strict()).max(100).default([]),
}).strict().refine((input) => input.profile !== undefined || input.nodes.length + input.statements.length > 0, 'Supply a profile or at least one graph proposal.');
export const CognitiveModelProposalSchema = z.object({ operation: z.literal('model-proposal'), capture: CognitiveKnowledgeCaptureSchema }).strict();

export async function proposeCognitiveGraph(uid: string, capsuleId: string, value: unknown, deps?: CapsuleServiceDeps) {
  const input = CognitiveGraphProposalSchema.parse(value);
  const capsule = await getCapsule(uid, capsuleId, deps);
  if (!capsule || capsule.ownerUid !== uid) return null;
  if (capsule.archivedAt || capsule.version !== input.baseVersion) throw Object.assign(new Error('Reload the current writable capsule before proposing graph changes.'), { status: 409 });
  const cognition = cognitionOf(capsule); const at = (deps?.now?.() ?? new Date()).toISOString();
  const author = { type: 'human' as const, id: uid, at };
  const upsert = <T extends { id: string }>(before: T[], after: T[]) => { const replacements = new Map(after.map((r) => [r.id, r]));
    if (replacements.size !== after.length) throw Object.assign(new Error('Graph proposals require unique record IDs.'), { status: 400 });
    return [...before.map((r) => replacements.get(r.id) ?? r), ...after.filter((r) => !before.some((old) => old.id === r.id))]; };
  const nodes = input.nodes.map((node) => CognitiveNodeSchema.parse({ ...node, provenance: cognition.nodes.find((n) => n.id === node.id)?.provenance
    ?? { generatedBy: author, sourceRefs: [], confidenceKind: 'human-authored' } }));
  const statements = input.statements.map((statement) => {
    for (const ref of [...statement.sourceRefs, ...(statement.wordingRef ? [statement.wordingRef] : [])]) if (!cognition.evidence.some((e) => e.id === ref && e.anchorStatus !== 'unresolved'))
      throw Object.assign(new Error(`Attach a resolved evidence excerpt before using ${ref} in a graph proposal.`), { status: 400 });
    const old = cognition.statements.find((s) => s.id === statement.id);
    return CognitiveStatementSchema.parse({ ...statement, provenance: { ...(old?.provenance ?? { generatedBy: author, confidenceKind: 'human-authored' }), sourceRefs: statement.sourceRefs } });
  });
  const next = CognitiveCapsuleSchema.parse({ ...cognition, ...(input.profile ? { profile: input.profile } : {}), nodes: upsert(cognition.nodes, nodes), statements: upsert(cognition.statements, statements) });
  const issues = new CognitiveGraph(next).validate();
  if (issues.length) throw Object.assign(new Error(issues.map((i) => i.message).join(' ')), { status: 400 });
  const card = await createCapsuleReviewCard(uid, capsuleId, { expectedCapsuleVersion: input.baseVersion, title: 'Review proposed graph changes', sourceType: 'user', target: 'graphProposal', state: 'proposed',
    evidence: [], proposedEnvelopePatch: { cognition: next } }, { ...deps, requireWritableOwner: true });
  return { card };
}

export async function stageRegistryCapsuleInstallation(uid: string, input: { cognition: CognitiveCapsule; registryName: string; registryVersion: string; artifactDigest: string;
  sourceEnvelopeVersion?: number; previousDraftCapsuleId?: string }, deps?: CapsuleServiceDeps, transaction?: Transaction) {
  const cognition = CognitiveCapsuleSchema.parse(input.cognition);
  const registryName = z.string().min(1).max(240).parse(input.registryName);
  const registryVersion = z.string().regex(/^\d+\.\d+\.\d+$/).parse(input.registryVersion);
  const artifactDigest = z.string().regex(/^sha256:[a-f0-9]{64}$/).parse(input.artifactDigest);
  if (registryName !== cognition.capsuleId || registryVersion !== cognition.version) throw Object.assign(new Error('Native registry identity does not match its exact locked version.'), { status: 400 });
  if (input.previousDraftCapsuleId && !transaction) { const previous = await getCapsule(uid, input.previousDraftCapsuleId, deps); if (!previous || previous.ownerUid !== uid) throw Object.assign(new Error('The previous draft is not owned by you.'), { status: 404 }); }
  const capsuleId = `registry-${createHash('sha256').update(JSON.stringify([uid, registryName, registryVersion, artifactDigest])).digest('hex').slice(0, 32)}`;
  const result = await stageCognitiveCapsuleDraft(uid, cognition, { capsuleId, label: registryName, memoryPosture: { registryInstallation: { registryName, registryVersion, artifactDigest,
    sourceCapsuleId: cognition.capsuleId, lockedDependencies: cognition.dependencies, ...(input.sourceEnvelopeVersion !== undefined ? { sourceEnvelopeVersion: input.sourceEnvelopeVersion } : {}),
    ...(input.previousDraftCapsuleId ? { previousDraftCapsuleId: input.previousDraftCapsuleId } : {}) } } }, deps, transaction);
  return { draftCapsuleId: result.capsule.capsuleId, reviewCardId: result.reviewCard.reviewCardId };
}
