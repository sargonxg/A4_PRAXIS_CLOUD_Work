import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { handleRouteError } from '@/lib/api/standard-error';
import { writeToolDataServer } from '@/lib/ai/context-builder-server';
import { searchWeb } from '@/lib/ai/firecrawl';
import type { WebSearchResult } from '@/lib/ai/firecrawl';
import type { Situation } from '@/types/situation';

export const maxDuration = 120;

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const PublicationAlertSchema = z.object({
  sourceUrl: z.string().describe('Domain or URL of the source'),
  sourceName: z.string().describe('Human-readable name of the source'),
  publicationTitle: z.string().describe('Title of the new publication'),
  publicationUrl: z.string().describe('Direct URL to the publication'),
  publishedDate: z.string().optional().describe('Publication date if extractable'),
  summary: z.string().describe('2-sentence AI summary of the publication'),
  relevanceScore: z.number().min(0).max(10).describe('Relevance to the active situation (0 to 10)'),
  sourceReliability: z.number().min(0).max(10).describe('Source reliability rating (0 to 10)'),
  craapRating: z.enum(['high', 'medium', 'low']).describe('CRAAP evaluation: high(>18/25), medium(12-18), low(<12)'),
  alertPriority: z.enum(['critical', 'high', 'medium', 'low']).describe('Alert priority based on relevance × reliability'),
});

const SourceMonitorSchema = z.object({
  monitoredSources: z.number().describe('Number of sources scanned in this run'),
  newPublications: z.array(PublicationAlertSchema).describe('New publications found since last scan'),
  coverageGaps: z.array(z.object({
    topic: z.string().describe('Topic with insufficient coverage'),
    recommendedSources: z.array(z.string()).describe('Sources that should cover this but were not found'),
  })).describe('Important topics with limited coverage from tracked sources'),
  sourceHealthSummary: z.array(z.object({
    sourceName: z.string(),
    domain: z.string(),
    lastActivity: z.string().describe('Most recent publication found'),
    publicationCount: z.number().describe('Publications found in this scan'),
    averageRelevance: z.number().min(0).max(10),
  })).describe('Health summary per monitored source'),
  recommendedNewSources: z.array(z.string()).describe('Sources not currently tracked but publishing relevant content'),
  scanTimestamp: z.string().describe('ISO timestamp of this scan'),
});

// ---------------------------------------------------------------------------
// Default source list (used when user has no custom sources configured)
// ---------------------------------------------------------------------------

const DEFAULT_MONITORED_SOURCES = [
  { name: 'International Crisis Group', domain: 'crisisgroup.org', reliability: 9.5 },
  { name: 'ReliefWeb', domain: 'reliefweb.int', reliability: 9.0 },
  { name: 'Human Rights Watch', domain: 'hrw.org', reliability: 8.5 },
  { name: 'Amnesty International', domain: 'amnesty.org', reliability: 8.0 },
  { name: 'UN News', domain: 'news.un.org', reliability: 8.5 },
  { name: 'ACLED', domain: 'acleddata.com', reliability: 9.5 },
  { name: 'SIPRI', domain: 'sipri.org', reliability: 9.0 },
  { name: 'Chatham House', domain: 'chathamhouse.org', reliability: 8.5 },
  { name: 'Foreign Policy', domain: 'foreignpolicy.com', reliability: 7.5 },
  { name: 'IISS', domain: 'iiss.org', reliability: 8.5 },
];

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json() as {
      situation?: Situation;
      customSources?: Array<{ name: string; domain: string; reliability?: number }>;
      action?: 'scan' | 'health';
    };
    const { situation, customSources, action = 'scan' } = body;
    const situationId = situation?.id ?? '';

    const creditCheck = await checkAndDeductCredits('ai_media_scan', 'Source monitor scan');
    if (!creditCheck.allowed) return creditCheck.response;

    const sitCtx = situation ? buildToolContext(situation) : '';
    const sitName = situation?.name || 'the situation';
    const year = new Date().getFullYear();

    const sources = customSources && customSources.length > 0
      ? customSources
      : DEFAULT_MONITORED_SOURCES;

    // --- Scan all sources in parallel ---
    const scanResults = await Promise.allSettled(
      sources.map(async (source) => {
        const query = `site:${source.domain} ${sitName} ${year}`;
        const results = await searchWeb(query, { numResults: 3 });
        return { source, results };
      })
    );

    const allFindings: Array<{ source: typeof sources[0]; results: WebSearchResult[] }> = scanResults
      .filter((r): r is PromiseFulfilledResult<{ source: typeof sources[0]; results: WebSearchResult[] }> =>
        r.status === 'fulfilled'
      )
      .map((r) => r.value);

    // Build context for AI synthesis
    const findingsText = allFindings.map(({ source, results }) =>
      `### ${source.name} (${source.domain}) — reliability: ${source.reliability ?? 7}/10\n` +
      (results.length > 0
        ? results.map((r) =>
            `- **${r.title}** | ${r.publishedDate || 'date unknown'}\n  ${r.description?.slice(0, 200) || ''}\n  URL: ${r.url}`
          ).join('\n')
        : '- No new publications found')
    ).join('\n\n');

    // --- AI synthesis ---
    const result = await generateText({
      model: getProModel(),
      output: Output.object({ schema: SourceMonitorSchema }),
      prompt: `${sitCtx ? `${sitCtx}\n\n` : ''}You are the PRAXIS Source Monitor. Analyze the following publications found across ${sources.length} monitored sources for the situation "${sitName}".

SCAN RESULTS:
${findingsText}

For each publication found:
1. Assess relevance (0 to 10): How directly does this address "${sitName}"? 10 = exclusively about this situation, 1 = tangentially related
2. Apply CRAAP evaluation: Currency (is it recent?), Relevance (to situation?), Authority (credible source?), Accuracy (fact-based?), Purpose (informational vs advocacy). Score 0 to 5 each. Total: high(>18/25), medium(12 to 18), low(<12)
3. Alert priority = high relevance (≥7) + high reliability (≥8) → critical; relevance ≥6 + reliability ≥7 → high; etc.
4. Summarize each publication in 2 sentences

For coverage gaps: identify important topics related to "${sitName}" that none of the sources covered (e.g., specific actor dynamics, humanitarian dimensions, diplomatic developments).

For source health: aggregate per-source statistics from the scan results.

For recommended new sources: based on what's missing in coverage, name 2-3 sources that should be added.

scanTimestamp: "${new Date().toISOString()}"`,
      system: 'You are the PRAXIS Source Monitor, an automated intelligence tracking system. Evaluate publication relevance, source credibility, and coverage gaps for conflict analysts. Produce actionable alerts with precise relevance and reliability assessments.',
    });

    if (situationId && user.uid) {
      await writeToolDataServer(user.uid, situationId, 'media_scan', result.output as Record<string, unknown>).catch(
        (err) => console.error('[media-scan] persist failed:', err),
      );
    }
    return NextResponse.json(result.output);
  } catch (err) {
    return handleRouteError(err, 'media-scan');
  }
});
