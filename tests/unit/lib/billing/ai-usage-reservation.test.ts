import { describe, expect, it } from 'vitest';
import { decideFundedUsage } from '@/lib/billing/ai-usage-reservation';

describe('funded usage policy', () => {
  const account = { credits: 100 };

  it('resets only a recorded earlier workspace month without refilling the account', () => {
    expect(decideFundedUsage({ account, cost: 10, monthKey: '2026-09', situation: {
      monthlyCreditCap: 20, monthlyCreditsUsed: 20, monthlyCreditMonthKey: '2026-08',
    } })).toEqual({ allowed: true, remainingCredits: 90, situationCreditsUsed: 10 });

    expect(decideFundedUsage({ account: { credits: 0 }, cost: 10, monthKey: '2026-09', situation: {
      monthlyCreditCap: 20, monthlyCreditsUsed: 20, monthlyCreditMonthKey: '2026-08',
    } })).toMatchObject({ allowed: false, reason: 'insufficient' });
  });

  it.each([undefined, '2026-09', '2026-10', '2026-00', '2026-13', 'invalid'])('preserves workspace usage for a legacy, current, future or invalid month (%s)', (monthlyCreditMonthKey) => {
    expect(decideFundedUsage({ account, cost: 10, monthKey: '2026-09', situation: {
      monthlyCreditCap: 20, monthlyCreditsUsed: 20, monthlyCreditMonthKey,
    } })).toMatchObject({ allowed: false, reason: 'situation-cap', remainingCredits: 100 });
  });

  it.each([NaN, Infinity, -1, '20'])('fails closed for malformed workspace caps (%s)', (monthlyCreditCap) => {
    expect(decideFundedUsage({ account, cost: 10, monthKey: '2026-09', situation: {
      monthlyCreditCap, monthlyCreditsUsed: 0,
    } })).toMatchObject({ allowed: false, reason: 'invalid-policy' });
  });

  it.each([NaN, Infinity, -1, '20'])('fails closed for malformed workspace usage counters (%s)', (monthlyCreditsUsed) => {
    expect(decideFundedUsage({ account, cost: 10, monthKey: '2026-09', situation: {
      monthlyCreditCap: 20, monthlyCreditsUsed,
    } })).toMatchObject({ allowed: false, reason: 'invalid-policy' });
  });

  it.each([NaN, Infinity, 0, -1, 1.5])('refuses invalid operation costs (%s)', (cost) => {
    expect(decideFundedUsage({ account, cost, monthKey: '2026-09' }))
      .toMatchObject({ allowed: false, reason: 'invalid-policy' });
  });

  it('tracks uncapped workspace usage and adopts missing legacy counters', () => {
    expect(decideFundedUsage({ account, cost: 10, monthKey: '2026-09', situation: {} }))
      .toEqual({ allowed: true, remainingCredits: 90, situationCreditsUsed: 10 });
  });
});
