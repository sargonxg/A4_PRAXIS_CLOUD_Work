import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { handleRouteError } from '@/lib/api/standard-error';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import type { Situation } from '@/types/situation';

export const maxDuration = 120;

const ActorProfileSchema = z.object({
  id: z.string().describe('Short unique identifier (slug)'),
  name: z.string().describe('Full actor name'),
  type: z.enum(['state', 'armed_group', 'international_org', 'ngo', 'individual', 'private_sector', 'civil_society', 'media']),
  affiliation: z.string().describe('Organizational affiliation or allegiance'),
  caseId: z.string().describe('Situation ID this actor belongs to'),
  photo: z.null(),
  classification: z.string().describe('Intelligence classification level'),
  bio: z.string().describe('Background summary of the actor'),
  mandate: z.string().describe('Stated mandate or mission'),
  leadership: z.array(z.string()).describe('Key leadership figures'),
  interests: z.array(z.object({
    description: z.string(),
    type: z.string(),
    priority: z.enum(['critical', 'high', 'medium', 'low']),
    isExplicit: z.boolean().describe('Whether the interest is publicly stated or latent'),
  })).describe('Key interests driving this actor'),
  leverageHeld: z.array(z.object({
    target: z.string(),
    type: z.string(),
    description: z.string(),
    effectiveness: z.string(),
  })).describe('Leverage this actor holds over others'),
  leverageFacing: z.array(z.object({
    holder: z.string(),
    type: z.string(),
    description: z.string(),
    effectiveness: z.string(),
  })).describe('Leverage others hold over this actor'),
  commitments: z.array(z.object({
    description: z.string(),
    date: z.string(),
    status: z.enum(['active', 'suspended', 'violated', 'fulfilled']),
    complianceScore: z.number().min(0).max(100),
  })).describe('Known commitments and compliance status'),
  riskAssessment: z.object({
    spoilerPotential: z.enum(['high', 'medium', 'low']),
    willingnessToNegotiate: z.enum(['high', 'medium', 'low']),
    summary: z.string(),
  }),
  threatLevel: z.enum(['critical', 'high', 'medium', 'low']),
  leverageScore: z.number().min(0).max(100),
  lastActivity: z.string().describe('Date of most recent known activity'),
  spoilerClassification: z.enum(['total', 'limited', 'greedy', 'non-spoiler']).optional(),
  spoilerEvidence: z.string().optional(),
  statedPositions: z.array(z.string()).optional(),
  underlyingInterests: z.array(z.string()).optional(),
  mawScores: z.object({
    power: z.number().min(1).max(10),
    legitimacy: z.number().min(1).max(10),
    urgency: z.number().min(1).max(10),
    stakeholderType: z.enum(['dormant', 'discretionary', 'demanding', 'dominant', 'dangerous', 'dependent', 'definitive']),
  }).optional(),
});

const ActorProfilesSchema = z.object({
  actors: z.array(ActorProfileSchema).min(2).max(10).describe('Full intelligence profiles for key actors'),
  relationshipMatrix: z.array(z.object({
    actorA: z.string(),
    actorB: z.string(),
    relationship: z.enum(['ally', 'adversary', 'neutral', 'competitor', 'patron-client']),
    strength: z.number().min(1).max(5),
    basis: z.string(),
  })).optional(),
});

export const POST = withCalibration('actor_profiles', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string; actors?: string[] } | undefined;
    const actors = Array.isArray(s?.actors) ? s.actors.slice(0, 5).join(', ') : '';
    return [s?.name, s?.region, actors].filter(Boolean).join(' — ') || undefined;
  },
})(async (request: Request, user) => {
  try {
    if (isServerDemoMode()) {
      return NextResponse.json({ actors: [] });
    }

    // Credits + profile gate already handled by withCalibration above.

    const body = await request.json();
    const { situation } = body as { situation?: Situation };
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'actor_profiles').catch(() => '')
      : '';

    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as Situation).name, region: (situation as Situation).region, actors: (situation as Situation).actors },
          'actor-profiles',
          user.uid
        )
      : '';

    // Calibrated analyst-profile + situation-frame + output-constraints
    const { systemPromptBlock, outputConstraints, provenance } = user.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    const result = await callProModel({
      output: Output.object({ schema: ActorProfilesSchema }),
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${webCtx}${webCtx ? '\n\n' : ''}${sitContext ? `${sitContext}\n\n` : ''}Generate comprehensive intelligence profiles for the key actors in this conflict situation.

For EACH actor listed in the situation (and any critical actors you identify as missing), produce a full intelligence profile covering:

1. **Classification and Bio**: Background, organizational structure, capabilities
2. **Mandate**: What they claim as their purpose/mission
3. **Leadership**: Key decision-makers by name where known (use real names for real-world actors)
4. **Interests Analysis** (Fisher/Ury framework):
   - Distinguish between stated positions (statedPositions) and underlying interests (underlyingInterests)
   - Prioritize: critical (existential), high (strategic), medium (operational), low (tactical)
5. **Leverage Mapping**:
   - What leverage does this actor hold over others? (military, economic, diplomatic, informational)
   - What leverage do others hold over this actor?
   - Assess effectiveness of each leverage point
6. **Commitments**: Known agreements, promises, commitments with compliance scores
7. **Risk Assessment**:
   - Spoiler potential (ability and motivation to derail peace/resolution)
   - Willingness to negotiate
   - Overall threat level to the process
8. **Stedman Spoiler Classification**: Classify each actor as total/limited/greedy/non-spoiler with evidence
9. **Mitchell-Agle-Wood Scores**: Rate power (1-10), legitimacy (1-10), urgency (1-10) and determine stakeholder type
10. **Relationship Matrix**: Map bilateral relationships between all actors (ally/adversary/neutral/competitor/patron-client)

Use real-world knowledge where available. Reference actual organizations, real leadership names, documented events. For each actor, the profile should be grounded in verifiable information — not invented scenarios.

Generate profiles for 3-8 actors depending on the complexity of the situation.`,
      system: `You are a senior intelligence analyst producing classified actor profiles for diplomatic staff. Use real-world knowledge to create precise, evidence-based profiles. Reference actual events, real leadership names, and documented positions. For each actor, classify using Stedman's Spoiler Theory (total/limited/greedy/non-spoiler), map Fisher-Ury positions vs. interests, and score Mitchell-Agle-Wood power/legitimacy/urgency (1-10 each). Profiles must be actionable for mediators and political affairs officers.

${systemPromptBlock}

Calibrate framing (terminology, tone, level of detail) to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
    });

    if (situationId && user.uid) {
      await writeToolDataServer(user.uid, situationId, 'actor_profiles', result.output as Record<string, unknown>).catch(
        (err) => console.error('[actor-profiles] persist failed:', err),
      );
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'actor_profiles',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[actor-profiles] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'actor-profiles');
  }
});
