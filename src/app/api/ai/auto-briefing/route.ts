import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { callProModel, getGroundedModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { buildGraphContext, writeToolDataServer } from '@/lib/ai/context-builder-server';
import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode } from '@/lib/compat/sample-mode';
import { handleRouteError } from '@/lib/api/standard-error';
import { audienceTonePreset, audienceTuningEnabled } from '@/lib/ai/audience-presets';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';
import { searchWeb, isGroundedSearchConfigured } from '@/lib/ai/grounded-research';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

const AutoBriefingSchema = z.object({
  situationName: z.string().describe('Name of the conflict situation'),
  riskLevel: z.enum(['critical', 'high', 'medium', 'low']).describe('Overall risk level as of this brief'),
  trend: z.enum(['escalating', 'stable', 'de-escalating']).describe('Current trajectory of the conflict'),
  headline: z.string().describe('One-sentence headline capturing the most significant current development'),
  keyDevelopments: z.array(z.string()).min(3).max(6).describe('Bullet-point key developments since last brief'),
  securitySituation: z.string().describe('Current security/military situation and key dynamics'),
  politicalDynamics: z.string().describe('Political track status — negotiations, key actor positions, spoiler activity'),
  humanitarianUpdate: z.string().describe('Humanitarian situation — access, displacement, protection concerns'),
  mediaEnvironment: z.string().describe('Information environment — key narratives, media coverage, disinformation'),
  actionItems: z.array(z.string()).min(3).max(6).describe('Prioritized action items for the analyst or mission'),
  nextReview: z.string().describe('When and what to monitor for the next briefing cycle'),
  sourcesSummary: z.string().optional().describe('Brief note on data sources used (deep research mode only)'),
});

const DEMO_RESPONSE = {
  situationName: 'User Workspace',
  riskLevel: 'high' as const,
  trend: 'escalating' as const,
  headline: 'Ceasefire under severe stress: 14 AFN buffer zone violations in 30 days; humanitarian access blocked for 11th consecutive day.',
  keyDevelopments: [
    'UNMN confirmed 14 AFN artillery incidents in buffer zone — highest frequency since ceasefire signing',
    'OCHA convoy blocked at Marka checkpoint for 11th consecutive day; 2.3M civilians without sustained aid access',
    'DRM claims GoN is preparing Kessara corridor offensive; UNMN cannot confirm but reports DRM repositioning',
    'Karovia Foreign Minister cancelled scheduled GoN meeting — no explanation',
    'Financial escrow compliance maintained — only commitment with full implementation this reporting period',
  ],
  securitySituation: 'UNMN reports sustained AFN artillery violations in the 5km buffer zone. No direct engagement, but DRM tactical repositioning increases proximity risk. Joint Ceasefire Monitoring Commission still not established (overdue 45 days), leaving monitoring to ad hoc UNMN patrols only.',
  politicalDynamics: 'Political track stalled. No pre-negotiation contacts this week. Karovia cancellation is the most significant diplomatic signal — possibly indicating displeasure with GoN escalatory behavior, but unconfirmed. AU mediation team reports no progress on ground rules for pre-talks.',
  humanitarianUpdate: 'CRITICAL: Eleven consecutive days of blocked OCHA convoy access. 2.3M people in DRM territory relying on pre-positioned stocks only. MSF reports increasing critical medical cases unable to reach the selected situation City. Nutrition surveillance indicates acute malnutrition increasing in three eastern districts.',
  mediaEnvironment: 'GoN state media amplifying counterterrorism narrative around Kessara. NIMN published buffer zone violation documentation today. International coverage increasing — BBC and Al Jazeera both ran humanitarian crisis features. Operation MIRROR social media campaign actively suppressing UNMN reporting.',
  actionItems: [
    'URGENT: Invoke OCHA escalation mechanism — emergency humanitarian access meeting within 48 hours',
    'Request UNMN formally report buffer zone violations to multilateral forum under S/2025/891 mandate',
    'Senior bilateral engagement with Karovia to clarify FM cancellation signal',
    'Issue joint AU-UN ceasefire compliance statement before international media cycle closes',
    'Brief multilateral forum P3 on deteriorating access ahead of monthly the selected situation consultation',
  ],
  nextReview: '24 hours — monitor Karovian diplomatic signals, OCHA convoy status, and any DRM statement on Kessara',
};

/** Races a promise against a timeout. Returns null instead of throwing on timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export const POST = withCalibration('daily_brief', 'ai_report', {
  retrievalQuery: (_req, body) => {
    const s = body.situation as { name?: string; region?: string } | undefined;
    return [s?.name, s?.region].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, user) => {
  try {
    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    // Credits + profile gate already handled by withCalibration above.

    const body = await request.json();
    const { situation, deepResearch } = body as { situation?: Situation; deepResearch?: boolean };
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';
    const situationId = (situation as Situation | undefined)?.id ?? '';

    // ── 0. Graph context ──
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'daily_brief').catch(() => '')
      : '';

    // ── 1. Live grounded signals (8s timeout — never block the brief on slow research) ──
    let intelContext = '';
    if (situation) {
      const intel = await withTimeout(
        getSituationIntelligence({
          country: situation.region || situation.name,
          query: situation.name,
          limit: 15,
        }),
        8000
      );
      if (intel && intel.events.length > 0) {
        intelContext = '\n\nLIVE GOOGLE-GROUNDED INTELLIGENCE (' + new Date().toDateString() + '):\n' +
          intel.events.slice(0, 10).map(e =>
            `- [${e.source.toUpperCase()}] ${e.date}: ${e.title} (severity: ${e.severity})`
          ).join('\n');
      }
    }

    // ── 2. Deep research: Grounded Search + Google-grounded web search ──
    let webResearchContext = '';
    const sourcesUsed: string[] = [];
    if (deepResearch && situation) {
      const searchQuery = `${situation.name} latest news ${new Date().getFullYear()} conflict situation`;

      // 2a. Grounded Search web search
      if (isGroundedSearchConfigured()) {
        const fcResults = await withTimeout(
          searchWeb(searchQuery, { numResults: 5 }),
          12000
        );
        if (fcResults && fcResults.length > 0) {
          sourcesUsed.push(`Grounded Search (${fcResults.length} sources)`);
          webResearchContext += '\n\nGrounded Search WEB RESEARCH (live):\n' +
            fcResults.map(r =>
              `SOURCE: ${r.title} | ${r.url}\n${r.content.slice(0, 1200)}`
            ).join('\n\n---\n');
        }
      }

      // 2b. Google Search grounding via Gemini
      const groundedResult = await withTimeout(
        generateText({
          model: getGroundedModel(),
          prompt: `Current date: ${new Date().toDateString()}. Search for and summarize the very latest developments (last 7 days) in: ${situation.name}. Context: ${sitContext}. Provide: (1) Recent headlines with dates, (2) Security/military updates, (3) Diplomatic or political developments, (4) Humanitarian situation. Be specific with facts and dates. Max 600 words.`,
        }),
        15000
      );
      if (groundedResult?.text) {
        sourcesUsed.push('Google Search grounding');
        webResearchContext += '\n\nGOOGLE-GROUNDED REAL-TIME RESEARCH:\n' + groundedResult.text.slice(0, 2000);
      }
    }

    // ── 3. Generate structured brief ──
    const deepResearchNote = deepResearch && webResearchContext
      ? '\n\n⚡ DEEP RESEARCH MODE: You have live web search results and Google-grounded research above. Prioritize this fresh real-time information. Be specific about what the sources say.'
      : '';

    // Calibrated analyst-profile + situation-frame + output-constraints
    const { systemPromptBlock, outputConstraints, provenance } = user.calibration;
    const langDirective = outputConstraints.language !== 'en'
      ? `\n\nRESPOND IN: ${outputConstraints.language.toUpperCase()}.`
      : '';
    const redLineDirective = outputConstraints.redLineClauses.length
      ? `\n\nRED LINES — DO NOT:\n${outputConstraints.redLineClauses.map(r => `  - ${r}`).join('\n')}`
      : '';
    // Audience tone preset — explicit, tool-side reinforcement of the audience
    // already in the systemPromptBlock. Behind a feature flag so we can stage
    // before flipping it on for everyone. See src/lib/ai/audience-presets.ts.
    const audienceDirective = audienceTuningEnabled()
      ? `\n\n${audienceTonePreset(outputConstraints.audienceTone)}`
      : '';

    const result = await callProModel({
      output: Output.object({ schema: AutoBriefingSchema }),
      prompt: `${graphCtx ? `${graphCtx}\n\n` : ''}${sitContext ? `SITUATION CONTEXT:\n${sitContext}\n` : ''}${intelContext}${webResearchContext}${deepResearchNote}

Generate a daily intelligence brief for this conflict situation in professional morning note format.

RISK LEVEL: critical = active large-scale hostilities or atrocity risk; high = significant violations or blocked access; medium = tension but process ongoing; low = stable, implementation on track.
TREND: escalating = increasing violence or diplomatic deterioration; stable = no significant change; de-escalating = fewer incidents, positive signals.

STRUCTURE:
1. headline: single most significant development (one sentence)
2. keyDevelopments: 3-5 specific factual bullet points
3. securitySituation: military/security dynamics with specific indicators
4. politicalDynamics: negotiation track, actor positions, spoiler activity
5. humanitarianUpdate: access, displacement, protection (flag CRITICAL if warranted)
6. mediaEnvironment: narratives, international coverage, info operations
7. actionItems: 3-5 concrete, time-bound recommendations
8. nextReview: specific monitoring triggers for next cycle
${deepResearch ? '9. sourcesSummary: which sources (web crawler/grounded search/user sources) informed this brief' : ''}

Be specific and evidence-grounded. Write for a senior diplomatic representative's morning briefing.`,
      system: `You are a senior senior multilateral diplomacy practitioner writing the daily morning intelligence brief for the Special Representative. Be precise, specific, and actionable. Apply a professional morning note standard.

${systemPromptBlock}

Calibrate the brief to the analyst profile above (role, lens, audience). Honour the output-constraints block.${langDirective}${redLineDirective}${audienceDirective}`,
    });

    // Attach source metadata for deep research
    const output = result.output as Record<string, unknown>;
    if (deepResearch && sourcesUsed.length > 0 && !output.sourcesSummary) {
      output.sourcesSummary = `Sources: ${sourcesUsed.join(', ')}${intelContext ? ', Google-grounded intelligence' : ''}`;
    }

    if (situationId && user.uid) {
      await writeToolDataServer(user.uid, situationId, 'daily_brief', output).catch(
        (err) => console.error('[auto-briefing] persist failed:', err),
      );
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'daily_brief',
        profileVersion: provenance.profileVersion,
        output,
      }).catch((err) => console.warn('[auto-briefing] saveToolOutput failed:', err));
    }
    return NextResponse.json(output);
  } catch (err) {
    return handleRouteError(err, 'auto-briefing');
  }
});
