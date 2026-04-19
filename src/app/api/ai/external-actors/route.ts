import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const ExternalActorsSchema = z.object({
  summary: z.string(),
  externalActors: z.array(z.object({
    name: z.string(),
    type: z.enum(['state', 'diaspora', 'proxy', 'ingo', 'multilateral', 'regional-body']),
    involvement: z.array(z.enum(['military', 'financial', 'diplomatic', 'informational', 'humanitarian'])),
    alignment: z.enum(['pro-party-a', 'pro-party-b', 'neutral', 'spoiler', 'mediator']),
    leverage: z.string(),
    engagementLikelihood: z.enum(['very-likely', 'likely', 'unlikely', 'very-unlikely']),
    conditionsForWithdrawal: z.string().optional(),
    source: z.string(),
  })),
  remittanceFlows: z.string().optional(),
  armsFlows: z.string().optional(),
  diplomaticInterventions: z.array(z.string()),
  keyFindings: z.array(z.string()),
  recommendations: z.array(z.string()),
  intelligenceGaps: z.array(z.string()),
});

const DEMO_RESPONSE = {
  summary: 'Two primary external actors (Karovia, Westmark) and a significant diaspora network are materially sustaining the Nordalia conflict.',
  externalActors: [
    {
      name: 'Karovia',
      type: 'state' as const,
      involvement: ['military' as const, 'financial' as const],
      alignment: 'pro-party-b' as const,
      leverage: 'DRM relies on Karovian logistics and financing for 40% of operational budget',
      engagementLikelihood: 'likely' as const,
      source: 'Crisis Group Report #347',
    },
    {
      name: 'Nordalia Diaspora (Westmark)',
      type: 'diaspora' as const,
      involvement: ['financial' as const, 'informational' as const],
      alignment: 'pro-party-b' as const,
      leverage: 'Est. $12M/year remittance flow to DRM',
      engagementLikelihood: 'unlikely' as const,
      source: 'UNMN Panel of Experts 2025',
    },
  ],
  remittanceFlows: 'Estimated $12-18M/year from Westmark diaspora to DRM-affiliated organizations.',
  armsFlows: 'UN Panel documented Karovian small arms transfers in Q3 2025 in violation of UNSC arms embargo.',
  diplomaticInterventions: [
    'Karovian Foreign Minister trilateral proposal (January 2026)',
    'Westmark humanitarian corridor proposal (February 2026)',
  ],
  keyFindings: [
    'Karovia is the primary conflict sustainer and holds leverage over DRM',
    'Diaspora financing is significant but diffuse',
  ],
  recommendations: [
    'Engage Karovia through backchannel on conditions for support withdrawal',
    'Strengthen UN arms embargo monitoring',
  ],
  intelligenceGaps: [
    'Exact financial transfer mechanisms',
    'Karovian domestic politics driving intervention',
  ],
};

export const POST = withCalibration('external_actors', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    return [s?.name, s?.region].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const body = await request.json();
    const requestSchema = z.object({ situation: situationContextSchema.optional() });
    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation } = validation.data;
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    if (isServerDemoMode()) return NextResponse.json(DEMO_RESPONSE);
    // Credits + profile gate already handled by withCalibration above.

    const graphCtx = situationId ? await buildGraphContext(ctx.uid, situationId, 'external_actors') : '';
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'external-actors', ctx.uid
        )
      : '';

    // --- Calibrated system prompt ---
    const { systemPromptBlock, outputConstraints, provenance } = ctx.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    const result = await callProModel({
      output: Output.object({ schema: ExternalActorsSchema }),
      system: `You are a senior intelligence analyst specializing in transnational conflict dimensions, proxy warfare, and diaspora mobilization. Apply Salehyan proxy war theory and Gleditsch transnational conflict framework.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
Map all external actors involved in or affecting this conflict.

For each external actor identify: type (state/diaspora/proxy/ingo/multilateral/regional-body), involvement modes (military/financial/diplomatic/informational/humanitarian), alignment, leverage held over domestic parties, likelihood of engagement with peace process, and conditions under which they might withdraw support.

Also assess: remittance and arms flows, diplomatic interventions, and key findings. Cite sources from web intelligence for all claims.`,
    });

    if (situationId) {
      await writeToolDataServer(ctx.uid, situationId, 'external-actors', result.output as Record<string, unknown>);
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'external_actors',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[external_actors] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'external-actors');
  }
});
