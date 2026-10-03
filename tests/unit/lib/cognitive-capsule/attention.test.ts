import { describe, expect, it } from 'vitest';
import { compileContext, renderContext } from '@/lib/cognitive-capsule/compiler';
import { createCognitiveCapsule, KnowledgeSchema, CognitiveNodeSchema, CognitiveStatementSchema, EvidenceSpanSchema } from '@/lib/cognitive-capsule/schema';

const at = '2026-10-03T12:00:00Z';
const actor = { type: 'human', id: 'expert', at };
const common = { scope: ['diplomacy'], reviewState: 'accepted', provenance: { generatedBy: actor, reviewedBy: actor, reviewedAt: at, sourceRefs: [] } };
const input = { objective: 'Does prepared to consider establish diplomatic acceptance?', role: 'capsule-curator' as const, scope: 'diplomacy', asOf: at };
function fixture() {
  const capsule = createCognitiveCapsule('attention');
  capsule.knowledge = [
    KnowledgeSchema.parse({ ...common, kind: 'distinction', id: 'unrelated', label: 'Allocation and obligation', conceptA: 'allocation', conceptB: 'obligation', explanation: 'Accounting stages differ.', whyItMatters: 'Keep stages separate.', commonMistake: 'Conflating stages.' }),
    KnowledgeSchema.parse({ ...common, kind: 'languageRule', id: 'openness', label: 'Diplomatic acceptance', expression: 'prepared to consider', language: 'en', domain: 'diplomacy', meaning: 'Conditional exploratory openness.', nonImplications: ['acceptance', 'commitment'] }),
  ];
  return capsule;
}

describe('deterministic task attention', () => {
  it('transmits both direct and provenance evidence for selected statements atomically', () => {
    const capsule = createCognitiveCapsule('sources');
    capsule.nodes.push(CognitiveNodeSchema.parse({ id: 'actor', type: 'Actor', layer: 'world', label: 'State A', provenance: common.provenance }));
    capsule.statements.push(CognitiveStatementSchema.parse({ id: 'claim', subject: 'actor', predicate: 'CONSIDERS', object: { literal: 'arrangement' }, layer: 'language', polarity: 'positive',
      reviewState: 'accepted', sourceRefs: ['direct'], provenance: { ...common.provenance, sourceRefs: ['origin'] } }));
    capsule.evidence = ['direct', 'origin'].map(id => EvidenceSpanSchema.parse({ id, sourceId: 'speech', sourceVersion: 'rev1', quote: `${id} passage` }));
    const view = compileContext(capsule, { ...input, maxChars: 6000 });
    expect(view.statements.map(record => record.id)).toEqual(['claim']);
    expect(view.evidence.map(record => record.id).sort()).toEqual(['direct', 'origin']);
    expect(view.receipt.evidenceSpans.map(record => record.id).sort()).toEqual(['direct', 'origin']);
  });
  it('prioritizes relevant wording independently of saved array order without a confidence score', () => {
    const capsule = fixture();
    const first = compileContext(capsule, input);
    capsule.knowledge.reverse();
    const reversed = compileContext(capsule, input);
    expect(first.knowledge.map((record) => record.id)).toEqual(['openness', 'unrelated']);
    expect(reversed.knowledge.map((record) => record.id)).toEqual(['openness', 'unrelated']);
    expect(first.receipt.attentionPolicy).toMatchObject({ algorithm: 'task-terms-and-kinds/1', prioritizedKinds: expect.arrayContaining(['languageRule']) });
    expect(JSON.stringify(first.receipt)).not.toContain('confidenceScore');
  });

  it('retains relevant knowledge and its evidence atomically before unrelated long records', () => {
    const capsule = fixture();
    const irrelevant = capsule.knowledge[0];
    if (irrelevant.kind === 'distinction') irrelevant.explanation = 'Unrelated budget stage. '.repeat(140);
    capsule.evidence.push({ id: 'speech', sourceId: 'meeting', sourceVersion: 'sha256:record', quote: 'We are prepared to consider arrangements.', anchorStatus: 'exact', stance: 'qualifies' });
    capsule.knowledge[1].provenance.sourceRefs = ['speech'];
    const view = compileContext(capsule, { ...input, maxChars: 1700 });
    expect(view.knowledge.map((record) => record.id)).toEqual(['openness']);
    expect(view.evidence.map((record) => record.id)).toEqual(['speech']);
    expect(view.omissions).toContainEqual({ id: 'unrelated', reason: 'context-budget' });
    expect(renderContext(view).length).toBeLessThanOrEqual(1700);
  });

  it('never turns a relevant unknown applicability guard into an applied rule', () => {
    const capsule = fixture();
    capsule.knowledge.unshift(KnowledgeSchema.parse({ ...common, kind: 'heuristic', id: 'guarded', label: 'Diplomatic acceptance', when: [{ kind: 'context', key: 'continuing-contact', operator: 'present' }], exceptions: [{ kind: 'context', key: 'withdrawal', operator: 'present' }], interpretation: 'Public language may manage audiences.', rationale: 'Check actual contact.' }));
    const view = compileContext(capsule, input);
    expect(view.knowledge.some((record) => record.id === 'guarded')).toBe(false);
    expect(view.guardedCandidates.map((candidate) => candidate.knowledge.id)).toEqual(['guarded']);
    expect(view.receipt.guardedKnowledgeIds).toEqual(['guarded']);
  });
});
