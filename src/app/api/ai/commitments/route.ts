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

const CommitmentsSchema = z.object({
  commitments: z.array(
    z.object({
      title: z.string().describe('Full title of the commitment or agreement'),
      type: z.enum(['ceasefire', 'peace-agreement', 'MOU', 'verbal', 'written', 'conditional', 'confidence-building']).describe('Type of commitment'),
      parties: z.array(z.string()).describe('Parties bound by this commitment'),
      signedDate: z.string().optional().describe('Date commitment was signed or announced (e.g., "12 September 2025")'),
      status: z.enum(['active', 'violated', 'suspended', 'expired', 'negotiating']).describe('Current implementation status'),
      complianceScore: z.number().min(0).max(10).describe('Compliance score 0–10 (10 = full compliance)'),
      violations: z.array(
        z.object({
          date: z.string().describe('Date of the violation (e.g., "March 2026")'),
          actor: z.string().describe('Actor responsible for the violation'),
          description: z.string().describe('Description of the violation with available evidence'),
          severity: z.enum(['minor', 'major', 'critical']).describe('Severity classification'),
        })
      ).describe('Documented violations with attribution and severity'),
      verificationMechanism: z.string().describe('Body or mechanism responsible for verifying compliance'),
      expiryDate: z.string().optional().describe('Expiry date if the commitment has a defined term'),
      renewalProspect: z.enum(['likely', 'uncertain', 'unlikely']).describe('Likelihood of renewal or extension if expiring'),
      keyProvisions: z.array(z.string()).describe('Key operational provisions of the commitment'),
    })
  ).describe('Ceasefires, agreements, MOUs, and other commitments applicable to this conflict'),
  overallTrustLevel: z.number().min(0).max(10).describe('Overall inter-party trust level derived from commitment compliance patterns, 0–10'),
  nextMilestones: z.array(z.string()).describe('Upcoming deadlines, review dates, or milestones requiring monitoring'),
});

const DEMO_RESPONSE = {
  commitments: [
    {
      title: 'Nordalia Comprehensive Ceasefire Agreement',
      type: 'ceasefire' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement'],
      signedDate: '12 September 2025',
      status: 'violated' as const,
      complianceScore: 4,
      violations: [
        {
          date: 'January 2026',
          actor: 'Government of Nordalia (AFN)',
          description: 'AFN artillery fire into buffer zone on 14 separate occasions confirmed by UNMN monitors. Targeting of DRM positions near Kessara Ridge interpreted by DRM as preparation for offensive operations.',
          severity: 'major' as const,
        },
        {
          date: 'February 2026',
          actor: 'Democratic Reform Movement',
          description: 'DRM militia repositioning of heavy weapons within the 5km buffer zone, documented by UNMN aerial surveillance. DRM denies the repositioning constitutes a ceasefire violation.',
          severity: 'major' as const,
        },
        {
          date: 'March 2026',
          actor: 'Government of Nordalia (AFN)',
          description: 'Failure to establish Joint Ceasefire Monitoring Commission (JCMC) — overdue by 75 days. GoN cites procedural disagreements on DRM representation as justification.',
          severity: 'critical' as const,
        },
      ],
      verificationMechanism: 'UN Mission Nordalia (UNMN) — Ceasefire Monitoring Section, with aerial surveillance and 12 fixed monitoring posts along the Line of Contact',
      expiryDate: undefined,
      renewalProspect: 'uncertain' as const,
      keyProvisions: [
        'Comprehensive cessation of offensive military operations along all fronts',
        'Establishment of 5km demilitarized buffer zone along the Line of Contact',
        'UNMN freedom of movement within the buffer zone and monitoring points',
        'Joint Ceasefire Monitoring Commission (JCMC) to be established within 30 days',
        'Return of displaced persons to areas of origin facilitated by UNHCR',
      ],
    },
    {
      title: 'Humanitarian Access Protocol',
      type: 'MOU' as const,
      parties: ['Government of Nordalia', 'OCHA', 'UNMN'],
      signedDate: '3 October 2025',
      status: 'violated' as const,
      complianceScore: 2,
      violations: [
        {
          date: 'November 2025 – March 2026',
          actor: 'Government of Nordalia',
          description: 'GoN blocked or delayed 19 of 31 OCHA convoy movements (61% obstruction rate). Checkpoints at Marka and Solva impose processing delays of 6–10 hours, rendering daily convoy schedules unworkable. 2.3 million civilians in eastern provinces without sustained humanitarian access.',
          severity: 'critical' as const,
        },
        {
          date: 'December 2025',
          actor: 'Government of Nordalia',
          description: 'Three OCHA field staff detained at Marka checkpoint for 18 hours without charge. GoN subsequently issued a formal apology but no disciplinary action taken.',
          severity: 'major' as const,
        },
        {
          date: 'February 2026',
          actor: 'Democratic Reform Movement',
          description: 'DRM levied informal "transit fees" on aid convoys entering Sector 3 — estimated at $400–600 per convoy. DRM characterises these as "registration fees" not covered by the MOU.',
          severity: 'minor' as const,
        },
      ],
      verificationMechanism: 'OCHA Nordalia Access Monitoring Unit; weekly access reports submitted to UNMN and UNSC Humanitarian Affairs briefings',
      renewalProspect: 'uncertain' as const,
      keyProvisions: [
        'Unimpeded humanitarian access for all OCHA-registered humanitarian organizations',
        'Three humanitarian corridors operational 7 days per week',
        'Maximum 2-hour checkpoint processing for aid convoys',
        'No taxation or fees on humanitarian cargo',
        'Safety guarantees for humanitarian personnel',
      ],
    },
    {
      title: 'Belara Mining Revenue Escrow Arrangement',
      type: 'conditional' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement', 'World Bank Group'],
      signedDate: '20 November 2025',
      status: 'active' as const,
      complianceScore: 8,
      violations: [],
      verificationMechanism: 'World Bank Group — Fragility, Conflict & Violence Group; quarterly audit with public disclosure to both parties',
      expiryDate: '30 June 2026',
      renewalProspect: 'likely' as const,
      keyProvisions: [
        '30% of Belara Mining Complex revenues placed in World Bank-administered escrow',
        'Funds disbursed only upon agreed governance benchmarks',
        'Quarterly revenue audits with independent verification',
        'Escrow superseded by final revenue-sharing agreement if negotiated before expiry',
      ],
    },
    {
      title: 'Prisoner and Detainee Exchange Framework',
      type: 'written' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement'],
      signedDate: '1 November 2025',
      status: 'active' as const,
      complianceScore: 7,
      violations: [
        {
          date: 'January 2026',
          actor: 'Government of Nordalia',
          description: 'GoN excluded five detained NIMN journalists from exchange list, classifying them as "security detainees" not covered by the prisoner exchange framework. DRM disputes this classification.',
          severity: 'major' as const,
        },
      ],
      verificationMechanism: 'AU Panel of the Wise — facilitation and verification role; ICRC notification of exchange lists 72 hours in advance',
      renewalProspect: 'likely' as const,
      keyProvisions: [
        'Exchange of all military prisoners of war and detained combatants',
        'AU Panel of the Wise as neutral facilitator',
        'ICRC notification and monitoring of exchange process',
        'Exchanges conducted in phases with independent verification between phases',
      ],
    },
    {
      title: 'Media and Information Freedom Commitment',
      type: 'verbal' as const,
      parties: ['Government of Nordalia'],
      signedDate: '5 August 2025',
      status: 'violated' as const,
      complianceScore: 1,
      violations: [
        {
          date: 'August 2025 – March 2026',
          actor: 'Government of Nordalia',
          description: 'Four journalists arrested and detained since commitment date; Eastern Provinces declared a restricted area for international press with no access permits issued; broadcasting licence of Nordalia Free Press revoked in December 2025.',
          severity: 'critical' as const,
        },
      ],
      verificationMechanism: 'UN Human Rights Council (HRC) Universal Periodic Review; Reporters Without Borders monitoring',
      renewalProspect: 'unlikely' as const,
      keyProvisions: [
        'Independent media access to conflict zones without prior authorisation',
        'Release of all journalists detained for conflict coverage',
        'No revocation of media broadcasting licences for political reasons',
      ],
    },
  ],
  overallTrustLevel: 3,
  nextMilestones: [
    'Belara Revenue Escrow quarterly audit — due April 2026 (World Bank)',
    'Belara Revenue Escrow expiry and renewal decision — 30 June 2026',
    'UNMN ceasefire compliance report to UNSC — due April 2026 (monthly)',
    'Joint Ceasefire Monitoring Commission establishment — overdue since December 2025, requires immediate activation',
    'Third prisoner exchange — anticipated Q2 2026 pending journalist classification dispute resolution',
    'HRC Universal Periodic Review follow-up session on Nordalia media freedom — May 2026',
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
    const creditCheck = await checkAndDeductCredits('ai_commitment_scan', 'Commitments tracker');
    if (!creditCheck.allowed) return creditCheck.response;

    const graphCtx = situationId ? await buildGraphContext(user.uid, situationId, 'commitments') : '';
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'commitments', user.uid
        )
      : '';

    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: CommitmentsSchema }),
      system: 'You are a senior UN DPPA political affairs officer specializing in peace agreement monitoring, commitment compliance, and implementation oversight. You have deep expertise in ceasefire monitoring, IHL compliance, and UN-mediated peace processes. Apply OCHA humanitarian access monitoring protocols and UNSC reporting standards. Produce evidence-grounded, operationally actionable assessments for senior diplomatic and legal audiences.',
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
Conduct a comprehensive commitment and agreement compliance assessment for this conflict situation.

For each commitment or agreement, assess:
1. Current implementation status and compliance score (0–10)
2. Specific, documented violations with actor attribution, dates, and severity classification
3. Verification mechanism adequacy — can the monitoring body actually verify compliance?
4. Renewal prospects if the commitment has a defined term
5. Key provisions — the operational obligations each party has accepted

Then assess:
- Overall inter-party trust level (0–10) derived from the aggregate compliance pattern
- Upcoming milestones, review dates, and deadlines that require monitoring

Apply UN compliance monitoring methodology:
- Critical violations: immediate risk to civilian life, threats to collapse the peace process, grave IHL/IHRL violations, or matters under UNSC authority
- Severity classification: minor (technical/procedural), major (substantive non-compliance), critical (grave breach with strategic implications)

Cite web intelligence for current commitment status. Reference UN document numbers, OCHA access reports, and Panel of Experts findings where available.`,
    });

    if (situationId) await writeToolDataServer(user.uid, situationId, 'commitments', result.output as Record<string, unknown>);
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'commitments');
  }
});
