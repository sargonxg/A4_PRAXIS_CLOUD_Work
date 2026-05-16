import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

const PROMO_DAYS = 7;
const PROMO_CREDITS = 25_000;

function configuredCodes(): Set<string> {
  return new Set(
    (process.env.PROMO_FULL_ACCESS_CODES || '')
      .split(',')
      .map((code) => code.trim().toUpperCase())
      .filter(Boolean)
  );
}

export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Promo codes are not available for this session' }, { status: 403 });
  }

  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  const normalized = code?.trim().toUpperCase();
  const validCodes = configuredCodes();

  if (!normalized) {
    return NextResponse.json({ error: 'Enter an access code' }, { status: 400 });
  }

  if (validCodes.size === 0) {
    return NextResponse.json({ error: 'Access codes are not configured' }, { status: 503 });
  }

  if (!validCodes.has(normalized)) {
    return NextResponse.json({ error: 'Invalid access code' }, { status: 403 });
  }

  const db = getAdminDbOrThrow();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PROMO_DAYS * 24 * 60 * 60 * 1000);

  await db.collection('users').doc(user.uid).set(
    {
      subscription: 'enterprise',
      subscriptionProvider: 'promo',
      subscriptionStatus: 'trialing',
      subscriptionUpdatedAt: now.toISOString(),
      subscriptionExpiresAt: expiresAt.toISOString(),
      fullAccessCode: normalized,
      fullAccessCodeRedeemedAt: now.toISOString(),
      fullAccessExpiresAt: expiresAt.toISOString(),
      credits: FieldValue.increment(PROMO_CREDITS),
    },
    { merge: true }
  );

  await db.collection('credit_transactions').add({
    userId: user.uid,
    amount: PROMO_CREDITS,
    type: 'bonus',
    description: 'One-week full-access promo code credit grant',
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    ok: true,
    subscription: 'enterprise',
    provider: 'promo',
    creditsAdded: PROMO_CREDITS,
    expiresAt: expiresAt.toISOString(),
  });
});
