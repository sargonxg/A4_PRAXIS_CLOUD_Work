import { NextResponse } from 'next/server';
import { generateText, streamText, Output } from 'ai';
import { z } from 'zod';
import { getModel } from '@/lib/ai/providers';
import { buildToolContext, buildWebGroundedContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode, formatAsStreamResponse } from '@/lib/compat/sample-mode';
import { handleRouteError } from '@/lib/api/standard-error';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';
import { searchWeb, formatResultsAsContext } from '@/lib/ai/grounded-research';
import { audienceTonePreset, audienceTuningEnabled } from '@/lib/ai/audience-presets';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// ── Full briefing schema (mode: 'full', default) ──────────────────────────────

const BriefingSchema = z.object({
  bluf: z.string().describe('Bottom Line Up Front: single paragraph stating the situation assessment, 2 key developments, and recommended action'),
  speakerNotes: z.string().optional().describe('What to say verbally when presenting this briefing to senior leadership'),
  keyJudgments: z.array(z.object({
    judgment: z.string(),
    confidence: z.enum(['almost no chance', 'very unlikely', 'unlikely', 'roughly even', 'likely', 'very likely', 'almost certain']),
    evidence: z.string(),
  })).optional().describe('Key analytical judgments with ICD 203 calibrated probability language'),
  slides: z.array(
    z.object({
      title: z.string().describe('Section heading using multilateral diplomacy conventions: HEADLINE ASSESSMENT, KEY DEVELOPMENTS, POLITICAL DYNAMICS, RISK FACTORS, OPPORTUNITIES, INFORMATION GAPS, or UPCOMING DECISION POINTS'),
      content: z.string().describe('Section body in markdown format following professional diplomatic analytical standards. Use calibrated confidence language, bracketed source tags [GDELT] [UCDP] [ReliefWeb] [UN News] [PRAXIS Graph] [Web] [AI Assessment], and formal register throughout. No contractions.'),
      speakerNotes: z.string().optional().describe('Presenter guidance with additional analytical context, recommended emphasis, and suggested responses to anticipated questions from senior leadership'),
      sources: z.array(z.string()).optional().describe('Formal source attributions referenced in this section, using standard professional citation format'),
    })
  ).describe('Structured political affairs briefing sections for senior diplomatic leadership, following professional diplomatic analytical standards'),
});

// ── Morning Digest System Prompt ─────────────────────────────────────────────

const MORNING_DIGEST_SYSTEM_PROMPT = `You are drafting a morning political affairs digest for a senior diplomatic leadership audience, following professional diplomatic analytical standards. Structure exactly as follows:

## HEADLINE ASSESSMENT
[One sentence. The single most consequential overnight development or analytical judgment. Present tense, analytical voice. Use calibrated language: "It is assessed that..." for high confidence, "Available information suggests..." for medium confidence.]

## OVERNIGHT DEVELOPMENTS
[3-5 bullet points. Each begins with a time in brackets [HH:MM UTC], followed by a factual statement, followed by analytical significance in parentheses. Prioritize: political, then security, then humanitarian, then economic. Each bullet 2-3 sentences maximum. Append a bracketed source tag to each claim: [GDELT], [UCDP], [ReliefWeb], [UN News], [PRAXIS Graph], [Web], or [AI Assessment].]

## RISK ASSESSMENT UPDATE
[Changes to risk indicators and escalation signals since previous digest. Reference the Glasl escalation model stage if available. Use numbered risk items with likelihood qualifiers: likely, possible, unlikely. Specify trigger conditions and actors involved for each risk.]

## KEY ACTORS TO WATCH
[Which actors are most active or concerning. For each actor, state: (a) what they have done, (b) what it is assessed they may do next, and (c) what indicators to monitor. Refer to all actors by their names from the situation data.]

## RECOMMENDED PRIORITIES
[Top 3 priorities for the day, framed as recommended actions for senior leadership. Each priority should specify the responsible actor or office and the recommended timeframe. Frame as diplomatic opportunities or risk mitigation measures, not merely intelligence collection tasks.]

## UPCOMING DECISION POINTS
[Events in the next 7 days requiring senior-level attention or preparation. Use standard diplomatic date format: DD Month YYYY.]

## INFORMATION GAPS
[2-3 questions this digest cannot answer. Frame as: "Reporting is insufficient to assess whether..."]

FORMAT RULES:
- No contractions. Formal register throughout.
- All actors referred to by their names from the situation data.
- Hedging calibration: HIGH confidence = "it is assessed that", MEDIUM = "available information suggests", LOW = "it cannot be confirmed whether".
- Every factual claim should have a bracketed source tag: [GDELT], [UCDP], [ReliefWeb], [UN News], [PRAXIS Graph], [Web], [AI Assessment].
- Use standard diplomatic date format: DD Month YYYY.
- Flag items by urgency where appropriate: CRITICAL / IMPORTANT / ROUTINE.`;

// ── Demo responses ────────────────────────────────────────────────────────────

const MORNING_DIGEST_DEMO = `## OVERNIGHT DEVELOPMENTS
- 🔴 CRITICAL: Buffer zone incursion reported near Kessara corridor — third incident this week. UNMN observers confirmed vehicle movement from GoN side at 0300 UTC.
- 🟡 IMPORTANT: Karovian military transport flight KV-4112 landed at the selected situation City International at 0145 UTC. Sixth flight in 10 days — logistics pattern suggests materiel buildup.
- 🟢 ROUTINE: OCHA convoy reached Sector 3 distribution point. DRM taxation checkpoint extracted 8% "transit fee." Within recent norms but concerning trend.

## RISK ASSESSMENT UPDATE
- **Overall risk score:** 7.2/10 (up from 6.8 last week)
- **Escalation indicator:** GoN cabinet reshuffle bringing in AFN hardliner General Mensah as Defence Minister signals shift from diplomatic to military posture
- **De-escalation anchor:** SRSG back-channel remains active; prisoner exchange framework still on table
- **Glasl assessment:** Stage 5 (Loss of Face) — two of four Stage 6 indicators now partially present

## KEY ACTORS TO WATCH
- 🔴 **General Mensah (new GoN Defence Minister):** Hardline AFN faction. First public statement expected today — will signal policy direction
- 🟡 **DRM Eastern Command:** Unusual communications pattern detected. Possible repositioning in response to GoN incursions
- 🟡 **Karovian Embassy:** Ambassador Volkov requested urgent meeting with SRSG. Agenda unknown but timing correlates with military flights
- 🟢 **CSCN leadership:** Civil society coalition press conference scheduled for 1400 local time on journalist detentions

## TODAY'S RECOMMENDED FOCUS
1. **Monitor General Mensah's first statement** — Content and tone will indicate whether GoN is preparing escalation or using appointment as bargaining leverage. Draft talking points for SRSG response.
2. **Track Karovian logistics pattern** — Request updated satellite imagery of the selected situation City airfield. Cross-reference with Panel of Experts shipping data for arms embargo compliance.
3. **Prepare humanitarian access brief** — Planting season (April-May) window approaching. Draft options paper for OCHA on checkpoint negotiations before agricultural disruption becomes irreversible.

## UPCOMING DEADLINES & MILESTONES
- 🔴 **Today:** General Mensah expected first public statement
- 🟡 **Wednesday:** multilateral forum informal consultations on the selected situation mandate
- 🟡 **Friday:** SRSG weekly briefing to P5 ambassadors
- 🟢 **Next Monday:** AU PSC consultative meeting on Sahel/the selected situation regional dynamics
- 🟢 **April 1:** Eastern Province planting season begins — humanitarian access critical`;

const DEMO_RESPONSE_FULL = {
  bluf: 'The the selected situation conflict remains at Glasl Stage 5 with ceasefire holding but under increasing strain from buffer zone incursions and the appointment of AFN hardliner General Mensah as Defence Minister; Karovian military logistics have increased 40% over the past 30 days. Immediate priorities are reinforcing UNMN ceasefire monitoring at Kessara corridor and launching an economic working group on rare earth revenue-sharing before the June AU mediation round.',
  speakerNotes: 'Open with the Mensah appointment — it is the most significant political development and signals the hardline faction is ascendant. Emphasise the 60-90 day window before the June AU round. Close with the planting season humanitarian urgency.',
  keyJudgments: [
    { judgment: 'GoN will not return to formal negotiations prior to June AU round without external pressure from Karovia or the P3', confidence: 'likely' as const, evidence: 'Mensah appointment signals hardline dominance; no GoN outreach to SRSG in past 3 weeks' },
    { judgment: 'DRM will exploit planting season disruption for domestic recruitment if humanitarian access is not restored', confidence: 'very likely' as const, evidence: 'DRM messaging increasingly frames GoN checkpoint policy as deliberate starvation tactic' },
    { judgment: 'Karovia will intervene militarily in the near term', confidence: 'very unlikely' as const, evidence: 'Logistics increase is assessed as deterrence signalling, not preparation for offensive action' },
  ],
  slides: [
    {
      title: 'Situation Overview: User Workspace',
      content: `- **Conflict status:** Stage 5 (Glasl) — Loss of Face
- **Ceasefire:** Fragile but holding since September 2025
- **Violations:** 47 documented since inception; accelerating in Kessara corridor
- **Displacement:** 1.2M IDPs + 340K refugees in Westmark
- **Political track:** Stalled since November 2025 mediation round`,
      speakerNotes: 'Frame this as a conflict at a critical inflection point. The ceasefire provides a framework but is under increasing strain. The 60-90 day window for political progress is the key message.',
      sources: ['UNMN SRSG briefing, 14 Feb 2026', 'OCHA Situation Report, 28 Feb 2026'],
    },
    {
      title: 'Key Developments (Last 30 Days)',
      content: `- **Cabinet reshuffle:** President Osei replaced moderate Defence Minister with AFN hardliner General Mensah
- **Buffer zone incursions:** Third consecutive week of violations by both parties in Kessara corridor
- **Karovian logistics:** 40% increase in military transport flights to the selected situation City
- **Journalist detentions:** Two additional NIMN journalists arrested, bringing total to five
- **Currency:** the selected situationn krone fell 2.1%, cumulative depreciation now 36.4%`,
      speakerNotes: 'The cabinet reshuffle is the most significant political development. It signals that the hardline faction within the GoN is currently ascendant. Combined with the Karovian logistics increase, this suggests preparation for potential military escalation if the political track does not produce results.',
      sources: ['NIMN reporting, March 2026', 'Open-source flight tracking data', 'ICG Africa Report No. 312'],
    },
    {
      title: 'Escalation Assessment',
      content: `- **Current stage:** Glasl Stage 5 (Loss of Face) — upper boundary
- **Stage 6 indicators:** Two of four partially present
  - Demonstrative military actions (buffer zone incursions)
  - Increasing reliance on mediated communication
- **Escalation probability:** 35% chance of Stage 6 transition within 3-6 months
- **De-escalation anchors:** SRSG back-channel, prisoner exchange framework, economic interdependence`,
      speakerNotes: 'Emphasize that the conflict has crossed the second Glasl threshold (Win-Win to Win-Lose) but has not yet reached the critical third threshold (Win-Lose to Lose-Lose). The window for de-escalation remains open but is narrowing.',
      sources: ['PRAXIS Glasl assessment, March 2026'],
    },
    {
      title: 'Policy Options and Recommendations',
      content: `1. **Reinforce ceasefire monitoring** — Additional UNMN observers at three highest-risk contact points
2. **Economic working group** — Joint GoN-DRM group on rare earth revenue-sharing
3. **Military-to-military channel** — Expand SRSG back-channel to include senior military representatives
4. **Arms embargo enforcement** — Implement Panel of Experts monitoring recommendations
5. **Regional security dialogue** — Dedicated envoy or contact group for Karovia-Westmark dimension`,
      speakerNotes: 'Frame these as a sequenced package. Items 1-3 are immediately actionable. Items 4-5 require multilateral forum consensus-building.',
      sources: ['PRAXIS policy analysis', 'UN Peacebuilding Fund cost-benefit methodology'],
    },
  ],
};

// ── Route handler ─────────────────────────────────────────────────────────────

export const POST = withCalibration('briefing_room', 'ai_report', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    const bt = typeof body.briefingType === 'string' ? body.briefingType : '';
    return [s?.name, s?.region, bt].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, ctx) => {
  try {
    const body = await request.json() as {
      caseId?: string;
      briefingType?: string;
      conflictContext?: string;
      situationContext?: {
        name: string;
        region: string;
        actors: string[];
        riskScore: number;
        escalationTrend: string;
        glaslStage: number | null;
        description: string;
      };
      situation?: Situation;
      // mode discriminator: 'full' (default) | 'quick' (absorbed from /api/ai/brief)
      mode?: 'full' | 'quick';
      // quick mode fields (used by dashboard AiInsightsPanel)
      situationName?: string;
    };

    const { caseId, briefingType, conflictContext, situationContext, situation, mode = 'full' } = body;
    const sitContext = situation ? buildToolContext(situation) : '';
    const situationId = situation?.id ?? '';

    // --- Calibrated system prompt (shared) ---
    const { systemPromptBlock, outputConstraints, provenance } = ctx.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';
    const audienceDirective = audienceTuningEnabled()
      ? `\n\n${audienceTonePreset(outputConstraints.audienceTone)}`
      : '';
    const calibrationSuffix = `\n\n${systemPromptBlock}\n\nCalibrate framing, tone, and recommendations to the analyst profile above. Honour the output-constraints block.${langDirective}${redLineDirective}${audienceDirective}`;

    // ── mode: 'quick' — streaming-only intelligence brief (absorbed from /api/ai/brief) ──
    if (mode === 'quick') {
      if (isServerDemoMode()) {
        return formatAsStreamResponse('**Demo Mode** — This analysis requires a live AI connection. Set GOOGLE_AI_API_KEY in your environment to enable it.');
      }

      // Credits + profile gate already handled by withCalibration above.

      const { situationName } = body;

      // Build rich context — prefer full situation object; fallback to name
      let liveContext = '';
      try {
        const searchTerm = situation?.name ?? situationName ?? '';
        if (searchTerm) {
          const results = await searchWeb(
            `${searchTerm} latest developments conflict update 2025 2026`,
            { numResults: 4 },
          );
          if (results.length > 0) {
            liveContext = '\n\nLIVE INTELLIGENCE SOURCES:\n' + formatResultsAsContext(results);
          }
        }
      } catch { /* non-blocking */ }

      const name = situation?.name ?? situationName ?? 'the active situation';
      const region = situation?.region ?? '';
      const glaslStage = situation?.glaslStage ?? null;
      const riskScore = situation?.riskScore ?? null;
      const actors = situation?.actors?.slice(0, 4).join(', ') ?? '';

      const result = streamText({
        model: getModel(),
        system: `You are a senior multilateral diplomacy practitioner preparing a concise morning intelligence brief.
Write in professional diplomatic register. Use **bold headers** for each section.
Be precise, evidence-grounded, and actionable. Avoid speculation — note uncertainty where relevant.${calibrationSuffix}`,
        onFinish: async ({ text }) => {
          if (situationId && ctx.uid) {
            await saveToolOutput({
              uid: ctx.uid,
              situationId,
              toolId: 'briefing_room',
              profileVersion: provenance.profileVersion,
              output: { mode: 'quick', briefingType, brief: text },
              metadata: { mode: 'quick' },
            }).catch((err) => console.warn('[briefing_room/quick] saveToolOutput failed:', err));
          }
        },
        messages: [
          {
            role: 'user',
            content: `${sitContext ? `${sitContext}\n\n---\n\n` : ''}${liveContext ? `${liveContext}\n\n---\n\n` : ''}Generate a morning intelligence brief for: **${name}**${region ? ` (${region})` : ''}.

${glaslStage ? `Glasl Escalation Stage: ${glaslStage}/9` : ''}
${riskScore ? `Risk Score: ${riskScore}/10` : ''}
${actors ? `Key Actors: ${actors}` : ''}

Structure the brief with these three sections:

**Situation Overview**
2–3 sentences on the current state of the conflict — key dynamics, recent developments, trajectory.

**Key Risks & Flashpoints**
2–3 bullet points on the most significant near-term risks or escalation triggers. Be specific.

**Priority Action**
1 clear recommended action for a mediator or political affairs officer right now.

Keep the entire brief under 250 words. Cite live sources where available.`,
          },
        ],
      });

      return result.toUIMessageStreamResponse();
    }

    // ── mode: 'full' — structured briefing with slides (original behaviour) ────

    // --- Live intelligence feed ---
    let intelContext = '';
    try {
      if (situation) {
        const intel = await getSituationIntelligence({
          country: situation.region || situation.name,
          query: situation.name,
          limit: 15,
        });
        if (intel.events.length > 0) {
          intelContext = '\n\nLIVE INTELLIGENCE FEED:\n' + intel.events.slice(0, 10).map(e =>
            `- [${e.source.toUpperCase()}] ${e.date}: ${e.title} (${e.severity})`
          ).join('\n');
        }
      }
    } catch { /* data feeds optional */ }

    // ── Morning digest sub-type — streamed markdown ──────────────────────────
    if (briefingType === 'morning-digest') {
      if (isServerDemoMode()) {
        return new Response(MORNING_DIGEST_DEMO, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      // Credits + profile gate already handled by withCalibration above.

      const webContext = situation
        ? await buildWebGroundedContext(
            { name: situation.name, region: situation.region, actors: situation.actors },
            'briefing',
            ctx.uid
          )
        : situationContext
        ? await buildWebGroundedContext(
            { name: situationContext.name, region: situationContext.region, actors: situationContext.actors },
            'briefing',
            ctx.uid
          )
        : '';

      const sitBlock = situationContext
        ? `SITUATION: ${situationContext.name}
REGION: ${situationContext.region}
KEY ACTORS: ${situationContext.actors.join(', ')}
CURRENT RISK SCORE: ${situationContext.riskScore}/10
ESCALATION TREND: ${situationContext.escalationTrend}
${situationContext.glaslStage ? `GLASL STAGE: ${situationContext.glaslStage}/9` : ''}
DESCRIPTION: ${situationContext.description}`
        : `SITUATION: ${caseId}\n${conflictContext ? `CONTEXT: ${conflictContext}` : ''}`;

      const result = streamText({
        model: getModel(),
        system: (sitContext ? `${sitContext}${intelContext}\n\n${MORNING_DIGEST_SYSTEM_PROMPT}` : MORNING_DIGEST_SYSTEM_PROMPT) + calibrationSuffix,
        onFinish: async ({ text }) => {
          if (situationId && ctx.uid) {
            await saveToolOutput({
              uid: ctx.uid,
              situationId,
              toolId: 'briefing_room',
              profileVersion: provenance.profileVersion,
              output: { mode: 'morning-digest', digest: text },
              metadata: { briefingType: 'morning-digest' },
            }).catch((err) => console.warn('[briefing_room/digest] saveToolOutput failed:', err));
          }
        },
        prompt: `Generate today's morning intelligence digest for the following situation.

${sitBlock}

LATEST INTELLIGENCE FROM WEB SOURCES:
${webContext || 'No web results available. Base analysis on the situation context provided and your knowledge of the region/actors.'}

Generate the digest now. Be specific with actor names, locations, and timeline references. Ground every claim in the context or web intelligence above.

BLUF REQUIREMENT: The first paragraph must be a Bottom Line Up Front (BLUF) — single paragraph stating the situation assessment, 2 key developments, and recommended action.

PROBABILITY LANGUAGE REQUIREMENT: Use ICD 203 Analytic Standards probability language exclusively: 'almost no chance' (<5%), 'very unlikely' (5-20%), 'unlikely' (20-45%), 'roughly even' (45-55%), 'likely' (55-80%), 'very likely' (80-95%), 'almost certain' (>95%). Never use vague hedging.`,
      });

      return result.toTextStreamResponse();
    }

    // ── Standard full briefing (slide-based) ─────────────────────────────────

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE_FULL);
    }

    // Credits + profile gate already handled by withCalibration above.

    const graphCtx = situationId
      ? await buildGraphContext(ctx.uid, situationId, 'briefing').catch(() => '')
      : '';

    const webCtx = situation
      ? await buildWebGroundedContext(
          { name: situation.name, region: situation.region, actors: situation.actors },
          'briefing',
          ctx.uid
        )
      : '';

    const result = await generateText({
      model: getModel(),
      output: Output.object({ schema: BriefingSchema }),
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `${sitContext}\n\n` : ''}${intelContext ? `${intelContext}\n\n` : ''}${webCtx ? `${webCtx}\n\n` : ''}You are drafting a political affairs briefing for a senior diplomatic leadership audience. This is a ${briefingType ?? 'standard'} briefing.

CASE: ${caseId ?? ''}
BRIEFING TYPE: ${briefingType ?? 'standard'}
${conflictContext ? `CONFLICT CONTEXT: ${conflictContext}` : ''}

LATEST WEB INTELLIGENCE:
${webCtx || 'No web results available. Base analysis on the conflict context provided and your knowledge of the region and actors.'}

BLUF REQUIREMENT: The bluf field must be a single paragraph stating the situation assessment, 2 key developments, and recommended action. This is the first thing senior leadership reads.

Generate a complete briefing with exactly 7 sections, each as a separate slide. Structure exactly as follows:

SLIDE 1 — HEADLINE ASSESSMENT
Title: "Headline Assessment"
Content: One sentence only. The single most important development or analytical judgment. Written in present tense, analytical voice. Example format: "The cessation of hostilities framework faces imminent collapse following [actor]'s withdrawal from the Joint Implementation Committee." Use calibrated confidence language.

SLIDE 2 — KEY DEVELOPMENTS
Title: "Key Developments"
Content: 3-5 bullet points. Each begins with a date in brackets [DD Month], followed by a factual statement, followed by analytical significance in parentheses. Each bullet 2-3 sentences maximum. Prioritize: first political, then security, then humanitarian, then economic. Append a bracketed source tag to every factual claim: [GDELT], [UCDP], [ReliefWeb], [UN News], [PRAXIS Graph], [Web], or [AI Assessment].

SLIDE 3 — POLITICAL DYNAMICS
Title: "Political Dynamics"
Content: 2-3 paragraphs analysing shifts in actor positions, coalition changes, and political calculations. Use calibrated language: "It is assessed that...", "Available information suggests...", "Sources indicate...". Name specific actors from the situation data. Address the motivations, constraints, and leverage of each principal actor.

SLIDE 4 — RISK FACTORS
Title: "Risk Factors"
Content: Numbered list of 3-5 risks. Each risk must include: (a) a likelihood qualifier — likely, possible, or unlikely; (b) a timeframe; (c) the specific actors involved; and (d) the trigger conditions. Format each as a substantive paragraph, not a single sentence.

SLIDE 5 — OPPORTUNITIES
Title: "Opportunities for Diplomatic Action"
Content: 2-3 specific diplomatic openings or de-escalation windows. For each, specify: the recommended action, the responsible actor or office, the window of opportunity, and the conditions under which the opening would close. Frame as actionable recommendations for senior leadership.

SLIDE 6 — INFORMATION GAPS
Title: "Information Gaps"
Content: 2-3 questions that this briefing cannot answer due to insufficient data. Frame each as: "Reporting is insufficient to assess whether..." followed by an explanation of why this gap matters for decision-making.

SLIDE 7 — UPCOMING DECISION POINTS
Title: "Upcoming Decision Points and Key Dates"
Content: Chronological list of events, deadlines, and milestones in the coming 30-90 days that require senior-level attention. Use standard diplomatic date format: DD Month YYYY. For each, note the decision required and the responsible entity.

FORMAT RULES:
- Use standard diplomatic date format: DD Month YYYY.
- All actors referred to by their names from the situation data.
- No contractions. Formal register throughout.
- Hedging calibration: HIGH confidence = "it is assessed that", MEDIUM = "available information suggests", LOW = "it cannot be confirmed whether".
- Every factual claim should have a bracketed source tag: [GDELT], [UCDP], [ReliefWeb], [UN News], [PRAXIS Graph], [Web], [AI Assessment].
- Speaker notes for each slide should provide additional analytical depth, anticipated questions from senior leadership, and suggested responses.
- Source attributions should use formal UN citation conventions where possible.`,
      system: `You are a senior political affairs officer in the multilateral diplomacy and peacebuilding practice. You produce analytically rigorous briefing content for the senior principals, envoys, and policy leaders. Your analysis follows professional diplomatic standards: calibrated confidence language, source attribution, formal register, and structured analytical judgments. Speaker notes should provide the depth, nuance, and anticipatory guidance that briefing slides cannot convey. Every assessment must distinguish between what is known, what is assessed, and what remains uncertain.

Use ICD 203 Analytic Standards probability language: 'almost no chance' (<5%), 'very unlikely' (5-20%), 'unlikely' (20-45%), 'roughly even' (45-55%), 'likely' (55-80%), 'very likely' (80-95%), 'almost certain' (>95%). Never use vague hedging.${calibrationSuffix}`,
    });

    if (situationId && ctx.uid) {
      await writeToolDataServer(ctx.uid, situationId, 'briefing', result.output as Record<string, unknown>).catch(
        (err) => console.error('[briefing-generate] persist failed:', err),
      );
      await saveToolOutput({
        uid: ctx.uid,
        situationId,
        toolId: 'briefing_room',
        profileVersion: provenance.profileVersion,
        output: result.output as Record<string, unknown>,
        metadata: { mode: 'full', briefingType },
      }).catch((err) => console.warn('[briefing_room] saveToolOutput failed:', err));
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'briefing-generate');
  }
});
