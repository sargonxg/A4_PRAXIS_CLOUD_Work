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

export const maxDuration = 45;

const CommitmentSchema = z.object({
  id: z.string().describe('Short unique identifier (e.g. "c1", "c2")'),
  title: z.string().describe('Name of the agreement or commitment'),
  type: z.enum(['ceasefire', 'political', 'humanitarian', 'security', 'economic', 'legal']).describe('Commitment category'),
  parties: z.array(z.string()).describe('Parties bound by this commitment'),
  date: z.string().describe('Date commitment was made (YYYY-MM-DD)'),
  deadline: z.string().optional().describe('Compliance deadline if applicable (YYYY-MM-DD)'),
  status: z.enum(['compliant', 'partial', 'non-compliant', 'unknown', 'expired']).describe('Current compliance status'),
  complianceScore: z.number().min(0).max(100).describe('Estimated compliance percentage'),
  description: z.string().describe('What the commitment entails and its significance'),
  violations: z.array(z.string()).describe('Specific reported violations with evidence'),
  monitoringBody: z.string().optional().describe('Entity responsible for monitoring compliance'),
  referenceDoc: z.string().optional().describe('UN document reference or official instrument'),
});

const CommitmentScanSchema = z.object({
  commitments: z.array(CommitmentSchema).min(2).max(8).describe('Commitments and agreements relevant to the situation'),
  overallComplianceRate: z.number().min(0).max(100).describe('Weighted overall compliance rate across all commitments'),
  criticalViolations: z.array(z.string()).describe('Violations requiring immediate escalation or response'),
  upcomingDeadlines: z.array(
    z.object({
      title: z.string(),
      date: z.string().describe('YYYY-MM-DD'),
      party: z.string(),
    })
  ).describe('Imminent deadlines requiring monitoring'),
  analysis: z.string().describe('Cross-cutting analysis of compliance patterns, implementation gaps, and strategic implications'),
});

const DEMO_RESPONSE = {
  commitments: [
    {
      id: 'c1',
      title: 'Nordalia Ceasefire Agreement',
      type: 'ceasefire' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement'],
      date: '2025-09-12',
      status: 'partial' as const,
      complianceScore: 61,
      description: 'Comprehensive ceasefire agreement brokered under UNMN auspices. Prohibits offensive military operations, establishes 5km buffer zone, and mandates return of displaced persons.',
      violations: [
        'GoN AFN artillery fire into buffer zone (14 incidents in past 30 days)',
        'DRM militia repositioning near Kessara corridor (reported by UNMN monitors)',
        'Failure to establish Joint Ceasefire Monitoring Commission (overdue 45 days)',
      ],
      monitoringBody: 'UN Mission Nordalia (UNMN)',
      referenceDoc: 'S/2025/891',
    },
    {
      id: 'c2',
      title: 'Humanitarian Access Protocol',
      type: 'humanitarian' as const,
      parties: ['Government of Nordalia', 'OCHA', 'UNMN'],
      date: '2025-10-03',
      status: 'non-compliant' as const,
      complianceScore: 28,
      description: 'Agreement guaranteeing unimpeded humanitarian access to all affected populations, including eastern provinces under DRM control. Establishes weekly convoy schedule.',
      violations: [
        'GoN blocked 7 of 12 OCHA convoys in past month (58% blockage rate)',
        'Aid workers detained at Marka checkpoint (3 incidents)',
        '2.3M people in DRM-controlled territory without sustained access',
      ],
      monitoringBody: 'OCHA',
    },
    {
      id: 'c3',
      title: 'Belara Mining Revenue Escrow Arrangement',
      type: 'economic' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement', 'World Bank'],
      date: '2025-11-20',
      deadline: '2026-06-30',
      status: 'compliant' as const,
      complianceScore: 87,
      description: 'Interim arrangement placing 30% of Belara Mining Complex revenues in World Bank-administered escrow pending final revenue-sharing agreement.',
      violations: [],
      monitoringBody: 'World Bank Group',
    },
    {
      id: 'c4',
      title: 'Media and Information Freedom Commitment',
      type: 'political' as const,
      parties: ['Government of Nordalia'],
      date: '2025-08-05',
      status: 'non-compliant' as const,
      complianceScore: 15,
      description: 'GoN commitment to allow independent media access to conflict zones and release detained journalists. Made before Human Rights Council.',
      violations: [
        '4 journalists arrested since commitment date',
        'Eastern Provinces declared restricted area for international press',
        'Broadcasting license of Nordalia Free Press revoked',
      ],
      monitoringBody: 'Human Rights Council',
    },
  ],
  overallComplianceRate: 48,
  criticalViolations: [
    'Humanitarian access blocked — 2.3M civilians without assistance',
    'Ceasefire buffer zone violations — risk of renewed armed hostilities',
    'Journalist detentions — direct violation of HRC commitment',
  ],
  upcomingDeadlines: [
    { title: 'Belara Revenue Escrow review', date: '2026-06-30', party: 'Government of Nordalia' },
    { title: 'Joint Ceasefire Commission establishment (overdue)', date: '2026-01-15', party: 'Both parties' },
  ],
  analysis: 'The compliance landscape reflects a pattern of selective implementation: economic commitments with third-party oversight show high compliance, while commitments requiring unilateral political restraint are systematically violated. Priority: invoke UNMN monitoring mandate for ceasefire violations; activate OCHA escalation mechanism for access blockages; refer journalist detentions to HRC.',
};

export const POST = withAuth(async (request, _user) => {
  try {
    const creditCheck = await checkAndDeductCredits('ai_commitment_scan', 'Commitment compliance scan');
    if (!creditCheck.allowed) return creditCheck.response!;

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    const body = await request.json();
    const { situation } = body as { situation?: Situation };
    const sitContext = situation ? buildToolContext(situation as Situation) : '';

    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: CommitmentScanSchema }),
      prompt: `${sitContext ? `${sitContext}\n\n` : ''}Analyze the commitment compliance landscape for this conflict situation.

## ANALYTICAL FRAMEWORK

Apply the following UN compliance monitoring methodology:

**Commitment Classification**
- Ceasefire: Military/hostilities restraint agreements
- Humanitarian: Access, protection, and IHL compliance commitments
- Political: Governance, elections, transitional justice commitments
- Security: DDR, security sector reform, POW/detainee commitments
- Economic: Revenue sharing, sanctions, trade commitments
- Legal: Human rights commitments, accountability obligations

**Compliance Scoring Methodology**
- 85-100: Full compliance — all provisions implemented on schedule
- 65-84: Substantial compliance — core provisions met, minor gaps
- 45-64: Partial compliance — some provisions met, significant gaps
- 25-44: Limited compliance — minimal implementation, pattern of violation
- 0-24: Non-compliant — systematic violation or outright refusal

**For each commitment, assess:**
1. Specific, documented violations with source attribution (UN reports, OCHA, ICRC, Panel of Experts)
2. Compliance trends: is implementation improving, stable, or deteriorating?
3. Monitoring body capacity: can the monitoring mechanism actually verify compliance?
4. Leverage points: what incentives or sanctions can shift compliance behavior?

**Critical Violations**
Flag as critical violations if they:
- Create immediate risk to civilian life or safety
- Threaten to collapse a peace process
- Constitute grave violations of IHL or IHRL
- Are subject to UNSC Council authority or reporting obligations

Generate 3-6 commitments relevant to this specific situation. Be specific about monitoring bodies, violation evidence, and compliance scores. Do not generate generic or placeholder commitments.`,
      system: 'You are a senior UN DPPA compliance officer and political affairs analyst specializing in agreement monitoring and implementation oversight. You have extensive experience tracking commitment compliance in UN-mediated peace processes, applying OCHA humanitarian access monitoring protocols, and drafting reports for the Security Council. Produce precise, evidence-grounded assessments.',
    });

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'commitment-scan');
  }
});
