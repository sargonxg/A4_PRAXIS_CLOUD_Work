import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAgentRun } from '@/lib/agent-runtime/postgres';
import { GetAgentRunParamsSchema, toAgentRunOutput } from '@/lib/agent-runtime/schema';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ runId: string }> };

export const GET = withAuth<RouteContext>(async (_request, user, context) => {
  if (user.isDemo) return NextResponse.json({ error: 'Demo mode has no private agent runs' }, { status: 403 });
  const parsed = GetAgentRunParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid agent run params', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const run = await getAgentRun(user.uid, parsed.data.runId);
    if (!run) return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });
    return NextResponse.json({ run: toAgentRunOutput(run), persisted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Agent run ledger is not configured')) {
      return NextResponse.json({
        error: 'Agent run ledger is not configured',
        detail: 'Set AGENT_RUNTIME_DATABASE_URL, PRAXIS_DATABASE_URL, or DATABASE_URL for Cloud SQL Postgres.',
      }, { status: 503 });
    }
    return NextResponse.json({ error: 'Agent run ledger error' }, { status: 500 });
  }
});
