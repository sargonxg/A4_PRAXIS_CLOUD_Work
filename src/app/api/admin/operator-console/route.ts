import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { isAdminPrincipal } from '@/lib/auth/admin-gate';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import type { QuerySnapshot } from 'firebase-admin/firestore';

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
  if (!isAdminPrincipal(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getAdminDbOrThrow();
  const url = new URL(_req.url);
  const eventLimit = Math.min(Number(url.searchParams.get('eventLimit') ?? 100), 500);
  const jobLimit = Math.min(Number(url.searchParams.get('jobLimit') ?? 50), 200);
  const runLimit = Math.min(Number(url.searchParams.get('runLimit') ?? 50), 200);

  const safeDocs = async (
    label: string,
    query: Promise<QuerySnapshot>,
  ) => {
    try {
      const snap = await query;
      return { rows: snap.docs.map((d) => ({ id: d.id, ...d.data() })), error: null };
    } catch (err) {
      console.warn(`[admin/operator-console] ${label} query failed:`, err);
      return { rows: [], error: err instanceof Error ? err.message : String(err) };
    }
  };

  const [events, jobs, runs, deadLetter, agentRuns, ingestions, backlog] = await Promise.all([
    safeDocs('system_events', db.collection('system_events').orderBy('createdAt', 'desc').limit(eventLimit).get()),
    safeDocs('background_jobs', db.collection('background_jobs').orderBy('updatedAt', 'desc').limit(jobLimit).get()),
    safeDocs('tool_runs', db.collection('tool_runs').orderBy('startedAt', 'desc').limit(runLimit).get()),
    safeDocs('dead_letter', db.collection('background_jobs').where('status', '==', 'dead_letter')
      .orderBy('updatedAt', 'desc').limit(20).get()),
    safeDocs('agent_runs', db.collectionGroup('agent_runs').orderBy('lastActivityAt', 'desc').limit(50).get()),
    safeDocs('data_ingestions', db.collection('data_ingestions').orderBy('createdAt', 'desc').limit(50).get()),
    safeDocs('dev_backlog', db.collection('dev_backlog').orderBy('updatedAt', 'desc').limit(50).get()),
  ]);

  return NextResponse.json({
    events: events.rows,
    jobs: jobs.rows,
    runs: runs.rows,
    deadLetter: deadLetter.rows,
    agentRuns: agentRuns.rows,
    ingestions: ingestions.rows,
    backlog: backlog.rows,
    queryErrors: {
      events: events.error,
      jobs: jobs.error,
      runs: runs.error,
      deadLetter: deadLetter.error,
      agentRuns: agentRuns.error,
      ingestions: ingestions.error,
      backlog: backlog.error,
    },
    fetchedAt: Date.now(),
  });
});
