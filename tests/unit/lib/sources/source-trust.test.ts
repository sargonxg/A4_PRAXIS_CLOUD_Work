import { describe, expect, it } from 'vitest';
import {
  formatSourceFreshness,
  resolveSourceTier,
  sortSourcesByTierThenRecency,
} from '@/lib/sources/source-trust';

describe('source trust tiers', () => {
  it('resolves explicit tiers without inferring unknown source quality', () => {
    expect(resolveSourceTier({ reliabilityTier: 1 })).toBe(1);
    expect(resolveSourceTier({ reliabilityTier: '2' })).toBe(2);
    expect(resolveSourceTier({ reliabilityTier: 3 })).toBe(3);
    expect(resolveSourceTier({ sourceType: 'official', confidence: 0.99 })).toBeNull();
    expect(resolveSourceTier({ reliabilityTier: 4 })).toBeNull();
    expect(resolveSourceTier(null)).toBeNull();
  });

  it('sorts by tier first, then recency, then stable input order', () => {
    const sorted = sortSourcesByTierThenRecency([
      { id: 'unrated-fresh', date: '2026-06-10' },
      { id: 't2-old', reliabilityTier: 2, date: '2026-05-01' },
      { id: 't1-old', reliabilityTier: 1, date: '2026-01-01' },
      { id: 't1-new', reliabilityTier: 1, date: '2026-06-01' },
      { id: 't3-new', reliabilityTier: 3, date: '2026-06-09' },
      { id: 'unrated-old', date: '2026-01-01' },
    ]);

    expect(sorted.map((item) => item.id)).toEqual([
      't1-new',
      't1-old',
      't2-old',
      't3-new',
      'unrated-fresh',
      'unrated-old',
    ]);
  });

  it('formats source date freshness honestly for missing and stale dates', () => {
    const now = new Date('2026-06-11T12:00:00.000Z');

    expect(formatSourceFreshness({ date: '2026-06-01' }, now)).toBe('2026-06-01 10d old');
    expect(formatSourceFreshness({ date: null }, now)).toBe('undated');
    expect(formatSourceFreshness({ date: null, stale: true }, now)).toBe('stale, undated');
    expect(formatSourceFreshness({ date: '2026-06-01', stale: true }, now)).toBe('stale 2026-06-01');
  });
});
