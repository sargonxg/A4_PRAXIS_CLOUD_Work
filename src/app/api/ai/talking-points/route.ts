import { streamText } from 'ai';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext } from '@/lib/ai/context-builder-server';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

export const POST = withAuth(async (request, user) => {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { situation, audience, tone, context, situationData } = await request.json() as {
      situation: string | Situation;
      audience: string;
      tone?: string;
      context?: string;
      situationData?: Situation;
    };
    // Accept situation as object (new) or situationData (legacy)
    const sitObj = (typeof situation === 'object' && situation !== null ? situation : situationData) as Situation | undefined;
    const sitContext = sitObj ? buildToolContext(sitObj) : '';
    const situationId = sitObj?.id ?? '';

    const creditCheck = await checkAndDeductCredits('ai_talking_points', 'Talking points');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Graph context ---
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'talking_points')
      : '';

    const enrichedSystem = graphCtx
      ? `${graphCtx}\n\n${sitContext ? `${sitContext}\n\n` : ''}${DIPLOMATIC_SYSTEM_PROMPT}`
      : sitContext ? `${sitContext}\n\n${DIPLOMATIC_SYSTEM_PROMPT}` : DIPLOMATIC_SYSTEM_PROMPT;

    const result = streamText({
      model: getProModel(),
      system: enrichedSystem,
      messages: [
        {
          role: 'user',
          content: `Generate structured diplomatic talking points for the following:

Situation: ${typeof situation === 'string' ? situation : sitObj?.name || 'Unknown'}
Audience: ${audience}
Tone: ${tone || 'formal and balanced'}
${context ? `Additional context: ${context}` : ''}

Format your response as:
## Key Messages (3-5 headline points)
## Supporting Arguments (evidence and rationale for each key message)
## Anticipated Questions & Suggested Responses (3-5 Q&A pairs)
## Points to Avoid (sensitive areas to navigate carefully)

Adhere strictly to UN diplomatic language standards. Be precise, balanced, and appropriate to the audience.`,
        },
      ],
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Talking points route error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate talking points' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
