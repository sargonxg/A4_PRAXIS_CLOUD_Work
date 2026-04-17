import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { withAuth } from '@/lib/api/with-auth';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import type { Situation } from '@/types/situation';

export const maxDuration = 120;

const TreatyAnalysisSchema = z.object({
  clauses: z.array(
    z.object({
      number: z.number().describe('Clause number'),
      text: z.string().describe('Clause text or summary'),
      category: z.string().describe('Category of the clause (e.g., ceasefire, governance, rights, economic, implementation)'),
      complianceStatus: z.enum(['compliant', 'partial', 'non_compliant', 'not_yet_due', 'unclear']).describe('Current compliance status'),
      ambiguityFlag: z.boolean().describe('Whether the clause contains ambiguous language that could be exploited or contested'),
      notes: z.string().describe('Analytical notes on the clause including compliance evidence, risks, and recommendations'),
    })
  ).describe('Clause-by-clause analysis'),
  complianceSummary: z.object({
    overall: z.number().min(0).max(100).describe('Overall compliance percentage from 0 to 100'),
    byParty: z.record(z.string(), z.number()).describe('Compliance percentage by party name'),
  }).describe('Compliance summary statistics'),
  recommendations: z.array(z.string()).describe('Recommendations for improving compliance, resolving ambiguities, and strengthening the agreement'),
});

// Static demo response
const DEMO_RESPONSE = {
  clauses: [
    {
      number: 1,
      text: 'All parties shall maintain a comprehensive ceasefire along the established Line of Contact.',
      category: 'ceasefire',
      complianceStatus: 'partial' as const,
      ambiguityFlag: false,
      notes: 'The ceasefire framework remains intact but compliance is deteriorating. 47 documented violations since September 2025, predominantly localized skirmishes and freedom-of-movement restrictions. Both parties maintain plausible deniability for violations attributed to "unauthorized local commanders." AFN buffer zone incursions (3 consecutive weeks) represent a qualitative escalation beyond previous violation patterns.',
    },
    {
      number: 2,
      text: 'UNMN shall deploy ceasefire verification teams at designated monitoring points along the Line of Contact.',
      category: 'implementation',
      complianceStatus: 'partial' as const,
      ambiguityFlag: true,
      notes: 'UNMN has deployed monitoring teams but effectiveness is constrained by GoN-imposed freedom-of-movement restrictions. The term "designated monitoring points" is ambiguous — the GoN interprets this narrowly (fixed positions only), while UNMN and DRM argue it includes mobile patrol authority. This ambiguity is being exploited to limit monitoring coverage.',
    },
    {
      number: 3,
      text: 'Three humanitarian corridors shall be established for unimpeded access to civilian populations in the Eastern Provinces.',
      category: 'humanitarian',
      complianceStatus: 'non_compliant' as const,
      ambiguityFlag: false,
      notes: 'All three corridors are operational but none provides "unimpeded access" as specified. GoN maintains administrative checkpoints with processing delays of 4-8 hours. DRM imposes informal taxation on aid convoys in Sector 3. OCHA reports corridor throughput at approximately 60% of planned capacity. Both parties bear responsibility for non-compliance.',
    },
    {
      number: 4,
      text: 'Both parties shall exchange prisoners of war and detained persons under the facilitation of the AU Panel of the Wise.',
      category: 'rights',
      complianceStatus: 'compliant' as const,
      ambiguityFlag: false,
      notes: 'This is the strongest compliance area. Two successful exchanges completed (November 2025, January 2026), with 34 individuals exchanged. Both parties have met their obligations under this clause. However, the scope is limited to military detainees — the five detained NIMN journalists are classified by the GoN as "security cases" outside the prisoner exchange framework.',
    },
    {
      number: 5,
      text: 'All parties shall cooperate fully with the UNSC Panel of Experts regarding arms embargo compliance.',
      category: 'implementation',
      complianceStatus: 'non_compliant' as const,
      ambiguityFlag: false,
      notes: 'The GoN has obstructed Panel of Experts access to military facilities and declined to provide end-user certificate documentation. Karovia has not responded to Panel queries regarding documented arms transfer flights. The DRM has provided limited cooperation but restricts access to Sectors 2 and 4. The Panel interim report (S/2025/892) documents systematic non-cooperation.',
    },
  ],
  complianceSummary: {
    overall: 42,
    byParty: {
      'Government of Nordalia': 35,
      'Democratic Reform Movement': 48,
      'UNMN': 72,
      'Republic of Karovia': 15,
      'Federal Republic of Westmark': 65,
    },
  },
  recommendations: [
    'Resolve UNMN monitoring point ambiguity through a supplementary protocol defining "designated monitoring points" to explicitly include mobile patrol authority within a specified radius of the Line of Contact',
    'Establish a joint humanitarian access commission with GoN, DRM, and OCHA representation to address corridor throughput deficiencies and eliminate checkpoint delays',
    'Expand the prisoner exchange framework to include civilian detainees, including journalists, by redefining scope in a supplementary agreement',
    'Strengthen Panel of Experts investigation capacity by requesting UNSC authorization for enhanced access provisions, including unannounced facility inspections',
    'Create a compliance tracking mechanism with regular public reporting to increase accountability pressure on all parties',
    'Address the Karovian non-cooperation through targeted UNSC Committee action, including potential listing of individuals obstructing Panel investigations',
  ],
};

export const POST = withAuth(async (request, user) => {
  try {
    const { treatyText, conflictContext, situation } = await request.json() as {
      treatyText: string;
      conflictContext?: string;
      situation?: Situation;
    };
    const sitContext = situation ? buildToolContext(situation) : '';
    const situationId = situation?.id ?? '';
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'treaty_analysis').catch(() => '')
      : '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_treaty_analyze', 'Treaty analysis');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- AI analysis ---
    const contextPrefix = [graphCtx, sitContext].filter(Boolean).join('\n\n');
    const result = await callProModel({
      output: Output.object({ schema: TreatyAnalysisSchema }),
      prompt: `${contextPrefix ? `${contextPrefix}\n\n` : ''}You are a senior legal analyst specializing in peace agreement analysis and international humanitarian law. Analyze the following treaty or agreement text.

TREATY TEXT:
${treatyText}

${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}

Provide a clause-by-clause analysis including:
1. Category classification (ceasefire, governance, rights, economic, implementation)
2. Current compliance status assessment with evidence
3. Ambiguity flag — identify clauses with language that could be exploited or contested
4. Analytical notes with compliance evidence, risks, and specific recommendations

Then provide:
- Overall compliance summary with per-party breakdowns
- Prioritized recommendations for improving compliance and resolving ambiguities

Reference comparable peace agreements and international legal standards where relevant.`,
      system: 'You are a senior legal analyst specializing in peace agreement analysis, international humanitarian law, and compliance monitoring. Provide rigorous clause-by-clause analysis suitable for legal advisors, mediators, and senior diplomatic officials. Identify ambiguities that could be exploited and recommend specific remedial actions.',
    });

    if (situationId) {
      await writeToolDataServer(user.uid, situationId, 'treaty_analysis', result.output as Record<string, unknown>).catch(() => {});
    }

    return NextResponse.json(result.output);
  } catch (err) {
    console.error('Treaty analyze route error:', err);
    return NextResponse.json({ error: 'Treaty analysis failed' }, { status: 500 });
  }
});
