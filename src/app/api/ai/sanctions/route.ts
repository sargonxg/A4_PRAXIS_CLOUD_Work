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

const SanctionsSchema = z.object({
  sanctions: z.array(
    z.object({
      regime: z.string().describe('Name of the sanctions regime (e.g., UNSC Resolution 2847, EU Regulation 2024/1938, OFAC Nordalia SDN List)'),
      imposingActors: z.array(z.string()).describe('States or international bodies imposing the sanctions'),
      targetedActors: z.array(z.string()).describe('Individuals, entities, or states targeted by the sanctions'),
      type: z.enum(['financial', 'travel-ban', 'arms-embargo', 'trade', 'sectoral', 'comprehensive']).describe('Primary sanctions type'),
      status: z.enum(['active', 'suspended', 'lifted', 'proposed']).describe('Current status of the sanctions regime'),
      imposedDate: z.string().optional().describe('Date sanctions were imposed (e.g., "October 2024")'),
      liftedDate: z.string().optional().describe('Date sanctions were lifted, if applicable'),
      legalBasis: z.string().describe('Legal instrument underpinning the sanctions (UN Charter Article, treaty, domestic statute)'),
      effectiveness: z.number().min(0).max(10).describe('Effectiveness score 0-10 based on target behaviour change and compliance'),
      complianceLevel: z.enum(['high', 'partial', 'low', 'unknown']).describe('Observed compliance level by sanctioned parties'),
      evasionPatterns: z.array(z.string()).describe('Documented or suspected sanctions evasion methods'),
      humanitarianImpact: z.string().describe('Assessment of humanitarian impact, including exemptions and civilian harm'),
      leveragePotential: z.string().describe('Potential of this sanctions regime as a diplomatic leverage instrument'),
    })
  ).describe('Sanctions regimes applicable to this conflict'),
  sanctionsDiplomacy: z.object({
    conditionsForLifting: z.array(z.string()).describe('Stated or implied conditions under which sanctions would be lifted or suspended'),
    negotiatingOpportunities: z.array(z.string()).describe('Diplomatic openings created by the sanctions architecture'),
  }).describe('Diplomatic dimension of the sanctions landscape'),
  overallSanctionsPressure: z.number().min(0).max(10).describe('Aggregate sanctions pressure score 0-10 accounting for coverage, enforcement, and evasion'),
});

const DEMO_RESPONSE = {
  sanctions: [
    {
      regime: 'UNSC Arms Embargo — Resolution 2847 (2024)',
      imposingActors: ['UN Security Council'],
      targetedActors: ['Government of Nordalia', 'Democratic Reform Movement', 'all non-state armed groups'],
      type: 'arms-embargo' as const,
      status: 'active' as const,
      imposedDate: 'August 2024',
      legalBasis: 'UN Charter Article 41; UNSC Resolution 2847 (2024)',
      effectiveness: 4,
      complianceLevel: 'low' as const,
      evasionPatterns: [
        'Karovian military transport flights routing through third-country stopovers to obscure origin',
        'End-user certificate falsification for dual-use components',
        'DRM procurement via Karovian state-adjacent commercial intermediaries',
        'Maritime shipments using flag-of-convenience vessels through non-monitored ports',
      ],
      humanitarianImpact: 'Arms embargo carries no direct humanitarian exemption gaps. Panel of Experts notes no evidence that the embargo has constrained medical or civilian supply chains. Evasion by state actors reduces practical impact on combatants while civilian populations bear conflict costs.',
      leveragePotential: 'Moderate. Effective enforcement — particularly targeting Karovian logistics — could significantly constrain AFN operational capacity within 60–90 days. The embargo is the primary multilateral leverage instrument and should anchor any coercive diplomacy strategy.',
    },
    {
      regime: 'Westmark Targeted Sanctions — Nordalia Accountability Measures Act 2024',
      imposingActors: ['Federal Republic of Westmark'],
      targetedActors: ['President Amara Osei', '22 senior GoN military and security officials', 'Karovia Defence Industries (KDI)'],
      type: 'travel-ban' as const,
      status: 'active' as const,
      imposedDate: 'October 2024',
      legalBasis: 'Westmark Nordalia Accountability Measures Act 2024 (domestic statute); FATF Recommendation 6',
      effectiveness: 6,
      complianceLevel: 'partial' as const,
      evasionPatterns: [
        'Use of non-Westmark financial institutions in Gulf states and East Asian jurisdictions',
        'Diaspora-linked informal value transfer (hawala-type) networks for sanctions evasion',
        'Asset pre-positioning to jurisdictions with no bilateral enforcement cooperation',
      ],
      humanitarianImpact: 'Westmark sanctions include a general humanitarian licence covering INGO operations, food, medicine, and essential civilian infrastructure. Limited civilian harm directly attributable to the sanctions regime. Some delays reported in INGO banking due to correspondent bank risk aversion.',
      leveragePotential: 'High. Westmark is the primary economic partner and Nordalian elite has significant financial exposure in Westmark jurisdiction. Targeted expansion to additional GoN officials — particularly in the finance and energy sectors — would sharply increase compliance pressure. Potential to offer phased lifting as incentive structure in negotiations.',
    },
    {
      regime: 'DRM Financial Network — FATF Grey Listing (Proposed)',
      imposingActors: ['Financial Action Task Force (FATF)'],
      targetedActors: ['Democratic Reform Movement financial networks', 'associated diaspora remittance channels'],
      type: 'financial' as const,
      status: 'proposed' as const,
      imposedDate: undefined,
      legalBasis: 'FATF Recommendation 6 (targeted financial sanctions); pending FATF Plenary decision',
      effectiveness: 2,
      complianceLevel: 'unknown' as const,
      evasionPatterns: [
        'Exploitation of jurisdictions with weak AML/CFT frameworks',
        'Structuring of diaspora remittances below reporting thresholds',
        'Use of cryptocurrency exchanges in unregulated jurisdictions',
      ],
      humanitarianImpact: 'Grey listing would constrain DRM access to formal banking but could drive further informalization of financial flows, increasing humanitarian delivery risk. FATF humanitarian exception provisions would need to be explicitly structured.',
      leveragePotential: 'Low to moderate at present. Proposed status limits practical leverage. If enacted, could create leverage over DRM in parallel to Westmark measures on GoN — creating balanced pressure architecture.',
    },
    {
      regime: 'AU Smart Sanctions — Proposed Targeted Measures',
      imposingActors: ['African Union Peace and Security Council'],
      targetedActors: ['Individuals obstructing UNMN ceasefire implementation'],
      type: 'travel-ban' as const,
      status: 'proposed' as const,
      legalBasis: 'AU Constitutive Act Article 4(h); AU PSC Protocol Article 7(1)(g)',
      effectiveness: 1,
      complianceLevel: 'unknown' as const,
      evasionPatterns: [],
      humanitarianImpact: 'No anticipated humanitarian impact given targeted and narrow scope of proposed individuals.',
      leveragePotential: 'Significant signalling value as African multilateral consensus, but AU has historically resisted sanctions on sitting heads of state. Political feasibility constrained by AU consensus requirement and Karovian bloc opposition within the AU.',
    },
  ],
  sanctionsDiplomacy: {
    conditionsForLifting: [
      'Verifiable and sustained ceasefire compliance (UNMN-certified) for minimum 90 days',
      'Restoration of full humanitarian access to eastern provinces (OCHA-verified)',
      'Withdrawal of Karovian military personnel from Nordalian territory',
      'Cooperation with UNSC Panel of Experts investigations including facility access',
      'Release of detained journalists and political prisoners (HRC-benchmarked)',
    ],
    negotiatingOpportunities: [
      'Phased Westmark sanctions relief as sequenced incentives in a roadmap agreement — linking each phase to specific compliance milestones creates measurable accountability structure',
      'Karovian economic interests in Westmark markets create bilateral channel for sanctions diplomacy outside formal UNSC framework',
      'Offer of arms embargo suspension in DRM-controlled areas as confidence-building measure contingent on DRM DDR cooperation',
      'FATF grey listing deferral as near-term DRM incentive to engage formal negotiation process',
    ],
  },
  overallSanctionsPressure: 5,
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
    const creditCheck = await checkAndDeductCredits('ai_sanctions_scan', 'Sanctions analysis');
    if (!creditCheck.allowed) return creditCheck.response;

    const graphCtx = situationId ? await buildGraphContext(user.uid, situationId, 'sanctions') : '';
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as unknown as Situation).name, region: (situation as unknown as Situation).region, actors: (situation as unknown as Situation).actors },
          'sanctions', user.uid
        )
      : '';

    const result = await callProModel({
      output: Output.object({ schema: SanctionsSchema }),
      system: 'You are a senior sanctions analyst specializing in conflict-related sanctions regimes, international humanitarian law compliance, and coercive diplomacy. You have deep expertise in UNSC sanctions architecture, OFAC, EU restrictive measures, and AU frameworks. Provide rigorous, evidence-grounded analysis for senior diplomatic and legal professionals. Always cite specific sanctions instruments, committee decisions, and Panel of Experts findings.',
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
Conduct a comprehensive sanctions landscape analysis for this conflict situation.

Assess:
1. All applicable sanctions regimes — UNSC, US (OFAC), EU, AU, and unilateral state measures
2. For each regime: targeted actors, legal basis, current status, effectiveness, compliance level
3. Evasion patterns — document specific methodologies with source attribution where possible
4. Humanitarian impact — including exemption adequacy and civilian harm risks
5. Leverage potential — how each regime can be used as a diplomatic instrument
6. Sanctions diplomacy — what conditions for lifting exist and what negotiating opportunities the architecture creates

Quantify effectiveness (0–10) based on observed target behaviour change. Cite web intelligence for current sanctions status and evasion documentation. Flag where intelligence gaps constrain assessment.`,
    });

    if (situationId) await writeToolDataServer(user.uid, situationId, 'sanctions', result.output as Record<string, unknown>);
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'sanctions');
  }
});
