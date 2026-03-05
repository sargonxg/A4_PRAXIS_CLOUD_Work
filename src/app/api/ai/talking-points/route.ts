import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || '',
});

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in Vercel environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { situation, audience, tone, context } = await request.json();

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: DIPLOMATIC_SYSTEM_PROMPT,
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

    return result.toDataStreamResponse();
  } catch (err) {
    console.error('Talking points route error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate talking points' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
