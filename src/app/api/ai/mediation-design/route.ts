import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel, getThinkingModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

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

const DEMO_RESPONSE = {
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

export const POST = withAuth(async (request, user) => {
  try {
    const creditCheck = await checkAndDeductCredits('ai_mediation_design', 'Mediation process design');
    if (!creditCheck.allowed) return creditCheck.response!;

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    const body = await request.json();
    const { situation } = body as { situation?: Situation };
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = situation?.id ?? '';

    // --- Graph context ---
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'mediation_design')
      : '';

    // --- Web grounded context ---
    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: (situation as Situation).name, region: (situation as Situation).region, actors: (situation as Situation).actors },
          'mediation-design',
          user.uid
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
      system: 'You are a senior UN mediation advisor with extensive experience designing peace processes across multiple conflict contexts. You are trained in the UN Guidance for Effective Mediation, Berghof Foundation process design methodology, and Lax/Sebenius deal architecture. You have designed processes for intrastate conflicts involving non-state armed groups, international peace operations, and regional guarantor frameworks. Produce precise, operationally grounded process designs that a working mediator can actually use.',
    });

    if (situationId) {
      await writeToolDataServer(user.uid, situationId, 'mediation_design', result.output as Record<string, unknown>);
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'mediation-design');
  }
});
