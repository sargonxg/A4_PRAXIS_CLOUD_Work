import { streamText } from 'ai';
import { getProModel } from '@/lib/ai/providers';
import { buildToolContext } from '@/lib/ai/situation-context';
import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { buildGraphContext } from '@/lib/ai/context-builder-server';
import { searchWeb } from '@/lib/ai/firecrawl';
import { GLOBAL_MEDIA_SOURCES, getSourcesForRegion } from '@/lib/constants/global-media-sources';
import { isServerDemoMode, formatAsStreamResponse, getCachedResponse } from '@/lib/demo/demo-mode';
import type { Situation } from '@/types/situation';

export const maxDuration = 60;

export const POST = withAuth(async (request, user) => {
  try {
    const { situation, timeRange = '24h', maxSections = 8, customQueries } = await request.json();

    if (isServerDemoMode()) {
      const cached = getCachedResponse('chat', 'greeting');
      if (cached) return formatAsStreamResponse(cached);
      return new Response(JSON.stringify({ error: 'AI not configured' }), { status: 503 });
    }

    const creditCheck = await checkAndDeductCredits('media-roundup', 'Media Roundup');
    if (!creditCheck.allowed) return creditCheck.response;

    const sit = situation as unknown as Situation | undefined;
    const sitContext = sit ? buildToolContext(sit) : '';
    const region = sit?.region || '';
    const situationId = sit?.id ?? '';
    const graphCtx = situationId
      ? await buildGraphContext(user.uid, situationId, 'media_roundup').catch(() => '')
      : '';

    // Build time-filtered search queries
    const timeLabel = timeRange === '24h' ? 'past 24 hours' : timeRange === '48h' ? 'past 48 hours' : timeRange === '7d' ? 'past week' : 'recent';

    const baseQueries = sit
      ? [
          `${sit.name} latest developments ${timeLabel}`,
          `${sit.name} ${sit.actors.slice(0, 3).join(' ')} news`,
          `${region} conflict security update`,
          `${sit.name} humanitarian situation`,
          `${sit.name} diplomatic negotiations`,
        ]
      : ['global conflict update'];

    const queries = [...baseQueries, ...(customQueries || [])].slice(0, 8);

    // Execute searches in parallel
    const allResults = [];
    for (const q of queries) {
      try {
        const results = await searchWeb(q, { numResults: 5 });
        allResults.push(...results.map((r) => ({ ...r, query: q })));
      } catch {
        // Continue with other queries
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = allResults.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    // Score each result using media source database
    const regionSources = region ? getSourcesForRegion(region) : GLOBAL_MEDIA_SOURCES;
    const scoredResults = unique.map((r) => {
      let reliability = 0.5;
      let sourceName = 'Unknown';
      try {
        const hostname = new URL(r.url).hostname.replace('www.', '');
        const match = regionSources.find((s) => hostname.includes(s.url.replace('www.', '')));
        if (match) {
          reliability = match.reliability;
          sourceName = match.name;
        } else {
          sourceName = hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
        }
      } catch { /* keep defaults */ }

      // Importance score: reliability * recency * relevance
      const score = reliability * 10;

      return {
        title: r.title || 'Untitled',
        url: r.url,
        snippet: (r.description || r.content || '').slice(0, 500),
        source: sourceName,
        reliability,
        score,
        query: r.query,
      };
    });

    // Sort by score, take top results up to page budget
    scoredResults.sort((a, b) => b.score - a.score);
    const topResults = scoredResults.slice(0, maxSections * 3);

    // Build source summary for the AI
    const sourceText = topResults.map((r, i) =>
      `[${i + 1}] ${r.source} (reliability: ${(r.reliability * 100).toFixed(0)}%) — ${r.title}\n${r.snippet}\nURL: ${r.url}`
    ).join('\n\n---\n\n');

    // Stream the roundup
    const systemCtx = graphCtx ? `${graphCtx}\n\n${sitContext}` : sitContext;
    const result = streamText({
      model: getProModel(),
      system: `You are PRAXIS Media Intelligence, a professional media roundup generator for conflict/policy analysts.

${systemCtx}

Generate a structured media intelligence roundup. Format as a professional briefing document.`,
      prompt: `Generate a Media Intelligence Roundup based on these ${topResults.length} sources gathered in the ${timeLabel}.

SOURCES:
${sourceText}

INSTRUCTIONS:
1. Organize into ${maxSections} thematic sections (e.g., "Military Developments", "Diplomatic Activity", "Humanitarian Situation", "Regional Dynamics")
2. Each section: 2-3 key developments with source citations [Source Name]
3. Rate each development: CRITICAL / IMPORTANT / NOTABLE
4. Flag any contradictions between sources
5. End with "Intelligence Gaps" — what we still don't know
6. End with "Recommended Actions" — what the analyst should do next

Use markdown formatting. Be concise but substantive. Every claim must cite its source.
If fewer than 5 sources were found, note the limited coverage and suggest additional research queries.`,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error('[media-roundup] Error:', err);
    return new Response(JSON.stringify({ error: 'Media roundup generation failed' }), { status: 500 });
  }
});
