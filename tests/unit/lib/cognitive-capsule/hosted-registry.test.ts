import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import { HostedCapsuleRegistry } from '@/lib/cognitive-capsule/hosted-registry';
import { HostedRegistryRequestSchema } from '@/lib/cognitive-capsule/hosted-registry-contract';
import { createCognitiveCapsule, KnowledgeSchema } from '@/lib/cognitive-capsule/schema';
import { readCapsulePackage } from '@/lib/cognitive-capsule/package';
import { sanitizeCapsule } from '@/lib/context/capsule-service';

const at = '2026-10-03T12:00:00Z';
function fixture() {
  const records = new Map<string, Record<string, unknown>>([['users/owner', { uid: 'owner' }], ['users/other', { uid: 'other' }]]);
  const objects = new Map<string, Buffer>();
  let beforeTransaction: (() => void) | undefined;
  const col = (path: string) => ({ doc: (id: string) => ref(`${path}/${id}`), orderBy: () => query(path), limit: (limit: number) => query(path, limit) });
  const query = (path: string, limit = 101, cursor = '') => ({ limit: (next: number) => query(path, next, cursor), startAfter: (next: string) => query(path, limit, next), get: async () => {
    const docs = [...records.entries()].filter(([key]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/') && key.slice(path.length + 1) > cursor).sort(([a], [b]) => a.localeCompare(b)).slice(0, limit).map(([key, value]) => ({ id: key.slice(path.length + 1), ref: ref(key), exists: true, data: () => value }));
    return { docs, empty: !docs.length };
  } });
  const ref = (path: string) => ({ path, id: path.split('/').at(-1)!, collection: (name: string) => col(`${path}/${name}`), get: async () => ({ exists: records.has(path), data: () => records.get(path) }), set: async (data: Record<string, unknown>) => { records.set(path, data); } });
  const db = { collection: col, runTransaction: async (work: (tx: unknown) => unknown) => {
    const before = beforeTransaction; beforeTransaction = undefined; before?.();
    const writes: Array<[string, Record<string, unknown>]> = [];
    const result = await work({ get: (reference: ReturnType<typeof ref>) => reference.get(), set: (reference: ReturnType<typeof ref>, data: Record<string, unknown>) => writes.push([reference.path, data]) });
    for (const [path, data] of writes) records.set(path, data); return result;
  } } as unknown as Firestore;
  const bucket = { file: (path: string) => ({
    save: async (bytes: Uint8Array) => { if (objects.has(path)) throw Object.assign(new Error('Exists'), { code: 412 }); objects.set(path, Buffer.from(bytes)); },
    download: async () => { const bytes = objects.get(path); if (!bytes) throw new Error('Missing object'); return [Buffer.from(bytes)] as [Buffer]; },
    getMetadata: async () => [{ size: objects.get(path)?.length ?? 0 }] as [{ size: number }],
    delete: async () => { objects.delete(path); },
  }) };
  const stageInstallation = vi.fn(async () => ({ draftCapsuleId: 'review-draft', reviewCardId: 'review-card' }));
  const registry = new HostedCapsuleRegistry('owner', { db, bucket, now: () => new Date(at), stageInstallation });
  function source(id: string, version = 1, overrides: Record<string, unknown> = {}) {
    const cognition = createCognitiveCapsule(id, `1.${version}.0`);
    const actor = { type: 'human', id: 'expert', at };
    cognition.knowledge.push(KnowledgeSchema.parse({ id: 'distinction', kind: 'distinction', label: 'Authorization is not expenditure', scope: ['finance'], conceptA: 'authorization', conceptB: 'expenditure', explanation: 'Authorization alone does not prove spending.', whyItMatters: 'Preserve fiscal stages.', commonMistake: 'Treating funding as spent.', reviewState: 'accepted', provenance: { generatedBy: actor, reviewedBy: actor, reviewedAt: at, sourceRefs: [] } }));
    const capsule = sanitizeCapsule({ capsuleId: id, ownerUid: 'owner', version, cognition, access: { allowDownload: true }, ...overrides });
    records.set(`users/owner/capsules/${id}`, capsule as unknown as Record<string, unknown>); return capsule;
  }
  return { registry, db, bucket, records, objects, source, stageInstallation, beforeTransaction: (before: () => void) => { beforeTransaction = before; } };
}

describe('owner-private hosted registry', () => {
  let f: ReturnType<typeof fixture>;
  beforeEach(() => { f = fixture(); });

  it('publishes only an exact saved source and returns immutable digest-verified bytes', async () => {
    f.source('finance');
    const published = await f.registry.publish({ operation: 'publish', capsuleId: 'finance', envelopeVersion: 1, name: 'expert/finance' });
    const pulled = await f.registry.pull('expert/finance', '1.1.0');
    const read = await readCapsulePackage(pulled.bytes);
    expect(read.capsule.capsuleId).toBe('expert/finance');
    expect(read.capsule.knowledge[0].provenance.generatedBy.id).toBe('expert');
    expect(pulled.entry.digest).toBe(published.digest);
    expect([...f.objects.keys()][0]).toMatch(/^users\/owner\/capsule-registry\/objects\/[a-f0-9]{64}\.capsule$/);
    await expect(new HostedCapsuleRegistry('other', { db: f.db, bucket: f.bucket }).pull('expert/finance', '1.1.0')).rejects.toMatchObject({ status: 404 });
    const second = await f.registry.publish({ operation: 'publish', capsuleId: 'finance', envelopeVersion: 1, name: 'expert/finance' });
    expect(second.digest).toBe(published.digest);
    const changed = f.source('finance'); changed.cognition!.knowledge[0].label = 'Different rule';
    f.records.set('users/owner/capsules/finance', changed as unknown as Record<string, unknown>);
    await expect(f.registry.publish({ operation: 'publish', capsuleId: 'finance', envelopeVersion: 1, name: 'expert/finance' })).rejects.toMatchObject({ status: 409 });
  });

  it('rejects missing saved pins, disabled downloads, ungranted restricted rights and erased owners', async () => {
    const publish = { operation: 'publish' as const, capsuleId: 'finance', envelopeVersion: 1, name: 'expert/finance' };
    f.source('finance', 2);
    await expect(f.registry.publish(publish)).rejects.toMatchObject({ status: 404 });
    f.source('finance', 1, { access: { allowDownload: false } });
    await expect(f.registry.publish(publish)).rejects.toMatchObject({ status: 403 });
    const restricted = f.source('finance'); restricted.cognition!.rights = { mode: 'organization' };
    f.records.set('users/owner/capsules/finance', restricted as unknown as Record<string, unknown>);
    await expect(f.registry.publish(publish)).rejects.toMatchObject({ status: 403 });
    f.records.set('users/owner', { uid: 'owner', accountDeletionStatus: 'deleting' });
    await expect(f.registry.list()).rejects.toMatchObject({ code: 'ACCOUNT_UNAVAILABLE' });
    expect(f.objects.size).toBe(0);
  });

  it('stages install/update for human review and locks exact dependency bytes without changing canonical context', async () => {
    f.source('language');
    const dependency = await f.registry.publish({ operation: 'publish', capsuleId: 'language', envelopeVersion: 1, name: 'expert/language' });
    const parent = f.source('situation'); parent.cognition!.dependencies = [{ name: dependency.name, version: dependency.version, digest: dependency.digest }];
    f.records.set('users/owner/capsules/situation', parent as unknown as Record<string, unknown>);
    const publication = await f.registry.publish({ operation: 'publish', capsuleId: 'situation', envelopeVersion: 1, name: 'expert/situation' });
    const installed = await f.registry.install('expert/situation', publication.version);
    expect(installed).toMatchObject({ promotion: 'not-promoted', draftCapsuleId: 'review-draft', reviewCardId: 'review-card' });
    expect(installed.lock).toContainEqual(expect.objectContaining({ name: dependency.name, digest: dependency.digest }));
    expect(f.records.get('users/owner/capsules/situation')).toBe(parent);
    expect(f.stageInstallation).toHaveBeenCalledTimes(1);
    expect((await f.registry.install('expert/situation', publication.version)).digest).toBe(installed.digest);
    expect(f.stageInstallation).toHaveBeenCalledTimes(1);
    const next = f.source('situation', 2); next.cognition!.dependencies = parent.cognition!.dependencies;
    f.records.set('users/owner/capsules/situation', next as unknown as Record<string, unknown>);
    await f.registry.publish({ operation: 'publish', capsuleId: 'situation', envelopeVersion: 2, name: 'expert/situation' });
    await expect(f.registry.install('expert/situation', '1.2.0')).rejects.toMatchObject({ status: 409 });
    await expect(f.registry.update('expert/situation', '1.2.0', `sha256:${'0'.repeat(64)}`)).rejects.toMatchObject({ status: 409 });
    const updated = await f.registry.update('expert/situation', '1.2.0', installed.digest);
    expect(updated.version).toBe('1.2.0'); expect(updated.promotion).toBe('not-promoted');
  });

  it('shows actual dependency impact and prevents new installations of deprecated locks', async () => {
    f.source('base'); const base = await f.registry.publish({ operation: 'publish', capsuleId: 'base', envelopeVersion: 1, name: 'expert/base' });
    const parent = f.source('parent'); parent.cognition!.dependencies = [{ name: base.name, version: base.version, digest: base.digest }];
    f.records.set('users/owner/capsules/parent', parent as unknown as Record<string, unknown>);
    await f.registry.publish({ operation: 'publish', capsuleId: 'parent', envelopeVersion: 1, name: 'expert/parent' });
    const impact = await f.registry.impact(base.name, base.version);
    expect(impact.directDependents).toContainEqual(expect.objectContaining({ name: 'expert/parent', version: '1.1.0' }));
    await f.registry.deprecate(base.name, base.version, 'Authority changed; review the update.');
    await expect(f.registry.install('expert/parent', '1.1.0')).rejects.toThrow(/deprecated/i);
    expect(f.stageInstallation).not.toHaveBeenCalled();
    expect((await f.registry.pull(base.name, base.version)).entry.deprecated).toBeTruthy();
  });

  it('rejects altered Storage bytes and accepts only the bounded saved-source request schema', async () => {
    f.source('finance'); await f.registry.publish({ operation: 'publish', capsuleId: 'finance', envelopeVersion: 1, name: 'expert/finance' });
    f.objects.set([...f.objects.keys()][0], Buffer.from('altered'));
    await expect(f.registry.pull('expert/finance', '1.1.0')).rejects.toThrow(/digest|artifact/i);
    expect(HostedRegistryRequestSchema.safeParse({ operation: 'publish', capsuleId: 'finance', envelopeVersion: 1, name: 'expert/finance', artifactBase64: 'untrusted' }).success).toBe(false);
  });

  it('does not leave a reviewable draft when installation locks change before commit', async () => {
    f.source('finance'); const entry = await f.registry.publish({ operation: 'publish', capsuleId: 'finance', envelopeVersion: 1, name: 'expert/finance' });
    f.beforeTransaction(() => {
      const [path, record] = [...f.records].find(([, value]) => value.name === entry.name)!;
      f.records.set(path, { ...record, deprecated: 'Changed before installation.' });
    });
    await expect(f.registry.install(entry.name, entry.version)).rejects.toMatchObject({ status: 409 });
    expect(f.stageInstallation).not.toHaveBeenCalled();
    expect([...f.records.keys()].filter((path) => path.includes('capsuleRegistryInstallations/'))).toEqual([]);
    expect([...f.records.keys()].filter((path) => path.includes('/reviewCards/'))).toEqual([]);
  });

  it('atomically stages the default review-only draft and preserves it on repeated installation', async () => {
    f.source('finance'); const entry = await f.registry.publish({ operation: 'publish', capsuleId: 'finance', envelopeVersion: 1, name: 'expert/finance' });
    const registry = new HostedCapsuleRegistry('owner', { db: f.db, bucket: f.bucket, now: () => new Date(at) });
    const installed = await registry.install(entry.name, entry.version);
    const draft = f.records.get(`users/owner/capsules/${installed.draftCapsuleId}`)!;
    expect(draft).toMatchObject({ ownerUid: 'owner', latestGateState: 'proposed', activeForSituationIds: [] });
    const review = f.records.get(`users/owner/capsules/${installed.draftCapsuleId}/reviewCards/${installed.reviewCardId}`)!;
    expect(review.state).toBe('proposed');
    expect((review.proposedEnvelopePatch as { cognition: { knowledge: Array<{ reviewState: string }> } }).cognition.knowledge[0].reviewState).toBe('proposed');
    expect(await registry.install(entry.name, entry.version)).toEqual(installed);
    expect(f.records.get(`users/owner/capsules/${installed.draftCapsuleId}`)).toBe(draft);
  });

  it('rejects a saved source modified during byte upload instead of publishing stale cognition', async () => {
    f.source('finance'); const originalBucket = f.bucket;
    const bucket = { file: (path: string) => {
      const file = originalBucket.file(path);
      return { ...file, save: async (bytes: Uint8Array) => {
        await file.save(bytes);
        const changed = f.source('finance'); changed.cognition!.knowledge[0].label = 'Changed during publication';
        f.records.set('users/owner/capsules/finance', changed as unknown as Record<string, unknown>);
      } };
    } };
    const registry = new HostedCapsuleRegistry('owner', { db: f.db, bucket });
    await expect(registry.publish({ operation: 'publish', capsuleId: 'finance', envelopeVersion: 1, name: 'expert/finance' })).rejects.toMatchObject({ code: 'source_version_changed', status: 409 });
    expect([...f.records.keys()].filter((path) => path.includes('/capsuleRegistry/'))).toEqual([]);
  });
});
