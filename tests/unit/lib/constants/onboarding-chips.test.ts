import { describe, it, expect } from 'vitest';
import { FALLBACK_CHIPS, getMandateChips, getRedLineChips } from '@/lib/constants/onboarding-chips';
import { ROLES } from '@/types/analyst-profile';

describe('onboarding-chips fallbacks', () => {
  it('exports mandate chips for every role', () => {
    for (const r of ROLES) {
      const chips = getMandateChips(r);
      expect(chips.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('exports redline chips as array of ≥6 items', () => {
    expect(getRedLineChips().length).toBeGreaterThanOrEqual(6);
  });
  it('FALLBACK_CHIPS has orgAutocomplete with ≥12 entries', () => {
    expect(FALLBACK_CHIPS.orgAutocomplete.length).toBeGreaterThanOrEqual(12);
  });
});
