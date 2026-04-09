import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext, buildCrossToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const ReportSectionSchema = z.object({
  heading: z.string(),
  content: z.string(),
  keyJudgments: z.array(z.string()),
});

const RecommendationSchema = z.object({
  action: z.string(),
  urgency: z.enum(['immediate', 'short-term', 'medium-term']),
  actor: z.string(),
  rationale: z.string().optional(),
});

const SourceCitationSchema = z.object({
  title: z.string(),
  type: z.enum(['web', 'acled', 'gdelt', 'unhcr', 'analyst-input']),
  relevance: z.string(),
  url: z.string().optional(),
});

const ReportSchema = z.object({
  title: z.string(),
  reportType: z.enum(['situation-report', 'briefing-note', 'analytical-paper', 'background-note', 'flash-update']),
  classification: z.string().optional(),
  bluf: z.string(),
  sections: z.array(ReportSectionSchema),
  conclusions: z.string(),
  recommendations: z.array(RecommendationSchema),
  sources: z.array(SourceCitationSchema),
  wordCount: z.number().optional(),
  nextSteps: z.array(z.string()).optional(),
});

// ---------------------------------------------------------------------------
// Demo response
// ---------------------------------------------------------------------------

const DEMO_RESPONSE = {
  title: 'Situation Report: Nordalia–Karovia Crisis — Escalation Dynamics and Diplomatic Options',
  reportType: 'situation-report',
  classification: 'UNCLASSIFIED // FOR OFFICIAL USE ONLY',
  bluf: 'The Nordalia–Karovia crisis has entered a critical phase marked by converging military pressure on the Kessara Corridor, accelerating civilian displacement (340,000 IDPs), and systemic infrastructure collapse. The window for a negotiated de-escalation is narrowing; absent an immediate ceasefire reinforced by third-party monitoring, the probability of a full-scale AFN offensive — with potential Karovian military response — is assessed at 65–70% within 30 days.',
  sections: [
    {
      heading: 'I. Current Situation Assessment',
      content: 'The Nordalia Armed Forces (AFN) and the Democratic Resistance Movement (DRM) remain in active hostilities across the Kessara Corridor, with 14 ceasefire violations logged by UNMONIS in the past 30 days. The AFN has massed an estimated 3,000+ personnel along the northern ridge, signalling preparation for a major ground operation to recapture DRM-held heights. The humanitarian system is under severe stress: the Kessara District Hospital was destroyed in January 2025, the primary water treatment plant is operating at 30% capacity, and WFP humanitarian convoys are achieving only a 40% delivery rate through the Northern Humanitarian Corridor. GDELT tone analysis registers a -2.3 standard deviation shift in regional media sentiment over the past two weeks, consistent with pre-offensive information operations.',
      keyJudgments: [
        'AFN troop concentration on the northern ridge is the single most significant escalation indicator; a ground operation would likely trigger mass civilian flight and potential Karovian military response.',
        'The humanitarian corridor is insufficient to meet assessed needs; a supply disruption of more than 5 days would push the food security situation from IPC Phase 3 to Phase 4 in the eastern zones.',
        'DRM information operations are successfully framing the conflict as ethnic persecution, increasing Karovian domestic pressure for direct intervention.',
      ],
    },
    {
      heading: 'II. Political and Diplomatic Dynamics',
      content: 'The Government of Nordalia (GoN) has rejected UNSC informal consultations, citing DRM ceasefire violations as grounds for the military buildup. Karovia has elevated its alert posture to Level 2 and recalled its Ambassador from Nordalia following the Kessara hospital strike. The UN Special Envoy\'s mediation initiative remains formally active but has not produced a substantive meeting since November 2024. Regional mediators (Westmark Diplomatic Group) are offering to facilitate a humanitarian pause of 72 hours, which could provide a re-engagement window. Economic deterioration in the Nordalia capital (36% currency depreciation, 23% inflation) is creating urban political pressure on the GoN that reduces its negotiating flexibility.',
      keyJudgments: [
        'The Westmark 72-hour humanitarian pause proposal is currently the most viable near-term de-escalation mechanism; it requires DRM agreement and international guarantees to be credible.',
        'GoN domestic political constraints — driven by hardliner cabinet members following the November reshuffle — are the primary obstacle to meaningful ceasefire negotiations.',
        'Karovia\'s Level 2 alert posture is a coercive signal, not an operational trigger; it retains escalation dominance as a bargaining lever.',
      ],
    },
    {
      heading: 'III. Humanitarian Situation',
      content: 'The humanitarian crisis is severe and deteriorating. UNHCR DTM Round 12 documents 340,000 IDPs displaced to Westmark Province and 87,000 cross-border refugees in Karovia. The WASH Cluster reports the Nordalia Eastern Water Authority network at 30% capacity, elevating cholera risk to HIGH. WHO has logged a Grade 3 critical incident at the destroyed Kessara District Hospital, leaving 185,000 people without referral health services. Energy grid damage is causing 14–18 hour daily power outages, compromising generator-dependent facilities. Humanitarian access — 3 of 5 convoy access days granted this week — remains precarious.',
      keyJudgments: [
        'Without hospital restoration or emergency medical evacuation routes, preventable mortality in the eastern zones will accelerate significantly in the next 60 days.',
        'A second displacement wave triggered by an AFN offensive could exceed the absorption capacity of Westmark camps, risking host community tensions and regional destabilisation.',
        'Humanitarian access negotiations are the most achievable near-term diplomatic deliverable and should be pursued in parallel with political track efforts.',
      ],
    },
  ],
  conclusions: 'The Nordalia–Karovia crisis presents a convergent set of escalation drivers — military buildup, humanitarian collapse, political deadlock, and Karovian domestic pressure — that collectively make a near-term major escalation the base case absent credible intervention. The 30-day window before planting season disruption (April–May) represents a time-sensitive opportunity: agricultural damage would add a long-term food security crisis to an already acute situation. The mediation space remains open but requires an immediate humanitarian pause to restore trust conditions sufficient for political dialogue.',
  recommendations: [
    {
      action: 'Convene an emergency UNSC session to authorise a 72-hour humanitarian pause, supported by a temporary UNMONIS monitoring enhancement and a clear trigger mechanism for resumption of hostilities.',
      urgency: 'immediate',
      actor: 'UN Security Council / UN Special Envoy',
      rationale: 'A humanitarian pause creates the minimum conditions for ceasefire reinforcement without requiring GoN or DRM to make political concessions in advance.',
    },
    {
      action: 'Establish an emergency medical evacuation corridor from the Kessara zone to Westmark Province, negotiated through the Westmark Diplomatic Group, with ICRC monitoring.',
      urgency: 'immediate',
      actor: 'ICRC / Westmark Diplomatic Group',
      rationale: 'Addresses the most acute mortality risk following hospital destruction; politically achievable as a humanitarian rather than political measure.',
    },
    {
      action: 'Launch a structured economic stabilisation dialogue with the Government of Nordalia, offering conditional debt relief and currency support in exchange for substantive ceasefire negotiations.',
      urgency: 'short-term',
      actor: 'International Monetary Fund / Donor governments',
      rationale: 'GoN\'s domestic economic pressure is a leverage point; economic incentives could shift the political calculus of moderate cabinet members against further military escalation.',
    },
    {
      action: 'Engage Karovia directly on a bilateral confidence-building framework to prevent military miscalculation at the border — including a hotline, border incident reporting protocol, and military-to-military communication channel.',
      urgency: 'short-term',
      actor: 'UN Special Envoy / Regional mediators',
      rationale: 'Karovia\'s Level 2 alert and domestic pressure create escalation risk independent of the GoN–DRM dynamic; bilateral confidence measures reduce the risk of unintended military confrontation.',
    },
  ],
  sources: [
    {
      title: 'UNHCR DTM Round 12 — Displacement Tracking Report',
      type: 'unhcr',
      relevance: 'Primary source for displacement figures (340,000 IDPs, 87,000 refugees)',
    },
    {
      title: 'UNMONIS Monthly Ceasefire Violations Log',
      type: 'analyst-input',
      relevance: 'Documents 14 ceasefire violations in 30-day period; basis for ceasefire assessment',
    },
    {
      title: 'ACLED Conflict Events Database — Nordalia',
      type: 'acled',
      relevance: 'Armed conflict event data underpinning military activity assessment',
    },
    {
      title: 'WHO Health Cluster Situation Report 8',
      type: 'analyst-input',
      relevance: 'Grade 3 hospital incident documentation; mortality risk assessment',
    },
    {
      title: 'GDELT Tone Analysis — Nordalia-Karovia Crisis (Q1 2025)',
      type: 'gdelt',
      relevance: 'Media sentiment shift (-2.3 SD) indicating pre-offensive information operations',
    },
  ],
  nextSteps: [
    'Monitor AFN forward troop movements via UNMONIS daily reporting',
    'Track Karovian parliamentary debates on intervention authorisation',
    'Assess WFP convoy access rates — trigger review if below 50% for 3 consecutive days',
    'Follow up with Westmark Diplomatic Group on humanitarian pause proposal status',
  ],
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      situation: z.any().optional(),
      reportType: z.enum([
        'situation-report',
        'briefing-note',
        'analytical-paper',
        'background-note',
        'flash-update',
      ]).optional(),
      conflictContext: z.string().optional(),
      tone: z.string().optional(),
      focusSections: z.array(z.string()).optional(),
      wordTarget: z.number().optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation, reportType, conflictContext, tone, focusSections, wordTarget } =
      validation.data;

    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_report', 'Report Studio generation');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Graph context ---
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'risk_assessment')
      : '';

    // --- Cross-tool context (risk assessment + escalation scan) ---
    const crossToolCtx = situationId
      ? await buildCrossToolContext(user.uid, situationId, ['risk_assessment', 'escalation_scan'])
      : '';

    // --- Web-grounded context ---
    const webCtx = situation
      ? await buildWebGroundedContext(
          {
            name: (situation as Situation).name,
            region: (situation as Situation).region,
            actors: (situation as Situation).actors,
          },
          'report-studio',
          user.uid
        )
      : '';

    // --- Report type guidance ---
    const reportTypeLabel = reportType ?? 'situation-report';
    const reportTypeGuides: Record<string, string> = {
      'situation-report': 'Comprehensive, multi-section analytical document. Cover: current situation, political/diplomatic dynamics, humanitarian situation, key judgments, conclusions, recommendations. 800–1,200 words. Suitable for senior leadership and inter-agency distribution.',
      'briefing-note': 'Concise, action-oriented brief for decision-makers. Lead with BLUF. Focus on key judgments, immediate risks, and 2–3 top recommendations. 400–600 words.',
      'analytical-paper': 'In-depth thematic analysis with structured argumentation, frameworks citations (Glasl, INFORM, Fisher-Ury), evidence-based reasoning. 1,200–2,000 words.',
      'background-note': 'Context-setting document covering conflict history, actor profiles, and structural drivers. Avoid policy prescriptions; focus on analytical grounding. 600–900 words.',
      'flash-update': 'Rapid situational update on a specific event or development. 2–4 sections maximum. Lead with BLUF. Clear, punchy, time-stamped. 200–400 words.',
    };
    const typeGuide = reportTypeGuides[reportTypeLabel] ?? reportTypeGuides['situation-report'];

    // --- AI generation ---
    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: ReportSchema }),
      system: `You are a senior analytical writer at the UN Department of Political and Peacebuilding Affairs (DPPA) with 20 years of experience producing high-quality conflict analysis documents for the UN Secretary-General, Security Council members, and senior diplomatic officials.

WRITING STANDARDS:
- Follow UN/DPPA editorial standards strictly
- Use authoritative, precise language — no hedging clichés ("it should be noted", "it is worth mentioning")
- BLUF (Bottom Line Up Front) must be 2–3 sentences that capture the essential situation and key risk/opportunity
- Key judgments must be analytically bold, specific, and falsifiable — not descriptive summaries
- Recommendations must specify: action, primary implementing actor, urgency level
- Source citations must accurately reflect evidence used
- Tone: ${tone ?? 'formal diplomatic'}

GROUNDING MANDATE: Use the web intelligence and cross-tool analysis as your PRIMARY evidence base. Where figures are cited, source them to specific databases (ACLED, GDELT, UNHCR, WHO). Flag intelligence gaps explicitly.`,
      prompt: `${webCtx ? `${webCtx}\n\n` : ''}${crossToolCtx ? `CROSS-TOOL ANALYSIS CONTEXT:\n${crossToolCtx}\n\n` : ''}${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}Generate a complete ${reportTypeLabel.toUpperCase().replace('-', ' ')} for this situation.

REPORT TYPE: ${reportTypeLabel}
GUIDANCE: ${typeGuide}

${conflictContext ? `ADDITIONAL ANALYTICAL CONTEXT:\n${conflictContext}\n` : ''}
${focusSections && focusSections.length > 0 ? `PRIORITY SECTIONS TO EMPHASISE: ${focusSections.join(', ')}\n` : ''}
${wordTarget ? `TARGET LENGTH: approximately ${wordTarget} words\n` : ''}

## REQUIRED DOCUMENT ELEMENTS

### Title
Specific, informative title that conveys both subject and analytical angle. Format: "Situation Report: [Topic] — [Key Finding/Question]"

### BLUF (Bottom Line Up Front)
2–3 sentences. State: (1) the essential current situation, (2) the primary risk or opportunity, (3) the key action required. Write for a reader who will read nothing else.

### Sections
Each section must have:
- **heading**: Clear, substantive section title
- **content**: Analytical prose (not bullet points)
- **keyJudgments**: 2–4 analytically bold, specific judgments (not descriptive). Use ICD 203 probability language where appropriate ("very likely", "roughly even chance", etc.).

### Conclusions
2–3 paragraph synthesis. What does the evidence add up to? What is the trajectory absent intervention? What is the decision space?

### Recommendations
3–5 specific, actionable recommendations. For each:
- **action**: Specific, concrete action (not vague "engage stakeholders")
- **urgency**: immediate (0–30 days) / short-term (30–90 days) / medium-term (90–180 days)
- **actor**: Primary implementing actor (specific institution or role)
- **rationale**: Why this action, why now

### Sources
List evidence bases used. Types: web (open source), acled (conflict events), gdelt (media/events), unhcr (displacement/refugees), analyst-input (reports, assessments)

Write at the level of a DPPA senior analytical product. This document may reach Security Council members.`,
    });

    if (situationId) {
      await writeToolDataServer(
        user.uid,
        situationId,
        'report_studio',
        result.output as Record<string, unknown>
      );
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'report-studio');
  }
});
