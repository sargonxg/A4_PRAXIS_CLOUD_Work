import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode } from '@/lib/compat/sample-mode';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const PeacebuildingIndexSchema = z.object({
  compositeScore: z.number().min(0).max(100),
  pillars: z.object({
    security: z.object({
      score: z.number().min(0).max(10),
      indicators: z.array(z.string()),
      trend: z.enum(['improving', 'stable', 'deteriorating']),
    }),
    ruleOfLaw: z.object({
      score: z.number().min(0).max(10),
      indicators: z.array(z.string()),
      trend: z.enum(['improving', 'stable', 'deteriorating']),
    }),
    governance: z.object({
      score: z.number().min(0).max(10),
      indicators: z.array(z.string()),
      trend: z.enum(['improving', 'stable', 'deteriorating']),
    }),
    economicRecovery: z.object({
      score: z.number().min(0).max(10),
      indicators: z.array(z.string()),
      trend: z.enum(['improving', 'stable', 'deteriorating']),
    }),
    socialCohesion: z.object({
      score: z.number().min(0).max(10),
      indicators: z.array(z.string()),
      trend: z.enum(['improving', 'stable', 'deteriorating']),
    }),
    humanRights: z.object({
      score: z.number().min(0).max(10),
      indicators: z.array(z.string()),
      trend: z.enum(['improving', 'stable', 'deteriorating']),
    }),
  }),
  overallTrend: z.enum(['improving', 'stable', 'deteriorating']),
  benchmarkComparison: z.string(),
  priorities: z.array(z.string()),
  recommendations: z.array(z.string()),
  intelligenceGaps: z.array(z.string()),
});

const DEMO_RESPONSE = {
  compositeScore: 31,
  pillars: {
    security: {
      score: 3.5,
      indicators: ['Ceasefire holding but fragile — 47 violations since September 2025', 'AFN buffer zone incursions accelerating in Kessara corridor', 'Karovian military logistics up 40%'],
      trend: 'deteriorating' as const,
    },
    ruleOfLaw: {
      score: 2.8,
      indicators: ['5 journalists detained without charge', 'Judiciary functioning only in government-held territory', 'No accountability for ceasefire violations'],
      trend: 'deteriorating' as const,
    },
    governance: {
      score: 3.2,
      indicators: ['Cabinet reshuffle replacing moderate with hardliner', 'DRM parallel administration in eastern provinces', 'Local elections postponed indefinitely'],
      trend: 'stable' as const,
    },
    economicRecovery: {
      score: 2.5,
      indicators: ['Currency depreciation 36.4%', 'Planting season at risk for second consecutive year', 'Rare earth export revenues contested'],
      trend: 'deteriorating' as const,
    },
    socialCohesion: {
      score: 4.1,
      indicators: ['CSCN civil society coalition active and credible', 'Inter-community violence remains below national average', 'Diaspora remittances sustaining households'],
      trend: 'stable' as const,
    },
    humanRights: {
      score: 2.9,
      indicators: ['IHL violations documented by both parties', 'OHCHR access partial only', '1.2M IDPs with limited durable solutions'],
      trend: 'deteriorating' as const,
    },
  },
  overallTrend: 'deteriorating' as const,
  benchmarkComparison: 'the selected situation scores below the median for comparable post-agreement African conflicts (median composite: 42). Security and economic pillars are notably weaker than the Sierra Leone trajectory at equivalent conflict stage, though social cohesion is stronger than CAR at a comparable point.',
  priorities: [
    'Restore ceasefire monitoring and enforcement — security pillar is the binding constraint',
    'Negotiate humanitarian access before second consecutive failed planting season',
    'Establish joint economic working group on rare earth revenues as confidence-building entry point',
  ],
  recommendations: [
    'Expand UNMN ceasefire monitoring to all three high-risk contact points',
    'Establish independent judiciary access programme for DRM-held territories',
    'Launch economic institution Fragility, Conflict and Violence (FCV) rapid economic assessment',
    'Prioritise CSCN engagement as social cohesion anchor for any future reconciliation track',
  ],
  intelligenceGaps: [
    'Governance capacity and legitimacy of DRM parallel administration',
    'Actual household economic welfare data in conflict-affected provinces',
  ],
};

export const POST = withCalibration('peacebuilding_index', 'ai_analysis', {
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

    const graphCtx = situationId ? await buildGraphContext(ctx.uid, situationId, 'peacebuilding_index') : '';
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'peacebuilding-index', ctx.uid
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
      output: Output.object({ schema: PeacebuildingIndexSchema }),
      system: `You are a peacebuilding expert applying UN Peacebuilding Commission methodology and economic institution FCV framework. Score each pillar rigorously using observable indicators, not aspirational assessments.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
Score all 6 peacebuilding pillars (0-10 each) and compute a composite score (0-100, equally weighted).

Pillars to score: Security (ceasefire, armed group activity, civilian protection), Rule of Law (judiciary, accountability, detention), Governance (institutions, legitimacy, elections), Economic Recovery (growth, employment, livelihoods), Social Cohesion (inter-community relations, civil society, trust), Human Rights (IHL compliance, access, protection).

For each pillar: list 3+ observable indicators with source citations, score 0-10, and assess trend (improving/stable/deteriorating).

Compare composite score to similar post-conflict countries at equivalent conflict stage. Identify the 3 highest-priority pillars to address first. Cite sources from web intelligence for all indicators.`,
    });

    if (situationId) {
      await writeToolDataServer(ctx.uid, situationId, 'peacebuilding-index', result.output as Record<string, unknown>);
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'peacebuilding_index',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[peacebuilding_index] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'peacebuilding-index');
  }
});
