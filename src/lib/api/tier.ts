/**
 * Subscription tier resolution + gating helpers.
 *
 * Source of truth: `users/{uid}.subscription` (set by Stripe webhook + onboarding).
 * Non-paying users default to 'free'. Demo users always pass `requireTier`.
 *
 * Tier ordering (low → high): free < analyst < team < enterprise.
 * Re-exports the client-side SubscriptionTier so the two halves stay aligned.
 */

import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import type { SubscriptionTier } from '@/lib/firebase/firestore';

export type { SubscriptionTier };

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
 */
export async function resolveTier(uid: string, isDemo: boolean): Promise<SubscriptionTier> {
  if (isDemo) return 'enterprise'; // demo unlimited

  try {
    const db = getAdminDbOrThrow();
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return 'free';
    const sub = (snap.data() as { subscription?: string } | undefined)?.subscription;
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
