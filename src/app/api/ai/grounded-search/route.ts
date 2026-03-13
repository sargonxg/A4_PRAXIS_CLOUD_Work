import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || '',
});

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages, conflictContext } = await request.json();

    // Google Search grounding via providerOptions (correct API for @ai-sdk/google v3.x).
    // NOTE: useSearchGrounding conflicts with custom tools (SDK issue #8258), so this
    // route is separate from /api/ai/chat which uses the custom tacitusTools registry.
    const result = streamText({
      model: google('gemini-2.5-flash'),
      providerOptions: {
        google: { useSearchGrounding: true },
      },
      system: `${DIPLOMATIC_SYSTEM_PROMPT}

## Live Research Mode
You are operating in Live Research mode with access to Google Search for real-time information.

CURRENT CONFLICT CONTEXT (from PRAXIS knowledge graph):
${conflictContext || 'No specific conflict selected. Answering based on general international affairs knowledge and live search.'}

## Research Instructions
Use Google Search proactively to find current information. When answering:
1. Search for recent news and developments relevant to the query
2. Cite sources explicitly: mention the outlet name, date, and key claim
3. Assess source reliability using the TACITUS media credibility framework
4. Identify conflicting reports across different sources and note them
5. Flag information that is time-sensitive or rapidly evolving
6. Note important information gaps where reliable sourcing is absent
7. Look for institutional statements (UN, AU, EU, OSCE, IGAD, ECOWAS) when relevant

## Response Format
Structure responses with:
- **Key Findings** — what the search reveals right now
- **Source Assessment** — reliability and perspective of sources found
- **Analysis** — what this means for the conflict or topic
- **Information Gaps** — what remains unknown or unverified
- **Time Sensitivity** — note if information may change rapidly

When citing: "[Source Name, Date]: claim or finding"`,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Grounded search route error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
