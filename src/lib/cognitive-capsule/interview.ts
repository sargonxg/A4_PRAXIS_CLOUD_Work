import { z } from 'zod';
import { CognitiveCapsuleSchema, ConditionSchema, KnowledgeSchema, ProvenanceActorSchema } from './schema';
import { CognitiveGraph } from './graph';
import { proposeKnowledge } from './review';
import type { CognitiveCapsule, Condition, Knowledge, ProvenanceActor } from './types';

export const EXPERT_INTERVIEW_MODES = ['cta', 'critical-decision', 'distinction', 'exception', 'language', 'case'] as const;
export type ExpertInterviewMode = typeof EXPERT_INTERVIEW_MODES[number];
export class ExpertInterviewValidationError extends Error { readonly status = 400; }
export type ExpertInterviewQuestion = { key: string; prompt: string; type: 'text' | 'text-list' | 'conditions' | 'references'; required: boolean; nonEmpty?: boolean };
const text = z.string().trim().max(4000);
const texts = z.array(text.min(1)).max(30);
const refs = z.array(z.string().trim().min(1).max(240)).max(30);
const conditions = z.array(ConditionSchema).max(30);
const common = { label: text.optional(), scope: refs.optional(), sourceRefs: refs.optional() };
const cta = z.object({ ...common, description: text.optional(), onlyWhen: conditions.optional(), falsePositiveConditions: conditions.optional(), followUpChecks: texts.optional(), doNotInfer: texts.optional(), suggests: refs.optional(), exampleRefs: refs.optional() }).strict();
const critical = z.object({ ...common, situation: text.optional(), interpretation: text.optional(), decision: text.optional(), rationale: text.optional(), when: conditions.optional(), exceptions: conditions.optional(), failureModes: texts.optional(), nextChecks: texts.optional(), outcome: text.min(1).optional(), analogyDimensions: texts.optional(), nonTransferableDimensions: texts.optional(), lessons: texts.optional(), cueRefs: refs.optional(), priorCaseRefs: refs.optional() }).strict();
const distinction = z.object({ ...common, conceptA: text.optional(), conceptB: text.optional(), explanation: text.optional(), whyItMatters: text.optional(), commonMistake: text.optional(), decisionTests: texts.optional(), examples: texts.optional(), counterexamples: texts.optional() }).strict();
const exception = z.object({ ...common, ruleRefs: refs.optional(), when: conditions.optional(), explanation: text.optional(), requiredChecks: texts.optional() }).strict();
const language = z.object({ ...common, expression: text.optional(), language: z.string().trim().max(40).optional(), domain: text.optional(), meaning: text.optional(), nonImplications: texts.optional(), implications: texts.optional(), audience: texts.optional(), preferredAlternatives: texts.optional(), avoidAlternatives: texts.optional(), speechAct: text.min(1).optional(), exampleRefs: refs.optional() }).strict();
const caseAnswers = z.object({ ...common, situation: text.optional(), interpretation: text.optional(), decision: text.optional(), analogyDimensions: texts.optional(), nonTransferableDimensions: texts.optional(), lessons: texts.optional(), outcome: text.min(1).optional(), cueRefs: refs.optional() }).strict();
export const ExpertInterviewInputSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('cta'), answers: cta }).strict(),
  z.object({ mode: z.literal('critical-decision'), answers: critical }).strict(),
  z.object({ mode: z.literal('distinction'), answers: distinction }).strict(),
  z.object({ mode: z.literal('exception'), answers: exception }).strict(),
  z.object({ mode: z.literal('language'), answers: language }).strict(),
  z.object({ mode: z.literal('case'), answers: caseAnswers }).strict(),
]);
export type ExpertInterviewInput = z.infer<typeof ExpertInterviewInputSchema>;
export type ExpertInterviewResult =
  | { status: 'needs_answers'; missingQuestions: ExpertInterviewQuestion[]; proposals: [] }
  | { status: 'ready'; missingQuestions: []; proposals: Knowledge[] };

function q(key: string, prompt: string, type: ExpertInterviewQuestion['type'] = 'text', required = true, nonEmpty = false): ExpertInterviewQuestion { return { key, prompt, type, required, ...(nonEmpty ? { nonEmpty: true } : {}) }; }
const commonQuestions = [
  q('label', 'What short name identifies this lesson?'),
  q('scope', 'In which domains or situations does this lesson apply?', 'references', true, true),
  q('sourceRefs', 'Which existing evidence span IDs support your account? Use an empty list for recollection without documentary evidence.', 'references'),
];
const modeQuestions: Record<ExpertInterviewMode, ExpertInterviewQuestion[]> = {
  cta: [q('description', 'What clue does a beginner usually miss?'), q('onlyWhen', 'When is this clue meaningful? Supply conditions, or an explicit empty list if unknown.', 'conditions'), q('falsePositiveConditions', 'When could the clue mislead you? Supply conditions, or an explicit empty list if unknown.', 'conditions'), q('followUpChecks', 'What would you check before using this clue in a briefing?', 'text-list'), q('doNotInfer', 'What plausible conclusion should a novice avoid?', 'text-list'), q('suggests', 'Which existing semantic record IDs does the clue suggest?', 'references', false), q('exampleRefs', 'Which existing evidence span IDs illustrate the clue?', 'references', false)],
  'critical-decision': [q('situation', 'Describe the real incident that required a decision.'), q('interpretation', 'What did you notice, and how did your interpretation change?'), q('decision', 'What did you actually do next?'), q('rationale', 'Why did you choose that action over the alternatives?'), q('when', 'Which explicit conditions make that practice applicable?', 'conditions', true, true), q('exceptions', 'When would you not apply it? Give conditions, or an explicit empty list if unknown.', 'conditions'), q('failureModes', 'What would have made the chosen action wrong?', 'text-list'), q('nextChecks', 'What missing evidence or follow-up checks would change your judgment?', 'text-list'), q('outcome', 'What was the observed outcome?', 'text', false), q('analogyDimensions', 'Which features might transfer to another incident?', 'text-list', false), q('nonTransferableDimensions', 'Where would the analogy fail?', 'text-list', false), q('lessons', 'Which lessons do you explicitly draw from the incident?', 'text-list', false), q('cueRefs', 'Which existing cue IDs did you attend to?', 'references', false), q('priorCaseRefs', 'Which existing case IDs did this incident remind you of?', 'references', false)],
  distinction: [q('conceptA', 'What is the first concept people collapse?'), q('conceptB', 'What is the second concept that must stay distinct?'), q('explanation', 'How do those concepts differ?'), q('whyItMatters', 'Why does the distinction change an analytical decision?'), q('commonMistake', 'What mistake do junior analysts make?'), q('decisionTests', 'What tests distinguish the concepts in practice?', 'text-list', true, true), q('examples', 'Give concrete examples.', 'text-list', false), q('counterexamples', 'Give counterexamples where the obvious shortcut fails.', 'text-list', false)],
  exception: [q('ruleRefs', 'Which existing knowledge record IDs identify the rule that fails?', 'references', true, true), q('when', 'Which explicit conditions trigger this exception?', 'conditions', true, true), q('explanation', 'Why does the otherwise useful rule fail here?'), q('requiredChecks', 'What must be checked before relying on this exception?', 'text-list')],
  language: [q('expression', 'Which exact expression carries special meaning?'), q('language', 'What language is the expression in?'), q('domain', 'In which institutional or professional domain is it used?'), q('meaning', 'What does the expression mean in that domain?'), q('nonImplications', 'What must readers not infer from those words?', 'text-list', true, true), q('implications', 'What may those words imply?', 'text-list', false), q('audience', 'Which audiences shape the wording?', 'text-list', false), q('preferredAlternatives', 'Which substitutions preserve the distinction?', 'text-list', false), q('avoidAlternatives', 'Which substitutions would distort the meaning?', 'text-list', false), q('speechAct', 'What speech act does the wording perform?', 'text', false), q('exampleRefs', 'Which existing evidence span IDs preserve examples of the wording?', 'references', false)],
  case: [q('situation', 'Describe the actual case situation.'), q('interpretation', 'How did you interpret the situation?'), q('decision', 'What decision was actually made?'), q('analogyDimensions', 'Which concrete dimensions support comparison with another case?', 'text-list', true, true), q('nonTransferableDimensions', 'Which dimensions must not transfer to another case?', 'text-list'), q('lessons', 'What lessons do you explicitly draw from the case?', 'text-list'), q('outcome', 'What outcome was actually observed?', 'text', false), q('cueRefs', 'Which existing cue IDs informed the judgment?', 'references', false)],
};

export function getExpertInterviewQuestions(mode: ExpertInterviewMode): ExpertInterviewQuestion[] {
  const validatedMode = z.enum(EXPERT_INTERVIEW_MODES).parse(mode);
  return structuredClone([...commonQuestions, ...modeQuestions[validatedMode]]);
}

/** Local deterministic elicitation only. No model calls, evidence invention, acceptance or persistence. */
export function proposeFromExpertInterview(value: unknown, context: { capsule: CognitiveCapsule; author: ProvenanceActor; proposalId: string }): ExpertInterviewResult {
  const input = ExpertInterviewInputSchema.parse(value); const capsule = CognitiveCapsuleSchema.parse(context.capsule);
  const author = ProvenanceActorSchema.parse(context.author);
  if (author.type !== 'human') throw new ExpertInterviewValidationError('Expert interviews require a named human author.');
  const proposalId = z.string().trim().min(1).max(220).parse(context.proposalId);
  const records = [...capsule.nodes, ...capsule.statements, ...capsule.evidence, ...capsule.knowledge];
  if (records.some((r) => r.id === proposalId || r.id === `${proposalId}:incident`)) throw new ExpertInterviewValidationError('Interview proposal identity already exists.');
  const spans = new Set(capsule.evidence.filter((s) => s.anchorStatus !== 'unresolved').map((s) => s.id)); const known = new Set(records.map((r) => r.id));
  const nodes = new Set(capsule.nodes.map((n) => n.id)); const statements = new Set(capsule.statements.map((s) => s.id));
  const answers = input.answers as Record<string, unknown>;
  for (const key of ['sourceRefs', 'exampleRefs']) for (const ref of (answers[key] ?? []) as string[]) if (!spans.has(ref)) throw new ExpertInterviewValidationError(`Unknown evidence span anchor: ${ref}.`);
  for (const key of ['suggests', 'cueRefs']) for (const ref of (answers[key] ?? []) as string[]) if (!known.has(ref)) throw new ExpertInterviewValidationError(`Unknown semantic reference: ${ref}.`);
  for (const ref of (answers.ruleRefs ?? []) as string[]) if (!capsule.knowledge.some((k) => k.id === ref)) throw new ExpertInterviewValidationError(`Unknown referenced rule: ${ref}.`);
  for (const ref of (answers.priorCaseRefs ?? []) as string[]) if (!capsule.knowledge.some((k) => k.id === ref && k.kind === 'case')) throw new ExpertInterviewValidationError(`Unknown referenced case: ${ref}.`);
  for (const key of ['when', 'exceptions', 'onlyWhen', 'falsePositiveConditions']) for (const condition of (answers[key] ?? []) as Condition[]) {
    if (condition.kind === 'node' && !nodes.has(condition.key)) throw new ExpertInterviewValidationError(`Unknown condition node reference: ${condition.key}.`);
    if (condition.kind === 'statement' && !statements.has(condition.key)) throw new ExpertInterviewValidationError(`Unknown condition statement reference: ${condition.key}.`);
  }
  const missingQuestions = getExpertInterviewQuestions(input.mode).filter((question) => {
    if (!question.required) return false; const answer = answers[question.key];
    return answer === undefined || (typeof answer === 'string' && !answer.trim()) || (question.nonEmpty && Array.isArray(answer) && !answer.length);
  });
  if (input.mode === 'language' && input.answers.language && input.answers.language.length < 2 && !missingQuestions.some((q) => q.key === 'language')) missingQuestions.push(getExpertInterviewQuestions('language').find((q) => q.key === 'language')!);
  if (missingQuestions.length) return { status: 'needs_answers', missingQuestions, proposals: [] };
  const base = { id: proposalId, label: input.answers.label!, scope: input.answers.scope!, reviewState: 'proposed', provenance: { generatedBy: author, sourceRefs: input.answers.sourceRefs!, derivedFrom: [], confidenceKind: 'human-authored' } };
  let proposals: Knowledge[];
  switch (input.mode) {
    case 'cta': { const a = input.answers; proposals = [KnowledgeSchema.parse({ ...base, kind: 'cue', description: a.description, onlyWhen: a.onlyWhen, falsePositiveConditions: a.falsePositiveConditions, followUpChecks: a.followUpChecks, doNotInfer: a.doNotInfer, suggests: a.suggests ?? [], examples: a.exampleRefs ?? [] })]; break; }
    case 'critical-decision': {
      const a = input.answers; const incidentId = `${proposalId}:incident`;
      proposals = [KnowledgeSchema.parse({ ...base, id: incidentId, kind: 'case', situation: a.situation, interpretation: a.interpretation, decision: a.decision, outcome: a.outcome, cues: a.cueRefs ?? [], analogyDimensions: a.analogyDimensions ?? [], nonTransferableDimensions: a.nonTransferableDimensions ?? [], lessons: a.lessons ?? [] }),
        KnowledgeSchema.parse({ ...base, kind: 'heuristic', when: a.when, exceptions: a.exceptions, interpretation: a.interpretation, action: a.decision, rationale: a.rationale, failureModes: a.failureModes, nextChecks: a.nextChecks, attendTo: a.cueRefs ?? [], cases: [incidentId, ...(a.priorCaseRefs ?? [])] })]; break;
    }
    case 'distinction': { const a = input.answers; proposals = [KnowledgeSchema.parse({ ...base, kind: 'distinction', conceptA: a.conceptA, conceptB: a.conceptB, explanation: a.explanation, whyItMatters: a.whyItMatters, commonMistake: a.commonMistake, decisionTests: a.decisionTests, examples: a.examples ?? [], counterexamples: a.counterexamples ?? [] })]; break; }
    case 'exception': { const a = input.answers; proposals = [KnowledgeSchema.parse({ ...base, kind: 'exception', ruleRefs: a.ruleRefs, when: a.when, explanation: a.explanation, requiredChecks: a.requiredChecks })]; break; }
    case 'language': { const a = input.answers; proposals = [KnowledgeSchema.parse({ ...base, kind: 'languageRule', expression: a.expression, language: a.language, domain: a.domain, meaning: a.meaning, nonImplications: a.nonImplications, implications: a.implications ?? [], audience: a.audience ?? [], preferredAlternatives: a.preferredAlternatives ?? [], avoidAlternatives: a.avoidAlternatives ?? [], speechAct: a.speechAct, examples: a.exampleRefs ?? [] })]; break; }
    case 'case': { const a = input.answers; proposals = [KnowledgeSchema.parse({ ...base, kind: 'case', situation: a.situation, interpretation: a.interpretation, decision: a.decision, outcome: a.outcome, analogyDimensions: a.analogyDimensions, nonTransferableDimensions: a.nonTransferableDimensions, lessons: a.lessons, cues: a.cueRefs ?? [] })]; break; }
  }
  proposals = proposals.map((p) => proposeKnowledge(p, author));
  const candidate = { ...capsule, knowledge: [...capsule.knowledge, ...proposals] }; const ids = new Set(proposals.map((p) => p.id));
  const issues = new CognitiveGraph(candidate).validate().filter((issue) => ids.has(issue.id));
  if (issues.length) throw new ExpertInterviewValidationError(`Interview proposal references are invalid: ${issues.map((i) => i.code).join(', ')}.`);
  return { status: 'ready', missingQuestions: [], proposals };
}
