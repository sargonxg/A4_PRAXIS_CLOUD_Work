import { describe, expect, it } from 'vitest';
import { CognitiveCapsuleSchema, CognitiveStatementSchema, KnowledgeSchema, EvidenceSpanSchema, createCognitiveCapsule, cognitiveJsonSchema } from '@/lib/cognitive-capsule/schema';
import { fromV3 } from '@/lib/cognitive-capsule/from-v3';
import { CognitiveGraph } from '@/lib/cognitive-capsule/graph';
import { compileContext, renderContext, lockContext } from '@/lib/cognitive-capsule/compiler';
import { decideKnowledge, proposeKnowledge } from '@/lib/cognitive-capsule/review';
import { capsuleDigest, semanticDiff } from '@/lib/cognitive-capsule/integrity';
import { normalizeContextCapsuleV3 } from '@/lib/context/capsule-v3';

const actor = { type: 'human' as const, id: 'expert-1', at: '2026-10-03T12:00:00Z' };
const provenance = { generatedBy: actor, sourceRefs: [], derivedFrom: [], confidenceKind: 'human-authored' as const, reviewedBy: actor, reviewedAt: actor.at };
function language() {
  return KnowledgeSchema.parse({ kind: 'languageRule', id: 'l1', label: 'Conditional openness', scope: ['diplomacy'], reviewState: 'accepted', provenance,
    expression: 'prepared to consider', language: 'en', meaning: 'conditional openness', domain: 'diplomacy', speechAct: 'conditional-openness',
    implications: ['negotiability'], nonImplications: ['acceptance', 'commitment'], avoidAlternatives: ['agreed'] });
}
function capsule() { const c = createCognitiveCapsule('fixture', '1.0.0'); c.knowledge.push(language()); return c; }

describe('cognitive semantic contract', () => {
  it('exports a language neutral schema without replacing V3', () => {
    expect(CognitiveCapsuleSchema.parse(capsule()).schemaVersion).toBe('cognitive-capsule/vNext');
    expect(cognitiveJsonSchema()).toHaveProperty('properties.knowledge');
  });
  it('rejects unsupported accepted factual statements and missing quotation anchors', () => {
    const s = { id: 's1', subject: 'a', predicate: 'ACCEPTS', object: { node: 'b' }, layer: 'world', polarity: 'positive', reviewState: 'accepted', provenance };
    expect(CognitiveStatementSchema.safeParse(s).success).toBe(false);
    expect(CognitiveStatementSchema.safeParse({ ...s, reviewState: 'proposed', wordingRef: 'missing' }).success).toBe(true);
    const c = createCognitiveCapsule('fixture');
    c.nodes.push({ id: 'a', type: 'aco:Actor', label: 'State A', layer: 'world', reviewState: 'proposed', provenance }, { id: 'b', type: 'aco:Commitment', label: 'Proposal', layer: 'world', reviewState: 'proposed', provenance });
    c.statements.push(CognitiveStatementSchema.parse({ ...s, reviewState: 'proposed', wordingRef: 'missing' }));
    expect(new CognitiveGraph(c).validate().some((i) => i.code === 'missing-evidence')).toBe(true);
  });
  it('requires a human review stamp, valid scope and ordered time', () => {
    expect(KnowledgeSchema.safeParse({ ...language(), scope: [] }).success).toBe(false);
    expect(KnowledgeSchema.safeParse({ ...language(), provenance: { ...provenance, reviewedBy: { ...actor, type: 'model' } } }).success).toBe(false);
    expect(KnowledgeSchema.safeParse({ ...language(), validFrom: '2026-10-04', validUntil: '2026-10-03' }).success).toBe(false);
    expect(EvidenceSpanSchema.safeParse({ id: 'e', sourceId: 's', sourceVersion: '1', quote: 'x', start: 10, end: 3 }).success).toBe(false);
  });
  it('preserves legacy tacit entries as proposals without inventing expert conditions', () => {
    const v3 = normalizeContextCapsuleV3({ capsuleId: 'old', ownerUid: 'u', version: 2, humanTacitKnowledge: { practicalHeuristics: ['Public rejection may leave private room.'], redLines: ['No external send.'] } });
    const c = fromV3(v3);
    expect(c.knowledge.some((k) => k.kind === 'heuristic')).toBe(true);
    expect(c.knowledge.every((k) => k.reviewState === 'proposed' && k.migrationStatus === 'needs_review')).toBe(true);
    expect(c.knowledge.find((k) => k.kind === 'heuristic')).toMatchObject({ when: [], exceptions: [] });
    expect(v3.humanTacitKnowledge.practicalHeuristics).toContain('Public rejection may leave private room.');
  });
});

describe('cognitive graph and review', () => {
  it('round trips semantic annotations, exact evidence and expertise through JSON-LD', () => {
    const c = capsule(); c.evidence.push(EvidenceSpanSchema.parse({ id: 'e1', sourceId: 's1', sourceVersion: '1', quote: 'prepared to consider', prefix: 'We are ', page: 1, start: 7, end: 26 }));
    c.nodes.push({ id: 'a', type: 'aco:Actor', label: 'State A', layer: 'world', reviewState: 'proposed', provenance });
    c.statements.push(CognitiveStatementSchema.parse({ id: 's1', subject: 'a', predicate: 'ACCEPTS_CONDITIONALLY', object: { literal: 'proposal' }, layer: 'language', polarity: 'positive', modality: 'conditional', conditions: [{ kind: 'context', key: 'monitoring', operator: 'present' }], exceptions: [], sourceRefs: ['e1'], wordingRef: 'e1', reviewState: 'accepted', provenance }));
    const graph = new CognitiveGraph(c);
    expect(CognitiveGraph.fromJsonLd(graph.toJsonLd()).toCapsule()).toEqual(CognitiveCapsuleSchema.parse(c));
    expect(graph.findSupportingEvidence('s1').map((e) => e.id)).toEqual(['e1']);
    expect(graph.getNode('a')?.label).toBe('State A');
    expect(graph.findLanguageRules('prepared to consider', 'diplomacy')).toHaveLength(1);
  });
  it('excludes heuristics whose exception is present or whose condition is unknown', () => {
    const c = capsule(); c.knowledge.push(KnowledgeSchema.parse({ kind: 'heuristic', id: 'h1', label: 'Contact continues', scope: ['diplomacy'], provenance, reviewState: 'accepted', when: [{ kind: 'context', key: 'public-rejection', operator: 'present' }, { kind: 'context', key: 'technical-contact', operator: 'present' }], exceptions: [{ kind: 'context', key: 'formal-withdrawal', operator: 'present' }], interpretation: 'Audience management may explain rejection', rationale: 'Expert practice rule' }));
    const graph = new CognitiveGraph(c);
    expect(graph.findApplicableHeuristics({ 'public-rejection': true, 'technical-contact': true }, 'diplomacy')).toHaveLength(1);
    expect(graph.findApplicableHeuristics({ 'public-rejection': true, 'technical-contact': true, 'formal-withdrawal': true }, 'diplomacy')).toHaveLength(0);
    expect(graph.findApplicableHeuristics({}, 'diplomacy')).toHaveLength(0);
  });
  it('creates correction proposals and requires evidence before accepting an incomplete migration', () => {
    const proposed = proposeKnowledge(language(), { ...actor, type: 'model' });
    expect(proposed.reviewState).toBe('proposed');
    expect(proposed.provenance.reviewedBy).toBeUndefined();
    const pending = decideKnowledge(proposed, { decision: 'need_evidence', reviewer: actor, reason: 'Check actual institutional usage.' });
    expect(pending.reviewState).toBe('proposed');
    expect(pending.reviewDecision).toBe('need_evidence');
    expect(decideKnowledge(proposed, { decision: 'accept', reviewer: actor, reason: 'Reviewed against practice.' }).reviewState).toBe('accepted');
    expect(() => decideKnowledge(proposed, { decision: 'accept', reviewer: { ...actor, type: 'model' }, reason: 'Self review' })).toThrow();
    expect(decideKnowledge(proposed, { decision: 'reject', reviewer: actor, reason: 'Wrong usage.' }).reviewState).toBe('rejected');
  });
});

describe('worker context compilation and immutable dependencies', () => {
  it('includes accepted diplomatic distinctions in answers and omits proposals explicitly', () => {
    const c = capsule(); c.knowledge.push(proposeKnowledge({ ...language(), id: 'p1' }, { ...actor, type: 'model' }));
    const view = compileContext(c, { objective: 'Has State A accepted the proposal?', role: 'writer', scope: 'diplomacy', asOf: '2026-10-03' });
    const text = renderContext(view);
    expect(text).toContain('prepared to consider'); expect(text).toContain('acceptance'); expect(text).toContain('does_not_establish');
    expect(view.receipt.knowledgeIds).toContain('l1'); expect(view.receipt.knowledgeIds).not.toContain('p1');
    expect(view.omissions).toContainEqual(expect.objectContaining({ id: 'p1', reason: 'not-accepted' }));
  });
  it('keeps worker views different and retains exact digest locks', () => {
    const c = capsule();
    const writer = compileContext(c, { objective: 'Draft', role: 'writer', scope: 'diplomacy', asOf: '2026-10-03' });
    const researcher = compileContext(c, { objective: 'Research', role: 'researcher', scope: 'diplomacy', asOf: '2026-10-03' });
    expect(writer.knowledge.length).toBeGreaterThan(researcher.knowledge.length);
    const lock = lockContext(writer, { modelRoute: 'provider-default', toolVersions: { search: '1' } });
    const original = lock.capsuleDigest; c.knowledge[0].label = 'Changed';
    expect(original).not.toBe(capsuleDigest(c)); expect(lock.capsuleDigest).toBe(original);
  });
  it('reports semantic changes and expired knowledge without using them', () => {
    const before = capsule(); const after = capsule(); after.knowledge[0].label = 'Revised';
    expect(semanticDiff(before, after).changed).toContainEqual(expect.objectContaining({ id: 'l1', kind: 'languageRule' }));
    after.knowledge[0].validUntil = '2026-01-01';
    expect(compileContext(after, { objective: 'Draft', role: 'writer', scope: 'diplomacy', asOf: '2026-10-03' }).knowledge).toHaveLength(0);
  });
});
