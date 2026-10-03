import { describe, expect, it } from 'vitest';
import { composeCognitiveCapsules } from '@/lib/cognitive-capsule/composition';
import { CognitiveGraph } from '@/lib/cognitive-capsule/graph';
import { capsuleDigest } from '@/lib/cognitive-capsule/integrity';
import { CognitiveNodeSchema, CognitiveStatementSchema, EvidenceSpanSchema, KnowledgeSchema, createCognitiveCapsule } from '@/lib/cognitive-capsule/schema';
import type { CognitiveCapsule, Knowledge } from '@/lib/cognitive-capsule/types';

const actor = { type: 'human' as const, id: 'n', at: '2026-10-03T12:00:00Z' };
const provenance = { generatedBy: actor, reviewedBy: actor, reviewedAt: actor.at, sourceRefs: ['e'], derivedFrom: ['n', 'external-origin'], confidenceKind: 'human-authored' as const };
const condition = { kind: 'node' as const, key: 'n', operator: 'equals' as const, value: 'n' };
const statementCondition = { kind: 'statement' as const, key: 's', operator: 'present' as const };
const contextCondition = { kind: 'context' as const, key: 'n', operator: 'present' as const };

function fixture(id: string, polarity: 'positive' | 'negative' = 'positive'): CognitiveCapsule {
  const c = createCognitiveCapsule(id, '1.0.0');
  c.nodes.push(CognitiveNodeSchema.parse({ id: 'n', type: 'aco:Actor', label: 'State A', layer: 'world', provenance, reviewState: 'accepted' }),
    CognitiveNodeSchema.parse({ id: 'm', type: 'aco:Actor', label: 'State B', layer: 'world', provenance, reviewState: 'accepted' }));
  c.evidence.push(EvidenceSpanSchema.parse({ id: 'e', sourceId: 'n', sourceVersion: 's', documentId: 'n', chunkId: 's', citationId: 'e', quote: 'n', anchorStatus: 'exact' }));
  c.statements.push(CognitiveStatementSchema.parse({ id: 's', subject: 'n', predicate: 'SUPPORTS', object: { literal: 'n' }, layer: 'world', polarity,
    assertedBy: 'n', addressedTo: ['m'], audience: ['n'], wordingRef: 'e', sourceRefs: ['e'], rationaleRef: 'm', annotations: ['n'],
    conditions: [condition, contextCondition], exceptions: [], provenance, reviewState: 'accepted' }));
  c.knowledge.push(KnowledgeSchema.parse({ id: 'rule', kind: 'heuristic', label: 'Keep concepts separate', scope: ['policy'],
    interpretation: polarity === 'positive' ? 'Contact may continue.' : 'Contact may not continue.', rationale: 'n', when: [statementCondition, contextCondition], exceptions: [condition],
    attendTo: ['n'], cases: [], provenance, reviewState: 'accepted', reviewDecision: 'accept', reviewNote: 'Original review.' }));
  return c;
}

function item(c: CognitiveCapsule, id: string): Knowledge { return c.knowledge.find((k) => k.id === id)!; }

describe('conflict preserving cognitive composition', () => {
  it('retains colliding entities, opposing claims and divergent rules as separate proposals with exact parent locks', () => {
    const parents = [fixture('local/a'), fixture('local/b', 'negative')];
    const before = structuredClone(parents);
    const result = composeCognitiveCapsules(parents, { capsuleId: 'local/composed' });
    expect(parents).toEqual(before);
    expect(result.capsule.nodes.map((n) => n.id)).toEqual(['p1:n', 'p1:m', 'p2:n', 'p2:m']);
    expect(result.capsule.statements.map((s) => s.polarity)).toEqual(['positive', 'negative']);
    expect(result.capsule.knowledge.map((k) => k.reviewState)).toEqual(['proposed', 'proposed']);
    expect(result.capsule.nodes.every((n) => n.reviewState === 'proposed')).toBe(true);
    expect(result.capsule.statements.every((s) => s.reviewState === 'proposed')).toBe(true);
    expect(result.capsule.rights).toEqual({ mode: 'private' });
    expect(result.parentLocks.map((p) => p.digest)).toEqual(parents.map(capsuleDigest));
    expect(result.parentLocks.map((p) => [p.sourceIndex, p.capsuleId, p.version])).toEqual([[0, 'local/a', '1.0.0'], [1, 'local/b', '1.0.0']]);
    expect(result.conflicts.map((c) => c.kind)).toEqual(expect.arrayContaining(['semantic-id-collision', 'entity-overlap', 'opposing-statements', 'divergent-rules']));
    const rule = item(result.capsule, 'p1:rule');
    expect(rule.provenance.generatedBy).toEqual(actor);
    expect(rule.provenance.reviewedBy).toBeUndefined();
    expect(rule.provenance.reviewedAt).toBeUndefined();
    expect(rule.reviewDecision).toBeUndefined();
    expect(rule.provenance.derivedFrom).toEqual(expect.arrayContaining(['p1:n', 'external-origin']));
    expect(result.recordOrigins.find((r) => r.id === 'p1:rule')).toMatchObject({ sourceIndex: 0, originalId: 'rule', originalReviewState: 'accepted',
      reviewedBy: actor, reviewedAt: actor.at, reviewDecision: 'accept', reviewNote: 'Original review.' });
    expect(new CognitiveGraph(result.capsule).validate()).toEqual([]);
    result.capsule.evidence[0].quote = 'changed';
    expect(parents[0].evidence[0].quote).toBe('n');
  });

  it('rewrites actual pointers across all knowledge variants and local steps without rewriting actor, literal, context or source metadata', () => {
    const c = fixture('local/a');
    const common = { scope: ['policy'], provenance, label: 'n' };
    const add = (value: Record<string, unknown>) => c.knowledge.push(KnowledgeSchema.parse({ ...common, ...value }));
    add({ id: 'case', kind: 'case', situation: 'n', interpretation: 'n', decision: 'n', cues: ['cue'], reviewedBy: ['n'] });
    add({ id: 'cue', kind: 'cue', description: 'n', suggests: ['s'], examples: ['e'], onlyWhen: [condition], falsePositiveConditions: [statementCondition] });
    add({ id: 'pattern', kind: 'pattern', interpretation: 'n', expectedCues: [condition], optionalCues: [statementCondition], disconfirmingCues: [condition], failureConditions: [statementCondition] });
    add({ id: 'exception', kind: 'exception', explanation: 'n', ruleRefs: ['rule'], when: [statementCondition] });
    add({ id: 'flag', kind: 'redFlag', description: 'n', possibleSignificance: 'n', onlyWhen: [condition] });
    add({ id: 'question', kind: 'question', question: 'n', whyItMatters: 'n', resolves: ['s'] });
    add({ id: 'language', kind: 'languageRule', expression: 'n', language: 'en', meaning: 'n', domain: 'n', examples: ['e'], audience: ['n'] });
    add({ id: 'trigger', kind: 'revisionTrigger', action: 'n', affectedIds: ['s', 'rule'], when: [statementCondition] });
    add({ id: 'distinction', kind: 'distinction', conceptA: 'n', conceptB: 'm', explanation: 'n', whyItMatters: 'n', commonMistake: 'n', expertRefs: ['m', 'external-expert'] });
    add({ id: 'procedure', kind: 'procedure', purpose: 'n', inputs: ['n'], outputs: ['e'], stopConditions: [condition], escalationConditions: [statementCondition], steps: [
      { id: 'n', instruction: 'n', requires: ['m'], produces: ['e'], precedes: ['second'], branches: [condition], stopIf: [statementCondition], escalateIf: [condition] },
      { id: 'second', instruction: 'n', requires: ['n'], produces: ['s'], precedes: [] },
    ] });
    const rule = item(c, 'rule'); if (rule.kind === 'heuristic') rule.cases = ['case'];
    const result = composeCognitiveCapsules([c, fixture('local/b')], { capsuleId: 'local/all' }).capsule;
    expect(result.statements[0]).toMatchObject({ subject: 'p1:n', object: { literal: 'n' }, assertedBy: 'p1:n', addressedTo: ['p1:m'], audience: ['p1:n'],
      wordingRef: 'p1:e', sourceRefs: ['p1:e'], rationaleRef: 'p1:m', annotations: ['p1:n'], conditions: [{ ...condition, key: 'p1:n' }, contextCondition] });
    expect(result.evidence[0]).toMatchObject({ id: 'p1:e', sourceId: 'n', sourceVersion: 's', documentId: 'n', chunkId: 's', citationId: 'e', quote: 'n' });
    expect(item(result, 'p1:rule')).toMatchObject({ cases: ['p1:case'], when: [{ ...statementCondition, key: 'p1:s' }, contextCondition], provenance: { generatedBy: actor, sourceRefs: ['p1:e'] } });
    expect(item(result, 'p1:case')).toMatchObject({ cues: ['p1:cue'], reviewedBy: ['n'], situation: 'n' });
    expect(item(result, 'p1:cue')).toMatchObject({ suggests: ['p1:s'], examples: ['p1:e'], onlyWhen: [{ ...condition, key: 'p1:n' }] });
    expect(item(result, 'p1:pattern')).toMatchObject({ expectedCues: [{ ...condition, key: 'p1:n' }], optionalCues: [{ ...statementCondition, key: 'p1:s' }],
      disconfirmingCues: [{ ...condition, key: 'p1:n' }], failureConditions: [{ ...statementCondition, key: 'p1:s' }] });
    expect(item(result, 'p1:exception')).toMatchObject({ ruleRefs: ['p1:rule'], when: [{ ...statementCondition, key: 'p1:s' }] });
    expect(item(result, 'p1:flag')).toMatchObject({ onlyWhen: [{ ...condition, key: 'p1:n' }] });
    expect(item(result, 'p1:question')).toMatchObject({ resolves: ['p1:s'] });
    expect(item(result, 'p1:language')).toMatchObject({ examples: ['p1:e'], audience: ['n'], domain: 'n' });
    expect(item(result, 'p1:trigger')).toMatchObject({ affectedIds: ['p1:s', 'p1:rule'], when: [{ ...statementCondition, key: 'p1:s' }] });
    expect(item(result, 'p1:distinction')).toMatchObject({ expertRefs: ['p1:m', 'external-expert'], conceptA: 'n' });
    expect(item(result, 'p1:procedure')).toMatchObject({ inputs: ['n'], outputs: ['e'], stopConditions: [{ ...condition, key: 'p1:n' }], escalationConditions: [{ ...statementCondition, key: 'p1:s' }],
      steps: [{ id: 'p1:procedure:step:n', instruction: 'n', requires: ['p1:m'], produces: ['p1:e'], precedes: ['p1:procedure:step:second'],
        branches: [{ ...condition, key: 'p1:n' }], stopIf: [{ ...statementCondition, key: 'p1:s' }], escalateIf: [{ ...condition, key: 'p1:n' }] },
      { id: 'p1:procedure:step:second', requires: ['p1:n'], produces: ['p1:s'] }] });
    expect(new CognitiveGraph(result).validate()).toEqual([]);
  });

  it('keeps exact inherited dependencies and rejects conflicting digests or rights expansion', () => {
    const a = fixture('local/a'); const b = fixture('local/b');
    const dependency = { name: 'local/base', version: '1.0.0', digest: `sha256:${'1'.repeat(64)}` };
    a.dependencies = [dependency]; b.dependencies = [dependency]; b.rights = { mode: 'open', license: 'CC0', author: 'original-author' };
    expect(composeCognitiveCapsules([a, b], { capsuleId: 'local/result' }).capsule.dependencies).toEqual([dependency]);
    expect(composeCognitiveCapsules([a, b], { capsuleId: 'local/result' }).parentLocks[1].rights).toEqual(b.rights);
    b.dependencies[0] = { ...dependency, digest: `sha256:${'2'.repeat(64)}` };
    expect(() => composeCognitiveCapsules([a, b], { capsuleId: 'local/result' })).toThrow(/dependency digest/);
    b.dependencies = [];
    for (const mode of ['organization', 'licensed'] as const) { b.rights = { mode, license: 'restricted' }; expect(() => composeCognitiveCapsules([a, b], { capsuleId: 'local/result' })).toThrow(/rights grant/); }
    b.rights = { mode: 'open' };
    expect(() => composeCognitiveCapsules([a, b], { capsuleId: 'local/result' })).toThrow(/explicit license/);
  });

  it('reports possible opposition across different local entity IDs, keeps explicit contradictions and respects nonoverlapping intervals', () => {
    const a = fixture('local/a'); const b = fixture('local/b', 'negative');
    b.nodes[0].id = 'other'; b.statements[0].subject = 'other'; b.statements[0].assertedBy = 'other';
    b.statements[0].audience = ['other']; b.statements[0].annotations = ['other']; b.statements[0].conditions[0].key = 'other';
    const rule = item(b, 'rule'); if (rule.kind === 'heuristic') { rule.attendTo = ['other']; rule.exceptions[0].key = 'other'; }
    const comparison = composeCognitiveCapsules([a, b], { capsuleId: 'result' });
    expect(comparison.conflicts).toContainEqual(expect.objectContaining({ kind: 'opposing-statements', recordIds: ['p1:s', 'p2:s'] }));
    expect(comparison.capsule.statements[1].subject).toBe('p2:other');
    a.statements[0].validUntil = '2020-12-31'; b.statements[0].validFrom = '2021-01-01';
    expect(composeCognitiveCapsules([a, b], { capsuleId: 'result' }).conflicts.some((c) => c.kind === 'opposing-statements')).toBe(false);
    a.statements.push(CognitiveStatementSchema.parse({ id: 'explicit-conflict', subject: 'n', predicate: 'CONTRADICTS', object: { node: 's' },
      layer: 'argument', polarity: 'positive', provenance, reviewState: 'accepted', sourceRefs: ['e'] }));
    const explicit = composeCognitiveCapsules([a, b], { capsuleId: 'result' });
    expect(explicit.conflicts).toContainEqual(expect.objectContaining({ kind: 'opposing-statements', recordIds: ['p1:explicit-conflict', 'p1:s'] }));
    expect(explicit.capsule.statements.find((s) => s.id === 'p1:explicit-conflict')?.object).toEqual({ node: 'p1:s' });
  });

  it('rejects dangling guards, annotations, procedural links and oversize results instead of dropping records', () => {
    const a = fixture('local/a'); const b = fixture('local/b');
    const badGuard = structuredClone(a); const rule = item(badGuard, 'rule'); if (rule.kind === 'heuristic') rule.when = [{ ...condition, key: 'missing' }];
    expect(() => composeCognitiveCapsules([badGuard, b], { capsuleId: 'result' })).toThrow(/unresolved references/);
    const badAnnotation = structuredClone(a); badAnnotation.statements[0].annotations = ['missing'];
    expect(() => composeCognitiveCapsules([badAnnotation, b], { capsuleId: 'result' })).toThrow(/Unresolved composition reference/);
    const badProcedure = structuredClone(a); badProcedure.knowledge.push(KnowledgeSchema.parse({ id: 'proc', kind: 'procedure', label: 'x', scope: ['general'], provenance,
      purpose: 'x', steps: [{ id: 'step', instruction: 'x', requires: ['missing'] }] }));
    expect(() => composeCognitiveCapsules([badProcedure, b], { capsuleId: 'result' })).toThrow(/Unresolved composition reference/);
    expect(() => composeCognitiveCapsules([a, b], { capsuleId: 'result', maxBytes: 50 })).toThrow(/byte budget/);
    expect(() => composeCognitiveCapsules([a], { capsuleId: 'result' })).toThrow(/two and ten/);
    expect(() => composeCognitiveCapsules(Array.from({ length: 11 }, () => a), { capsuleId: 'result' })).toThrow(/two and ten/);
  });

  it('handles long semantic and step IDs without truncation collisions or changing source locators', () => {
    const a = fixture('local/a'); const longId = 'x'.repeat(240);
    a.nodes.push(CognitiveNodeSchema.parse({ id: longId, label: 'Long identity', type: 'aco:Actor', layer: 'world', provenance }));
    for (const suffix of ['a', 'b']) a.knowledge.push(KnowledgeSchema.parse({ id: 'p'.repeat(239) + suffix, kind: 'procedure', label: suffix, scope: ['general'], provenance, purpose: 'Long procedure',
      steps: [{ id: longId, instruction: 'No ID replacement in prose', precedes: ['next'] }, { id: 'next', instruction: 'Finish' }] }));
    const result = composeCognitiveCapsules([a, fixture('local/b')], { capsuleId: 'result' });
    expect(result.capsule.nodes.every((n) => n.id.length <= 240)).toBe(true);
    const steps = result.capsule.knowledge.filter((k) => k.kind === 'procedure').flatMap((k) => k.steps);
    expect(new Set(steps.map((s) => s.id)).size).toBe(4);
    expect(steps.every((s) => s.id.length <= 240)).toBe(true);
    expect(result.recordOrigins.find((o) => o.originalId === longId)?.id).toBe(result.capsule.nodes[2].id);
    expect(new CognitiveGraph(result.capsule).validate()).toEqual([]);
  });
});
