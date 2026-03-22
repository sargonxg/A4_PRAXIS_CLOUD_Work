import { cookies } from 'next/headers';
import { deductCredits, AI_CREDIT_COSTS } from '@/lib/firebase/firestore';

/**
 * Extracts the user UID from the session cookie.
 * Returns null if no session or demo mode.
 */
async function getSessionUid(): Promise<{ uid: string; isDemo: boolean } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('tacitus-auth-session');
  if (!session?.value) return null;

  try {
    const data = JSON.parse(session.value);
    if (data.demo) return { uid: 'demo-user-001', isDemo: true };
    if (data.token) {
      const payload = JSON.parse(
        Buffer.from(data.token.split('.')[1], 'base64').toString()
      );
      return { uid: payload.user_id || payload.sub || '', isDemo: false };
    }
  } catch {
    // invalid session
  }
  return null;
}

/**
 * Checks and deducts credits for an AI operation.
 * Demo users always pass. Live users must have sufficient credits.
 *
 * Returns { allowed: true } if the user can proceed,
 * or { allowed: false, response: Response } with a 402 error.
 */
export async function checkAndDeductCredits(
  operationType: string,
  description: string,
): Promise<{ allowed: true } | { allowed: false; response: Response }> {
  const session = await getSessionUid();

  // No session — let the route's own auth handling deal with it
  if (!session) return { allowed: true };

  // Demo users are unlimited
  if (session.isDemo) return { allowed: true };

  // Deduct credits for live users
  const cost = AI_CREDIT_COSTS[operationType] || 1;
  try {
    const result = await deductCredits(session.uid, operationType, description);

    if (!result.success) {
      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            error: 'Insufficient TACITUS Credits',
            creditsRequired: cost,
            creditsRemaining: result.remainingCredits,
            message: `This operation requires ${cost} credit(s). You have ${result.remainingCredits} remaining.`,
          }),
          {
            status: 402,
            headers: { 'Content-Type': 'application/json' },
          }
        ),
      };
    }

    return { allowed: true };
  } catch (err) {
    // If Firestore is unavailable, allow the request to proceed
    console.error('[credits] Failed to check credits:', err);
    return { allowed: true };
  }
}

/**
 * Refunds credits to a user after a failed AI operation.
 */
export async function refundCredits(
  operationType: string,
  description: string,
): Promise<void> {
  const session = await getSessionUid();
  if (!session || session.isDemo) return;

  const cost = AI_CREDIT_COSTS[operationType] || 1;
  try {
    const { increment, doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase/config');

    const userRef = doc(db, 'users', session.uid);
    await updateDoc(userRef, {
      credits: increment(cost),
      totalCreditsUsed: increment(-cost),
    });

    // Record refund transaction
    const { collection, setDoc, serverTimestamp } = await import('firebase/firestore');
    const txRef = doc(collection(db, 'credit_transactions'));
    await setDoc(txRef, {
      userId: session.uid,
      amount: cost,
      type: 'refund',
      description: `Refund: ${description}`,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('[credits] Failed to refund credits:', err);
  }
}
