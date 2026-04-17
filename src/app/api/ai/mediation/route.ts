import { NextResponse } from 'next/server';
import { Output, streamText } from 'ai';
import { z } from 'zod';
import { getModel, callProModel } from '@/lib/ai/providers';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { writeToolDataServer } from '@/lib/ai/context-builder-server';
import { buildGraphContext } from '@/lib/ai/context-builder-server';
import { withAuth } from '@/lib/api/with-auth';

export const maxDuration = 60;

// --- Schemas per action ---

const MediationPlanSchema = z.object({
  phases: z.array(
    z.object({
      name: z.string().describe('Phase name'),
      objectives: z.array(z.string()).describe('Key objectives for this phase'),
      keyQuestions: z.array(z.string()).describe('Critical questions to address in this phase'),
      riskFactors: z.array(z.string()).describe('Risks that could derail this phase'),
    })
  ).describe('Mediation plan phases'),
  timeline: z.string().describe('Proposed timeline with milestones and decision points'),
  framework: z.string().describe('Recommended mediation framework and methodology (e.g., Fisher/Ury, Glasl, transformative)'),
});

const SettlementSchema = z.object({
  terms: z.array(
    z.object({
      clause: z.string().describe('Settlement clause text'),
      obligations: z.array(z.string()).describe('Specific obligations arising from this clause for each party'),
    })
  ).describe('Settlement terms and clauses'),
  signatories: z.array(z.string()).describe('Required signatories for the settlement'),
  conditions: z.array(z.string()).describe('Conditions precedent and implementation requirements'),
});

// --- Demo responses ---

const DEMO_PLAN = {
  phases: [
    {
      name: 'Pre-Negotiation and Confidence Building',
      objectives: [
        'Establish ground rules and procedural framework acceptable to both parties',
        'Build on successful prisoner exchange precedent to create momentum',
        'Secure 72-hour quiet period commitment from both parties',
      ],
      keyQuestions: [
        'Will the GoN accept the DRM as a legitimate negotiating partner (not "terrorists")?',
        'Will the DRM agree to discuss DDR framework principles before elections?',
        'Can both external patrons (Karovia, Westmark) commit to supporting the process?',
      ],
      riskFactors: [
        'Hardline spoilers within AFN command may attempt provocation to derail pre-talks',
        'GoN cabinet reshuffle may have closed decision-making space for accommodation',
        'DRM field commanders in Sectors 2 and 4 operate with significant autonomy',
      ],
    },
    {
      name: 'Interest Identification and ZOPA Mapping',
      objectives: [
        'Shift discourse from positions to underlying interests using Fisher/Ury framework',
        'Map Zone of Possible Agreement on economic issues (rare earth revenue-sharing)',
        'Identify tradeable concessions between security guarantees and political inclusion',
      ],
      keyQuestions: [
        'What revenue-sharing formula is acceptable to both parties (CONCORDIA analysis suggests 35-45% to eastern provinces)?',
        'What security guarantees would enable DRM to accept a phased DDR process?',
        'What transitional governance arrangement preserves GoN legitimacy while addressing DRM political demands?',
      ],
      riskFactors: [
        'Identity entrenchment (Stage 5 dynamics) may prevent interest-based reframing',
        'External patrons may have conflicting interests that override domestic party flexibility',
        'Public commitment to maximalist positions makes compromise politically costly for leaders',
      ],
    },
    {
      name: 'Framework Agreement Negotiation',
      objectives: [
        'Negotiate framework agreement covering ceasefire reinforcement, revenue-sharing, transitional governance, and DDR principles',
        'Use one-text procedure to develop a single negotiating document',
        'Establish implementation monitoring mechanisms',
      ],
      keyQuestions: [
        'Can a package deal linking economic, security, and political issues generate sufficient gains for both sides?',
        'What role will UNMN play in implementation monitoring?',
        'How will the AU Roadmap election timeline be adjusted?',
      ],
      riskFactors: [
        'Karovian veto through GoN patron-client relationship',
        'DRM internal divisions between political and military wings',
        'UNSC mandate renewal uncertainty may undermine implementation guarantees',
      ],
    },
  ],
  timeline: 'Phase 1: 4-6 weeks (April-May 2026). Phase 2: 6-8 weeks (June-July 2026). Phase 3: 8-12 weeks (August-October 2026). Total estimated timeline to framework agreement: 6-8 months. Implementation phase: 18-24 months. Note: This timeline assumes no major ceasefire collapse; such an event would reset the process by 12-18 months.',
  framework: 'Recommended: Interest-Based Negotiation (Fisher/Ury) as the primary methodology, supplemented by Glasl de-escalation techniques for managing Stage 5 dynamics. The one-text procedure is recommended for the framework negotiation phase to avoid positional bargaining. CONCORDIA analysis of 230 historical mediation processes suggests this combination has the highest success rate for conflicts at Glasl Stage 4-5 with active proxy dynamics.',
};

const DEMO_SETTLEMENT = {
  terms: [
    {
      clause: 'Article 1: Cessation of Hostilities. All parties shall maintain a comprehensive ceasefire along the established Line of Contact, monitored by UNMN with enhanced verification capacity at the three Kessara corridor contact points.',
      obligations: [
        'GoN/AFN: Withdraw forward observation posts from buffer zone within 72 hours; cease all offensive operations',
        'DRM: Cease all patrol activities in demilitarized sectors; provide UNMN full access to controlled areas',
        'UNMN: Deploy additional monitoring teams within 14 days; establish 24/7 reporting mechanism',
      ],
    },
    {
      clause: 'Article 2: Revenue-Sharing Framework. Revenues from the Belara Mining Complex and associated Eastern Province mineral operations shall be allocated according to the formula: 60% central government, 40% Eastern Provincial Authority, subject to independent audit.',
      obligations: [
        'GoN: Establish transparent revenue accounting within 90 days; accept independent international audit',
        'DRM/EPA: Ensure unimpeded mining operations in controlled territory; participate in joint oversight committee',
        'International partners: Provide technical assistance for audit mechanism and capacity building',
      ],
    },
    {
      clause: 'Article 3: Transitional Governance. A transitional power-sharing arrangement shall be established for a period of 24 months, during which internationally supervised elections will be organized.',
      obligations: [
        'GoN: Accept DRM political participation in transitional governance; release all political prisoners within 30 days',
        'DRM: Nominate civilian political representatives (not military commanders) for transitional positions',
        'AU/UNMN: Provide electoral assistance and supervision; certify election conditions within 18 months',
      ],
    },
  ],
  signatories: [
    'Government of Nordalia (President Amara Osei)',
    'Democratic Reform Movement (Commander Kwame Asante)',
    'UNMN (SRSG Maria Santos, as witness)',
    'African Union (Panel of the Wise Chair, as guarantor)',
    'Republic of Karovia (as regional guarantor)',
    'Federal Republic of Westmark (as regional guarantor)',
  ],
  conditions: [
    'Ratification by both parties within 14 days of signing',
    'UNSC endorsement through a supporting resolution within 30 days',
    'Establishment of Joint Implementation Monitoring Commission within 21 days',
    'Karovian and Westmark written commitment to respect and support the agreement',
    'Deployment of enhanced UNMN ceasefire verification capacity as precondition for revenue-sharing implementation',
  ],
};

const DEMO_ASSIST_TEXT = `Based on the current dynamics, I recommend focusing on the prisoner exchange momentum as an entry point.

**Immediate tactical suggestion:** Propose a third prisoner exchange with expanded scope — not just military detainees but also the five detained NIMN journalists. This achieves several objectives:
1. Builds on the strongest trust-building chain in the commitment graph
2. Addresses an international human rights concern (press freedom) that creates positive external pressure
3. Demonstrates good faith from the GoN at low political cost
4. Creates a positive news cycle that can shift the narrative from military brinkmanship to cooperation

**Framing for the GoN:** Position the journalist release as a sovereign decision demonstrating confidence and legitimacy, not a concession to DRM demands.

**Framing for the DRM:** Emphasize that expanded prisoner exchanges demonstrate the viability of negotiated outcomes and build the case for broader political engagement.

**Risk to manage:** Ensure the exchange is not perceived as a transactional quid pro quo but rather as a parallel humanitarian gesture by both parties. This preserves each side's ability to present it as their own initiative.`;

export const POST = withAuth(async (request, user) => {
  try {
    const { action, conflictContext, parties, issues, situationId } = await request.json() as {
      action: 'plan' | 'assist' | 'settle';
      conflictContext?: string;
      parties?: string[];
      issues?: string[];
      situationId?: string;
    };

    // --- Demo mode ---
    if (isServerDemoMode()) {
      if (action === 'plan') return NextResponse.json(DEMO_PLAN);
      if (action === 'settle') return NextResponse.json(DEMO_SETTLEMENT);
      // assist: return as stream-formatted text
      return new Response(DEMO_ASSIST_TEXT, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Praxis-Demo': 'true',
        },
      });
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_mediation', 'Mediation intelligence');
    if (!creditCheck.allowed) return creditCheck.response;

    const partiesStr = parties?.join(', ') || 'the conflict parties';
    const issuesStr = issues?.join(', ') || 'core conflict issues';
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'mediation_design').catch(() => '')
      : '';

    // --- Action: plan ---
    if (action === 'plan') {
      const result = await callProModel({
        output: Output.object({ schema: MediationPlanSchema }),
        prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}You are a senior mediation strategist. Design a comprehensive mediation plan.

${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}
PARTIES: ${partiesStr}
KEY ISSUES: ${issuesStr}

Design a phased mediation plan that:
1. Addresses pre-negotiation confidence building
2. Maps interests and identifies the Zone of Possible Agreement (ZOPA)
3. Structures framework agreement negotiation

For each phase, specify objectives, key questions, and risk factors. Recommend a mediation methodology and provide a realistic timeline. Draw on Fisher/Ury, Glasl, and comparative mediation precedents.`,
        system: 'You are a senior mediation strategist with extensive experience in conflict resolution. Design mediation plans that are practically implementable, grounded in established methodology, and sensitive to the political constraints of all parties.',
      });

      if (situationId && user.uid) {
        await writeToolDataServer(user.uid, situationId, 'mediation_design', result.output as Record<string, unknown>).catch(
          (err) => console.error('[mediation/plan] persist failed:', err),
        );
      }
      return NextResponse.json(result.output);
    }

    // --- Action: settle ---
    if (action === 'settle') {
      const result = await callProModel({
        output: Output.object({ schema: SettlementSchema }),
        prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}You are a senior legal advisor specializing in peace agreement drafting. Generate settlement terms.

${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}
PARTIES: ${partiesStr}
KEY ISSUES: ${issuesStr}

Draft settlement terms that:
1. Address the core issues with specific, implementable clauses
2. Define clear obligations for each party
3. Identify required signatories including guarantors and witnesses
4. Specify conditions precedent for implementation

Use language consistent with international peace agreement conventions. Reference comparable agreements where useful (Dayton, CPA, Colombian peace accord).`,
        system: 'You are a senior legal advisor specializing in peace agreement architecture. Draft settlement terms that are legally precise, politically feasible, and practically implementable. Use standard international peace agreement language and conventions.',
      });

      if (situationId && user.uid) {
        await writeToolDataServer(user.uid, situationId, 'mediation_settlement', result.output as Record<string, unknown>).catch(
          (err) => console.error('[mediation/settle] persist failed:', err),
        );
      }
      return NextResponse.json(result.output);
    }

    // --- Action: assist (streaming) ---
    const result = streamText({
      model: getModel(),
      prompt: `You are a real-time mediation assistant supporting an ongoing mediation session.

${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}
PARTIES: ${partiesStr}
CURRENT ISSUES UNDER DISCUSSION: ${issuesStr}

Provide tactical mediation advice for the current moment:
1. Identify the most promising entry point for progress
2. Suggest specific framing for each party that advances the discussion
3. Flag risks to manage in the current phase
4. Recommend concrete next steps

Be practical, specific, and sensitive to each party's political constraints. Avoid generic mediation advice — tailor to the specific conflict dynamics.`,
      system: 'You are a real-time mediation intelligence assistant embedded in a conflict mediation session. Provide concise, actionable tactical advice that the mediator can use immediately. Be specific to the parties and issues at hand.',
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('Mediation route error:', err);
    return NextResponse.json({ error: 'Mediation request failed' }, { status: 500 });
  }
});
