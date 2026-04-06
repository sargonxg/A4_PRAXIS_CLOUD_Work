import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import { withAuth } from '@/lib/api/with-auth';
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
});

const ActorProfilesSchema = z.object({
  actors: z.array(ActorProfileSchema).min(2).max(10).describe('Full intelligence profiles for key actors'),
});

export const POST = withAuth(async (request: Request) => {
  try {
    if (isServerDemoMode()) {
      return NextResponse.json({ actors: [] });
    }

    const creditCheck = await checkAndDeductCredits('ai_actor_profiles', 'Actor profile generation');
    if (!creditCheck.allowed) return creditCheck.response!;

    const body = await request.json();
    const { situation } = body as { situation?: Situation };
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';

    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: ActorProfilesSchema }),
      prompt: `${sitContext ? `${sitContext}\n\n` : ''}Generate comprehensive intelligence profiles for the key actors in this conflict situation.

For EACH actor listed in the situation (and any critical actors you identify as missing), produce a full intelligence profile covering:

1. **Classification and Bio**: Background, organizational structure, capabilities
2. **Mandate**: What they claim as their purpose/mission
3. **Leadership**: Key decision-makers by name where known (use real names for real-world actors)
4. **Interests Analysis** (Fisher/Ury framework):
   - Distinguish between stated positions (explicit) and underlying interests (latent)
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

Use real-world knowledge where available. Reference actual organizations, real leadership names, documented events. For each actor, the profile should be grounded in verifiable information — not invented scenarios.

Generate profiles for 3-8 actors depending on the complexity of the situation.`,
      system: 'You are a senior intelligence analyst producing classified actor profiles for diplomatic staff. Use real-world knowledge to create precise, evidence-based profiles. Reference actual events, real leadership names, and documented positions. Apply the Fisher/Ury interests framework and Mitchell/Agle/Wood stakeholder analysis. Profiles must be actionable for mediators and political affairs officers.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'actor-profiles');
  }
});
