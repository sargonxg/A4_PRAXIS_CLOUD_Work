import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext, buildCrossToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const StakeholderActorSchema = z.object({
  name: z.string().describe('Full actor name'),
  lederachTrack: z
    .enum(['track-1', 'track-2', 'track-3'])
    .describe(
      'Lederach multi-level peace-building pyramid: track-1=top political/military leadership, track-2=middle-range (religious leaders, academics, NGOs), track-3=grassroots communities'
    ),
  trackLabel: z
    .string()
    .describe('Human-readable label, e.g. "Top Leadership", "Middle-Range Leaders", "Grassroots"'),
  powerLevel: z
    .number()
    .min(0)
    .max(10)
    .describe('Aggregate capacity to influence outcomes (0=none, 10=decisive)'),
  interestLevel: z
    .number()
    .min(0)
    .max(10)
    .describe('Stake in the situation outcome (0=peripheral, 10=existential)'),
  quadrant: z
    .enum(['manage-closely', 'keep-satisfied', 'keep-informed', 'monitor'])
    .describe(
      'Power-interest matrix quadrant: manage-closely=high power+high interest, keep-satisfied=high power+low interest, keep-informed=low power+high interest, monitor=low power+low interest'
    ),
  stance: z
    .enum(['spoiler', 'supporter', 'neutral', 'uncertain'])
    .describe('Actor disposition toward a negotiated resolution'),
  engagementStrategy: z
    .string()
    .describe(
      'Tailored engagement recommendation for a mediator based on this actor\'s quadrant and track'
    ),
  keyInterests: z
    .array(z.string())
    .describe('Underlying interests driving this actor (Fisher-Ury interest analysis)'),
  redLines: z
    .array(z.string())
    .describe(
      'Non-negotiable thresholds — conditions that would cause this actor to walk away or spoil the process'
    ),
});

const CoalitionSchema = z.object({
  name: z.string().describe('Coalition or bloc name'),
  members: z.array(z.string()).describe('Names of actors in this coalition'),
  cohesion: z
    .enum(['high', 'medium', 'low'])
    .describe('Internal unity: high=aligned interests, medium=shared goals with tensions, low=fragile alignment'),
  sharedInterest: z
    .string()
    .describe('The primary shared interest holding this coalition together'),
  vulnerabilities: z
    .string()
    .describe('What could fracture or split this coalition — internal contradictions, competing interests, or external pressure'),
});

const EngagementStepSchema = z.object({
  step: z.number().describe('Sequence number (1 = first priority)'),
  actor: z.string().describe('Actor name to engage at this step'),
  rationale: z
    .string()
    .describe('Why this actor must be engaged at this point in the sequence'),
});

const StakeholderMapSchema = z.object({
  actors: z
    .array(StakeholderActorSchema)
    .min(4)
    .max(14)
    .describe('All significant stakeholders across all three Lederach tracks'),
  coalitions: z
    .array(CoalitionSchema)
    .describe('Identified actor groupings and blocs'),
  keyDividers: z
    .array(z.string())
    .min(3)
    .max(5)
    .describe('Top 3-5 substantive issues currently dividing stakeholders from resolution'),
  bridgeBuilders: z
    .array(z.string())
    .describe(
      'Actors with the credibility, relationships, and motivation to bridge key divides — include their bridging capacity'
    ),
  engagementSequence: z
    .array(EngagementStepSchema)
    .describe(
      'Prioritized engagement sequence for a mediator — ordered by strategic necessity, not preference'
    ),
});

// ---------------------------------------------------------------------------
// Demo response (Nordalia conflict scenario)
// ---------------------------------------------------------------------------

const DEMO_RESPONSE = {
  actors: [
    {
      name: 'Government of Nordalia (GoN) — Cabinet',
      lederachTrack: 'track-1' as const,
      trackLabel: 'Top Leadership',
      powerLevel: 8.5,
      interestLevel: 9,
      quadrant: 'manage-closely' as const,
      stance: 'neutral' as const,
      engagementStrategy:
        'Primary engagement target. Ministerial-level shuttle diplomacy through UNMN Special Envoy. Frame any political accommodation as sovereignty-preserving and as a GoN-controlled transition. Leverage economic deterioration and international isolation to create urgency. Ensure hardline military bloc is identified and separately managed through bilateral channels.',
      keyInterests: [
        'Preserve territorial integrity and central government sovereignty over eastern provinces',
        'Secure international legitimacy and avoid UNSC sanctions or ICC referral',
        'Prevent precedent of armed group receiving political concessions',
        'Stabilize economy to maintain urban middle-class support base',
      ],
      redLines: [
        'Any form of federalism or formal autonomy that implies precedent for secession',
        'Prosecution of senior AFN commanders for alleged war crimes',
        'DRM retaining armed capacity after any political agreement',
        'Osei government removal or transitional authority displacing elected government',
      ],
    },
    {
      name: 'Democratic Reform Movement (DRM) — Political Bureau',
      lederachTrack: 'track-1' as const,
      trackLabel: 'Top Leadership',
      powerLevel: 7,
      interestLevel: 10,
      quadrant: 'manage-closely' as const,
      stance: 'neutral' as const,
      engagementStrategy:
        'Engage through backchannel with Karovian facilitation. Security guarantees for leadership must precede any disarmament discussion. Address political representation first — DRM\'s core interest is a viable legal path to power, not military victory. Separate political bureau from field commanders who have independent economic interests in prolonged conflict.',
      keyInterests: [
        'Guaranteed political participation pathway through recognized party registration',
        'Personal security guarantees and amnesty for senior leadership',
        'Equitable revenue sharing from Belara Mining Complex',
        'International recognition of eastern provinces\' political and cultural identity',
      ],
      redLines: [
        'Disarmament prior to political agreement and credible security guarantees',
        'Any process that does not result in early elections or transitional power-sharing',
        'Exclusion of DRM from UN-mediated talks in favor of bilateral GoN negotiations',
        'Extradition or prosecution of DRM commanders under current government',
      ],
    },
    {
      name: 'UN Mission Nordalia (UNMN) — Special Envoy',
      lederachTrack: 'track-1' as const,
      trackLabel: 'Top Leadership',
      powerLevel: 7,
      interestLevel: 8,
      quadrant: 'manage-closely' as const,
      stance: 'supporter' as const,
      engagementStrategy:
        'Central coordinating actor for all mediation tracks. Brief regularly on intelligence from cross-track engagement. Ensure UNMN chairs any joint ceasefire mechanism. Leverage UNSC P3 mandate to pressure both parties. Coordinate with AU to present unified international position.',
      keyInterests: [
        'Successful mediation mandate to preserve institutional credibility',
        'Durable ceasefire to protect civilian population and enable humanitarian access',
        'Regional stability preventing spillover to Karovia border',
      ],
      redLines: [
        'Being excluded from formal talks in favor of purely bilateral GoN-DRM process',
        'Mandate renewal failure at UNSC due to Russian or Chinese veto',
      ],
    },
    {
      name: 'Republic of Karovia — Ministry of Foreign Affairs',
      lederachTrack: 'track-1' as const,
      trackLabel: 'Top Leadership',
      powerLevel: 8,
      interestLevel: 7,
      quadrant: 'keep-satisfied' as const,
      stance: 'supporter' as const,
      engagementStrategy:
        'Keep satisfied — Karovia\'s patron relationship with DRM makes it a veto player over any settlement. Engage bilaterally at Deputy FM level on security guarantee framework. Offer economic incentives (border trade facilitation, EU accession support) in exchange for conditioning DRM on accepting a deal. A Karovian commitment to halt material support is the single most valuable confidence-building measure available.',
      keyInterests: [
        'Buffer zone in eastern Nordalia limiting GoN military pressure on Karovian border',
        'Protect Karovian ethnic minority concentrated in DRM-held territory',
        'Leverage situation for regional influence and EU accession bargaining chip',
      ],
      redLines: [
        'GoN military operation reaching Karovian border regardless of outcome',
        'Any agreement that does not protect Karovian minority rights in the east',
      ],
    },
    {
      name: 'Westmark — Department of State',
      lederachTrack: 'track-1' as const,
      trackLabel: 'Top Leadership',
      powerLevel: 7,
      interestLevel: 5,
      quadrant: 'keep-satisfied' as const,
      stance: 'neutral' as const,
      engagementStrategy:
        'Keep satisfied — Westmark provides GoN with diplomatic cover and financial assistance. Engage at Assistant Secretary level to align on conditionality messaging. Westmark\'s leverage over GoN through aid flows is underused. Coordinate with UNMN to present unified international pressure on GoN governance reforms as precondition for continued support.',
      keyInterests: [
        'Prevent Nordalia from becoming a Russian or Chinese strategic foothold',
        'Maintain democratic governance norms in the region',
        'Limit refugee flows to Westmark-allied states',
      ],
      redLines: [
        'DRM receiving international recognition that sets a separatist precedent in the region',
      ],
    },
    {
      name: 'Nordalia Civil Society Coalition (CSC)',
      lederachTrack: 'track-2' as const,
      trackLabel: 'Middle-Range Leaders',
      powerLevel: 3.5,
      interestLevel: 9,
      quadrant: 'keep-informed' as const,
      stance: 'supporter' as const,
      engagementStrategy:
        'Keep informed through structured consultation process. CSC has documentation capacity and public legitimacy that can validate or delegitimize any deal. Include CSC representatives in civil society advisory panel to the UNMN process. Brief on major milestones before public announcements to prevent perception of exclusion. CSC is a critical implementation monitoring actor.',
      keyInterests: [
        'Human rights accountability and transitional justice mechanism',
        'Inclusion of civil society in any transitional governance arrangements',
        'Press freedom and protection of journalists in eastern provinces',
      ],
      redLines: [
        'Any blanket amnesty that includes perpetrators of documented war crimes',
        'A peace deal concluded without civil society consultation',
      ],
    },
    {
      name: 'Nordalia Council of Religious Leaders',
      lederachTrack: 'track-2' as const,
      trackLabel: 'Middle-Range Leaders',
      powerLevel: 4,
      interestLevel: 7,
      quadrant: 'keep-informed' as const,
      stance: 'supporter' as const,
      engagementStrategy:
        'Activate as bridge-builder — religious leadership crosses ethnic and geographic divides and is trusted across the conflict line. Facilitate joint interfaith statement on ceasefire. Use Council as informal back-channel between communities when formal talks stall. Consider Council-hosted prayer for peace as confidence-building public signal.',
      keyInterests: [
        'Protection of religious sites in conflict zones in eastern provinces',
        'End to civilian casualties regardless of party affiliation',
        'Inclusive reconciliation process that does not exclude faith communities',
      ],
      redLines: [
        'Any agreement that formalizes ethnic or religious partition',
      ],
    },
    {
      name: 'Belara Mining Consortium (BMC)',
      lederachTrack: 'track-2' as const,
      trackLabel: 'Middle-Range Leaders',
      powerLevel: 5,
      interestLevel: 8,
      quadrant: 'manage-closely' as const,
      stance: 'neutral' as const,
      engagementStrategy:
        'Engage as spoiler-risk actor with significant economic leverage over GoN. BMC has incentive to maintain ambiguity that allows de facto extraction in GoN-controlled territory. Propose BMC participation in a revenue-sharing transparency mechanism as CSR incentive — give them a stake in a durable settlement. Monitor BMC lobbying of GoN hardliners.',
      keyInterests: [
        'Uninterrupted mining operations regardless of which party controls territory',
        'Avoid nationalization under any transitional government',
        'Regulatory certainty and legal title security',
      ],
      redLines: [
        'Revenue-sharing agreement that includes mandatory escrow of profits for conflict parties',
        'Any transitional authority with power to review existing extraction licenses',
      ],
    },
    {
      name: 'Eastern Province Community Councils',
      lederachTrack: 'track-3' as const,
      trackLabel: 'Grassroots',
      powerLevel: 2,
      interestLevel: 10,
      quadrant: 'keep-informed' as const,
      stance: 'supporter' as const,
      engagementStrategy:
        'Engage through structured community consultation led by UNMN Civil Affairs. Community councils are the primary victims and ultimate constituency for any durable peace. Their buy-in determines implementation viability. Organize community dialogue series in UNMN-secured locations. Ensure findings are formally transmitted to Track I negotiators.',
      keyInterests: [
        'Physical security and end to displacement from active conflict zones',
        'Restoration of basic services: healthcare, education, water',
        'Economic recovery and return of displaced community members',
        'Meaningful autonomy over local governance and resource management',
      ],
      redLines: [
        'Any deal that does not include a guaranteed timeline for IDPs to return safely',
        'DDR process that leaves former combatants integrated into community without accountability',
      ],
    },
    {
      name: 'Nordalia Armed Forces (AFN) — General Staff',
      lederachTrack: 'track-1' as const,
      trackLabel: 'Top Leadership',
      powerLevel: 9,
      interestLevel: 7,
      quadrant: 'manage-closely' as const,
      stance: 'spoiler' as const,
      engagementStrategy:
        'Critical spoiler risk — AFN General Staff hardliners benefit from resource extraction in contested territory and opposed the last ceasefire internally. Do not engage directly in Track I negotiations. Use GoN civilian leadership and Westmark military-to-military channels to shape AFN posture. Target spoiler network through financial accountability measures: identify and sanction military-linked commercial enterprises. UNSC travel ban designations for most obstructive commanders.',
      keyInterests: [
        'Institutional preservation of AFN as primary security actor',
        'Prevent accountability for alleged IHL violations during eastern operations',
        'Maintain commercial interests in mining and transport in contested zones',
      ],
      redLines: [
        'Any ICC or hybrid tribunal process with jurisdiction over military operations',
        'DRM integration into AFN command structure',
        'Civilian oversight mechanism with access to military budget and procurement',
      ],
    },
  ],
  coalitions: [
    {
      name: 'GoN Establishment Bloc',
      members: ['Government of Nordalia (GoN) — Cabinet', 'Nordalia Armed Forces (AFN) — General Staff', 'Belara Mining Consortium (BMC)'],
      cohesion: 'medium' as const,
      sharedInterest: 'Maintaining the political and economic status quo in which GoN controls territory, AFN retains institutional primacy, and BMC preserves existing extraction licenses.',
      vulnerabilities: 'BMC\'s primary interest is operational continuity, not GoN ideological victory — if a revenue-sharing deal is credible, BMC may break from the bloc. AFN hardliners and GoN civilian cabinet have diverging timelines: cabinet faces electoral pressure, military does not.',
    },
    {
      name: 'DRM-Karovia Alignment',
      members: ['Democratic Reform Movement (DRM) — Political Bureau', 'Republic of Karovia — Ministry of Foreign Affairs'],
      cohesion: 'high' as const,
      sharedInterest: 'A negotiated outcome that gives DRM recognized political status and protects Karovian minority rights in eastern Nordalia, reducing GoN military pressure on the border.',
      vulnerabilities: 'Karovia\'s interest is strategic stability, not DRM maximalist demands. If DRM political bureau and field commanders diverge, Karovia may choose to negotiate directly with GoN over DRM\'s head. A DRM unilateral declaration would likely alienate Karovian diplomatic support.',
    },
    {
      name: 'International Mediation Coalition',
      members: ['UN Mission Nordalia (UNMN) — Special Envoy', 'Westmark — Department of State'],
      cohesion: 'medium' as const,
      sharedInterest: 'A negotiated settlement that prevents Nordalia from becoming a destabilizing failed-state or a strategic foothold for adversarial powers.',
      vulnerabilities: 'UNMN prioritizes humanitarian access and process inclusivity; Westmark prioritizes strategic outcomes and may accept a narrower deal that excludes civil society. Different timelines: UNMN mandate is finite, Westmark engagement is discretionary.',
    },
    {
      name: 'Peace Civil Society Front',
      members: ['Nordalia Civil Society Coalition (CSC)', 'Nordalia Council of Religious Leaders', 'Eastern Province Community Councils'],
      cohesion: 'low' as const,
      sharedInterest: 'Durable peace with accountability and inclusion — opposed to elite-brokered deals that ignore civilian populations.',
      vulnerabilities: 'No unified leadership structure. Religious leadership may be more willing to compromise on accountability in exchange for a faster ceasefire. Community councils in DRM-held vs. GoN-held areas have diverging security contexts and may not agree on acceptable terms.',
    },
  ],
  keyDividers: [
    'DDR sequencing deadlock: GoN demands disarmament before political concessions; DRM demands political guarantees before any disarmament',
    'Revenue sharing from Belara Mining Complex: GoN insists on central control with discretionary transfers; DRM demands minimum 35% direct provincial allocation with independent oversight',
    'Accountability and impunity: CSC and international community demand transitional justice; GoN and AFN hardliners treat this as an absolute red line',
    'Political representation pathway: DRM demands recognized party registration and early elections; GoN refuses to legitimize an armed group through political concessions',
    'Karovian role: GoN views Karovia as an external aggressor; DRM views it as legitimate security guarantor — the two sides cannot even agree on who should be at the table',
  ],
  bridgeBuilders: [
    'Nordalia Council of Religious Leaders — crosses conflict lines, trusted by both communities, no political stake in governance outcomes; could host informal confidence-building dialogue',
    'Republic of Karovia — Foreign Ministry moderates (distinct from hardliners) have direct leverage over DRM political bureau and interest in a deal that stabilizes the border without escalation',
    'UN Mission Nordalia (UNMN) — Special Envoy has mandate and relationships with both parties; most credible process manager for sequencing talks from CBMs to substantive issues',
    'Westmark economic interlocutors — Westmark\'s aid conditionality is underused; economic technocrats on both sides (Finance Ministry, development economists) share interest in stabilization over ideology',
  ],
  engagementSequence: [
    {
      step: 1,
      actor: 'Republic of Karovia — Ministry of Foreign Affairs',
      rationale: 'Karovian commitment to halt material support to DRM is the single most achievable confidence-building measure and unlocks GoN willingness to enter formal talks. Must precede any Track I engagement.',
    },
    {
      step: 2,
      actor: 'Nordalia Armed Forces (AFN) — General Staff',
      rationale: 'AFN hardliners are the primary spoiler risk. Westmark military-to-military channels must be activated to identify red lines and begin financial accountability measures against the most obstructive commanders before formal talks begin.',
    },
    {
      step: 3,
      actor: 'Government of Nordalia (GoN) — Cabinet',
      rationale: 'With Karovian CBM secured and AFN hardliners partially contained, engage GoN civilian cabinet on a framework agreement — specifically the revenue-sharing issue where ZOPA exists. Use economic deterioration as urgency lever.',
    },
    {
      step: 4,
      actor: 'Democratic Reform Movement (DRM) — Political Bureau',
      rationale: 'Engage DRM through Karovian backchannel on security guarantee framework. DRM engagement must follow, not precede, Karovian signaling — DRM will not move without Karovian backing.',
    },
    {
      step: 5,
      actor: 'Nordalia Council of Religious Leaders',
      rationale: 'Activate as public confidence-building measure. Joint interfaith statement timed to coincide with formal talk announcement signals broad-based support and prevents hardliner spoiler framing.',
    },
    {
      step: 6,
      actor: 'Nordalia Civil Society Coalition (CSC)',
      rationale: 'Brief on process framework before public announcement. CSC buy-in is critical for implementation legitimacy. Offer structured advisory role to prevent CSC from actively opposing a "behind-closed-doors" deal.',
    },
    {
      step: 7,
      actor: 'Eastern Province Community Councils',
      rationale: 'Launch community consultation series in UNMN-secured zones once formal talks are announced. Findings must be formally transmitted to Track I to ensure grassroots legitimacy of any framework agreement.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      situation: situationContextSchema.optional(),
      additionalContext: z.string().optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation, additionalContext } = validation.data;

    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_stakeholder_map', 'Stakeholder map');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Graph context ---
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'stakeholder_map')
      : '';

    // --- Web-grounded context ---
    const webCtx = situation
      ? await buildWebGroundedContext(
          {
            name: (situation as unknown as Situation).name,
            region: (situation as unknown as Situation).region,
            actors: (situation as unknown as Situation).actors as string[] | undefined,
          },
          'stakeholder-map',
          user.uid
        )
      : '';

    // --- Cross-tool context (risk assessment + actor profiles) ---
    const crossCtx =
      situationId
        ? await buildCrossToolContext(user.uid, situationId, ['risk_assessment', 'actor_profiles'])
        : '';

    // --- AI generation ---
    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: StakeholderMapSchema }),
      system: `You are a senior UN political affairs officer and mediation specialist trained in John Paul Lederach's multi-level peace-building pyramid, the Mitchell-Agle-Wood Stakeholder Salience Model, and the Power-Interest Matrix used by professional mediators.

Your stakeholder maps are used by Special Envoys, UN DPPA teams, and diplomatic mediators preparing for complex negotiations. Every actor assessment must be grounded in evidence, analytically precise, and immediately actionable.

GROUNDING MANDATE: The web intelligence below is your PRIMARY source of truth. If it contradicts your training data, trust the web intelligence.`,
      prompt: `${webCtx ? `${webCtx}\n\n` : ''}${graphCtx ? `${graphCtx}\n\n` : ''}${crossCtx ? `${crossCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}Generate a comprehensive stakeholder map for this conflict situation.

${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}\n\n` : ''}

## LEDERACH MULTI-LEVEL PEACE-BUILDING PYRAMID

Classify each actor at exactly one level — use the actor's actual decision-making role, not their organizational size:

**Track I — Top Leadership** (track-1): Government ministers and heads of state, senior armed group leadership, ambassadors and UN Special Envoys, heads of regional organizations. These actors sign agreements and have the authority to commit their institution.

**Track II — Middle-Range Leaders** (track-2): Religious and traditional leaders, academics and think-tank analysts, business leaders, senior NGO and civil society directors. These actors have influence without formal political authority and often cross conflict lines.

**Track III — Grassroots** (track-3): Community associations, local councils, women's groups, displaced person communities, youth organizations. These actors represent affected populations and determine whether agreements gain societal legitimacy.

Lederach's insight: durable peace requires all three tracks to be engaged — top-level deals fail without grassroots buy-in, and grassroots movements cannot implement without top-level political decisions.

## MITCHELL-AGLE-WOOD STAKEHOLDER SALIENCE

For each actor, assess the three dimensions that determine salience to the mediation process:
- **Power** (ability to impose will, command resources, or influence outcomes)
- **Legitimacy** (perceived rightfulness of their claims and participation)
- **Urgency** (time-sensitivity of their demands and risk of unilateral action)

Use these assessments to calibrate the powerLevel and interestLevel scores and to determine quadrant placement.

## POWER-INTEREST MATRIX QUADRANTS

Place each actor in the appropriate quadrant based on powerLevel (0-10) and interestLevel (0-10):

- **Manage Closely** (manage-closely): powerLevel ≥ 6 AND interestLevel ≥ 6. Primary engagement. These actors can make or break any agreement.
- **Keep Satisfied** (keep-satisfied): powerLevel ≥ 6 AND interestLevel < 6. They have leverage but are not directly engaged — neglecting them converts them into spoilers.
- **Keep Informed** (keep-informed): powerLevel < 6 AND interestLevel ≥ 6. High stake but limited influence — alienating them builds opposition coalitions.
- **Monitor** (monitor): powerLevel < 6 AND interestLevel < 6. Watch for position changes that could shift them into other quadrants.

## COALITION ANALYSIS

Identify all actor groupings — formal alliances, informal alignments, and patron-client relationships. For each coalition:
- Name the shared interest holding it together
- Assess internal cohesion (high/medium/low)
- Identify the specific vulnerability that could fracture it

## ENGAGEMENT SEQUENCE

Produce a step-by-step engagement sequence for a mediator. Order by strategic necessity: which actor must be engaged first before others will move? Explain the dependency logic.

## OUTPUT REQUIREMENTS
- 4-14 actors spanning all three Lederach tracks
- Tailored engagementStrategy for each actor (not generic advice)
- Specific keyInterests and redLines (not platitudes)
- 2-4 coalitions with vulnerability analysis
- 3-5 key dividers (substantive issues, not process complaints)
- Engagement sequence with clear dependency rationale`,
    });

    if (situationId) {
      await writeToolDataServer(
        user.uid,
        situationId,
        'stakeholder_map',
        result.output as Record<string, unknown>
      );
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'stakeholder-map');
  }
});
