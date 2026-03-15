import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

export const maxDuration = 120;

/**
 * Claude-powered deep analysis endpoint.
 * Falls back to Gemini if ANTHROPIC_API_KEY is not configured.
 * Claude is used for nuanced diplomatic analysis, bias detection,
 * and complex geopolitical reasoning.
 */
export async function POST(request: Request) {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGoogle = !!process.env.GOOGLE_AI_API_KEY;

  if (!hasAnthropic && !hasGoogle) {
    return new Response(
      JSON.stringify({
        error: 'No AI provider configured. Set ANTHROPIC_API_KEY or GOOGLE_AI_API_KEY.',
        providers: { anthropic: false, google: false },
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { query, analysisType = 'diplomatic', context } = await request.json();

    const analysisPrompts: Record<string, string> = {
      diplomatic: `You are a senior diplomatic analyst providing nuanced assessment. Consider:
- Multiple stakeholder perspectives and stated vs. unstated interests
- Historical precedents and analogies (with caveats about differences)
- Diplomatic language implications — what is said, what is left unsaid
- Institutional constraints and opportunities
- Escalation/de-escalation dynamics
- Potential negotiation space and confidence-building measures
Structure with: Assessment, Key Dynamics, Stakeholder Positions, Risks, and Recommendations.`,

      bias: `You are a media bias analyst. Evaluate the provided content for:
- Framing effects: how is the story positioned?
- Source selection bias: whose voices are amplified or excluded?
- Language analysis: loaded terms, euphemisms, attribution patterns
- Omission analysis: what relevant context is missing?
- Comparative framing: how would this story read from the other side?
Provide a structured bias assessment with specific examples.`,

      geopolitical: `You are a geopolitical strategist. Analyze:
- Power dynamics and balance of forces (military, economic, diplomatic, informational)
- Alliance structures and their reliability under stress
- Historical analogies and their limits
- Scenario analysis: best case, worst case, most likely
- Red lines and escalation triggers
- De-escalation pathways and prerequisites
Structure with: Strategic Assessment, Key Variables, Scenarios, and Policy Implications.`,

      legal: `You are an international law analyst. Assess:
- Applicable legal frameworks (UN Charter, IHL, ICL, bilateral treaties)
- Jurisdictional questions and standing
- Precedents from relevant ICJ/ICC/ad hoc tribunal jurisprudence
- State responsibility and individual criminal responsibility
- Enforcement mechanisms and their limitations
- Implications for ongoing proceedings
Structure with: Legal Framework, Analysis, Precedents, and Implications.`,
    };

    const systemPrompt = `${analysisPrompts[analysisType] || analysisPrompts.diplomatic}

${context ? `## Context Provided\n${context}` : ''}

## Analysis Standards
- Be analytically rigorous but accessible
- Present multiple perspectives fairly
- Distinguish clearly between facts, assessments, and speculation
- Use diplomatic language appropriate for senior stakeholders
- Flag areas of uncertainty or incomplete information
- Provide actionable insights where possible`;

    // Use Claude if available, otherwise Gemini
    const model = hasAnthropic
      ? anthropic('claude-sonnet-4-20250514')
      : google('gemini-2.5-flash');

    const result = streamText({
      model,
      system: systemPrompt,
      prompt: query,
    });

    // Include provider info in response headers
    return new Response((await result).textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-AI-Provider': hasAnthropic ? 'anthropic' : 'google',
        'X-AI-Model': hasAnthropic ? 'claude-sonnet-4-20250514' : 'gemini-2.5-flash',
      },
    });
  } catch (err) {
    console.error('Claude analyze route error:', err);
    return new Response(JSON.stringify({ error: 'Analysis request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
