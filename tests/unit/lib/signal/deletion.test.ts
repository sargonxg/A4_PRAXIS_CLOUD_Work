import { describe, it, expect, vi, beforeEach } from 'vitest';
const harness = vi.hoisted(() => ({ docs: new Map<string, Record<string, unknown>>(), removed: [] as string[] }));
vi.mock('@/lib/firebase/admin', () => {
  type Data = Record<string, unknown>;
  type Ref = { path: string; id: string | undefined; collection: (name: string) => Collection; get: () => Promise<Snap> };
  type Snap = { exists: boolean; data: () => Data | undefined; ref: Ref };
  type Collection = { doc: (id: string) => Ref; where: (field: string, op: string, value: unknown) => { get: () => Promise<{ docs: Snap[] }> } };
  type Transaction = { get: (r: Ref) => Promise<Snap>; set: (r: Ref, value: Data) => Map<string, Data>; delete: (r: Ref) => boolean };
  const ref = (path: string): Ref => ({ path, id: path.split('/').at(-1), collection: (name: string) => collection(`${path}/${name}`), get: async () => snap(path) });
  const snap = (path: string): Snap => ({ exists: harness.docs.has(path), data: () => harness.docs.get(path), ref: ref(path) });
  const collection = (path: string): Collection => ({ doc: (id: string) => ref(`${path}/${id}`), where: (field: string, _op: string, value: unknown) => ({ get: async () => ({ docs: [...harness.docs].filter(([p, d]) => p.startsWith(`${path}/`) && d[field] === value).map(([p]) => snap(p)) }) }) });
  return { getAdminDbOrThrow: () => ({ collection, runTransaction: async <T>(fn: (tx: Transaction) => Promise<T>) => fn({ get: (r: Ref) => r.get(), set: (r: Ref, value: Data) => harness.docs.set(r.path, structuredClone(value)), delete: (r: Ref) => harness.docs.delete(r.path) }), recursiveDelete: async (r: Ref) => { harness.removed.push(r.path); harness.docs.delete(r.path); } }) };
});
import { deleteSignalDesk, isDeskGeneratedCapsule } from '@/lib/signal/deletion';
const deskPath = 'users/owner/signalDesks/desk';
beforeEach(() => {
  harness.docs.clear(); harness.removed.length = 0;
  harness.docs.set(deskPath, { id: 'desk', ownerUid: 'owner', version: 3, watched: true, contextCapsuleIds: ['signal-abc', 'customer'] });
  harness.docs.set('users/owner/signalRuntime/watchControl', { deskIds: ['desk', 'other'] });
  harness.docs.set('users/owner/signalRuntime/deskControl', { count: 2 });
  harness.docs.set('users/owner/capsules/signal-abc', { ownerUid: 'owner', provenance: { createdBy: 'owner', notes: 'Immutable SIGNAL desk desk version 3; source readings do not verify events.' } });
  harness.docs.set('users/owner/capsules/customer', { ownerUid: 'owner' });
  harness.docs.set('users/owner/signalJobs/job', { deskId: 'desk' });
});
describe('controlled SIGNAL deletion', () => {
  it('removes owned evidence/jobs/generated capsules and releases owner quotas while preserving attached originals', async () => {
    await deleteSignalDesk('owner', 'desk', 3);
    expect(harness.docs.has(deskPath)).toBe(false);
    expect(harness.docs.has('users/owner/capsules/customer')).toBe(true);
    expect(harness.removed).toEqual(['users/owner/capsules/signal-abc', 'users/owner/signalJobs/job']);
    expect(harness.docs.get('users/owner/signalRuntime/watchControl')).toEqual({ deskIds: ['other'] });
    expect(harness.docs.get('users/owner/signalRuntime/deskControl')).toEqual({ count: 1 });
  });
  it('rejects stale versions and cross-owner deletion before modifying evidence', async () => {
    await expect(deleteSignalDesk('owner', 'desk', 2)).rejects.toThrow('Desk changed');
    await expect(deleteSignalDesk('other', 'desk', 3)).rejects.toThrow('unavailable');
    expect(harness.docs.get(deskPath)?.version).toBe(3); expect(harness.removed).toEqual([]);
  });
  it('resumes a blocked deletion without decrementing the allowance twice', async () => {
    harness.docs.set(deskPath, { ...harness.docs.get(deskPath), deletionRequestedAt: '2026-10-05T00:00:00Z', watched: false, version: 4 });
    await deleteSignalDesk('owner', 'desk', 4);
    await expect(deleteSignalDesk('owner', 'desk', 4)).rejects.toThrow('unavailable');
    expect(harness.docs.get('users/owner/signalRuntime/deskControl')).toEqual({ count: 1 });
  });
  it('requires both exact generated provenance and owner, even for a matching ID prefix', () => {
    expect(isDeskGeneratedCapsule('owner', 'desk', 'signal-abc', { ownerUid: 'other', provenance: { createdBy: 'owner', notes: 'Immutable SIGNAL desk desk version 3' } })).toBe(false);
    expect(isDeskGeneratedCapsule('owner', 'desk', 'signal-abc', { ownerUid: 'owner', provenance: { createdBy: 'owner', notes: 'Immutable SIGNAL desk other version 3' } })).toBe(false);
  });
});
