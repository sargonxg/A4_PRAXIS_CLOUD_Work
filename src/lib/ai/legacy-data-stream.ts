/**
 * Compatibility adapter for the installed @ai-sdk/react useChat client and
 * existing PRAXIS manual stream parsers. They expect the legacy data-stream
 * protocol (`0:${json}\n`) rather than the newer UI-message SSE stream.
 */
export function toLegacyDataStreamResponse(
  textStream: AsyncIterable<string>,
  init?: ResponseInit,
  opts: {
    startData?: unknown[];
    onFinishData?: (text: string) => unknown | unknown[];
  } = {},
): Response {
  const encoder = new TextEncoder();
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'text/plain; charset=utf-8');
  headers.set('Cache-Control', 'no-cache, no-transform');
  headers.set('X-Accel-Buffering', 'no');

  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        let fullText = '';
        try {
          for (const data of opts.startData ?? []) {
            controller.enqueue(encoder.encode(`2:${JSON.stringify(data)}\n`));
          }
          for await (const text of textStream) {
            if (text) {
              fullText += text;
              controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
            }
          }
          const finishData = opts.onFinishData?.(fullText);
          const finishItems = Array.isArray(finishData) ? finishData : finishData === undefined ? [] : [finishData];
          for (const data of finishItems) {
            controller.enqueue(encoder.encode(`2:${JSON.stringify(data)}\n`));
          }
          controller.enqueue(encoder.encode(`d:${JSON.stringify({ finishReason: 'stop' })}\n`));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'AI stream failed';
          controller.enqueue(encoder.encode(`3:${JSON.stringify(message)}\n`));
        } finally {
          controller.close();
        }
      },
    }),
    {
      ...init,
      headers,
    },
  );
}
