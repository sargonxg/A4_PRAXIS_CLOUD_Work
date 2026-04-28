/**
 * Graph population orchestrator.
 *
 * For a given situation, builds the ACO knowledge graph from available input:
 *   - All uploaded documents (text already extracted by the ingestion pipeline)
 *   - The situation's initial `description` + source URLs
 *   - A grounded-search pass if the user has zero documents (so a freshly
 *     created situation still produces a useful graph seed)
 *
 * Each text blob is fed through `extractEntities` (Gemini Pro, ACO v2.0
 * schema). Results are merged — entities are deduped by `id` — and then
 * enriched: every Actor node gets a Wikipedia + GDELT GKG lookup so the
 * graph carries mention volume, tone, and a short bio.
 *
 * Writes land in `users/{uid}/situations/{sitId}/graph/main` via the Admin
 * SDK so the operation can be authored from server routes. A snapshot is
 * saved on every successful run, tagged with the trigger source.
 */

import { adminDb } from '@/lib/firebase/admin';
import { extractEntities, type ExtractedEdge, type ExtractedNode } from '@/lib/services/entity-extraction';
import { enrichEntity } from '@/lib/services/entity-enrichment';
import { getGroundedSearchEvents } from '@/lib/data-feeds/grounded-search-client';
import type { GraphData, GraphEdge, GraphNode } from '@/lib/firebase/graph-service';

export interface PopulateResult {
  situationId: string;
  nodesBefore: number;
  nodesAfter: number;
  edgesBefore: number;
  edgesAfter: number;
  documentsProcessed: number;
  groundedSearchUsed: boolean;
  actorsEnriched: number;
  warnings: string[];
  snapshotId: string | null;
  fetchedAt: string;
}

interface SituationDoc {
  id: string;
  name?: string;
  region?: string;
  description?: string;
  actors?: string[];
  sourceUrls?: string[];
}

interface UploadedDocument {
  id: string;
  name: string;
  extractedText?: string;
}

function graphPath(uid: string, situationId: string) {
  return adminDb.collection('users').doc(uid).collection('situations').doc(situationId).collection('graph').doc('main');
}
function stagedPath(uid: string, situationId: string) {
  return adminDb.collection('users').doc(uid).collection('situations').doc(situationId).collection('graph').doc('staged');
}
function snapshotPath(uid: string, situationId: string, timestamp: string) {
  return adminDb.collection('users').doc(uid).collection('situations').doc(situationId).collection('graph').doc(`snapshot-${timestamp}`);
}

async function getSituation(uid: string, situationId: string): Promise<SituationDoc | null> {
  const snap = await adminDb.collection('users').doc(uid).collection('situations').doc(situationId).get();
  return snap.exists ? ({ id: snap.id, ...(snap.data() as Omit<SituationDoc, 'id'>) }) : null;
}

async function listDocuments(uid: string, situationId: string, limit = 20): Promise<UploadedDocument[]> {
  const snap = await adminDb
    .collection('users').doc(uid).collection('situations').doc(situationId).collection('documents')
    .limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<UploadedDocument, 'id'>) }));
}

async function getExistingGraph(uid: string, situationId: string): Promise<GraphData> {
  const snap = await graphPath(uid, situationId).get();
  if (snap.exists) return snap.data() as GraphData;
  return { nodes: [], edges: [] };
}

async function writeGraph(uid: string, situationId: string, graph: GraphData): Promise<void> {
  const entityTypeCounts: Record<string, number> = {};
  for (const n of graph.nodes) entityTypeCounts[n.type] = (entityTypeCounts[n.type] ?? 0) + 1;
  await graphPath(uid, situationId).set({
    ...graph,
    version: '2.0',
    lastUpdated: new Date().toISOString(),
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    entityTypeCounts,
  });
}

async function writeSnapshot(uid: string, situationId: string, trigger: string): Promise<string | null> {
  const graph = await getExistingGraph(uid, situationId);
  if (graph.nodes.length === 0) return null;
  const timestamp = new Date().toISOString();
  await snapshotPath(uid, situationId, timestamp).set({
    ...graph,
    snapshot: { timestamp, trigger, nodeCount: graph.nodes.length, edgeCount: graph.edges.length },
  });
  return timestamp;
}

function toGraphNode(n: ExtractedNode, source: GraphNode['source']): GraphNode {
  return {
    id: n.id,
    type: n.primitive_type,
    label: n.label,
    properties: {},
    createdAt: new Date().toISOString(),
    source,
    metadata: {
      description: n.description,
      subtype: n.subtype,
      confidence: n.confidence,
      date: n.date,
      location: n.location,
      status: n.status,
      valid_from: n.valid_from,
      valid_until: n.valid_until,
      source_url: n.source_url,
      source_name: n.source_name,
    },
  };
}

function toGraphEdge(e: ExtractedEdge): GraphEdge {
  return {
    id: `${e.source}__${e.relation}__${e.target}`,
    source: e.source,
    target: e.target,
    type: e.relation,
    weight: 1,
    label: e.relation,
    metadata: {
      confidence: e.confidence,
      description: e.description,
      valid_from: e.valid_from,
      valid_until: e.valid_until,
    },
  };
}

function mergeGraph(current: GraphData, incomingNodes: GraphNode[], incomingEdges: GraphEdge[]): GraphData {
  const nodeMap = new Map(current.nodes.map((n) => [n.id, n]));
  for (const n of incomingNodes) {
    const existing = nodeMap.get(n.id);
    if (!existing) nodeMap.set(n.id, n);
    else nodeMap.set(n.id, { ...existing, metadata: { ...existing.metadata, ...n.metadata } });
  }
  const edgeMap = new Map(current.edges.map((e) => [e.id, e]));
  for (const e of incomingEdges) if (!edgeMap.has(e.id)) edgeMap.set(e.id, e);
  return { nodes: Array.from(nodeMap.values()), edges: Array.from(edgeMap.values()) };
}

async function extractFromText(
  text: string,
  context: { situationName: string; sourceName: string; sourceUrl?: string; existingNodeIds: string[] },
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const trimmed = text.slice(0, 15_000);
  if (trimmed.trim().length < 80) return { nodes: [], edges: [] };
  try {
    const result = await extractEntities(trimmed, {
      sourceName: context.sourceName,
      sourceUrl: context.sourceUrl,
      situationContext: context.situationName,
      existingNodeIds: context.existingNodeIds,
      maxNodes: 40,
    });
    return {
      nodes: result.nodes.map((n) => toGraphNode({ ...n, source_name: context.sourceName, source_url: context.sourceUrl }, 'extraction')),
      edges: result.edges.map(toGraphEdge),
    };
  } catch (err) {
    console.warn('[graph-populate] extractEntities failed:', err instanceof Error ? err.message : err);
    return { nodes: [], edges: [] };
  }
}

async function enrichActors(graph: GraphData, maxActors = 6): Promise<number> {
  const actors = graph.nodes.filter((n) => n.type === 'Actor').slice(0, maxActors);
  let enriched = 0;
  for (const actor of actors) {
    try {
      const detail = await enrichEntity(actor.label, { useAiSummary: false });
      actor.metadata = {
        ...actor.metadata,
        wikipediaUrl: detail.wikipedia?.url,
        wikipediaExtract: detail.wikipedia?.extract?.slice(0, 480),
        gdeltMentionCount: detail.gdelt?.mentionCount,
        gdeltAverageTone: detail.gdelt?.averageTone ?? undefined,
        gdeltTopDomains: detail.gdelt?.topDomains ?? [],
        enrichedAt: detail.fetchedAt,
      };
      enriched++;
    } catch (err) {
      console.warn(`[graph-populate] enrichActor(${actor.label}) failed:`, err instanceof Error ? err.message : err);
    }
  }
  return enriched;
}

export async function populateSituationGraph(opts: {
  uid: string;
  situationId: string;
  trigger?: string;
  /**
   * 'commit' = merge into graph/main and write a snapshot (legacy behaviour).
   * 'staged' = write only to graph/staged so the user can review a diff
   *            before approving via approveStagedGraph().
   */
  mode?: 'commit' | 'staged';
}): Promise<PopulateResult> {
  const { uid, situationId, trigger = 'on-demand', mode = 'commit' } = opts;
  const warnings: string[] = [];

  const situation = await getSituation(uid, situationId);
  if (!situation) throw new Error(`Situation ${situationId} not found for uid ${uid}`);

  const [existingGraph, docs] = await Promise.all([getExistingGraph(uid, situationId), listDocuments(uid, situationId)]);
  const nodesBefore = existingGraph.nodes.length;
  const edgesBefore = existingGraph.edges.length;

  const texts: Array<{ text: string; sourceName: string; sourceUrl?: string }> = [];
  for (const d of docs) {
    if (d.extractedText) texts.push({ text: d.extractedText, sourceName: d.name ?? d.id });
  }

  // Seed text from the situation description itself — always present.
  if (situation.description && situation.description.length > 80) {
    texts.push({ text: `${situation.name ?? ''}\n\n${situation.description}`, sourceName: 'Situation description' });
  }

  // Grounded-search fallback: ensures a brand-new situation with no docs still gets a seed graph.
  let groundedSearchUsed = false;
  if (texts.length === 0 && situation.name) {
    const events = await getGroundedSearchEvents({ query: situation.name, country: situation.region, limit: 6 });
    if (events.length > 0) {
      const joined = events.map((e) => `${e.title}. ${e.description}`).join('\n\n');
      texts.push({ text: joined, sourceName: 'Grounded Google Search', sourceUrl: events[0]?.url });
      groundedSearchUsed = true;
    } else {
      warnings.push('No documents and no grounded-search signal — graph will be empty until content is added.');
    }
  }

  // Fan out extraction with a small concurrency cap so Gemini quotas stay happy.
  const existingIds = existingGraph.nodes.map((n) => n.id);
  let mergedGraph = existingGraph;
  for (const t of texts) {
    const { nodes, edges } = await extractFromText(t.text, {
      situationName: situation.name ?? '',
      sourceName: t.sourceName,
      sourceUrl: t.sourceUrl,
      existingNodeIds: existingIds,
    });
    mergedGraph = mergeGraph(mergedGraph, nodes, edges);
  }

  const actorsEnriched = await enrichActors(mergedGraph);

  let snapshotId: string | null = null;
  if (mode === 'commit') {
    await writeGraph(uid, situationId, mergedGraph);
    snapshotId = await writeSnapshot(uid, situationId, trigger);
  } else {
    // 'staged' — only write to /graph/staged, leave /graph/main untouched.
    await stagedPath(uid, situationId).set({
      ...mergedGraph,
      version: '2.0',
      lastUpdated: new Date().toISOString(),
      nodeCount: mergedGraph.nodes.length,
      edgeCount: mergedGraph.edges.length,
      stagedFrom: { trigger, ts: new Date().toISOString() },
    });
  }

  return {
    situationId,
    nodesBefore,
    nodesAfter: mergedGraph.nodes.length,
    edgesBefore,
    edgesAfter: mergedGraph.edges.length,
    documentsProcessed: docs.length,
    groundedSearchUsed,
    actorsEnriched,
    warnings,
    snapshotId,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Approve a previously-staged graph: merges /graph/staged into /graph/main,
 * writes a snapshot, then deletes /graph/staged. Idempotent — calling on a
 * missing staged doc is a no-op that returns the current main counts.
 */
export async function approveStagedGraph(opts: { uid: string; situationId: string; trigger?: string }): Promise<PopulateResult> {
  const { uid, situationId, trigger = 'approve-staged' } = opts;
  const stagedSnap = await stagedPath(uid, situationId).get();
  const main = await getExistingGraph(uid, situationId);

  if (!stagedSnap.exists) {
    return {
      situationId,
      nodesBefore: main.nodes.length,
      nodesAfter: main.nodes.length,
      edgesBefore: main.edges.length,
      edgesAfter: main.edges.length,
      documentsProcessed: 0,
      groundedSearchUsed: false,
      actorsEnriched: 0,
      warnings: ['No staged graph to approve.'],
      snapshotId: null,
      fetchedAt: new Date().toISOString(),
    };
  }

  const staged = stagedSnap.data() as GraphData;
  const merged = mergeGraph(main, staged.nodes, staged.edges);
  await writeGraph(uid, situationId, merged);
  const snapshotId = await writeSnapshot(uid, situationId, trigger);
  await stagedPath(uid, situationId).delete().catch(() => {});

  return {
    situationId,
    nodesBefore: main.nodes.length,
    nodesAfter: merged.nodes.length,
    edgesBefore: main.edges.length,
    edgesAfter: merged.edges.length,
    documentsProcessed: 0,
    groundedSearchUsed: false,
    actorsEnriched: 0,
    warnings: [],
    snapshotId,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Read the current staged graph for diff rendering.
 */
export async function getStagedGraph(uid: string, situationId: string): Promise<GraphData | null> {
  const snap = await stagedPath(uid, situationId).get();
  return snap.exists ? (snap.data() as GraphData) : null;
}

/**
 * Discard the staged graph without merging.
 */
export async function discardStagedGraph(uid: string, situationId: string): Promise<void> {
  await stagedPath(uid, situationId).delete().catch(() => {});
}
