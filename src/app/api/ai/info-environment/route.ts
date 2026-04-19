import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// Ben Nimmo 4D framework fields: each tactic described as a string
// explaining how the actor applies that specific tactic for this narrative
const FourDSchema = z.object({
  dismiss: z.string().describe('How this narrative delegitimizes opposing voices, denies credibility, or attacks the messenger'),
  distort: z.string().describe('How this narrative spreads false or misleading content, misrepresents facts, or cherry-picks evidence'),
  distract: z.string().describe('How this narrative floods the information space, shifts attention, or drowns out competing messages'),
  dismay: z.string().describe('How this narrative amplifies divisive or demoralizing content to sow despair or paralysis in target audiences'),
  dominantTactic: z.enum(['dismiss', 'distort', 'distract', 'dismay', 'mixed']).describe("The dominant 4D tactic this narrative relies on most heavily"),
});

const NarrativeSchema = z.object({
  id: z.string().describe('Short unique identifier'),
  title: z.string().describe('Concise narrative title'),
  framing: z.string().describe('How this narrative frames the conflict — angle, emphasis, omissions'),
  amplifiers: z.array(z.string()).describe('Key actors and outlets amplifying this narrative'),
  platforms: z.array(z.string()).describe('Platforms where this narrative dominates (e.g., ["Twitter/X", "Telegram", "State TV"])'),
  trend: z.enum(['rising', 'stable', 'declining']).describe('Current trajectory of this narrative'),
  reachScore: z.number().min(0).max(100).describe('Estimated relative reach within the information environment'),
  isHostile: z.boolean().describe('Whether this narrative is hostile to peace process or international norms'),
  originator: z.string().describe('Assessed originator or primary source of this narrative'),
  strategicObjective: z.string().describe('Assessed strategic objective behind this narrative'),
  fourD: FourDSchema.describe("Ben Nimmo 4D framework analysis for this narrative"),
});

const ActorInfoSchema = z.object({
  actor: z.string().describe('Actor name'),
  amplificationNetworks: z.array(z.string()).describe('Proxy channels, bot networks, diaspora outlets, or state-aligned media that this actor uses to amplify narratives (e.g., "GoN-aligned Telegram clusters", "Karovia diaspora blogs", "state-sponsored bot farm on Twitter/X")'),
  primaryNarratives: z.array(z.string()).describe('Narrative IDs this actor is most associated with'),
  infoCapacity: z.enum(['high', 'medium', 'low']).describe('Assessed capacity to conduct information operations'),
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
  dominantNarratives: z.array(NarrativeSchema).min(2).max(6).describe('Dominant narratives shaping the information environment, each with full 4D analysis'),
  actorInfoProfiles: z.array(ActorInfoSchema).min(2).max(6).describe('Per-actor information operation profiles with amplification network mapping'),
  infoOperations: z.array(InfoOperationSchema).max(4).describe('Identified information operations and influence campaigns'),
  platformDynamics: z.array(
    z.object({
      platform: z.string().describe('Platform or media type'),
      dominantTone: z.string().describe('Dominant tone and key narratives on this platform'),
      keyActors: z.array(z.string()).describe('Key actors active on this platform'),
      riskLevel: z.enum(['critical', 'high', 'medium', 'low']).describe('Risk level for disinformation and hostile narratives'),
    })
  ).max(5).describe('Per-platform dynamics assessment'),
  counterNarrativeOpportunities: z.array(z.object({
    narrative: z.string().describe('The hostile narrative this opportunity targets'),
    vulnerabilities: z.string().describe('Specific weaknesses or contradictions in the hostile narrative that can be exploited'),
    recommendedCounter: z.string().describe('The specific counter-narrative or messaging strategy to deploy'),
    messenger: z.string().describe('Who should deliver this counter-narrative (e.g., "UNMN Spokesperson", "Civil society leaders", "Regional faith leaders") and why they are credible for this audience'),
  })).min(2).max(5).describe('Strategic counter-narrative opportunities: identify the hostile narrative, its vulnerabilities, the recommended counter, and who should deliver it'),
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
      platforms: ['State TV', 'Twitter/X', 'Facebook'],
      trend: 'stable' as const,
      reachScore: 78,
      isHostile: true,
      originator: 'GoN Ministry of Information',
      strategicObjective: 'Delegitimize DRM internationally and justify military operations under counter-terrorism mandate',
      fourD: {
        dismiss: 'Consistently labels DRM leaders as "terrorist commanders" and "foreign puppets," denying their political legitimacy and discrediting UNMN monitors as "naive" or "biased."',
        distort: 'Misrepresents DRM\'s democratic reform demands as foreign-backed subversion; fabricates casualty figures attributing civilian deaths to DRM rather than GoN operations.',
        distract: 'Floods state channels with security-framed content (troop deployments, border incidents) to bury coverage of DRM\'s political platform and peace proposals.',
        dismay: 'Amplifies footage of DRM attacks on infrastructure to sow fear among civilian populations and reduce domestic support for negotiation.',
        dominantTactic: 'distort' as const,
      },
    },
    {
      id: 'n2',
      title: 'Humanitarian crisis narrative',
      framing: 'International media lead with civilian displacement and access restrictions, framing through a humanitarian rather than political lens.',
      amplifiers: ['BBC Africa', 'Al Jazeera English', 'NIMN investigative unit'],
      platforms: ['Web', 'TV', 'Twitter/X'],
      trend: 'rising' as const,
      reachScore: 65,
      isHostile: false,
      originator: 'International correspondents and OCHA communications',
      strategicObjective: 'Maintain international attention and pressure for humanitarian access',
      fourD: {
        dismiss: 'Minimal use — narrative is evidence-based and does not rely on discrediting opponents.',
        distort: 'Minimal distortion; occasional framing omits political context but does not fabricate.',
        distract: 'Not applicable — narrative focuses rather than distracts.',
        dismay: 'Displacement figures and camp conditions can create despair, though intent is advocacy rather than manipulation.',
        dominantTactic: 'mixed' as const,
      },
    },
    {
      id: 'n3',
      title: 'DRM liberation movement framing',
      framing: 'Karovia-adjacent media frame DRM as a democratic liberation movement, downplaying DRM human rights violations.',
      amplifiers: ['Karovia Today', 'DRM diaspora Telegram channels', 'Westmark opposition media'],
      platforms: ['Telegram', 'YouTube', 'Web'],
      trend: 'rising' as const,
      reachScore: 52,
      isHostile: false,
      originator: 'DRM Information Directorate and Karovian state media',
      strategicObjective: 'Build international sympathy and legitimacy for DRM political position',
      fourD: {
        dismiss: 'Dismisses GoN as an illegitimate authoritarian regime; frames international silence as complicity.',
        distort: 'Omits or minimizes documented DRM human rights violations; overstates civilian support base.',
        distract: 'Shifts focus to GoN atrocities when DRM violations are raised.',
        dismay: 'Publishes graphic GoN strike footage to galvanize diaspora support and pressure Westmark governments.',
        dominantTactic: 'dismiss' as const,
      },
    },
  ],
  actorInfoProfiles: [
    {
      actor: 'Government of Nordalia (GoN)',
      amplificationNetworks: ['Nordalian State Broadcasting (NSB) — fully state-controlled', 'GoN-aligned diaspora blogs in Westmark', '340+ suspected bot accounts on Twitter/X (Operation MIRROR)', 'GoN Ministry of Information Telegram channel'],
      primaryNarratives: ['n1'],
      infoCapacity: 'high' as const,
    },
    {
      actor: 'DRM (Democratic Reform Movement)',
      amplificationNetworks: ['Official DRM Telegram channel (self-identified)', 'Karovia-based support networks', 'Westmark opposition media sympathizers', 'DRM diaspora WhatsApp broadcast lists'],
      primaryNarratives: ['n3'],
      infoCapacity: 'medium' as const,
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
  counterNarrativeOpportunities: [
    {
      narrative: 'Counter-terrorism framing (n1)',
      vulnerabilities: 'The GoN counter-terrorism narrative is contradicted by documented civilian casualty patterns and DRM\'s participation in prior electoral processes. NIMN investigative reporting has exposed three specific fabrications in GoN casualty claims.',
      recommendedCounter: 'Center DRM\'s documented political demands and democratic history. Amplify UNMN monitoring reports that contradict GoN casualty figures. Reframe: "political grievances, not terrorism."',
      messenger: 'UNMN Spokesperson and OCHA — perceived as neutral international bodies. Faith leaders and civil society figures inside Nordalia have highest domestic credibility. Avoid Karovian state media as messenger (perceived partisan).',
    },
    {
      narrative: 'Operation MIRROR bot network (infoOps)',
      vulnerabilities: 'Coordinated inauthentic behavior is technically attributable and publicly exposable. Platform trust-and-safety teams can act on OSINT evidence. Journalists covering the conflict are receptive to bot attribution stories.',
      recommendedCounter: 'Publish OSINT attribution report on Operation MIRROR; coordinate with Twitter/X and Facebook trust-and-safety; brief international correspondents to inoculate their coverage against amplified talking points.',
      messenger: 'NIMN investigative unit (credible, independent, regional) with technical support from DFRLab or Stanford Internet Observatory to provide international credibility for attribution claims.',
    },
  ],
  overallAssessment: 'The information environment is highly polarized with two parallel ecosystems. The most significant risk is Operation MIRROR targeting international observers to delegitimize UNMN monitoring. GoN\'s dominant tactic is Distort, with heavy fabrication of casualty data. DRM\'s dominant tactic is Dismiss, delegitimizing GoN internationally. Recommend UNMN rapid-response protocol (under 4 hours) for coordinated disinformation.',
  counterMessagingRecommendations: [
    'Establish UNMN rapid-response protocol (under 4 hours) for coordinated disinformation',
    'Support NIMN investigative unit with secure source protection infrastructure',
    'Brief international correspondents on Operation MIRROR attribution evidence',
    'Work with platform trust and safety teams to flag coordinated inauthentic networks',
    'Commission monthly narrative analysis to track campaign effectiveness',
    'Develop inoculation messaging for UNMN audiences before GoN escalates bot campaigns',
  ],
  keyAmplifiers: [
    { name: 'UNMN Spokesperson', platform: 'Twitter/X', alignment: 'friendly' as const },
    { name: 'GoN Official', platform: 'Telegram', alignment: 'hostile' as const },
    { name: 'NIMN Investigative', platform: 'Web', alignment: 'neutral' as const },
    { name: 'DRM Info Directorate', platform: 'Telegram', alignment: 'hostile' as const },
    { name: 'BBC Africa', platform: 'Web/TV', alignment: 'neutral' as const },
  ],
};

export const POST = withCalibration('info_environment', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    return [s?.name, s?.region].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      situation: situationContextSchema.optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation } = validation.data;
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // Credits + profile gate already handled by withCalibration above.

    // --- Graph context ---
    const graphCtx = situationId
      ? await buildGraphContext(ctx.uid, situationId, 'info_environment')
      : '';

    // --- Web-grounded context ---
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'info-environment',
          ctx.uid
        )
      : '';

    // --- Calibrated system prompt ---
    const { systemPromptBlock, outputConstraints, provenance } = ctx.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    const result = await callProModel({
      output: Output.object({ schema: InfoEnvironmentSchema }),
      system: `You are a senior information environment analyst trained in NATO STRATCOM methodology, EU DisinfoLab detection techniques, UN DPPA communications strategy, and Ben Nimmo's 4D disinformation framework (Dismiss, Distort, Distract, Dismay). You have extensive experience supporting peace operations with narrative analysis, information operations attribution, amplification network mapping, and counter-messaging strategy.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}

GROUNDING MANDATE: Web intelligence is the PRIMARY source of truth. Ground every finding in the specific conflict context, actors, and platforms. Do not produce generic frameworks.

For EVERY narrative: populate all four 4D fields (dismiss, distort, distract, dismay) as specific, evidence-anchored strings describing HOW this narrative uses that tactic, then select the dominantTactic. Even non-hostile narratives should have 4D analysis — note where a tactic is "not applicable" or "minimal" with explanation.

For EVERY actor: map their amplification networks — proxies, bot networks, diaspora channels, state-aligned media they use to extend reach.

For counter-narrative opportunities: identify specific vulnerabilities in hostile narratives, recommend precise counter-messaging, and crucially — name WHO should deliver the counter and WHY they are credible to the target audience.`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${webCtx ? `${webCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}Conduct a rigorous information environment analysis for this conflict situation.

## ANALYTICAL FRAMEWORK

### 1. Narrative Ecosystem Mapping (dominantNarratives)
Identify 3-5 dominant narratives. For each narrative:

**Framing & Reach**
- Primary frame: how does this narrative frame the conflict, actors, and causes?
- Which platforms dominate distribution? (platforms field — be specific: "Telegram", "State TV", "Twitter/X", "WhatsApp", "YouTube")
- Reach trajectory: rising / stable / declining?
- Hostility assessment: does this narrative undermine peace process or international norms?

**Ben Nimmo 4D Framework (REQUIRED for every narrative)**
Apply all four dimensions as distinct, evidence-anchored strings:
- dismiss: How does this narrative delegitimize opposing voices, deny credibility of critics, or attack the messenger?
- distort: How does this narrative spread false/misleading content, misrepresent facts, cherry-pick evidence?
- distract: How does this narrative flood the zone, shift attention, or drown out competing messages?
- dismay: How does this narrative amplify divisive/demoralizing content to sow despair or paralysis?
- dominantTactic: which single 4D dimension is the PRIMARY mechanism? ('mixed' only if two are genuinely co-equal)

**Attribution**
- originator: assessed primary source (with confidence level)
- strategicObjective: what political/military outcome is this narrative designed to achieve?

### 2. Actor Information Profiles (actorInfoProfiles)
For each major actor (2-6 actors), map:
- amplificationNetworks: list specific proxies, bot networks, diaspora channels, and state-aligned media they operate or exploit
- primaryNarratives: which narrative IDs they drive
- infoCapacity: high/medium/low — their assessed capacity to conduct information operations

### 3. Information Operations Detection (infoOperations)
Apply EU DisinfoLab and Stanford Internet Observatory methodology:
- Coordinated Inauthentic Behavior (CIB): multiple accounts, identical phrasing, bot timing
- State-sponsored propaganda: identifiable state actors using media for political messaging
- Astroturfing: manufactured grassroots without organic support base
- Hack-and-leak: weaponized document releases timed to political events
For each: attribution (with confidence), platform mapping, threat level to peace process

### 4. Platform Dynamics (platformDynamics)
Assess per-platform (up to 5 platforms):
- Who controls the dominant narrative on each platform?
- What verification capacity exists?
- Is the platform accessible to international observers?
- What are the disinformation risks specific to this platform?

### 5. Counter-Narrative Opportunities (counterNarrativeOpportunities)
For each hostile narrative requiring counter-messaging:
- narrative: which hostile narrative is targeted
- vulnerabilities: specific weaknesses, contradictions, or exposed fabrications in the hostile narrative
- recommendedCounter: precise counter-narrative or messaging strategy
- messenger: WHO should deliver this (name specific actors, institutions, or community leaders) and WHY they are credible to the target audience — NOT generic "international community"

### 6. Overall Assessment & Recommendations
Synthesize the information environment: which actor dominates, what is the most dangerous operation, what is the most urgent counter-messaging priority. Apply RESIST2 framework for counterMessagingRecommendations.`,
    });

    if (situationId) {
      await writeToolDataServer(ctx.uid, situationId, 'info_environment', result.output as Record<string, unknown>);
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'info_environment',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[info_environment] saveToolOutput failed:', err));
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'info-environment');
  }
});
