import { describe, expect, it } from 'vitest';
import { createCognitiveCapsule, KnowledgeSchema } from '@/lib/cognitive-capsule/schema';
import { appendWorkingObject, updateWorkingObject, createBlackboard, freezeRunContext, compileLockedRole, validateBlackboard, assertRunContextReplay, attachedReference } from '@/lib/agent-runtime/blackboard';
import { compileContext } from '@/lib/cognitive-capsule/compiler';

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
  it('freezes verified native dependency artifacts and refuses missing or changed locks', () => {
    const current = input();
    const dependency = { name: 'owner/method', version: '1.0.0', digest: `sha256:${'a'.repeat(64)}` };
    current.cognition.dependencies.push(dependency);
    expect(() => freezeRunContext(current)).toThrow(/resolved/);
    const resolved = { ...current, resolvedDependencies: [{ capsuleId: current.cognition.capsuleId, locks: [{ ...dependency, capsuleDigest: `sha256:${'b'.repeat(64)}` }] }] };
    const lock = freezeRunContext(resolved);
    expect(lock.resolvedDependencies).toEqual(resolved.resolvedDependencies);
    expect(() => assertRunContextReplay(lock, { ...resolved, resolvedDependencies: [{ capsuleId: current.cognition.capsuleId, locks: [{ ...dependency, capsuleDigest: `sha256:${'c'.repeat(64)}` }] }] })).toThrow(/stale/i);
  });
  it('supports large primary and cumulative attachment inventories while keeping working references bounded', () => {
    const primary = Array.from({ length: 501 }, (_, i) => `primary-${i}`);
    const attached = Array.from({ length: 501 }, (_, i) => attachedReference('attached', `record-${i}`));
    const board = createBlackboard(identity, { entityIds: [...primary, ...attached], statementIds: primary, evidenceIds: [...primary, ...attached] });
    expect(validateBlackboard(board, identity).entityIds).toHaveLength(1002);
    const base = { ...identity, id: 'q-large', kind: 'WorkingQuestion', createdAt: at, updatedAt: at, objectRefs: [], knowledgeRefs: [], evidenceRefs: primary, text: 'Large inventory is not a per-object handoff.', status: 'open' };
    expect(() => appendWorkingObject(board, base)).toThrow();
    expect(appendWorkingObject(board, { ...base, evidenceRefs: [attached[500]] }).objects).toHaveLength(1);
    const long = attachedReference('c'.repeat(240), 'r'.repeat(240));
    expect(long.length).toBeLessThanOrEqual(240);
    expect(long).toBe(attachedReference('c'.repeat(240), 'r'.repeat(240)));
    expect(long).not.toBe(attachedReference('c'.repeat(240), 's'.repeat(240)));
  });
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
  it('validates entity and proposal targets and allows questions to be resolved by ID', () => {
    const b = createBlackboard(identity, { entityIds: ['actor-1'], knowledgeIds: ['rule-1'] });
    const base = { ...identity, createdAt: at, updatedAt: at, objectRefs: [], knowledgeRefs: [], evidenceRefs: [] };
    expect(() => appendWorkingObject(b, { ...base, id: 'er', kind: 'WorkingEntityResolution', candidateIds: ['missing'], relation: 'alias', status: 'proposed' })).toThrow(/reference/i);
    expect(() => appendWorkingObject(b, { ...base, id: 'proposal', kind: 'CapsuleChangeProposal', targetIds: ['missing'], changeSummary: 'Change', reviewState: 'proposed', promotion: 'human-review-required' })).toThrow(/reference/i);
    const q = { ...base, id: 'q', kind: 'WorkingQuestion', text: 'Is the group the same actor?', status: 'open' };
    const opened = appendWorkingObject(b, q);
    const resolved = updateWorkingObject(opened, { ...q, status: 'resolved' });
    expect(resolved.objects[0]).toMatchObject({ status: 'resolved' });
    expect(opened.objects[0]).toMatchObject({ status: 'open' });
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
  it('freezes exact attached expert snapshots into role context and refuses changed attachment dependencies', () => {
    const attached = createCognitiveCapsule('attached', '1.0.0');
    attached.knowledge.push(KnowledgeSchema.parse({ id: 'l', kind: 'languageRule', label: 'Attached language rule', scope: ['diplomacy'], reviewState: 'accepted', provenance: { generatedBy: actor, reviewedBy: actor, reviewedAt: at, sourceRefs: [] }, expression: 'prepared to consider', language: 'en', domain: 'diplomacy', meaning: 'Conditional openness', nonImplications: ['acceptance'] }));
    const receipt = compileContext(attached, { objective: 'Review', role: 'capsule-curator', scope: 'diplomacy', asOf: at }).receipt;
    const current = { ...input(), attachments: [{ capsuleId: 'attached', capsuleVersion: 3, cognition: attached, receipt }] };
    const lock = freezeRunContext(current);
    expect(compileLockedRole(lock, identity, 'writer')).toContain('prepared to consider');
    expect(lock.attachments[0]).toMatchObject({ capsuleId: 'attached', capsuleVersion: 3 });
    expect(() => assertRunContextReplay(lock, { ...current, attachments: [] })).toThrow(/stale/i);
    attached.knowledge[0].label = 'Changed attachment';
    expect(() => assertRunContextReplay(lock, current)).toThrow(/stale|digest/i);
  });
});
