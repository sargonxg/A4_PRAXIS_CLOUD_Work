import { describe, it, expect } from 'vitest';
import { scrubProfilePII } from '@/lib/services/pii-scrub';
import { DEFAULT_ANALYST_PROFILE } from '@/types/analyst-profile';

describe('scrubProfilePII', () => {
  it('clears org, team, mandate, regions, red lines, embedding, and sets deletedAt', () => {
    const input = {
      ...DEFAULT_ANALYST_PROFILE,
      identity: { role: 'un_official' as const, seniority: 'senior' as const, org: 'UN DPPA', team: 'Mediation' },
      perspective: { ...DEFAULT_ANALYST_PROFILE.perspective, mandate: 'watch Sahel', regions: ['Sahel', 'MENA'] },
      workingStyle: { ...DEFAULT_ANALYST_PROFILE.workingStyle, redLines: ['never use X'] },
      embedding: { vector: new Array(768).fill(0.1), generatedAt: null, model: 'text-embedding-005' },
    };
    const out = scrubProfilePII(input as never);
    expect(out.identity.org).toBe('');
    expect(out.identity.team).toBe('');
    expect(out.perspective.mandate).toBe('');
    expect(out.perspective.regions).toEqual([]);
    expect(out.workingStyle.redLines).toEqual([]);
    expect((out as { embedding?: unknown }).embedding).toBeUndefined();
    expect(out.meta.deletedAt).not.toBeNull();
  });

  it('preserves role, seniority, lenses, audience, primaryDomain', () => {
    const input = DEFAULT_ANALYST_PROFILE;
    const out = scrubProfilePII(input);
    expect(out.identity.role).toBe(input.identity.role);
    expect(out.identity.seniority).toBe(input.identity.seniority);
    expect(out.perspective.lenses).toEqual(input.perspective.lenses);
    expect(out.perspective.audience).toBe(input.perspective.audience);
    expect(out.perspective.primaryDomain).toBe(input.perspective.primaryDomain);
  });
});
