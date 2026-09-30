import { beforeEach, describe, expect, it } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import { sanitizeCapsule } from '@/lib/context/capsule-service';
import { getCapsuleAtVersion, resolveCapsuleReference } from '@/lib/context/capsule-version-resolution';
import { resolveInjectableContext } from '@/lib/context/context-injection';

const documents = new Map<string, unknown>();
const reads: string[] = [];
function ref(path: string): unknown {
  return {
    collection: (name: string) => ref(`${path}/${name}`),
    doc: (id: string) => ref(`${path}/${id}`),
    get: async () => { reads.push(path); return { exists: documents.has(path), data: () => documents.get(path) }; },
  };
}
const deps = { db: { collection: (name: string) => ref(name) } as unknown as Firestore };
function seed(id: string, version: number, historical = false, extra: Record<string, unknown> = {}) {
  const capsule = sanitizeCapsule({ capsuleId: id, ownerUid: 'owner', version, label: `${id} v${version}`,
    summary: `Evidence at version ${version}`, coreRefs: { sourceCoreIds: [`source-v${version}`], documentCoreIds: [`document-v${version}`] }, ...extra });
  documents.set(`users/owner/capsules/${id}${historical ? `/versions/v${version}` : ''}`, capsule);
  return capsule;
}

describe('exact owner-scoped capsule context', () => {
  beforeEach(() => { documents.clear(); reads.length = 0; });

  it('resolves v2 and its evidence instead of current v3 across governing, dock and reference attachments', async () => {
    for (const id of ['case', 'method', 'reference']) { seed(id, 3); seed(id, 2, true); }
    const resolved = await resolveInjectableContext({ uid: 'owner', capsuleId: 'case', activeContextStack: {
      stackId: 'case', sourceIds: ['source-v3'], documentIds: ['document-v3'],
      capsuleRefs: [{ capsuleId: 'case', role: 'situation', version: 2 },
        { capsuleId: 'method', role: 'tool', version: 2 }, { capsuleId: 'reference', role: 'comparison', version: 2 }],
    } }, deps);
    expect(resolved.capsule.version).toBe(2);
    expect(resolved.dockCapsules.map(({ capsule }) => capsule.version)).toEqual([2, 2]);
    expect(resolved.associatedCapsules.map((capsule) => [capsule.capsuleId, capsule.version])).toContainEqual(['reference', 2]);
    expect(resolved.stack.documentIds).toEqual(['document-v2']);
    expect(resolved.stack.sourceIds).toEqual(['source-v2']);
    expect(resolved.promptBlock).not.toContain('document-v3');
    expect(resolved.injectionKey).toContain(':v2:');
  });

  it.each(['case', 'method', 'reference'])('fails closed when the %s pin is missing', async (missing) => {
    for (const id of ['case', 'method', 'reference']) { seed(id, 3); if (id !== missing) seed(id, 2, true); }
    await expect(resolveInjectableContext({ uid: 'owner', capsuleId: 'case', activeContextStack: {
      capsuleRefs: [{ capsuleId: 'case', role: 'situation', version: 2 }, { capsuleId: 'method', role: 'tool', version: 2 },
        { capsuleId: 'reference', role: 'reference', version: 2 }],
    } }, deps)).rejects.toMatchObject({ code: 'capsule_version_unavailable', capsuleId: missing });
    expect(reads.some((path) => path.includes('contextStacks') || path.endsWith('/default'))).toBe(false);
  });

  it.each([{ ownerUid: 'other' }, { capsuleId: 'other' }, { version: undefined }, { version: 2.5 }, { version: 1 }])('rejects malformed snapshot identity %j before normalization', async (bad) => {
    seed('case', 3);
    const historical = seed('case', 2, true);
    documents.set('users/owner/capsules/case/versions/v2', { ...historical, ...bad });
    await expect(resolveCapsuleReference('owner', { capsuleId: 'case', version: 2 }, deps)).rejects.toMatchObject({ code: 'capsule_version_unavailable' });
  });

  it('does not access another owner path or reactivate archived context', async () => {
    seed('case', 3, false, { archivedAt: '2026-09-30' }); seed('case', 2, true);
    expect(await getCapsuleAtVersion('owner', 'case', 2, deps)).toBeNull();
    expect(await getCapsuleAtVersion('other-owner', 'case', 2, deps)).toBeNull();
    expect(reads).not.toContain('users/owner/capsules/case/versions/v2');
  });

  it('reports actual latest versions for unpinned legacy attachments', async () => {
    seed('case', 3); seed('method', 4);
    const result = await resolveInjectableContext({ uid: 'owner', capsuleId: 'case', activeContextStack: {
      capsuleRefs: [{ capsuleId: 'case' }, { capsuleId: 'method', role: 'tool' }],
    } }, deps);
    expect(result.stack.capsuleRefs.map((item) => item.version)).toEqual([3, 4]);
    expect(result.promptBlock).toContain('method (v4,');
  });

  it('refuses fractional requested pins rather than rounding to a different saved version', async () => {
    seed('case', 2);
    await expect(resolveInjectableContext({ uid: 'owner', activeContextStack: { capsuleRefs: [{ capsuleId: 'case', version: 2.5 }] } }, deps))
      .rejects.toMatchObject({ code: 'capsule_version_unavailable' });
    expect(reads).toEqual([]);
  });
});
