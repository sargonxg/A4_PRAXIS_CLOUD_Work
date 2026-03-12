'use client';

import { useState, useCallback } from 'react';

// ── parseDataStreamChunk ─────────────────────────────────────────────────────
// Parses the Vercel AI SDK text-stream format.
// Each chunk is a newline-delimited list of lines that start with "0:" followed
// by a JSON-encoded string fragment.  We filter those lines and decode them.

export function parseDataStreamChunk(raw: string): string {
  return raw
    .split('\n')
    .filter((l) => l.startsWith('0:'))
    .map((l) => {
      try {
        return JSON.parse(l.slice(2));
      } catch {
        return '';
      }
    })
    .join('');
}

// ── useStreamingAI ───────────────────────────────────────────────────────────
// Reusable hook that encapsulates the fetch → stream → accumulate pattern used
// across every PRAXIS page that calls a streaming AI endpoint.

export function useStreamingAI() {
  const [output, setOutput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the active AbortController so callers can cancel mid-stream
  const [controller, setController] = useState<AbortController | null>(null);

  const stream = useCallback(
    async (endpoint: string, body: object): Promise<string> => {
      // Cancel any in-flight request
      controller?.abort();
      const ac = new AbortController();
      setController(ac);

      setIsStreaming(true);
      setOutput('');
      setError(null);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: ac.signal,
        });

        if (!response.ok) {
          const msg = `AI request failed: ${response.status} ${response.statusText}`;
          setError(msg);
          return '';
        }

        if (!response.body) {
          setError('No response body received');
          return '';
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += parseDataStreamChunk(
            decoder.decode(value, { stream: true })
          );
          setOutput(accumulated);
        }

        return accumulated;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          const msg = err instanceof Error ? err.message : 'Unknown streaming error';
          setError(msg);
        }
        return '';
      } finally {
        setIsStreaming(false);
        setController(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const cancel = useCallback(() => {
    controller?.abort();
  }, [controller]);

  const reset = useCallback(() => {
    setOutput('');
    setError(null);
  }, []);

  return { output, isStreaming, error, stream, setOutput, cancel, reset };
}
