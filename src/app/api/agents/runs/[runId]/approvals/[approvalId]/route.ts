import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { enqueueAgentRunDispatch } from '@/lib/agent-runtime/cloud-tasks';
import { decideAgentApproval, getAgentRun, updateAgentRunStatus } from '@/lib/agent-runtime/postgres';
import { GetAgentRunParamsSchema, toAgentRunOutput } from '@/lib/agent-runtime/schema';

type RouteContext = { params: Promise<{ runId: string; approvalId: string }> };

export const dynamic = 'force-dynamic';

export const POST = withAuth<RouteContext>(async (request, user, context) => {
  const params = await context.params;
  const parsed = GetAgentRunParamsSchema.safeParse({ runId: params.runId });
  if (!parsed.success || !params.approvalId) {
    return NextResponse.json({ error: 'Invalid approval route params', details: parsed.success ? undefined : parsed.error.flatten() }, { status: 400 });
  }
  if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot decide private agent approvals' }, { status: 403 });

  const body = await request.json().catch(() => ({})) as { decision?: unknown; reason?: unknown };
  const decision = body.decision === 'approved' || body.decision === 'rejected' ? body.decision : null;
  if (!decision) return NextResponse.json({ error: 'decision must be approved or rejected' }, { status: 400 });
  const rejectionReason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : '';

  try {
    const approval = await decideAgentApproval({
      ownerUid: user.uid,
      runId: parsed.data.runId,
      approvalId: params.approvalId,
      decision,
      decidedByUid: user.uid,
    });
    if (!approval) return NextResponse.json({ error: 'Pending approval not found' }, { status: 404 });
    const run = await getAgentRun(user.uid, parsed.data.runId);
    if (!run) return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });

    if (decision === 'rejected') {
      const failed = run.status === 'waiting_approval'
        ? await updateAgentRunStatus({
            ownerUid: user.uid,
            runId: run.id,
            toStatus: 'failed',
            message: rejectionReason
              ? `Agent run stopped because an approval was rejected: ${rejectionReason}`
              : 'Agent run stopped because an approval was rejected.',
            data: { approvalId: approval.id, rejectionReason: rejectionReason || null },
          })
        : run;
      return NextResponse.json({ approval, run: toAgentRunOutput(failed ?? run), resumed: false });
    }

    // The owner-scoped approval path is also what the production canary uses
    // for its disposable AgentRun before waiting for resumed terminal output.
    const resumed = run.status === 'waiting_approval'
      ? await updateAgentRunStatus({
          ownerUid: user.uid,
          runId: run.id,
          toStatus: 'running',
          message: 'Agent run approval granted; resume dispatch requested.',
          data: { approvalId: approval.id },
        })
      : run;
    const dispatch = await enqueueAgentRunDispatch({ ownerUid: user.uid, runId: resumed?.id ?? run.id });
    return NextResponse.json({ approval, run: toAgentRunOutput(resumed ?? run), dispatch, resumed: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes('not configured') ? 503 : message.includes('not found') ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
});
