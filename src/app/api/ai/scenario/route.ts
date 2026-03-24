import { streamText } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';
import type { Situation } from '@/types/situation';
export const maxDuration = 60;

export async function POST(request: Request) {
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
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { conflictContext, scenarioTrigger, actors, timeHorizon, situation } = validation.data;
    const sitContext = situation ? buildToolContext(situation as Situation) : '';

    const creditCheck = await checkAndDeductCredits('ai_scenario', 'Scenario analysis');
    if (!creditCheck.allowed) return creditCheck.response;

    const actorList = Array.isArray(actors) && actors.length > 0
      ? `Involved actors: ${actors.join(', ')}`
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
    } catch { /* continue */ }

    const prompt = `${sitContext ? `${sitContext}\n\n` : ''}You are a senior conflict analyst at a major international crisis organization. Conduct a rigorous scenario analysis.

CONFLICT CONTEXT: ${conflictContext}
SCENARIO TRIGGER: ${scenarioTrigger}
${actorList}
TIME HORIZON: ${timeHorizon}
${dataContext}

Analyze the likely consequences of this scenario trigger across the following dimensions. For each dimension, provide: (1) most likely outcome, (2) best case, (3) worst case. Use calibrated confidence language (high confidence / moderate confidence / uncertain).

## Political Dimension
Analyze impacts on: government stability, legitimacy, electoral dynamics, peace process viability, international recognition.

## Security Dimension
Analyze impacts on: armed group behavior, ceasefire status, civilian harm potential, peacekeeping mission posture, regional military dynamics.

## Humanitarian Dimension
Analyze impacts on: displacement, humanitarian access, civilian protection, IDP movements, service delivery.

## Economic Dimension
Analyze impacts on: trade flows, sanctions regime, resource control, donor support, reconstruction prospects.

## Regional Dimension
Analyze impacts on: neighboring states, regional organizations (AU, ECOWAS, EU, etc.), proxy actors, spillover potential.

## Key Decision Points
List 3-5 critical decision points or intervention windows where outcomes could diverge significantly. For each: what is the window, who must act, and what is the consequence of inaction.

## Policy Response Recommendations
Provide recommended responses categorized by:
- **Diplomatic**: Specific diplomatic actions, who should take them, timing
- **Security**: Peacekeeping adjustments, ceasefire monitoring, DDR implications
- **Humanitarian**: Pre-positioning, access negotiations, contingency planning
- **Economic**: Sanctions adjustments, donor coordination, resource management
- **Communications**: Messaging, narrative management, public positioning

Be analytically rigorous, calibrate confidence appropriately, and avoid generic analysis. Reference specific actors, instruments, and precedents where relevant.`;

    const result = streamText({
      model: getProModel(),
      prompt,
      system: 'You are a senior conflict analyst at the International Crisis Group. Provide rigorous, structured, evidence-based scenario analysis for diplomatic and security professionals.',
    });

    return result.toTextStreamResponse();
  } catch (err) {
    return handleRouteError(err, 'scenario');
  }
}
