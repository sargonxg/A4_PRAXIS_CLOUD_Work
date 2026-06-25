import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAgentRun, listAgentApprovals, listAgentToolCalls } from '@/lib/agent-runtime/postgres';
import { GetAgentRunParamsSchema, toAgentRunOutput } from '@/lib/agent-runtime/schema';

export const dynamic = 'force-dynamic';

export const GET = withAuth<{ params: Promise<{ runId: string }> }>(async (_request, user, context) => {
  const parsed = GetAgentRunParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid run id', details: parsed.error.flatten() }, { status: 400 });
  }
  if (user.isDemo) {
    return NextResponse.json({ error: 'Sample mode does not persist private agent runs' }, { status: 404 });
  }

  try {
    const run = await getAgentRun(user.uid, parsed.data.runId);
    if (!run) return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });
    if (run.ownerUid !== user.uid) return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });
    const [toolCalls, approvals] = await Promise.all([
      listAgentToolCalls({ ownerUid: user.uid, runId: run.id }),
      listAgentApprovals({ ownerUid: user.uid, runId: run.id }),
    ]);
    return NextResponse.json({ run: toAgentRunOutput(run), toolCalls, approvals, persisted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Agent run ledger is not configured')) {
      return NextResponse.json({ error: 'Agent run ledger is not configured' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Agent run ledger error' }, { status: 500 });
  }
});
