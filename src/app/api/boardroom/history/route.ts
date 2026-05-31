import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { listBoardroomAgentRuns } from '@/lib/agent-runtime/postgres';
import { toAgentRunOutput } from '@/lib/agent-runtime/schema';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, user) => {
  if (user.isDemo) return NextResponse.json({ runs: [], persisted: false });

  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get('limit'));

  try {
    const runs = await listBoardroomAgentRuns(user.uid, limit);
    const boardroomRuns = runs.map((run) => {
      const output = toAgentRunOutput(run);
      return {
        ...output,
        title: run.objective,
        date: run.createdAt,
        capsuleId: run.capsuleId,
        outputHref: output.outputHref ?? `/app/boardroom?runId=${encodeURIComponent(run.id)}`,
      };
    });

    return NextResponse.json({
      runs: boardroomRuns,
      persisted: true,
    });
  } catch (err) {
    return ledgerError(err);
  }
});

function clampLimit(value: string | null): number {
  const parsed = value ? Number(value) : 12;
  return Number.isFinite(parsed) ? Math.max(1, Math.min(50, Math.floor(parsed))) : 12;
}

function ledgerError(err: unknown): Response {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('Agent run ledger is not configured')) {
    return NextResponse.json({
      error: 'Agent run ledger is not configured',
      detail: 'Set AGENT_RUNTIME_DATABASE_URL, PRAXIS_DATABASE_URL, or DATABASE_URL for Cloud SQL Postgres.',
    }, { status: 503 });
  }
  if (/ETIMEDOUT|ECONNREFUSED|ENETUNREACH|connection timeout|connect timeout|timeout expired|Cloud SQL/i.test(message)) {
    return NextResponse.json({
      error: 'Agent run ledger unavailable',
      persisted: false,
      degraded: true,
      detail: 'The durable agent ledger is temporarily unavailable. Boardroom run history is degraded.',
    }, { status: 503 });
  }
  return NextResponse.json({ error: 'Boardroom run ledger error' }, { status: 500 });
}
