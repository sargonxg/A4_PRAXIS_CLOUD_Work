/**
 * Subscription tier resolution + gating helpers.
 *
 * Source of truth: `users/{uid}.subscription` (set by Polar webhook + onboarding).
 * Non-paying users default to 'free'. Demo users always pass `requireTier`.
 *
 * Tier ordering (low → high): free < analyst < team < enterprise.
 * Re-exports the client-side SubscriptionTier so the two halves stay aligned.
 */

import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import type { SubscriptionTier } from '@/lib/firebase/firestore';

export type { SubscriptionTier };

type UserTierDoc = {
  subscription?: string;
  subscriptionProvider?: string;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: unknown;
  fullAccessExpiresAt?: unknown;
};

const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  analyst: 1,
  team: 2,
  enterprise: 3,
};

/**
 * Looks up the user's subscription tier from Firestore.
 * Always returns a value — defaults to 'free' on read errors.
 * Demo users return 'enterprise' so all features unlock.
 *
 * Promo full-access codes are intentionally expiry-aware server-side. The
 * client may briefly show the stored subscription until the next snapshot, but
 * feature gates use this resolver and downgrade expired promos to free.
 */
export async function resolveTier(uid: string, isDemo: boolean): Promise<SubscriptionTier> {
  if (isDemo) return 'enterprise'; // demo unlimited

  try {
    const db = getAdminDbOrThrow();
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return 'free';
    const data = snap.data() as UserTierDoc | undefined;
    const sub = data?.subscription;

    if (data?.subscriptionProvider === 'promo') {
      const expiresAt = parseDateLike(data.fullAccessExpiresAt ?? data.subscriptionExpiresAt);
      if (!expiresAt || expiresAt.getTime() <= Date.now()) return 'free';
    }

    if ((data?.subscriptionStatus === 'canceled' || data?.subscriptionStatus === 'revoked') && data.subscriptionExpiresAt) {
      const expiresAt = parseDateLike(data.subscriptionExpiresAt);
      if (!expiresAt || expiresAt.getTime() <= Date.now()) return 'free';
    }

    if (sub === 'analyst' || sub === 'team' || sub === 'enterprise') return sub as SubscriptionTier;
    return 'free';
  } catch {
    return 'free';
  }
}

/**
 * Pure ordering check — does `current` meet the `min` bar?
 */
export function meetsTier(current: SubscriptionTier, min: SubscriptionTier): boolean {
  return TIER_ORDER[current] >= TIER_ORDER[min];
}

export interface TierGate {
  ok: boolean;
  currentTier: SubscriptionTier;
  requiredTier: SubscriptionTier;
}

/**
 * Helper meant for use inside AI tool execute() handlers.
 * Returns a structured payload the LLM can render as a chip — never throws.
 */
export function gateTier(current: SubscriptionTier, min: SubscriptionTier): TierGate {
  return { ok: meetsTier(current, min), currentTier: current, requiredTier: min };
}

function parseDateLike(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'object') {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') return maybeTimestamp.toDate();
    if (typeof maybeTimestamp.seconds === 'number') return new Date(maybeTimestamp.seconds * 1000);
  }
  return null;
}
