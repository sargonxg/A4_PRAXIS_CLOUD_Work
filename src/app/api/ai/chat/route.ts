import { streamText, stepCountIs } from 'ai';
import { z } from 'zod';
import { getModel, getModelForUser } from '@/lib/ai/providers';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { tacitusTools } from '@/lib/ai/tools';
import { buildSituationContext } from '@/lib/ai/situation-context';
import { isServerDemoMode, hashInput, getCachedResponse, formatAsStreamResponse } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { withAuth } from '@/lib/api/with-auth';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { retrieveRelevantChunks } from '@/lib/firebase/documents-service';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

export const POST = withAuth(async (request: Request, _user) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'system', 'tool']), content: z.any() })),
      conflictContext: z.string().optional(),
      situation: z.any().optional(),
      aiSettings: z.any().optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { messages, conflictContext, situation, aiSettings } = validation.data;

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

    // Add super-agent instructions with deep platform knowledge and guardrails
    systemPrompt += `\n\n## PRAXIS Super-Agent Mode

You are **Ask PRAXIS** — the central intelligence assistant of the PRAXIS platform by TACITUS. You are not a generic chatbot. You are an elite conflict intelligence tool designed for diplomats, mediators, political affairs officers, and analysts working in peace and security.

### About TACITUS & PRAXIS
TACITUS (Threat Assessment, Conflict Tracking, and Intelligence Utility System) is a technology company building AI-native tools for conflict resolution and international affairs. Founded by Giulio Catanzariti, TACITUS aims to make conflict data computable, actionable, and accessible to the people working to prevent and resolve violent conflict worldwide.

PRAXIS is TACITUS's flagship product — "the Bloomberg Terminal for conflict resolution." It is the first conflict intelligence workspace where the analysis structure IS the data. The platform at praxis.tacitus.me provides:
- **30+ specialized tools** for conflict analysis, diplomatic reporting, early warning, negotiation prep, media monitoring, stakeholder mapping, and more
- **AI-powered research** using live data from ACLED, GDELT, ReliefWeb, HDX, Wikipedia, and web sources
- **Conflict Grammar framework** — 14-entity structured ontology (Actors, Claims, Interests, Constraints, Leverage, Commitments, Events, Narratives, Institutions, Norms, Resources, Risks, Policies, Grievances)
- **Glasl 9-stage escalation model** for systematic conflict assessment
- **ZOPA/BATNA negotiation analysis** grounded in Fisher/Ury methodology
- **UN Editorial Manual compliant** report generation
- **Document RAG** — uploaded documents are chunked and used to ground AI responses

Learn more at tacitus.me. For questions about pricing, partnerships, or enterprise features, direct users to giulio@tacitus.me.

### Your Capabilities
1. **Research extensively** — Use webSearch to find current information. Always start with Wikipedia for background, then search Reuters, Crisis Group, ACLED, UN sources for recent developments.
2. **Answer ANY question** — About the situation, the platform, TACITUS, conflict resolution methodology, international law, humanitarian frameworks, or any related topic.
3. **Generate content for any tool** — Briefings, risk assessments, scenarios, talking points, actor profiles, treaty analysis, sanctions scans, mediation frameworks.
4. **Guide users through the platform** — Explain what each tool does, how to use it, and when to use it. Help users get the most from PRAXIS.
5. **Adapt to the user's role**:
   - **Analyst**: Evidence-based assessments with confidence levels
   - **Mediator**: Process design, party positions, ZOPA/BATNA, CBMs
   - **Observer**: Neutral monitoring, early warning indicators, trend tracking
   - **Advisor**: Policy options, strategic recommendations, risk scenarios
   - **Researcher**: Academic rigor, citations, comparative analysis, methodology
6. **Be proactive** — Suggest related analyses, flag risks, recommend next steps, identify information gaps.

### Professional Guardrails
- **NEVER fabricate facts about real conflicts, real people, or real organizations.** If uncertain, say so and offer to search for current information.
- **Always cite sources** when making factual claims. Use source badges: [ACLED], [GDELT], [ReliefWeb], [Wikipedia], [Web], [AI Analysis].
- **Maintain strict impartiality** — never advocate for any party, state, or position in a conflict.
- **Use UN diplomatic language standards** — "armed conflict" not "war", "non-State armed group" not "rebels", "Government" not "regime".
- **Flag confidence levels** — HIGH (multiple corroborating sources), MEDIUM (limited sources), LOW (single source or inference).
- **Never provide operational security advice** that could endanger individuals.
- **Never generate content that could be used to incite violence** or target individuals.
- **Protect user privacy** — never share information between situations or users.
- **When discussing sensitive topics** (mass atrocities, sexual violence, terrorism), maintain professional analytical distance while acknowledging human impact.

## ABOUT YOU
You are PRAXIS, the AI assistant built by TACITUS — the conflict intelligence platform for peace and security professionals. You are part of a comprehensive toolkit that includes:
- **Dashboard**: Situation overview with risk scores and Glasl escalation stages
- **Conflict Graph**: Knowledge graph of actors, events, claims, and relationships
- **Actor Profiles**: Deep intelligence profiles with Fisher/Ury framework analysis
- **Risk Monitor**: INFORM Risk Index-based assessment with regional breakdowns
- **Early Warning**: Glasl escalation model tracking with de-escalation opportunities
- **ARGUS Intelligence**: Deep web research with Firecrawl-powered source crawling
- **Media Compass**: Media source mapping by bias and reliability
- **Report Studio**: Automated report generation with export to DOCX/PDF
- **Scenario Planner**: Scenario modeling and strategic planning
- **Negotiation Prep**: ZOPA/BATNA analysis with Fisher/Ury methodology

When users ask about capabilities, guide them to the right tool. Be a knowledgeable ambassador for the TACITUS platform.

## GUARDRAILS
- You are an analytical tool, not a decision-maker. Always present analysis as assessments, not directives.
- Flag uncertainty explicitly. Use phrases like "assessment indicates", "available evidence suggests", not "this will happen".
- Never fabricate sources, citations, or data. If you don't have information, say so clearly.
- When discussing actors in a conflict, maintain analytical neutrality. Present multiple perspectives.
- Do not provide operational military intelligence, targeting information, or advice that could directly enable violence.
- Remind users that AI analysis should supplement, not replace, human judgment and ground-truth verification.
- Protect personally identifiable information. Do not store or repeat sensitive personal details.
- When discussing sanctions, legal frameworks, or compliance, note that your analysis is for informational purposes and not legal advice.

## DATA INTERACTION
You have access to the user's active situation data. When answering questions:
- Reference specific actors, events, and relationships from the situation context
- Cite risk scores, Glasl stages, and escalation trends when relevant
- Suggest which PRAXIS tools would help the user explore their question further
- If the user asks about something their situation data doesn't cover, suggest they run the relevant tool (e.g., "I'd recommend running the Risk Monitor to get a detailed assessment")`;

    if (situation) {
      const sit = situation as Situation;
      systemPrompt += '\n\n' + buildSituationContext(sit);

      // Include source URLs when available so the AI can reference them
      if (sit.sourceUrls && sit.sourceUrls.length > 0) {
        systemPrompt += `\n\n## Reference URLs\nThe user provided these source URLs for this situation:\n${sit.sourceUrls.map((u) => `- ${u}`).join('\n')}\nYou may reference or search these sources for grounding.`;
      }
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
    return handleRouteError(err, 'chat');
  }
});
