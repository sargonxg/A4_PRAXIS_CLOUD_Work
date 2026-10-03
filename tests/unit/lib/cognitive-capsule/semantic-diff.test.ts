import { describe, expect, it } from 'vitest';
import { createCognitiveCapsule, EvidenceSpanSchema } from '@/lib/cognitive-capsule/schema';
import { diffCognitiveCapsules } from '@/lib/cognitive-capsule/semantic-diff';
import { packCapsule, readCapsulePackage } from '@/lib/cognitive-capsule/package';

describe('source and semantic history', () => {
  it('preserves exact source quote whitespace through native roundtrip', async () => {
    const before = createCognitiveCapsule('owner/capsule');
    const quote = '  Approval\r\n is not expenditure.  ';
    before.evidence.push(EvidenceSpanSchema.parse({ id: 'e1', sourceId: 's1', sourceVersion: 'rev1', quote }));
    expect((await readCapsulePackage(await packCapsule(before))).capsule.evidence[0].quote).toBe(quote);
    expect(EvidenceSpanSchema.safeParse({ id: 'e', sourceId: 's', sourceVersion: 'v', quote: ' \r\n ' }).success).toBe(false);
  });
  it('includes review, evidence location, rights and exact dependency lock changes', () => {
    const before = createCognitiveCapsule('owner/capsule');
    before.evidence.push(EvidenceSpanSchema.parse({ id: 'e1', sourceId: 's1', sourceVersion: 'rev1', quote: 'Approval', start: 0, end: 8 }));
    const after = structuredClone(before);
    after.evidence[0].sourceVersion = 'rev2'; after.evidence[0].start = 2; after.evidence[0].end = 10;
    after.dependencies.push({ name: 'owner/rules', version: '1.0.0', digest: `sha256:${'a'.repeat(64)}` });
    after.rights = { mode: 'open' };
    const result = diffCognitiveCapsules(before, after);
    expect(result.beforeDigest).not.toBe(result.afterDigest);
    expect(result.rows.map(r => [r.group, r.id, r.state])).toEqual([['evidence', 'e1', 'changed'], ['dependencies', 'dependencies', 'changed'], ['policy', 'rights', 'changed']]);
    expect(result.rows[0]).toMatchObject({ before: { sourceVersion: 'rev1', start: 0 }, after: { sourceVersion: 'rev2', start: 2 } });
    expect(diffCognitiveCapsules(after, after).rows).toEqual([]);
    expect(diffCognitiveCapsules(after).rows[0].state).toBe('removed');
  });
});
