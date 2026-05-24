import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock admin db before importing the module
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {},
  getAdminDbOrThrow: vi.fn(),
}));

import {
  completeAnalystProfile,
  getAnalystProfile,
  hasUserSkippedOnboarding,
  upsertAnalystProfile,
} from '@/lib/firebase/analyst-profile-admin';
import { adminDb, getAdminDbOrThrow } from '@/lib/firebase/admin';
import { DEFAULT_ANALYST_PROFILE } from '@/types/analyst-profile';

function makeDocStub(initial: Record<string, unknown> | null) {
  let data = initial;
  const ref: Record<string, unknown> = {};
  ref.get = vi.fn(async () => ({ exists: data !== null, data: () => data }));
  ref.set = vi.fn(async (next: Record<string, unknown>, opts?: { merge?: boolean }) => {
    data = opts?.merge ? { ...(data ?? {}), ...next } : next;
  });
  ref.update = vi.fn(async (next: Record<string, unknown>) => {
    data = { ...(data ?? {}), ...next };
  });
  return { ref, read: () => data };
}

describe('analyst-profile-admin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAnalystProfile returns null for unknown user', async () => {
    const profileDoc = makeDocStub(null);
    const rootUserDoc = makeDocStub(null);
    const versionsCol = { doc: vi.fn(() => makeDocStub(null).ref) };
    const db = {
      collection: vi.fn((name) => {
        if (name === 'users') return {
          doc: vi.fn((uid) => ({
            collection: vi.fn((sub) => ({
              doc: vi.fn(() => sub === 'profile' ? profileDoc.ref : makeDocStub(null).ref),
            })),
            get: rootUserDoc.ref.get,
            update: rootUserDoc.ref.update,
            set: rootUserDoc.ref.set,
          })),
        };
        return { doc: vi.fn() };
      }),
    };
    (getAdminDbOrThrow as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    const out = await getAnalystProfile('u1');
    expect(out).toBeNull();
  });

  it('upsertAnalystProfile merges into profile doc', async () => {
    const profileDoc = makeDocStub({ identity: { role: 'analyst' } });
    const db = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          collection: vi.fn(() => ({ doc: vi.fn(() => profileDoc.ref) })),
        })),
      })),
    };
    (getAdminDbOrThrow as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    await upsertAnalystProfile('u1', { identity: { role: 'un_official', seniority: 'senior', org: 'UN', team: 'DPPA' } });
    expect(profileDoc.ref.set).toHaveBeenCalledWith(expect.objectContaining({
      identity: { role: 'un_official', seniority: 'senior', org: 'UN', team: 'DPPA' },
    }), { merge: true });
  });

  it('hasUserSkippedOnboarding returns true when the analyst profile has a skip count', async () => {
    const profileDoc = makeDocStub({ ...DEFAULT_ANALYST_PROFILE, meta: { ...DEFAULT_ANALYST_PROFILE.meta, skipCount: 1 } });
    const db = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          collection: vi.fn(() => ({ doc: vi.fn(() => profileDoc.ref) })),
        })),
      })),
    };
    (getAdminDbOrThrow as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);

    await expect(hasUserSkippedOnboarding('u1')).resolves.toBe(true);
  });

  it('completeAnalystProfile bumps version, writes snapshot, marks profile completed atomically', async () => {
    const writes: Array<{ kind: 'set' | 'update'; data: Record<string, unknown> }> = [];
    const profileRef = { __kind: 'profile' } as const;
    const versionRef = { __kind: 'version' } as const;
    const userRef = {
      __kind: 'user',
      collection: vi.fn((sub: string) => ({
        doc: vi.fn(() => (sub === 'profile' ? profileRef : versionRef)),
      })),
    };
    const mockDb = adminDb as unknown as {
      collection: ReturnType<typeof vi.fn>;
      runTransaction: ReturnType<typeof vi.fn>;
    };
    mockDb.collection = vi.fn(() => ({ doc: vi.fn(() => userRef) }));
    mockDb.runTransaction = vi.fn(async (fn: (tx: {
      get: (ref: unknown) => Promise<{ exists: boolean; data: () => Record<string, unknown> }>;
      set: (ref: unknown, data: Record<string, unknown>) => void;
      update: (ref: unknown, data: Record<string, unknown>) => void;
    }) => Promise<unknown>) => {
      return fn({
        get: async () => ({
          exists: true,
          data: () => ({ ...DEFAULT_ANALYST_PROFILE, meta: { version: 2, skipCount: 1 } }),
        }),
        set: (_ref, data) => { writes.push({ kind: 'set', data }); },
        update: (_ref, data) => { writes.push({ kind: 'update', data }); },
      });
    });

    const res = await completeAnalystProfile('u1');
    expect(res.versionId).toBe('v3');
    // Two writes inside the one runTransaction call: snapshot + live profile merge.
    // Root-doc onboardingCompletedAt mirror was removed in the profile-merge cleanup;
    // single source of truth is users/{uid}/profile/analyst.meta.completedAt.
    expect(mockDb.runTransaction).toHaveBeenCalledTimes(1);
    expect(writes.length).toBeGreaterThanOrEqual(2);
    const completionWrite = writes.find((w) => {
      const meta = (w.data as { meta?: Record<string, unknown> }).meta;
      return meta && 'completedAt' in meta;
    });
    expect(completionWrite).toBeDefined();
    expect(writes.every((w) => !('onboardingCompletedAt' in w.data))).toBe(true);
  });
});
