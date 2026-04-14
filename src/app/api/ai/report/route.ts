import { streamText } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext } from '@/lib/ai/context-builder-server';
import { UN_STYLE_PROMPT } from '@/lib/ai/prompts/un-style';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

export const POST = withAuth(async (request, user) => {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'AI service not configured. Set GOOGLE_AI_API_KEY in environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { sectionType, template, tone, conflictContext, existingSections, situation } = await request.json() as {
      sectionType?: string;
      template?: string;
      tone?: string;
      conflictContext?: string;
      existingSections?: string;
      situation?: Situation;
    };

    const creditCheck = await checkAndDeductCredits('ai_report', 'Report generation');
    if (!creditCheck.allowed) return creditCheck.response;

    const sitContext = situation ? buildToolContext(situation) : '';
    const situationId = situation?.id ?? '';
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'report').catch(() => '')
      : '';

    const result = streamText({
      model: getModel(),
      system: `${UN_STYLE_PROMPT}\n\n${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}You are drafting a section of a ${template || 'diplomatic report'}.
Section type: ${sectionType}. Tone: ${tone || 'formal'}.
${conflictContext ? `Conflict context:\n${conflictContext}` : ''}
${existingSections ? `Already drafted sections for coherence:\n${existingSections}` : ''}

Write ONLY the requested section content. Use numbered paragraphs for SG reports. Follow UN editorial standards strictly. Do not include meta-commentary about the drafting process.`,
      messages: [
        { role: 'user', content: `Draft the "${sectionType}" section.` },
      ],
    });

    return result.toTextStreamResponse();
  } catch (err) {
    return handleRouteError(err, 'report');
  }
});
