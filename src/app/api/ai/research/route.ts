import { z } from 'zod';
import { conductResearch, type ResearchMode } from '@/lib/ai/research-engine';
import { isServerDemoMode, hashInput, getCachedResponse, formatAsStreamResponse } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { withAuth } from '@/lib/api/with-auth';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';

export const maxDuration = 60;

export const POST = withAuth(async (request: Request) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      query: z.string(),
      mode: z.enum(['briefing', 'background', 'media-scan', 'actor-profile']).optional(),
      conflictContext: z.string().optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { query, conflictContext } = validation.data;
    const mode: ResearchMode = validation.data.mode ?? 'briefing';

    // --- Demo mode: return pre-computed responses when no API key is set ---
    if (isServerDemoMode()) {
      const inputHash = hashInput({ content: query, context: conflictContext });
      if (inputHash) {
        const cached = getCachedResponse('research', inputHash);
        if (cached) return formatAsStreamResponse(cached);
      }
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in environment variables.' }),
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
    return handleRouteError(err, 'research');
  }
});
