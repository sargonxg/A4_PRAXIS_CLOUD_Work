import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { handleRouteError } from '@/lib/api/standard-error';

/**
 * GET /api/credits/burn-rate
 *
 * Returns total credits spent in the last 7 days by the authenticated user.
 * Reads from the root `credit_transactions` collection filtered by userId.
 */
export const GET = withAuth(async (_req, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ last7dSpend: 0, txCount: 0 });
    }

    const db = getAdminDbOrThrow();
    const cutoffMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const snap = await db
      .collection('credit_transactions')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();

    let last7dSpend = 0;
    let txCount = 0;
    for (const doc of snap.docs) {
      const d = doc.data();
      const created = d.createdAt?.toDate?.() as Date | undefined;
      if (!created || created.getTime() < cutoffMs) continue;
      const amount = typeof d.amount === 'number' ? d.amount : 0;
      const type = (d.type as string | undefined) ?? '';
      // Spends are stored as negative amounts OR with type === 'debit'/'tool_use'.
      if (amount < 0) last7dSpend += Math.abs(amount);
      else if (type === 'debit' || type === 'tool_use') last7dSpend += amount;
      txCount++;
    }

    return NextResponse.json({ last7dSpend, txCount });
  } catch (err) {
    return handleRouteError(err, 'credits-burn-rate');
  }
});
