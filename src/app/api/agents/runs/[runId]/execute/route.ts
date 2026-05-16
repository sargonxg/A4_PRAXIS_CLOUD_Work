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
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Agent run execution failed' }, { status: 500 });
  }
}
