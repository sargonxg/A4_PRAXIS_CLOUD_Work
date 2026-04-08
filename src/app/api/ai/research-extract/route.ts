import { withAuth } from '@/lib/api/with-auth';
import { checkAndDeductCredits } from '@/lib/api/with-credits';
import { scrapeUrl, searchWeb, isFirecrawlConfigured } from '@/lib/ai/firecrawl';
import {
  extractEntities,
  mergeExtractions,
  toFirestoreGraph,
  type ExtractionResult,
} from '@/lib/services/entity-extraction';
import { getGraph, saveGraph, saveSnapshot } from '@/lib/firebase/graph-service';
import { saveToolData } from '@/lib/firebase/tool-data-service';
import { runCanonicalPreCheck, formatPreCheckContext } from '@/lib/services/canonical-precheck';

export const maxDuration = 180;

/**
 * Research-Extract Pipeline
 *
 * Active intelligence gathering: searches the web for a conflict situation,
 * scrapes relevant sources, extracts ACO v2.0 entities, and merges them
 * into the situation's knowledge graph — all in one call.
 *
 * Steps:
 *   1. Canonical pre-check (validate current facts via Google Search grounding)
 *   2. Web search for the situation across multiple source categories
 *   3. Scrape top results
 *   4. Extract ACO entities from each source (with cross-source deduplication)
 *   5. Merge into situation graph (with snapshot for evolution tracking)
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
export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return Response.json({ error: 'Not available in demo mode' }, { status: 403 });
  }

  try {
    const {
      situationId,
      situationName,
      region,
      actors = [],
      categories = ['conflict-security', 'diplomatic-official', 'think-tanks'],
      urls = [],
      maxSourcesPerCategory = 2,
    } = await req.json();

    if (!situationId || !situationName) {
      return Response.json({ error: 'situationId and situationName required' }, { status: 400 });
    }

    const creditCheck = await checkAndDeductCredits('ai_research', 'Research & extract pipeline');
    if (!creditCheck.allowed) return creditCheck.response;

    const searchQuery = `${situationName}${region ? ` ${region}` : ''}`;
    const firecrawlAvailable = isFirecrawlConfigured();

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

    // Search web per category
    if (firecrawlAvailable) {
      const searchPromises = categories
        .filter((cat: string) => CATEGORY_TERMS[cat])
        .map(async (cat: string) => {
          const terms = CATEGORY_TERMS[cat];
          try {
            const results = await searchWeb(`${searchQuery} ${terms}`, {
              numResults: maxSourcesPerCategory,
            });
            return results.map((r) => ({
              url: r.url,
              title: r.title,
              content: r.content,
              category: cat,
            }));
          } catch {
            return [];
          }
        });

      const searchResults = await Promise.all(searchPromises);
      sources.push(...searchResults.flat());
    }

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
        error: 'No sources could be retrieved. Ensure Firecrawl API key is configured or provide URLs.',
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

    // ── Step 4: Merge into situation graph ──────────────────────────
    const now = new Date().toISOString();
    const firestoreData = toFirestoreGraph(consolidated);

    try {
      // Save snapshot before merging for evolution tracking
      await saveSnapshot(user.uid, situationId, 'research-extract');

      const existingGraph = await getGraph(user.uid, situationId);
      const existingNodeIds = new Set((existingGraph?.nodes || []).map((n) => n.id));
      const existingEdgeKeys = new Set(
        (existingGraph?.edges || []).map((e) => `${e.source}|${e.type}|${e.target}`),
      );

      const newNodes = firestoreData.nodes
        .filter((n) => !existingNodeIds.has(n.id))
        .map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          properties: {} as Record<string, string | number>,
          createdAt: now,
          source: 'web-research' as const,
          metadata: n.metadata,
        }));

      const newEdges = firestoreData.edges
        .filter((e) => !existingEdgeKeys.has(`${e.source}|${e.type}|${e.target}`))
        .map((e, i) => ({
          id: `${e.source}-${e.type}-${e.target}-${i}`,
          source: e.source,
          target: e.target,
          type: e.type,
          weight: e.weight,
          metadata: e.metadata,
        }));

      await saveGraph(user.uid, situationId, {
        nodes: [...(existingGraph?.nodes || []), ...newNodes],
        edges: [...(existingGraph?.edges || []), ...newEdges],
      });

      // Save extraction metadata
      await saveToolData(user.uid, situationId, 'last-research-extract', {
        sourcesSearched: sources.length,
        sourcesExtracted: sourceResults.length,
        totalNodes: consolidated.nodes.length,
        totalEdges: consolidated.edges.length,
        newNodesAdded: newNodes.length,
        newEdgesAdded: newEdges.length,
        categories,
        extractedAt: now,
        summary: consolidated.summary,
      }).catch(() => {});
    } catch (err) {
      console.error('[research-extract] Failed to merge into graph:', err);
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
      extractedAt: now,
    });
  } catch (err) {
    console.error('[research-extract] Error:', err);
    return Response.json({ error: 'Research-extract pipeline failed' }, { status: 500 });
  }
});
