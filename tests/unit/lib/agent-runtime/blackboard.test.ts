import { describe, expect, it } from 'vitest';
import { createCognitiveCapsule, KnowledgeSchema } from '@/lib/cognitive-capsule/schema';
import { appendWorkingObject, createBlackboard, freezeRunContext, compileLockedRole, validateBlackboard, assertRunContextReplay } from '@/lib/agent-runtime/blackboard';

const at = '2026-10-03T12:00:00Z';
const identity = { ownerUid: 'u1', runId: 'r1', capsuleId: 'c1' };
const actor = { type: 'human' as const, id: 'reviewer', at };
function cognition() {
  const c = createCognitiveCapsule('c1', '1.0.0');
  c.knowledge.push(KnowledgeSchema.parse({ id: 'h1', kind: 'heuristic', label: 'Continued talks', scope: ['diplomacy'], reviewState: 'accepted', provenance: { generatedBy: actor, reviewedBy: actor, reviewedAt: at, sourceRefs: [] }, when: [{ kind: 'context', key: 'talks', operator: 'present' }], exceptions: [{ kind: 'context', key: 'withdrawal', operator: 'present' }], interpretation: 'Public rejection can coexist with private talks.', rationale: 'Practice rule, not a fact.' }));
  return c;
}
const runtime = { modelRoute: 'vertex:gemini-2.5-pro', toolVersions: { search: 'captured-search/v1' } };
const input = () => ({ ...identity, capsuleVersion: 4, cognition: cognition(), objective: 'Assess talks', scope: 'diplomacy', asOf: at, facts: { talks: true }, runtime, evidenceDependencies: [{ id: 'p1', digest: 'sha256:test' }] });

describe('run-scoped cognitive blackboard', () => {
  it('rejects cross-run writes and dangling references without changing canonical cognition', () => {
    const b = createBlackboard(identity);
    const obj = { ...identity, id: 'q1', kind: 'WorkingQuestion', createdAt: at, updatedAt: at, objectRefs: [], knowledgeRefs: [], evidenceRefs: [], text: 'What was agreed?', status: 'open' };
    expect(() => appendWorkingObject(b, { ...obj, runId: 'foreign' })).toThrow(/identity|run/i);
    expect(() => appendWorkingObject(b, { ...obj, objectRefs: ['missing'] })).toThrow(/reference/i);
    const next = appendWorkingObject(b, obj);
    expect(next.objects).toHaveLength(1); expect(b.objects).toHaveLength(0);
    expect(() => validateBlackboard(next, { ...identity, ownerUid: 'other' })).toThrow(/identity|owner/i);
  });
  it('cannot turn an unresolved quotation into verified supporting evidence', () => {
    const b = createBlackboard(identity);
    expect(() => appendWorkingObject(b, { ...identity, id: 'e1', kind: 'WorkingEvidenceSpan', createdAt: at, updatedAt: at, objectRefs: [], knowledgeRefs: [], evidenceRefs: [], sourceId: 's1', sourceVersion: '1', quote: 'May consider', anchorStatus: 'unresolved', supportStatus: 'verified' })).toThrow(/unresolved|verified/i);
  });
  it('captures role views and exceptions immutably and rejects stale source/model/compiler replay', () => {
    const locked = freezeRunContext(input());
    const text = compileLockedRole(locked, identity, 'domain-specialist');
    expect(text).toContain('Public rejection can coexist');
    const excepted = freezeRunContext({ ...input(), facts: { talks: true, withdrawal: true } });
    expect(compileLockedRole(excepted, identity, 'domain-specialist')).not.toContain('Public rejection can coexist');
    expect(() => assertRunContextReplay(locked, { ...input(), evidenceDependencies: [{ id: 'p1', digest: 'changed' }] })).toThrow(/stale/i);
    expect(() => assertRunContextReplay(locked, { ...input(), runtime: { ...runtime, modelRoute: 'other' } })).toThrow(/stale/i);
    expect(() => compileLockedRole(locked, { ...identity, runId: 'other' }, 'writer')).toThrow(/identity|run/i);
    const changed = input(); changed.cognition.version = '2.0.0';
    expect(() => assertRunContextReplay(locked, changed)).toThrow(/stale/i);
    expect(() => compileLockedRole({ ...locked, compilerVersion: 'other' }, identity, 'writer')).toThrow(/stale|compiler/i);
    expect(assertRunContextReplay(locked, input())).toEqual(locked);
  });
});
