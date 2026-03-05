import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY || '' });
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503 });
  }

  try {
    const { conflictContext, scenarioTrigger, actors, timeHorizon } = await request.json();

    const actorList = Array.isArray(actors) && actors.length > 0
      ? `Involved actors: ${actors.join(', ')}`
      : '';

    const prompt = `You are a senior conflict analyst at a major international crisis organization. Conduct a rigorous scenario analysis.

CONFLICT CONTEXT: ${conflictContext}
SCENARIO TRIGGER: ${scenarioTrigger}
${actorList}
TIME HORIZON: ${timeHorizon}

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
      model: google('gemini-2.5-flash'),
      prompt,
      system: 'You are a senior conflict analyst at the International Crisis Group. Provide rigorous, structured, evidence-based scenario analysis for diplomatic and security professionals.',
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Scenario route error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
