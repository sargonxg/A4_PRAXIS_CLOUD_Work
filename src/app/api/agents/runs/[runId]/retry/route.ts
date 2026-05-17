import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { enqueueAgentRunDispatch } from '@/lib/agent-runtime/cloud-tasks';
import { createAgentRun, getAgentRun } from '@/lib/agent-runtime/postgres';
import { GetAgentRunParamsSchema, toAgentRunOutput } from '@/lib/agent-runtime/schema';

export const dynamic = 'force-dynamic';

export const POST = withAuth<{ params: Promise<{ runId: string }> }>(async (_request, user, context) => {
  const parsed = GetAgentRunParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid run id', details: parsed.error.flatten() }, { status: 400 });
  }
  if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot retry private agent runs' }, { status: 403 });

  try {
    const source = await getAgentRun(user.uid, parsed.data.runId);
    if (!source) return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });
    const run = source.status === 'failed' || source.status === 'cancelled' || source.status === 'expired'
      ? await createAgentRun({
          ownerUid: source.ownerUid,
          capsuleId: source.capsuleId,
          contextStackId: source.contextStackId,
          contextPackageId: source.contextPackageId,
          selectedCoreIds: source.selectedCoreIds,
          agentSpecId: source.agentSpecId,
          triggerType: source.triggerType,
          objective: source.objective,
          parentRunId: source.id,
          idempotencyKey: `retry:${source.id}:${Date.now()}`,
          maxStep: source.maxStep,
          maxSessionMinutes: source.maxSessionMinutes,
          internalEstimatedCostCents: source.internalEstimatedCostCents,
          metadata: {
            ...source.metadata,
            retryOfRunId: source.id,
          },
        })
      : source;

    const dispatch = await enqueueAgentRunDispatch({ ownerUid: user.uid, runId: run.id });
    return NextResponse.json({ run: toAgentRunOutput(run), dispatch, retriedRunId: run.id, sourceRunId: source.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes('not configured') ? 503 : message.includes('not found') ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
});
