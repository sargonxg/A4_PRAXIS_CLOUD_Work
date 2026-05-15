import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getAgentRun, updateAgentRunStatus } from '@/lib/agent-runtime/postgres';
import { verifyAgentWorkerRequest } from '@/lib/agent-runtime/worker-auth';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ runId: string }> };

const ExecutePayloadSchema = z.object({
  runId: z.string().min(1).max(240),
  ownerUid: z.string().min(1).max(240),
  capsuleId: z.string().min(1).max(240),
  traceId: z.string().min(1).max(240),
  dispatchId: z.string().min(1).max(240),
  attempt: z.number().int().positive().max(100),
  requestedAt: z.string().min(1).max(80),
});

export async function POST(request: NextRequest, context: RouteContext) {
  const workerAuth = await verifyAgentWorkerRequest(request);
  if (!workerAuth.ok) {
    return NextResponse.json({ error: workerAuth.error }, { status: workerAuth.status });
  }

  const { runId } = await context.params;
  const raw = await request.json().catch(() => ({}));
  const parsed = ExecutePayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid agent run execute payload', details: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.runId !== runId) {
    return NextResponse.json({ error: 'Payload runId does not match route runId' }, { status: 400 });
  }

  const run = await getAgentRun(parsed.data.ownerUid, runId);
  if (!run) {
    return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });
  }
  if (run.traceId !== parsed.data.traceId || run.capsuleId !== parsed.data.capsuleId) {
    return NextResponse.json({ error: 'Agent run execute payload does not match ledger pointers' }, { status: 409 });
  }
  if (run.status === 'succeeded') {
    return NextResponse.json({ runId: run.id, status: run.status, idempotent: true });
  }
  if (run.status !== 'queued' && run.status !== 'running') {
    return NextResponse.json({ error: `Agent run cannot be executed from ${run.status}` }, { status: 409 });
  }

  const running = run.status === 'running'
    ? run
    : await updateAgentRunStatus({
      ownerUid: run.ownerUid,
      runId: run.id,
      toStatus: 'running',
      message: 'No-op agent worker accepted the queued dispatch.',
      data: {
        dispatchId: parsed.data.dispatchId,
        attempt: parsed.data.attempt,
        requestedAt: parsed.data.requestedAt,
      },
    });
  if (!running) {
    return NextResponse.json({ error: 'Agent run disappeared before execution' }, { status: 404 });
  }

  const succeeded = await updateAgentRunStatus({
    ownerUid: running.ownerUid,
    runId: running.id,
    toStatus: 'succeeded',
    message: 'No-op agent worker completed without model or tool execution.',
    data: {
      dispatchId: parsed.data.dispatchId,
      attempt: parsed.data.attempt,
      executionMode: 'noop',
    },
  });

  return NextResponse.json({
    runId: succeeded?.id ?? running.id,
    status: succeeded?.status ?? 'succeeded',
    executionMode: 'noop',
    traceId: running.traceId,
  });
}
