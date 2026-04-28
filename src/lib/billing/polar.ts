import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import type { SubscriptionTier } from '@/lib/firebase/firestore';

export const POLAR_ORGANIZATION_ID = '1a123382-417b-43b4-b382-8bb10788393d';
export const POLAR_ORGANIZATION_SLUG = 'tacitus';

export type PaidPolarTier = Exclude<SubscriptionTier, 'free'>;

export const POLAR_PRODUCT_ENV: Record<PaidPolarTier, string> = {
  analyst: 'POLAR_PRODUCT_ANALYST',
  team: 'POLAR_PRODUCT_TEAM',
  enterprise: 'POLAR_PRODUCT_ENTERPRISE',
};

export const POLAR_CREDIT_GRANTS: Record<PaidPolarTier, number> = {
  analyst: 5000,
  team: 25000,
  enterprise: 100000,
};

export function getPolarServer(): 'sandbox' | 'production' {
  return process.env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production';
}

export function getPolarProductId(tier: string): string | null {
  if (tier !== 'analyst' && tier !== 'team' && tier !== 'enterprise') return null;
  return process.env[POLAR_PRODUCT_ENV[tier]] || null;
}

export function tierFromPolarProduct(productId?: string | null): PaidPolarTier | null {
  if (!productId) return null;
  for (const tier of Object.keys(POLAR_PRODUCT_ENV) as PaidPolarTier[]) {
    if (process.env[POLAR_PRODUCT_ENV[tier]] === productId) return tier;
  }
  return null;
}

export function tierFromMetadata(metadata?: Record<string, unknown> | null): PaidPolarTier | null {
  const tier = metadata?.tierId ?? metadata?.tier;
  return tier === 'analyst' || tier === 'team' || tier === 'enterprise' ? tier : null;
}

export async function getPolarCustomerIdForUid(uid: string): Promise<string | null> {
  try {
    const db = getAdminDbOrThrow();
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return null;
    const id = snap.data()?.polarCustomerId;
    return typeof id === 'string' && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}
export async function applyPolarSubscription(input: {
  uid: string;
  tier: PaidPolarTier;
  polarCustomerId?: string | null;
  polarSubscriptionId?: string | null;
  polarProductId?: string | null;
  status?: string | null;
  trialEndsAt?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
  eventId?: string | null;
  checkoutId?: string | null;
  grantCredits?: boolean;
}) {
  const db = getAdminDbOrThrow();
  const credits = input.grantCredits === false ? 0 : POLAR_CREDIT_GRANTS[input.tier];
  const now = new Date().toISOString();
  const userRef = db.collection('users').doc(input.uid);

  const updatePayload: Record<string, unknown> = {
    subscription: input.tier,
    subscriptionProvider: 'polar',
    subscriptionStatus: input.status ?? 'active',
    subscriptionUpdatedAt: now,
    polarProductId: input.polarProductId ?? null,
    polarSubscriptionId: input.polarSubscriptionId ?? null,
    polarCustomerId: input.polarCustomerId ?? null,
    polarTrialEndsAt: input.trialEndsAt
      ? new Date(input.trialEndsAt).toISOString()
      : null,
    subscriptionExpiresAt: input.currentPeriodEnd
      ? new Date(input.currentPeriodEnd).toISOString()
      : null,
  };

  if (credits > 0) {
    updatePayload.credits = FieldValue.increment(credits);
  }

  await userRef.set(updatePayload, { merge: true });

  await db.collection('credit_transactions').add({
    userId: input.uid,
    amount: credits,
    type: 'subscription',
    description: `${input.tier} plan activated via Polar`,
    provider: 'polar',
    polarEventId: input.eventId ?? null,
    polarCheckoutId: input.checkoutId ?? null,
    polarSubscriptionId: input.polarSubscriptionId ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function downgradePolarCustomer(input: {
  polarCustomerId: string;
  eventId?: string | null;
}) {
  const db = getAdminDbOrThrow();
  const users = await db.collection('users').where('polarCustomerId', '==', input.polarCustomerId).get();
  for (const userDoc of users.docs) {
    await userDoc.ref.set({
      subscription: 'free',
      subscriptionStatus: 'canceled',
      subscriptionUpdatedAt: new Date().toISOString(),
      subscriptionProvider: 'polar',
    }, { merge: true });

    await db.collection('credit_transactions').add({
      userId: userDoc.id,
      amount: 0,
      type: 'subscription',
      description: 'Downgraded to free tier after Polar subscription ended',
      provider: 'polar',
      polarEventId: input.eventId ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}
