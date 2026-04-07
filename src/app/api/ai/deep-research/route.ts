import { conductResearch, type ResearchMode, type ResearchDepth } from '@/lib/ai/research-engine';
import { isServerDemoMode, hashInput, getCachedResponse, formatAsStreamResponse } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { withAuth } from '@/lib/api/with-auth';

export const maxDuration = 120;

type RequestResearchMode = ResearchMode;
type RequestResearchDepth = ResearchDepth;

export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();
    const {
      query,
      mode = 'briefing',
      depth = 'standard',
      conflictContext,
    }: {
      query: string;
      mode?: RequestResearchMode;
      depth?: RequestResearchDepth;
      conflictContext?: string;
    } = body;

    // --- Demo mode: return pre-computed responses when no API key is set ---
    if (isServerDemoMode()) {
      const inputHash = hashInput({ content: query, mode, depth, context: conflictContext });
      if (inputHash) {
        const cached = getCachedResponse('deep_research', inputHash);
        if (cached) return formatAsStreamResponse(cached);
      }
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in environment variables.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Live mode: check credits before making AI call ---
    const creditCheck = await checkAndDeductCredits('ai_deep_research', 'Deep research');
    if (!creditCheck.allowed) return creditCheck.response;

    const result = await conductResearch({
      query,
      mode,
      depth,
      conflictContext,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Deep research route error:', err);
    return new Response(JSON.stringify({ error: 'Research request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
