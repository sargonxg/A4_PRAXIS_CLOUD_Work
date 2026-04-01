import { streamText } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

export const POST = withAuth(async (request, _user) => {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503 });
  }

  try {
    const body = await request.json();

    const requestSchema = z.object({
      conflictContext: z.string(),
      scenarioTrigger: z.string(),
      actors: z.array(z.string()).optional(),
      timeHorizon: z.string(),
      situation: z.any().optional(),
      params: z.record(z.string(), z.number()).optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { conflictContext, scenarioTrigger, actors, timeHorizon, situation, params } =
      validation.data;

    const sitContext = situation ? buildToolContext(situation as Situation) : '';

    const creditCheck = await checkAndDeductCredits('ai_scenario', 'Scenario analysis');
    if (!creditCheck.allowed) return creditCheck.response;

    const actorList =
      Array.isArray(actors) && actors.length > 0
        ? `Involved actors: ${actors.join(', ')}`
        : '';

    // Build scenario parameter context
    const paramContext = params
      ? `\nSCENARIO PARAMETERS (use these to calibrate your analysis — higher = more intense):\n${Object.entries(params)
          .map(([k, v]) => `- ${k}: ${v}/100`)
          .join('\n')}\n`
      : '';

    // Inject real data context
    let dataContext = '';
    try {
      const country = conflictContext?.split(' ').find((w: string) => w.length > 3) || '';
      if (country) {
        const intel = await getSituationIntelligence({ country, limit: 15 });
        if (intel.events.length > 0) {
          dataContext = `\nCURRENT DATA (ground your analysis in this):
- ${intel.sources.acled} ACLED events, ${intel.sources.gdelt} GDELT articles, ${intel.sources.reliefweb} ReliefWeb reports
${intel.stability ? `- GDELT stability: ${intel.stability.score.toFixed(1)} (${intel.stability.trend})` : ''}
${intel.humanitarian?.displacement ? `- Displacement: ${intel.humanitarian.displacement.idps} IDPs` : ''}
- Recent events: ${intel.events.slice(0, 5).map((e) => e.title).join('; ')}\n`;
        }
      }
    } catch {
      /* continue without live data */
    }

    const prompt = `${sitContext ? `${sitContext}\n\n` : ''}You are a senior conflict analyst at a major international crisis organization. Conduct a rigorous, structured scenario analysis using the information below.

CONFLICT CONTEXT: ${conflictContext}
SCENARIO TRIGGER: ${scenarioTrigger}
${actorList}
TIME HORIZON: ${timeHorizon}
${paramContext}${dataContext}

INSTRUCTIONS:
- Reference specific actors named in the conflict context by name throughout your analysis — do not use generic placeholders.
- Apply Friedrich Glasl's 9-stage escalation model to map parameter configurations and predicted dynamics to conflict intensity stages. Explicitly note which Glasl stage the scenario is likely to reach or sustain.
- Include calibrated probability estimates (e.g., "65% probability of…") for all key branch points and outcome claims.
- Note significant information gaps and analytical uncertainty where they affect your conclusions.
- End with exactly 3 specific policy recommendations, each specifying: the recommended action, the primary implementing actor, and a 30/60/90 day action timeline.

Structure your response using EXACTLY these section headers:

## Initial Trigger
Analyze the immediate causal chain set in motion by the scenario trigger. What happens in the first 72 hours? Which actors respond and how? What thresholds or tripwires are immediately activated?

## Short-term Dynamics (1–4 weeks)
Analyze the evolving conflict dynamics in the first month. Cover: armed group behavior, ceasefire status, political elite responses, humanitarian system impacts, international reaction. Include Glasl stage assessment.

## Medium-term (1–6 months)
Analyze the trajectory across the medium term. Cover: political stabilization or fragmentation, humanitarian crisis evolution, economic pressure effects, peace process viability, regional spillover risk. Include probability estimates for key branch points.

## Long-term (6–12 months)
Assess the likely state of the conflict at the 6–12 month mark under this scenario. What has consolidated? What remains uncertain? What structural changes have occurred?

## Key Pivot Points
List 3–5 critical decision points or intervention windows where outcomes could diverge significantly. For each: what is the window, who must act, what is the consequence of inaction, and what is the probability this window will open.

## Policy Recommendations
Provide exactly 3 specific policy recommendations. For each recommendation:
- **Action**: [Specific action]
- **Implementing Actor**: [Who must act]
- **Timeline**: 30 days — [what by day 30] / 60 days — [what by day 60] / 90 days — [what by day 90]

Be analytically rigorous. Calibrate confidence language (high/moderate/low/uncertain). Avoid generic analysis. Reference specific actors, instruments, precedents, and frameworks.`;

    const result = streamText({
      model: getProModel(),
      prompt,
      system:
        'You are a senior conflict analyst at the International Crisis Group. Provide rigorous, structured, evidence-based scenario analysis for diplomatic and security professionals. Always cite actors by name, apply Glasl escalation staging, and include calibrated probability estimates.',
    });

    return result.toTextStreamResponse();
  } catch (err) {
    return handleRouteError(err, 'scenario');
  }
});
