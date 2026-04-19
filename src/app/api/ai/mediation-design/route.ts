import { NextResponse } from 'next/server';
import { generateText, Output, streamText } from 'ai';
import { z } from 'zod';
import { getModel, callProModel, getThinkingModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { handleRouteError } from '@/lib/api/standard-error';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// ── Schemas ───────────────────────────────────────────────────────────────────

const ProcessPhaseSchema = z.object({
  id: z.string().describe('Phase identifier (e.g. "p1", "p2")'),
  name: z.string().describe('Phase name'),
  duration: z.string().describe('Estimated duration (e.g. "8-12 weeks")'),
  objective: z.string().describe('Primary objective of this phase'),
  keyActivities: z.array(z.string()).describe('Concrete activities to be conducted in this phase'),
  successCriteria: z.array(z.string()).describe('Measurable criteria for phase completion'),
  risks: z.array(z.string()).describe('Phase-specific risks and mitigation approaches'),
  status: z.enum(['completed', 'active', 'pending']).describe('Current implementation status'),
});

const CBMSchema = z.object({
  title: z.string().describe('Name of the confidence-building measure'),
  type: z.enum(['military', 'humanitarian', 'economic', 'political', 'symbolic']).describe('CBM category'),
  parties: z.array(z.string()).describe('Parties responsible for implementing this CBM'),
  timeline: z.string().describe('When this CBM should be implemented relative to process phases'),
  verificationMechanism: z.string().describe('How compliance with this CBM will be verified'),
});

const MediationDesignSchema = z.object({
  processName: z.string().describe('Official or working name for the mediation process'),
  format: z.enum(['direct', 'proximity', 'shuttle', 'multilateral', 'hybrid']).describe('Recommended negotiation format based on parties\' trust level and political context'),
  venue: z.string().describe('Recommended venue with rationale'),
  mediatorProfile: z.string().describe('Recommended mediator profile, composition, and institutional affiliation'),
  phases: z.array(ProcessPhaseSchema).min(3).max(6).describe('Sequenced process phases from pre-negotiation to implementation'),
  cbms: z.array(CBMSchema).min(2).max(6).describe('Confidence-building measures sequenced to support the process'),
  groundRules: z.array(z.string()).min(4).max(8).describe('Process ground rules governing parties\' conduct'),
  spoilerMitigation: z.array(z.string()).describe('Strategies for managing potential spoilers'),
  implementationMonitoring: z.string().describe('Post-agreement implementation and monitoring architecture'),
  processRisks: z.array(z.string()).describe('Macro-level risks to the overall process'),
  designRationale: z.string().describe('Explanation of key process design choices and their strategic rationale'),
});

// Absorbed from /api/ai/mediation — used by concordia page (action: 'plan' | 'settle' | 'assist')

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

// ── Demo responses ────────────────────────────────────────────────────────────

const DEMO_RESPONSE_DESIGN = {
  processName: 'Nordalia Inclusive Peace Process (NIPP)',
  format: 'hybrid' as const,
  venue: 'Kigali, Rwanda (African Union Peace and Security Council facilities)',
  mediatorProfile: 'Joint AU-UN mediation team: AU Commissioner for Peace and Security (lead), UN DPPA senior political officer, supported by technical advisors for security, economic, and human rights tracks.',
  phases: [
    {
      id: 'p1',
      name: 'Pre-Negotiation: Confidence-Building',
      duration: '8-12 weeks',
      objective: 'Establish sufficient trust and secure Karovia commitment to halt material support to DRM.',
      keyActivities: [
        'Bilateral pre-talks with GoN and DRM through backchannel',
        'Karovian engagement: commitment to pause military support',
        'ICRC-facilitated prisoner exchange (minimum 30 per side)',
        'Technical working group on ceasefire compliance',
      ],
      successCriteria: [
        'Both parties commit in writing to negotiate in good faith',
        'Humanitarian access opens to all districts (OCHA verified)',
        'At least one prisoner exchange completed',
      ],
      risks: [
        'GoN may condition participation on DRM disarmament — resist pre-conditions',
        'DRM may demand political recognition before talks',
      ],
      status: 'active' as const,
    },
    {
      id: 'p2',
      name: 'Economic Issues',
      duration: '10-14 weeks',
      objective: 'Reach framework agreement on revenue-sharing — the issue with strongest ZOPA.',
      keyActivities: [
        'Belara Mining revenue-sharing formula (World Bank technical support)',
        'Eastern Provincial Development Fund establishment',
        'International investment guarantees conditional on settlement',
      ],
      successCriteria: [
        'Agreement in principle on revenue-sharing (target: 30-40% to eastern provinces)',
        'International financial institution commitment to administer arrangements',
      ],
      risks: ['GoN may link economic agreement to security/DDR to slow process'],
      status: 'pending' as const,
    },
    {
      id: 'p3',
      name: 'Security and DDR',
      duration: '12-16 weeks',
      objective: 'Negotiate phased DDR and security arrangements with parallel military track.',
      keyActivities: [
        'DDR sequencing: phased cantonment linked to political benchmarks',
        'Security guarantees for DRM leadership',
        'UNMN monitoring mandate expansion',
        'Security sector reform framework',
      ],
      successCriteria: [
        'Phased DDR timeline agreed (24-36 month framework)',
        'Security guarantee mechanism signed by international guarantors',
      ],
      risks: [
        'GoN military hardliners resist any DRM integration pathway',
        'DRM will not disarm without credible security guarantees',
      ],
      status: 'pending' as const,
    },
    {
      id: 'p4',
      name: 'Political Settlement',
      duration: '10-14 weeks',
      objective: 'Negotiate transitional political arrangements, electoral framework, and governance structure.',
      keyActivities: [
        'Transitional governance framework',
        'Internationally supervised elections timeline',
        'Constitutional amendment for eastern province autonomy',
        'Transitional justice mechanism',
      ],
      successCriteria: [
        'Electoral framework agreement including DRM participation rights',
        'Constitutional reform roadmap with clear timelines',
      ],
      risks: ['President Osei will resist any power-sharing arrangement'],
      status: 'pending' as const,
    },
  ],
  cbms: [
    {
      title: 'ICRC prisoner exchange',
      type: 'military' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement'],
      timeline: 'Phase 1 — weeks 4-6',
      verificationMechanism: 'ICRC independent monitoring; UNMN observation; joint prisoner list submission.',
    },
    {
      title: 'Humanitarian access opening',
      type: 'humanitarian' as const,
      parties: ['Government of Nordalia', 'OCHA'],
      timeline: 'Phase 1 — weeks 1-3',
      verificationMechanism: 'OCHA weekly convoy reporting; UNMN checkpoint monitoring.',
    },
    {
      title: 'Belara Mining escrow',
      type: 'economic' as const,
      parties: ['Government of Nordalia', 'Democratic Reform Movement', 'World Bank'],
      timeline: 'Ongoing from Phase 1',
      verificationMechanism: 'World Bank monthly financial transparency reports.',
    },
  ],
  groundRules: [
    'All parties negotiate in good faith and refrain from publicly undermining the process',
    'Confidentiality of negotiating positions without mutual agreement',
    'No pre-conditions beyond ceasefire respect and humanitarian access',
    'Mediator has authority to propose compromise formulations and procedural decisions',
    'Nothing is agreed until everything is agreed (single undertaking principle)',
  ],
  spoilerMitigation: [
    'GoN military hardliners: Engage through MoD parallel track; UNSC targeted sanctions as deterrent',
    'DRM commanders with criminal networks: Targeted financial accountability measures; DDR economic incentives',
    'Karovia: High-level bilateral engagement; investment package conditional on non-interference',
  ],
  implementationMonitoring: 'Joint Implementation Commission co-chaired by AU and UN DPPA, with quarterly UNSC reporting. International Contact Group provides ministerial-level political oversight.',
  processRisks: [
    'Karovia non-compliance undermines DRM incentives to make concessions',
    'GoN elections before settlement removes negotiating mandate',
    'DRM internal fragmentation: commanders may not accept what political leadership agrees',
  ],
  designRationale: 'Hybrid format reflects deep mutual distrust. Economic-first sequencing applies Lax/Sebenius momentum-building principle. Karovia framing as guarantor transforms spoiler potential into vested interest in success.',
};

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
        'What revenue-sharing formula is acceptable to both parties?',
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
  timeline: 'Phase 1: 4-6 weeks (April-May 2026). Phase 2: 6-8 weeks (June-July 2026). Phase 3: 8-12 weeks (August-October 2026). Total estimated timeline to framework agreement: 6-8 months.',
  framework: 'Recommended: Interest-Based Negotiation (Fisher/Ury) as the primary methodology, supplemented by Glasl de-escalation techniques for managing Stage 5 dynamics.',
};

const DEMO_SETTLEMENT = {
  terms: [
    {
      clause: 'Article 1: Cessation of Hostilities. All parties shall maintain a comprehensive ceasefire along the established Line of Contact, monitored by UNMN.',
      obligations: [
        'GoN/AFN: Withdraw forward observation posts from buffer zone within 72 hours; cease all offensive operations',
        'DRM: Cease all patrol activities in demilitarized sectors; provide UNMN full access to controlled areas',
        'UNMN: Deploy additional monitoring teams within 14 days; establish 24/7 reporting mechanism',
      ],
    },
    {
      clause: 'Article 2: Revenue-Sharing Framework. Revenues from the Belara Mining Complex shall be allocated according to the formula: 60% central government, 40% Eastern Provincial Authority.',
      obligations: [
        'GoN: Establish transparent revenue accounting within 90 days; accept independent international audit',
        'DRM/EPA: Ensure unimpeded mining operations in controlled territory',
        'International partners: Provide technical assistance for audit mechanism',
      ],
    },
  ],
  signatories: [
    'Government of Nordalia (President Amara Osei)',
    'Democratic Reform Movement (Commander Kwame Asante)',
    'UNMN (SRSG Maria Santos, as witness)',
    'African Union (Panel of the Wise Chair, as guarantor)',
  ],
  conditions: [
    'Ratification by both parties within 14 days of signing',
    'UNSC endorsement through a supporting resolution within 30 days',
    'Establishment of Joint Implementation Monitoring Commission within 21 days',
  ],
};

const DEMO_ASSIST_TEXT = `Based on the current dynamics, I recommend focusing on the prisoner exchange momentum as an entry point.

**Immediate tactical suggestion:** Propose a third prisoner exchange with expanded scope — not just military detainees but also the five detained NIMN journalists. This achieves several objectives:
1. Builds on the strongest trust-building chain in the commitment graph
2. Addresses an international human rights concern (press freedom) that creates positive external pressure
3. Demonstrates good faith from the GoN at low political cost

**Framing for the GoN:** Position the journalist release as a sovereign decision demonstrating confidence and legitimacy, not a concession to DRM demands.

**Framing for the DRM:** Emphasize that expanded prisoner exchanges demonstrate the viability of negotiated outcomes.`;

// ── Route handler ─────────────────────────────────────────────────────────────

export const POST = withCalibration('mediation_design', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    const ctxStr = typeof body.conflictContext === 'string' ? body.conflictContext : '';
    return [s?.name, s?.region, ctxStr].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const body = await request.json() as {
      situation?: Situation;
      // action discriminator: 'design' (default) | 'plan' | 'settle' | 'assist'
      action?: 'design' | 'plan' | 'settle' | 'assist';
      // legacy mediation fields (used when action is 'plan' | 'settle' | 'assist')
      conflictContext?: string;
      parties?: string[];
      issues?: string[];
      situationId?: string;
    };

    const { situation, action = 'design' } = body;

    // ── Demo mode ──────────────────────────────────────────────────────────────
    if (isServerDemoMode()) {
      if (action === 'plan') return NextResponse.json(DEMO_PLAN);
      if (action === 'settle') return NextResponse.json(DEMO_SETTLEMENT);
      if (action === 'assist') {
        return new Response(DEMO_ASSIST_TEXT, {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Praxis-Demo': 'true' },
        });
      }
      return NextResponse.json(DEMO_RESPONSE_DESIGN);
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

    // ── action: 'plan' | 'settle' | 'assist' (absorbed from /api/ai/mediation) ─
    if (action === 'plan' || action === 'settle' || action === 'assist') {
      const { conflictContext, parties, issues, situationId } = body;

      const partiesStr = parties?.join(', ') || 'the conflict parties';
      const issuesStr = issues?.join(', ') || 'core conflict issues';
      const graphCtx = situationId
        ? await buildGraphContext(ctx.uid, situationId, 'mediation_design').catch(() => '')
        : '';

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
          system: `You are a senior mediation strategist with extensive experience in conflict resolution. Design mediation plans that are practically implementable, grounded in established methodology, and sensitive to the political constraints of all parties.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
        });

        if (situationId && ctx.uid) {
          await writeToolDataServer(ctx.uid, situationId, 'mediation_design', result.output as Record<string, unknown>).catch(
            (err) => console.error('[mediation-design/plan] persist failed:', err),
          );
          await saveToolOutput({
            uid: ctx.uid,
            situationId,
            toolId: 'mediation_design',
            profileVersion: provenance.profileVersion,
            output: result.output as Record<string, unknown>,
          }).catch((err) => console.warn('[mediation_design/plan] saveToolOutput failed:', err));
        }
        return NextResponse.json(result.output);
      }

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
          system: `You are a senior legal advisor specializing in peace agreement architecture. Draft settlement terms that are legally precise, politically feasible, and practically implementable. Use standard international peace agreement language and conventions.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
        });

        if (situationId && ctx.uid) {
          await writeToolDataServer(ctx.uid, situationId, 'mediation_settlement', result.output as Record<string, unknown>).catch(
            (err) => console.error('[mediation-design/settle] persist failed:', err),
          );
          await saveToolOutput({
            uid: ctx.uid,
            situationId,
            toolId: 'mediation_design',
            profileVersion: provenance.profileVersion,
            output: result.output as Record<string, unknown>,
            metadata: { action: 'settle' },
          }).catch((err) => console.warn('[mediation_design/settle] saveToolOutput failed:', err));
        }
        return NextResponse.json(result.output);
      }

      // action === 'assist' — streaming
      const streamResult = streamText({
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
        system: `You are a real-time mediation intelligence assistant embedded in a conflict mediation session. Provide concise, actionable tactical advice that the mediator can use immediately. Be specific to the parties and issues at hand.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
        onFinish: async ({ text }) => {
          if (situationId && ctx.uid) {
            await saveToolOutput({
              uid: ctx.uid,
              situationId,
              toolId: 'mediation_design',
              profileVersion: provenance.profileVersion,
              output: { action: 'assist', parties: partiesStr, issues: issuesStr, analysis: text },
              metadata: { action: 'assist' },
            }).catch((err) => console.warn('[mediation_design/assist] saveToolOutput failed:', err));
          }
        },
      });

      return streamResult.toTextStreamResponse();
    }

    // ── action: 'design' (default) — original mediation-design behaviour ────────
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = situation?.id ?? '';

    const graphCtx = situationId
      ? await buildGraphContext(ctx.uid, situationId, 'mediation_design')
      : '';

    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as Situation).name, region: (situation as Situation).region, actors: (situation as Situation).actors },
          'mediation-design',
          ctx.uid
        )
      : '';

    const result = await generateText({
      model: getThinkingModel(),
      output: Output.object({ schema: MediationDesignSchema }),
      prompt: `${webCtx ? `${webCtx}\n\n` : ''}${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}Design a comprehensive mediation process architecture for this conflict situation.

## DESIGN METHODOLOGY

Apply the UN Guidance for Effective Mediation (A/66/811), Lax/Sebenius deal architecture principles, and the Berghof Foundation process design framework.

**Step 1: Process Format Selection**
Choose the appropriate format based on trust levels and political context:
- **Direct talks**: High trust, both parties willing to negotiate face-to-face
- **Proximity talks**: Low trust, parties in separate rooms, mediator shuttles between them
- **Shuttle diplomacy**: Very low trust or political sensitivity, mediator travels between locations
- **Multilateral**: Multiple parties, plenary format with commission structures
- **Hybrid**: Combines formats for different phases or issue clusters

**Step 2: Phase Sequencing (Lax/Sebenius)**
Design 3-5 sequential phases applying deal architecture principles:
- Start with issues where Zone of Possible Agreement (ZOPA) is strongest (economic, technical)
- Build momentum before tackling core political/security issues
- Pre-negotiation phase essential when parties have not yet committed to negotiate
- Implementation phase must be designed from the start, not as an afterthought
- Each phase must have clear handoff criteria to prevent backsliding

**Step 3: Confidence-Building Measures**
Design CBMs that:
- Are reversible (so parties can take them without high political cost)
- Have third-party verification to build credibility
- Are sequenced to create positive feedback loops before each phase
- Address the specific trust deficits identified in this situation

**Step 4: Process Architecture Elements**
- Ground rules: What governs parties' conduct during the process?
- Spoiler management: Who could derail this process and how?
- Implementation monitoring: What architecture will enforce the agreement?
- Process risks: What macro-level factors could collapse the entire process?

**Venue Selection Criteria**
- Neutral (not aligned with either party)
- Has appropriate facilities and security
- Sends correct political signal
- Host country has diplomatic relationship with all parties

Be specific to the actual parties, issues, and context. Design a process that has a realistic chance of succeeding given the specific constraints of this situation.`,
      system: `You are a senior UN mediation advisor with extensive experience designing peace processes across multiple conflict contexts. You are trained in the UN Guidance for Effective Mediation, Berghof Foundation process design methodology, and Lax/Sebenius deal architecture. You have designed processes for intrastate conflicts involving non-state armed groups, international peace operations, and regional guarantor frameworks. Produce precise, operationally grounded process designs that a working mediator can actually use.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
    });

    if (situationId) {
      await writeToolDataServer(ctx.uid, situationId, 'mediation_design', result.output as Record<string, unknown>);
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'mediation_design',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[mediation_design] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'mediation-design');
  }
});
