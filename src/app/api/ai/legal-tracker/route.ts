import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
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

const LegalTrackerSchema = z.object({
  summary: z.string(),
  unscResolutions: z.array(z.object({
    number: z.string(),
    date: z.string().optional(),
    chapter: z.enum(['VI', 'VII', 'mixed']),
    keyProvisions: z.array(z.string()),
    complianceStatus: z.enum(['full', 'partial', 'non-compliant', 'unknown']),
    nonCompliantParties: z.array(z.string()).optional(),
  })),
  iccProceedings: z.array(z.object({
    situation: z.string(),
    stage: z.enum(['preliminary-examination', 'investigation', 'pre-trial', 'trial', 'appeals', 'closed']),
    charges: z.array(z.string()),
    suspects: z.array(z.string()),
    arrestWarrantStatus: z.string(),
  })).optional(),
  icjCases: z.array(z.object({
    parties: z.string(),
    issue: z.string(),
    currentPhase: z.string(),
    provisionalMeasures: z.string().optional(),
    compliance: z.string(),
  })).optional(),
  legalObligations: z.array(z.object({
    source: z.string(),
    obligation: z.string(),
    compliance: z.enum(['compliant', 'partial', 'non-compliant', 'unknown']),
    notes: z.string().optional(),
  })),
  upcomingLegalEvents: z.array(z.object({
    event: z.string(),
    date: z.string().optional(),
    significance: z.string(),
  })).optional(),
  intelligenceGaps: z.array(z.string()),
});

const DEMO_RESPONSE = {
  summary: 'Nordalia is subject to two active UNSC resolutions including a Chapter VII arms embargo with documented violations. No ICC proceedings have been opened, though a preliminary examination request is under consideration. Key compliance failures: Karovian arms transfers in violation of Resolution 2847 and GoN restrictions on OHCHR access.',
  unscResolutions: [
    {
      number: 'S/RES/2847 (2024)',
      date: '12 March 2024',
      chapter: 'VII' as const,
      keyProvisions: ['Arms embargo on all parties', 'Panel of Experts monitoring mechanism', 'Travel ban and asset freeze on designated individuals'],
      complianceStatus: 'non-compliant' as const,
      nonCompliantParties: ['Karovia (arms transfers documented by Panel of Experts Q3 2025)', 'DRM (procurement via Karovian intermediaries)'],
    },
    {
      number: 'S/RES/2791 (2023)',
      date: '6 September 2023',
      chapter: 'VI' as const,
      keyProvisions: ['Mandate for UNMN political mission', 'Calls for humanitarian access', 'Supports AU mediation process'],
      complianceStatus: 'partial' as const,
      nonCompliantParties: ['GoN (OHCHR access restrictions)', 'DRM (aid convoy taxation)'],
    },
  ],
  iccProceedings: [
    {
      situation: 'Nordalia — Preliminary Assessment',
      stage: 'preliminary-examination' as const,
      charges: ['Attacks on civilians (Art. 8)', 'Arbitrary detention (Art. 7)'],
      suspects: ['No warrants issued'],
      arrestWarrantStatus: 'No warrants issued. OTP preliminary assessment ongoing following UNHRC referral request.',
    },
  ],
  legalObligations: [
    {
      source: 'Geneva Conventions Common Article 3',
      obligation: 'Protect civilians and prisoners of war in non-international armed conflict',
      compliance: 'non-compliant' as const,
      notes: 'Both parties have documented violations — AFN artillery strikes on civilian areas, DRM arbitrary detentions',
    },
    {
      source: 'UN Arms Embargo (S/RES/2847)',
      obligation: 'Prohibit transfer of arms to all parties',
      compliance: 'non-compliant' as const,
      notes: 'Karovian transfers documented by Panel of Experts in interim report S/2025/892',
    },
  ],
  upcomingLegalEvents: [
    {
      event: 'Panel of Experts annual report to UNSC',
      date: 'June 2026',
      significance: 'Will determine whether UNSC extends or strengthens arms embargo; expected to document additional Karovian violations',
    },
    {
      event: 'UNMN mandate renewal',
      date: 'September 2026',
      significance: 'Requires UNSC consensus; Karovian veto threat may force mandate contraction',
    },
  ],
  intelligenceGaps: [
    'Whether ICC OTP has formally opened a preliminary examination or remains in analysis phase',
    'Specific individuals designated under S/RES/2847 asset freeze and current asset locations',
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
    const creditCheck = await checkAndDeductCredits('ai_legal_tracker', 'Legal tracker');
    if (!creditCheck.allowed) return creditCheck.response;

    const graphCtx = situationId ? await buildGraphContext(user.uid, situationId, 'legal_tracker') : '';
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'legal-tracker', user.uid
        )
      : '';

    const result = await callProModel({
      output: Output.object({ schema: LegalTrackerSchema }),
      system: 'You are a senior international lawyer specializing in UN law, ICC proceedings, and international humanitarian law. Track UNSC resolutions and their compliance status, ICC and ICJ proceedings, and all applicable legal obligations with precision.',
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
Conduct a comprehensive international legal tracker assessment.

Track: (1) all applicable UNSC resolutions with chapter designation, key provisions, and compliance status by party, (2) any ICC preliminary examinations, investigations, or proceedings with stage and warrant status, (3) any ICJ cases including provisional measures, (4) all applicable IHL and IHRL legal obligations and compliance assessment, (5) upcoming legal events (mandate renewals, report deadlines, hearing dates) with strategic significance.

Cite web intelligence sources for all compliance assessments. Flag intelligence gaps for legal proceedings where information is unavailable.`,
    });

    if (situationId) await writeToolDataServer(user.uid, situationId, 'legal-tracker', result.output as Record<string, unknown>);
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'legal-tracker');
  }
});
