import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { DIPLOMATIC_SYSTEM_PROMPT } from '@/lib/ai/prompts/system';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import { validateAiRequest } from '@/lib/api/validate-request';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const TalkingPointsSchema = z.object({
  audience: z.string(),
  keyMessages: z.array(z.object({
    headline: z.string(),
    sharedInterest: z.string().describe('The shared interest this message appeals to (Fisher-Ury interest-based framing)'),
    concession: z.string().describe('What concession or acknowledgment this message makes'),
    bridgeToCommonGround: z.string().describe('How this message bridges to common ground'),
    supportingArguments: z.array(z.string()),
  })),
  anticipatedQuestions: z.array(z.object({
    question: z.string(),
    stakeholder: z.string(),
    recommendedResponse: z.string(),
  })).optional(),
  pointsToAvoid: z.array(z.string()),
  toneGuidance: z.string().optional(),
  closingGuidance: z.string().optional(),
});

const DEMO_RESPONSE = {
  audience: 'AU Peace and Security Council',
  keyMessages: [
    {
      headline: 'Both parties have demonstrated willingness to sustain the ceasefire framework',
      sharedInterest: 'Shared interest in avoiding economic costs of renewed hostilities',
      concession: 'Acknowledges that both parties have faced provocations and exercised restraint',
      bridgeToCommonGround: 'The ceasefire, however fragile, represents a shared achievement that both parties have an interest in protecting',
      supportingArguments: ['47 violations documented but ceasefire framework held since September 2025', 'Both parties participated in Joint Implementation Committee sessions'],
    },
    {
      headline: 'Economic recovery and rare earth revenue-sharing offer a concrete entry point for confidence-building',
      sharedInterest: 'Both parties and regional neighbours share an interest in Nordalia\'s economic stabilisation',
      concession: 'Acknowledges that equitable resource revenue distribution has been a legitimate grievance',
      bridgeToCommonGround: 'A joint economic working group on rare earth revenues is achievable without requiring political agreement on contested sovereignty questions',
      supportingArguments: ['Nordalian krone depreciation 36.4% — economic pain is shared', 'Rare earth deposits in contested eastern provinces create both conflict incentive and cooperation opportunity'],
    },
  ],
  anticipatedQuestions: [
    {
      question: 'Why should the AU continue to invest in a mediation process the GoN is not engaging in good faith?',
      stakeholder: 'Sceptical PSC member',
      recommendedResponse: 'The appointment of General Mensah signals hardline ascendance within the GoN, but it does not represent a formal withdrawal from the AU Roadmap. The June mediation round remains on the calendar. The question is whether the AU uses the intervening period to create incentives for GoN engagement, or cedes that space to Karovian influence.',
    },
  ],
  pointsToAvoid: [
    'Characterising either party as solely responsible for ceasefire violations — both parties have documented violations',
    'Setting public timelines for the transitional election process given the AU Roadmap Q2 2027 target is already under pressure',
    'Engaging publicly on the Karovian arms embargo violations — leave that to the Panel of Experts process',
  ],
  toneGuidance: 'Measured optimism grounded in concrete progress. Avoid triumphalism. Acknowledge the fragility of the situation while emphasising the cost of failure to both parties.',
  closingGuidance: 'Close by reaffirming AU commitment to the June mediation round and requesting PSC political support for SRSG access to both capitals.',
};

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const requestSchema = z.object({
      situation: situationContextSchema.optional(),
      audience: z.string().optional(),
      tone: z.string().optional(),
      context: z.string().optional(),
      // Legacy field support
      situationData: situationContextSchema.optional(),
    });
    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;

    const { situation, audience, tone, context, situationData } = validation.data;
    const sitObj = (situation ?? situationData) as Situation | undefined;
    const sitContext = sitObj ? buildToolContext(sitObj) : '';
    const situationId = sitObj?.id ?? '';

    if (isServerDemoMode()) return NextResponse.json(DEMO_RESPONSE);

    const creditCheck = await checkAndDeductCredits('ai_talking_points', 'Talking points');
    if (!creditCheck.allowed) return creditCheck.response;

    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'talking_points')
      : '';

    const webCtx = sitObj
      ? await buildWebGroundedContext(
          { name: sitObj.name, region: sitObj.region, actors: sitObj.actors },
          'talking-points',
          user.uid
        )
      : '';

    const systemPrompt = [graphCtx, sitContext, DIPLOMATIC_SYSTEM_PROMPT].filter(Boolean).join('\n\n');

    const result = await callProModel({
      output: Output.object({ schema: TalkingPointsSchema }),
      system: systemPrompt,
      prompt: `Generate structured diplomatic talking points using Fisher-Ury interest-based framing.

${webCtx ? `WEB INTELLIGENCE:\n${webCtx}\n\n` : ''}Situation: ${sitObj?.name ?? 'Unknown'}
Audience: ${audience ?? 'Senior diplomatic audience'}
Tone: ${tone ?? 'formal and balanced'}
${context ? `Additional context: ${context}` : ''}

FRAMING REQUIREMENT: Apply Fisher-Ury interest-based negotiation framing throughout. For each key message:
- Identify the shared INTEREST (not position) the message appeals to
- Acknowledge a legitimate concession or recognition the other side deserves
- Build a bridge to common ground without conceding contested positions

ANTICIPATE: For each likely stakeholder question, provide a recommended response that stays on message while acknowledging legitimate concerns.

TONE GUIDANCE: Provide explicit guidance on register, emphasis, and what to avoid, calibrated to the stated audience.`,
    });

    if (situationId) await writeToolDataServer(user.uid, situationId, 'talking-points', result.output as Record<string, unknown>);
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'talking-points');
  }
});
