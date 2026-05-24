/**
 * Internal worker-only execution endpoint.
 *
 * AUTH: gated by `verifyAgentWorkerRequest` (HMAC + worker token). NOT a
 * user-facing route. Do NOT add `withAuth` — browser sessions are rejected
 * by design. Worker authentication contract lives in
 * `src/lib/agent-runtime/worker-auth.ts`.
 */
import { NextResponse } from 'next/server';
import { verifyAgentWorkerRequest } from '@/lib/agent-runtime/worker-auth';
import { AgentWorkerError, executeAgentRun, type ExecuteAgentRunPayload } from '@/lib/agent-runtime/worker';
import { GetAgentRunParamsSchema } from '@/lib/agent-runtime/schema';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ runId: string }> }) {
  const workerAuth = await verifyAgentWorkerRequest(request);
  if (!workerAuth.ok) {
    return NextResponse.json({ error: workerAuth.error }, { status: workerAuth.status });
  }

  const parsed = GetAgentRunParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid run id', details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = await request.json().catch(() => null) as ExecuteAgentRunPayload | null;
  if (!payload || payload.runId !== parsed.data.runId) {
    return NextResponse.json({ error: 'Invalid agent run execute payload' }, { status: 400 });
  }

  try {
    return NextResponse.json(await executeAgentRun(payload));
  } catch (err) {
    if (err instanceof AgentWorkerError) {
      if (err.status >= 500) {
        console.error('[agent-worker] Agent run execution failed', err.diagnostic ?? {
          runId: payload.runId,
          status: err.status,
          traceId: payload.traceId,
          dispatchId: payload.dispatchId,
          attempt: payload.attempt,
        });
      }
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[agent-worker] Agent run execution failed', {
      runId: payload.runId,
      traceId: payload.traceId,
      dispatchId: payload.dispatchId,
      attempt: payload.attempt,
      errorName: err instanceof Error ? err.name : typeof err,
    });
    return NextResponse.json({ error: 'Agent run execution failed' }, { status: 500 });
  }
}
