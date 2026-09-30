import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/firebase/admin', () => ({ getAdminDbOrThrow: vi.fn() }));
import { tierFromAccount } from '@/lib/api/tier';

describe('expiry-aware account tier', () => {
  const now = Date.parse('2026-09-30T12:00:00Z');
  const paid = { subscription: 'analyst', subscriptionProvider: 'polar', subscriptionStatus: 'active', subscriptionExpiresAt: '2026-10-30T12:00:00Z' };
  it.each(['revoked', 'past_due', 'unpaid', 'paused', 'incomplete', 'unknown'])('rejects %s billing status regardless of future expiry', (status) => {
    expect(tierFromAccount({ ...paid, subscriptionStatus: status }, now)).toBe('free');
  });
  it('rejects canceled without valid period and active expired billing', () => {
    expect(tierFromAccount({ ...paid, subscriptionStatus: 'canceled', subscriptionExpiresAt: null }, now)).toBe('free');
    expect(tierFromAccount({ ...paid, subscriptionExpiresAt: '2026-09-30T00:00:00Z' }, now)).toBe('free');
    expect(tierFromAccount({ ...paid, subscriptionExpiresAt: null }, now)).toBe('free');
  });
  it('honors scheduled cancellation until its paid period ends', () => {
    expect(tierFromAccount({ ...paid, subscriptionStatus: 'canceled' }, now)).toBe('analyst');
  });
  it('preserves institutional/manual grants and expiry-aware promos', () => {
    expect(tierFromAccount({ subscription: 'enterprise', subscriptionProvider: 'manual' }, now)).toBe('enterprise');
    expect(tierFromAccount({ subscription: 'enterprise', subscriptionProvider: 'promo', fullAccessExpiresAt: '2026-10-01T00:00:00Z' }, now)).toBe('enterprise');
    expect(tierFromAccount({ subscription: 'enterprise', subscriptionProvider: 'promo', fullAccessExpiresAt: '2026-09-01T00:00:00Z' }, now)).toBe('free');
  });
  it('downgrades accounts pending erasure', () => {
    expect(tierFromAccount({ ...paid, accountDeletionStatus: 'deleting' }, now)).toBe('free');
  });
});
