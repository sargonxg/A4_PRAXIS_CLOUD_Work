import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { enqueueAgentRunDispatch } from '@/lib/agent-runtime/cloud-tasks';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ runId: string }> };

export const POST = withAuth<RouteContext>(async (_request, user, context) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Demo mode cannot dispatch private agent runs' }, { status: 403 });
  }

  const { runId } = await context.params;
  if (!runId?.trim()) {
    return NextResponse.json({ error: 'runId is required' }, { status: 400 });
  }

  try {
    const dispatch = await enqueueAgentRunDispatch({
      ownerUid: user.uid,
      runId: runId.trim(),
    });
    return NextResponse.json({
      runId: dispatch.payload.runId,
      status: 'queued',
      dispatchId: dispatch.payload.dispatchId,
      taskName: dispatch.taskName,
      queuePath: dispatch.queuePath,
      targetUrl: dispatch.targetUrl,
    }, { status: 202 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('not found')) {
      return NextResponse.json({ error: 'Agent run not found' }, { status: 404 });
    }
    if (message.includes('requires queued status')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (message.includes('not configured')) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: 'Agent run dispatch failed' }, { status: 500 });
  }
});
