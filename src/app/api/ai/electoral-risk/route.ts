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

const ElectoralRiskSchema = z.object({
  electionDetails: z.object({
    scheduledDate: z.string().optional(),
    electionType: z.string(),
    keyContestants: z.array(z.string()),
    electoralSystem: z.string(),
  }),
  overallRisk: z.enum(['critical', 'high', 'medium', 'low']),
  riskIndicators: z.object({
    structural: z.array(z.object({ indicator: z.string(), severity: z.enum(['high', 'medium', 'low']), evidence: z.string() })),
    institutional: z.array(z.object({ indicator: z.string(), severity: z.enum(['high', 'medium', 'low']), evidence: z.string() })),
    behavioral: z.array(z.object({ indicator: z.string(), severity: z.enum(['high', 'medium', 'low']), evidence: z.string() })),
  }),
  riskByPhase: z.object({
    preElection: z.object({ risk: z.enum(['critical', 'high', 'medium', 'low']), keyThreats: z.array(z.string()) }),
    electionDay: z.object({ risk: z.enum(['critical', 'high', 'medium', 'low']), keyThreats: z.array(z.string()) }),
    postElection: z.object({ risk: z.enum(['critical', 'high', 'medium', 'low']), keyThreats: z.array(z.string()) }),
  }),
  mitigationMeasures: z.array(z.object({
    measure: z.string(),
    actor: z.string(),
    timeframe: z.string(),
    priority: z.enum(['immediate', 'short-term', 'medium-term']),
  })),
  hotspotRegions: z.array(z.string()).optional(),
  intelligenceGaps: z.array(z.string()),
});

const DEMO_RESPONSE = {
  electionDetails: {
    scheduledDate: '15 September 2026',
    electionType: 'Presidential and parliamentary',
    keyContestants: ['President Osei (incumbent)', 'Coalition opposition'],
    electoralSystem: 'Two-round majoritarian',
  },
  overallRisk: 'high' as const,
  riskIndicators: {
    structural: [
      {
        indicator: 'History of post-election violence (2019, 2022)',
        severity: 'high' as const,
        evidence: 'Open-source monitoring records repeated election-related incidents in previous cycles',
      },
    ],
    institutional: [
      {
        indicator: 'Partisan electoral commission appointments',
        severity: 'high' as const,
        evidence: '3 of 5 NEC commissioners appointed by President Osei without parliamentary approval',
      },
    ],
    behavioral: [
      {
        indicator: 'Inflammatory rhetoric by ruling party officials',
        severity: 'medium' as const,
        evidence: 'GoN officials referred to opposition as "foreign agents" at 4 rallies',
      },
    ],
  },
  riskByPhase: {
    preElection: {
      risk: 'high' as const,
      keyThreats: ['Opposition rally disruptions', 'Voter registration irregularities in eastern provinces'],
    },
    electionDay: {
      risk: 'high' as const,
      keyThreats: ['Security force deployment at opposition strongholds', 'DRM calls for election boycott'],
    },
    postElection: {
      risk: 'critical' as const,
      keyThreats: ['Results dispute likely', 'DRM exploitation of grievances'],
    },
  },
  mitigationMeasures: [
    {
      measure: 'Deploy international election observers to all 12 provinces',
      actor: 'AU/EU/Carter Center',
      timeframe: '60 days before election',
      priority: 'immediate' as const,
    },
  ],
  hotspotRegions: ['Eastern Provinces', 'Kessara District', 'Capital opposition districts'],
  intelligenceGaps: [
    'Actual NEC capacity for result tabulation',
    'Security force deployment plans',
  ],
};

export const POST = withCalibration('electoral_risk', 'ai_analysis', {
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

    const graphCtx = situationId ? await buildGraphContext(ctx.uid, situationId, 'electoral_risk') : '';
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'electoral-risk', ctx.uid
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
      output: Output.object({ schema: ElectoralRiskSchema }),
      system: `You are a senior electoral violence risk analyst trained in UNDP Electoral Risk Assessment methodology and IFES electoral violence indicators. Assess risk across structural, institutional, and behavioral dimensions across three electoral phases.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
Conduct a comprehensive electoral violence risk assessment using UNDP Electoral Risk Assessment framework.

Assess: (1) election details (date, type, contestants, system), (2) structural risks (history, inequality, exclusion), (3) institutional risks (commission independence, legal framework, security forces), (4) behavioral risks (rhetoric, militia mobilization, hate speech), (5) risk per electoral phase, (6) hotspot regions, (7) prioritized mitigation measures.

Every risk indicator must cite a source from web intelligence or flag as intelligence gap.`,
    });

    if (situationId) {
      await writeToolDataServer(ctx.uid, situationId, 'electoral-risk', result.output as Record<string, unknown>);
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'electoral_risk',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[electoral_risk] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'electoral-risk');
  }
});
