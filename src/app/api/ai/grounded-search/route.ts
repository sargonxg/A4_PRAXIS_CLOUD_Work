import { conductResearch } from '@/lib/ai/research-engine';
import { isServerDemoMode, hashInput, getCachedResponse, formatAsStreamResponse } from '@/lib/demo/demo-mode';
import { withCalibration } from '@/lib/api/with-calibration';

export const maxDuration = 60;

export const POST = withCalibration('deep_research', 'ai_chat', {
  retrievalQuery: (_req, body) => {
    const ctxStr = typeof body.conflictContext === 'string' ? body.conflictContext : '';
    return ctxStr || undefined;
  },
})(async (request, ctx) => {
  try {
    const { messages, conflictContext } = await request.json();

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

    const result = await conductResearch({
      query,
      mode: 'briefing',
      depth: 'standard',
      conflictContext,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Grounded search route error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
