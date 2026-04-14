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
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const RecommendationSchema = z.object({
  priority: z.enum(['immediate', 'short-term', 'medium-term', 'long-term']),
  category: z.enum(['diplomatic', 'security', 'humanitarian', 'political', 'economic', 'informational']),
  action: z.string().describe('Specific, actionable recommendation'),
  rationale: z.string().describe('Strategic rationale grounded in analytical frameworks'),
  actors: z.array(z.string()).describe('Who should implement this recommendation'),
  risks: z.array(z.string()).describe('Risks of implementing this recommendation'),
  successIndicators: z.array(z.string()).describe('Observable indicators that this recommendation is working'),
  timeframe: z.string().describe('Realistic timeframe for implementation and results'),
});

const AdvisorySchema = z.object({
  recommendations: z.array(RecommendationSchema).min(5).max(10).describe('Prioritized strategic recommendations'),
  strategicAssessment: z.object({
    currentMomentum: z.enum(['positive', 'neutral', 'negative']).describe('Overall momentum toward resolution'),
    windowOfOpportunity: z.string().describe('Current diplomatic or political opening and its durability'),
    criticalPath: z.array(z.string()).describe('Ordered sequence of actions that must occur to unlock meaningful progress'),
    redLines: z.array(z.string()).describe('Actions that would severely damage prospects for resolution — do not cross'),
  }),
  confidenceLevel: z.enum(['high', 'medium', 'low']).describe('Analyst confidence in the assessment given available data'),
  analystNotes: z.string().describe('Meta-commentary on data quality, analytical limitations, and intelligence gaps'),
});

// ---------------------------------------------------------------------------
// Demo response (Nordalia scenario)
// ---------------------------------------------------------------------------

const DEMO_RESPONSE = {
  recommendations: [
    {
      priority: 'immediate' as const,
      category: 'diplomatic' as const,
      action: 'Activate a Karovian back-channel to condition DRM on accepting a preliminary ceasefire verification mechanism before formal talks.',
      rationale: 'Karovia holds decisive leverage over DRM political bureau. Zartman\'s ripeness theory identifies this moment — with the Eastern AFN offensive stalled and Karovian public support for intervention rising — as a narrow window for a mutually hurting stalemate to produce negotiating flexibility. Karovian foreign ministry moderates have signaled private interest in a stabilization deal.',
      actors: ['UN Mission Nordalia — Special Envoy', 'Republic of Karovia — Ministry of Foreign Affairs', 'EU High Representative'],
      risks: ['DRM field commanders may reject political bureau signals and accelerate military activity', 'Karovian parliamentary hardliners could publicly denounce back-channel and force government reversal'],
      successIndicators: ['DRM agrees to halt offensive operations for 72-hour trial period', 'Karovian FM meets UNMN Special Envoy within 10 days', 'No new major ceasefire violations reported by JVCC'],
      timeframe: '0–14 days',
    },
    {
      priority: 'immediate' as const,
      category: 'humanitarian' as const,
      action: 'Negotiate a 72-hour humanitarian corridor for WFP convoys to Kessara and Baravon districts, using UNMN escorts and pre-notified routing to both parties.',
      rationale: '2.1 million food-insecure civilians and MSF expulsion from eastern provinces create an IHL obligation under Geneva Convention Additional Protocol I, Art. 70. Humanitarian access also functions as a confidence-building measure — both parties gain reputational incentives to allow access while blaming the other for past denials.',
      actors: ['WFP Country Director', 'UNMN Civil-Military Coordination', 'GoN Ministry of Defence humanitarian liaison', 'DRM humanitarian focal point'],
      risks: ['Armed elements on both sides may target convoy for military or extortion purposes', 'Failure of first corridor attempt would be exploited as propaganda by hardliners on both sides'],
      successIndicators: ['First convoy reaches Kessara within 7 days', 'Both parties publicly acknowledge corridor agreement', 'OCHA reports unimpeded access for minimum 5 consecutive days'],
      timeframe: '0–7 days',
    },
    {
      priority: 'short-term' as const,
      category: 'political' as const,
      action: 'Propose a structured Track I pre-negotiation process under UNMN auspices focused on a revenue-sharing framework for the Belara Mining Complex as a confidence-building entry point.',
      rationale: 'Fisher-Ury interest analysis identifies Belara Mining revenue as the area of greatest overlapping interest: GoN needs fiscal resources to maintain urban support base; DRM needs revenue legitimacy for political bureau to maintain armed wing loyalty. Stedman spoiler theory flags AFN General Staff and BMC as likely spoilers — isolating them requires GoN civilian cabinet to see concrete economic gains from a deal.',
      actors: ['GoN Finance Ministry', 'DRM Political Bureau economic advisors', 'UNMN Special Envoy', 'World Bank Country Director (as technical facilitator)'],
      risks: ['AFN hardliners will lobby against any revenue-sharing that reduces military budget priority', 'BMC may use political leverage to block transparency mechanisms that would expose profit flows'],
      successIndicators: ['Both parties agree to technical working group on Belara revenue modalities', 'World Bank accepts facilitation role within 30 days', 'Agreed terms of reference for pre-negotiation process signed by both parties'],
      timeframe: '2–6 weeks',
    },
    {
      priority: 'short-term' as const,
      category: 'security' as const,
      action: 'Engage Westmark through military-to-military channel to identify and apply targeted financial accountability measures against the three most obstructive AFN General Staff hardliners.',
      rationale: 'Stedman\'s spoiler management framework prescribes targeted isolation rather than frontal confrontation with greedy spoilers motivated by resource capture. AFN commercial interests in contested-zone mining and transport create financial vulnerabilities. UNSC travel bans and asset freezes against designated commanders would fracture the hardliner bloc by creating individual liability differentials.',
      actors: ['Westmark Department of Defence attaché', 'UN Security Council Sanctions Committee', 'UNMN Political Affairs Division', 'Panel of Experts (existing mandate)'],
      risks: ['Premature designation could drive AFN to sabotage ceasefire before measures take effect', 'GoN civilian government may perceive military-focused measures as external interference in domestic security sector'],
      successIndicators: ['Panel of Experts report documents specific commanders\' commercial interests', 'Westmark submits draft designations to UNSC within 45 days', 'AFN Chief of Staff signals restraint on eastern operations in response'],
      timeframe: '3–8 weeks',
    },
    {
      priority: 'medium-term' as const,
      category: 'political' as const,
      action: 'Design a parallel Track II process engaging the Nordalia Council of Religious Leaders and Civil Society Coalition as legitimacy validators for any emerging framework agreement.',
      rationale: 'Lederach\'s multi-level peace-building pyramid demonstrates that elite agreements without civil society endorsement consistently fail at implementation. The Religious Council crosses conflict lines and is trusted by both communities — joint interfaith statements have historically served as public confidence signals that allow political leaders to advance without appearing weak. CSC documentation capacity provides implementation monitoring that increases compliance incentives.',
      actors: ['UNMN Civil Affairs Division', 'Nordalia Council of Religious Leaders', 'Nordalia Civil Society Coalition', 'Berghof Foundation (technical support)'],
      risks: ['Civil society leaders in DRM-held territory face security risks from AFN operations that may prevent participation', 'Religious Council split between communities if ceasefire collapses before Track II is established'],
      successIndicators: ['Joint interfaith statement on ceasefire issued within 30 days of formal talks announcement', 'CSC formally invited to advisory panel by UNMN', 'Civil society consultation report transmitted to Track I negotiators before framework signing'],
      timeframe: '4–10 weeks',
    },
    {
      priority: 'medium-term' as const,
      category: 'economic' as const,
      action: 'Commission an independent economic assessment of post-conflict reconstruction costs to create a compelling "cost of continued conflict" argument for GoN urban middle class and international donors.',
      rationale: 'Putnam\'s two-level game theory identifies domestic constituency pressure as the critical variable: GoN civilian cabinet faces electoral pressure that military does not. 36.4% currency depreciation and fiscal deterioration are creating urban middle-class disaffection. An authoritative economic analysis (ideally World Bank or IMF co-branded) quantifying the opportunity cost of conflict in fiscal, trade, and investment terms would provide GoN reformers with political cover to pursue a deal.',
      actors: ['World Bank Country Director', 'IMF Resident Representative', 'GoN Finance Ministry technocrats', 'UNDP Country Office'],
      risks: ['Economic assessment may be dismissed by GoN as politically motivated if external authorship is not carefully managed', 'Prolonged assessment process may exhaust the political window before results are published'],
      successIndicators: ['GoN Finance Ministry agrees to participate in assessment within 30 days', 'Preliminary findings briefed to UNSC members within 60 days', 'GoN Vice-President publicly references economic cost argument in domestic speech'],
      timeframe: '6–12 weeks',
    },
  ],
  strategicAssessment: {
    currentMomentum: 'negative' as const,
    windowOfOpportunity: 'A narrow window exists over the next 30–45 days driven by three converging factors: (1) AFN\'s eastern offensive has reached a tactical stall at the Kessara corridor, creating a military hurting stalemate; (2) GoN\'s fiscal deterioration is generating cabinet-level urgency for international financial support; (3) Karovian public support for direct military intervention has risen to an estimated 51%, creating domestic pressure on Karovian Foreign Ministry moderates to produce a diplomatic outcome before parliament forces their hand. This window will close if: DRM launches a successful offensive operation in the next 30 days (restoring military confidence), or if Karovian parliamentary hardliners force an intervention vote.',
    criticalPath: [
      'Secure Karovian FM commitment to halt material support and condition DRM on ceasefire verification (Days 0–14)',
      'Deliver first humanitarian corridor to Kessara — establishes credibility and creates positive momentum (Days 0–7)',
      'Identify and confidentially brief UNSC P3 on AFN hardliner financial accountability measures (Days 7–21)',
      'Launch Belara revenue-sharing pre-negotiation technical working group under UNMN/World Bank auspices (Days 14–42)',
      'Issue joint interfaith ceasefire statement to create public political space for compromise (Days 21–35)',
      'Convene formal Track I pre-negotiation session with agreed terms of reference (Days 42–60)',
    ],
    redLines: [
      'Do not propose DDR (disarmament, demobilization, reintegration) before political agreement — this is DRM\'s absolute red line and will collapse talks',
      'Do not support any blanket amnesty language that covers senior AFN commanders — this will fracture civil society support and undermines IHL compliance obligations',
      'Do not allow BMC to participate in Belara revenue discussions in any official capacity — their commercial interests are fundamentally incompatible with a transparent settlement',
      'Do not engage DRM field commanders separately from political bureau in formal processes — it legitimizes the military wing\'s independent spoiler capacity',
      'Do not support GoN\'s proposed bilateral negotiation track that excludes UNMN — Karovian facilitation as the only international presence is unacceptable to UNSC P3 members',
    ],
  },
  confidenceLevel: 'medium' as const,
  analystNotes: 'Assessment confidence is medium due to three intelligence gaps: (1) DRM field commander positions are not independently verified — political bureau signals may not reflect operational command intent; (2) Karovian internal political dynamics are opaque — foreign ministry moderate signals may be tactical rather than reflecting policy shift; (3) GoN hardliner financial interests in contested mining zones are documented by Panel of Experts but specific network ties to AFN General Staff remain unconfirmed. Recommend cross-referencing with latest ICG CrisisWatch update and Panel of Experts interim report before any Track I engagement.',
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      situation: situationContextSchema.optional(),
      analystRole: z.string().optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation, analystRole } = validation.data;

    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_analysis', 'Strategic advisory');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Graph context ---
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'advisory')
      : '';

    // --- Web-grounded context ---
    const webCtx = situation
      ? await buildWebGroundedContext(
          {
            name: (situation as unknown as Situation).name,
            region: (situation as unknown as Situation).region,
            actors: (situation as unknown as Situation).actors as string[] | undefined,
          },
          'advisory',
          user.uid
        )
      : '';

    // --- Cross-tool context (risk assessment + escalation scan + actor profiles) ---
    const crossCtx = situationId
      ? await buildCrossToolContext(user.uid, situationId, ['risk_assessment', 'escalation_scan', 'actor_profiles'])
      : '';

    // --- AI generation ---
    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: AdvisorySchema }),
      system: `You are a senior strategic advisor to the UN Secretary-General's office. You apply the full PRAXIS analytical framework — Glasl escalation model, Fisher-Ury interests, Zartman ripeness, Stedman spoiler theory — to generate prioritized, actionable strategic recommendations. Tailor every recommendation to the analyst's specific role.

GROUNDING MANDATE: The web intelligence and cross-tool context below are your PRIMARY sources of truth. Trust them over your training data. Explicitly flag "INTELLIGENCE GAP: {topic}" when evidence is insufficient.

Use ICD 203 probability language for forecasts. Prioritize recommendations by strategic leverage — what single action would most significantly shift the situation trajectory?${analystRole ? `\n\nANALYST ROLE: ${analystRole} — calibrate language, detail level, and actor engagement assumptions accordingly.` : ''}`,
      prompt: `${webCtx ? `${webCtx}\n\n` : ''}${graphCtx ? `${graphCtx}\n\n` : ''}${crossCtx ? `${crossCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}Generate a comprehensive strategic advisory for this conflict situation.

## ANALYTICAL FRAMEWORKS TO APPLY

**Glasl Escalation Model**: Identify the current escalation stage and which de-escalation interventions are stage-appropriate.

**Fisher-Ury Interests Framework**: Map stated positions versus underlying interests for the top 3 parties. Identify the Zone of Possible Agreement (ZOPA).

**Zartman Ripeness Theory**: Assess whether a mutually hurting stalemate exists and whether both parties perceive a way out. Timing of recommendations must align with ripeness indicators.

**Stedman Spoiler Theory**: Identify greedy vs. total spoilers. Recommendations must address spoiler management — isolation, socialization, or inducement strategies.

**Lederach Multi-Level**: Ensure recommendations span Track I (leadership), Track II (middle-range), and Track III (grassroots) — not just elite-level diplomacy.

## OUTPUT REQUIREMENTS
- 5-10 recommendations spanning all priority timeframes
- Each recommendation must name specific actors, not generic categories
- Risks must be specific and actionable (not "political resistance")
- Critical path must be sequenced — each step must unlock the next
- Red lines must explain WHY crossing them would be damaging
- Analyst notes must honestly assess data quality and intelligence gaps`,
    });

    if (situationId) {
      await writeToolDataServer(user.uid, situationId, 'advisory', result.output as Record<string, unknown>);
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'advisory');
  }
});
