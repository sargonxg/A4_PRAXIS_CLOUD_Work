import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_USER_PREFERENCES } from '@/types/preferences';
import type { MergedDomainConfig } from '@/types/domain';

const GENERIC_MOCK_DOMAIN = {
  id: 'generic',
  name: 'Generic',
  description: 'Baseline',
  parentId: null,
  lensWeights: {
    diplomatic: 1,
    security: 1,
    humanitarian: 1,
    economic: 1,
    legal_ihl: 1,
    human_rights: 1,
    development: 1,
    mediation: 1,
    climate_security: 1,
  },
  preferredFeeds: [],
  frameworks: [],
  promptOverrides: {},
  defaultAudience: null,
  colorHex: '#000000',
  icon: 'globe',
  version: 0,
  schemaVersion: 1,
} satisfies MergedDomainConfig;

vi.mock('@/lib/firebase/admin', () => ({ adminDb: {} }));
vi.mock('@/lib/domain/resolve', () => ({
  resolveUserDomain: vi.fn(async () => GENERIC_MOCK_DOMAIN),
  resolveDomain: vi.fn(async () => GENERIC_MOCK_DOMAIN),
  mergeUserAndSituationDomains: vi.fn((u: unknown) => u),
}));
vi.mock('@/lib/firebase/analyst-profile-admin', () => ({
  getAnalystProfile: vi.fn(async () => null),
}));
vi.mock('@/lib/firebase/situations', () => ({
  getSituationById: vi.fn(async () => null),
}));
vi.mock('@/lib/firebase/episodes', () => ({
  listEpisodes: vi.fn(async () => []),
}));
vi.mock('@/lib/knowledge/profile-weighted-retrieval', () => ({
  retrieveForProfile: vi.fn(async () => []),
}));
vi.mock('@/lib/firebase/preferences-service', () => ({
  getPreferences: vi.fn(async () => DEFAULT_USER_PREFERENCES),
}));

import { buildCalibratedContext } from '@/lib/context/profile-context';

describe('buildCalibratedContext — preferences field', () => {
  beforeEach(() => vi.clearAllMocks());

  it('includes preferences on the returned ContextBlock', async () => {
    const ctx = await buildCalibratedContext({ uid: 'user-test', toolId: 'advisory' });
    expect(ctx.preferences).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it('sets interaction and advisor frames to null by default (Task 2.1 scope)', async () => {
    const ctx = await buildCalibratedContext({ uid: 'user-test', toolId: 'advisory' });
    expect(ctx.interaction).toBeNull();
    expect(ctx.advisor).toBeNull();
  });

  it('falls back to DEFAULT_USER_PREFERENCES when getPreferences throws', async () => {
    const mod = await import('@/lib/firebase/preferences-service');
    (mod.getPreferences as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('firestore down'));
    const ctx = await buildCalibratedContext({ uid: 'user-test', toolId: 'advisory' });
    expect(ctx.preferences).toEqual(DEFAULT_USER_PREFERENCES);
  });
});
