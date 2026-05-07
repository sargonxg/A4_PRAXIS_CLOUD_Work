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
import { computeEscalation } from '@/lib/analytics/escalation-scorer';
import { getCurrentStability } from '@/lib/data-feeds/gdelt-stability';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const EscalationScanSchema = z.object({
  currentStage: z.number().min(1).max(9),
  stageName: z.string(),
  stageEvidence: z.string(),
  indicators: z.array(z.object({
    name: z.string(),
    status: z.enum(['present', 'emerging', 'absent']),
    evidence: z.string(),
    isLeading: z.boolean(),
    timeToEscalation: z.string().optional(),
  })),
  trajectory: z.string(),
  confidence: z.number().min(0).max(1),
  deescalationOpportunities: z.array(z.object({
    window: z.string(),
    action: z.string(),
    actor: z.string(),
    probability: z.number().min(0).max(1),
    timeframe: z.string(),
  })),
  trajectoryScenarios: z.object({
    baseline: z.object({
      description: z.string(),
      probability: z.number().min(0).max(1),
      glaslIn90Days: z.number().min(1).max(9),
    }),
    optimistic: z.object({
      description: z.string(),
      probability: z.number().min(0).max(1),
      glaslIn90Days: z.number().min(1).max(9),
    }),
    pessimistic: z.object({
      description: z.string(),
      probability: z.number().min(0).max(1),
      glaslIn90Days: z.number().min(1).max(9),
    }),
  }),
  autoAlertTriggered: z.boolean().optional(),
});

// Static demo response
const DEMO_RESPONSE = {
  currentStage: 5,
  stageName: 'Loss of Face',
  indicators: [
    {
      name: 'Systematic dehumanization campaigns',
      status: 'present' as const,
      evidence: 'GoN state media consistently refers to DRM as "terrorists" and "foreign puppets." DRM propaganda characterizes President Osei as a "war criminal." Both parties have invested heavily in international reputation warfare.',
    },
    {
      name: 'Public moral framing and identity entrenchment',
      status: 'present' as const,
      evidence: 'The conflict has shifted from a dispute over electoral outcomes (negotiable interest) to a contest over identity, legitimacy, and historical justice (non-negotiable values). Classic Stage 5 marker.',
    },
    {
      name: 'Coalition hardening with external patrons',
      status: 'present' as const,
      evidence: 'Karovia and Westmark have locked into patron-client relationships that reinforce each party\'s sense of righteousness and reduce their perception of risk from escalation.',
    },
    {
      name: 'Ultimatums with explicit consequences',
      status: 'emerging' as const,
      evidence: 'GoN Defence Minister Mensah stated "all options are on the table" regarding eastern provinces. Not yet a formal ultimatum but approaching Stage 6 threat language.',
    },
    {
      name: 'Demonstrative military actions',
      status: 'emerging' as const,
      evidence: 'AFN forward observation post established inside buffer zone. 40% increase in Karovian logistics flights. These are signalling actions characteristic of the Stage 5-6 transition.',
    },
    {
      name: 'Complete communication breakdown',
      status: 'absent' as const,
      evidence: 'SRSG Santos maintains private back-channel with both parties. Prisoner exchange framework remains functional. Direct communication has not fully collapsed.',
    },
  ],
  trajectory: 'The Nordalia conflict is at the upper boundary of Stage 5 with concerning indicators of Stage 6 dynamics emerging. The cabinet reshuffle, increased Karovian military cooperation, and buffer zone incursions suggest a gradual escalation trajectory over the past 90 days. However, the continued functionality of back-channels and the prisoner exchange framework provide de-escalation anchors. The trajectory is assessed as slowly escalating with a 35% probability of crossing the Stage 6 threshold within the next 3-6 months if current trends continue.',
  confidence: 0.78,
  deescalationOpportunities: [
    'Reinforce ceasefire monitoring mechanism with additional UNMN observers at the three highest-risk contact points in the Kessara corridor',
    'Establish a joint economic working group on rare earth revenue-sharing to create a practical cooperation track parallel to the stalled political process',
    'Expand the SRSG\'s private back-channel to include senior military representatives from both sides, creating a military-to-military de-escalation mechanism',
    'Leverage the successful prisoner exchange framework to build momentum for broader confidence-building measures',
    'Support CSCN documentation and accountability efforts as a deterrence mechanism against mass atrocity triggers',
  ],
};

export const POST = withCalibration('escalation_scan', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const ctx = typeof body.conflictContext === 'string' ? body.conflictContext : '';
    const id = typeof body.conflictId === 'string' ? body.conflictId : '';
    return [id, ctx].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, user) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      conflictId: z.string().optional().default(''),
      conflictContext: z.string().optional(),
      situation: situationContextSchema.optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { conflictId, conflictContext, situation } = validation.data;
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // Credits + profile gate already handled by withCalibration above.

    // --- Graph context ---
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'escalation_scan')
      : '';

    // --- Fetch real escalation data ---
    let dataContext = '';
    try {
      const country = conflictContext?.split(' ')[0] || conflictId;
      const [stability] = await Promise.all([
        getCurrentStability(country.slice(0, 2).toUpperCase()),
      ]);
      const events: Parameters<typeof computeEscalation>[0] = [];
      if (events.length > 0 || stability) {
        const assessment = computeEscalation(events, stability?.score);
        dataContext = `\nDATA-DRIVEN ASSESSMENT (use as baseline):
Computed Glasl Stage: ${assessment.glaslStage} (${assessment.stageName})
Evidence: ${assessment.evidence.join('; ')}
Weekly events: ${assessment.weeklyEventCount} vs ${assessment.weeklyBaseline} baseline
Fatality trend: ${assessment.fatalityTrend}
${assessment.eventTypeShift ? `Event type shift: ${assessment.eventTypeShift}` : ''}
30-day escalation probability: ${(assessment.probability30d * 100).toFixed(0)}%
Key drivers: ${assessment.keyDrivers.join(', ')}
${stability ? `GDELT stability: ${stability.score.toFixed(1)} (${stability.trend})` : ''}
Confidence: ${assessment.confidence}\n`;
      }
    } catch { /* continue without data */ }

    // --- Web-grounded context ---
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'early-warning',
          user.uid
        )
      : '';

    // --- Calibrated analyst-profile + situation-frame + output-constraints ---
    const { systemPromptBlock, outputConstraints, provenance } = user.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    // --- AI analysis (Pro model with Flash fallback) ---
    const result = await callProModel({
      output: Output.object({ schema: EscalationScanSchema }),
      system: `You are a senior conflict analyst specializing in the Glasl 9-stage escalation model and Zartman Ripeness Theory. You serve analysts, mediators, and multilateral diplomacy practitioners.

${systemPromptBlock}

GROUNDING MANDATE: Web intelligence below is PRIMARY source of truth. Flag "INTELLIGENCE GAP: {topic}" when evidence is insufficient.
Use ICD 203 probability language for all assessments. Calibrate framing and recommendations to the analyst profile above.${langDirective}${redLineDirective}`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
CONFLICT: ${conflictId}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}
${dataContext}

## GLASL 9-STAGE MODEL (STRICTLY APPLY)
Stages 1-3 (Win-Win): Hardening, Debate & Polemic, Actions not Words
Stages 4-6 (Win-Lose): Images & Coalitions, Loss of Face, Strategies of Threats
Stages 7-9 (Lose-Lose): Limited Destructive Blows, Fragmentation, Together into the Abyss

## LEADING INDICATORS (signals that precede escalation by 1-4 weeks)
Identify 4-6 LEADING indicators (mark isLeading: true):
- Troop mobilization or military exercises
- Inflammatory rhetoric from leadership
- Diplomatic recall or expulsion of ambassadors
- Sanctions threats or imposition
- Media vilification and dehumanization campaigns
- Civil society crackdown or mass arrests

Also include 3-4 CURRENT stage indicators (mark isLeading: false).

## DE-ESCALATION OPPORTUNITIES
For each opportunity: identify the specific window (event, meeting, deadline), recommended action, responsible actor, probability (0-1), and timeframe.

## TRAJECTORY SCENARIOS (3-scenario projection)
baseline: if current trends continue
optimistic: if de-escalation opportunity seized
pessimistic: if key risk triggers activate

## AUTO-ALERT
Set autoAlertTriggered: true if currentStage >= 6 OR pessimistic.probability > 0.7`,
    });

    // --- Auto-alert for critical escalation (Glasl ≥6) ---
    const output = result.output as Record<string, unknown>;
    if (output?.autoAlertTriggered && situationId) {
      try {
        await writeToolDataServer(user.uid, situationId, 'auto-alert-escalation', {
          severity: 'HIGH',
          trigger: `Glasl Stage ${output.currentStage} detected by Early Warning`,
          generatedAt: new Date().toISOString(),
        });
      } catch { /* non-critical — alert write failure should not block main response */ }
    }

    if (situationId) {
      await writeToolDataServer(user.uid, situationId, 'escalation_scan', result.output as Record<string, unknown>);
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'escalation_scan',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[escalation-scan] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'escalation-scan');
  }
});
