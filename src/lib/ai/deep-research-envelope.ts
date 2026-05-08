import { conductResearch, type ResearchDepth, type ResearchMode } from '@/lib/ai/research-engine';

type DeepResearchFallbackReason = 'legacy-route' | 'not-configured' | 'agent-unavailable';

export interface DeepResearchEnvelopeInput {
  query: string;
  mode?: ResearchMode;
  depth?: ResearchDepth;
  conflictContext?: string;
  fallbackReason: DeepResearchFallbackReason;
  onComplete?: () => Promise<void>;
}

export function encodeDeepResearchEvent(obj: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

export function deepResearchStreamHeaders(extra?: HeadersInit): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    ...extra,
  };
}

export function streamResearchEngineEnvelope(input: DeepResearchEnvelopeInput): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encodeDeepResearchEvent({
          type: 'planning',
          phase: 'planning',
          author: 'praxis_research_router',
          text: input.fallbackReason === 'legacy-route'
            ? 'This request used the deprecated deep-research endpoint. Routing through the PRAXIS research-engine fallback with the canonical Deep Research Agent envelope.'
            : input.fallbackReason === 'not-configured'
              ? 'Managed Vertex Agent Engine is not configured yet. Routing this request through the PRAXIS research engine.'
              : 'Managed Vertex Agent Engine is unavailable. Falling back to the PRAXIS research engine.',
        }));

        controller.enqueue(encodeDeepResearchEvent({
          type: 'research',
          phase: 'research',
          author: 'praxis_research_engine',
          text: 'Gathering available web/source context and preparing a cited intelligence brief.',
        }));

        const result = await conductResearch({
          query: input.query,
          mode: input.mode ?? 'background',
          depth: input.depth ?? 'comprehensive',
          conflictContext: input.conflictContext,
        });

        controller.enqueue(encodeDeepResearchEvent({
          type: 'synthesis',
          phase: 'synthesis',
          author: 'praxis_report_composer',
          text: '',
        }));

        for await (const delta of result.textStream) {
          if (!delta) continue;
          controller.enqueue(encodeDeepResearchEvent({
            type: 'synthesis',
            phase: 'synthesis',
            author: 'praxis_report_composer',
            text: delta,
          }));
        }

        await input.onComplete?.();
        controller.enqueue(encodeDeepResearchEvent({ type: 'done' }));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[deep-research-envelope]', err);
        controller.enqueue(encodeDeepResearchEvent({ type: 'error', text: `Research engine fallback error: ${message}` }));
        controller.close();
      }
    },
  });
}
