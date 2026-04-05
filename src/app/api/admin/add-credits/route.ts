import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const maxDuration = 10;

const TOP_UP_AMOUNT = 1000;
const MAX_DAILY_TOPUPS = 5;

/**
 * POST /api/admin/add-credits
 *
 * Self-service credit top-up for the authenticated user.
 * Intended for development and testing — adds 1000 credits to the caller's account.
 * Rate-limited to prevent abuse: max 5 top-ups per day.
 */
export const POST = withAuth(async (_req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Demo users have unlimited credits' }, { status: 400 });
  }

  try {
    const adminDb = getAdminDbOrThrow();
    const userRef = adminDb.collection('users').doc(user.uid);

    // Check daily top-up limit to prevent abuse
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentTopups = await adminDb
      .collection('credit_transactions')
      .where('userId', '==', user.uid)
      .where('type', '==', 'admin_topup')
      .where('createdAt', '>=', oneDayAgo)
      .limit(MAX_DAILY_TOPUPS)
      .get();

    if (recentTopups.size >= MAX_DAILY_TOPUPS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_DAILY_TOPUPS} top-ups per day. Try again tomorrow.` },
        { status: 429 }
      );
    }

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists) {
        tx.set(userRef, {
          uid: user.uid,
          credits: TOP_UP_AMOUNT,
          totalCreditsUsed: 0,
          createdAt: FieldValue.serverTimestamp(),
          lastLoginAt: FieldValue.serverTimestamp(),
          role: 'analyst',
          isDemo: false,
          subscription: 'free',
        });
      } else {
        tx.update(userRef, {
          credits: FieldValue.increment(TOP_UP_AMOUNT),
        });
      }
    });

    // Log the top-up
    const txRef = adminDb.collection('credit_transactions').doc();
    await txRef.set({
      userId: user.uid,
      amount: TOP_UP_AMOUNT,
      type: 'admin_topup',
      description: 'Developer self-service top-up',
      createdAt: FieldValue.serverTimestamp(),
    });

    const snap = await userRef.get();
    const newCredits = (snap.data() as { credits: number })?.credits ?? TOP_UP_AMOUNT;

    return NextResponse.json({ added: TOP_UP_AMOUNT, credits: newCredits });
  } catch (err) {
    console.error('[add-credits]', err);
    return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
  }
});
