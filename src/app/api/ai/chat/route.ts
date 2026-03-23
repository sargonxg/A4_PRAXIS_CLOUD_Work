import { streamText, stepCountIs } from 'ai';
import { getModel, getModelForUser } from '@/lib/ai/providers';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { tacitusTools } from '@/lib/ai/tools';
import { buildSituationContext } from '@/lib/ai/situation-context';
import { isServerDemoMode, hashInput, getCachedResponse, formatAsStreamResponse } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { retrieveRelevantChunks } from '@/lib/firebase/documents-service';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { messages, conflictContext, situation, aiSettings } = await request.json();

    // --- Demo mode ---
    if (isServerDemoMode()) {
      const lastMessage = messages?.[messages.length - 1];
      const userContent = typeof lastMessage?.content === 'string' ? lastMessage.content : '';
      const inputHash = hashInput({ content: userContent, context: conflictContext });

      if (inputHash) {
        const routeKeys = ['chat', 'scenario', 'escalation', 'talking_points', 'dashboard'];
        for (const routeKey of routeKeys) {
          const cached = getCachedResponse(routeKey, inputHash);
          if (cached) return formatAsStreamResponse(cached);
        }
      }

      const greeting = getCachedResponse('chat', 'greeting');
      if (greeting) return formatAsStreamResponse(greeting);

      return new Response(
        JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in Vercel environment variables.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Live mode ---
    const creditCheck = await checkAndDeductCredits('ai_chat', 'Chat message');
    if (!creditCheck.allowed) return creditCheck.response;

    // Build situation-aware system prompt
    let systemPrompt = DIPLOMATIC_SYSTEM_PROMPT;

    if (situation) {
      const sit = situation as Situation;
      systemPrompt += '\n\n' + buildSituationContext(sit);
    } else if (conflictContext) {
      systemPrompt += `\n\n## Active Conflict Context\nThe user is analyzing: **${conflictContext}**\nUse queryConflictGraph to retrieve structured data before answering.`;
    }

    // --- RAG: retrieve relevant document chunks for context ---
    if (situation && !situation.isDemo) {
      try {
        const lastMessage = messages?.[messages.length - 1];
        const query = typeof lastMessage?.content === 'string' ? lastMessage.content : '';
        if (query && situation.id) {
          // Try to get the auth cookie to extract uid
          const cookie = request.headers.get('cookie') || '';
          const sessionMatch = cookie.match(/tacitus-auth-session=([^;]+)/);
          if (sessionMatch) {
            const sessionData = JSON.parse(decodeURIComponent(sessionMatch[1]));
            if (sessionData?.uid) {
              const chunks = await retrieveRelevantChunks(sessionData.uid, situation.id, query, { maxChunks: 5 });
              if (chunks.length > 0) {
                const ragContext = chunks.map((c) =>
                  `[Source: ${c.documentTitle}]\n${c.text}`
                ).join('\n\n---\n\n');
                systemPrompt += `\n\n## Relevant Document Excerpts\nThe following excerpts from the user's uploaded documents are relevant to the current query. Use these to ground your response:\n\n${ragContext}`;
              }
            }
          }
        }
      } catch (ragErr) {
        console.error('[chat] RAG retrieval failed (non-fatal):', ragErr);
        // Continue without RAG — non-fatal
      }
    }

    // Select model based on user preferences
    const model = aiSettings ? getModelForUser(aiSettings) : getModel();

    const result = streamText({
      model,
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
