import { describe, expect, it, vi } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import { eraseOwnerAccount, OwnerErasureError, pendingExternalErasureStores } from '@/lib/account/owner-erasure';

function fixture(initial: Record<string, Record<string, unknown>>, objectNames: string[] = []) {
  const records = new Map(Object.entries(initial));
  const objects = new Set(objectNames);
  const ref = (path: string) => ({
    path,
    get: async () => ({ exists: records.has(path), data: () => records.get(path) }),
    set: async (data: Record<string, unknown>, options?: { merge?: boolean }) => records.set(path, options?.merge ? { ...records.get(path), ...data } : data),
    listCollections: async () => [...new Set([...records.keys()].filter(key => key.startsWith(`${path}/`)).map(key => key.slice(path.length + 1).split('/')[0]))].map(id => col(`${path}/${id}`)),
  });
  const col = (path: string) => ({
    doc: (id: string) => ref(`${path}/${id}`),
    listDocuments: async () => [...new Set([...records.keys()].filter(key => key.startsWith(`${path}/`)).map(key => key.slice(path.length + 1).split('/')[0]))].map(id => ref(`${path}/${id}`)),
    where: (field: string, _operator: string, uid: string) => ({ limit: (n: number) => ({ get: async () => {
      const docs = [...records.entries()].filter(([key, value]) => key.startsWith(`${path}/`) && key.split('/').length === 2 && value[field] === uid).slice(0, n).map(([key]) => ({ ref: ref(key) }));
      return { empty: !docs.length, docs };
    } }) }),
  });
  const db = {
    collection: col,
    batch: () => {
      const deletes: string[] = [];
      return { delete: (r: { path: string }) => deletes.push(r.path), commit: async () => { for (const path of deletes) records.delete(path); } };
    },
    runTransaction: async (run: (tx: unknown) => unknown) => run({ get: (r: ReturnType<typeof ref>) => r.get(), set: (r: ReturnType<typeof ref>, data: Record<string, unknown>, options?: { merge?: boolean }) => r.set(data, options) }),
  } as unknown as Firestore;
  const bucket = { getFiles: async ({ prefix, maxResults }: { prefix: string; maxResults: number }) => [[...objects].filter(name => name.startsWith(prefix)).slice(0, maxResults).map(name => ({ name, delete: async () => { objects.delete(name); } }))] as [{ name: string; delete: () => Promise<void> }[]] };
  const deleteAuthUser = vi.fn().mockResolvedValue(undefined);
  return { records, objects, deps: { db, bucket, deleteAuthUser, externalCleanup: [] }, deleteAuthUser };
}

describe('inventory-backed owner erasure', () => {
  it('recursively removes capsules, outputs, orphan document chunks and only owned uploads', async () => {
    const f = fixture({
      'users/owner': { uid: 'owner', email: 'owner@example.test' },
      'users/owner/capsules/cap': { ownerUid: 'owner' },
      'users/owner/capsules/cap/askThreads/thread/turns/turn': { output: 'private output' },
      'users/owner/situations/sit/documents/missing/chunks/chunk': { text: 'private source' },
      'capsules/root/versions/hash': { ownerUid: 'owner' },
      'capsules/root': { ownerUid: 'owner' },
      'users/other/capsules/other': { ownerUid: 'other' },
    }, ['users/owner/sit/source.pdf', 'users/other/source.pdf']);
    const report = await eraseOwnerAccount('owner', f.deps);
    expect(report.status).toBe('deleted');
    expect([...f.records.keys()].sort()).toEqual(['users/other/capsules/other', 'users/owner']);
    expect([...f.objects]).toEqual(['users/other/source.pdf']);
    expect(f.records.get('users/owner')).not.toHaveProperty('email');
    expect(f.records.get('users/owner')?.accountDeletionStatus).toBe('deleted');
    expect(f.deleteAuthUser).toHaveBeenCalledWith('owner');
  });
  it('paginates more than 500 owned credit transactions', async () => {
    const initial: Record<string, Record<string, unknown>> = { 'users/owner': {}, 'credit_transactions/foreign': { userId: 'other' } };
    for (let i = 0; i < 605; i++) initial[`credit_transactions/tx-${i}`] = { userId: 'owner' };
    const f = fixture(initial);
    expect((await eraseOwnerAccount('owner', f.deps)).status).toBe('deleted');
    expect([...f.records.keys()].filter(key => key.startsWith('credit_transactions/'))).toEqual(['credit_transactions/foreign']);
  });
  it('retains Auth and a durable partial receipt when a configured SQL pool fails', async () => {
    const f = fixture({ 'users/owner': {} });
    const report = await eraseOwnerAccount('owner', { ...f.deps, externalCleanup: [{ name: 'document_sql', erase: vi.fn().mockRejectedValue(new Error('SQL down')) }] });
    expect(report.pendingStores).toContain('document_sql');
    expect(f.deleteAuthUser).not.toHaveBeenCalled();
    expect(f.records.get('users/owner')?.accountDeletionStatus).toBe('deleting');
    expect(f.records.get('users/owner')?.accountDeletionReport).toMatchObject({ pendingStores: ['document_sql'] });
  });
  it('refuses to orphan a renewing subscription', async () => {
    const f = fixture({ 'users/owner': { subscriptionProvider: 'polar', polarSubscriptionId: 'sub', subscriptionStatus: 'active' } });
    await expect(eraseOwnerAccount('owner', f.deps)).rejects.toBeInstanceOf(OwnerErasureError);
    expect(f.deleteAuthUser).not.toHaveBeenCalled();
    expect(f.records.get('users/owner')).not.toHaveProperty('accountDeletionStatus');
  });
  it('completes scheduled-cancellation accounts after owned store cleanup', async () => {
    const f = fixture({ 'users/owner': { subscriptionProvider: 'polar', polarSubscriptionId: 'sub', subscriptionStatus: 'canceled' } });
    expect((await eraseOwnerAccount('owner', f.deps)).status).toBe('deleted');
  });
  it('makes bounded document cleanup retryable without deleting Auth early', async () => {
    const f = fixture({ 'users/owner': {}, 'users/owner/capsules/a': {}, 'users/owner/capsules/b': {} });
    expect((await eraseOwnerAccount('owner', { ...f.deps, maxDocuments: 1 })).pendingStores).toContain('firestore_owned_data');
    expect(f.deleteAuthUser).not.toHaveBeenCalled();
    expect((await eraseOwnerAccount('owner', f.deps)).status).toBe('deleted');
  });
  it('does not claim provider erasure without a verified provider cleanup adapter', async () => {
    const f = fixture({ 'users/owner': {} });
    const report = await eraseOwnerAccount('owner', { ...f.deps, pendingExternalStores: ['cognee_operator_cleanup'] });
    expect(report.status).toBe('pending');
    expect(f.deleteAuthUser).not.toHaveBeenCalled();
    expect(pendingExternalErasureStores({ NODE_ENV: 'test', COGNEE_ENABLED: 'true', COGNEE_BACKEND_URL: 'https://example.test' })).toEqual(['cognee_operator_cleanup']);
  });
  it('keeps cleanup retryable when Firebase Auth deletion fails', async () => {
    const f = fixture({ 'users/owner': { email: 'private@example.test' } });
    f.deleteAuthUser.mockRejectedValueOnce(new Error('Auth unavailable'));
    expect((await eraseOwnerAccount('owner', f.deps)).pendingStores).toContain('firebase_auth');
    expect(f.records.get('users/owner')).not.toHaveProperty('email');
    expect((await eraseOwnerAccount('owner', f.deps)).status).toBe('deleted');
  });
  it('does not delete a storage object outside the exact owner prefix', async () => {
    const f = fixture({ 'users/owner': {} });
    const deleteObject = vi.fn();
    const report = await eraseOwnerAccount('owner', { ...f.deps, bucket: { getFiles: async () => [[{ name: 'users/another/file.pdf', delete: deleteObject }]] } });
    expect(report.pendingStores).toContain('storage_owned_uploads');
    expect(deleteObject).not.toHaveBeenCalled();
    expect(f.deleteAuthUser).not.toHaveBeenCalled();
  });
});
