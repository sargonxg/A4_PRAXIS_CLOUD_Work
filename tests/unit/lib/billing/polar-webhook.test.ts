import { describe, expect, it } from 'vitest';
import {
  polarPlanForProductId,
  polarSubscriptionPatchFromEvent,
  polarWebhookIdFromHeaders,
} from '@/lib/billing/polar-webhook';

const baseSubscription = {
  id: 'sub_123',
  status: 'active',
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
});
