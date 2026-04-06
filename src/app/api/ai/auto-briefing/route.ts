import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel, getGroundedModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { withAuth } from '@/lib/api/with-auth';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';
import { searchWeb, isFirecrawlConfigured } from '@/lib/ai/firecrawl';
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
  situationName: 'Nordalia Crisis',
  riskLevel: 'high' as const,
  trend: 'escalating' as const,
  headline: 'Ceasefire under severe stress: 14 AFN buffer zone violations in 30 days; humanitarian access blocked for 11th consecutive day.',
  keyDevelopments: [
    'UNMN confirmed 14 AFN artillery incidents in buffer zone — highest frequency since ceasefire signing',
    'OCHA convoy blocked at Marka checkpoint for 11th consecutive day; 2.3M civilians without sustained aid access',
    'DRM claims GoN is preparing Kessara corridor offensive; UNMN cannot confirm but reports DRM repositioning',
    'Karovia Foreign Minister cancelled scheduled GoN meeting — no explanation',
    'World Bank escrow compliance maintained — only commitment with full implementation this reporting period',
  ],
  securitySituation: 'UNMN reports sustained AFN artillery violations in the 5km buffer zone. No direct engagement, but DRM tactical repositioning increases proximity risk. Joint Ceasefire Monitoring Commission still not established (overdue 45 days), leaving monitoring to ad hoc UNMN patrols only.',
  politicalDynamics: 'Political track stalled. No pre-negotiation contacts this week. Karovia cancellation is the most significant diplomatic signal — possibly indicating displeasure with GoN escalatory behavior, but unconfirmed. AU mediation team reports no progress on ground rules for pre-talks.',
  humanitarianUpdate: 'CRITICAL: Eleven consecutive days of blocked OCHA convoy access. 2.3M people in DRM territory relying on pre-positioned stocks only. MSF reports increasing critical medical cases unable to reach Nordalia City. Nutrition surveillance indicates acute malnutrition increasing in three eastern districts.',
  mediaEnvironment: 'GoN state media amplifying counterterrorism narrative around Kessara. NIMN published buffer zone violation documentation today. International coverage increasing — BBC and Al Jazeera both ran humanitarian crisis features. Operation MIRROR social media campaign actively suppressing UNMN reporting.',
  actionItems: [
    'URGENT: Invoke OCHA escalation mechanism — emergency humanitarian access meeting within 48 hours',
    'Request UNMN formally report buffer zone violations to UNSC under S/2025/891 mandate',
    'Senior bilateral engagement with Karovia to clarify FM cancellation signal',
    'Issue joint AU-UN ceasefire compliance statement before international media cycle closes',
    'Brief UNSC P3 on deteriorating access ahead of monthly Nordalia consultation',
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

export const POST = withAuth(async (request, _user) => {
  try {
    const creditCheck = await checkAndDeductCredits('ai_morning_digest', 'Daily intelligence brief');
    if (!creditCheck.allowed) return creditCheck.response!;

    if (isServerDemoMode()) {
      return NextResponse.json(DEMO_RESPONSE);
    }

    const body = await request.json();
    const { situation, deepResearch } = body as { situation?: Situation; deepResearch?: boolean };
    const sitContext = situation ? buildToolContext(situation as unknown as Situation) : '';

    // ── 1. Live intel feeds (8s timeout — never block the brief on slow feeds) ──
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
        intelContext = '\n\nLIVE INTEL FEED (ACLED/GDELT/ReliefWeb — ' + new Date().toDateString() + '):\n' +
          intel.events.slice(0, 10).map(e =>
            `- [${e.source.toUpperCase()}] ${e.date}: ${e.title} (severity: ${e.severity})`
          ).join('\n');
      }
    }

    // ── 2. Deep research: Firecrawl + Google-grounded web search ──
    let webResearchContext = '';
    const sourcesUsed: string[] = [];
    if (deepResearch && situation) {
      const searchQuery = `${situation.name} latest news ${new Date().getFullYear()} conflict situation`;

      // 2a. Firecrawl web search
      if (isFirecrawlConfigured()) {
        const fcResults = await withTimeout(
          searchWeb(searchQuery, { numResults: 5 }),
          12000
        );
        if (fcResults && fcResults.length > 0) {
          sourcesUsed.push(`Firecrawl (${fcResults.length} sources)`);
          webResearchContext += '\n\nFIRECRAWL WEB RESEARCH (live):\n' +
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

    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: AutoBriefingSchema }),
      prompt: `${sitContext ? `SITUATION CONTEXT:\n${sitContext}\n` : ''}${intelContext}${webResearchContext}${deepResearchNote}

Generate a daily intelligence brief for this conflict situation in UN DPPA Morning Note format.

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
${deepResearch ? '9. sourcesSummary: which sources (Firecrawl/grounded search/GDELT/ACLED) informed this brief' : ''}

Be specific and evidence-grounded. Write for a senior UN Special Representative's morning briefing.`,
      system: 'You are a senior UN DPPA political affairs officer writing the daily morning intelligence brief for the Special Representative. Be precise, specific, and actionable. Apply the UN Morning Note standard.',
    });

    // Attach source metadata for deep research
    const output = result.output as Record<string, unknown>;
    if (deepResearch && sourcesUsed.length > 0 && !output.sourcesSummary) {
      output.sourcesSummary = `Sources: ${sourcesUsed.join(', ')}${intelContext ? ', ACLED/GDELT/ReliefWeb feeds' : ''}`;
    }

    return NextResponse.json(output);
  } catch (err) {
    return handleRouteError(err, 'auto-briefing');
  }
});
