import { describe, it, expect } from 'vitest';
import {
  AnalystProfileSchema,
  DEFAULT_ANALYST_PROFILE,
  LENSES,
  isProfileComplete,
} from '@/types/analyst-profile';

describe('AnalystProfile', () => {
  it('DEFAULT profile is valid against schema', () => {
    const result = AnalystProfileSchema.safeParse(DEFAULT_ANALYST_PROFILE);
    expect(result.success).toBe(true);
  });

  it('rejects profile with <1 lens', () => {
    const bad = { ...DEFAULT_ANALYST_PROFILE, perspective: { ...DEFAULT_ANALYST_PROFILE.perspective, lenses: [] } };
    expect(AnalystProfileSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects profile with >5 lenses', () => {
    const bad = {
      ...DEFAULT_ANALYST_PROFILE,
      perspective: { ...DEFAULT_ANALYST_PROFILE.perspective, lenses: LENSES.slice(0, 6) },
    };
    expect(AnalystProfileSchema.safeParse(bad).success).toBe(false);
  });

  it('isProfileComplete returns true only when required fields set', () => {
    expect(isProfileComplete(DEFAULT_ANALYST_PROFILE)).toBe(false);
    const filled = {
      ...DEFAULT_ANALYST_PROFILE,
      identity: { role: 'un_official', seniority: 'senior', org: 'UN DPPA', team: 'Africa II' },
      perspective: { ...DEFAULT_ANALYST_PROFILE.perspective, mandate: 'x'.repeat(60), lenses: ['diplomatic'], regions: ['Sahel'], audience: 'senior_leadership' },
    };
    expect(isProfileComplete(filled)).toBe(true);
  });

  it('LENSES contains exactly 9 entries', () => {
    expect(LENSES).toHaveLength(9);
  });
});
