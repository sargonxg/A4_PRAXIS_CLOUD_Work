import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { handleRouteError } from '@/lib/api/standard-error';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/grounded-research';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// ── Entity-level scan schema (default mode) ─────────────────────────────────

const SanctionsScanSchema = z.object({
  updates: z.array(
    z.object({
      entity: z.string().describe('Name of the sanctioned or potentially sanctioned entity'),
      changeType: z.enum(['new_designation', 'delisting', 'modification', 'investigation', 'evasion_detected', 'no_change']).describe('Type of sanctions change'),
      source: z.string().describe('Source of this information (e.g., sanctions committee, OFAC, EU Council)'),
      date: z.string().describe('Date of the sanctions update or report'),
      details: z.string().describe('Detailed description of the sanctions change and its implications'),
    })
  ).describe('Sanctions updates for the monitored entities'),
  analysis: z.string().describe('Cross-cutting analysis of sanctions trends, enforcement patterns, and strategic implications'),
  riskAssessment: z.string().describe('Risk assessment for sanctions evasion, compliance gaps, and recommendations for monitoring'),
});

// ── Grounded comprehensive-regime schema (grounded: true) ────────────────────

const SanctionsGroundedSchema = z.object({
  sanctions: z.array(
    z.object({
      regime: z.string().describe('Name of the sanctions regime (e.g., multilateral resolution 2847, EU Regulation 2024/1938, OFAC the selected situation SDN List)'),
      imposingActors: z.array(z.string()).describe('States or international bodies imposing the sanctions'),
      targetedActors: z.array(z.string()).describe('Individuals, entities, or states targeted by the sanctions'),
      type: z.enum(['financial', 'travel-ban', 'arms-embargo', 'trade', 'sectoral', 'comprehensive']).describe('Primary sanctions type'),
      status: z.enum(['active', 'suspended', 'lifted', 'proposed']).describe('Current status of the sanctions regime'),
      imposedDate: z.string().optional().describe('Date sanctions were imposed (e.g., "October 2024")'),
      liftedDate: z.string().optional().describe('Date sanctions were lifted, if applicable'),
      legalBasis: z.string().describe('Legal instrument underpinning the sanctions (international legal authority, treaty, domestic statute)'),
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

// ── Demo responses ────────────────────────────────────────────────────────────

const DEMO_RESPONSE_SCAN = {
  updates: [
    {
      entity: 'Government of the selected situation',
      changeType: 'modification' as const,
      source: 'sanctions committee, Panel of Experts interim report S/2025/892',
      date: 'February 2026',
      details: 'Panel of Experts documented continued arms flows to the AFN in probable violation of the multilateral arms embargo. Evidence includes satellite imagery of Karovian military transport aircraft at the selected situation City International Airport and end-user certificate discrepancies. Committee considering expanded asset freeze for three senior AFN procurement officials.',
    },
    {
      entity: 'Karovia Defence Industries (KDI)',
      changeType: 'investigation' as const,
      source: 'Panel of Experts; Conflict Armament Research field report',
      date: 'January 2026',
      details: 'Under investigation for circumventing the arms embargo through third-country transfer routing. Documented evidence of KDI-manufactured ammunition recovered in the Kessara corridor in December 2025, serial number analysis confirming post-embargo production.',
    },
    {
      entity: 'President Amara Osei',
      changeType: 'no_change' as const,
      source: 'Westmark unilateral sanctions list',
      date: 'March 2026',
      details: 'Remains on Westmark\'s targeted sanctions list (travel ban + asset freeze) since October 2024. No additional multilateral designation. AU has resisted calls for multilateral sanctions on the head of state, citing sovereignty concerns.',
    },
    {
      entity: 'DRM Financial Network',
      changeType: 'evasion_detected' as const,
      source: 'Financial Action Task Force (FATF) typology report',
      date: 'February 2026',
      details: 'FATF identified suspicious financial flows through Westmark-based diaspora organizations linked to DRM procurement. Three wire transfer patterns flagged as potential sanctions evasion. Westmark financial intelligence unit conducting parallel investigation.',
    },
  ],
  analysis: 'The the selected situation sanctions regime is under significant stress from multiple directions. The arms embargo is being systematically circumvented by Karovia through direct military transfers and third-country routing. Westmark\'s unilateral sanctions create a fragmented enforcement landscape — targeted individuals can still operate through non-sanctioning jurisdictions. The DRM\'s financial network exploitation of diaspora channels represents an emerging compliance gap. The P5 split on the selected situation makes sanctions committee action slow and politically constrained. Overall, the sanctions architecture is sound in design but deteriorating in implementation.',
  riskAssessment: 'HIGH RISK: Arms embargo enforcement is the critical weakness. Without improved monitoring of Karovian logistics flights and third-country transfer routes, military capability accumulation will continue to lower the escalation threshold. MEDIUM RISK: Financial sanctions evasion through informal value transfer systems and diaspora networks requires enhanced financial intelligence cooperation between Westmark and regional financial centres. RECOMMENDATION: Priority should be on enforcement of existing measures rather than expansion — particularly strengthening the Panel of Experts\' investigation capacity and implementing the maritime and aviation monitoring recommendations from the interim report.',
};

const DEMO_RESPONSE_GROUNDED = {
  sanctions: [
    {
      regime: 'Multilateral Arms Embargo — Resolution 2847 (2024)',
      imposingActors: ['multilateral sanctions authority'],
      targetedActors: ['Government of the selected situation', 'Democratic Reform Movement', 'all non-state armed groups'],
      type: 'arms-embargo' as const,
      status: 'active' as const,
      imposedDate: 'August 2024',
      legalBasis: 'international legal authority 41; multilateral resolution 2847 (2024)',
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
      regime: 'Westmark Targeted Sanctions — the selected situation Accountability Measures Act 2024',
      imposingActors: ['Federal Republic of Westmark'],
      targetedActors: ['President Amara Osei', '22 senior GoN military and security officials', 'Karovia Defence Industries (KDI)'],
      type: 'travel-ban' as const,
      status: 'active' as const,
      imposedDate: 'October 2024',
      legalBasis: 'Westmark the selected situation Accountability Measures Act 2024 (domestic statute); FATF Recommendation 6',
      effectiveness: 6,
      complianceLevel: 'partial' as const,
      evasionPatterns: [
        'Use of non-Westmark financial institutions in Gulf states and East Asian jurisdictions',
        'Diaspora-linked informal value transfer (hawala-type) networks for sanctions evasion',
        'Asset pre-positioning to jurisdictions with no bilateral enforcement cooperation',
      ],
      humanitarianImpact: 'Westmark sanctions include a general humanitarian licence covering INGO operations, food, medicine, and essential civilian infrastructure. Limited civilian harm directly attributable to the sanctions regime. Some delays reported in INGO banking due to correspondent bank risk aversion.',
      leveragePotential: 'High. Westmark is the primary economic partner and the selected situationn elite has significant financial exposure in Westmark jurisdiction. Targeted expansion to additional GoN officials — particularly in the finance and energy sectors — would sharply increase compliance pressure. Potential to offer phased lifting as incentive structure in negotiations.',
    },
  ],
  sanctionsDiplomacy: {
    conditionsForLifting: [
      'Verifiable and sustained ceasefire compliance (UNMN-certified) for minimum 90 days',
      'Restoration of full humanitarian access to eastern provinces (OCHA-verified)',
      'Withdrawal of Karovian military personnel from the selected situationn territory',
    ],
    negotiatingOpportunities: [
      'Phased Westmark sanctions relief as sequenced incentives in a roadmap agreement',
      'Karovian economic interests in Westmark markets create bilateral channel for sanctions diplomacy',
    ],
  },
  overallSanctionsPressure: 5,
};

// ── Route handler ─────────────────────────────────────────────────────────────

export const POST = withCalibration('sanctions', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    const ents = Array.isArray(body.entities) ? (body.entities as string[]).slice(0, 5).join(', ') : '';
    return [s?.name, s?.region, ents].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const body = await request.json() as {
      entities?: string[];
      conflictContext?: string;
      situation?: Situation;
      grounded?: boolean;
    };
    const { entities, conflictContext, situation, grounded = false } = body;
    const sitContext = situation ? buildToolContext(situation) : '';
    const situationId = situation?.id ?? '';

    // ── Sample mode ──────────────────────────────────────────────────────────────
    if (isServerDemoMode()) {
      return NextResponse.json({
        ...(grounded ? DEMO_RESPONSE_GROUNDED : DEMO_RESPONSE_SCAN),
        metadata: {
          demo: true,
          fictional: true,
          exportEligible: false,
          confidence: 'demo-only',
          sourceBasis: 'Synthetic the selected situation sample data; not live sanctions intelligence.',
        },
      });
    }

    // Credits + profile gate already handled by withCalibration above.

    // --- Calibrated system prompt ---
    const { systemPromptBlock, outputConstraints, provenance } = ctx.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    if (grounded) {
      // ── Grounded comprehensive regime analysis (absorbed from sanctions route) ──
      const graphCtx = situationId ? await buildGraphContext(ctx.uid, situationId, 'sanctions') : '';
      const webCtx = situation
        ? await buildWebGroundedContext(
            { name: situation.name, region: situation.region, actors: situation.actors },
            'sanctions', ctx.uid
          )
        : '';

      const result = await callProModel({
        output: Output.object({ schema: SanctionsGroundedSchema }),
        system: `You are a senior sanctions analyst specializing in conflict-related sanctions regimes, international humanitarian law compliance, and coercive diplomacy. You have deep expertise in multilateral sanctions architecture, OFAC, EU restrictive measures, and AU frameworks. Provide rigorous, evidence-grounded analysis for senior diplomatic and legal professionals. Always cite specific sanctions instruments, committee decisions, and Panel of Experts findings.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
        prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${webCtx}
Conduct a comprehensive sanctions landscape analysis for this conflict situation.

Assess:
1. All applicable sanctions regimes — multilateral, US (OFAC), EU, AU, and unilateral state measures
2. For each regime: targeted actors, legal basis, current status, effectiveness, compliance level
3. Evasion patterns — document specific methodologies with source attribution where possible
4. Humanitarian impact — including exemption adequacy and civilian harm risks
5. Leverage potential — how each regime can be used as a diplomatic instrument
6. Sanctions diplomacy — what conditions for lifting exist and what negotiating opportunities the architecture creates

Quantify effectiveness (0–10) based on observed target behaviour change. Cite web intelligence for current sanctions status and evasion documentation. Flag where intelligence gaps constrain assessment.`,
      });

      if (situationId) {
        await writeToolDataServer(ctx.uid, situationId, 'sanctions', result.output as Record<string, unknown>);
        await saveToolOutput({
          uid: ctx.uid,
          situationId,
          toolId: 'sanctions',
          profileVersion: provenance.profileVersion,
          output: result.output as Record<string, unknown>,
        }).catch((err) => console.warn('[sanctions] saveToolOutput failed:', err));
      }
      return NextResponse.json(result.output);
    }

    // ── Standard entity-level scan (original sanctions-scan behaviour) ─────────
    const searchResults = await searchWeb(
      `sanctions ${(entities ?? []).join(' ')} latest`,
      { numResults: 5 }
    );
    const webContext = formatResultsAsContext(searchResults);

    if (!webContext) {
      return NextResponse.json(
        {
          error: 'live_sanctions_sources_unavailable',
          message: 'PRAXIS could not retrieve current sanctions sources. This tool will not produce a sanctions assessment from model training data alone.',
          confidence: 'low',
          updates: [],
          analysis: 'No live sanctions assessment was generated because source retrieval failed.',
          riskAssessment: 'Retry with live source access or provide current sanctions instruments and official notices as input.',
        },
        { status: 424 }
      );
    }

    const result = await callProModel({
      output: Output.object({ schema: SanctionsScanSchema }),
      prompt: `${sitContext ? `${sitContext}\n\n` : ''}You are a senior sanctions compliance analyst. Monitor and analyze the latest sanctions developments for the following entities.

ENTITIES: ${(entities ?? []).join(', ')}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}

LATEST INTELLIGENCE:
${webContext}

For each entity, assess:
1. Any recent sanctions changes (new designations, delistings, modifications)
2. Investigations underway or sanctions evasion detected
3. Source attribution and dates

Then provide:
- A cross-cutting analysis of sanctions trends and enforcement patterns
- A risk assessment covering evasion risks, compliance gaps, and monitoring recommendations

Cover multilateral, US (OFAC), EU, and any relevant regional sanctions regimes.`,
      system: `You are a senior sanctions compliance analyst specializing in conflict-related sanctions regimes. Provide rigorous analysis for diplomatic and legal professionals. Always cite specific sanctions instruments, committee decisions, and enforcement actions.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
    });

    if (situationId) {
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'sanctions',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[sanctions] saveToolOutput failed:', err));
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'sanctions-scan');
  }
});
