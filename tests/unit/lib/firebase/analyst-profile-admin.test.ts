import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock admin db before importing the module
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: vi.fn(),
}));

import { getAnalystProfile, upsertAnalystProfile, completeAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
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

  it('completeAnalystProfile bumps version, writes snapshot, sets root flag', async () => {
    const profileDoc = makeDocStub({ ...DEFAULT_ANALYST_PROFILE, meta: { version: 2, skipCount: 1 } });
    const rootDoc = makeDocStub({});
    const versionDoc = makeDocStub(null);
    const db = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          collection: vi.fn((sub) => ({
            doc: vi.fn((id) => sub === 'profile' ? profileDoc.ref : versionDoc.ref),
          })),
          get: rootDoc.ref.get,
          update: rootDoc.ref.update,
          set: rootDoc.ref.set,
        })),
      })),
    };
    (getAdminDbOrThrow as unknown as ReturnType<typeof vi.fn>).mockReturnValue(db);
    const res = await completeAnalystProfile('u1');
    expect(res.versionId).toBe('v3');
    expect(versionDoc.ref.set).toHaveBeenCalled();
    expect(rootDoc.ref.update).toHaveBeenCalledWith(expect.objectContaining({
      onboardingCompletedAt: expect.anything(),
    }));
  });
});
