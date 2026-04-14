import { streamText } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { UN_STYLE_PROMPT } from '@/lib/ai/prompts/un-style';
import { buildToolContext } from '@/lib/ai/situation-context';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { withAuth } from '@/lib/api/with-auth';
import type { Situation } from '@/types/situation';
import { isServerDemoMode, formatAsStreamResponse } from '@/lib/demo/demo-mode';

export const maxDuration = 120;

export const POST = withAuth(async (request, _user) => {
  if (isServerDemoMode()) {
    return formatAsStreamResponse('**Demo Mode** — This analysis requires a live AI connection. Set GOOGLE_AI_API_KEY in your environment to enable it.');
  }

  if (!process.env.GOOGLE_AI_API_KEY && !process.env.GOOGLE_VERTEX_PROJECT) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { topic, type, keyPoints, strength, situation } = body as {
      topic?: string;
      type?: 'preambular' | 'operative' | 'full';
      keyPoints?: string[];
      strength?: 'strong' | 'moderate' | 'weak';
      situation?: Situation;
    };

    const creditCheck = await checkAndDeductCredits('ai_resolution', 'Resolution drafting');
    if (!creditCheck.allowed) return creditCheck.response;

    // Build situation context block — grounds the resolution in the active conflict
    const sitContext = situation ? buildToolContext(situation) : '';

    const strengthGuide = {
      strong: 'Use strong action language: Demands, Decides, Requires, Determines, Condemns.',
      moderate: 'Use moderate language: Calls upon, Urges, Requests, Stresses, Reiterates.',
      weak: 'Use soft language: Encourages, Invites, Notes, Welcomes, Acknowledges.',
    }[strength ?? 'moderate'];

    const typeInstruction = {
      preambular: 'Draft ONLY preambular paragraphs. Each paragraph must begin with a present participle (Recalling, Expressing, Reaffirming, Noting, Welcoming, Bearing in mind, Deeply concerned, etc.) and end with a comma.',
      operative: 'Draft ONLY operative paragraphs. Each numbered paragraph must begin with an action verb. End each paragraph with a semicolon, except the final paragraph which ends with a period.',
      full: 'Draft a complete resolution with BOTH preambular paragraphs (ending with commas) AND numbered operative paragraphs (ending with semicolons, except the last).',
    }[type ?? 'full'];

    // Derive resolution subject from situation if no explicit topic given
    const resolvedTopic = topic?.trim()
      || (situation ? `the situation in ${situation.region || situation.name}, involving ${situation.actors.slice(0, 3).join(', ')}` : 'the situation under review');

    const keyPointsBlock = keyPoints?.filter(Boolean).length
      ? keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')
      : situation
        ? `- Address the root causes of the conflict between ${situation.actors.slice(0, 2).join(' and ')}
- Protect civilian populations from further harm (IHL compliance)
- Support diplomatic efforts and any existing ceasefire frameworks
- Call for humanitarian access and protection of civilians
- Address accountability mechanisms where relevant`
        : '- Address the core situation\n- Protect civilian populations\n- Support diplomatic efforts';

    const result = streamText({
      model: getModel(),
      system: UN_STYLE_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${sitContext ? `${sitContext}\n\n---\n\n` : ''}Draft UN Security Council resolution language on: ${resolvedTopic}

${typeInstruction}
${strengthGuide}

Key points to address:
${keyPointsBlock}

Instructions:
- Reference the specific situation, named actors, and relevant geography from the situation context above
- Cite relevant previous UNSC resolutions by number where appropriate (e.g., resolution 2417 on food insecurity in armed conflict)
- Reference the UN Charter provisions applicable to this situation (Chapter VI for peaceful settlement, Chapter VII for enforcement)
- Include preambular references to Secretary-General's reports and relevant UN mechanisms
- For operative paragraphs, sequence from political/diplomatic actions → humanitarian → accountability → reporting

This is draft language for expert review — note this explicitly at the end.`,
        },
      ],
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('[resolution] Route error:', err);
    return new Response(JSON.stringify({ error: 'Failed to draft resolution language' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
