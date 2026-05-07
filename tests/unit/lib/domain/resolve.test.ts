import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock firebase-admin so resolveDomain falls back to seed data cleanly.
vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    doc: () => ({
      get: async () => ({ exists: false, data: () => undefined }),
    }),
  },
}));

import {
  resolveDomain,
  resolveUserDomain,
  mergeUserAndSituationDomains,
  bustDomainCache,
} from '@/lib/domain/resolve';
import { LENSES } from '@/types/analyst-profile';

describe('resolveDomain — baseline behaviour from seeds', () => {
  beforeEach(() => bustDomainCache());

  it('returns generic for unknown id without throwing', async () => {
    const result = await resolveDomain('does-not-exist');
    expect(result.id).toBe('generic');
    // All 9 lenses must be present with a numeric weight
    for (const lens of LENSES) {
      expect(typeof result.lensWeights[lens]).toBe('number');
    }
  });

  it('merges generic with specific — humanitarian amplifies humanitarian lens', async () => {
    const result = await resolveDomain('humanitarian');
    expect(result.id).toBe('humanitarian');
    expect(result.lensWeights.humanitarian).toBeGreaterThan(
      result.lensWeights.economic, // economic is 1.0 (inherited from generic)
    );
    expect(result.lensWeights.humanitarian).toBeCloseTo(2.0, 2);
  });

  it('situation domain wins when merged with user domain', () => {
    const user = {
      id: 'humanitarian' as const,
      name: 'Humanitarian',
      description: '',
      parentId: 'generic' as const,
      lensWeights: Object.fromEntries(LENSES.map((l) => [l, 1.0])) as Record<
        typeof LENSES[number],
        number
      >,
      preferredFeeds: ['reliefweb'],
      frameworks: ['ocha_humanitarian'],
      promptOverrides: {},
      defaultAudience: 'external_partners' as const,
      colorHex: '#E8B931',
      icon: 'HeartHandshake',
      version: 1,
      schemaVersion: 1,
    };
    const situation = {
      ...user,
      id: 'armed-conflict-security' as const,
      name: 'Armed Conflict & Security',
      preferredFeeds: ['ucdp'],
      frameworks: ['glasl_escalation'],
      colorHex: '#A63D40',
      icon: 'Shield',
    };
    const merged = mergeUserAndSituationDomains(user, situation);
    expect(merged.id).toBe('armed-conflict-security');
    expect(merged.preferredFeeds).toContain('ucdp');
    expect(merged.preferredFeeds).toContain('reliefweb');
    expect(merged.frameworks).toContain('glasl_escalation');
    expect(merged.frameworks).toContain('ocha_humanitarian');
  });

  it('resolveUserDomain: secondary domains boost lens weights without erasing primary', async () => {
    const profile = {
      perspective: {
        primaryDomain: 'diplomacy-negotiation',
        secondaryDomains: ['humanitarian'],
      },
    };
    const result = await resolveUserDomain(profile);
    expect(result.id).toBe('diplomacy-negotiation');
    // humanitarian lens should be boosted above generic's 1.0 baseline
    expect(result.lensWeights.humanitarian).toBeGreaterThan(1.0);
    // primary domain's dominant lens (diplomatic) should remain elevated
    expect(result.lensWeights.diplomatic).toBeGreaterThan(1.5);
  });
});
