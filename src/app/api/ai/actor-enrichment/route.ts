import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/firecrawl';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const ActorEnrichmentSchema = z.object({
  recentDevelopments: z.array(
    z.object({
      date: z.string().describe('Date or approximate timeframe of the event'),
      event: z.string().describe('Description of the event or development'),
      source: z.string().describe('Source attribution for this information'),
    })
  ).describe('Recent developments involving this actor'),
  positionAnalysis: z.string().describe('Analysis of the actor\'s current position, how it has evolved, and underlying interests driving their stance'),
  relationshipUpdates: z.array(
    z.object({
      actor: z.string().describe('Name of the related actor'),
      change: z.string().describe('Description of how the relationship has changed'),
    })
  ).describe('Updates to this actor\'s key relationships'),
  assessment: z.string().describe('Overall intelligence assessment of the actor\'s trajectory, intentions, and likely next moves'),
});

// Static demo response
const DEMO_RESPONSE = {
  recentDevelopments: [
    {
      date: 'March 2026',
      event: 'President Osei reshuffled the security cabinet, replacing the moderate Defence Minister with AFN hardliner General Mensah. Widely interpreted as a signal of willingness to pursue military options if the political track remains stalled.',
      source: 'Nordalian Independent Media Network; ICG Africa Report No. 312',
    },
    {
      date: 'February 2026',
      event: 'GoN imposed additional administrative restrictions on UNMN freedom of movement in the Kessara corridor, citing "operational security requirements." UNMN SRSG Santos protested formally.',
      source: 'UNMN SRSG briefing to UNSC, 14 Feb 2026',
    },
    {
      date: 'January 2026',
      event: 'GoN successfully completed second prisoner exchange with DRM under AU Panel facilitation, releasing 18 DRM-affiliated detainees in exchange for 16 AFN personnel.',
      source: 'AU Panel of the Wise communique, 12 Jan 2026',
    },
  ],
  positionAnalysis: 'The Government of Nordalia maintains its stated position that the 2024 elections were legitimate and the DRM must disarm before political dialogue. However, the cabinet reshuffle suggests an internal debate between accommodationists (who favour a negotiated settlement preserving GoN authority) and hardliners (who advocate a military solution). The appointment of General Mensah indicates the hardline faction is currently ascendant. Underlying interests remain unchanged: regime survival, control of eastern rare earth revenues, and preventing a precedent of armed opposition forcing power-sharing.',
  relationshipUpdates: [
    {
      actor: 'Karovia',
      change: 'Relationship has deepened following the defence cabinet reshuffle. Karovian military logistics flights to Nordalia City increased 40% in the past 21 days, suggesting enhanced military cooperation. The patron-client dynamic is strengthening.',
    },
    {
      actor: 'UNMN',
      change: 'Relationship has deteriorated. Freedom-of-movement restrictions and the GoN\'s refusal to facilitate UNMN access to three eastern districts represent a significant downgrade from the cooperative posture of late 2025.',
    },
    {
      actor: 'DRM',
      change: 'The prisoner exchange demonstrated continued back-channel functionality, but public rhetoric has hardened. GoN state media references to DRM as "terrorists" increased 60% in Q1 2026.',
    },
  ],
  assessment: 'The Government of Nordalia is at a critical inflection point. The cabinet reshuffle, increased Karovian military cooperation, and restrictions on UNMN access collectively suggest preparation for a potential military escalation if the political track does not produce results within 60-90 days. However, the GoN faces significant constraints: fiscal pressure from the currency depreciation (36.4% since March 2024), international legitimacy concerns, and uncertain military capacity for sustained operations in eastern terrain. The most likely trajectory is continued brinkmanship — using the threat of military action to extract concessions in the AU-mediated process — rather than an actual offensive. Confidence: Medium. Key uncertainty: internal GoN decision-making dynamics between Osei and the AFN command.',
};

export async function POST(request: Request) {
  try {
    const { actorName, actorType, conflictContext, situation } = await request.json() as {
      actorName: string;
      actorType: string;
      conflictContext?: string;
      situation?: Situation;
    };
    const sitContext = situation ? buildToolContext(situation) : '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_actor_enrichment', 'Actor enrichment');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Web search ---
    const searchResults = await searchWeb(
      `${actorName} latest news ${conflictContext || ''}`,
      { numResults: 5 }
    );
    const webContext = formatResultsAsContext(searchResults);

    // --- AI analysis ---
    const result = await generateText({
      model: getModel(),
      output: Output.object({ schema: ActorEnrichmentSchema }),
      prompt: `${sitContext ? `${sitContext}\n\n` : ''}You are a senior conflict intelligence analyst. Enrich the profile of the following actor with the latest available information.

ACTOR: ${actorName}
TYPE: ${actorType}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}

WEB INTELLIGENCE:
${webContext || 'No web results available. Base analysis on your training data and the conflict context provided.'}

Provide:
1. Recent developments involving this actor (with dates and source attribution)
2. A position analysis covering their current stance, how it has evolved, and underlying interests
3. Updates to key relationships with other actors
4. An overall intelligence assessment of their trajectory, intentions, and likely next moves

Use calibrated confidence language. Distinguish between confirmed reporting and analytical inference.`,
      system: 'You are a senior conflict intelligence analyst at a major international crisis monitoring organization. Provide rigorous actor profiling for diplomatic and security professionals. Always attribute claims to sources and calibrate confidence.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    console.error('Actor enrichment route error:', err);
    return NextResponse.json({ error: 'Actor enrichment failed' }, { status: 500 });
  }
}
