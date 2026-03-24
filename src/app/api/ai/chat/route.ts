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

    // Build situation-aware system prompt with super-agent capabilities
    let systemPrompt = DIPLOMATIC_SYSTEM_PROMPT;

    // Add super-agent instructions
    systemPrompt += `\n\n## PRAXIS Super-Agent Mode
You are the central intelligence hub for this user's work. You can and should:

1. **Research extensively** — Use webSearch proactively to find current information. Always start with Wikipedia for background context, then search for recent developments from Reuters, Crisis Group, ACLED, and UN sources.

2. **Answer ANY question** — You know the user's situation intimately. Answer questions about actors, dynamics, risks, history, legal frameworks, humanitarian status, and media coverage. If you don't have the information, use webSearch to find it.

3. **Generate content for any tool** — When users ask you to populate tools (briefings, risk assessments, scenarios, talking points), produce the structured content they need.

4. **Adapt to the user's role** — Tailor your responses:
   - **Analyst**: Provide evidence-based assessments with confidence levels
   - **Mediator**: Focus on process design, party positions, ZOPA/BATNA
   - **Observer**: Neutral monitoring, early warning indicators
   - **Advisor**: Policy recommendations, strategic options
   - **Researcher**: Academic rigor, citations, comparative analysis

5. **Be proactive** — Don't just answer questions. Suggest related analyses, flag risks, recommend next steps. If you see a gap in the user's knowledge, offer to fill it.

6. **Ground everything in evidence** — Cite sources. Use document excerpts when available. Flag uncertainty. Never fabricate facts about real conflicts.`;

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
      stopWhen: stepCountIs(8),
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
