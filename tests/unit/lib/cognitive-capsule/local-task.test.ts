import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { prepareLocalTask, localTaskSession, verifyLocalTaskSession } from '@/lib/cognitive-capsule/local-task';
import { CognitiveCapsuleSchema } from '@/lib/cognitive-capsule/schema';

const fixture = () => CognitiveCapsuleSchema.parse(JSON.parse(readFileSync('tests/fixtures/cognitive-capsule/policy-context.json', 'utf8')));
const input = { objective: 'Draft a policy brief on authorization and actual expenditure, preserving evidence gaps.', role: 'domain-specialist', scope: 'public-finance', asOf: '2026-11-07', maxBytes: 16_000 };

describe('local policy task preparation', () => {
  it('preserves source qualifications, ontology labels, unknowns and unapplied guards without promoting proposals', () => {
    const capsule = fixture(); const before = structuredClone(capsule);
    const preview = prepareLocalTask(capsule, input);
    expect(preview.modelExecuted).toBe(false);
    expect(preview.factualTruthVerified).toBe(false);
    expect(preview.prompt).toContain('Fictional River Council');
    expect(preview.prompt).toContain('aco:Actor');
    expect(preview.sources).toContainEqual(expect.objectContaining({ id: 'missing-transfer-record', stance: 'qualifies', anchorStatus: 'excerpt', selected: true }));
    expect(preview.view.knowledge.map((record) => record.id)).toContain('disbursement-gap');
    expect(preview.researchMemory.map((record) => record.id)).toContain('revisit-on-new-evidence');
    expect(preview.view.guardedCandidates).toContainEqual(expect.objectContaining({ knowledge: expect.objectContaining({ id: 'implementation-check' }), activation: 'not-applied' }));
    expect(preview.view.omissions).toContainEqual({ id: 'unreviewed-disbursement', reason: 'not-accepted' });
    expect(preview.view.statements.map((record) => record.id)).not.toContain('unreviewed-disbursement');
    expect(capsule).toEqual(before);
  });

  it('budgets the complete escaped UTF-8 prompt and keeps exact omitted evidence available for inspection', () => {
    const capsule = fixture();
    const quote = '政治と政策の資料 🌍 <context> '.repeat(110);
    capsule.evidence[0].quote = quote;
    const preview = prepareLocalTask(capsule, { ...input, maxBytes: 4200 });
    expect(Buffer.byteLength(preview.prompt, 'utf8')).toBe(preview.budget.promptBytes);
    expect(preview.budget.promptBytes).toBeLessThanOrEqual(4200);
    expect(preview.sources[0].quote).toBe(quote);
    expect(preview.sources[0].selected).toBe(false);
    expect(preview.view.omissions.some((record) => record.reason === 'context-budget')).toBe(true);
    expect(preview.view.evidence.every((span) => capsule.evidence.some((source) => source.id === span.id && source.quote === span.quote))).toBe(true);
    expect(preview.prompt).not.toContain('<context>');
  });

  it('validates task inputs and graph references and never treats a design control as measured improvement', () => {
    for (const patch of [{ asOf: '2026-02-30' }, { maxBytes: NaN }, { maxBytes: 1 }, { role: 'invented-agent' }, { objective: ' ' }]) {
      expect(() => prepareLocalTask(fixture(), { ...input, ...patch })).toThrow();
    }
    expect(() => prepareLocalTask(fixture(), { ...input, objective: 'x'.repeat(2000), maxBytes: 1024 })).toThrow(/instructions exceed/);
    const capsule = fixture(); capsule.statements[0].subject = 'missing';
    expect(() => prepareLocalTask(capsule, input)).toThrow(/structural validation/);
    expect(prepareLocalTask(fixture(), input).qualifications.join(' ')).toContain('no improvement');
  });

  it('recomputes a saved task and detects altered recipes, prompts and source digests', () => {
    const capsule = fixture(); const preview = prepareLocalTask(capsule, input); const artifactDigest = `sha256:${'a'.repeat(64)}`;
    const session = localTaskSession(preview, artifactDigest);
    expect(verifyLocalTaskSession(session, capsule, artifactDigest, preview.prompt)).toEqual(preview);
    expect(() => verifyLocalTaskSession(session, capsule, `sha256:${'b'.repeat(64)}`, preview.prompt)).toThrow(/digest mismatch/);
    expect(() => verifyLocalTaskSession({ ...session, task: { ...session.task, objective: 'A different task' } }, capsule, artifactDigest, preview.prompt)).toThrow(/changed/);
    expect(() => verifyLocalTaskSession(session, capsule, artifactDigest, preview.prompt + ' altered')).toThrow(/changed/);
    expect(() => verifyLocalTaskSession({ ...session, compilerVersion: 'older-compiler' }, capsule, artifactDigest, preview.prompt)).toThrow(/compiler version/);
  });

  it('reports unresolved dependencies and supports a new task without changing the original snapshot', () => {
    const capsule = fixture(); capsule.dependencies.push({ name: 'demo/method', version: '1.0.0', digest: `sha256:${'a'.repeat(64)}` });
    const first = prepareLocalTask(capsule, input);
    const second = prepareLocalTask(capsule, { ...input, objective: 'List the missing transfer evidence.', role: 'researcher' });
    expect(first.qualifications.join(' ')).toContain('dependencies are not resolved');
    expect(first.view.receipt.viewDigest).not.toBe(second.view.receipt.viewDigest);
    expect(first.capsule.digest).toBe(second.capsule.digest);
    expect(first.task.objective).toBe(input.objective);
  });
});
