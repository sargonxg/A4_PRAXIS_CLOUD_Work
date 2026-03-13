import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

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
    const { query, conflictContext } = await request.json();

    // Use Google Search grounding for real-time research results.
    // This route is dedicated to structured research queries from the Research panel.
    const model = google('gemini-2.5-flash', {
      useSearchGrounding: true,
    });

    const result = streamText({
      model,
      system: `You are PRAXIS Research Engine, a conflict intelligence research assistant with access to Google Search for real-time information.

When researching a query:
1. Search for the most recent and authoritative sources
2. Cite specific sources with outlet name and date: "[Reuters, 2026-03-10]: ..."
3. Assess source reliability — distinguish between wire services, quality broadsheets, state media, and think tanks
4. Note any conflicting reports between sources
5. Identify critical information gaps
6. Flag time-sensitivity of information (how quickly is this evolving?)
7. Cross-reference claims across multiple sources before treating as confirmed

${conflictContext ? `Current analytical context: ${conflictContext}` : ''}

Format your response with clear sections:
## Key Findings
## Sources & Reliability Assessment
## Analysis
## Information Gaps
## Recommendations for Further Research`,
      prompt: query,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Research route error:', err);
    return new Response(JSON.stringify({ error: 'Research request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
