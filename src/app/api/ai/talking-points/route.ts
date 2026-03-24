import { streamText } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in Vercel environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { situation, audience, tone, context, situationData } = await request.json() as {
      situation: string;
      audience: string;
      tone?: string;
      context?: string;
      situationData?: Situation;
    };
    const sitContext = situationData ? buildToolContext(situationData) : '';

    const creditCheck = await checkAndDeductCredits('ai_talking_points', 'Talking points');
    if (!creditCheck.allowed) return creditCheck.response;

    const result = streamText({
      model: getModel(),
      system: sitContext ? `${sitContext}\n\n${DIPLOMATIC_SYSTEM_PROMPT}` : DIPLOMATIC_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate structured diplomatic talking points for the following:

Situation: ${situation}
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
}
