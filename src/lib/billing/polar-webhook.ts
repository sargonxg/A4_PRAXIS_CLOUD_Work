import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { SubscriptionTier } from '@/lib/api/tier';
import { PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE } from '@/lib/billing/usage-policy';

export type PolarBillablePlan = Extract<SubscriptionTier, 'analyst' | 'team'>;
export type PolarSubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | 'revoked' | 'paused' | 'incomplete' | 'incomplete_expired' | 'unpaid';

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
  timestamp?: unknown;
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
  if (!plan) return null; // Customer metadata is never a trusted product map.
  const metadata = objectValue(data.metadata);
  const customer = objectValue(data.customer);
  const uidCandidates = [customer.externalId, customer.external_id, metadata.uid, data.externalCustomerId, data.external_customer_id]
    .filter(value => value !== undefined && value !== null);
  const uid = uidCandidates[0];
  // A signed event must still identify one valid owner. Never choose one
  // conflicting identity or allow an identifier to address a nested document.
  if (typeof uid !== 'string' || !/^[^\s/\\]{1,128}$/.test(uid)
    || uid === '.' || uid === '..' || uidCandidates.some(candidate => candidate !== uid)) return null;

  const cancelAtPeriodEnd = booleanValue(data.cancelAtPeriodEnd ?? data.cancel_at_period_end);
  const eventStatus = statusForEvent(type, stringValue(data.status), cancelAtPeriodEnd);
  const sourceTime = isoDateValue(data.modifiedAt ?? data.modified_at ?? event.timestamp ?? data.createdAt ?? data.created_at);
  if (!eventStatus || !sourceTime || !stringValue(data.id)) return null;
  const revoked = eventStatus === 'revoked';
  const subscription = revoked ? 'free' : plan;
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
    subscriptionExpiresAt: revoked ? sourceTime : currentPeriodEnd,
    subscriptionUpdatedAt: sourceTime,
    creditAllowance: creditAllowanceForPlan(subscriptionPlanId),
    subscriptionMetadata: {
      provider: 'polar',
      eventType: type,
      cancelAtPeriodEnd,
    },
  };
}

export async function applyPolarSubscriptionPatch(db: Firestore, patch: PolarSubscriptionPatch, webhookId: string): Promise<'applied' | 'duplicate' | 'stale' | 'owner_unavailable'> {
  const eventRef = db.collection('polar_webhook_events').doc(webhookId);
  const userRef = db.collection('users').doc(patch.uid);

  return db.runTransaction(async (tx) => {
    const eventSnap = await tx.get(eventRef);
    if (eventSnap.exists) return 'duplicate';
    const userSnap = await tx.get(userRef);
    const account = userSnap.data();
    const recordEvent = (result: string) => tx.set(eventRef, {
      uid: patch.uid,
      provider: 'polar',
      eventType: patch.subscriptionMetadata.eventType,
      receivedAt: FieldValue.serverTimestamp(),
      subscriptionId: patch.polarSubscriptionId,
      status: patch.subscriptionStatus,
      sourceUpdatedAt: patch.subscriptionUpdatedAt,
      result,
    });
    if (!userSnap.exists || account?.accountDeletionStatus === 'deleting' || account?.accountDeletionStatus === 'deleted') {
      recordEvent('owner_unavailable');
      return 'owner_unavailable';
    }
    const replacementActivation = (patch.subscriptionStatus === 'active' || patch.subscriptionStatus === 'trialing')
      && Boolean(patch.polarSubscriptionId) && patch.polarSubscriptionId !== account?.polarSubscriptionId;
    const differentSubscription = Boolean(account?.polarSubscriptionId)
      && account?.polarSubscriptionId !== patch.polarSubscriptionId;
    const differentCustomer = Boolean(account?.polarCustomerId)
      && account?.polarCustomerId !== patch.polarCustomerId;
    // An old subscription can change later than its replacement. Its terminal
    // event must not replace the current entitlement. A new activation may
    // establish a new binding; events for the current ID retain its customer.
    if ((differentSubscription || differentCustomer) && !replacementActivation) {
      recordEvent('stale');
      return 'stale';
    }
    const previousTime = Date.parse(isoDateValue(account?.subscriptionUpdatedAt) ?? '');
    const sourceTime = Date.parse(patch.subscriptionUpdatedAt);
    const terminalReplay = account?.polarSubscriptionId === patch.polarSubscriptionId
      && account?.subscriptionStatus === 'revoked' && patch.subscriptionStatus !== 'revoked';
    const statusRank = (status: unknown) => status === 'revoked' ? 3 : status === 'canceled' ? 2 : status === 'active' || status === 'trialing' ? 0 : 1;
    if (!Number.isFinite(sourceTime) || sourceTime < previousTime || terminalReplay
      || (sourceTime === previousTime && statusRank(patch.subscriptionStatus) < statusRank(account?.subscriptionStatus))) {
      recordEvent('stale');
      return 'stale';
    }
    const currentCredits = typeof account?.credits === 'number' ? account.credits : 0;
    const periodEnd = Date.parse(patch.subscriptionExpiresAt ?? '');
    // Existing Polar accounts without the marker already received their current
    // period allowance. Adopt their stored period rather than refilling it.
    const previousPeriod = isoDateValue(account?.billingAllowancePeriodEnd)
      ?? (account?.subscriptionProvider === 'polar' ? isoDateValue(account?.subscriptionExpiresAt) : null);
    const newPeriod = !previousPeriod || periodEnd > Date.parse(previousPeriod);
    const grant = (patch.subscriptionStatus === 'active' || patch.subscriptionStatus === 'trialing')
      && Number.isFinite(periodEnd) && periodEnd > Date.now() && newPeriod;
    recordEvent('applied');
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
      credits: grant ? Math.max(currentCredits, patch.creditAllowance) : currentCredits,
      ...(grant ? {
        billingAllowancePeriodEnd: patch.subscriptionExpiresAt,
        billingCreditsUpdatedAt: patch.subscriptionUpdatedAt,
      } : {}),
      subscriptionMetadata: patch.subscriptionMetadata,
    }, { merge: true });
    return 'applied';
  });
}

function statusForEvent(type: string, rawStatus: string, cancelAtPeriodEnd?: boolean): PolarSubscriptionStatus | null {
  if (type === 'subscription.revoked') return 'revoked';
  if (rawStatus === 'canceled') return cancelAtPeriodEnd === true ? 'canceled' : 'revoked';
  if (type === 'subscription.canceled' || cancelAtPeriodEnd === true) return 'canceled';
  if (type === 'subscription.past_due') return 'past_due';
  if (rawStatus === 'trialing') return 'trialing';
  if (['active', 'past_due', 'unpaid', 'paused', 'incomplete', 'incomplete_expired'].includes(rawStatus)) return rawStatus as PolarSubscriptionStatus;
  return null;
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
