import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Firestore } from 'firebase-admin/firestore';
import {
  polarPlanForProductId,
  polarSubscriptionPatchFromEvent,
  polarWebhookIdFromHeaders,
  applyPolarSubscriptionPatch,
} from '@/lib/billing/polar-webhook';

const baseSubscription = {
  id: 'sub_123',
  status: 'active',
  modifiedAt: new Date('2026-05-18T12:00:00Z'),
  customerId: 'cus_123',
  productId: 'prod_analyst',
  currentPeriodEnd: new Date('2026-06-18T12:00:00Z'),
  cancelAtPeriodEnd: false,
  customer: {
    id: 'cus_123',
    externalId: 'uid_123',
  },
  metadata: {
    uid: 'uid_123',
    plan: 'analyst',
  },
};

describe('Polar webhook subscription mapping', () => {
  it('maps configured product IDs to PRAXIS workspace plans', () => {
    expect(polarPlanForProductId('prod_analyst', { analyst: 'prod_analyst', team: 'prod_team' })).toBe('analyst');
    expect(polarPlanForProductId('prod_team', { analyst: 'prod_analyst', team: 'prod_team' })).toBe('team');
    expect(polarPlanForProductId('prod_other', { analyst: 'prod_analyst', team: 'prod_team' })).toBeNull();
  });

  it('builds a subscription patch from active subscription events', () => {
    const patch = polarSubscriptionPatchFromEvent(
      { type: 'subscription.active', data: baseSubscription },
      { analyst: 'prod_analyst', team: 'prod_team' },
    );

    expect(patch).toMatchObject({
      uid: 'uid_123',
      subscription: 'analyst',
      subscriptionProvider: 'polar',
      subscriptionStatus: 'active',
      polarCustomerId: 'cus_123',
      polarSubscriptionId: 'sub_123',
      polarProductId: 'prod_analyst',
      subscriptionExpiresAt: '2026-06-18T12:00:00.000Z',
    });
  });

  it('keeps canceled subscriptions on their plan until the paid period ends', () => {
    const patch = polarSubscriptionPatchFromEvent(
      { type: 'subscription.canceled', data: { ...baseSubscription, status: 'canceled', cancelAtPeriodEnd: true } },
      { analyst: 'prod_analyst', team: 'prod_team' },
    );

    expect(patch?.subscription).toBe('analyst');
    expect(patch?.subscriptionStatus).toBe('canceled');
  });

  it('downgrades revoked subscriptions immediately', () => {
    const patch = polarSubscriptionPatchFromEvent(
      { type: 'subscription.revoked', data: { ...baseSubscription, status: 'canceled' } },
      { analyst: 'prod_analyst', team: 'prod_team' },
    );

    expect(patch?.subscription).toBe('free');
    expect(patch?.subscriptionStatus).toBe('revoked');
  });

  it('extracts the webhook id used for idempotency', () => {
    expect(polarWebhookIdFromHeaders({ 'webhook-id': 'wh_123' })).toBe('wh_123');
    expect(polarWebhookIdFromHeaders({ 'svix-id': 'svix_123' })).toBe('svix_123');
    expect(polarWebhookIdFromHeaders({})).toBeNull();
  });

  it('ignores unconfigured products even when metadata claims a paid plan', () => {
    expect(polarSubscriptionPatchFromEvent({ type: 'subscription.active', data: { ...baseSubscription, productId: 'untrusted', metadata: { plan: 'team', uid: 'uid_123' } } }, { analyst: 'prod_analyst' })).toBeNull();
  });
  it('ignores unknown status and events without source timestamps', () => {
    expect(polarSubscriptionPatchFromEvent({ type: 'subscription.updated', data: { ...baseSubscription, status: 'unknown' } }, { analyst: 'prod_analyst' })).toBeNull();
    expect(polarSubscriptionPatchFromEvent({ type: 'subscription.active', data: { ...baseSubscription, modifiedAt: undefined } }, { analyst: 'prod_analyst' })).toBeNull();
  });
  it('treats the catch-all canceled state as revoked when cancellation is immediate', () => {
    expect(polarSubscriptionPatchFromEvent({ type: 'subscription.updated', data: { ...baseSubscription, status: 'canceled', cancelAtPeriodEnd: false } }, { analyst: 'prod_analyst' })?.subscriptionStatus).toBe('revoked');
  });
  it.each([
    { metadata: { uid: 'uid_other' } },
    { externalCustomerId: 'uid_other' },
    { external_customer_id: 'uid_other' },
    { customer: { ...baseSubscription.customer, external_id: 'uid_other' } },
  ])('rejects conflicting provided UID bindings', (conflict) => {
    expect(polarSubscriptionPatchFromEvent({ type: 'subscription.active', data: { ...baseSubscription, ...conflict } }, { analyst: 'prod_analyst' })).toBeNull();
  });
  it.each(['nested/profile/target', 'back\\slash', '.', '..', 'x'.repeat(129), ' leading-space', '', 42])('rejects malformed UID bindings', (uid) => {
    expect(polarSubscriptionPatchFromEvent({
      type: 'subscription.active',
      data: { ...baseSubscription, customer: { id: 'cus_123', externalId: uid }, metadata: { uid } },
    }, { analyst: 'prod_analyst' })).toBeNull();
  });
  it('accepts agreeing UID aliases and legacy metadata-only identity', () => {
    const agreeing = polarSubscriptionPatchFromEvent({
      type: 'subscription.active',
      data: { ...baseSubscription, customer: { ...baseSubscription.customer, external_id: 'uid_123' }, externalCustomerId: 'uid_123', external_customer_id: 'uid_123' },
    }, { analyst: 'prod_analyst' });
    expect(agreeing?.uid).toBe('uid_123');
    expect(polarSubscriptionPatchFromEvent({
      type: 'subscription.active', data: { ...baseSubscription, customer: { id: 'cus_123', externalId: null } },
    }, { analyst: 'prod_analyst' })?.uid).toBe('uid_123');
  });
  it.each(['custom.uid:123', 'x'.repeat(128)])('accepts a valid custom UID within the Firebase length bound', (uid) => {
    expect(polarSubscriptionPatchFromEvent({
      type: 'subscription.active', data: { ...baseSubscription, customer: { id: 'cus_123', externalId: uid }, metadata: { uid } },
    }, { analyst: 'prod_analyst' })?.uid).toBe(uid);
  });
});

function fixtureDb(initial: Record<string, unknown> | null) {
  let account = initial;
  const events = new Map<string, Record<string, unknown>>();
  const writes = vi.fn();
  const db = {
    collection: (collection: string) => ({ doc: (id: string) => ({ collection, id }) }),
    runTransaction: async (run: (tx: unknown) => unknown) => run({
      get: async (ref: { collection: string; id: string }) => {
        const value = ref.collection === 'users' ? account : events.get(ref.id);
        return { exists: Boolean(value), data: () => value };
      },
      set: (ref: { collection: string; id: string }, value: Record<string, unknown>) => {
        writes(ref, value);
        if (ref.collection === 'users') account = { ...account, ...value };
        else events.set(ref.id, value);
      },
    }),
  } as unknown as Firestore;
  return { db, account: () => account, writes };
}

describe('Polar subscription application', () => {
  // Keep the active-period fixtures active regardless of the day CI runs.
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-02T00:00:00Z'));
  });
  afterEach(() => vi.restoreAllMocks());
  const patch = () => polarSubscriptionPatchFromEvent({ type: 'subscription.active', data: { ...baseSubscription, modifiedAt: '2026-09-30T12:00:00Z', currentPeriodEnd: '2026-10-30T12:00:00Z' } }, { analyst: 'prod_analyst' })!;
  it('does not refill spent credits on distinct deliveries from the same period', async () => {
    const fixture = fixtureDb({ credits: 8, subscriptionProvider: 'polar', billingAllowancePeriodEnd: '2026-10-30T12:00:00.000Z' });
    await applyPolarSubscriptionPatch(fixture.db, patch(), 'event-1');
    await applyPolarSubscriptionPatch(fixture.db, patch(), 'event-2');
    expect(fixture.account()?.credits).toBe(8);
  });
  it('grants a new allowance once for a new period, then preserves spent balance', async () => {
    const fixture = fixtureDb({ credits: 8, billingAllowancePeriodEnd: '2026-09-30T12:00:00.000Z' });
    expect(await applyPolarSubscriptionPatch(fixture.db, patch(), 'event-1')).toBe('applied');
    expect(fixture.account()?.credits).toBe(250_000);
    expect(await applyPolarSubscriptionPatch(fixture.db, patch(), 'event-1')).toBe('duplicate');
  });
  it('ignores out-of-order activation and terminal-subscription reactivation', async () => {
    const fixture = fixtureDb({ credits: 8, subscription: 'free', subscriptionStatus: 'revoked', polarSubscriptionId: 'sub_123', subscriptionUpdatedAt: '2026-10-01T00:00:00Z' });
    expect(await applyPolarSubscriptionPatch(fixture.db, patch(), 'old-event')).toBe('stale');
    const later = { ...patch(), subscriptionUpdatedAt: '2026-10-02T00:00:00Z' };
    expect(await applyPolarSubscriptionPatch(fixture.db, later, 'replayed-event')).toBe('stale');
    expect(fixture.account()?.subscription).toBe('free');
  });
  it.each(['revoked', 'canceled', 'past_due'] as const)('ignores a later %s event from a superseded subscription', async (status) => {
    const fixture = fixtureDb({
      credits: 73, subscription: 'team', subscriptionStatus: 'active',
      polarSubscriptionId: 'sub_current', polarCustomerId: 'cus_current',
      subscriptionUpdatedAt: '2026-09-30T12:00:00Z',
      billingAllowancePeriodEnd: '2026-10-30T12:00:00Z',
    });
    const oldSubscription = polarSubscriptionPatchFromEvent({
      type: `subscription.${status}`,
      data: {
        ...baseSubscription, id: 'sub_old', customerId: 'cus_current',
        customer: { id: 'cus_current', externalId: 'uid_123' },
        status, cancelAtPeriodEnd: status === 'canceled',
        modifiedAt: '2026-10-01T12:00:00Z', currentPeriodEnd: '2026-10-30T12:00:00Z',
      },
    }, { analyst: 'prod_analyst' })!;

    expect(await applyPolarSubscriptionPatch(fixture.db, oldSubscription, `superseded-${status}`)).toBe('stale');
    expect(fixture.account()).toMatchObject({
      credits: 73, subscription: 'team', subscriptionStatus: 'active',
      polarSubscriptionId: 'sub_current', polarCustomerId: 'cus_current',
      subscriptionUpdatedAt: '2026-09-30T12:00:00Z',
    });
    expect(fixture.writes.mock.calls.filter(([ref]) => ref.collection === 'users')).toHaveLength(0);
  });
  it.each(['active', 'revoked'] as const)('rejects a current-subscription %s event with a different customer binding', async (status) => {
    const fixture = fixtureDb({
      credits: 73, subscription: 'analyst', subscriptionStatus: 'active',
      polarSubscriptionId: 'sub_123', polarCustomerId: 'cus_current',
      subscriptionUpdatedAt: '2026-09-30T12:00:00Z',
    });
    const mismatchedCustomer = polarSubscriptionPatchFromEvent({
      type: `subscription.${status}`, data: { ...baseSubscription, status, modifiedAt: '2026-10-01T12:00:00Z' },
    }, { analyst: 'prod_analyst' })!;
    expect(await applyPolarSubscriptionPatch(fixture.db, mismatchedCustomer, 'wrong-customer')).toBe('stale');
    expect(fixture.account()).toMatchObject({ subscription: 'analyst', polarCustomerId: 'cus_current', credits: 73 });
    expect(fixture.writes.mock.calls.filter(([ref]) => ref.collection === 'users')).toHaveLength(0);
  });
  it.each(['canceled', 'revoked'] as const)('applies the legitimate current subscription %s event', async (status) => {
    const fixture = fixtureDb({
      credits: 73, subscription: 'analyst', subscriptionStatus: 'active',
      polarSubscriptionId: 'sub_123', polarCustomerId: 'cus_123',
      subscriptionUpdatedAt: '2026-09-30T12:00:00Z',
      billingAllowancePeriodEnd: '2026-10-30T12:00:00Z',
    });
    const currentTerminal = polarSubscriptionPatchFromEvent({
      type: `subscription.${status}`,
      data: { ...baseSubscription, status, cancelAtPeriodEnd: status === 'canceled', modifiedAt: '2026-10-01T12:00:00Z', currentPeriodEnd: '2026-10-30T12:00:00Z' },
    }, { analyst: 'prod_analyst' })!;
    expect(await applyPolarSubscriptionPatch(fixture.db, currentTerminal, `current-${status}`)).toBe('applied');
    expect(fixture.account()).toMatchObject({
      credits: 73, subscription: status === 'revoked' ? 'free' : 'analyst', subscriptionStatus: status,
      polarSubscriptionId: 'sub_123', polarCustomerId: 'cus_123',
    });
  });
  it.each(['active', 'revoked'] as const)('allows a legitimate new activation to replace an %s binding and grant a new period once', async (previousStatus) => {
    const fixture = fixtureDb({
      credits: 73, subscription: previousStatus === 'active' ? 'analyst' : 'free', subscriptionStatus: previousStatus,
      polarSubscriptionId: 'sub_previous', polarCustomerId: 'cus_previous',
      subscriptionUpdatedAt: '2026-09-29T12:00:00Z',
      billingAllowancePeriodEnd: '2026-09-30T12:00:00Z',
    });
    const replacement = { ...patch(), polarSubscriptionId: 'sub_replacement' };
    expect(await applyPolarSubscriptionPatch(fixture.db, replacement, 'new-subscription')).toBe('applied');
    expect(fixture.account()).toMatchObject({
      credits: 250_000, subscription: 'analyst', subscriptionStatus: 'active',
      polarSubscriptionId: 'sub_replacement', polarCustomerId: 'cus_123',
    });
    fixture.account()!.credits = 73; // Work consumes the granted allowance.
    expect(await applyPolarSubscriptionPatch(fixture.db, replacement, 'new-subscription')).toBe('duplicate');
    expect(await applyPolarSubscriptionPatch(fixture.db, replacement, 'new-subscription-redelivery')).toBe('applied');
    expect(fixture.account()?.credits).toBe(73);
  });
  it.each([null, { accountDeletionStatus: 'deleting' }, { accountDeletionStatus: 'deleted' }])('does not recreate or upgrade missing/deleting owners', async (account) => {
    const fixture = fixtureDb(account);
    expect(await applyPolarSubscriptionPatch(fixture.db, patch(), 'event')).toBe('owner_unavailable');
    expect(fixture.writes.mock.calls.filter(([ref]) => ref.collection === 'users')).toHaveLength(0);
  });
});
