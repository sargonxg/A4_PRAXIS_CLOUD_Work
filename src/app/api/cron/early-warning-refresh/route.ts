import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireCronSecret } from '@/lib/api/cron-auth';

export const maxDuration = 300;

/**
 * Cron job: refresh escalation-scan outputs for all active situations.
 * Invoked by Cloud Scheduler every 6 hours. Secured by CRON_SECRET header.
 *
 * Strategy: enumerate active situations, mark a `pendingEscalationRefresh`
 * flag on each. The tool page reads the flag on mount and re-fetches if set
 * (keeping the heavy AI call in the authenticated user's credit budget rather
 * than a single shared cron identity). A companion client hook honours the
 * flag and calls `POST /api/ai/escalation-scan` with the user's session.
 */
export async function GET(req: Request) {
  const forbidden = requireCronSecret(req, 403);
  if (forbidden) return forbidden;

  try {
    const snap = await adminDb
      .collectionGroup('situations')
      .where('status', 'in', ['active', 'monitoring'])
      .limit(500)
      .get();

    let marked = 0;
    const batches: Promise<FirebaseFirestore.WriteResult>[] = [];
    for (const doc of snap.docs) {
      batches.push(
        doc.ref.update({
          pendingEscalationRefresh: true,
          lastEscalationRefreshQueuedAt: new Date().toISOString(),
        }),
      );
      marked++;
    }
    await Promise.allSettled(batches);

    return NextResponse.json({ ok: true, marked });
  } catch (err) {
    console.error('[cron/early-warning-refresh] failed:', err);
    return NextResponse.json({ error: 'refresh failed' }, { status: 500 });
  }
}
