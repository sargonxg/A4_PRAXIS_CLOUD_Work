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

const HumanRightsSchema = z.object({
  overallAssessment: z.string(),
  ihlApplicability: z.string(),
  violations: z.array(z.object({
    type: z.enum(['extrajudicial-killing', 'torture', 'arbitrary-detention', 'forced-displacement', 'sgbv', 'destruction-of-property', 'siege-starvation', 'attacks-on-civilians']),
    perpetrator: z.string(),
    evidenceLevel: z.enum(['conclusive', 'established', 'reasonable-grounds', 'alleged']),
    legalFrameworkViolated: z.string(),
    source: z.string(),
    description: z.string(),
  })),
  accountabilityMechanisms: z.array(z.object({
    mechanism: z.enum(['icc', 'icj', 'national-courts', 'truth-commission', 'sanctions', 'un-inquiry']),
    status: z.string(),
    prospects: z.string(),
  })),
  accessAssessment: z.object({
    ohchrAccess: z.enum(['full', 'partial', 'denied', 'unknown']),
    ingoAccess: z.enum(['full', 'partial', 'denied', 'unknown']),
    constraints: z.array(z.string()),
  }),
  protectionPriorities: z.array(z.string()),
  recommendations: z.array(z.string()),
  intelligenceGaps: z.array(z.string()),
});

const DEMO_RESPONSE = {
  overallAssessment: 'Serious IHL violations documented by both parties in the Nordalia conflict. Civilian infrastructure targeted, arbitrary detentions reported, and access severely constrained.',
  ihlApplicability: 'Common Article 3 of the Geneva Conventions applies as a non-international armed conflict. Additional Protocol II likely applicable given level of organization of DRM forces.',
  violations: [
    {
      type: 'attacks-on-civilians' as const,
      perpetrator: 'AFN',
      evidenceLevel: 'established' as const,
      legalFrameworkViolated: 'Geneva Convention IV, Art. 51',
      source: 'OHCHR monitoring',
      description: 'Artillery strikes on Kessara market district, 23 civilian fatalities documented',
    },
  ],
  accountabilityMechanisms: [
    {
      mechanism: 'un-inquiry' as const,
      status: 'Requested by UNHRC, pending Security Council authorization',
      prospects: 'Unlikely given Karovian veto threat',
    },
  ],
  accessAssessment: {
    ohchrAccess: 'partial' as const,
    ingoAccess: 'partial' as const,
    constraints: ['Military operations in eastern provinces', 'GoN permit requirements for INGO access'],
  },
  protectionPriorities: [
    'Civilian evacuation corridors from Kessara',
    'ICRC prison access for detainees',
    'Accountability for market strike',
  ],
  recommendations: [
    'Establish UN monitoring mission with IHL mandate',
    'Engage ICC OTP on preliminary examination',
    'Press for ICRC access agreements',
  ],
  intelligenceGaps: [
    'Exact detention facility locations',
    'Casualty figures in DRM-held areas',
  ],
};

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const requestSchema = z.object({ situation: situationContextSchema.optional() });
    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation } = validation.data;
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    if (isServerDemoMode()) return NextResponse.json(DEMO_RESPONSE);
    const creditCheck = await checkAndDeductCredits('ai_human_rights', 'Human rights monitor');
    if (!creditCheck.allowed) return creditCheck.response;

    const graphCtx = situationId ? await buildGraphContext(user.uid, situationId, 'human_rights') : '';
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'human-rights', user.uid
        )
      : '';

    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: HumanRightsSchema }),
      system: 'You are a senior human rights analyst specializing in IHL and IHRL. Apply Geneva Conventions, Rome Statute, and OHCHR methodology. Evidence levels follow OHCHR standards: conclusive (beyond reasonable doubt), established (clear and convincing), reasonable grounds (credible information), alleged (unverified reports).',
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
Conduct a comprehensive human rights and IHL assessment.

Assess: (1) IHL applicability (Common Art 3, AP II, full Geneva Conventions), (2) documented violations by type and perpetrator with evidence level, (3) accountability prospects across ICC/ICJ/national/transitional justice tracks, (4) humanitarian access for OHCHR and INGOs, (5) protection priorities, (6) actionable recommendations.

Every violation claim must cite a source from the web intelligence. Flag intelligence gaps explicitly.`,
    });

    if (situationId) await writeToolDataServer(user.uid, situationId, 'human-rights', result.output as Record<string, unknown>);
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'human-rights');
  }
});
