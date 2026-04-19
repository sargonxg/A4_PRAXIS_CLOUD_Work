import { streamText } from 'ai';
import { getModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext } from '@/lib/ai/context-builder-server';
import { UN_STYLE_PROMPT } from '@/lib/ai/prompts/un-style';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { handleRouteError } from '@/lib/api/standard-error';
import type { Situation } from '@/types/situation';
import { isServerDemoMode, formatAsStreamResponse } from '@/lib/demo/demo-mode';

export const maxDuration = 60;

export const POST = withCalibration('report', 'ai_report', {
  retrievalQuery: (_req, body) => {
    const sectionType = typeof body.sectionType === 'string' ? body.sectionType : '';
    const ctx = typeof body.conflictContext === 'string' ? body.conflictContext : '';
    return [sectionType, ctx].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, user) => {
  if (isServerDemoMode()) {
    return formatAsStreamResponse('**Demo Mode** — This analysis requires a live AI connection. Set GOOGLE_AI_API_KEY in your environment to enable it.');
  }

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

    // Credits + profile gate already handled by withCalibration above.

    const sitContext = situation ? buildToolContext(situation) : '';
    const situationId = situation?.id ?? '';
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'report').catch(() => '')
      : '';

    // Calibrated analyst-profile + situation-frame + output-constraints
    const { systemPromptBlock, outputConstraints, provenance } = user.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    const result = streamText({
      model: getModel(),
      system: `${systemPromptBlock}

${UN_STYLE_PROMPT}

${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}You are drafting a section of a ${template || 'diplomatic report'}.
Section type: ${sectionType}. Tone: ${tone || 'formal'}.
${conflictContext ? `Conflict context:\n${conflictContext}` : ''}
${existingSections ? `Already drafted sections for coherence:\n${existingSections}` : ''}

Write ONLY the requested section content. Use numbered paragraphs for SG reports. Follow UN editorial standards strictly. Do not include meta-commentary about the drafting process. Honour the analyst profile above and the output-constraints block.${langDirective}${redLineDirective}`,
      messages: [
        { role: 'user', content: `Draft the "${sectionType}" section.` },
      ],
      onFinish: async ({ text }) => {
        if (situationId && user.uid) {
          await saveToolOutput({
            uid: user.uid,
            situationId,
            toolId: 'report',
            profileVersion: provenance.profileVersion,
            output: { sectionType, template, tone, content: text },
          }).catch((err) => console.warn('[report] saveToolOutput failed:', err));
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    return handleRouteError(err, 'report');
  }
});
