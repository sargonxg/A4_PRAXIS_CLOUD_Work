import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { handleRouteError } from '@/lib/api/standard-error';
import { buildDemoDeliberation, getDeliberation } from '@/lib/boardroom/store';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ deliberationId: string }> };

const QuerySchema = z.object({
  caseId: z.string().min(1),
});

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export const GET = withAuth<RouteContext>(async (request, user, context) => {
  try {
    const { deliberationId } = await context.params;
    const url = new URL(request.url);
    const parsed = QuerySchema.safeParse({ caseId: url.searchParams.get('caseId')?.trim() });
    if (!parsed.success) {
      return NextResponse.json({ error: 'caseId required', details: parsed.error.flatten() }, { status: 400 });
    }

    const deliberation = user.isDemo
      ? buildDemoDeliberation({ uid: user.uid, caseId: parsed.data.caseId, id: deliberationId })
      : await getDeliberation(user.uid, parsed.data.caseId, deliberationId);
    if (!deliberation) return NextResponse.json({ error: 'Deliberation not found' }, { status: 404 });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(sse('deliberation', {
          ...deliberation,
          status: 'running',
          phase: 'opening',
          contributions: [],
          synthesis: undefined,
        })));

        for (const contribution of deliberation.contributions) {
          controller.enqueue(encoder.encode(sse('contribution', contribution)));
        }

        if (deliberation.synthesis) {
          controller.enqueue(encoder.encode(sse('synthesis', deliberation.synthesis)));
        }

        controller.enqueue(encoder.encode(sse('done', {
          id: deliberation.id,
          status: 'synthesized',
          phase: 'synthesis',
          cost: deliberation.cost,
        })));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-store, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    return handleRouteError(err, 'boardroom/deliberations/stream');
  }
});
