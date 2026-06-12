import { NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/api/cron-auth';
import { sweepExpiredAgentApprovals, sweepExpiredAgentRuns } from '@/lib/agent-runtime/postgres';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const runs = await sweepExpiredAgentRuns();
    const approvals = await sweepExpiredAgentApprovals();
    return NextResponse.json({
      runsSwept: runs.swept,
      approvalsSwept: runs.approvalsSwept + approvals.swept,
      remaining: runs.remaining || approvals.remaining,
      errors: runs.errors + approvals.errors,
    });
  } catch (err) {
    console.error('[cron/agent-runs-sweep] failed:', err);
    return NextResponse.json({ error: 'agent run sweep failed' }, { status: 500 });
  }
}
