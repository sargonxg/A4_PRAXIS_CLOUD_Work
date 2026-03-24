import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const NegotiationSchema = z.object({
  zopaAnalysis: z.array(
    z.object({
      issue: z.string().describe('The negotiation issue being analyzed'),
      partyPositions: z.array(
        z.object({
          party: z.string().describe('Party name'),
          min: z.string().describe('Minimum acceptable outcome (reservation point)'),
          max: z.string().describe('Maximum desired outcome (aspiration point)'),
          ideal: z.string().describe('Ideal outcome if they could dictate terms'),
        })
      ).describe('Each party\'s position range on this issue'),
      overlapExists: z.boolean().describe('Whether a Zone of Possible Agreement exists on this issue'),
    })
  ).describe('Zone of Possible Agreement analysis for each issue'),
  batnaAssessments: z.array(
    z.object({
      party: z.string().describe('Party name'),
      alternatives: z.array(z.string()).describe('Best alternatives to a negotiated agreement'),
      strength: z.enum(['strong', 'moderate', 'weak']).describe('Overall BATNA strength'),
    })
  ).describe('Best Alternative to Negotiated Agreement assessment for each party'),
  dealProbability: z.number().min(0).max(100).describe('Estimated probability of reaching a deal (0-100)'),
  recommendations: z.array(z.string()).describe('Strategic recommendations for advancing the negotiation'),
});

// Static demo response
const DEMO_RESPONSE = {
  zopaAnalysis: [
    {
      issue: 'Eastern Province Revenue Sharing',
      partyPositions: [
        {
          party: 'Government of Nordalia',
          min: 'Maintain current centralized revenue control with token development fund for eastern provinces (5-10% allocation)',
          max: 'Full central government control of all mineral revenues with discretionary regional transfers',
          ideal: 'Complete sovereignty over resource extraction with no legally binding revenue-sharing obligations',
        },
        {
          party: 'Democratic Reform Movement',
          min: 'Minimum 35% of Belara Mining Complex revenues allocated directly to Eastern Provincial Authority with independent oversight',
          max: 'Full provincial control of eastern mineral resources with central government receiving a negotiated royalty',
          ideal: 'Complete eastern provincial autonomy over natural resources including licensing, extraction, and revenue collection',
        },
      ],
      overlapExists: true,
    },
    {
      issue: 'Political Representation and Elections',
      partyPositions: [
        {
          party: 'Government of Nordalia',
          min: 'DRM disarms completely before participating in existing electoral framework with minor reforms',
          max: 'DRM disbands as a political-military organization and individuals participate through existing registered parties',
          ideal: 'DRM surrenders, leadership faces justice, no political concessions made',
        },
        {
          party: 'Democratic Reform Movement',
          min: 'Internationally supervised transitional elections within 24 months with DRM allowed to register as a political party, phased DDR after elections',
          max: 'Immediate transitional government with DRM power-sharing, new constitution before elections',
          ideal: 'Osei removed from power, new elections under international administration, full political amnesty for DRM',
        },
      ],
      overlapExists: false,
    },
    {
      issue: 'Security Arrangements and DDR',
      partyPositions: [
        {
          party: 'Government of Nordalia',
          min: 'DRM begins disarmament within 90 days under AFN supervision, with UNMN monitoring',
          max: 'Immediate DRM disarmament and integration of selected fighters into AFN under government command',
          ideal: 'Unconditional DRM surrender and prosecution of military commanders',
        },
        {
          party: 'Democratic Reform Movement',
          min: 'Security guarantees and international protection for DRM leadership before any disarmament; phased DDR over 24 months with UNMN-managed cantonment',
          max: 'DRM maintains armed capacity until elections are held and new government formed; only then begins phased DDR',
          ideal: 'DRM forces integrated into a reformed national military with guaranteed command positions proportional to eastern population',
        },
      ],
      overlapExists: true,
    },
  ],
  batnaAssessments: [
    {
      party: 'Government of Nordalia',
      alternatives: [
        'Military solution: Launch offensive to recapture Eastern Provinces (requires Karovian support, uncertain outcome, high humanitarian cost)',
        'Status quo maintenance: Continue ceasefire while building military capacity, hoping economic pressure erodes DRM support',
        'International legitimacy play: Engage in performative diplomacy while preparing military option, blaming DRM for obstruction',
      ],
      strength: 'moderate' as const,
    },
    {
      party: 'Democratic Reform Movement',
      alternatives: [
        'Protracted insurgency: Maintain control of eastern territory indefinitely, building parallel state institutions',
        'International escalation: Seek diplomatic recognition from Westmark and allies, internationalizing the dispute',
        'Unilateral declaration: Declare eastern provincial autonomy, forcing international response',
      ],
      strength: 'moderate' as const,
    },
  ],
  dealProbability: 35,
  recommendations: [
    'Focus initial negotiations on revenue-sharing (Issue 1) where ZOPA exists — the 35-45% allocation range is the most promising entry point for a framework agreement',
    'Decouple DDR from elections sequencing — the current linkage (GoN demands DDR before elections, DRM demands elections before DDR) creates a deadlock. A phased approach with concurrent tracks is the only viable path',
    'Weaken both parties\' BATNAs through coordinated international pressure: stricter arms embargo enforcement reduces GoN military option viability; DRM recognition constraints reduce unilateral declaration option',
    'Use the revenue-sharing agreement as a confidence-building foundation to tackle the harder political representation issues, building momentum from easier to harder issues',
    'Engage Karovia and Westmark directly in a parallel regional security track — their patron-client relationships give them effective veto power, so their buy-in is essential for any deal to hold',
    'Establish clear consequences for non-engagement: UNSC should signal that failure to negotiate in good faith will trigger expanded sanctions (targeting GoN) and designation reviews (targeting DRM financial networks)',
  ],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      parties: z.array(z.string()),
      issues: z.array(z.string()),
      conflictContext: z.string().optional(),
      situation: z.any().optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { parties, issues, conflictContext, situation } = validation.data;
    const sitContext = situation ? buildToolContext(situation as Situation) : '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_negotiation', 'Negotiation analysis');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- AI analysis ---
    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: NegotiationSchema }),
      prompt: `${sitContext ? `${sitContext}\n\n` : ''}You are a senior negotiation analyst specializing in Fisher/Ury interest-based negotiation and conflict resolution. Conduct a comprehensive negotiation analysis.

PARTIES: ${parties.join(', ')}
KEY ISSUES: ${issues.join(', ')}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}

Provide:

1. **ZOPA Analysis** — For each issue, map each party's position range (minimum acceptable, maximum desired, ideal outcome). Determine whether a Zone of Possible Agreement exists. Be specific about what each party's reservation point and aspiration point are.

2. **BATNA Assessment** — For each party, identify their Best Alternative to Negotiated Agreement. What are their options if negotiations fail? How strong are these alternatives? A stronger BATNA means less incentive to compromise.

3. **Deal Probability** — Estimate the overall probability of reaching a deal based on ZOPA overlap, BATNA strength, and conflict dynamics.

4. **Recommendations** — Provide strategic recommendations for advancing the negotiation. Focus on issue sequencing, BATNA modification strategies, and creative options that expand the pie.

Apply Fisher/Ury principled negotiation framework. Be specific to the parties and issues involved.`,
      system: 'You are a senior negotiation analyst trained in Fisher/Ury interest-based negotiation, Lax/Sebenius deal design, and Zartman ripeness theory. Provide rigorous negotiation analysis for mediators and diplomatic professionals. Map positions precisely and identify creative solutions that create value for all parties.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'negotiation');
  }
}
