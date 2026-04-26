import { describe, it, expect } from 'vitest';
import { UserPreferencesSchema, DEFAULT_USER_PREFERENCES } from '@/types/preferences';

describe('UserPreferences', () => {
  it('accepts defaults', () => {
    const parsed = UserPreferencesSchema.parse(DEFAULT_USER_PREFERENCES);
    expect(parsed.citationStyle).toBe('un-footnote');
    expect(parsed.defaultReportLength).toBe('standard');
    expect(parsed.defaultLanguage).toBe('en');
  });

  it('rejects unknown citation style', () => {
    expect(() => UserPreferencesSchema.parse({ ...DEFAULT_USER_PREFERENCES, citationStyle: 'mla' })).toThrow();
  });

  it('accepts a null preferredAdvisor', () => {
    const parsed = UserPreferencesSchema.parse({ ...DEFAULT_USER_PREFERENCES, preferredAdvisor: null });
    expect(parsed.preferredAdvisor).toBeNull();
  });

  it('accepts workspace tool visibility preferences', () => {
    const parsed = UserPreferencesSchema.parse({
      ...DEFAULT_USER_PREFERENCES,
      hiddenToolIds: ['game-theory'],
      toolOrder: ['dashboard', 'risk-monitor'],
    });
    expect(parsed.hiddenToolIds).toEqual(['game-theory']);
    expect(parsed.toolOrder).toEqual(['dashboard', 'risk-monitor']);
  });

  it('rejects oversized tool ids', () => {
    expect(() => UserPreferencesSchema.parse({
      ...DEFAULT_USER_PREFERENCES,
      hiddenToolIds: ['x'.repeat(81)],
    })).toThrow();
  });
});
