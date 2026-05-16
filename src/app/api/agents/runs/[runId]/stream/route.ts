import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { listAgentRunEvents } from '@/lib/agent-runtime/postgres';
import { GetAgentRunParamsSchema } from '@/lib/agent-runtime/schema';
import type { AgentRunEvent } from '@/lib/agent-runtime/types';

export const dynamic = 'force-dynamic';

export const GET = withAuth<{ params: Promise<{ runId: string }> }>(async (request, user, context) => {
  const parsed = GetAgentRunParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid run id', details: parsed.error.flatten() }, { status: 400 });
  }
  if (user.isDemo) {
    return NextResponse.json({ error: 'Sample mode does not persist private agent runs' }, { status: 404 });
  }

  const url = new URL(request.url);
  const after = url.searchParams.get('after');
  const limit = Number(url.searchParams.get('limit') ?? 100);

  try {
    const events = await listAgentRunEvents({
      ownerUid: user.uid,
      runId: parsed.data.runId,
      after,
      limit: Number.isFinite(limit) ? limit : 100,
    });
    return new Response(encodeSseEvents(events), {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Agent run ledger is not configured')) {
      return NextResponse.json({ error: 'Agent run ledger is not configured' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Agent run stream error' }, { status: 500 });
  }
});

export function encodeSseEvents(events: AgentRunEvent[]): string {
  const body = events.map((event) => [
    `id: ${event.id}`,
    `event: ${event.eventType}`,
    `data: ${JSON.stringify(event)}`,
    '',
  ].join('\n')).join('\n');
  return `${body}${body ? '\n' : ''}: end\n\n`;
}
