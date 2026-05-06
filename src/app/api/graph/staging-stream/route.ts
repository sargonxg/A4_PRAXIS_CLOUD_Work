import { withAuth } from '@/lib/api/with-auth';

export const GET = withAuth(async () => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode('event: graph.proposal.staged\n'));
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ id: 'proposal-1', label: 'New actor proposal' })}\n\n`));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
});
