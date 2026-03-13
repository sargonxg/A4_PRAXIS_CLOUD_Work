import { streamText, stepCountIs } from 'ai';
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
    const { messages, conflictContext } = await request.json();

    // Append conflict context to system prompt when the user has selected a conflict
    const systemPrompt = conflictContext
      ? `${DIPLOMATIC_SYSTEM_PROMPT}

## Active Conflict Context
The user is currently analyzing: **${conflictContext}**
When responding to questions about this conflict, proactively use the queryConflictGraph tool to retrieve real structured data before answering.`
      : DIPLOMATIC_SYSTEM_PROMPT;

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      messages,
      tools: tacitusTools,
      stopWhen: stepCountIs(5),
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
