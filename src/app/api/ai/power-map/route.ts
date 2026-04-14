import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import { writeToolDataServer } from '@/lib/ai/context-builder-server';
import type { Situation } from '@/types/situation';

export const maxDuration = 45;

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

const DEMO_RESPONSE = {
  actors: [
    { id: 'gov', name: 'Government of Nordalia (GoN)', shortName: 'GoN', type: 'state' as const, power: 8, interest: 9, stance: 'opponent' as const, color: '#1A2332', keyLeverage: 'Territorial control, international legitimacy, AFN military capacity', engagementStrategy: 'Manage closely — decision-maker with high stakes. Engage at ministerial level. Frame any concessions as sovereignty-preserving.' },
    { id: 'drm', name: 'Democratic Reform Movement', shortName: 'DRM', type: 'non_state_armed' as const, power: 6, interest: 10, stance: 'opponent' as const, color: '#A63D40', keyLeverage: 'Territorial control of Eastern Provinces, armed capacity, civilian support base', engagementStrategy: 'Manage closely — existential stakes. Engage through backchannel and international interlocutors. Address security guarantees first.' },
    { id: 'unmn', name: 'UN Mission Nordalia', shortName: 'UNMN', type: 'international' as const, power: 7, interest: 8, stance: 'mediator' as const, color: '#4B92DB', keyLeverage: 'International legitimacy, monitoring capacity, UNSC reporting mandate', engagementStrategy: 'Key player — coordinate all mediation efforts. Leverage UNSC mandate for pressure on both parties.' },
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
  spoilerRisks: 'Primary spoiler risk: GoN hardliners in the military establishment who benefit from resource extraction in contested territory and oppose any political settlement. Secondary risk: DRM commanders with criminal networks in eastern provinces who would lose financial flows under any governance normalization. Neutralization: targeted financial accountability measures against military-linked enterprises; UN Security Council travel ban designations for spoiler networks.',
  engagementPriorities: [
    'Secure Karovian commitment to halt material support to DRM as precondition for formal talks',
    'Engage GoN at Foreign Minister level on security guarantee framework for DRM leadership',
    'Activate AU-UNMN joint mediation framework with dedicated shuttle diplomacy track',
    'Brief CSO leadership on mediation process to maintain public legitimacy and implementation monitoring capacity',
    'Propose confidence-building measure: joint GoN-DRM prisoner release facilitated by ICRC',
  ],
};

export const POST = withAuth(async (request, user) => {
  try {
    const creditCheck = await checkAndDeductCredits('ai_power_map', 'Stakeholder power map generation');
    if (!creditCheck.allowed) return creditCheck.response!;

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    const body = await request.json();
    const { situation, additionalContext } = body as {
      situation?: Situation;
      additionalContext?: string;
    };
    const situationId = situation?.id ?? '';

    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';

    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as Situation).name, region: (situation as Situation).region, actors: (situation as Situation).actors },
          'power-map',
          user.uid
        )
      : '';

    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: PowerMapSchema }),
      prompt: `${webCtx}${webCtx ? '\n\n' : ''}${sitContext ? `${sitContext}\n\n` : ''}Generate a rigorous stakeholder power map for this conflict situation.

${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}\n\n` : ''}

## BARNETT-DUVALL FOUR FACES OF POWER

For each actor, assess all four dimensions of power:

**Compulsory Power** (direct coercive control — military, economic sanctions, physical force): Score 1-10 with description.

**Institutional Power** (control through rules, procedures, organizations — UNSC votes, treaty obligations, formal authority): Score 1-10 with description.

**Structural Power** (shaping the structures within which actors operate — financial systems, trade networks, security architecture): Score 1-10 with description.

**Productive Power** (constituting social subjects and their capacities — narrative control, legitimacy, identity framing): Score 1-10 with description.

## POWER/INTEREST FRAMEWORK

**Power Score (1-10)**: Actor's aggregate capacity across all four faces to influence situation outcomes
- 9-10: Decisive veto/control (parties to the conflict, UNSC P5)
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
International orgs: #4B92DB (UN/multilateral) or #4B6584 (regional)
Civil society: #C8961E (domestic) or #E8B931 (diaspora)

Generate 5-10 actors. Be specific about leverage, stance, and engagement strategy.`,
      system: 'You are a senior UN political affairs officer and stakeholder mapping specialist trained in the Barnett-Duvall four faces of power framework (compulsory, institutional, structural, productive) and the Mitchell/Agle/Wood stakeholder model. Produce precise, evidence-anchored power maps that capture all dimensions of power for mediators and diplomatic professionals.',
    });

    if (situationId && user.uid) {
      await writeToolDataServer(user.uid, situationId, 'power_map', result.output as Record<string, unknown>).catch(
        (err) => console.error('[power-map] persist failed:', err),
      );
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'power-map');
  }
});
