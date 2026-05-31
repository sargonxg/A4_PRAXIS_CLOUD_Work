import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { SubscriptionTier } from '@/lib/api/tier';
import { PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE } from '@/lib/billing/usage-policy';

export type PolarBillablePlan = Extract<SubscriptionTier, 'analyst' | 'team'>;
export type PolarSubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | 'revoked';

export type PolarProductIds = {
  analyst?: string | null;
  team?: string | null;
};

export type PolarSubscriptionPatch = {
  uid: string;
  subscription: SubscriptionTier;
  subscriptionProvider: 'polar';
  subscriptionStatus: PolarSubscriptionStatus;
  subscriptionPlanId: PolarBillablePlan | 'free';
  polarCustomerId: string | null;
  polarExternalCustomerId: string;
  polarSubscriptionId: string | null;
  polarProductId: string | null;
  subscriptionExpiresAt: string | null;
  subscriptionUpdatedAt: string;
  creditAllowance: number;
  subscriptionMetadata: {
    provider: 'polar';
    eventType: string;
    cancelAtPeriodEnd?: boolean;
  };
};

type PolarEventLike = {
  type?: string;
  data?: Record<string, unknown>;
};

export function polarProductIdsFromEnv(env: NodeJS.ProcessEnv = process.env): PolarProductIds {
  return {
    analyst: env.POLAR_PRODUCT_ANALYST ?? null,
    team: env.POLAR_PRODUCT_TEAM ?? null,
  };
}

export function polarPlanForProductId(productId: string | null | undefined, products: PolarProductIds = polarProductIdsFromEnv()): PolarBillablePlan | null {
  if (productId && products.analyst && productId === products.analyst) return 'analyst';
  if (productId && products.team && productId === products.team) return 'team';
  return null;
}

export function polarWebhookIdFromHeaders(headers: Record<string, string | undefined>): string | null {
  return headers['webhook-id'] ?? headers['svix-id'] ?? headers['Webhook-Id'] ?? headers['Svix-Id'] ?? null;
}

export function polarSubscriptionPatchFromEvent(event: PolarEventLike, products: PolarProductIds = polarProductIdsFromEnv()): PolarSubscriptionPatch | null {
  const type = typeof event.type === 'string' ? event.type : '';
  if (!type.startsWith('subscription.')) return null;

  const data = event.data ?? {};
  const productId = stringValue(data.productId ?? data.product_id);
  const plan = polarPlanForProductId(productId, products);
  const metadata = objectValue(data.metadata);
  const customer = objectValue(data.customer);
  const uid = stringValue(customer.externalId ?? customer.external_id ?? metadata.uid ?? data.externalCustomerId ?? data.external_customer_id);
  if (!uid) return null;

  const eventStatus = statusForEvent(type, stringValue(data.status));
  const revoked = eventStatus === 'revoked';
  const subscription = revoked ? 'free' : plan ?? planFromMetadata(metadata.plan) ?? 'free';
  const subscriptionPlanId = subscription === 'analyst' || subscription === 'team' ? subscription : 'free';
  const currentPeriodEnd = isoDateValue(data.currentPeriodEnd ?? data.current_period_end);
  const customerId = stringValue(data.customerId ?? data.customer_id ?? customer.id);

  return {
    uid,
    subscription,
    subscriptionProvider: 'polar',
    subscriptionStatus: eventStatus,
    subscriptionPlanId,
    polarCustomerId: customerId || null,
    polarExternalCustomerId: uid,
    polarSubscriptionId: stringValue(data.id) || null,
    polarProductId: productId || null,
    subscriptionExpiresAt: revoked ? new Date().toISOString() : currentPeriodEnd,
    subscriptionUpdatedAt: new Date().toISOString(),
    creditAllowance: creditAllowanceForPlan(subscriptionPlanId),
    subscriptionMetadata: {
      provider: 'polar',
      eventType: type,
      cancelAtPeriodEnd: booleanValue(data.cancelAtPeriodEnd ?? data.cancel_at_period_end),
    },
  };
}

export async function applyPolarSubscriptionPatch(db: Firestore, patch: PolarSubscriptionPatch, webhookId: string): Promise<'applied' | 'duplicate'> {
  const eventRef = db.collection('polar_webhook_events').doc(webhookId);
  const userRef = db.collection('users').doc(patch.uid);

  return db.runTransaction(async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (eventSnap.exists) return 'duplicate';
    const userSnap = await tx.get(userRef);
    const currentCredits = typeof userSnap.data()?.credits === 'number'
      ? userSnap.data()!.credits as number
      : 0;
    const nextCredits = Math.max(currentCredits, patch.creditAllowance);

    tx.set(eventRef, {
      uid: patch.uid,
      provider: 'polar',
      eventType: patch.subscriptionMetadata.eventType,
      receivedAt: FieldValue.serverTimestamp(),
      subscriptionId: patch.polarSubscriptionId,
      status: patch.subscriptionStatus,
    });
    tx.set(userRef, {
      subscription: patch.subscription,
      subscriptionProvider: patch.subscriptionProvider,
      subscriptionStatus: patch.subscriptionStatus,
      subscriptionPlanId: patch.subscriptionPlanId,
      subscriptionExpiresAt: patch.subscriptionExpiresAt,
      subscriptionUpdatedAt: patch.subscriptionUpdatedAt,
      polarCustomerId: patch.polarCustomerId,
      polarExternalCustomerId: patch.polarExternalCustomerId,
      polarSubscriptionId: patch.polarSubscriptionId,
      polarProductId: patch.polarProductId,
      creditAllowance: patch.creditAllowance,
      credits: nextCredits,
      billingCreditsUpdatedAt: patch.subscriptionUpdatedAt,
      subscriptionMetadata: patch.subscriptionMetadata,
    }, { merge: true });
    return 'applied';
  });
}

function statusForEvent(type: string, rawStatus: string): PolarSubscriptionStatus {
  if (type === 'subscription.revoked') return 'revoked';
  if (type === 'subscription.canceled') return 'canceled';
  if (type === 'subscription.past_due') return 'past_due';
  if (rawStatus === 'trialing') return 'trialing';
  if (rawStatus === 'past_due' || rawStatus === 'unpaid') return 'past_due';
  if (rawStatus === 'canceled') return 'canceled';
  return 'active';
}

function planFromMetadata(value: unknown): PolarBillablePlan | null {
  return value === 'analyst' || value === 'team' ? value : null;
}

function creditAllowanceForPlan(plan: PolarBillablePlan | 'free'): number {
  if (plan === 'team') return 1_000_000;
  if (plan === 'analyst') return 250_000;
  return PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function isoDateValue(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
