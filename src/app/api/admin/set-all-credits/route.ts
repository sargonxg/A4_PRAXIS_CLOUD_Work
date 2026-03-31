import { NextRequest, NextResponse } from 'next/server';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const maxDuration = 60;

const TARGET_CREDITS = 5000;

/**
 * POST /api/admin/set-all-credits
 *
 * Sets ALL users' credits to 5000. Protected by CRON_SECRET header.
 * Run once to bootstrap credits for existing users.
 *
 * Headers:
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }

  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
}
