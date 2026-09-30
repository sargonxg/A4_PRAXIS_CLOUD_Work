import { describe, expect, it, vi } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
vi.mock('@/lib/firebase/admin', () => ({ adminDb: null }));
import { initializeServerUserProfile } from '@/lib/firebase/user-profile-server';

const identity = { uid: 'owner', email: 'owner@example.test', name: 'Owner' };
function fixture(owner?: Record<string, unknown>, ledger?: Record<string, unknown>) {
  const records = new Map<string, Record<string, unknown>>();
  if (owner) records.set('users/owner', owner);
  if (ledger) records.set('credit_transactions/signup-owner', ledger);
  const set = vi.fn((ref: { path: string }, data: Record<string, unknown>) => records.set(ref.path, data));
  const db = {
    collection: (name: string) => ({ doc: (id: string) => ({ path: `${name}/${id}` }) }),
    runTransaction: async (run: (tx: unknown) => unknown) => run({
      get: async (ref: { path: string }) => ({ exists: records.has(ref.path), data: () => records.get(ref.path) }), set,
    }),
  } as unknown as Firestore;
  return { db, records, set };
}

describe('server-owned starter account grant', () => {
  it('initializes a new profile and one 1,000-credit ledger entry in the same transaction', async () => {
    const f = fixture();
    expect(await initializeServerUserProfile(identity, { db: f.db })).toEqual({ status: 'created' });
    expect(f.records.get('users/owner')).toMatchObject({ uid: 'owner', credits: 1000, totalCreditsUsed: 0, subscription: 'free', isDemo: false });
    expect(f.records.get('credit_transactions/signup-owner')).toMatchObject({ userId: 'owner', amount: 1000, type: 'signup' });
    expect(f.set).toHaveBeenCalledTimes(2);
  });
  it('preserves spent balances and existing settings across repeated login', async () => {
    const f = fixture({ credits: 17, subscription: 'analyst', displayName: 'Edited name' });
    expect(await initializeServerUserProfile(identity, { db: f.db })).toEqual({ status: 'existing' });
    expect(await initializeServerUserProfile(identity, { db: f.db })).toEqual({ status: 'existing' });
    expect(f.set).not.toHaveBeenCalled();
    expect(f.records.get('users/owner')?.credits).toBe(17);
  });
  it('does not regrant a starter balance if a previous ledger survives a missing profile', async () => {
    const f = fixture(undefined, { userId: 'owner', amount: 1000 });
    await initializeServerUserProfile(identity, { db: f.db });
    expect(f.records.get('users/owner')?.credits).toBe(0);
    expect(f.set).toHaveBeenCalledTimes(1);
  });
  it.each(['deleting', 'deleted'])('never changes a %s owner marker', async (status) => {
    const f = fixture({ accountDeletionStatus: status });
    expect(await initializeServerUserProfile(identity, { db: f.db })).toEqual({ status: 'deleting' });
    expect(f.set).not.toHaveBeenCalled();
  });
  it('distinguishes credential-free auth from a configured datastore outage', async () => {
    expect(await initializeServerUserProfile(identity)).toEqual({ status: 'storage_unavailable' });
    const db = { runTransaction: vi.fn().mockRejectedValue(new Error('Firestore unavailable')), collection: () => ({ doc: () => ({}) }) } as unknown as Firestore;
    await expect(initializeServerUserProfile(identity, { db })).rejects.toThrow('Firestore unavailable');
  });
});
