import { describe, expect, it } from 'vitest';
import { compileContext, renderContext } from '@/lib/cognitive-capsule/compiler';
import { CognitiveGraph } from '@/lib/cognitive-capsule/graph';
import { createCognitiveCapsule, KnowledgeSchema } from '@/lib/cognitive-capsule/schema';
import { cognitiveContextForCapsule } from '@/lib/cognitive-capsule/context-adapter';

const at = '2026-10-03T12:00:00Z'; const actor = { type: 'human', id: 'reviewer', at };
const condition = { kind: 'context', key: 'signal', operator: 'present' };
const common = { id: 'k', label: 'Guarded practice', scope: ['diplomacy'], reviewState: 'accepted', provenance: { generatedBy: actor, reviewedBy: actor, reviewedAt: at, sourceRefs: [] } };
const records = [
  { kind: 'cue', description: 'Public posture', onlyWhen: [condition], falsePositiveConditions: [{ ...condition, key: 'misleading' }] },
  { kind: 'redFlag', description: 'Access problem', onlyWhen: [condition], possibleSignificance: 'Check access' },
  { kind: 'exception', ruleRefs: [], when: [condition], explanation: 'Scope exception' },
  { kind: 'revisionTrigger', when: [condition], affectedIds: [], action: 'Review the assumption' },
  { kind: 'pattern', expectedCues: [condition], failureConditions: [{ ...condition, key: 'misleading' }], interpretation: 'Possible pattern' },
];
function context(record: object) { const c = createCognitiveCapsule('c'); c.knowledge.push(KnowledgeSchema.parse({ ...common, ...record })); return c; }
describe('compiled expert guards and exact rendered budgets', () => {
  it.each(records)('gates $kind prerequisites and labels unknown applicability separately', (record) => {
    const c = context(record);
    const base = { objective: 'Assess', role: 'domain-specialist' as const, scope: 'diplomacy', asOf: at };
    expect(compileContext(c, { ...base, facts: { signal: false } }).knowledge).toHaveLength(0);
    const unknown = compileContext(c, base);
    expect(unknown.knowledge).toHaveLength(0);
    expect(unknown.guardedCandidates).toContainEqual(expect.objectContaining({ activation: 'not-applied', knowledge: expect.objectContaining({ id: 'k' }) }));
    expect(renderContext(unknown)).toContain('guarded_candidate_not_applied');
    expect(compileContext(c, { ...base, facts: { signal: true, misleading: false } }).knowledge).toHaveLength(1);
    if (record.kind === 'pattern' || record.kind === 'cue') {
      const missingGuard = compileContext(c, { ...base, facts: { signal: true } });
      expect(missingGuard.knowledge).toHaveLength(0); expect(missingGuard.guardedCandidates).toHaveLength(1);
      expect(compileContext(c, { ...base, facts: { signal: true, misleading: true } }).knowledge).toHaveLength(0);
    }
  });
  it('validates node/statement condition targets throughout knowledge including procedure steps', () => {
    for (const record of records) {
      const c = context(record); const k = c.knowledge[0];
      if ('when' in k) k.when = [{ kind: 'node', key: 'missing', operator: 'present' }];
      else if ('onlyWhen' in k) k.onlyWhen = [{ kind: 'node', key: 'missing', operator: 'present' }];
      else if (k.kind === 'pattern') k.failureConditions = [{ kind: 'node', key: 'missing', operator: 'present' }];
      expect(new CognitiveGraph(c).validate()).toContainEqual(expect.objectContaining({ id: 'k', code: 'missing-reference' }));
      expect(compileContext(c, { objective: 'Assess', role: 'domain-specialist', scope: 'diplomacy', asOf: at, facts: { missing: true, signal: true } }).knowledge).toHaveLength(0);
    }
    const p = context({ kind: 'procedure', purpose: 'Check', steps: [{ id: 'step', instruction: 'Inspect', branches: [{ kind: 'statement', key: 'missing', operator: 'present' }] }] });
    expect(new CognitiveGraph(p).validate()).toContainEqual(expect.objectContaining({ id: 'k', code: 'missing-reference' }));
  });
  it('charges escaped rendered records and evidence atomically to the exact character budget', () => {
    const c = context({ kind: 'distinction', conceptA: 'A', conceptB: 'B', explanation: '<'.repeat(220), whyItMatters: 'Scope', commonMistake: 'Conflation' });
    const view = compileContext(c, { objective: 'Assess', role: 'writer', scope: 'diplomacy', asOf: at, maxChars: 1800 });
    expect(renderContext(view).length).toBeLessThanOrEqual(1800);
    expect(view.knowledge).toHaveLength(0);
    expect(cognitiveContextForCapsule({ capsuleId: 'c', cognition: context(records[0]) }, { role: 'domain-specialist', asOf: at }).text).toContain('guarded_candidate_not_applied');
  });
  it.each(['stopConditions', 'escalationConditions', 'stopIf', 'escalateIf'])('keeps procedure %s controls mandatory and never applies an unknown guard', (field) => {
    const control = [{ ...condition, key: 'unsafe' }];
    const c = context({ kind: 'procedure', purpose: 'Review',
      ...(field === 'stopConditions' || field === 'escalationConditions' ? { [field]: control } : {}),
      steps: [{ id: 'step', instruction: 'Inspect evidence', ...(field === 'stopIf' || field === 'escalateIf' ? { [field]: control } : {}) }] });
    const input = { objective: 'Review', role: 'domain-specialist' as const, scope: 'diplomacy', asOf: at };
    expect(compileContext(c, { ...input, facts: { unsafe: true } }).knowledge).toHaveLength(0);
    const unknown = compileContext(c, input);
    expect(unknown.knowledge).toHaveLength(0); expect(unknown.guardedCandidates).toHaveLength(1);
    expect(compileContext(c, { ...input, facts: { unsafe: false } }).knowledge).toHaveLength(1);
  });
  it('retains procedure branch conditions as conditional data rather than claiming step execution', () => {
    const c = context({ kind: 'procedure', purpose: 'Review', steps: [{ id: 'step', instruction: 'Inspect', branches: [condition] }] });
    const view = compileContext(c, { objective: 'Review', role: 'domain-specialist', scope: 'diplomacy', asOf: at, facts: { signal: true } });
    expect(view.knowledge).toHaveLength(0); expect(view.guardedCandidates).toHaveLength(1);
    expect(renderContext(view)).toContain('branches');
  });
  it('captures evidence-backed cue examples even when provenance has no sourceRefs, within one budget', () => {
    const c = context({ kind: 'cue', description: 'Quoted cue', examples: ['example'] });
    c.evidence.push({ id: 'example', sourceId: 'source', sourceVersion: '1', quote: 'q'.repeat(3000), anchorStatus: 'exact', stance: 'qualifies' });
    const input = { objective: 'Assess', role: 'domain-specialist' as const, scope: 'diplomacy', asOf: at };
    const full = compileContext(c, input);
    expect(full.evidence).toHaveLength(1); expect(full.receipt.evidenceSpans).toContainEqual(expect.objectContaining({ id: 'example', sourceId: 'source', sourceVersion: '1' }));
    const limited = compileContext(c, { ...input, maxChars: 1500 });
    expect(limited.knowledge).toHaveLength(0); expect(limited.evidence).toHaveLength(0);
    expect(renderContext(limited).length).toBeLessThanOrEqual(1500);
  });
});
