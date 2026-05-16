import { withCalibration } from '@/lib/api/with-calibration';
import { saveToolOutput } from '@/lib/api/save-tool-output';
import { isServerDemoMode } from '@/lib/compat/sample-mode';
import {
  extractEntities,
  mergeExtractions,
  toFirestoreGraph,
  type ExtractionResult,
} from '@/lib/services/entity-extraction';
import { scrapeUrl, searchWeb, isGroundedSearchConfigured } from '@/lib/ai/grounded-research';
import { saveToolData } from '@/lib/firebase/tool-data-service';
import { createGraphUpdateProposalsFromGraphData } from '@/lib/firebase/graph-updates-service';

export const maxDuration = 120;

/**
 * ACO v2.0 Entity Extraction Route
 *
 * Modes:
 *   1. text   — Extract entities from provided text
 *   2. url    — Scrape a URL then extract entities
 *   3. search — Search the web for a query, scrape top results, extract entities
 *
 * All modes produce structured ACO v2.0 entities (14 types) with relationships,
 * temporal metadata, confidence levels, and provenance tracking.
 *
 * Optionally merges results into the situation's existing graph.
 */
export const POST = withCalibration('conflict_graph', 'ai_analysis', {
  retrievalQuery: (_req, body) => {
    const q = typeof body.searchQuery === 'string' ? body.searchQuery : '';
    const ctx = typeof body.situationContext === 'string' ? body.situationContext : '';
    return [q, ctx].filter(Boolean).join(' — ') || undefined;
  },
})(async (request, user) => {
  if (isServerDemoMode()) {
    return Response.json({ error: 'Entity extraction requires a live AI connection.' }, { status: 503 });
  }

  try {
    const {
      text,
      url,
      searchQuery,
      situationId,
      situationContext,
      mergeIntoGraph = false,
      maxResults = 3,
    } = await request.json();

    if (!text && !url && !searchQuery) {
      return Response.json(
        { error: 'Provide text, url, or searchQuery for extraction' },
        { status: 400 },
      );
    }

    // Credits + profile gate already handled by withCalibration above.

    // Calibration context — used to tag provenance and persist output
    const { outputConstraints, provenance } = user.calibration;
    const langHint = outputConstraints.language !== 'en'
      ? ` Output in ${outputConstraints.language.toUpperCase()}.`
      : '';
    const effectiveContext = situationContext
      ? `${situationContext}${langHint}`
      : langHint || undefined;

    let result: ExtractionResult;

    // ── Mode 1: Direct text extraction ─────────────────────────────────────
    if (text) {
      result = await extractEntities(text, {
        sourceName: 'user-provided',
        situationContext: effectiveContext,
      });
    }
    // ── Mode 2: URL scrape + extraction ────────────────────────────────────
    else if (url) {
      const scraped = await scrapeUrl(url);
      if (!scraped?.success || !scraped.content) {
        return Response.json(
          { error: `Failed to scrape URL: ${url}` },
          { status: 422 },
        );
      }
      result = await extractEntities(scraped.content, {
        sourceUrl: url,
        sourceName: scraped.title || new URL(url).hostname,
        situationContext: effectiveContext,
      });
    }
    // ── Mode 3: Web search + multi-source extraction ───────────────────────
    else {
      if (!isGroundedSearchConfigured()) {
        return Response.json(
          { error: 'Web search requires Google AI or Vertex configuration.' },
          { status: 503 },
        );
      }

      const searchResults = await searchWeb(searchQuery, { numResults: maxResults });
      if (searchResults.length === 0) {
        return Response.json(
          { error: `No search results found for: ${searchQuery}` },
          { status: 404 },
        );
      }

      // Extract from first result as primary
      const primary = searchResults[0];
      result = await extractEntities(primary.content, {
        sourceUrl: primary.url,
        sourceName: primary.title || new URL(primary.url).hostname,
        situationContext: effectiveContext,
      });

      // Merge additional results
      for (const sr of searchResults.slice(1)) {
        if (!sr.content || sr.content.length < 100) continue;
        try {
          const additional = await extractEntities(sr.content, {
            sourceUrl: sr.url,
            sourceName: sr.title || new URL(sr.url).hostname,
            situationContext: effectiveContext,
            existingNodeIds: result.nodes.map((n) => n.id),
          });
          const merged = mergeExtractions(
            { nodes: result.nodes, edges: result.edges },
            additional,
          );
          result.nodes = merged.nodes;
          result.edges = merged.edges;
          // Merge timelines
          result.timeline = [
            ...result.timeline,
            ...additional.timeline,
          ].sort((a, b) => a.date.localeCompare(b.date));
        } catch {
          // Continue with what we have
        }
      }
    }

    // ── Optional: propose changes for the situation graph ─────────────────
    if (mergeIntoGraph && situationId && user.uid) {
      try {
        const firestoreData = toFirestoreGraph(result);
        const now = new Date().toISOString();
        const proposed = await createGraphUpdateProposalsFromGraphData({
          uid: user.uid,
          situationId,
          extractor: 'api/ai/extract',
          sourceUrl: result.sourceUrl,
          sourceName: result.sourceName,
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
        await saveToolData(user.uid, situationId, 'last-extraction', {
          sourceUrl: result.sourceUrl,
          sourceName: result.sourceName,
          nodeCount: result.nodes.length,
          edgeCount: result.edges.length,
          extractedAt: result.extractedAt,
          summary: result.summary,
          graphWriteMode: 'proposal-first',
          graphProposalIds: proposed.proposalIds,
          graphNodesProposed: proposed.nodesProposed,
          graphEdgesProposed: proposed.edgesProposed,
        });
      } catch (err) {
        console.error('[extract] Failed to propose graph updates:', err);
      }
    }

    // ── Compute entity type counts ─────────────────────────────────────────
    const typeCounts: Record<string, number> = {};
    for (const node of result.nodes) {
      typeCounts[node.primitive_type] = (typeCounts[node.primitive_type] || 0) + 1;
    }

    const responseBody = {
      nodeCount: result.nodes.length,
      edgeCount: result.edges.length,
      typeCounts,
      nodes: result.nodes,
      edges: result.edges,
      timeline: result.timeline,
      summary: result.summary,
      sourceUrl: result.sourceUrl,
      extractedAt: result.extractedAt,
      tokenUsage: result.tokenUsage,
    };

    // Persist with profile-version provenance
    if (situationId && user.uid) {
      await saveToolOutput({
        uid: user.uid,
        situationId,
        toolId: 'conflict_graph',
        profileVersion: provenance.profileVersion,
        output: responseBody as unknown as Record<string, unknown>,
      }).catch((err) => console.warn('[extract] saveToolOutput failed:', err));
    }

    return Response.json(responseBody);
  } catch (err) {
    console.error('[extract] Error:', err);
    return Response.json({ error: 'Extraction failed' }, { status: 500 });
  }
});
