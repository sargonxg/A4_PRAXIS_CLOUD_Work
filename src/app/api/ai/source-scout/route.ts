/**
 * POST /api/ai/source-scout
 *
 * Agentic workflow #1 — Source Scout. Finds 5 fresh, defensible sources
 * on the analyst's question that they don't already have in their
 * Sources Library. Powered by:
 *   - `runAgent({ personaId: 'source-scout', ... })` for the persona
 *     role prompt + calibration + corpus context.
 *   - `searchSituationCorpus` to surface what the analyst already
 *     saved (so the model can avoid recommending duplicates).
 *
 * Persistence: `users/{uid}/situations/{sitId}/tools/source-scout`.
 *
 * Spec: docs/IMPROVEMENT_15_2026-04-26.md item #1.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withCalibration } from '@/lib/api/with-calibration';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { validateAiRequest } from '@/lib/api/validate-request';
import { handleRouteError } from '@/lib/api/standard-error';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { runAgent, AgentRunnerError } from '@/lib/agents/run-agent';
import { applySourcePreferences, type SavedSource } from '@/lib/services/sources-preference';
import { getToolData } from '@/lib/firebase/tool-data-service';
import { executeWebResearch } from '@/lib/ai/web-research';
import { buildSourceReceipts, summarizeSourceReceipts } from '@/lib/ai/source-receipts';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Output schema
// ---------------------------------------------------------------------------

const ProposedSourceSchema = z.object({
  /** Publisher / outlet / institution name. */
  name: z.string().min(2),
  /** URL to the specific page or report (not just a homepage). */
  url: z.string().url(),
  /** Why this source matters for THIS question. 1-2 sentences. */
  reason: z.string().min(20),
  /** Reliability tier: `tier_a` = primary peer-reviewed / IGO / treaty body;
   *  `tier_b` = reputable news / think-tank with named author;
   *  `tier_c` = mainstream news desk;
   *  `tier_d` = blog / advocacy / unverified. */
  reliability: z.enum(['tier_a', 'tier_b', 'tier_c', 'tier_d']),
  /** Optional published-at ISO date if known. */
  publishedAt: z.string().optional(),
  /** Whether this source was triangulated against another corpus item. */
  corroborated: z.boolean(),
  /** Source-format hint, helps the analyst plan how to read it. */
  format: z.enum(['report', 'article', 'database', 'speech', 'document', 'multimedia', 'other']),
});

export const SourceScoutSchema = z.object({
  question: z.string().min(5),
  generatedAt: z.string(),
  searchPlan: z.object({
    keywords: z.array(z.string()).min(2).max(20),
    excludedDomains: z.array(z.string()).optional(),
    timeframe: z.enum(['24h', '7d', '30d', '90d', 'no-limit']),
    languages: z.array(z.string()).optional(),
  }),
  proposedSources: z.array(ProposedSourceSchema).min(3).max(8),
  duplicatesAvoided: z.array(z.string()).default([]),
  intelligenceGaps: z.array(z.string()).default([]),
  retrievalTrace: z
    .object({
      layersSearched: z.array(z.string()),
      itemCount: z.number().nonnegative(),
      durationMs: z.number().nonnegative(),
    })
    .optional(),
  sourceReceipts: z.array(z.object({
    receiptId: z.string().optional(),
    sourceId: z.string().optional(),
    name: z.string(),
    title: z.string(),
    url: z.string().optional(),
    provider: z.string(),
    source: z.string(),
    kind: z.enum(['web-result', 'scraped-excerpt', 'structured-data']),
    retrievalMethod: z.enum(['web_search', 'scrape', 'structured_data']).optional(),
    timestamp: z.string(),
    publishedDate: z.string().optional(),
    query: z.string().optional(),
    reliabilityScore: z.number(),
    confidence: z.enum(['high', 'medium', 'low']),
    excerpt: z.string().optional(),
    contentHash: z.string().optional(),
    span: z.object({
      start: z.number().optional(),
      end: z.number().optional(),
      quote: z.string().optional(),
    }).optional(),
  })).default([]),
  sourceAudit: z.object({
    generatedAt: z.string(),
    sourceCount: z.number().nonnegative(),
    providerCounts: z.record(z.string(), z.number()),
    highReliabilityCount: z.number().nonnegative(),
    checkableUrlCount: z.number().nonnegative(),
    scrapedExcerptCount: z.number().nonnegative(),
    structuredDataCount: z.number().nonnegative(),
    confidence: z.enum(['high', 'medium', 'low']),
    gaps: z.array(z.string()),
    notes: z.array(z.string()),
  }).optional(),
});

// ---------------------------------------------------------------------------
// Demo response
// ---------------------------------------------------------------------------

const DEMO_SCOUT = {
  question: 'Demo: latest reporting on the Kessara corridor closure',
  generatedAt: new Date().toISOString(),
  searchPlan: {
    keywords: ['Kessara', 'corridor', 'humanitarian access', 'OCHA', 'AFN'],
    timeframe: '7d' as const,
  },
  proposedSources: [
    {
      name: 'OCHA Situation Report (demo)',
      url: 'https://reliefweb.int/example',
      reason: 'OCHA publishes per-corridor access figures; closes the gap on the convoy denial pattern.',
      reliability: 'tier_a' as const,
      publishedAt: '2026-04-25',
      corroborated: false,
      format: 'report' as const,
    },
    {
      name: 'Crisis Group Briefing (demo)',
      url: 'https://crisisgroup.org/example',
      reason: 'Crisis Group has a the selected situation analyst with a recent briefing on AFN field-commander politics.',
      reliability: 'tier_a' as const,
      corroborated: false,
      format: 'report' as const,
    },
  ],
  duplicatesAvoided: ['ARGUS demo entry — already in the corpus'],
  intelligenceGaps: ['No direct ICRC source on civilian casualty verification.'],
};

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export const POST = withCalibration('source-scout', 'ai_source_scout', {
  retrievalQuery: (_req, body) => {
    const q = typeof body.question === 'string' ? body.question : '';
    const sit = body.situation as { region?: string } | undefined;
    return [q, sit?.region].filter(Boolean).join(' — ') || 'source scouting';
  },
})(async (request, user) => {
  try {
    const body = await request.json().catch(() => ({}));

    const requestSchema = z.object({
      question: z.string().min(5).max(800),
      situation: z.any().optional(),
      timeframe: z.enum(['24h', '7d', '30d', '90d', 'no-limit']).optional(),
      languages: z.array(z.string()).max(8).optional(),
    });

    const validation = validateAiRequest(body, requestSchema);
    if (!validation.success) return validation.response;
    const { question, situation, timeframe, languages } = validation.data;

    if (isServerDemoMode()) {
      return NextResponse.json({ ...DEMO_SCOUT, question });
    }

    const sit = situation as Situation | undefined;
    const situationId = sit?.id ?? '';
    const liveResults = await executeWebResearch(question, sit?.name ?? question, user.uid, {
      toolId: 'source-scout',
      actors: sit?.actors,
      description: sit?.description,
      maxResults: 8,
      timeRange: timeframe === '24h' ? 'day' : timeframe === '7d' ? 'week' : timeframe === '30d' ? 'month' : timeframe === '90d' ? 'year' : undefined,
    }).catch(() => []);
    const sourceReceipts = buildSourceReceipts({ results: liveResults });
    const sourceAudit = summarizeSourceReceipts(
      sourceReceipts,
      liveResults.length ? [] : ['No live web results were retrieved for this scout.'],
    );
    const liveSourceBlock = liveResults.length
      ? liveResults
          .slice(0, 8)
          .map((r, i) => `[${i + 1}] ${r.title} — ${r.source}${r.publishedDate ? ` (${r.publishedDate})` : ''}\n${r.url}\n${(r.snippet ?? r.content).slice(0, 220)}`)
          .join('\n\n')
      : 'No live web results were retrieved; propose only sources you can justify from known authoritative domains and flag the search gap.';

    const extraSystem = `
You are operating as PRAXIS Source Scout. Output a structured search plan plus 5 proposed sources (or as few as 3 when the question is unusually narrow). Never invent URLs. If you cannot find a real URL, omit that source rather than fabricating one.

Reliability tiers:
- tier_a: peer-reviewed, IGO/UN, treaty body, primary archive
- tier_b: reputable think-tank or named-author analysis
- tier_c: mainstream news desk
- tier_d: blog / advocacy / unverified

Avoid duplicates: any source already in the analyst's existing corpus (visible in CORPUS EVIDENCE) must NOT be re-proposed. List the avoided duplicates in duplicatesAvoided[] so the analyst sees what you skipped.

If the timeframe parameter is provided, restrict the searchPlan.timeframe accordingly. If languages[] is provided, weight the search toward those languages.

Always populate intelligenceGaps[] with at least one entry naming a perspective that's still missing after this scout (e.g. "no direct ICRC verification of casualty figures").`;

    const extraPrompt = `\n\nTIMEFRAME: ${timeframe ?? '7d'}` +
      (languages && languages.length > 0 ? `\nLANGUAGES: ${languages.join(', ')}` : '') +
      `\n\nLIVE WEB RESULTS TO PRIORITIZE:\n${liveSourceBlock}`;

    const result = await runAgent({
      personaId: 'source-scout',
      uid: user.uid,
      situationId,
      query: question,
      calibration: user.calibration,
      schema: SourceScoutSchema,
      extraSystem,
      extraPrompt,
      corpusLimit: 12,
    });

    // Apply analyst's Sources Library preferences (Brick #50 round 5):
    // 'preferred' publishers float to the top; 'blocked' publishers are
    // dropped from the output entirely. The model can't see saved
    // sources structurally — we filter post-hoc so the page renders only
    // what the analyst actually wants to see.
    let scoutOutput = result.output as z.infer<typeof SourceScoutSchema>;
    let blockedCount = 0;
    let liftedCount = 0;
    if (situationId) {
      try {
        const lib = await getToolData(user.uid, situationId, 'sources-library').catch(() => null);
        const savedRaw = Array.isArray(lib?.data) ? (lib?.data as unknown[]) : [];
        const saved: SavedSource[] = savedRaw
          .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x))
          .map((x) => ({
            name: typeof x.name === 'string' ? x.name : undefined,
            url: typeof x.url === 'string' ? x.url : undefined,
            domain: typeof x.domain === 'string' ? x.domain : undefined,
            preference: x.preference === 'preferred' || x.preference === 'blocked' ? x.preference : 'neutral',
          }));
        const { kept, blocked, lift } = applySourcePreferences(scoutOutput.proposedSources, saved);
        blockedCount = blocked.length;
        liftedCount = lift.length;
        scoutOutput = { ...scoutOutput, proposedSources: kept };
      } catch (err) {
        console.warn('[source-scout] preference filter failed:', err instanceof Error ? err.message : err);
      }
    }

    const finalOutput = {
      ...scoutOutput,
      retrievalTrace: result.retrievalTrace ?? undefined,
      sourceReceipts,
      sourceAudit,
    };

    if (situationId) {
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'source-scout',
        profileVersion: user.calibration.provenance.profileVersion,
        output: finalOutput as Record<string, unknown>,
        metadata: {
          question,
          timeframe: timeframe ?? '7d',
          languages: languages ?? [],
          retrievalTrace: result.retrievalTrace,
          existingSourcesConsidered: result.corpusItems.length,
          preferenceFilter: { blocked: blockedCount, lifted: liftedCount },
          sourceReceipts,
          sourceAudit,
        },
      }).catch((err) => console.warn('[source-scout] saveToolOutput failed:', err));
    }

    return NextResponse.json(finalOutput);
  } catch (err) {
    if (err instanceof AgentRunnerError) {
      const status = err.code === 'unknown-persona' ? 501 : 502;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    return handleRouteError(err, 'source-scout');
  }
});
