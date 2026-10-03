import { describe, expect, it } from 'vitest';
import { createCognitiveCapsule, CognitiveStatementSchema, KnowledgeSchema, EvidenceSpanSchema } from '@/lib/cognitive-capsule/schema';
import { inspectCognitiveCapsule } from '@/lib/cognitive-capsule/chat';

const actor = { type: 'human' as const, id: 'expert-a', at: '2026-10-03T12:00:00Z' };
const provenance = { generatedBy: actor, sourceRefs: [], derivedFrom: [], confidenceKind: 'human-authored' as const };
function fixture() {
  const c = createCognitiveCapsule('owned');
  c.evidence.push(EvidenceSpanSchema.parse({ id: 'span-1', sourceId: 'report', sourceVersion: 'v1', quote: 'The mandate permits a review.', page: 3 }));
  c.knowledge.push(KnowledgeSchema.parse({ id: 'rule-1', kind: 'heuristic', label: 'Review is a milestone', scope: ['eu'], interpretation: 'Review alone does not terminate.', rationale: 'Institutional procedure.', provenance, validUntil: '2020-01-01', when: [{ kind: 'context', key: 'eu', operator: 'present' }] }));
  c.knowledge.push(KnowledgeSchema.parse({ id: 'exception-1', kind: 'exception', label: 'Sunset clause', scope: ['eu'], explanation: 'Check the sunset clause.', provenance, ruleRefs: ['rule-1'] }));
  c.statements.push(CognitiveStatementSchema.parse({ id: 'edge-1', subject: 'a', predicate: 'REVIEWS', object: { node: 'b' }, polarity: 'positive', layer: 'world', provenance: { ...provenance, sourceRefs: ['span-1'] }, sourceRefs: ['span-1'] }));
  return c;
}
describe('embedded cognitive inspection', () => {
  it('reports unsupported heuristics and explicit validity without claiming falsity', () => {
    expect(inspectCognitiveCapsule(fixture(), 'Show unsupported heuristics').rows.map(r => r.id)).toEqual(['rule-1']);
    expect(inspectCognitiveCapsule(fixture(), 'Show stale rules', { asOf: '2026-10-03' }).rows.map(r => r.id)).toEqual(['rule-1']);
    expect(inspectCognitiveCapsule(fixture(), 'Show unsupported heuristics').method).toBe('deterministic-inspection');
  });
  it('shows provenance, exceptions, and quoted source anchors for an edge', () => {
    expect(inspectCognitiveCapsule(fixture(), 'Which knowledge came from expert-a?').rows.map(r => r.id)).toContain('rule-1');
    expect(inspectCognitiveCapsule(fixture(), 'Which rules have exceptions?').rows.map(r => r.id)).toContain('rule-1');
    const why = inspectCognitiveCapsule(fixture(), 'Why does edge edge-1 exist?');
    expect(why.rows[0].refs).toContain('span-1');
    expect(why.rows.some(r => r.text.includes('The mandate permits a review.'))).toBe(true);
  });
  it('labels contradiction candidates and does not invent unavailable version history', () => {
    const c = fixture(); c.statements.push({ ...c.statements[0], id: 'edge-2', polarity: 'negative' });
    expect(inspectCognitiveCapsule(c, 'Show unresolved contradictions').summary).toMatch(/candidate/i);
    expect(inspectCognitiveCapsule(c, 'What changed since v7?').summary).toMatch(/unavailable/i);
    const prior = structuredClone(c); prior.version = '0.0.1'; prior.knowledge = [];
    expect(inspectCognitiveCapsule(c, 'What changed?', { prior }).rows.map(r => r.id)).toContain('rule-1');
  });
  it('requires an actual matching owned semantic baseline and bounds responses', () => {
    const c = fixture(); const prior = createCognitiveCapsule('other');
    expect(() => inspectCognitiveCapsule(c, 'What changed?', { prior })).toThrow(/same capsule/i);
    expect(inspectCognitiveCapsule(c, 'Invent missing facts').summary).toMatch(/inspection/i);
    expect(c.knowledge.every(k => k.reviewState === 'proposed')).toBe(true);
  });
  it('matches a complete statement identity instead of a shorter substring', () => {
    const c = fixture(); c.statements.push({ ...c.statements[0], id: 'edge-12', predicate: 'QUALIFIES' });
    expect(inspectCognitiveCapsule(c, 'Why does edge edge-12 exist?').rows[0].id).toBe('edge-12');
  });
});
