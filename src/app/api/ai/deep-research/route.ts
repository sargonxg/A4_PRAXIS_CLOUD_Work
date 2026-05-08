import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { validateAiRequest } from '@/lib/api/validate-request';
import {
  deepResearchStreamHeaders,
  encodeDeepResearchEvent,
  streamResearchEngineEnvelope,
} from '@/lib/ai/deep-research-envelope';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import type { ResearchDepth, ResearchMode } from '@/lib/ai/research-engine';
import { z } from 'zod';

export const maxDuration = 120;

type RequestResearchMode = ResearchMode;
type RequestResearchDepth = ResearchDepth;

const DeepResearchRequestSchema = z.object({
  query: z.string().min(1),
  mode: z.enum(['briefing', 'background', 'media-scan', 'actor-profile']).optional(),
  depth: z.enum(['quick', 'standard', 'comprehensive']).optional(),
  conflictContext: z.string().optional(),
  situationId: z.string().optional(),
});

export const POST = withCalibration('deep_research', 'ai_deep_think', {
  retrievalQuery: (_req, body) => {
    const q = typeof body.query === 'string' ? body.query : '';
    const ctxStr = typeof body.conflictContext === 'string' ? body.conflictContext : '';
    return [q, ctxStr].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const body = await request.json();
    const validation = validateAiRequest(body, DeepResearchRequestSchema);
    if (!validation.success) return validation.response;
    const {
      query,
      mode = 'briefing',
      depth = 'standard',
      conflictContext,
      situationId,
    } = validation.data as {
      query: string;
      mode?: RequestResearchMode;
      depth?: RequestResearchDepth;
      conflictContext?: string;
      situationId?: string;
    };

    if (isServerDemoMode()) {
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encodeDeepResearchEvent({
              type: 'error',
              text: 'Deprecated deep-research compatibility route requires live AI configuration. Use /api/ai/deep-search-agent for canonical Deep Research Agent calls.',
            }));
            controller.enqueue(encodeDeepResearchEvent({ type: 'done' }));
            controller.close();
          },
        }),
        {
          status: 503,
          headers: deprecatedHeaders(),
        },
      );
    }

    // Credits + profile gate already handled by withCalibration above.

    // Deprecated compatibility route. It intentionally keeps the local research
    // engine as the fallback implementation, but emits the canonical
    // deep-search-agent SSE envelope so clients do not need two parsers.
    void ctx.calibration.systemPromptBlock;

    const stream = streamResearchEngineEnvelope({
      query,
      mode,
      depth,
      conflictContext,
      fallbackReason: 'legacy-route',
      onComplete: async () => {
        if (situationId && ctx.uid) {
          await saveToolOutput({
            uid: ctx.uid,
            situationId,
            toolId: 'deep-search-agent',
            profileVersion: ctx.calibration.provenance.profileVersion,
            toolRunId: ctx.toolRunId,
            output: {
              query,
              mode,
              depth,
              conflictContext,
              streamed: true,
              envelope: 'deep-search-agent-v1',
              sourceRoute: '/api/ai/deep-research',
            },
            metadata: {
              streamed: true,
              deprecatedRoute: '/api/ai/deep-research',
              canonicalRoute: '/api/ai/deep-search-agent',
            },
          }).catch((err) => console.warn('[deep_research] compatibility saveToolOutput failed:', err));
        }
      },
    });

    return new Response(stream, { headers: deprecatedHeaders() });
  } catch (err) {
    console.error('Deep research route error:', err);
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encodeDeepResearchEvent({ type: 'error', text: 'Research request failed' }));
          controller.enqueue(encodeDeepResearchEvent({ type: 'done' }));
          controller.close();
        },
      }),
      {
        status: 500,
        headers: deprecatedHeaders(),
      },
    );
  }
});

function deprecatedHeaders(): HeadersInit {
  return deepResearchStreamHeaders({
    'X-PRAXIS-Deprecated-Route': '/api/ai/deep-research',
    'X-PRAXIS-Canonical-Route': '/api/ai/deep-search-agent',
    'X-PRAXIS-Fallback-Strategy': 'soft-deprecated-research-engine-fallback',
  });
}
