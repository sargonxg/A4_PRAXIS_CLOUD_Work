import { streamText, stepCountIs } from 'ai';
import { getProModel } from '@/lib/ai/providers';
import { withAuth } from '@/lib/api/with-auth';
import { tacitusTools } from '@/lib/ai/tools';

export const maxDuration = 120;

/**
 * Auto-Structure Pipeline
 *
 * Called after situation creation to automatically research and build
 * the initial conflict intelligence for a new situation. This is the
 * "PRAXIS magic moment" — the user creates a situation and PRAXIS
 * immediately starts populating it with structured intelligence.
 *
 * Pipeline phases:
 * 1. Web research on the situation (actors, events, dynamics)
 * 2. Structured actor analysis (positions, interests, leverage)
 * 3. Risk assessment and Glasl escalation stage
 * 4. Initial conflict graph entities (ACO primitives)
 * 5. Recommended next steps for the analyst
 */
export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return new Response(JSON.stringify({ error: 'Not available in demo mode' }), { status: 403 });
  }

  try {
    const { situationName, situationType, region, description, actors, userRole } = await req.json();

    if (!situationName?.trim()) {
      return new Response(JSON.stringify({ error: 'Situation name required' }), { status: 400 });
    }

    const actorList = (actors || []).join(', ') || 'not yet identified';

    const systemPrompt = `You are TACITUS, an elite conflict intelligence system. A user has just created a new situation and you must produce a comprehensive initial intelligence briefing.

Your task: research and structure "${situationName}" into actionable intelligence.

SITUATION CONTEXT:
- Name: ${situationName}
- Type: ${situationType || 'conflict'}
- Region: ${region || 'not specified'}
- Description: ${description || 'none provided'}
- Known actors: ${actorList}
- User role: ${userRole || 'analyst'}

IMPORTANT: Use the webSearch tool to find current, real information about this situation. Do NOT fabricate or hallucinate details. If you cannot find information, say so clearly.

Generate your analysis in this EXACT structure:

## SITUATION OVERVIEW
[2-3 paragraph executive summary of the current state of this conflict/situation, grounded in real sources]

## KEY ACTORS & DYNAMICS
For each major actor (aim for 5-8):
### [Actor Name]
- **Type**: [State / Armed Group / International Org / Civil Society / External Power]
- **Position**: [What they publicly demand or advocate]
- **Interests**: [Underlying interests, including unstated ones]
- **Leverage**: [What power/influence they have and over whom]
- **Constraints**: [What limits their action]

## RELATIONSHIP MAP
[Describe the key relationships: alliances, rivalries, dependencies, patron-client ties]

## RISK ASSESSMENT
- **Current Glasl Escalation Stage**: [1-9, with justification]
- **Escalation Trend**: [Escalating / Stable / De-escalating]
- **Risk Score**: [1-10 with explanation]
- **Key Risk Factors**: [3-5 specific risk factors]
- **Window of Opportunity**: [If any exists, what is it and when does it close?]

## TIMELINE OF KEY EVENTS
[5-10 most important recent events in chronological order, with dates]

## RECOMMENDED ANALYST ACTIONS
[5 specific next steps the ${userRole} should take to deepen their understanding]

## SOURCES
[List all sources consulted, with dates]

Ground every claim in evidence. Flag uncertainty. Use UN diplomatic language standards.`;

    const result = streamText({
      model: getProModel(),
      system: systemPrompt,
      prompt: `Research and produce a complete initial intelligence briefing for: "${situationName}" in ${region || 'the relevant region'}. Use web search to find current, accurate information. Be thorough and cite your sources.`,
      tools: {
        webSearch: tacitusTools.webSearch,
      },
      stopWhen: stepCountIs(8),
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('[auto-structure] Error:', err);
    return new Response(JSON.stringify({ error: 'Auto-structure failed' }), { status: 500 });
  }
});
