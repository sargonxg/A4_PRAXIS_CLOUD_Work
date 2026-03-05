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
    const { topic, type, keyPoints, strength } = await request.json();

    const strengthGuide = {
      strong: 'Use strong action language: Demands, Decides, Requires, Determines, Condemns.',
      moderate: 'Use moderate language: Calls upon, Urges, Requests, Stresses, Reiterates.',
      weak: 'Use soft language: Encourages, Invites, Notes, Welcomes, Acknowledges.',
    }[strength as 'strong' | 'moderate' | 'weak'] ?? 'Use moderate language: Calls upon, Urges, Requests.';

    const typeInstruction = {
      preambular: 'Draft ONLY preambular paragraphs. Each paragraph must begin with a present participle (Recalling, Expressing, Reaffirming, Noting, Welcoming, etc.) and end with a comma.',
      operative: 'Draft ONLY operative paragraphs. Each numbered paragraph must begin with an action verb. End each paragraph with a semicolon (except the final paragraph which ends with a period).',
      full: 'Draft a complete resolution with BOTH preambular paragraphs (ending with commas) AND numbered operative paragraphs (ending with semicolons, except the last).',
    }[type as 'preambular' | 'operative' | 'full'] ?? 'Draft a complete resolution.';

    const result = streamText({
      model: google('gemini-2.5-flash'),
      system: UN_STYLE_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Draft UN Security Council resolution language on: ${topic}

${typeInstruction}
${strengthGuide}

Key points to address:
${keyPoints?.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n') || '- Address the core situation\n- Protect civilian populations\n- Support diplomatic efforts'}

Follow UN Security Council resolution format precisely. Include standard preambular language referencing the UN Charter, relevant previous resolutions, and the Secretary-General's reports. This is draft language for review — note this at the end.`,
        },
      ],
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error('Resolution route error:', err);
    return new Response(JSON.stringify({ error: 'Failed to draft resolution language' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
