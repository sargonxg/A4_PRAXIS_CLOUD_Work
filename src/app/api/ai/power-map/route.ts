import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext, buildCrossToolContext } from '@/lib/ai/situation-context';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { handleRouteError } from '@/lib/api/standard-error';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import type { Situation } from '@/types/situation';

export const maxDuration = 45;

// ── Power-map schema (view: 'power' | 'both', default) ───────────────────────

const PowerMapSchema = z.object({
  actors: z.array(
    z.object({
      id: z.string().describe('Short unique identifier (e.g. "gov", "drm")'),
      name: z.string().describe('Full actor name'),
      shortName: z.string().optional().describe('Abbreviated name for compact display'),
      type: z.enum(['state', 'non_state_armed', 'international', 'regional', 'civil_society', 'private_sector', 'media']).describe('Actor category'),
      power: z.number().min(1).max(10).describe('Power score: capacity to influence outcomes (1=minimal, 10=decisive)'),
      interest: z.number().min(1).max(10).describe('Interest score: stake in the situation outcome (1=peripheral, 10=existential)'),
      stance: z.enum(['supporter', 'opponent', 'neutral', 'spoiler', 'mediator']).describe('Stance toward the situation resolution'),
      color: z.string().describe('Hex color code for visualization'),
      keyLeverage: z.string().describe('Primary leverage point this actor holds'),
      engagementStrategy: z.string().describe('Recommended engagement strategy based on power/interest quadrant'),
      powerFaces: z.object({
        compulsory: z.object({ score: z.number().min(1).max(10), description: z.string() }),
        institutional: z.object({ score: z.number().min(1).max(10), description: z.string() }),
        structural: z.object({ score: z.number().min(1).max(10), description: z.string() }),
        productive: z.object({ score: z.number().min(1).max(10), description: z.string() }),
      }).optional(),
    })
  ).min(4).max(12).describe('Stakeholder actors with power/interest coordinates'),
  relationships: z.array(
    z.object({
      from: z.string().describe('Source actor ID'),
      to: z.string().describe('Target actor ID'),
      type: z.enum(['alliance', 'rivalry', 'diplomatic', 'support', 'dependency', 'proxy']).describe('Relationship type'),
      strength: z.number().min(1).max(10).describe('Relationship strength or intensity'),
      description: z.string().describe('Brief description of the relationship'),
    })
  ).describe('Relationships between actors'),
  quadrantSummary: z.object({
    keyPlayers: z.array(z.string()).describe('Actor IDs in high power + high interest quadrant — manage closely'),
    keepSatisfied: z.array(z.string()).describe('Actor IDs in high power + low interest quadrant — keep satisfied'),
    keepInformed: z.array(z.string()).describe('Actor IDs in low power + high interest quadrant — keep informed'),
    monitor: z.array(z.string()).describe('Actor IDs in low power + low interest quadrant — monitor periodically'),
  }).describe('2x2 power/interest quadrant classification'),
  coalitionDynamics: z.string().describe('Analysis of emerging coalitions, alliances, and bloc formation'),
  spoilerRisks: z.string().describe('Actors with spoiler potential and recommended neutralization strategies'),
  engagementPriorities: z.array(z.string()).describe('Prioritized list of engagement recommendations for the mediator/analyst'),
  leverageMap: z.array(z.object({
    from: z.string(),
    to: z.string(),
    type: z.enum(['economic', 'military', 'diplomatic', 'informational']),
    description: z.string(),
    strength: z.number().min(1).max(5),
  })).optional(),
  powerAsymmetry: z.array(z.object({
    actorA: z.string(),
    actorB: z.string(),
    ratio: z.number(),
    implication: z.string(),
  })).optional(),
});

// ── Stakeholder-salience schema (view: 'stakeholder') — Mitchell-Agle-Wood ───

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
    .describe("Tailored engagement recommendation for a mediator based on this actor's quadrant and track"),
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

// ── Demo responses ────────────────────────────────────────────────────────────

const DEMO_RESPONSE_POWER = {
  actors: [
    { id: 'gov', name: 'Government of the selected situation (GoN)', shortName: 'GoN', type: 'state' as const, power: 8, interest: 9, stance: 'opponent' as const, color: '#1A2332', keyLeverage: 'Territorial control, international legitimacy, AFN military capacity', engagementStrategy: 'Manage closely — decision-maker with high stakes. Engage at ministerial level. Frame any concessions as sovereignty-preserving.' },
    { id: 'drm', name: 'Democratic Reform Movement', shortName: 'DRM', type: 'non_state_armed' as const, power: 6, interest: 10, stance: 'opponent' as const, color: '#A63D40', keyLeverage: 'Territorial control of Eastern Provinces, armed capacity, civilian support base', engagementStrategy: 'Manage closely — existential stakes. Engage through backchannel and international interlocutors. Address security guarantees first.' },
    { id: 'unmn', name: 'UN Mission the selected situation', shortName: 'UNMN', type: 'international' as const, power: 7, interest: 8, stance: 'mediator' as const, color: '#4B92DB', keyLeverage: 'International legitimacy, monitoring capacity, multilateral forum reporting mandate', engagementStrategy: 'Key player — coordinate all mediation efforts. Leverage multilateral forum mandate for pressure on both parties.' },
    { id: 'karovia', name: 'Republic of Karovia', shortName: 'Karovia', type: 'state' as const, power: 8, interest: 7, stance: 'supporter' as const, color: '#5B8C5A', keyLeverage: 'DRM material support, border access, regional influence', engagementStrategy: 'Keep satisfied — regional patron with material leverage over DRM. Critical for ceasefire compliance. Engage bilaterally on security guarantees.' },
    { id: 'cso', name: 'Civil Society Coalition', shortName: 'CSO', type: 'civil_society' as const, power: 3, interest: 8, stance: 'supporter' as const, color: '#C8961E', keyLeverage: 'Public legitimacy, documentation capacity, diaspora networks', engagementStrategy: 'Keep informed — high interest but limited power. Consult regularly for ground-truth. Include in implementation monitoring.' },
    { id: 'au', name: 'African Union PSC', shortName: 'AU', type: 'regional' as const, power: 6, interest: 6, stance: 'neutral' as const, color: '#4B6584', keyLeverage: 'Regional framework, peer pressure on member states, financial support for mediation', engagementStrategy: 'Keep satisfied — regional legitimizer. Engage to co-sponsor mediation framework and provide meeting venue.' },
  ],
  relationships: [
    { from: 'gov', to: 'drm', type: 'rivalry' as const, strength: 9, description: 'Armed conflict since 2025; ceasefire fragile' },
    { from: 'karovia', to: 'drm', type: 'support' as const, strength: 7, description: 'Material support, suspected weapons transfers' },
    { from: 'unmn', to: 'gov', type: 'diplomatic' as const, strength: 6, description: 'Mission mandate; GoN tolerates but resists monitoring' },
    { from: 'unmn', to: 'drm', type: 'diplomatic' as const, strength: 5, description: 'Backchannel engagement; DRM seeks international recognition' },
    { from: 'au', to: 'unmn', type: 'alliance' as const, strength: 7, description: 'Joint mediation co-sponsorship' },
    { from: 'cso', to: 'gov', type: 'rivalry' as const, strength: 5, description: 'Human rights accountability demands' },
  ],
  quadrantSummary: {
    keyPlayers: ['gov', 'drm', 'unmn'],
    keepSatisfied: ['karovia'],
    keepInformed: ['cso'],
    monitor: ['au'],
  },
  coalitionDynamics: 'Two primary blocs are consolidating: (1) GoN-Westmark aligned bloc seeking military solution and internationally-supervised DDR; (2) DRM-Karovia bloc seeking autonomy agreement with revenue-sharing. The AU and UNMN occupy a contested middle ground. Civil society is aligned with DRM goals but not DRM methods. No third-party bloc has sufficient leverage to break the deadlock without Karovian de-escalation.',
  spoilerRisks: 'Primary spoiler risk: GoN hardliners in the military establishment who benefit from resource extraction in contested territory and oppose any political settlement. Secondary risk: DRM commanders with criminal networks in eastern provinces who would lose financial flows under any governance normalization. Neutralization: targeted financial accountability measures against military-linked enterprises; UN senior diplomatic forum travel ban designations for spoiler networks.',
  engagementPriorities: [
    'Secure Karovian commitment to halt material support to DRM as precondition for formal talks',
    'Engage GoN at Foreign Minister level on security guarantee framework for DRM leadership',
    'Activate AU-UNMN joint mediation framework with dedicated shuttle diplomacy track',
    'Brief CSO leadership on mediation process to maintain public legitimacy and implementation monitoring capacity',
    'Propose confidence-building measure: joint GoN-DRM prisoner release facilitated by ICRC',
  ],
};

const DEMO_RESPONSE_STAKEHOLDER = {
  actors: [
    {
      name: 'Government of the selected situation (GoN) — Cabinet',
      lederachTrack: 'track-1' as const,
      trackLabel: 'Top Leadership',
      powerLevel: 8.5,
      interestLevel: 9,
      quadrant: 'manage-closely' as const,
      stance: 'neutral' as const,
      engagementStrategy: 'Primary engagement target. Ministerial-level shuttle diplomacy through UNMN Special Envoy. Frame any political accommodation as sovereignty-preserving and as a GoN-controlled transition.',
      keyInterests: [
        'Preserve territorial integrity and central government sovereignty over eastern provinces',
        'Secure international legitimacy and avoid multilateral forum sanctions or ICC referral',
        'Prevent precedent of armed group receiving political concessions',
      ],
      redLines: [
        'Any form of federalism or formal autonomy that implies precedent for secession',
        'Prosecution of senior AFN commanders for alleged war crimes',
        'DRM retaining armed capacity after any political agreement',
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
      engagementStrategy: 'Engage through backchannel with Karovian facilitation. Security guarantees for leadership must precede any disarmament discussion.',
      keyInterests: [
        'Guaranteed political participation pathway through recognized party registration',
        'Personal security guarantees and amnesty for senior leadership',
        'Equitable revenue sharing from Belara Mining Complex',
      ],
      redLines: [
        'Disarmament prior to political agreement and credible security guarantees',
        'Any process that does not result in early elections or transitional power-sharing',
      ],
    },
    {
      name: 'UN Mission the selected situation (UNMN) — Special Envoy',
      lederachTrack: 'track-1' as const,
      trackLabel: 'Top Leadership',
      powerLevel: 7,
      interestLevel: 8,
      quadrant: 'manage-closely' as const,
      stance: 'supporter' as const,
      engagementStrategy: 'Central coordinating actor for all mediation tracks. Brief regularly on intelligence from cross-track engagement.',
      keyInterests: [
        'Successful mediation mandate to preserve institutional credibility',
        'Durable ceasefire to protect civilian population and enable humanitarian access',
      ],
      redLines: [
        'Being excluded from formal talks in favor of purely bilateral GoN-DRM process',
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
      engagementStrategy: "Keep satisfied — Karovia's patron relationship with DRM makes it a veto player. Engage bilaterally at Deputy FM level on security guarantee framework.",
      keyInterests: [
        'Buffer zone in eastern the selected situation limiting GoN military pressure on Karovian border',
        'Protect Karovian ethnic minority concentrated in DRM-held territory',
      ],
      redLines: [
        'GoN military operation reaching Karovian border regardless of outcome',
        'Any agreement that does not protect Karovian minority rights in the east',
      ],
    },
    {
      name: 'the selected situation Civil Society Coalition (CSC)',
      lederachTrack: 'track-2' as const,
      trackLabel: 'Middle-Range Leaders',
      powerLevel: 3.5,
      interestLevel: 9,
      quadrant: 'keep-informed' as const,
      stance: 'supporter' as const,
      engagementStrategy: 'Keep informed through structured consultation process. Include CSC representatives in civil society advisory panel to the UNMN process.',
      keyInterests: [
        'Human rights accountability and transitional justice mechanism',
        'Inclusion of civil society in any transitional governance arrangements',
      ],
      redLines: [
        'Any blanket amnesty that includes perpetrators of documented war crimes',
        'A peace deal concluded without civil society consultation',
      ],
    },
  ],
  coalitions: [
    {
      name: 'GoN Establishment Bloc',
      members: ['Government of the selected situation (GoN) — Cabinet', 'the selected situation Armed Forces (AFN) — General Staff'],
      cohesion: 'medium' as const,
      sharedInterest: 'Maintaining the political and economic status quo.',
      vulnerabilities: 'AFN hardliners and GoN civilian cabinet have diverging timelines: cabinet faces electoral pressure, military does not.',
    },
    {
      name: 'DRM-Karovia Alignment',
      members: ['Democratic Reform Movement (DRM) — Political Bureau', 'Republic of Karovia — Ministry of Foreign Affairs'],
      cohesion: 'high' as const,
      sharedInterest: 'A negotiated outcome that gives DRM recognized political status and protects Karovian minority rights.',
      vulnerabilities: "If DRM political bureau and field commanders diverge, Karovia may choose to negotiate directly with GoN over DRM's head.",
    },
  ],
  keyDividers: [
    'DDR sequencing deadlock: GoN demands disarmament before political concessions; DRM demands political guarantees before any disarmament',
    'Revenue sharing from Belara Mining Complex',
    'Accountability and impunity: CSC demands transitional justice; GoN and AFN treat this as a red line',
    'Political representation pathway: DRM demands recognized party registration and early elections',
    'Karovian role in any settlement framework',
  ],
  bridgeBuilders: [
    'the selected situation Council of Religious Leaders — crosses conflict lines, trusted by both communities',
    'Republic of Karovia — Foreign Ministry moderates have direct leverage over DRM political bureau',
    'UN Mission the selected situation (UNMN) — Special Envoy has mandate and relationships with both parties',
  ],
  engagementSequence: [
    {
      step: 1,
      actor: 'Republic of Karovia — Ministry of Foreign Affairs',
      rationale: 'Karovian commitment to halt material support to DRM is the single most achievable confidence-building measure and unlocks GoN willingness to enter formal talks.',
    },
    {
      step: 2,
      actor: 'Government of the selected situation (GoN) — Cabinet',
      rationale: 'With Karovian CBM secured, engage GoN civilian cabinet on the revenue-sharing issue where ZOPA exists.',
    },
    {
      step: 3,
      actor: 'Democratic Reform Movement (DRM) — Political Bureau',
      rationale: 'Engage DRM through Karovian backchannel on security guarantee framework after Karovian signaling.',
    },
  ],
};

// ── Route handler ─────────────────────────────────────────────────────────────

export const POST = withCalibration('power_map', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string; actors?: string[] } | undefined;
    const actors = Array.isArray(s?.actors) ? s.actors.slice(0, 5).join(', ') : '';
    return [s?.name, s?.region, actors].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, user) => {
  try {
    const body = await request.json() as {
      situation?: Situation;
      additionalContext?: string;
      situationId?: string;
      view?: 'power' | 'stakeholder' | 'both';
    };

    const { situation, additionalContext, view = 'power' } = body;
    // Accept situationId from body (used by stakeholder view refresh buttons)
    const situationId = situation?.id ?? body.situationId ?? '';

    // ── Sample mode ──────────────────────────────────────────────────────────────
    if (isServerDemoMode()) {
      return NextResponse.json(view === 'stakeholder' ? DEMO_RESPONSE_STAKEHOLDER : DEMO_RESPONSE_POWER);
    }

    // Credits + profile gate already handled by withCalibration above.

    // Calibrated analyst-profile + output-constraints (shared across views)
    const { systemPromptBlock, outputConstraints, provenance } = user.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    // ── Stakeholder view — Mitchell-Agle-Wood salience model (absorbed from /api/ai/stakeholder-map) ──
    if (view === 'stakeholder') {
      const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';

      const graphCtx = situationId
        ? await buildGraphContext(user.uid, situationId, 'stakeholder_map')
        : '';

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

      const crossCtx = situationId
        ? await buildCrossToolContext(user.uid, situationId, ['risk_assessment', 'actor_profiles'])
        : '';

      const result = await callProModel({
        output: Output.object({ schema: StakeholderMapSchema }),
        system: `You are a senior multilateral diplomacy practitioner and mediation specialist trained in John Paul Lederach's multi-level peace-building pyramid, the Mitchell-Agle-Wood Stakeholder Salience Model, and the Power-Interest Matrix used by professional mediators.

Your stakeholder maps are used by Special Envoys, multilateral diplomacy teams, and diplomatic mediators preparing for complex negotiations. Every actor assessment must be grounded in evidence, analytically precise, and immediately actionable.

GROUNDING MANDATE: The web intelligence below is your PRIMARY source of truth. If it contradicts your training data, trust the web intelligence.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
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
        await saveToolOutput({
          uid: user.uid,
          situationId,
          toolId: 'stakeholder_map',
          profileVersion: provenance.profileVersion,
          output: result.output as Record<string, unknown>,
        }).catch((err) => console.warn('[stakeholder_map] saveToolOutput failed:', err));
      }

      return NextResponse.json(result.output);
    }

    // ── Power view (default) — Barnett-Duvall four faces of power ────────────

    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';

    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'power_map').catch(() => '')
      : '';

    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as Situation).name, region: (situation as Situation).region, actors: (situation as Situation).actors },
          'power-map',
          user.uid
        ).catch(() => '')
      : '';

    const result = await callProModel({
      output: Output.object({ schema: PowerMapSchema }),
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${webCtx}${webCtx ? '\n\n' : ''}${sitContext ? `${sitContext}\n\n` : ''}Generate a rigorous stakeholder power map for this conflict situation.

${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}\n\n` : ''}

## BARNETT-DUVALL FOUR FACES OF POWER

For each actor, assess all four dimensions of power:

**Compulsory Power** (direct coercive control — military, economic sanctions, physical force): Score 1-10 with description.

**Institutional Power** (control through rules, procedures, organizations — multilateral forum votes, treaty obligations, formal authority): Score 1-10 with description.

**Structural Power** (shaping the structures within which actors operate — financial systems, trade networks, security architecture): Score 1-10 with description.

**Productive Power** (constituting social subjects and their capacities — narrative control, legitimacy, identity framing): Score 1-10 with description.

## POWER/INTEREST FRAMEWORK

**Power Score (1-10)**: Actor's aggregate capacity across all four faces to influence situation outcomes
- 9-10: Decisive veto/control (parties to the conflict, multilateral forum P5)
- 7-8: Significant influence (regional patrons, UN missions, major donors)
- 5-6: Meaningful leverage (regional organizations, diaspora groups)
- 3-4: Limited influence (civil society, local business, media)
- 1-2: Marginal (observers, small states, academic actors)

**Interest Score (1-10)**: Actor's stake in the outcome
- 9-10: Existential (direct parties with survival stakes)
- 7-8: High strategic interest (neighboring states, regional hegemons)
- 5-6: Significant interest (international organizations with mandate)
- 3-4: Limited interest (distant states, general civil society)
- 1-2: Peripheral (bystanders, weakly affected parties)

## QUADRANT STRATEGY (Mitchell/Agle/Wood stakeholder model)
- **Key Players** (High Power + High Interest): Manage closely — primary engagement
- **Keep Satisfied** (High Power + Low Interest): Prevent escalation to opposition
- **Keep Informed** (Low Power + High Interest): Prevent grievances from motivating coalition-building
- **Monitor** (Low Power + Low Interest): Watch for position changes

## LEVERAGE MAP
For the most significant inter-actor leverage relationships, specify: who holds leverage over whom, type (economic/military/diplomatic/informational), description, and strength (1-5).

## POWER ASYMMETRY
Identify the most significant power imbalances between actor pairs — compute a ratio and explain its strategic implication for mediation.

## COLOR CONVENTIONS
States/governments: #1A2332 (dark) or #5B8C5A (allied) or #8395a7 (neutral)
Non-state armed: #A63D40 (opposition) or #C75B39 (militia)
International orgs: #4B92DB (multilateral) or #4B6584 (regional)
Civil society: #C8961E (domestic) or #E8B931 (diaspora)

Generate 5-10 actors. Be specific about leverage, stance, and engagement strategy.`,
      system: `You are a senior multilateral diplomacy practitioner and stakeholder mapping specialist trained in the Barnett-Duvall four faces of power framework (compulsory, institutional, structural, productive) and the Mitchell/Agle/Wood stakeholder model. Produce precise, evidence-anchored power maps that capture all dimensions of power for mediators and diplomatic professionals.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
    });

    if (situationId && user.uid) {
      await writeToolDataServer(user.uid, situationId, 'power_map', result.output as Record<string, unknown>).catch(
        (err) => console.error('[power-map] persist failed:', err),
      );
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'power_map',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[power-map] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'power-map');
  }
});
