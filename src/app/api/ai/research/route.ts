import { conductResearch, type ResearchMode } from '@/lib/ai/research-engine';
import { isServerDemoMode, hashInput, getCachedResponse, formatAsStreamResponse } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { query, mode = 'briefing', conflictContext } = await request.json() as {
      query: string;
      mode?: ResearchMode;
      conflictContext?: string;
    };

    // --- Demo mode: return pre-computed responses when no API key is set ---
    if (isServerDemoMode()) {
      const inputHash = hashInput({ content: query, context: conflictContext });
      if (inputHash) {
        const cached = getCachedResponse('research', inputHash);
        if (cached) return formatAsStreamResponse(cached);
      }
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in Vercel environment variables.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Live mode: check credits before making AI call ---
    const creditCheck = await checkAndDeductCredits('ai_research', 'Research query');
    if (!creditCheck.allowed) return creditCheck.response;

    const result = await conductResearch({
      query,
      mode,
      depth: 'standard',
      conflictContext,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Research route error:', err);
    return new Response(JSON.stringify({ error: 'Research request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
