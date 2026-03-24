import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';
import { computeRiskScore } from '@/lib/analytics/risk-engine';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const RiskAssessmentSchema = z.object({
  regions: z.array(
    z.object({
      name: z.string().describe('Region or country name'),
      riskScore: z.number().min(0).max(100).describe('Overall risk score (0-100)'),
      dimensions: z.object({
        political: z.number().min(0).max(100).describe('Political instability risk (0-100)'),
        security: z.number().min(0).max(100).describe('Security/armed conflict risk (0-100)'),
        humanitarian: z.number().min(0).max(100).describe('Humanitarian crisis risk (0-100)'),
        economic: z.number().min(0).max(100).describe('Economic instability risk (0-100)'),
        social: z.number().min(0).max(100).describe('Social cohesion risk (0-100)'),
      }).describe('Risk dimension scores'),
      glaslStage: z.number().min(0).max(9).describe('Glasl escalation stage (0 for no active conflict, 1-9 for active escalation)'),
      trend: z.enum(['escalating', 'stable', 'de-escalating']).describe('Current risk trend'),
      forecast: z.string().describe('90-day risk forecast with key drivers and indicators to monitor'),
    })
  ).describe('Per-region risk assessments'),
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

export async function POST(request: Request) {
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
    const sitContext = situation ? buildToolContext(situation as Situation) : '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_risk_assessment', 'Risk assessment');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Fetch real data for evidence-based scoring ---
    const country = regions[0] || '';
    let dataContext = '';
    try {
      const intel = await getSituationIntelligence({ country, limit: 30 });
      const dataRisk = computeRiskScore({
        acledEvents: intel.events.filter((e) => e.source === 'acled').map((e) => e.metadata as never),
        stabilityScore: intel.stability?.score,
        stabilityTrend: intel.stability?.trend,
        foodSecurityPct: intel.humanitarian?.foodSecurity?.[0]?.pct,
        displacementCount: intel.humanitarian?.displacement?.idps,
        fundingGapPct: intel.humanitarian?.funding?.pct,
      });
      dataContext = `\nDATA-DRIVEN PRE-SCORES (from ACLED, GDELT, HDX — use as baseline, refine with your analysis):
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

    // --- Web search for crisis indicators ---
    const searchResults = await searchWeb(
      `${regions.join(' ')} conflict crisis risk indicators latest`,
      { numResults: 5 }
    );
    const webContext = formatResultsAsContext(searchResults);

    // --- AI analysis ---
    const result = await generateText({
      model: getModel(),
      output: Output.object({ schema: RiskAssessmentSchema }),
      prompt: `${sitContext ? `${sitContext}\n\n` : ''}You are a senior risk analyst specializing in conflict and political instability assessment. Conduct a multi-dimensional risk assessment.

REGIONS TO ASSESS: ${regions.join(', ')}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}
${dataContext}

LATEST INTELLIGENCE:
${webContext || 'No web results available. Base analysis on your training data and the conflict context provided.'}

For each region, assess:
1. Overall risk score (0-100) based on five dimensions: political, security, humanitarian, economic, social
2. Glasl escalation stage (0 for no active conflict, 1-9 for active escalation)
3. Current trend: escalating, stable, or de-escalating
4. 90-day forecast with specific drivers, indicators to monitor, and trigger scenarios

Use calibrated risk scoring. A score of 0-25 = low, 25-50 = moderate, 50-75 = elevated, 75-100 = critical. Be specific about what drives each dimension score.`,
      system: 'You are a senior risk analyst at a major international crisis monitoring organization. Provide rigorous, multi-dimensional risk assessments for diplomatic and security decision-makers. Use established conflict early warning methodologies and calibrate scores based on available evidence quality.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'risk-assessment');
  }
}
