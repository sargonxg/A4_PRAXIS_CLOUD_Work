import { conductResearch } from '@/lib/ai/research-engine';
import { isServerDemoMode, hashInput, getCachedResponse, formatAsStreamResponse } from '@/lib/demo/demo-mode';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { toLegacyDataStreamResponse } from '@/lib/ai/legacy-data-stream';
import { z } from 'zod';

export const maxDuration = 60;

const GroundedSearchRequestSchema = z.object({
  messages: z.array(z.object({
    content: z.union([z.string(), z.array(z.unknown())]).optional(),
  })).optional().default([]),
  conflictContext: z.string().optional(),
  situationId: z.string().optional(),
});

export const POST = withCalibration('grounded-search', 'ai_grounded_search', {
  retrievalQuery: (_req, body) => {
    const ctxStr = typeof body.conflictContext === 'string' ? body.conflictContext : '';
    return ctxStr || undefined;
  },
  variant: 'streaming',
})(async (request, ctx) => {
  try {
    const rawBody = await request.json().catch(() => null);
    const parsedBody = GroundedSearchRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid grounded search request.', details: parsedBody.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const { messages, conflictContext, situationId } = parsedBody.data;

    // --- Demo mode: return pre-computed responses when no API key is set ---
    if (isServerDemoMode()) {
      const lastMessage = messages?.[messages.length - 1];
      const userContent = typeof lastMessage?.content === 'string' ? lastMessage.content : '';
      const inputHash = hashInput({ content: userContent, context: conflictContext });
      if (inputHash) {
        const cached = getCachedResponse('grounded_search', inputHash);
        if (cached) return formatAsStreamResponse(cached);
      }
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in environment variables.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Credits + profile gate already handled by withCalibration above.

    // Calibration context is injected via profile-version provenance on downstream persistence.
    void ctx.calibration.systemPromptBlock;

    // Extract user query from last message
    const lastMessage = messages?.[messages.length - 1];
    const query = typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : 'Provide a general conflict intelligence briefing.';

    if (situationId && ctx.uid) {
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'grounded-search',
        profileVersion: ctx.calibration.provenance.profileVersion,
        toolRunId: ctx.toolRunId,
        output: {
          query,
          conflictContextPresent: Boolean(conflictContext),
          streamed: true,
          startedAt: new Date().toISOString(),
        },
        metadata: { streamed: true, sourceLayer: 'google-search-grounding' },
      }).catch((err) => console.warn('[grounded-search] saveToolOutput failed:', err));
    }

    const result = await conductResearch({
      query,
      mode: 'briefing',
      depth: 'standard',
      conflictContext,
    });

    return toLegacyDataStreamResponse(result.textStream);
  } catch (err) {
    console.error('Grounded search route error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
