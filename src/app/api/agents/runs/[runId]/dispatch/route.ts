import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { enqueueAgentRunDispatch } from '@/lib/agent-runtime/cloud-tasks';
import { GetAgentRunParamsSchema } from '@/lib/agent-runtime/schema';

export const dynamic = 'force-dynamic';

export const POST = withAuth<{ params: Promise<{ runId: string }> }>(async (request, user, context) => {
  const parsed = GetAgentRunParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid run id', details: parsed.error.flatten() }, { status: 400 });
  }
  if (user.isDemo) {
    return NextResponse.json({ error: 'Demo mode cannot dispatch private agent runs' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const attempt = typeof body.attempt === 'number' ? body.attempt : undefined;
  try {
    const dispatch = await enqueueAgentRunDispatch({
      ownerUid: user.uid,
      runId: parsed.data.runId,
      attempt,
    });
    return NextResponse.json(dispatch);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes('not configured') ? 503 : message.includes('not found') ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
});
