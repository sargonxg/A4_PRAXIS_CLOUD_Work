import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';

export const maxDuration = 60;

const EscalationScanSchema = z.object({
  currentStage: z.number().min(1).max(9).describe('Current Glasl escalation stage (1-9)'),
  stageName: z.string().describe('Name of the current Glasl stage'),
  indicators: z.array(
    z.object({
      name: z.string().describe('Name of the escalation indicator'),
      status: z.enum(['present', 'emerging', 'absent']).describe('Whether this indicator is present, emerging, or absent'),
      evidence: z.string().describe('Evidence supporting the indicator status assessment'),
    })
  ).describe('Glasl stage indicators and their current status'),
  trajectory: z.string().describe('Assessment of the escalation trajectory — is the conflict escalating, de-escalating, or stable, and what is driving the trend'),
  confidence: z.number().min(0).max(1).describe('Confidence score for this assessment (0-1)'),
  deescalationOpportunities: z.array(z.string()).describe('Identified opportunities for de-escalation intervention'),
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

export async function POST(request: Request) {
  try {
    const { conflictId, conflictContext } = await request.json() as {
      conflictId: string;
      conflictContext?: string;
    };

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_escalation_scan', 'Escalation scan');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Web search ---
    const searchQuery = conflictContext
      ? `${conflictContext} escalation latest`
      : `conflict ${conflictId} escalation latest`;
    const searchResults = await searchWeb(searchQuery, { numResults: 5 });
    const webContext = formatResultsAsContext(searchResults);

    // --- AI analysis ---
    const result = await generateText({
      model: getModel(),
      output: Output.object({ schema: EscalationScanSchema }),
      prompt: `You are a senior conflict analyst specializing in the Glasl escalation model. Conduct a rigorous escalation assessment.

CONFLICT: ${conflictId}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}

LATEST INTELLIGENCE:
${webContext || 'No web results available. Base analysis on the conflict context provided.'}

Apply Friedrich Glasl's 9-stage escalation model:
- Stages 1-3 (Win-Win): Hardening, Debates, Actions
- Stages 4-6 (Win-Lose): Coalitions, Loss of Face, Threats
- Stages 7-9 (Lose-Lose): Destructive Blows, Fragmentation, Abyss

For each stage indicator, assess whether it is present, emerging, or absent, and provide specific evidence. Determine the current stage, assess the trajectory (escalating, de-escalating, or stable), and identify concrete de-escalation opportunities.

Calibrate your confidence score based on the quality and recency of available evidence.`,
      system: 'You are a senior conflict analyst trained in the Glasl 9-stage escalation model. Provide rigorous, evidence-based escalation assessments for diplomatic and security professionals. Always calibrate confidence and distinguish between confirmed indicators and analytical inference.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    console.error('Escalation scan route error:', err);
    return NextResponse.json({ error: 'Escalation scan failed' }, { status: 500 });
  }
}
