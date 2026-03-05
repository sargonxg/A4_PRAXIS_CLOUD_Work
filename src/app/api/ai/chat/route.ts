import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { tacitusTools } from '@/lib/ai/tools';

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
    const { messages } = await request.json();

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: DIPLOMATIC_SYSTEM_PROMPT,
      messages,
      tools: tacitusTools,
      maxSteps: 5,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Chat route error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
