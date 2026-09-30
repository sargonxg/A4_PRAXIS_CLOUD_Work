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
vi.mock('@/lib/context/interaction-frame', () => ({
  deriveInteractionFrame: vi.fn(async () => null),
}));
vi.mock('@/lib/firebase/advisor-history-service', () => ({
  readRecentTurns: vi.fn(async () => []),
}));
vi.mock('@/lib/context/capsule-service', () => ({
  getCapsule: vi.fn(async () => null),
}));
vi.mock('@/lib/path/resolve', () => ({
  resolvePath: vi.fn(async () => null),
}));

import { buildCalibratedContext } from '@/lib/context/profile-context';

describe('buildCalibratedContext — preferences field', () => {
  beforeEach(() => vi.clearAllMocks());

  it('includes preferences on the returned ContextBlock', async () => {
    const ctx = await buildCalibratedContext({ uid: 'user-test', toolId: 'advisory' });
    expect(ctx.preferences).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it.each([undefined, 'an explicit workspace query'])('denies workspace facts and retrieval while preserving the selected capsule: %s', async (retrievalQuery) => {
    const situations = await import('@/lib/firebase/situations');
    const retrieval = await import('@/lib/knowledge/profile-weighted-retrieval');
    const episodes = await import('@/lib/firebase/episodes');
    const interactions = await import('@/lib/context/interaction-frame');
    const advisorHistory = await import('@/lib/firebase/advisor-history-service');
    const capsules = await import('@/lib/context/capsule-service');
    vi.mocked(capsules.getCapsule).mockResolvedValueOnce({
      capsuleId: 'selected-capsule', ownerUid: 'user-test', label: 'Selected context', version: 1,
      claimLedger: [{ claimId: 'selected-claim', text: 'Selected evidence stays available.', support: 'supported', sourceRefIds: [] }],
    } as never);
    const ctx = await buildCalibratedContext({
      uid: 'user-test', toolId: 'chat', situationId: 'unselected-situation', advisorId: 'adeyemi',
      capsuleId: 'selected-capsule', retrievalQuery, allowWorkspaceRetrieval: false,
    });
    expect(retrieval.retrieveForProfile).not.toHaveBeenCalled();
    expect(situations.getSituationById).not.toHaveBeenCalled();
    expect(episodes.listEpisodes).not.toHaveBeenCalled();
    expect(interactions.deriveInteractionFrame).not.toHaveBeenCalled();
    expect(advisorHistory.readRecentTurns).not.toHaveBeenCalled();
    expect(ctx.toolContext.retrievedChunks).toEqual([]);
    expect(ctx.toolContext.situation).toBeNull();
    expect(ctx.systemPromptBlock).toContain('Selected evidence stays available.');
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

  it('renders interaction and advisor frames into the prompt when available', async () => {
    const interactions = await import('@/lib/context/interaction-frame');
    const advisorHistory = await import('@/lib/firebase/advisor-history-service');
    const situations = await import('@/lib/firebase/situations');

    (situations.getSituationById as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 's1',
      name: 'Yemen Ceasefire',
      type: 'civil',
      region: 'Yemen',
      actors: ['UNMHA'],
      userRole: 'analyst',
      status: 'active',
      description: '',
      riskScore: 4,
      glaslStage: 3,
      escalationTrend: 'stable',
      actorCount: 1,
      graphEntities: 0,
      documentCount: 0,
      createdAt: '2026-04-25T00:00:00Z',
      updatedAt: '2026-04-25T12:34:00Z',
    });
    (interactions.deriveInteractionFrame as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      activeSituationDrafts: 2,
      recentTools: [{ toolId: 'risk-monitor', ranAt: '2026-04-25T12:00:00Z', summary: 'Risk increased near port corridor.' }],
    });
    (advisorHistory.readRecentTurns as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { role: 'user', content: 'Review ceasefire enforcement.', at: '2026-04-25T12:01:00Z' },
      { role: 'assistant', content: 'Focus on monitoring provisions and verification gaps.', at: '2026-04-25T12:02:00Z' },
    ]);

    const ctx = await buildCalibratedContext({
      uid: 'user-test',
      situationId: 's1',
      toolId: 'advisory',
      advisorId: 'adeyemi',
    });

    expect(ctx.systemPromptBlock).toContain('<interaction-frame>');
    expect(ctx.systemPromptBlock).toContain('risk-monitor');
    expect(ctx.systemPromptBlock).toContain('<advisor-frame id="adeyemi">');
    expect(ctx.systemPromptBlock).toContain('verification gaps');
    expect(ctx.provenance.situationVersion).toBe(Date.parse('2026-04-25T12:34:00Z'));
  });
});
