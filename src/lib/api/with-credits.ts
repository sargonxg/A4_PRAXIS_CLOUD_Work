import { cookies } from 'next/headers';
import { verifyIdToken, getAdminDbOrThrow } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// Cost table for AI operations (in credits) — server-side authoritative copy
export const AI_CREDIT_COSTS: Record<string, number> = {
  'ai_chat': 1,
  'ai_terminology': 1,
  'ai_scenario': 2,
  'ai_extract': 2,
  'ai_media': 2,
  'ai_talking_points': 2,
  'ai_grounded_search': 2,
  'ai_advisor_chat': 2,
  'ai_advisor_deep': 5,
  'ai_analysis': 3,
  'ai_research': 3,
  'ai_resolution': 3,
  'ai_claude_analyze': 4,
  'ai_dossier': 4,
  'ai_report': 5,
  'ai_deep_research': 5,
  'ai_web_crawl': 3,
  'ai_media_scan': 3,
  'ai_actor_enrichment': 3,
  'ai_escalation_scan': 3,
  'ai_sanctions_scan': 4,
  'ai_dossier_generate': 5,
  'ai_briefing_generate': 4,
  'ai_morning_digest': 2,
  'ai_mediation': 3,
  'ai_risk_assessment': 4,
  'ai_treaty_analyze': 4,
  'ai_negotiation': 3,
  'ai_argus': 3,
  'ai_actor_brief': 3,
};

/**
 * Extracts the user UID from the session cookie.
 * Uses Firebase Admin SDK to verify token cryptographically.
 * Returns null if no session or invalid token.
 */
async function getSessionUid(): Promise<{ uid: string; isDemo: boolean } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('tacitus-auth-session');
  if (!session?.value) return null;

  try {
    const data = JSON.parse(session.value);
    if (data.demo) return { uid: 'demo-user-001', isDemo: true };
    if (data.token) {
      const verified = await verifyIdToken(data.token);
      if (!verified.uid) return null;
      return { uid: verified.uid, isDemo: false };
    }
  } catch {
    // Token verification failed — reject
  }
  return null;
}

/**
 * Deducts credits using Firebase Admin SDK (bypasses Firestore security rules).
 * Uses a transaction to atomically check + deduct to prevent race conditions.
 */
async function deductCreditsAdmin(
  uid: string,
  operationType: string,
  description: string,
): Promise<{ success: boolean; remainingCredits: number }> {
  const adminDb = getAdminDbOrThrow();
  const cost = AI_CREDIT_COSTS[operationType] || 1;
  const userRef = adminDb.collection('users').doc(uid);

  const result = await adminDb.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);

    if (!userSnap.exists) {
      // No profile yet — create one with initial credits then deduct
      const initial = 100;
      if (initial < cost) return { success: false, remainingCredits: 0 };
      tx.set(userRef, {
        uid,
        credits: initial - cost,
        totalCreditsUsed: cost,
        createdAt: FieldValue.serverTimestamp(),
        lastLoginAt: FieldValue.serverTimestamp(),
        role: 'analyst',
        orgId: 'org-default',
        orgName: 'TACITUS Platform',
        isDemo: false,
        subscription: 'free',
        aiProvider: 'google',
      });
      return { success: true, remainingCredits: initial - cost };
    }

    const data = userSnap.data() as { credits: number };
    const credits = typeof data.credits === 'number' ? data.credits : 0;

    if (credits < cost) {
      return { success: false, remainingCredits: credits };
    }

    tx.update(userRef, {
      credits: FieldValue.increment(-cost),
      totalCreditsUsed: FieldValue.increment(cost),
    });

    return { success: true, remainingCredits: credits - cost };
  });

  // Record transaction log (non-critical, fire-and-forget)
  if (result.success) {
    const txRef = adminDb.collection('credit_transactions').doc();
    txRef.set({
      userId: uid,
      amount: -cost,
      type: operationType,
      description,
      createdAt: FieldValue.serverTimestamp(),
    }).catch((err) => console.error('[credits] Failed to record transaction:', err));
  }

  return result;
}

/**
 * Checks and deducts credits for an AI operation.
 * Demo users always pass. Live users must have sufficient credits.
 *
 * Returns { allowed: true } if the user can proceed,
 * or { allowed: false, response: Response } with a 402/401/503 error.
 */
export async function checkAndDeductCredits(
  operationType: string,
  description: string,
): Promise<{ allowed: true } | { allowed: false; response: Response }> {
  const session = await getSessionUid();

  if (!session) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  // Demo users are unlimited
  if (session.isDemo) return { allowed: true };

  // Deduct credits via Admin SDK (server-side, bypasses Firestore rules)
  const cost = AI_CREDIT_COSTS[operationType] || 1;
  try {
    const result = await deductCreditsAdmin(session.uid, operationType, description);

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
          { status: 402, headers: { 'Content-Type': 'application/json' } }
        ),
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error('[credits] Failed to check credits:', err);
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Credit system temporarily unavailable. Please try again.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
}

/**
 * Refunds credits to a user after a failed AI operation.
 * Uses Admin SDK — no auth context needed server-side.
 */
export async function refundCredits(
  operationType: string,
  description: string,
): Promise<void> {
  const session = await getSessionUid();
  if (!session || session.isDemo) return;

  const cost = AI_CREDIT_COSTS[operationType] || 1;
  try {
    const adminDb = getAdminDbOrThrow();
    const userRef = adminDb.collection('users').doc(session.uid);
    await userRef.update({
      credits: FieldValue.increment(cost),
      totalCreditsUsed: FieldValue.increment(-cost),
    });

    // Record refund transaction
    const txRef = adminDb.collection('credit_transactions').doc();
    await txRef.set({
      userId: session.uid,
      amount: cost,
      type: 'refund',
      description: `Refund: ${description}`,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[credits] Failed to refund credits:', err);
  }
}
