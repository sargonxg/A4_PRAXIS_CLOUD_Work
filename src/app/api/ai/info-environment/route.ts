import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';
import type { Situation } from '@/types/situation';

export const maxDuration = 45;

const NarrativeSchema = z.object({
  id: z.string().describe('Short unique identifier'),
  title: z.string().describe('Concise narrative title'),
  framing: z.string().describe('How this narrative frames the conflict — angle, emphasis, omissions'),
  amplifiers: z.array(z.string()).describe('Key actors and outlets amplifying this narrative'),
  platform: z.enum(['social_media', 'state_media', 'independent_media', 'diaspora', 'international']).describe('Primary distribution platform'),
  trend: z.enum(['rising', 'stable', 'declining']).describe('Current trajectory of this narrative'),
  reachScore: z.number().min(0).max(100).describe('Estimated relative reach within the information environment'),
  isHostile: z.boolean().describe('Whether this narrative is hostile to peace process or international norms'),
  counterNarrative: z.string().optional().describe('Recommended counter-messaging strategy for hostile narratives'),
});

const InfoOperationSchema = z.object({
  name: z.string().describe('Name or designation for this information operation'),
  type: z.enum(['disinformation', 'propaganda', 'coordinated_inauthentic', 'astroturfing', 'hack_and_leak']).describe('Type of information operation'),
  attribution: z.string().describe('Attribution assessment with confidence level'),
  indicators: z.array(z.string()).describe('Specific observed indicators and evidence'),
  threatLevel: z.enum(['critical', 'high', 'medium', 'low']).describe('Threat level to the peace process and international observers'),
  platforms: z.array(z.string()).describe('Platforms where this operation is active'),
});

const InfoEnvironmentSchema = z.object({
  dominantNarratives: z.array(NarrativeSchema).min(2).max(6).describe('Dominant narratives shaping the information environment'),
  infoOperations: z.array(InfoOperationSchema).max(4).describe('Identified information operations and influence campaigns'),
  platformDynamics: z.array(
    z.object({
      platform: z.string().describe('Platform or media type'),
      dominantTone: z.string().describe('Dominant tone and key narratives on this platform'),
      keyActors: z.array(z.string()).describe('Key actors active on this platform'),
      riskLevel: z.enum(['critical', 'high', 'medium', 'low']).describe('Risk level for disinformation and hostile narratives'),
    })
  ).max(5).describe('Per-platform dynamics assessment'),
  overallAssessment: z.string().describe('Integrated assessment of the information environment and strategic implications'),
  counterMessagingRecommendations: z.array(z.string()).min(3).max(6).describe('Prioritized counter-messaging recommendations'),
  keyAmplifiers: z.array(
    z.object({
      name: z.string(),
      platform: z.string(),
      alignment: z.enum(['hostile', 'neutral', 'friendly']).describe('Alignment relative to the peace process'),
    })
  ).max(8).describe('Key amplifier accounts and outlets'),
});

const DEMO_RESPONSE = {
  dominantNarratives: [
    {
      id: 'n1',
      title: 'Counter-terrorism framing',
      framing: 'GoN state media frames the conflict as a counterterrorism operation against a foreign-backed insurgency, systematically excluding DRM\'s political grievances.',
      amplifiers: ['Nordalian State Broadcasting', 'Presidential press office', 'GoN-aligned diaspora blogs'],
      platform: 'state_media' as const,
      trend: 'stable' as const,
      reachScore: 78,
      isHostile: true,
      counterNarrative: 'Amplify UNMN and OCHA documentation; highlight DRM\'s democratic demands and civilian support base.',
    },
    {
      id: 'n2',
      title: 'Humanitarian crisis narrative',
      framing: 'International media lead with civilian displacement and access restrictions, framing through a humanitarian rather than political lens.',
      amplifiers: ['BBC Africa', 'Al Jazeera English', 'NIMN investigative unit'],
      platform: 'international' as const,
      trend: 'rising' as const,
      reachScore: 65,
      isHostile: false,
    },
    {
      id: 'n3',
      title: 'DRM liberation movement framing',
      framing: 'Karovian-adjacent media frame DRM as a democratic liberation movement, downplaying DRM human rights violations.',
      amplifiers: ['Karovia Today', 'DRM diaspora Telegram channels', 'Westmark opposition media'],
      platform: 'diaspora' as const,
      trend: 'rising' as const,
      reachScore: 52,
      isHostile: false,
    },
  ],
  infoOperations: [
    {
      name: 'Operation MIRROR',
      type: 'coordinated_inauthentic' as const,
      attribution: 'Attributed to GoN Ministry of Information (OSINT analysis)',
      indicators: [
        '340+ newly-created social media accounts posting GoN talking points in coordinated bursts',
        'Identical phrasing across accounts within 2-minute windows (bot behavior indicator)',
        'Targeted harassment campaign against UNMN spokesperson accounts',
      ],
      threatLevel: 'high' as const,
      platforms: ['Twitter/X', 'Facebook', 'WhatsApp'],
    },
    {
      name: 'DRM propaganda channel',
      type: 'propaganda' as const,
      attribution: 'DRM Information Directorate (self-identified)',
      indicators: [
        'Official DRM Telegram channel posting unverified casualty claims',
        'Strategic release of GoN military operation details',
        'Framing all humanitarian incidents as deliberate GoN targeting',
      ],
      threatLevel: 'medium' as const,
      platforms: ['Telegram', 'YouTube'],
    },
  ],
  platformDynamics: [
    {
      platform: 'Twitter/X',
      dominantTone: 'Contested — GoN and DRM narratives clash with high-volume bot activity.',
      keyActors: ['GoN spokesperson', 'UNMN communications', 'DRM Information Directorate'],
      riskLevel: 'high' as const,
    },
    {
      platform: 'Telegram',
      dominantTone: 'DRM-favorable — closed channels with limited fact-checking.',
      keyActors: ['DRM official channel', 'Karovia-based support networks'],
      riskLevel: 'high' as const,
    },
    {
      platform: 'State television',
      dominantTone: 'GoN-controlled — no opposition voices.',
      keyActors: ['Nordalian State Broadcasting'],
      riskLevel: 'medium' as const,
    },
  ],
  overallAssessment: 'The information environment is highly polarized with two parallel ecosystems. The most significant risk is Operation MIRROR targeting international observers to delegitimize UNMN monitoring. Recommend UNMN rapid-response protocol (under 4 hours) for coordinated disinformation.',
  counterMessagingRecommendations: [
    'Establish UNMN rapid-response protocol (under 4 hours) for coordinated disinformation',
    'Support NIMN investigative unit with secure source protection infrastructure',
    'Brief international correspondents on Operation MIRROR attribution evidence',
    'Work with platform trust and safety teams to flag coordinated inauthentic networks',
    'Commission monthly narrative analysis to track campaign effectiveness',
  ],
  keyAmplifiers: [
    { name: 'UNMN Spokesperson', platform: 'Twitter/X', alignment: 'friendly' as const },
    { name: 'GoN Official', platform: 'Telegram', alignment: 'hostile' as const },
    { name: 'NIMN Investigative', platform: 'Web', alignment: 'neutral' as const },
    { name: 'DRM Info Directorate', platform: 'Telegram', alignment: 'hostile' as const },
    { name: 'BBC Africa', platform: 'Web/TV', alignment: 'neutral' as const },
  ],
};

export const POST = withAuth(async (request, _user) => {
  try {
    const creditCheck = await checkAndDeductCredits('ai_info_environment', 'Information environment scan');
    if (!creditCheck.allowed) return creditCheck.response!;

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    const body = await request.json();
    const { situation } = body as { situation?: Situation };
    const sitContext = situation ? buildToolContext(situation as Situation) : '';

    // --- Live intelligence feed (GDELT stability + events data) ---
    let intelContext = '';
    try {
      if (situation) {
        const intel = await getSituationIntelligence({
          country: situation.region || situation.name,
          query: situation.name,
          limit: 15,
        });
        if (intel.events.length > 0) {
          intelContext = '\n\nLIVE INTELLIGENCE FEED:\n' + intel.events.slice(0, 10).map(e =>
            `- [${e.source.toUpperCase()}] ${e.date}: ${e.title} (${e.severity})`
          ).join('\n');
        }
        if (intel.stability) {
          intelContext += `\n\nGDELT STABILITY INDEX:\nCurrent score: ${intel.stability.score} | Trend: ${intel.stability.trend}`;
        }
      }
    } catch { /* data feeds optional */ }

    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: InfoEnvironmentSchema }),
      prompt: `${sitContext ? `${sitContext}\n\n` : ''}${intelContext ? `${intelContext}\n\n` : ''}Conduct a rigorous information environment analysis for this conflict situation.

## ANALYTICAL FRAMEWORK

Apply the following NATO STRATCOM / UN DPPA information environment methodology:

**Narrative Ecosystem Mapping**
Identify 3-5 dominant narratives operating in the information environment. For each:
- Primary frame: how does this narrative frame the conflict, actors, and causes?
- Reach and amplification: who amplifies it and through which platforms?
- Trajectory: is this narrative gaining or losing traction?
- Hostility assessment: does this narrative undermine peace process or international norms?
- Counter-messaging: what factual counter-narrative can credibly address this?

**Information Operations Detection**
Apply EU DisinfoLab and Stanford Internet Observatory detection methodology:
- Coordinated Inauthentic Behavior (CIB): multiple accounts posting identical content, bot-like timing
- State-sponsored propaganda: identifiable state actors using media for political messaging
- Astroturfing: manufactured grassroots campaigns without organic support base
- Hack-and-leak: weaponized document releases timed to political events
For each operation: attribution assessment (high/medium/low confidence), platform mapping, threat level

**Platform Dynamics**
Assess per-platform information environment:
- Who controls the dominant narrative on each platform?
- What verification capacity exists for claims made on this platform?
- Is the platform accessible to international observers?
- What are the disinformation risks specific to this platform?

**Counter-Messaging Strategy**
Apply RESIST2 framework (Recognize, Early warning, Situational awareness, Issue, Sense-check, Tell a better story, Trustworthy sources):
- What narratives require urgent counter-messaging?
- Who are credible messengers for each counter-narrative?
- What channels are most effective for reaching target audiences?
- What institutional mechanisms (platform flagging, fact-checker coordination) are available?

Be specific to this situation. Do not produce generic frameworks — ground every finding in the specific conflict context, actors, and platforms.`,
      system: 'You are a senior information environment analyst trained in NATO STRATCOM methodology, EU DisinfoLab detection techniques, and UN DPPA communications strategy. You have extensive experience supporting peace operations with narrative analysis, information operations attribution, and counter-messaging strategy. Produce precise, evidence-anchored assessments for diplomatic professionals and UN communications advisors.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'info-environment');
  }
});
