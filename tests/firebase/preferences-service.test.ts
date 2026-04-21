import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map<string, unknown>();

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    doc: (path: string) => ({
      get: async () => ({ exists: store.has(path), data: () => store.get(path) }),
      set: async (d: unknown) => { store.set(path, d); },
    }),
  },
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TS' },
}));

// Dynamic import after mocks
const { getPreferences, savePreferences } = await import('@/lib/firebase/preferences-service');

describe('preferences-service', () => {
  beforeEach(() => { store.clear(); });

  it('returns defaults when no doc exists', async () => {
    const prefs = await getPreferences('user-a');
    expect(prefs.citationStyle).toBe('un-footnote');
    expect(prefs.defaultReportLength).toBe('standard');
  });

  it('persists a patch and rereads', async () => {
    await savePreferences('user-b', { citationStyle: 'apa', defaultReportLength: 'brief' });
    const prefs = await getPreferences('user-b');
    expect(prefs.citationStyle).toBe('apa');
    expect(prefs.defaultReportLength).toBe('brief');
  });

  it('ignores an invalid partial and keeps existing values', async () => {
    await savePreferences('user-c', { citationStyle: 'apa' });
    // @ts-expect-error — test invalid value at runtime
    await expect(savePreferences('user-c', { citationStyle: 'mla' })).rejects.toThrow();
    const prefs = await getPreferences('user-c');
    expect(prefs.citationStyle).toBe('apa'); // unchanged
  });
});
