/**
 * Read a user's Stripe customer id from Firestore.
 *
 * `users/{uid}.stripeCustomerId` is set by the Stripe checkout webhook
 * (`src/app/api/stripe/webhook/route.ts`) once a paid plan is activated.
 * Free users return null — meters then no-op for that user.
 *
 * Never throws — failures return null so a missing customer id never
 * blocks a tool route.
 */

import { adminDb } from '@/lib/firebase/admin';

export async function getStripeCustomerIdForUid(uid: string): Promise<string | null> {
  if (!adminDb) return null;
  try {
    const snap = await adminDb.collection('users').doc(uid).get();
    if (!snap.exists) return null;
    const id = snap.data()?.stripeCustomerId;
    return typeof id === 'string' && id.startsWith('cus_') ? id : null;
  } catch {
    return null;
  }
}
