import { NextResponse } from 'next/server';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuth } from '@/lib/api/with-auth';
import { isAdminPrincipal } from '@/lib/auth/admin-gate';
import { PRAXIS_STARTER_TOKEN_ALLOWANCE } from '@/lib/billing/usage-policy';

export const maxDuration = 60;

const TARGET_CREDITS = PRAXIS_STARTER_TOKEN_ALLOWANCE;
const CONFIRMATION = 'SET_ALL_CREDITS_TO_1000';

/**
 * POST /api/admin/set-all-credits
 *
 * Sets ALL users' credits to 1000. Admin-only and intentionally requires an
 * explicit confirmation body because this is a destructive bulk operation.
 * Run once to bootstrap credits for existing users.
 *
 * Body:
 *   { "confirm": "SET_ALL_CREDITS_TO_1000" }
 */
export const POST = withAuth(async (req, user) => {
  if (!isAdminPrincipal(user)) {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as { confirm?: unknown } | null;
  if (body?.confirm !== CONFIRMATION) {
    return NextResponse.json(
      { error: `Confirmation required: ${CONFIRMATION}` },
      { status: 400 },
    );
  }

  try {
    const adminDb = getAdminDbOrThrow();
    const usersSnap = await adminDb.collection('users').get();

    if (usersSnap.empty) {
      return NextResponse.json({ updated: 0, message: 'No users found' });
    }

    // Batch write in chunks of 500 (Firestore limit)
    const CHUNK = 400;
    let updated = 0;
    const docs = usersSnap.docs;

    for (let i = 0; i < docs.length; i += CHUNK) {
      const chunk = docs.slice(i, i + CHUNK);
      const batch = adminDb.batch();
      for (const doc of chunk) {
        batch.update(doc.ref, {
          credits: TARGET_CREDITS,
        });
        updated++;
      }
      await batch.commit();
    }

    // Log the admin action
    const logRef = adminDb.collection('credit_transactions').doc();
    await logRef.set({
      userId: 'admin',
      amount: TARGET_CREDITS,
      type: 'admin_bulk_reset',
      description: `Bulk reset: ${updated} users set to ${TARGET_CREDITS} credits`,
      actorUid: user.uid,
      actorEmail: user.email,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      updated,
      creditsPerUser: TARGET_CREDITS,
      message: `Successfully set ${updated} users to ${TARGET_CREDITS} credits`,
    });
  } catch (err) {
    console.error('[set-all-credits]', err);
    return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
  }
});
