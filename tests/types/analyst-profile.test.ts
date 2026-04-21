import { describe, it, expect } from 'vitest';
import { AnalystProfileSchema, DEFAULT_ANALYST_PROFILE } from '@/types/analyst-profile';

describe('AnalystProfile.meta.deletedAt', () => {
  it('accepts null', () => {
    const parsed = AnalystProfileSchema.parse({
      ...DEFAULT_ANALYST_PROFILE,
      meta: { ...DEFAULT_ANALYST_PROFILE.meta, deletedAt: null },
    });
    expect(parsed.meta.deletedAt).toBeNull();
  });
});
