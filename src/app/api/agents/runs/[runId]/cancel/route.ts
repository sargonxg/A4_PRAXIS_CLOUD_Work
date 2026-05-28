import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAgentRun, updateAgentRunStatus } from '@/lib/agent-runtime/postgres';
import { GetAgentRunParamsSchema, toAgentRunOutput } from '@/lib/agent-runtime/schema';
import { canCancelAgentRunStatus, userSafeAgentRunError } from '@/lib/agent-runtime/status';

export const dynamic = 'force-dynamic';

export const POST = withAuth<{ params: Promise<{ runId: string }> }>(async (_request, user, context) => {
  const parsed = GetAgentRunParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid run id', details: parsed.error.flatten() }, { status: 400 });
  }
  if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot cancel private agent runs' }, { status: 403 });

  try {
    const run = await getAgentRun(user.uid, parsed.data.runId);
    if (!run) return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });
    if (!canCancelAgentRunStatus(run.status)) {
      return NextResponse.json({ error: `Agent run cannot be cancelled from ${run.status}` }, { status: 409 });
    }
    const cancelled = await updateAgentRunStatus({
      ownerUid: user.uid,
      runId: run.id,
      toStatus: 'cancelled',
      message: 'Agent run cancelled by the owner.',
      data: { source: 'agent-workspace' },
    });
    return NextResponse.json({ run: cancelled ? toAgentRunOutput(cancelled) : null, cancelled: Boolean(cancelled) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Agent run ledger is not configured')) {
      return NextResponse.json({ error: userSafeAgentRunError(message), detail: message }, { status: 503 });
    }
    return NextResponse.json({ error: userSafeAgentRunError(message), detail: message }, { status: 409 });
  }
});
