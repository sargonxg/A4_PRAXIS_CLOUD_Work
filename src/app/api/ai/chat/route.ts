import { streamText, stepCountIs } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { tacitusTools } from '@/lib/ai/tools';
import { isServerDemoMode, hashInput, getCachedResponse, formatAsStreamResponse } from '@/lib/demo/demo-mode';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { messages, conflictContext } = await request.json();

    // --- Demo mode: return pre-computed responses when no API key is set ---
    if (isServerDemoMode()) {
      const lastMessage = messages?.[messages.length - 1];
      const userContent = typeof lastMessage?.content === 'string' ? lastMessage.content : '';

      // Determine the route key based on the message content
      const inputHash = hashInput({ content: userContent, context: conflictContext });

      if (inputHash) {
        // Try chat-specific responses first, then scenario/escalation/talking points
        const routeKeys = ['chat', 'scenario', 'escalation', 'talking_points', 'dashboard'];
        for (const routeKey of routeKeys) {
          const cached = getCachedResponse(routeKey, inputHash);
          if (cached) {
            return formatAsStreamResponse(cached);
          }
        }
      }

      // If no cached response matched, return the greeting as a fallback
      const greeting = getCachedResponse('chat', 'greeting');
      if (greeting) {
        return formatAsStreamResponse(greeting);
      }

      // Final fallback if somehow the cache is empty
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in Vercel environment variables.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Live mode: use the AI provider ---

    // Append conflict context to system prompt when the user has selected a conflict
    const systemPrompt = conflictContext
      ? `${DIPLOMATIC_SYSTEM_PROMPT}

## Active Conflict Context
The user is currently analyzing: **${conflictContext}**
When responding to questions about this conflict, proactively use the queryConflictGraph tool to retrieve real structured data before answering.`
      : DIPLOMATIC_SYSTEM_PROMPT;

    const result = streamText({
      model: getModel(),
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
