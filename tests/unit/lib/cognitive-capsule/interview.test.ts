import { describe, expect, it } from 'vitest';
import { createCognitiveCapsule, EvidenceSpanSchema, KnowledgeSchema } from '@/lib/cognitive-capsule/schema';
import { EXPERT_INTERVIEW_MODES, getExpertInterviewQuestions, proposeFromExpertInterview } from '@/lib/cognitive-capsule/interview';

const author = { type: 'human' as const, id: 'expert-1', at: '2026-10-03T12:00:00Z' };
function context() {
  const capsule = createCognitiveCapsule('local/interview');
  capsule.evidence.push(EvidenceSpanSchema.parse({ id: 'span-1', sourceId: 'document-1', sourceVersion: '1', quote: 'prepared to consider' }));
  return { capsule, author, proposalId: 'interview-1' };
}
const common = { label: 'Expert lesson', scope: ['diplomacy'], sourceRefs: ['span-1'] };
const when = [{ kind: 'context' as const, key: 'technical-contact', operator: 'present' as const }];

describe('bounded expert interview proposals', () => {
  it('offers deterministic typed questions in all six modes without accepting knowledge', () => {
    expect(EXPERT_INTERVIEW_MODES).toEqual(['cta', 'critical-decision', 'distinction', 'exception', 'language', 'case']);
    for (const mode of EXPERT_INTERVIEW_MODES) {
      const questions = getExpertInterviewQuestions(mode);
      expect(questions.length).toBeGreaterThan(3); expect(questions.length).toBeLessThanOrEqual(20);
      expect(getExpertInterviewQuestions(mode)).toEqual(questions);
      const result = proposeFromExpertInterview({ mode, answers: {} }, context());
      expect(result.status).toBe('needs_answers');
      if (result.status === 'needs_answers') expect(result.missingQuestions.map((q) => q.key)).toContain('label');
    }
  });
  it('requires explicit applicability and exception answers instead of inventing missing conditions', () => {
    const answers = { ...common, situation: 'Public refusal while technical talks continued.', interpretation: 'Refusal may address an audience.', decision: 'Check technical contacts.', rationale: 'Continuing contacts distinguished this incident.', failureModes: [], nextChecks: ['Look for withdrawal.'] };
    const result = proposeFromExpertInterview({ mode: 'critical-decision', answers }, context());
    expect(result.status).toBe('needs_answers');
    if (result.status === 'needs_answers') expect(result.missingQuestions.map((q) => q.key)).toEqual(['when', 'exceptions']);
    const complete = proposeFromExpertInterview({ mode: 'critical-decision', answers: { ...answers, when, exceptions: [] } }, context());
    expect(complete.status).toBe('ready');
    if (complete.status === 'ready') {
      expect(complete.proposals.map((p) => p.kind)).toEqual(['case', 'heuristic']);
      expect(complete.proposals.every((p) => p.reviewState === 'proposed' && !p.provenance.reviewedBy)).toBe(true);
      expect(complete.proposals.find((p) => p.kind === 'heuristic')).toMatchObject({ when, exceptions: [], cases: ['interview-1:incident'] });
    }
  });
  it('creates schema-valid human-authored cue, distinction, language and case proposals preserving limits', () => {
    const inputs = [
      { mode: 'cta', answers: { ...common, description: 'Repeated postponements', onlyWhen: [], falsePositiveConditions: [], followUpChecks: ['Check continued contacts'], doNotInfer: ['Talks have ended'] } },
      { mode: 'distinction', answers: { ...common, conceptA: 'Allocation', conceptB: 'Disbursement', explanation: 'A planned amount differs from paid funds.', whyItMatters: 'Commitments may remain unpaid.', commonMistake: 'Treating a budget line as a payment.', decisionTests: ['Check payment dates.'] } },
      { mode: 'language', answers: { ...common, expression: 'prepared to consider', language: 'en', domain: 'diplomacy', meaning: 'Conditional willingness to examine a proposal.', nonImplications: ['Acceptance'], implications: ['Further discussion possible'] } },
      { mode: 'case', answers: { ...common, situation: 'Contacts continued during a public refusal.', interpretation: 'The public message and technical process diverged.', decision: 'Continue monitoring.', analogyDimensions: ['Continuing contacts'], nonTransferableDimensions: ['Identity of negotiator'], lessons: ['Check both channels.'] } },
    ];
    for (const input of inputs) {
      const result = proposeFromExpertInterview(input, context()); expect(result.status).toBe('ready');
      if (result.status === 'ready') for (const p of result.proposals) {
        expect(KnowledgeSchema.safeParse(p).success).toBe(true);
        expect(p.provenance).toMatchObject({ generatedBy: author, confidenceKind: 'human-authored', sourceRefs: ['span-1'] });
        expect(p.reviewState).toBe('proposed');
      }
    }
  });
  it('requires known source anchors, referenced rules and human authors', () => {
    const answers = { ...common, expression: 'prepared to consider', language: 'en', domain: 'diplomacy', meaning: 'Conditional willingness.', nonImplications: ['Acceptance'] };
    expect(() => proposeFromExpertInterview({ mode: 'language', answers: { ...answers, sourceRefs: ['document-1'] } }, context())).toThrow(/anchor|span/);
    expect(() => proposeFromExpertInterview({ mode: 'language', answers }, { ...context(), author: { ...author, type: 'model' } })).toThrow(/human/);
    expect(() => proposeFromExpertInterview({ mode: 'exception', answers: { ...common, ruleRefs: ['missing-rule'], when, explanation: 'The rule fails here.', requiredChecks: [] } }, context())).toThrow(/reference|rule/);
    expect(() => proposeFromExpertInterview({ mode: 'language', answers: { ...answers, reviewState: 'accepted' } }, context())).toThrow();
  });
  it('captures an exception to a known rule with honest undocumented recollection and bounded inputs', () => {
    const ctx = context();
    ctx.capsule.knowledge.push(KnowledgeSchema.parse({ kind: 'heuristic', id: 'rule-1', label: 'Contact rule', scope: ['diplomacy'], when, exceptions: [], interpretation: 'Contact may leave negotiating room.', rationale: 'Expert practice.', provenance: { generatedBy: author, sourceRefs: ['span-1'], confidenceKind: 'human-authored' } }));
    const answers = { ...common, sourceRefs: [], ruleRefs: ['rule-1'], when, explanation: 'Formal withdrawal changes that interpretation.', requiredChecks: ['Check the withdrawal notice.'] };
    const result = proposeFromExpertInterview({ mode: 'exception', answers }, ctx);
    expect(result.status).toBe('ready');
    if (result.status === 'ready') expect(result.proposals[0]).toMatchObject({ kind: 'exception', ruleRefs: ['rule-1'], provenance: { sourceRefs: [], confidenceKind: 'human-authored' }, reviewState: 'proposed' });
    expect(() => proposeFromExpertInterview({ mode: 'exception', answers: { ...answers, explanation: 'x'.repeat(4001) } }, ctx)).toThrow();
    expect(() => proposeFromExpertInterview({ mode: 'exception', answers: { ...answers, when: [{ kind: 'node', key: 'missing-node', operator: 'present' }] } }, ctx)).toThrow(/reference/);
  });
  it('returns actionable validation errors and refuses unresolved interview anchors', () => {
    const ctx = context();
    const answers = { ...common, expression: 'prepared to consider', language: 'en', domain: 'diplomacy', meaning: 'Conditional willingness.', nonImplications: ['Acceptance'] };
    let caught: unknown;
    try { proposeFromExpertInterview({ mode: 'language', answers: { ...answers, sourceRefs: ['missing'] } }, ctx); } catch (error) { caught = error; }
    expect(caught).toMatchObject({ status: 400 });
    ctx.capsule.evidence[0].anchorStatus = 'unresolved';
    expect(() => proposeFromExpertInterview({ mode: 'language', answers }, ctx)).toThrow(/anchor|span/);
    expect(() => proposeFromExpertInterview({ mode: 'language', answers: { ...answers, sourceRefs: [], exampleRefs: ['span-1'] } }, ctx)).toThrow(/anchor|span/);
  });
});
