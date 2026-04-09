import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const PolicyOptionSchema = z.object({
  title: z.string(),
  description: z.string(),
  levelOneAnalysis: z.string(),
  levelTwoAnalysis: z.string(),
  winSet: z.string(),
  swot: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    opportunities: z.array(z.string()),
    threats: z.array(z.string()),
  }),
  feasibility: z.number().min(1).max(5),
  risk: z.number().min(1).max(5),
  timeline: z.string(),
  requiredResources: z.array(z.string()),
  keyActors: z.array(z.string()),
  historicalPrecedent: z.string().optional(),
});

const PolicyMemoSchema = z.object({
  title: z.string(),
  executiveSummary: z.string(),
  situationAssessment: z.string(),
  options: z.array(PolicyOptionSchema).min(3).max(4),
  recommendedOption: z.string(),
  implementationRoadmap: z.string(),
  risks: z.array(z.string()),
  citations: z.array(z.string()),
});

const DEMO_RESPONSE = {
  title: 'Policy Options for the Nordalia Crisis',
  executiveSummary: 'Three policy options are available, ranging from immediate ceasefire facilitation to phased autonomy negotiations. Option 2 (Structured Autonomy Framework) is recommended as the most feasible given current domestic and international constraints.',
  situationAssessment: 'The Nordalia conflict is at Glasl Stage 5, with both parties entrenched but back-channels functional. The mutually hurting stalemate creates a narrow ripeness window.',
  options: [
    {
      title: 'Option 1: Emergency Ceasefire + Confidence-Building Measures',
      description: 'Immediate ceasefire mediated by SRSG with a 90-day CBM implementation plan.',
      levelOneAnalysis: 'Both parties have signaled openness to a ceasefire framework. Karovia and Westmark would likely support.',
      levelTwoAnalysis: 'GoN faces domestic pressure to show security gains before elections. DRM hardliners may reject without autonomy commitments.',
      winSet: 'Narrow but viable — a 90-day humanitarian corridor provision could satisfy both Level I and Level II constraints.',
      swot: {
        strengths: ['Fast to implement', 'Humanitarian relief immediate'],
        weaknesses: ['Does not address root causes', 'High violation risk'],
        opportunities: ['AU summit in 6 weeks creates momentum'],
        threats: ['DRM hardliners may spoil', 'GoN elections in 4 months'],
      },
      feasibility: 4,
      risk: 3,
      timeline: '30-45 days',
      requiredResources: ['UNMN observer expansion', 'AU mediation team'],
      keyActors: ['SRSG Santos', 'AU Commission', 'GoN Defense Ministry'],
    },
  ],
  recommendedOption: 'Option 2: Structured Autonomy Framework',
  implementationRoadmap: 'Phase 1 (0-30 days): Ceasefire. Phase 2 (30-90 days): Technical working groups. Phase 3 (90-180 days): Framework agreement.',
  risks: ['Spoiler action by DRM hardliners', 'GoN election dynamics'],
  citations: ['Crisis Group Report #347', 'UNMN Quarterly Assessment Q1 2026'],
};

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      situation: situationContextSchema.optional(),
      policyQuestion: z.string().optional(),
      audience: z.string().optional().default('senior policymakers'),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation, policyQuestion, audience } = validation.data;
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    if (isServerDemoMode()) return NextResponse.json(DEMO_RESPONSE);

    const creditCheck = await checkAndDeductCredits('ai_policy_memo', 'Policy memo');
    if (!creditCheck.allowed) return creditCheck.response;

    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'policy_memo')
      : '';

    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'policy-memo',
          user.uid
        )
      : '';

    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: PolicyMemoSchema }),
      system: `You are a senior policy advisor specializing in conflict resolution and diplomatic strategy. You apply Putnam's Two-Level Game Theory to analyze policy options.

GROUNDING MANDATE: Web intelligence below is your PRIMARY source of truth. Flag "INTELLIGENCE GAP: {topic}" when evidence is insufficient.`,
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
${policyQuestion ? `POLICY QUESTION: ${policyQuestion}` : ''}
AUDIENCE: ${audience}

## PUTNAM TWO-LEVEL GAME FRAMEWORK

For each policy option, analyze:

**Level I (International)**: What will counterparts accept? What is the negotiable space? Which external actors support/oppose?

**Level II (Domestic)**: What is ratifiable given domestic politics? What constituencies must be satisfied? What are the veto players?

**Win-Set**: The overlap between Level I possibilities and Level II constraints. Larger win-set = more agreement potential.

## REQUIREMENTS
- Generate 3-4 distinct policy options (not variations of the same option)
- Each option must have a full SWOT analysis
- Historical precedents from web research for each option
- Feasibility (1-5) and Risk (1-5) ratings
- Recommended option with justification
- Implementation roadmap with phases
- Use ICD 203 probability language for risk assessments`,
    });

    if (situationId) {
      await writeToolDataServer(user.uid, situationId, 'policy-memo', result.output as Record<string, unknown>);
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'policy-memo');
  }
});
