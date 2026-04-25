import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { isAdmin } from '@/lib/auth/admin-gate';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/operator-console
 *
 * Returns the operator console snapshot — most recent system_events,
 * background_jobs, tool_runs across ALL users. Gated by ADMIN_ALLOWLIST.
 *
 * The Firestore client SDK rules deny cross-user reads, which is correct.
 * This server-side endpoint uses Admin SDK to bypass those rules but
 * gates access via the env-var allowlist (no JWT claim trust).
 */
export const GET = withAuth(async (_req, user) => {
  if (!isAdmin(user.uid)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getAdminDbOrThrow();
  const url = new URL(_req.url);
  const eventLimit = Math.min(Number(url.searchParams.get('eventLimit') ?? 100), 500);
  const jobLimit = Math.min(Number(url.searchParams.get('jobLimit') ?? 50), 200);
  const runLimit = Math.min(Number(url.searchParams.get('runLimit') ?? 50), 200);

  const [eventsSnap, jobsSnap, runsSnap, deadLetterSnap] = await Promise.all([
    db.collection('system_events').orderBy('createdAt', 'desc').limit(eventLimit).get(),
    db.collection('background_jobs').orderBy('updatedAt', 'desc').limit(jobLimit).get(),
    db.collection('tool_runs').orderBy('startedAt', 'desc').limit(runLimit).get(),
    db.collection('background_jobs').where('status', '==', 'dead_letter')
      .orderBy('updatedAt', 'desc').limit(20).get(),
  ]);

  return NextResponse.json({
    events: eventsSnap.docs.map((d) => d.data()),
    jobs: jobsSnap.docs.map((d) => d.data()),
    runs: runsSnap.docs.map((d) => d.data()),
    deadLetter: deadLetterSnap.docs.map((d) => d.data()),
    fetchedAt: Date.now(),
  });
});
