import { describe, expect, it } from 'vitest';
import { buildTrustState } from '@/lib/trust/trust-state';

describe('buildTrustState', () => {
  it('exposes model, source library, limits, and eval placeholders', () => {
    const trust = buildTrustState();
    expect(trust.activeModel).toBeTruthy();
    expect(trust.sourceDomains.length).toBeGreaterThanOrEqual(18);
    expect(trust.evaluation).toHaveLength(5);
    expect(trust.limits).toContain('Does not imply classified access: Syria is a public-source case file.');
  });
});
