import { withCalibration } from '@/lib/api/with-calibration';
import { z } from 'zod';
import { scrapeUrl } from '@/lib/ai/grounded-research';
import { buildLiveSourcePack } from '@/lib/ai/live-source-pack';
import {
  extractEntities,
  mergeExtractions,
  toFirestoreGraph,
  type ExtractionResult,
} from '@/lib/services/entity-extraction';
import { createGraphUpdateProposalsFromGraphData } from '@/lib/firebase/graph-updates-service';
import { saveToolData } from '@/lib/firebase/tool-data-service';
import { runCanonicalPreCheck, formatPreCheckContext } from '@/lib/services/canonical-precheck';
import { isServerDemoMode } from '@/lib/demo/demo-mode';
import { saveToolOutput } from '@/lib/api/save-tool-output';

export const maxDuration = 180;

const ResearchExtractRequestSchema = z.object({
  situationId: z.string().min(1),
  situationName: z.string().min(2),
  region: z.string().optional().default(''),
  actors: z.array(z.string().min(1)).max(30).optional().default([]),
  categories: z.array(z.string().min(1)).max(8).optional().default([
    'conflict-security',
    'diplomatic-official',
    'think-tanks',
  ]),
  urls: z.array(z.string().url()).max(12).optional().default([]),
  maxSourcesPerCategory: z.number().int().min(1).max(5).optional().default(2),
});

/**
 * Research-Extract Pipeline
 *
 * Active intelligence gathering: searches the web for a conflict situation,
 * scrapes relevant sources, extracts ACO v2.0 entities, and proposes updates
 * for the situation's knowledge graph — all in one call.
 *
 * Steps:
 *   1. Canonical pre-check (validate current facts via Google Search grounding)
 *   2. Web search for the situation across multiple source categories
 *   3. Scrape top results
 *   4. Extract ACO entities from each source (with cross-source deduplication)
 *   5. Propose graph updates for analyst review
 *   6. Return consolidated results
 *
 * Request body:
 *   - situationId: string (required)
 *   - situationName: string (required)
 *   - region: string
 *   - actors: string[]
 *   - categories: string[] — source categories to search
 *   - urls: string[] — additional URLs to scrape and extract from
 *   - maxSourcesPerCategory: number (default 2)
 */
export const POST = withCalibration('research-extract', 'ai_research', {
  retrievalQuery: (_req, body) => {
    const name = typeof body.situationName === 'string' ? body.situationName : '';
    const region = typeof body.region === 'string' ? body.region : '';
    return [name, region].filter(Boolean).join(' ') || undefined;
  },
})(async (req, user) => {
  if (user.isDemo || isServerDemoMode()) {
    return Response.json({ error: 'Not available for this session' }, { status: 403 });
  }

  try {
    const rawBody = await req.json().catch(() => null);
    const parsedBody = ResearchExtractRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return Response.json(
        {
          error: 'Invalid research-extract request.',
          details: parsedBody.error.flatten(),
        },
        { status: 400 },
      );
    }
    const {
      situationId,
      situationName,
      region,
      actors,
      categories,
      urls,
      maxSourcesPerCategory,
    } = parsedBody.data;

    // Credits + profile gate already handled by withCalibration above.

    const searchQuery = `${situationName}${region ? ` ${region}` : ''}`;

    // ── Step 1: Canonical pre-check ────────────────────────────────
    let preCheckContext = '';
    try {
      const preCheck = await runCanonicalPreCheck({
        situationName,
        region: region || '',
        actors,
      });
      preCheckContext = formatPreCheckContext(preCheck);

      // Persist pre-check results
      await saveToolData(user.uid, situationId, 'canonical-precheck', preCheck).catch(() => {});
    } catch {
      // Continue without pre-check
    }

    const situationContext = `Situation: ${situationName}. Region: ${region || 'unknown'}. Known actors: ${actors.join(', ') || 'not specified'}.${preCheckContext ? `\n${preCheckContext}` : ''}`;

    // ── Step 2: Gather sources ─────────────────────────────────────
    const CATEGORY_TERMS: Record<string, string> = {
      'conflict-security': 'armed conflict violence escalation ceasefire security',
      'diplomatic-official': 'diplomatic negotiations peace talks UN resolution',
      'think-tanks': 'analysis policy brief expert assessment scenario',
      'humanitarian': 'humanitarian crisis displacement refugees protection',
      'news-media': 'latest developments situation update',
      'military': 'military forces weapons troop movements armed groups',
      'economic': 'economic sanctions poverty development trade',
    };

    interface SourceContent {
      url: string;
      title: string;
      content: string;
      category: string;
    }

    const sources: SourceContent[] = [];

    // Search web per category. Live Source Pack gives us grounded Google
    // Search first, optional scrape excerpts, and UCDP corroboration without
    // requiring Grounded Search to be configured.
    const searchPromises = categories
      .filter((cat: string) => CATEGORY_TERMS[cat])
      .slice(0, 6)
      .map(async (cat: string) => {
        const terms = CATEGORY_TERMS[cat];
        try {
          const pack = await buildLiveSourcePack({
            uid: user.uid,
            situationName,
            query: `${searchQuery} ${terms}`,
            toolId: `research-extract:${cat}`,
            region,
            actors,
            description: situationContext,
            maxResults: maxSourcesPerCategory,
            scrapeTop: 1,
          });

          const scrapedSources = pack.scraped
            .filter((s) => s.success && s.content.length >= 100)
            .map((s) => ({
              url: s.url,
              title: s.title,
              content: s.content,
              category: cat,
            }));
          const snippetSources = pack.results
            .filter((r) => r.url && (r.content || r.snippet))
            .slice(0, Math.max(1, maxSourcesPerCategory - scrapedSources.length))
            .map((r) => ({
              url: r.url,
              title: r.title,
              content: r.content || r.snippet || r.title,
              category: cat,
            }));

          return [...scrapedSources, ...snippetSources];
        } catch {
          return [];
        }
      });

    const searchResults = await Promise.all(searchPromises);
    sources.push(...searchResults.flat());

    // Scrape user-provided URLs
    if (urls.length > 0) {
      const scrapePromises = urls.map(async (url: string) => {
        try {
          const result = await scrapeUrl(url);
          if (result?.success && result.content) {
            return {
              url,
              title: result.title || new URL(url).hostname,
              content: result.content,
              category: 'user-provided',
            };
          }
        } catch {
          // Skip failed scrapes
        }
        return null;
      });

      const scraped = await Promise.all(scrapePromises);
      sources.push(...scraped.filter((s): s is SourceContent => s !== null));
    }

    if (sources.length === 0) {
      return Response.json({
        error: 'No sources could be retrieved from grounded search, optional scrapers, or provided URLs.',
      }, { status: 422 });
    }

    // ── Step 3: Extract entities from each source ──────────────────
    let consolidated: ExtractionResult = {
      nodes: [],
      edges: [],
      timeline: [],
      summary: '',
      extractedAt: new Date().toISOString(),
    };

    const sourceResults: Array<{
      url: string;
      title: string;
      category: string;
      nodeCount: number;
      edgeCount: number;
    }> = [];

    for (const source of sources) {
      if (!source.content || source.content.length < 100) continue;

      try {
        const extraction = await extractEntities(source.content, {
          sourceUrl: source.url,
          sourceName: source.title,
          situationContext,
          existingNodeIds: consolidated.nodes.map((n) => n.id),
        });

        if (consolidated.nodes.length === 0) {
          // First extraction — use as base
          consolidated = extraction;
        } else {
          // Merge into existing
          const merged = mergeExtractions(
            { nodes: consolidated.nodes, edges: consolidated.edges },
            extraction,
          );
          consolidated.nodes = merged.nodes;
          consolidated.edges = merged.edges;
          // Merge timelines
          consolidated.timeline = [
            ...consolidated.timeline,
            ...extraction.timeline,
          ].sort((a, b) => a.date.localeCompare(b.date));
        }

        sourceResults.push({
          url: source.url,
          title: source.title,
          category: source.category,
          nodeCount: extraction.nodes.length,
          edgeCount: extraction.edges.length,
        });
      } catch (err) {
        console.warn(`[research-extract] Failed to extract from ${source.url}:`, err);
      }
    }

    // ── Step 4: Propose updates to situation graph ──────────────────
    const now = new Date().toISOString();
    const firestoreData = toFirestoreGraph(consolidated);
    let proposalSummary = { proposalIds: [] as string[], nodesProposed: 0, edgesProposed: 0 };

    try {
      proposalSummary = await createGraphUpdateProposalsFromGraphData({
        uid: user.uid,
        situationId,
        extractor: 'api/ai/research-extract',
        graph: {
          nodes: firestoreData.nodes.map((n) => ({
            id: n.id,
            type: n.type,
            label: n.label,
            properties: {},
            createdAt: now,
            source: 'web-research' as const,
            metadata: n.metadata,
          })),
          edges: firestoreData.edges.map((e, i) => ({
            id: `${e.source}-${e.type}-${e.target}-${i}`,
            source: e.source,
            target: e.target,
            type: e.type,
            weight: e.weight,
            metadata: e.metadata,
          })),
        },
      });

      // Save extraction metadata
      await saveToolData(user.uid, situationId, 'last-research-extract', {
        sourcesSearched: sources.length,
        sourcesExtracted: sourceResults.length,
        totalNodes: consolidated.nodes.length,
        totalEdges: consolidated.edges.length,
        graphWriteMode: 'proposal-first',
        graphProposalIds: proposalSummary.proposalIds,
        newNodesAdded: 0,
        newEdgesAdded: 0,
        nodesProposed: proposalSummary.nodesProposed,
        edgesProposed: proposalSummary.edgesProposed,
        categories,
        extractedAt: now,
        summary: consolidated.summary,
      }).catch(() => {});
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'research-extract',
        profileVersion: user.calibration.provenance.profileVersion,
        output: {
          nodeCount: consolidated.nodes.length,
          edgeCount: consolidated.edges.length,
          sourcesSearched: sources.length,
          sourcesExtracted: sourceResults.length,
          graphWriteMode: 'proposal-first',
          graphProposalsCreated: proposalSummary.proposalIds.length,
          summary: consolidated.summary,
          extractedAt: now,
        },
        metadata: {
          categories,
          sourceUrls: sourceResults.map((s) => s.url).slice(0, 20),
        },
      }).catch((err) => console.warn('[research-extract] saveToolOutput failed:', err));
    } catch (err) {
      console.error('[research-extract] Failed to propose graph updates:', err);
    }

    // ── Step 5: Return results ─────────────────────────────────────
    const typeCounts: Record<string, number> = {};
    for (const node of consolidated.nodes) {
      typeCounts[node.primitive_type] = (typeCounts[node.primitive_type] || 0) + 1;
    }

    return Response.json({
      nodeCount: consolidated.nodes.length,
      edgeCount: consolidated.edges.length,
      typeCounts,
      sourcesSearched: sources.length,
      sourcesExtracted: sourceResults.length,
      sources: sourceResults,
      timeline: consolidated.timeline,
      summary: consolidated.summary,
      nodes: consolidated.nodes,
      edges: consolidated.edges,
      graphWriteMode: 'proposal-first',
      graphProposalsCreated: proposalSummary.proposalIds.length,
      nodesProposed: proposalSummary.nodesProposed,
      edgesProposed: proposalSummary.edgesProposed,
      extractedAt: now,
    });
  } catch (err) {
    console.error('[research-extract] Error:', err);
    return Response.json({ error: 'Research-extract pipeline failed' }, { status: 500 });
  }
});
