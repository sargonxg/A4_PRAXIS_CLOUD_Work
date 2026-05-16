import { NextResponse } from 'next/server';
import { Output } from 'ai';
import { z } from 'zod';
import { callProModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext, buildCrossToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { handleRouteError } from '@/lib/api/standard-error';
import { validateAiRequest } from '@/lib/api/validate-request';
import { situationContextSchema } from '@/lib/api/schemas';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Schema — §5.3 structured dossier
// ---------------------------------------------------------------------------

const ActorProfileSchema = z.object({
  name: z.string().describe('Actor name'),
  type: z.string().describe('Actor type (state, armed group, international org, etc.)'),
  positions: z.array(z.string()).describe('Stated positions and public demands'),
  interests: z.array(z.string()).describe('Underlying interests (Fisher-Ury interest-based framing)'),
  redLines: z.array(z.string()).describe('Non-negotiable thresholds — crossing these would cause actor to walk away or escalate'),
  decisionMakers: z.array(z.string()).describe('Key individuals with decision-making authority and their leanings'),
  leverage: z.string().describe('What leverage this actor holds over other parties'),
  vulnerabilities: z.string().describe('Pressure points and constraints on this actor'),
});

const DossierSchema = z.object({
  classificationNote: z.string().describe('Classification header — always "UNCLASSIFIED" for PRAXIS outputs'),
  bluf: z.string().describe('Bottom Line Up Front — 2-3 sentence executive summary of the single most important assessment finding'),
  executiveSummary: z.string().describe('Comprehensive executive summary covering situation status, key dynamics, and immediate priorities (3-5 paragraphs)'),
  actorProfiles: z.array(ActorProfileSchema).describe('In-depth profiles for all significant actors in the conflict'),
  conflictDynamics: z.object({
    glaslStage: z.string().describe('Current Glasl escalation stage with supporting evidence'),
    rootCauses: z.array(z.string()).describe('Structural and proximate root causes of the conflict'),
    escalationDrivers: z.array(z.string()).describe('Factors currently driving escalation'),
    deEscalationOpportunities: z.array(z.string()).describe('Concrete openings for de-escalation'),
    spoilerMap: z.string().describe('Stedman spoiler analysis — who benefits from continued conflict and how'),
  }).describe('Detailed conflict dynamics analysis'),
  internationalContext: z.object({
    regionalDynamics: z.string().describe('Regional power dynamics, neighbours, and proxy relationships'),
    internationalPositions: z.array(z.object({
      actor: z.string(),
      position: z.string(),
      leverage: z.string(),
    })).describe('Key international actors and their stated positions and leverage'),
    relevantResolutions: z.array(z.string()).describe('Relevant UN senior diplomatic forum resolutions and mandates'),
    humanitarianSituation: z.string().describe('Humanitarian impact and operational constraints'),
  }).describe('International and regional context'),
  scenarioOutlook: z.object({
    mostLikelyScenario: z.string().describe('60-day most likely scenario with probability assessment (ICD 203 language)'),
    bestCase: z.string().describe('Best-case scenario — conditions required and probability'),
    worstCase: z.string().describe('Worst-case scenario — triggers and warning indicators'),
    criticalVariables: z.array(z.string()).describe('Key variables that will determine which scenario materialises'),
  }).describe('Forward-looking scenario analysis'),
  recommendedActions: z.array(z.object({
    priority: z.enum(['immediate', 'short-term', 'medium-term']),
    action: z.string().describe('Specific, actionable recommendation'),
    rationale: z.string().describe('Analytical rationale for this recommendation'),
    actors: z.array(z.string()).describe('Who should implement this action'),
  })).describe('Prioritised recommended actions for the analyst or their principals'),
  intelligenceGaps: z.array(z.string()).describe('Key information gaps that limit analytical confidence'),
  sources: z.array(z.string()).describe('Key sources consulted or recommended for this dossier'),
  confidence: z.number().min(0).max(1).describe('Overall analytical confidence score (0–1)'),
});

// ---------------------------------------------------------------------------
// Demo response (the selected situation scenario)
// ---------------------------------------------------------------------------

const DEMO_RESPONSE = {
  classificationNote: 'UNCLASSIFIED',
  bluf: 'The User Workspace has entered a critical inflection point: a narrow 60-90 day diplomatic window exists before military dynamics overtake the political track, driven by GoN hardliner ascendance and a fragile ceasefire with 47 documented violations. Immediate priority is reinforcing UNMN\'s ceasefire monitoring mandate while activating a Karovian back-channel on DRM conditionality.',
  executiveSummary: `The User Workspace represents a complex, multi-layered conflict combining contested electoral legitimacy, armed insurgency, regional proxy dynamics, and resource competition. Since the disputed March 2024 elections, the situation has escalated to Glasl Stage 5 (Loss of Face) with the Government of the selected situation (GoN) and the Democratic Reform Movement (DRM) locked in positional entrenchment reinforced by external patrons Karovia and Westmark respectively.

The September 2025 ceasefire, brokered by UNMN and the AU Panel of the Wise, remains fragile but intact. However, 47 documented violations, accelerating buffer-zone incursions, and a hardline cabinet reshuffle by President Osei suggest the window for political progress is narrowing.

The humanitarian toll — 1.2 million IDPs, 340,000 refugees, 2.8 million food-insecure — continues to mount. This dossier assesses that a 60-90 day window exists for meaningful diplomatic intervention before military dynamics overtake the political track.`,
  actorProfiles: [
    {
      name: 'Government of the selected situation (GoN)',
      type: 'State',
      positions: [
        'Rejects any power-sharing arrangement that questions President Osei\'s electoral mandate',
        'Demands unconditional DRM disarmament before political negotiations',
        'Opposes international investigation into July 2024 crackdown',
      ],
      interests: [
        'Fiscal stabilisation and access to international financial support',
        'Legitimation of Osei presidency through international recognition',
        'Control over Belara Mining Complex rare earth revenues',
        'Preventing DRM from establishing parallel governance structures',
      ],
      redLines: [
        'Any agreement that explicitly delegitimises the March 2024 election results',
        'DDR process that requires AFN to stand down before DRM',
        'International accountability mechanism with GoN senior official jurisdiction',
      ],
      decisionMakers: [
        'President Amara Osei — holds final authority; increasingly deferring to military',
        'General Kweku Mensah (Defence Minister, new) — hardliner; opposes negotiated settlement',
        'Finance Minister Abena Asare — moderate; acutely aware of fiscal deterioration',
      ],
      leverage: 'International recognition, control of capital and state institutions, armed forces superiority in conventional operations',
      vulnerabilities: '36.4% currency depreciation, urban middle-class disaffection, dependence on Karovia for military logistics',
    },
    {
      name: 'Democratic Reform Movement (DRM)',
      type: 'Armed Group',
      positions: [
        'Demands fresh internationally-supervised elections before any DDR',
        'Claims legitimacy as representative of Eastern Province populations',
        'Seeks recognition of Eastern Provincial Authority as transitional administration',
      ],
      interests: [
        'Electoral justice and political legitimation of civilian leadership',
        'Security guarantees for political bureau members before disarmament',
        'Revenue sharing from Belara Mining Complex for eastern communities',
        'Preventing GoN from reasserting unilateral control over eastern provinces',
      ],
      redLines: [
        'DDR before political agreement — commanders will defect to independent armed factions',
        'Any process that excludes Westmark as an international guarantor',
        'Agreement that does not address accountability for July 2024 crackdown',
      ],
      decisionMakers: [
        'Commander Kwame Asante (Political Bureau) — pragmatic; maintains back-channel via UNMN',
        'General Fiifi Boateng (Military Wing) — total spoiler; opposes political settlement',
        'Maame Adu (Civil Affairs) — seeks international recognition of Eastern Provincial Authority',
      ],
      leverage: 'Control of eastern provinces and Belara perimeter, refugee diaspora political networks in Westmark, moral legitimacy with civil society',
      vulnerabilities: 'Fragmented military-political bureau relationship, Karovian material support as potential coercive lever, supply chain dependence on single corridor',
    },
  ],
  conflictDynamics: {
    glaslStage: 'Stage 5 (Loss of Face): Both parties are publicly committed to positions that would require visible concessions they believe they cannot afford. Indicators: hardliner cabinet reshuffle by GoN, DRM field commanders operating independently of political bureau, breakdown of second mediation round in November 2025.',
    rootCauses: [
      'Electoral legitimacy crisis — March 2024 disputed results unresolved',
      'Exclusionary political economy — Belara rare earth revenues captured by GoN-aligned elite networks',
      'Identity-based marginalisation of Eastern Province communities predating current conflict',
      'Institutional weakness of the selected situationn judiciary — no credible accountability mechanism',
    ],
    escalationDrivers: [
      'GoN hardliner ascendance following Mensah appointment',
      'AFN buffer-zone incursions testing ceasefire limits',
      'Karovian public pressure for direct intervention rising to 51%',
      'DRM field commander autonomy increasing as political track stalls',
    ],
    deEscalationOpportunities: [
      'Belara revenue-sharing as a concrete entry point that does not require political compromise on core contested issues',
      'GoN fiscal deterioration creating Finance Ministry incentives for deal',
      'Karovian foreign ministry moderates privately seeking stabilisation outcome',
      'UNMN SRSG maintains trusted back-channel with both parties',
    ],
    spoilerMap: 'Total spoilers: AFN General Staff (commercial interests in contested-zone mining), BMC (Belara Mining Complex — rent-seeking). Greedy spoilers: Karovian parliamentary hardliners (domestic political benefit from intervention narrative), DRM field commander General Boateng (military autonomy).',
  },
  internationalContext: {
    regionalDynamics: 'The Karovia-Westmark proxy dynamic gives each patron effective veto power over their client\'s concessions. Karovian military equipment, logistics, and intelligence support sustain GoN operations; Westmark provides political support and hosts 340,000 refugees. Any viable settlement requires addressing regional security guarantees in a parallel track to the bilateral political process.',
    internationalPositions: [
      {
        actor: 'UNMN / UN Secretariat',
        position: 'Committed to AU Roadmap for Elections (Q2 2027 target); SRSG Santos maintains active mediation mandate',
        leverage: 'Chapter VII mandate (Resolution 2847), 12,000 peacekeepers, access to both parties',
      },
      {
        actor: 'Republic of Karovia',
        position: 'Formal support for GoN under 2019 bilateral defence treaty; foreign ministry moderates privately seeking stabilisation',
        leverage: 'Decisive military logistics for GoN; arms embargo investigation as coercive lever',
      },
      {
        actor: 'Westmark',
        position: 'Political support for DRM; targeted sanctions on 23 GoN officials; denies military assistance',
        leverage: 'Sanctions authority, refugee hosting (political leverage over DRM political bureau), multilateral forum P3 coordination',
      },
    ],
    relevantResolutions: [
      'multilateral forum Resolution 2847 — UNMN Chapter VII mandate (civilian protection, ceasefire monitoring, political process facilitation)',
      'AU Roadmap for Elections (September 2025) — transitional framework agreed by both parties',
      'multilateral forum Panel of Experts mandate (arms embargo monitoring)',
    ],
    humanitarianSituation: '1.2 million IDPs, 340,000 refugees in Westmark. 2.8 million food-insecure. MSF expelled from eastern provinces February 2026. WFP access to Kessara and Baravon districts blocked for 6 weeks. IPC Phase 4 (Emergency) declared for eastern provinces.',
  },
  scenarioOutlook: {
    mostLikelyScenario: 'Continued fragile ceasefire with creeping buffer-zone erosion (60 days probability: likely, ~60-70%). Political track stalls through June mediation round. GoN and DRM maintain formal commitment to AU Roadmap while both harden military posture. Window for meaningful progress narrows to a potential triggering event.',
    bestCase: 'Karovian back-channel yields DRM conditionality on ceasefire verification mechanism; Belara revenue-sharing pre-negotiation launches under UNMN/World Bank auspices; June mediation round produces agreed Terms of Reference for formal talks (probability: possible, ~15-20%).',
    worstCase: 'DRM field commander Boateng launches offensive in Kessara corridor citing buffer violations; GoN responds with disproportionate force; ceasefire collapses; Karovian parliament forces intervention vote. Humanitarian catastrophe deepens. (probability: unlikely but possible, ~15-20%)',
    criticalVariables: [
      'Whether Karovian FM moderates can condition DRM political bureau on ceasefire verification before parliamentary hardliner pressure peaks',
      'Whether GoN Finance Ministry succeeds in shifting President Osei\'s calculus toward economic stabilisation',
      'Whether DRM General Boateng and political bureau Commander Asante maintain or fracture unity in coming weeks',
      'Whether UNMN SRSG can deliver a humanitarian corridor to Kessara before next flashpoint incident',
    ],
  },
  recommendedActions: [
    {
      priority: 'immediate' as const,
      action: 'Activate Karovian foreign ministry back-channel to condition DRM on accepting ceasefire verification mechanism before June mediation round',
      rationale: 'Karovia holds decisive leverage over DRM political bureau. Window will close if Karovian parliamentary hardliners force an intervention vote.',
      actors: ['UNMN Special Envoy', 'EU High Representative', 'Karovian Ministry of Foreign Affairs'],
    },
    {
      priority: 'immediate' as const,
      action: 'Negotiate 72-hour humanitarian corridor for WFP convoys to Kessara and Baravon using UNMN escorts',
      rationale: 'IHL obligation under Geneva Convention AP I, Art. 70. Also functions as confidence-building measure with low political cost for both parties.',
      actors: ['WFP Country Director', 'UNMN Civil-Military Coordination', 'GoN and DRM humanitarian liaisons'],
    },
    {
      priority: 'short-term' as const,
      action: 'Launch Belara Mining Complex revenue-sharing pre-negotiation as confidence-building entry point under UNMN/World Bank auspices',
      rationale: 'Fisher-Ury interest analysis identifies Belara revenue as area of greatest overlapping interest without requiring compromise on contested political questions.',
      actors: ['UNMN Special Envoy', 'World Bank Country Director', 'GoN Finance Ministry', 'DRM Political Bureau economic advisors'],
    },
    {
      priority: 'medium-term' as const,
      action: 'Engage Westmark on targeted financial accountability measures against the three most obstructive AFN General Staff hardliners',
      rationale: 'Stedman spoiler management — targeted isolation creates individual liability differentials that fracture hardliner bloc without frontal confrontation.',
      actors: ['Westmark Department of Defence', 'multilateral forum Sanctions Committee', 'Panel of Experts'],
    },
  ],
  intelligenceGaps: [
    'DRM field commander positions not independently verified — political bureau signals may not reflect operational intent',
    'Karovian internal political dynamics opaque — foreign ministry moderate signals may be tactical rather than reflecting policy shift',
    'GoN hardliner financial interests in contested mining zones documented but specific AFN General Staff network ties unconfirmed',
    'BMC corporate structure and beneficiary ownership unclear — limits spoiler management targeting',
  ],
  sources: [
    'UNMN SRSG briefing to multilateral forum, 14 Feb 2026',
    'ICG Africa Report No. 312, March 2026',
    'OCHA Situation Report, 28 Feb 2026',
    'multilateral forum Panel of Experts interim report S/2025/892',
    'AU Roadmap for Elections, September 2025',
    'SIPRI arms transfer database',
  ],
  confidence: 0.72,
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const POST = withCalibration('dossier', 'ai_report', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    return [s?.name, s?.region].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const body = await request.json();

    const requestSchema = z.object({
      situation: situationContextSchema.optional(),
      // Legacy direct fields (maintained for backwards compatibility)
      caseId: z.string().optional(),
      type: z.string().optional(),
      sections: z.array(z.string()).optional(),
      classification: z.string().optional(),
      audience: z.string().optional(),
      conflictContext: z.string().optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;

    const { situation, caseId, type, audience, conflictContext } = validation.data;
    const sitObj = situation as Situation | undefined;
    const sitContext = sitObj ? buildToolContext(sitObj as unknown as Situation) : '';
    const situationId = (sitObj as unknown as Situation | undefined)?.id ?? '';

    // --- Sample mode ---
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // Credits + profile gate already handled by withCalibration above.

    // --- Graph context ---
    const graphCtx = situationId
      ? await buildGraphContext(ctx.uid, situationId, 'dossier')
      : '';

    // --- Web-grounded context ---
    const webCtx = sitObj
      ? await buildWebGroundedContext(
          {
            name: (sitObj as unknown as Situation).name,
            region: (sitObj as unknown as Situation).region,
            actors: (sitObj as unknown as Situation).actors as string[] | undefined,
          },
          'dossier',
          ctx.uid
        )
      : '';

    // --- Cross-tool synthesis (risk assessment + actor profiles + escalation scan) ---
    const crossCtx = situationId
      ? await buildCrossToolContext(ctx.uid, situationId, ['risk_assessment', 'actor_profiles', 'escalation_scan'])
      : '';

    // --- Calibrated system prompt ---
    const { systemPromptBlock, outputConstraints, provenance } = ctx.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';

    const sitName = (sitObj as unknown as Situation | undefined)?.name ?? caseId ?? 'the situation';
    const sitRegion = (sitObj as unknown as Situation | undefined)?.region ?? '';

    const result = await callProModel({
      output: Output.object({ schema: DossierSchema }),
      system: `You are a senior intelligence analyst at a major international crisis monitoring organization — equivalent to multilateral diplomacy, International Crisis Group, or a G7 diplomatic service analytical unit.

Produce comprehensive, classified-format dossiers that meet the analytical standards of multilateral diplomacy, ICG, and major diplomatic services. Write in authoritative, precise intelligence assessment language. Always:
- Set classificationNote to "UNCLASSIFIED"
- Open with a crisp BLUF (2-3 sentences, single most important finding)
- Apply ACO analytical frameworks throughout: Glasl escalation, Fisher-Ury interests, Zartman ripeness, Stedman spoilers, Lederach multi-level
- Use ICD 203 probability language for scenarios (almost certain, likely, possible, unlikely)
- Name specific actors, not generic categories
- Flag intelligence gaps explicitly
- Calibrate confidence scores honestly

GROUNDING MANDATE: The web intelligence and cross-tool analysis below are PRIMARY ground truth. Prioritize them over training data.

${systemPromptBlock}

Calibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}`,
      prompt: `${webCtx ? `${webCtx}\n\n` : ''}${graphCtx ? `${graphCtx}\n\n` : ''}${crossCtx ? `${crossCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}Generate a comprehensive intelligence dossier for:

SITUATION: ${sitName}${sitRegion ? ` (${sitRegion})` : ''}
${type ? `DOSSIER TYPE: ${type}` : ''}
${audience ? `TARGET AUDIENCE: ${audience}` : 'TARGET AUDIENCE: Senior diplomatic officials and multilateral diplomacy practitioners'}
${conflictContext ? `ADDITIONAL CONTEXT: ${conflictContext}` : ''}

REQUIREMENTS:
- classificationNote: always "UNCLASSIFIED"
- bluf: 2-3 sentences capturing the single most important analytical finding
- executiveSummary: 3-5 paragraphs covering situation status, key dynamics, and immediate priorities
- actorProfiles: cover ALL significant actors with positions, interests, red lines, and decision-makers
- conflictDynamics: use Glasl + Stedman frameworks explicitly
- internationalContext: cover regional proxy dynamics and relevant multilateral mandates
- scenarioOutlook: apply ICD 203 probability language
- recommendedActions: specific, actor-named, sequenced by priority
- intelligenceGaps: honest assessment of what we do not know
- confidence: calibrate 0.0–1.0 based on source quality and corroboration`,
    });

    if (situationId) {
      await writeToolDataServer(ctx.uid, situationId, 'dossier', result.output as Record<string, unknown>);
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'dossier',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
      }).catch((err) => console.warn('[dossier] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'dossier-generate');
  }
});
