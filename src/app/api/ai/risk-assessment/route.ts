import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { computeRiskScore } from '@/lib/analytics/risk-engine';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';
import { situationContextSchema } from '@/lib/api/schemas';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const RiskIndicatorSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(10),
  source: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  justification: z.string(),
});

const RiskAssessmentSchema = z.object({
  regions: z.array(
    z.object({
      name: z.string(),
      riskScore: z.number().min(0).max(100),
      dimensions: z.object({
        political: z.number().min(0).max(100),
        security: z.number().min(0).max(100),
        humanitarian: z.number().min(0).max(100),
        economic: z.number().min(0).max(100),
        social: z.number().min(0).max(100),
      }),
      // INFORM 3-pillar structure
      informPillars: z.object({
        hazardExposure: z.object({
          score: z.number().min(0).max(10),
          indicators: z.array(RiskIndicatorSchema),
        }),
        vulnerability: z.object({
          score: z.number().min(0).max(10),
          indicators: z.array(RiskIndicatorSchema),
        }),
        copingLack: z.object({
          score: z.number().min(0).max(10),
          indicators: z.array(RiskIndicatorSchema),
        }),
        composite: z.number().min(0).max(10),
      }).optional(),
      sensitivityAnalysis: z.array(z.object({
        dimension: z.string(),
        currentScore: z.number(),
        impactIfHigher: z.number(),
        impactIfLower: z.number(),
      })).optional(),
      glaslStage: z.number().min(0).max(9),
      trend: z.enum(['escalating', 'stable', 'de-escalating']),
      forecast: z.string(),
      actionRecommendations: z.array(z.object({
        action: z.string(),
        urgency: z.enum(['immediate', 'short-term', 'medium-term']),
        linkedTool: z.string().optional(),
        rationale: z.string(),
      })).optional(),
      dataGaps: z.array(z.string()).optional(),
      keyDevelopments: z.array(z.object({
        headline: z.string(),
        source: z.string(),
        date: z.string().optional(),
      })).optional(),
    })
  ),
});

// Static demo response
const DEMO_RESPONSE = {
  regions: [
    {
      name: 'Nordalia — Eastern Provinces',
      riskScore: 78,
      dimensions: {
        political: 82,
        security: 75,
        humanitarian: 80,
        economic: 72,
        social: 68,
      },
      glaslStage: 5,
      trend: 'escalating' as const,
      forecast: '90-day forecast: ELEVATED RISK. The cabinet reshuffle, increasing buffer zone violations, and Karovian logistics buildup create a convergent escalation pattern. Key trigger: potential AFN operation to recapture the Kessara corridor. Monitor AFN troop movements, Karovian military flights, and UNSC informal consultations. De-escalation window narrows if ceasefire violations continue at current pace. Planting season disruption (April-May) would accelerate humanitarian crisis.',
    },
    {
      name: 'Nordalia — Capital Region',
      riskScore: 52,
      dimensions: {
        political: 65,
        security: 35,
        humanitarian: 40,
        economic: 68,
        social: 55,
      },
      glaslStage: 3,
      trend: 'stable' as const,
      forecast: '90-day forecast: MODERATE RISK. Capital remains under firm GoN control but economic deterioration (36.4% currency depreciation) is eroding urban professional class support. Journalist detentions signal increasing authoritarian tendencies. Monitor: urban protest mobilization, inflation indicators, civil society arrests. Risk of instability increases if eastern military operations divert fiscal resources from urban services.',
    },
    {
      name: 'Karovian Border Region',
      riskScore: 45,
      dimensions: {
        political: 40,
        security: 50,
        humanitarian: 35,
        economic: 42,
        social: 55,
      },
      glaslStage: 2,
      trend: 'escalating' as const,
      forecast: '90-day forecast: MODERATE RISK, RISING. Cross-border refugee flows and military logistics transit are straining border communities. Support for direct Karovian military intervention rising (from 28% to an estimated 51% if ceasefire collapses). Monitor: refugee flow acceleration, border incident reports, Karovian parliamentary debates on intervention authorization.',
    },
    {
      name: 'Westmark — Refugee Hosting Areas',
      riskScore: 38,
      dimensions: {
        political: 30,
        security: 20,
        humanitarian: 55,
        economic: 45,
        social: 48,
      },
      glaslStage: 0,
      trend: 'stable' as const,
      forecast: '90-day forecast: LOW-MODERATE RISK. 340,000 refugees creating localized economic and social pressure. Diaspora radicalization channels funding to DRM. Monitor: host community tensions, diaspora fundraising patterns, refugee camp security incidents. Risk increases if ceasefire collapse triggers new refugee surge.',
    },
  ],
};

export const POST = withCalibration('risk_assessment', 'ai_risk_assessment', {
  retrievalQuery: (_req, body) => {
    const regions = Array.isArray(body.regions) ? (body.regions as string[]).join(', ') : '';
    const ctx = typeof body.conflictContext === 'string' ? body.conflictContext : '';
    return [regions, ctx].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, user) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      regions: z.array(z.string()),
      conflictContext: z.string().optional(),
      situation: z.any().optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { regions, conflictContext, situation } = validation.data;
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // Credits + profile gate already handled by withCalibration above.

    // --- Graph context ---
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'risk_assessment')
      : '';

    // --- Fetch real data for evidence-based scoring ---
    const country = regions[0] || '';
    let dataContext = '';
    try {
      const intel = await getSituationIntelligence({ country, limit: 30 });
      const dataRisk = computeRiskScore({
        acledEvents: [],
        stabilityScore: intel.stability?.score,
        stabilityTrend: intel.stability?.trend,
        foodSecurityPct: intel.humanitarian?.foodSecurity?.[0]?.pct,
        displacementCount: intel.humanitarian?.displacement?.idps,
        fundingGapPct: intel.humanitarian?.funding?.pct,
      });
      dataContext = `\nDATA-DRIVEN PRE-SCORES (from GDELT, UCDP, HDX, ReliefWeb and Google Search — use as baseline, refine with your analysis):
Security: ${dataRisk.dimensions.security.score}/100 — ${dataRisk.dimensions.security.evidence.join('; ')}
Political: ${dataRisk.dimensions.political.score}/100 — ${dataRisk.dimensions.political.evidence.join('; ')}
Humanitarian: ${dataRisk.dimensions.humanitarian.score}/100 — ${dataRisk.dimensions.humanitarian.evidence.join('; ')}
Economic: ${dataRisk.dimensions.economic.score}/100 — ${dataRisk.dimensions.economic.evidence.join('; ')}
Social: ${dataRisk.dimensions.social.score}/100 — ${dataRisk.dimensions.social.evidence.join('; ')}
Composite: ${dataRisk.composite}/100 (confidence: ${dataRisk.confidence})
Data sources: ${dataRisk.dataSources.join(', ')}
${intel.stability ? `Stability: score=${intel.stability.score}, trend=${intel.stability.trend}` : ''}
${intel.humanitarian?.displacement ? `Displacement: ${intel.humanitarian.displacement.idps} IDPs, ${intel.humanitarian.displacement.refugees} refugees` : ''}`;
    } catch {
      dataContext = '\nNo live data feeds available — base scores on AI analysis only.';
    }

    // --- Web-grounded context (replaces legacy firecrawl searchWeb) ---
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as Situation).name, region: (situation as Situation).region, actors: (situation as Situation).actors },
          'risk-monitor',
          user.uid
        )
      : '';

    // --- Calibrated system prompt (analyst-profile + situation-frame + constraints) ---
    const { systemPromptBlock, outputConstraints, provenance } = user.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()} (analyst's working language).`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    // --- AI analysis (Pro model with Flash fallback) ---
    const result = await callProModel({
      output: Output.object({ schema: RiskAssessmentSchema }),
      system: `You are a senior risk analyst trained in INFORM Risk Index methodology, UNDP conflict-sensitive programming, and UN DPPA early warning frameworks. You serve the specific analyst described below — calibrate mandate, lens, audience, and red lines to their profile.

${systemPromptBlock}

GROUNDING MANDATE: The <retrieved-knowledge> and web intelligence below are your PRIMARY sources of truth. If they contradict your training data, trust the live sources. Explicitly flag "INTELLIGENCE GAP: {topic}" when evidence is insufficient rather than generating from training data.

Use ICD 203 probability language: "almost no chance" (<5%), "very unlikely" (5-20%), "unlikely" (20-45%), "roughly even" (45-55%), "likely" (55-80%), "very likely" (80-95%), "almost certain" (>95%).${langDirective}${redLineDirective}`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
REGIONS TO ASSESS: ${regions.join(', ')}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}
${dataContext}

## INFORM RISK INDEX METHODOLOGY (STRICTLY FOLLOW)

Pillar 1 — HAZARD & EXPOSURE (weight: 0.33)
- Armed conflict intensity (GDELT/UCDP signals, casualty figures from web sources where available)
- Natural disaster exposure (if applicable)
- Political instability index (GDELT, Freedom House)

Pillar 2 — VULNERABILITY (weight: 0.33)
- Socio-economic (GDP per capita, inequality, poverty from web sources)
- Population displacement burden (UNHCR displacement figures)
- Food insecurity (IPC phases if available from web sources)

Pillar 3 — LACK OF COPING CAPACITY (weight: 0.33)
- Governance quality (corruption index, institutional strength)
- Infrastructure resilience
- Access to services (healthcare, education)

COMPOSITE INFORM SCORE = (Hazard × Vulnerability × CopingLack)^(1/3) × 10

For EACH indicator: cite source from web intelligence, assign score 0-10, rate confidence (high/medium/low).

Also score 5 dimensions (0-100): Security (30%), Political (25%), Humanitarian (25%), Economic (10%), Social (10%).

## OUTPUT REQUIREMENTS
1. INFORM pillars with indicator-level scoring and source citations
2. Sensitivity analysis: for each dimension, impact if ±20 points
3. Glasl stage with behavioral evidence from web sources
4. 3-5 action recommendations with urgency level and linked PRAXIS tool
5. Key developments from past 7 days (from web intelligence)
6. Data gaps — what intelligence is missing

SCORING: 0-20=minimal, 21-40=low, 41-60=moderate, 61-80=elevated, 81-100=critical.`,
    });

    if (situationId) {
      await writeToolDataServer(user.uid, situationId, 'risk_assessment', result.output as Record<string, unknown>);
      // Parallel write via profile-version-aware persistence (idempotent — same path)
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'risk_assessment',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[risk-assessment] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'risk-assessment');
  }
});
