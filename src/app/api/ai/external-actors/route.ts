import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
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

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const requestSchema = z.object({ situation: situationContextSchema.optional() });
    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation } = validation.data;
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    if (isServerDemoMode()) return NextResponse.json(DEMO_RESPONSE);
    const creditCheck = await checkAndDeductCredits('ai_external_actors', 'External actor monitor');
    if (!creditCheck.allowed) return creditCheck.response;

    const graphCtx = situationId ? await buildGraphContext(user.uid, situationId, 'external_actors') : '';
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'external-actors', user.uid
        )
      : '';

    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: ExternalActorsSchema }),
      system: 'You are a senior intelligence analyst specializing in transnational conflict dimensions, proxy warfare, and diaspora mobilization. Apply Salehyan proxy war theory and Gleditsch transnational conflict framework.',
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
Map all external actors involved in or affecting this conflict.

For each external actor identify: type (state/diaspora/proxy/ingo/multilateral/regional-body), involvement modes (military/financial/diplomatic/informational/humanitarian), alignment, leverage held over domestic parties, likelihood of engagement with peace process, and conditions under which they might withdraw support.

Also assess: remittance and arms flows, diplomatic interventions, and key findings. Cite sources from web intelligence for all claims.`,
    });

    if (situationId) await writeToolDataServer(user.uid, situationId, 'external-actors', result.output as Record<string, unknown>);
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'external-actors');
  }
});
