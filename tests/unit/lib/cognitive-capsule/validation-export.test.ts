import { describe, expect, it } from 'vitest';
import { cognitiveConstraintProjection, cognitiveShaclShapes } from '@/lib/cognitive-capsule/validation-export';
import { CognitiveGraph } from '@/lib/cognitive-capsule/graph';
import { CognitiveNodeSchema, CognitiveStatementSchema, KnowledgeSchema, createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';

const at = '2026-10-03T00:00:00Z';
const human = { type: 'human', id: 'expert', at };
const provenance = { generatedBy: human, sourceRefs: [], reviewedBy: human, reviewedAt: at };

describe('portable SHACL constraint projection', () => {
  it('exposes the same accepted commitment actor requirement as the runtime graph validator', () => {
    const c = createCognitiveCapsule('constraints');
    c.nodes.push(CognitiveNodeSchema.parse({ id: 'promise', type: 'aco:Commitment', label: 'Promise', layer: 'world', reviewState: 'accepted', provenance }));
    expect(new CognitiveGraph(c).validate()).toContainEqual(expect.objectContaining({ code: 'commitment-without-actor' }));
    const missing = cognitiveConstraintProjection(c)['@graph'].find(row => row['@type'] === 'AcceptedCommitment');
    expect(missing?.actor).toEqual([]);
    c.nodes.push(CognitiveNodeSchema.parse({ id: 'actor', type: 'aco:Actor', label: 'Actor', layer: 'world', reviewState: 'accepted', provenance }));
    c.statements.push(CognitiveStatementSchema.parse({ id: 'link', subject: 'promise', predicate: 'HAS_ACTOR', object: { node: 'actor' }, layer: 'argument', polarity: 'positive', reviewState: 'accepted', provenance }));
    expect(new CognitiveGraph(c).validate()).toEqual([]);
    expect(cognitiveConstraintProjection(c)['@graph'].find(row => row['@type'] === 'AcceptedCommitment')?.actor).toHaveLength(1);
    expect(cognitiveShaclShapes()).toContain('sh:path cc:actor ; sh:minCount 1');
  });
  it('keeps missing speaker, missing applicability, evidence-free factual claim and dateless identity invalid', () => {
    const statement = { id: 's', subject: 'actor', predicate: 'SAID', object: { literal: 'Wording' }, layer: 'language', polarity: 'positive', provenance };
    expect(CognitiveStatementSchema.safeParse({ ...statement, speechAct: 'openness' }).success).toBe(false);
    expect(CognitiveStatementSchema.safeParse({ ...statement, layer: 'world', reviewState: 'accepted' }).success).toBe(false);
    expect(CognitiveStatementSchema.safeParse({ ...statement, predicate: 'ALIAS_OF', object: { node: 'other' } }).success).toBe(false);
    expect(KnowledgeSchema.safeParse({ id: 'h', kind: 'heuristic', label: 'Rule', scope: ['general'], interpretation: 'Interpretation', rationale: 'Rationale', reviewState: 'accepted', provenance }).success).toBe(false);
    const ttl = cognitiveShaclShapes();
    for (const name of ['SpeechActShape', 'HeuristicShape', 'EvidenceBoundClaimShape', 'ActorIdentityShape']) expect(ttl).toContain(name);
  });
});
