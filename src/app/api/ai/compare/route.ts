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

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const CompareSchema = z.object({
  currentSituation: z.object({
    name: z.string().describe('Name of the current situation being compared'),
    keyCharacteristics: z.array(z.string()).describe('Core structural features used as MSSD control variables'),
    glaslStage: z.number().min(0).max(9).describe('Glasl escalation stage (0-9)'),
    ripeness: z.object({
      description: z.string().describe('Narrative description of current ripeness state (Zartman)'),
      score: z.number().min(0).max(10).describe('Ripeness score: 0=not ripe, 10=fully ripe'),
      indicators: z.array(z.string()).describe('Specific ripeness indicators present or absent'),
    }),
  }),

  comparisonCases: z.array(z.object({
    caseName: z.string().describe('Name/label of the historical conflict case (e.g., "Aceh Peace Process 2005")'),
    location: z.string().describe('Country or region where the case occurred'),
    period: z.string().describe('Time period (e.g., "1999–2005")'),
    similarity: z.number().min(0).max(1).describe('MSSD similarity score to current situation (0=no similarity, 1=identical)'),
    mssdRationale: z.string().describe('Why this case was selected under Most Similar Systems Design — which control variables match and what variable is being isolated'),
    keyActors: z.array(z.string()).describe('Main parties to the conflict in this case'),
    glaslStageAtPeak: z.number().min(0).max(9).describe('Glasl escalation stage at conflict peak'),
    resolution: z.enum(['resolved', 'frozen', 'ongoing', 'relapsed']).describe('Ultimate outcome of this case'),
    resolutionMechanism: z.string().describe('How and by whom the conflict was resolved or contained (e.g., "UN-mediated power-sharing agreement")'),
    durationMonths: z.number().describe('Total duration of the conflict in months from onset to resolution/freeze'),
    dimensionComparison: z.object({
      actors: z.string().describe('How actor dynamics and configurations compare to the current situation'),
      triggers: z.string().describe('How conflict triggers and root causes compare'),
      externalSupport: z.string().describe('Comparison of external patron/spoiler dynamics'),
      economicFactors: z.string().describe('Comparison of economic drivers and stakes'),
      trajectory: z.string().describe('How escalation/de-escalation trajectory compares'),
    }),
    keyLessons: z.array(z.string()).describe('Most important analytical lessons from this case'),
    transferableLessons: z.array(z.string()).describe('Lessons explicitly applicable to the current situation — specific, actionable'),
    contraindications: z.array(z.string()).describe('What NOT to replicate from this case — actions or approaches that failed or caused harm in this case that risk being repeated'),
    ripenessAtResolution: z.string().describe('Zartman ripeness state at the moment this case resolved or froze — what MHS/MLC conditions were present'),
  })).min(3).max(5),

  crossCaseSynthesis: z.object({
    commonSuccessFactors: z.array(z.string()).describe('Factors present across resolved cases that drove success'),
    commonFailurePatterns: z.array(z.string()).describe('Recurring patterns that led to relapse, failure, or freezing'),
    optimalEntryPoint: z.string().describe('When and how to intervene based on cross-case evidence — ripeness window, actor configuration, sequencing'),
    estimatedResolutionTimeline: z.string().describe('Evidence-based timeline estimate for resolution given current conditions, drawing on case durations'),
  }),
});

// ---------------------------------------------------------------------------
// Demo response — Nordalia fictional conflict vs. 3 real/plausible cases
// ---------------------------------------------------------------------------

const DEMO_RESPONSE = {
  currentSituation: {
    name: 'Nordalia — Eastern Provinces Conflict',
    keyCharacteristics: [
      'Sub-state ethnic-regional armed group (DRM) challenging central government authority',
      'Resource wealth (Belara Mining Complex) as primary driver',
      'Neighbouring state (Karovia) providing material and political support to armed group',
      'Active ceasefire in place with documented violations',
      'Moderate international engagement but no formal mediation process',
      'Government retains capital and key infrastructure; armed group holds eastern territory',
      'Glasl stage 5: face-saving impossible without third-party mediation',
    ],
    glaslStage: 5,
    ripeness: {
      description: 'Situation is approaching a Mutually Hurting Stalemate (MHS) but has not yet reached the threshold required for genuine negotiations. Both sides retain hope of military advantage. The ceasefire limits immediate pain but also reduces urgency. A Mutually Enticing Opportunity (MEO) around the mining revenue framework could serve as an alternative pathway to ripeness.',
      score: 4.5,
      indicators: [
        'PRESENT — Stalemate: Neither side can achieve military victory at acceptable cost',
        'PRESENT — Escalation fatigue: DRM leadership signals openness to "political dialogue" in back-channel communications',
        'PRESENT — Economic pain: Currency depreciation (36.4%) hurting GoN urban base',
        'ABSENT — Catastrophic event: No MHS trigger event (mass casualty incident, capital threat) yet',
        'ABSENT — Leadership readiness: No credible negotiating mandate from either side leadership',
        'PARTIAL — External pressure: Karovian interest in stability creates potential leverage, not yet activated',
      ],
    },
  },

  comparisonCases: [
    {
      caseName: 'Aceh Peace Process (Helsinki MOU)',
      location: 'Indonesia (Aceh Province)',
      period: '1976–2005',
      similarity: 0.78,
      mssdRationale: 'Selected under MSSD because both cases share: sub-state ethnic-regional insurgency, resource wealth as driver (Aceh: natural gas; Nordalia: mining), state with democratic deficit but functional central government, and external patron dynamics. The isolated variable is the presence of a natural disaster catalyst (2004 tsunami) — this comparison tests whether Nordalia requires an exogenous shock to create ripeness or whether economic deterioration can substitute.',
      keyActors: ['Government of Indonesia (GoI)', 'Free Aceh Movement (GAM)', 'Crisis Management Initiative (CMI)', 'European Union (monitors)'],
      glaslStageAtPeak: 7,
      resolution: 'resolved',
      resolutionMechanism: 'Finnish CMI-facilitated negotiations in Helsinki following 2004 tsunami (exogenous shock creating MHS). Power-sharing agreement: GAM disarmament, amnesty, local elections, 70% resource revenue retention for Aceh.',
      durationMonths: 342,
      dimensionComparison: {
        actors: 'GAM, like DRM, was an ethnically-based armed movement with diaspora financing (GAM: Sweden; DRM: Westmark). Both face central governments with authoritarian tendencies but formal democratic structures. Key difference: GAM had unified command structure; DRM shows signs of internal factional fragmentation.',
        triggers: 'Both conflicts rooted in identity-resource grievance nexus: Aceh resented Java extracting gas revenues; DRM resents Noralian capital extracting Belara mining revenues. Trigger events differ: GAM emerged post-1976 oil boom; DRM emerged post-2019 electoral dispute.',
        externalSupport: 'Aceh: GAM supported by diaspora in Sweden and Malaysia, no state patron. Nordalia: DRM has active state patron (Karovia) which is a significant complication — Karovia involvement creates spoiler dynamics absent in Aceh.',
        economicFactors: 'In both cases, the resource wealth created both the grievance AND a potential MEO. The 70% revenue retention formula in Helsinki is the most transferable structural element to Nordalia\'s Belara situation.',
        trajectory: 'Aceh escalated sharply to Glasl 7 (limited war) before the tsunami created a sudden MHS. Nordalia is at Glasl 5 with gradual escalation — more time to intervene but also less urgency driving parties to the table.',
      },
      keyLessons: [
        'Exogenous shocks (tsunami, economic collapse) can rapidly create ripeness where military stalemate alone cannot',
        'Diaspora engagement is critical — GAM leadership in exile drove the negotiation decision',
        'Revenue retention formula (70% to Aceh) was the decisive breakthrough enabling disarmament',
        'Amnesty provision for combatants was non-negotiable and must be addressed early',
        'CMI\'s back-channel role succeeded because it had no prior stake and offered genuine neutrality',
      ],
      transferableLessons: [
        'Structure a Belara Mining Revenue Retention Framework (targeting 40-60% to Eastern Provincial Authority) as the MEO to substitute for a MHS trigger event',
        'Engage DRM diaspora in Westmark through Track 1.5 dialogue — they likely hold more negotiating flexibility than the field commanders',
        'Identify a genuinely neutral mediator with no prior Nordalia investment — CMI model suggests small European states or Nordic institutions',
        'Prepare amnesty framework in parallel with revenue talks — do not sequence it as a "reward" for disarmament',
        'Back-channel communications should precede any public negotiation announcement to avoid face-saving constraints',
      ],
      contraindications: [
        'Do NOT wait for a catastrophic triggering event before initiating mediation — the tsunami analogy could lead to passive "ripeness-waiting" that allows Glasl escalation to stage 7',
        'Do NOT attempt internationally monitored disarmament before political settlement is secured in writing — Aceh nearly collapsed when GoI tried to sequence disarmament first in 2002 COHA',
        'Do NOT underestimate the role of Karovian state support — Aceh had no comparable state patron, so the Karovian variable requires a separate diplomatic track that the Aceh case cannot inform',
      ],
      ripenessAtResolution: 'Classic dual-MHS/MEO configuration at Helsinki: tsunami created immediate mutual hurt (both sides unable to project force into disaster relief without cooperation); MEO was the Helsinki framework offering amnesty, revenue, and political dignity. MHS was exogenously triggered, not organically developed through military stalemate.',
    },
    {
      caseName: 'Mindanao Peace Process (Bangsamoro)',
      location: 'Philippines (Mindanao)',
      period: '1969–2014',
      similarity: 0.71,
      mssdRationale: 'Selected because both cases involve: a sub-state Muslim/ethnic minority armed movement with territorial control, a neighbouring state with ethnic-linguistic ties to the armed group (Malaysia:MILF :: Karovia:DRM), active ceasefire with violations, and a resource-revenue grievance (land and agricultural wealth in Mindanao; mining in Nordalia). The isolated variable is the role of a state-level patron that transitions from spoiler to mediator — directly relevant to the Karovian dynamic.',
      keyActors: ['Government of the Philippines (GPH)', 'Moro Islamic Liberation Front (MILF)', 'Malaysia (facilitator)', 'International Contact Group'],
      glaslStageAtPeak: 8,
      resolution: 'resolved',
      resolutionMechanism: 'Malaysia-facilitated Comprehensive Agreement on the Bangsamoro (CAB) 2014, creating autonomous Bangsamoro region. Process ran for 17 years of formal talks, with multiple collapses and restarts.',
      durationMonths: 540,
      dimensionComparison: {
        actors: 'MILF, like DRM, had both political and military wings with unclear command-and-control over field units. Both governments used military operations to strengthen bargaining position before talks. Key similarity: Malaysia\'s role as MILF ethnic kin and patron who then became mediator is the closest historical parallel to Karovia\'s current position vis-à-vis DRM.',
        triggers: 'Mindanao: land dispossession + religious-cultural marginalization. Nordalia: territorial-resource grievance + cultural autonomy demands. Both have legitimate historical grievances entrenched across generations.',
        externalSupport: 'Most directly comparable case: Malaysia provided sanctuary, training, and political support to MILF before assuming mediator role in 2001. This transition — from patron to honest broker — is the key variable for the Karovian track.',
        economicFactors: 'Mindanao: agricultural land and natural resource wealth. Nordalia: Belara Mining Complex. In both cases, economic stakes were existential for the armed movement\'s popular legitimacy.',
        trajectory: 'Mindanao escalated higher (Glasl 8) and took far longer. Multiple false starts (1996 MNLF agreement that excluded MILF; 2008 MOA-AD struck down). Nordalia must avoid a "MNLF trap" of reaching agreement with the wrong interlocutor.',
      },
      keyLessons: [
        'A neighbouring state patron (Malaysia) can be converted from spoiler to mediator — this conversion was decisive',
        'Inclusive process is critical: excluding MILF from the 1996 MNLF deal extended the conflict by 18 years',
        'Ceasefire monitoring bodies with international participation reduced violations and built trust incrementally',
        'Constitutional reform was the ultimate requirement — no sub-national agreement survived without it',
        'International Contact Group (ICGs) with civil society representation increased process legitimacy and resilience',
      ],
      transferableLessons: [
        'Invest immediately in converting Karovia from DRM patron to co-guarantor of a peace process — offer Karovia a formal mediation or observer role with security guarantees',
        'Ensure any interim agreement explicitly covers DRM as the primary interlocutor — do not allow a situation where GoN negotiates with a smaller DRM faction while the main movement remains outside',
        'Establish a Joint Ceasefire Monitoring Committee with international observers to reduce violation incidents and create a trust-building feedback loop',
        'Map the Nordalia constitutional constraints on autonomy early — do not allow talks to progress to an agreement that the Constitutional Court will strike down (MOA-AD failure pattern)',
      ],
      contraindications: [
        'Do NOT replicate the 1996 MNLF approach of reaching a quick agreement with a moderate faction to marginalize the harder line — this backfired catastrophically and extended the conflict by nearly two decades',
        'Do NOT allow talks to proceed without a clear constitutional pathway — the 2008 MOA-AD collapse after a Supreme Court ruling destroyed years of negotiations',
        'Do NOT underestimate the timeline — the Bangsamoro process took 17 years of formal talks; stakeholders and funders must plan for sustained 5-10 year engagement rather than a quick resolution',
      ],
      ripenessAtResolution: 'Long-delayed ripeness achieved through cumulative MHS: repeated military offensives proved indecisive for both sides over decades; MEO was the Bangsamoro autonomous region framework which offered political dignity without full independence. Malaysia\'s conversion to mediator was the enabling condition that unlocked the final phase.',
    },
    {
      caseName: 'Kosovo Status Process (Ahtisaari Plan)',
      location: 'Serbia/Kosovo',
      period: '1998–2008',
      similarity: 0.58,
      mssdRationale: 'Selected as a contrast case under MSSD with LOWER similarity to isolate the effect of international legal status as a conflict variable. Kosovo shares: ethnic-regional sub-state conflict, external state patron (Albania/NATO :: Karovia), resource and territorial grievances, active international military presence. The key divergence is the international intervention (NATO) and ultimate outcome (supervised independence) — Nordalia\'s situation lacks NATO-level international engagement, making this case a ceiling rather than a template.',
      keyActors: ['Government of Serbia', 'Kosovo Liberation Army / Kosovo Albanian leadership', 'UNMIK', 'NATO (KFOR)', 'Martti Ahtisaari (UN SRSG)', 'Contact Group (US, EU, Russia)'],
      glaslStageAtPeak: 9,
      resolution: 'resolved',
      resolutionMechanism: 'NATO intervention (1999) followed by 8-year UN administration (UNMIK) and final status negotiations under Ahtisaari. Comprehensive Proposal for Kosovo Status Settlement (2007) led to supervised independence declaration (2008).',
      durationMonths: 120,
      dimensionComparison: {
        actors: 'Both conflicts involve a government with nationalist political constituency making concessions costly; and an armed group with external patron backing. Key difference: Kosovo had a relatively unified Albanian leadership; DRM shows fragmentation. Kosovo also benefited from near-universal international sympathy post-Milosevic atrocities — DRM lacks this degree of international legitimacy.',
        triggers: 'Kosovo: systematic repression under Milosevic\'s revocation of autonomy (1989) + ethnic cleansing. Nordalia: resource-revenue extraction + cultural marginalisation. Kosovo triggers were more acute and visible internationally.',
        externalSupport: 'NATO as security guarantor has no Nordalia equivalent. Karovia is a regional power, not an alliance structure. The Kosovo model only applies if Nordalia generates sufficient international attention to attract multilateral involvement.',
        economicFactors: 'Kosovo: less economically critical than Nordalia (limited natural resources). Nordalia\'s Belara Mining Complex creates stronger economic incentive for negotiated solution AND stronger GoN resistance to territorial concessions.',
        trajectory: 'Kosovo escalated to full war (Glasl 9) before international intervention created resolution conditions. Nordalia is at Glasl 5 — the Kosovo case demonstrates the cost of allowing escalation to continue: a decade of UN administration was required to rebuild governance capacity destroyed by conflict.',
      },
      keyLessons: [
        'International administration (UNMIK) as a transition mechanism is costly, slow, and creates dependency — to be avoided if a negotiated political solution is achievable',
        'Status ambiguity maintained for too long (8 years of UNMIK) entrenched maximalist positions on both sides',
        'The Ahtisaari process succeeded because it had a clear mandate, a deadline, and superpower backing — process design matters as much as substance',
        'Decentralisation packages for minority communities within Kosovo were critical to Serbian acceptance of the framework',
      ],
      transferableLessons: [
        'Design any mediation process with a clear timeline and deadline — open-ended negotiations entrench positions (Kosovo spent 8 years in status ambiguity)',
        'Include a decentralisation package within Nordalia\'s Eastern Provinces as a confidence measure for GoN — it reduces the sovereignty cost of the concessions',
        'Map the "Contact Group" equivalent for Nordalia — identify which external powers (EU, AU, regional body) could serve as co-guarantors to constrain both GoN and Karovia',
      ],
      contraindications: [
        'Do NOT use Kosovo as a template for outcome — supervised independence is not applicable to Nordalia and invoking Kosovo as precedent will harden GoN maximalism',
        'Do NOT allow conflict to escalate to Glasl 7+ hoping for international intervention analogous to NATO — no such intervention mechanism exists for Nordalia and the human cost would be catastrophic',
        'Do NOT establish open-ended international administration as a "interim solution" — UNMIK\'s 8-year legacy demonstrates this approach creates governance dependency rather than building local capacity',
      ],
      ripenessAtResolution: 'Externally-imposed ripeness via NATO military intervention (1999) rather than organic MHS. The 1999 bombing campaign created an artificial MHS by destroying Serbian military capacity and political will. The subsequent resolution was driven by EU membership incentive (MEO for Serbia) rather than genuine conflict transformation. This model is not replicable for Nordalia without a comparable international security architecture.',
    },
  ],

  crossCaseSynthesis: {
    commonSuccessFactors: [
      'Revenue/resource formula as MEO: In all resolved cases, a concrete economic benefit (70% gas revenue in Aceh; agricultural land rights in Mindanao; EU accession prospect in Kosovo) served as the Mutually Enticing Opportunity that supplemented the Mutually Hurting Stalemate',
      'Patron conversion: In Aceh (diaspora) and Mindanao (Malaysia), the external supporter was converted into a process stakeholder — this is the single most actionable lesson for the Karovian track',
      'Clear constitutional pathway: All resolved cases required domestic legal frameworks that pre-validated the settlement — agreements that outran constitutional capacity collapsed (MOA-AD 2008)',
      'Inclusive interlocutor selection: Cases that excluded a significant armed faction (Philippines 1996) experienced renewed conflict; cases with inclusive representation achieved durable settlements',
      'Third-party guarantors: All resolved cases had credible external guarantors (CMI, Malaysia, NATO/EU) who could enforce implementation',
    ],
    commonFailurePatterns: [
      'Premature disarmament sequencing: Requiring disarmament before political settlement is secured consistently collapses processes (Aceh 2002 COHA, multiple Mindanao failures)',
      'Exclusion of armed actors: Reaching agreements over the heads of primary armed movements creates spoilers from excluded parties',
      'Status ambiguity as a coping mechanism: Indefinitely deferring final status questions entrenches maximalist positions on both sides',
      'Single-track mediation without patron engagement: Processes that did not address the external patron track separately (and simultaneously) failed to sustain momentum',
      'Donor fatigue without process milestones: Long processes without clear milestone-based financing collapsed when donor attention shifted',
    ],
    optimalEntryPoint: 'Based on cross-case evidence, the optimal intervention window for Nordalia is NOW — at Glasl 5, before escalation to 6-7 where face-saving becomes structurally impossible without military defeat. The Aceh and Mindanao cases demonstrate that MHS does not need to be fully "ripe" if a compelling MEO exists. Recommended entry sequence: (1) Initiate back-channel Track 1.5 contact with DRM leadership and diaspora simultaneously; (2) Open a parallel diplomatic track with Karovia to convert it from patron to co-guarantor; (3) Float a Belara Mining Revenue Framework as an MEO; (4) Formalise a ceasefire monitoring body with international observers to reduce violations and build trust. Avoid a public mediation announcement until all three tracks show preliminary positive signals.',
    estimatedResolutionTimeline: 'Cross-case evidence: Aceh (29 years total, but 6 months from first Helsinki meeting to MOU); Mindanao (45 years total, 17 years of formal talks); Kosovo (10 years from NATO intervention to independence). For Nordalia at Glasl 5 with moderate international engagement: 18-36 months to a preliminary framework agreement IF the Karovian patron-conversion succeeds and a Belara MEO is structured; 4-8 years to full implementation including disarmament and institutional reform. The critical accelerating variable is whether Karovia can be converted to co-guarantor within the next 6-12 months.',
  },
};

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request: Request, user) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      situation: situationContextSchema.optional(),
      focusAreas: z.string().optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { situation, focusAreas } = validation.data;

    const situationId = (situation as Situation | undefined)?.id ?? '';

    // --- Demo mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // --- Credit check ---
    const creditCheck = await checkAndDeductCredits('ai_compare', 'Comparative analysis');
    if (!creditCheck.allowed) return creditCheck.response;

    // --- Build context ---
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';

    const [graphCtx, webCtx] = await Promise.all([
      situationId
        ? buildGraphContext(user.uid, situationId, 'compare').catch(() => '')
        : Promise.resolve(''),
      situation
        ? buildWebGroundedContext(
            {
              name: (situation as unknown as Situation).name,
              region: (situation as unknown as Situation).region,
              actors: (situation as unknown as Situation).actors,
            },
            'compare',
            user.uid
          ).catch(() => '')
        : Promise.resolve(''),
    ]);

    // --- AI generation ---
    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: CompareSchema }),
      system: `You are a senior UN conflict analyst and comparative peace studies expert trained in Most Similar Systems Design (MSSD) methodology. Your role is to identify the most instructive historical conflict cases that illuminate pathways to resolution for the current situation.

METHODOLOGY — MSSD:
Select comparison cases that MAXIMISE similarity on control variables (conflict type, actor configuration, external dynamics, intensity) while ISOLATING the variable of interest (resolution mechanism, intervention type, mediator role). This allows causal inference rather than mere analogy.

CASE SELECTION CRITERIA (strictly apply all):
1. Structural similarity: Same general conflict type (sub-state, inter-state, resource conflict, etc.)
2. Actor homology: Similar actor configuration (state vs. armed group, patron dynamics, diaspora)
3. Intensity comparability: Glasl stage within ±2 of current situation at time of comparison
4. Temporal relevance: Prefer post-Cold War cases (post-1990) unless pre-1990 case is uniquely instructive
5. Outcome diversity: Include at least one resolved, one frozen/relapsed case to bound the range of plausible outcomes

ZARTMAN RIPENESS FRAMEWORK:
- Mutually Hurting Stalemate (MHS): Both parties perceive they cannot win AND that continuing to fight is too costly
- Mutually Enticing Opportunity (MEO): A specific, credible pathway to a better outcome exists
- Assess BOTH dimensions for current situation AND at each case's resolution moment

TRANSFERABILITY STANDARD:
Lessons are only "transferable" if the structural conditions that enabled them are present or replicable in the current situation. Flag explicitly when a lesson depends on conditions (e.g., NATO military capacity) that do not exist in the current context.

Use calibrated confidence language (ICD 203 standards). Reference specific agreements, dates, and mechanisms by name.`,
      prompt: `${webCtx ? `CURRENT INTELLIGENCE (web-grounded):\n${webCtx}\n\n` : ''}${graphCtx ? `CONFLICT GRAPH CONTEXT:\n${graphCtx}\n\n` : ''}${sitContext ? `SITUATION PROFILE:\n${sitContext}\n\n` : ''}FOCUS AREAS: ${focusAreas || 'MSSD case selection, Zartman ripeness comparison, transferable lessons, contraindications'}

## TASK: MSSD COMPARATIVE ANALYSIS

Step 1 — CHARACTERISE THE CURRENT SITUATION
Document key characteristics that will serve as MSSD control variables: conflict type, actor configuration, resource dynamics, external patron role, ceasefire status, international engagement level, Glasl stage, and Zartman ripeness indicators.

Step 2 — SELECT 3-5 COMPARISON CASES (AI-autonomous selection)
Apply MSSD criteria strictly. For each case, explain the selection rationale: which variables match (controls), which variable is being isolated (the dependent variable), and what makes this case analytically instructive rather than merely similar.

Step 3 — STRUCTURED DIMENSION COMPARISON
For each case, compare across: actors, triggers, external support, economic factors, and trajectory.

Step 4 — TRANSFERABLE LESSONS AND CONTRAINDICATIONS
For EACH case, produce:
- keyLessons: general lessons from the case
- transferableLessons: lessons explicitly applicable to the current situation (explain WHY transferable given structural conditions)
- contraindications: what NOT to replicate — approaches that failed, caused harm, or depend on conditions absent in the current situation

Step 5 — RIPENESS AT RESOLUTION
For each case, document the exact Zartman ripeness configuration (MHS/MEO conditions) at the moment of resolution or freeze. Compare to current situation's ripeness profile.

Step 6 — CROSS-CASE SYNTHESIS
Synthesise across all cases: common success factors, failure patterns, optimal entry point for intervention, evidence-based timeline estimate.`,
    });

    // --- Persist ---
    if (situationId) {
      await writeToolDataServer(user.uid, situationId, 'compare', result.output as Record<string, unknown>);
    }

    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'compare');
  }
});
