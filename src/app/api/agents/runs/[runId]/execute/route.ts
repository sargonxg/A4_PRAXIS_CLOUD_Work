import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyAgentWorkerRequest } from '@/lib/agent-runtime/worker-auth';
import { AgentWorkerError, executeAgentRun } from '@/lib/agent-runtime/worker';

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

  try {
    return NextResponse.json(await executeAgentRun(parsed.data));
  } catch (err) {
    if (err instanceof AgentWorkerError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Agent run execution failed' }, { status: 500 });
  }
}
