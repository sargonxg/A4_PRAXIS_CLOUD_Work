import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { UN_STYLE_PROMPT } from '@/lib/ai/prompts/un-style';

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
    const { sectionType, template, tone, conflictContext, existingSections } = await request.json();

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: `${UN_STYLE_PROMPT}\n\nYou are drafting a section of a ${template || 'diplomatic report'}.
Section type: ${sectionType}. Tone: ${tone || 'formal'}.
${conflictContext ? `Conflict context:\n${conflictContext}` : ''}
${existingSections ? `Already drafted sections for coherence:\n${existingSections}` : ''}

Write ONLY the requested section content. Use numbered paragraphs for SG reports. Follow UN editorial standards strictly. Do not include meta-commentary about the drafting process.`,
      messages: [
        { role: 'user', content: `Draft the "${sectionType}" section.` },
      ],
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error('Report route error:', err);
    return new Response(JSON.stringify({ error: 'Failed to generate report section' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
