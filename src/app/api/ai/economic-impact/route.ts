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

const EconomicImpactSchema = z.object({
  summary: z.string(),
  macroIndicators: z.object({
    gdpGrowthDeviation: z.string(),
    inflationRate: z.string(),
    unemploymentRate: z.string(),
    tradeBalanceImpact: z.string(),
    debtGdpRatio: z.string(),
  }),
  sanctionsImpact: z.object({
    regimesApplicable: z.array(z.string()),
    sectorEffects: z.array(z.string()),
    humanitarianExemptions: z.string(),
  }).optional(),
  reconstructionEstimate: z.object({
    infrastructure: z.string(),
    institutional: z.string(),
    social: z.string(),
    total: z.string(),
  }).optional(),
  warEconomyActors: z.array(z.object({
    actor: z.string(),
    benefitFromConflict: z.string(),
    stakeInPeace: z.string(),
  })).optional(),
  peaceDividend: z.object({
    gdpGainEstimate: z.string(),
    employmentCreation: z.string(),
    timeframe: z.string(),
  }).optional(),
  recommendations: z.array(z.string()),
  intelligenceGaps: z.array(z.string()),
});

const DEMO_RESPONSE = {
  summary: 'The the selected situation conflict has caused severe macroeconomic deterioration — currency down 36.4%, growth running 7-9 percentage points below pre-conflict trend — with a war economy emerging around rare earth extraction in eastern provinces.',
  macroIndicators: {
    gdpGrowthDeviation: 'GDP growth estimated at -4.2% vs pre-conflict trend of +3.1% (deviation: -7.3pp)',
    inflationRate: 'Consumer price inflation at 34.7% annualised, driven by fuel and food import disruption',
    unemploymentRate: 'National unemployment estimated at 31%, rising to 58% in conflict-affected eastern provinces',
    tradeBalanceImpact: 'Trade deficit widened by est. $2.1B as rare earth exports disrupted and import costs rise',
    debtGdpRatio: 'Public debt at 78% of GDP, up from 51% pre-conflict; debt service consuming 38% of government revenue',
  },
  sanctionsImpact: {
    regimesApplicable: ['Westmark targeted sanctions on 23 GoN officials (asset freeze, travel ban)', 'UN arms embargo (UNSC Resolution 2847)'],
    sectorEffects: ['Financial sector: correspondent banking relationships under pressure', 'Defence procurement: constrained but circumvented via Karovian intermediaries', 'Rare earth exports: sanctions not applied, creating revenue asymmetry'],
    humanitarianExemptions: 'Westmark sanctions include humanitarian exemptions; OFAC general licence covers food, medicine, and INGO operations.',
  },
  reconstructionEstimate: {
    infrastructure: 'Est. $4.2B (roads, energy grid, water — Kessara district alone $1.1B)',
    institutional: 'Est. $0.8B (judiciary, civil service reconstitution, elections)',
    social: 'Est. $1.4B (IDP return and reintegration, education, health recovery)',
    total: 'Est. $6.4B over 5 years, equivalent to 2.1x pre-conflict annual GDP',
  },
  warEconomyActors: [
    {
      actor: 'DRM Eastern Command',
      benefitFromConflict: 'Controls rare earth extraction in eastern provinces; est. $180M/year revenue from informal exports via Karovia',
      stakeInPeace: 'Dependent on continued Karovian market access; formal peace would require revenue-sharing agreement',
    },
    {
      actor: 'Cross-border traders (Karovian border)',
      benefitFromConflict: 'Profit from arbitrage between conflict-depressed the selected situationn prices and regional market rates',
      stakeInPeace: 'Would lose arbitrage margins but gain from restored formal trade volumes',
    },
  ],
  peaceDividend: {
    gdpGainEstimate: 'Est. +5.8% GDP growth uplift in years 1-3 post-ceasefire consolidation (World Bank FCV comparators)',
    employmentCreation: 'Est. 340,000 jobs in construction, agriculture, and services over 5 years with reconstruction investment',
    timeframe: '3-5 years to return to pre-conflict GDP levels, contingent on rare earth revenue-sharing agreement',
  },
  recommendations: [
    'Negotiate rare earth revenue-sharing as core economic confidence-building measure',
    'Engage IMF on emergency financing facility for macro stabilisation',
    'Establish joint damage and needs assessment (World Bank/UN/EU methodology) immediately',
    'Apply targeted sanctions on war economy actors profiting from rare earth extraction without expanding humanitarian restrictions',
  ],
  intelligenceGaps: [
    'Actual DRM rare earth export revenues and financial flows to Karovia',
    'Household-level welfare data in DRM-controlled territories',
  ],
};

export const POST = withCalibration('economic_impact', 'ai_analysis', {
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

    const graphCtx = situationId ? await buildGraphContext(ctx.uid, situationId, 'economic_impact') : '';
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'economic-impact', ctx.uid
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
      output: Output.object({ schema: EconomicImpactSchema }),
      system: `You are an economist specializing in conflict economics and post-conflict reconstruction. Apply World Bank Damage and Needs Assessment framework and IMF post-conflict methodology. Assess war economy dynamics, sanctions regimes, and reconstruction costs with quantitative rigour.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
Conduct a comprehensive conflict economic impact assessment.

Assess: (1) macroeconomic indicators (GDP deviation from trend, inflation, unemployment, trade balance, debt), (2) applicable sanctions regimes and their sector effects, (3) infrastructure, institutional, and social reconstruction costs, (4) war economy actors who benefit from continued conflict, (5) peace dividend estimates for post-conflict recovery.

Cite sources from web intelligence for all quantitative claims. Flag intelligence gaps for data that cannot be verified.`,
    });

    if (situationId) {
      await writeToolDataServer(ctx.uid, situationId, 'economic-impact', result.output as Record<string, unknown>);
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'economic_impact',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[economic_impact] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'economic-impact');
  }
});
