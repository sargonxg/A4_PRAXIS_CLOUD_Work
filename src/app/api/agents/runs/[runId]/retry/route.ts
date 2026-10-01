import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { enqueueAgentRunDispatch } from '@/lib/agent-runtime/cloud-tasks';
import { createAgentRun, getAgentRun, updateAgentRunMetadata } from '@/lib/agent-runtime/postgres';
import { GetAgentRunParamsSchema, toAgentRunOutput } from '@/lib/agent-runtime/schema';
import { canRetryAgentRunStatus, isTerminalAgentRunStatus, userSafeAgentRunError } from '@/lib/agent-runtime/status';

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
    if (source.ownerUid !== user.uid) return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });
    // The sweep may lag the deadline. The original row remains an honest record;
    // its expired lease cannot admit new work, and this request creates a child.
    const sourceStatus = !isTerminalAgentRunStatus(source.status) && hasElapsedDeadline(source.expiresAt)
      ? 'expired' : source.status;
    const retryStatus = (sourceStatus === 'queued' || sourceStatus === 'running')
      && source.metadata.dispatchEnqueueStatus === 'dispatch_failed' ? 'dispatch_failed' : sourceStatus;
    if (!canRetryAgentRunStatus(retryStatus)) {
      return NextResponse.json({ error: `Agent run cannot be retried from ${retryStatus}` }, { status: 409 });
    }

    if (retryStatus === 'dispatch_failed') {
      const dispatch = await enqueueAgentRunDispatch({ ownerUid: user.uid, runId: source.id });
      const updated = await updateAgentRunMetadata({
        ownerUid: user.uid,
        runId: source.id,
        metadata: {
          dispatchEnqueueStatus: 'dispatch_enqueued',
          dispatchId: dispatch.payload.dispatchId,
          dispatchRetriedAt: new Date().toISOString(),
        },
        message: 'AgentRun dispatch retried by the owner.',
      });
      return NextResponse.json({
        run: toAgentRunOutput(updated ?? source),
        dispatch,
        retriedRunId: source.id,
        sourceRunId: source.id,
      });
    }

    const run = await createAgentRun({
      ownerUid: user.uid,
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
      metadata: freshRetryMetadata(source.metadata, source.id),
    });

    const dispatch = await enqueueAgentRunDispatch({ ownerUid: user.uid, runId: run.id });
    return NextResponse.json({ run: toAgentRunOutput(run), dispatch, retriedRunId: run.id, sourceRunId: source.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes('not configured') || /queue|task|dispatch|enqueue/i.test(message) ? 503 : message.includes('not found') ? 404 : 409;
    return NextResponse.json({ error: userSafeAgentRunError(message), detail: message }, { status });
  }
});

function hasElapsedDeadline(value: string | null): boolean {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value && timestamp <= Date.now();
}

const RETRY_EXECUTION_ARTIFACTS = new Set([
  'executionState', 'executionMode', 'executionStage', 'executionToken', 'executionLease', 'executionLeaseUntil',
  'executionAttempt', 'executionStartedAt', 'executionCompletedAt', 'executionCheckpoints',
  'approvalId', 'approvalStatus', 'approvals', 'approvalRequestedAt', 'approvalDecidedAt', 'approvalExpiresAt',
  'approvalGateCount', 'toolCallId', 'pendingToolId', 'currentStep', 'stepResults',
  'generationCheckpoints', 'generationReceipt', 'generationReceipts', 'workflowPlan', 'capsuleReadReceipt',
  'memoId', 'outputHref', 'outputIds', 'outputCapsuleId', 'boardroomOutput', 'artifactIds', 'artifacts', 'outputs',
  'outputReview', 'revisionOutcome', 'redTeamFindings', 'sourceabilityLedger', 'sourceabilityLedgerSummary', 'groundingVerification',
  'failure', 'failureSummary', 'failedPhase', 'error', 'lastError', 'degradedReason', 'latestMirroredEvent',
  'cancelledAt', 'cancellationReason', 'expiredAt', 'runId', 'parentRunId', 'retryOfRunId',
]);

function freshRetryMetadata(metadata: Record<string, unknown>, sourceRunId: string): Record<string, unknown> {
  // Keep captured inputs and governance/model/network/budget constraints. A new
  // run gets no parent dispatch claim, approval, provider checkpoint or output.
  const fresh = Object.fromEntries(Object.entries(metadata).filter(([key]) =>
    !key.startsWith('dispatch') && !key.startsWith('pendingApproval') && !key.startsWith('threadReturn')
    && !RETRY_EXECUTION_ARTIFACTS.has(key)));
  const plan = metadata.workflowPlan;
  if (typeof metadata.workflowKind !== 'string' && typeof metadata.runIntent !== 'string'
    && plan && typeof plan === 'object' && !Array.isArray(plan)) {
    const kind = (plan as Record<string, unknown>).workflowKind;
    if (typeof kind === 'string') fresh.workflowKind = kind;
  }
  return { ...fresh, retryOfRunId: sourceRunId };
}
