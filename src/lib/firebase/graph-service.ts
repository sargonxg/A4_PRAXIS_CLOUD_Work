/**
 * Graph Service — Firestore-backed conflict knowledge graph
 *
 * Stores ACO v2.0 entities (14 types) and relationships (72 types) with:
 * - Temporal metadata (valid_from, valid_until, last_verified)
 * - Provenance tracking (source_url, source_name, confidence)
 * - Graph versioning (snapshots for evolution tracking)
 * - Trustworthiness scores per node
 *
 * Firestore path: users/{uid}/situations/{sitId}/graph/main
 * Snapshots path: users/{uid}/situations/{sitId}/graph/snapshots/{timestamp}
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';
import { computeCorePrimitiveCoverage, type CorePrimitiveCoverage } from '@/lib/graph/core-primitives';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  type: string; // ACO entity type (Actor, Claim, Interest, etc.)
  label: string;
  properties: Record<string, string | number>;
  createdAt: string;
  source: 'extraction' | 'manual' | 'ai-chat' | 'pipeline' | 'web-research';
  // ACO v2.0 fields
  metadata?: {
    description?: string;
    subtype?: string;
    confidence?: string;
    date?: string;
    location?: string;
    status?: string;
    valid_from?: string;
    valid_until?: string;
    source_url?: string;
    source_name?: string;
    trustScore?: { level: string; score: number };
    [key: string]: unknown;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string; // ACO relationship type (claims, opposes, triggered_by, etc.)
  weight: number;
  label?: string;
  // ACO v2.0 fields
  metadata?: {
    confidence?: string;
    description?: string;
    valid_from?: string;
    valid_until?: string;
    category?: string; // causal, structural, antagonistic, cooperative, foundational
    [key: string]: unknown;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  // v2.0 metadata
  version?: string;
  lastUpdated?: string;
  nodeCount?: number;
  edgeCount?: number;
  entityTypeCounts?: Record<string, number>;
  corePrimitiveCoverage?: CorePrimitiveCoverage;
}

export interface GraphSnapshot {
  timestamp: string;
  nodeCount: number;
  edgeCount: number;
  trigger: string; // What caused this snapshot (extraction, manual edit, pipeline)
}

// ─── Firestore paths ────────────────────────────────────────────────────────

function graphDoc(uid: string, situationId: string) {
  return doc(db, 'users', uid, 'situations', situationId, 'graph', 'main');
}

function snapshotDoc(uid: string, situationId: string, timestamp: string) {
  return doc(db, 'users', uid, 'situations', situationId, 'graph', `snapshot-${timestamp}`);
}

// ─── CRUD operations ────────────────────────────────────────────────────────

export async function getGraph(uid: string, situationId: string): Promise<GraphData | null> {
  const snap = await getDoc(graphDoc(uid, situationId));
  return snap.exists() ? (snap.data() as GraphData) : null;
}

export async function saveGraph(uid: string, situationId: string, graph: GraphData): Promise<void> {
  const entityTypeCounts: Record<string, number> = {};
  for (const node of graph.nodes) {
    entityTypeCounts[node.type] = (entityTypeCounts[node.type] || 0) + 1;
  }

  await setDoc(graphDoc(uid, situationId), {
    ...graph,
    version: '2.0',
    lastUpdated: new Date().toISOString(),
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    entityTypeCounts,
    corePrimitiveCoverage: computeCorePrimitiveCoverage(graph.nodes),
  });
}

export async function addNodes(uid: string, situationId: string, nodes: GraphNode[]): Promise<void> {
  const existing = await getGraph(uid, situationId);
  const graph = existing ?? { nodes: [], edges: [] };
  const existingIds = new Set(graph.nodes.map((n) => n.id));
  const newNodes = nodes.filter((n) => !existingIds.has(n.id));
  graph.nodes.push(...newNodes);
  await saveGraph(uid, situationId, graph);
}

export async function addEdges(uid: string, situationId: string, edges: GraphEdge[]): Promise<void> {
  const existing = await getGraph(uid, situationId);
  const graph = existing ?? { nodes: [], edges: [] };
  const existingIds = new Set(graph.edges.map((e) => e.id));
  const newEdges = edges.filter((e) => !existingIds.has(e.id));
  graph.edges.push(...newEdges);
  await saveGraph(uid, situationId, graph);
}

// ─── Graph snapshots (evolution tracking) ───────────────────────────────────

/**
 * Save a snapshot of the current graph state for temporal diff/evolution.
 */
export async function saveSnapshot(
  uid: string,
  situationId: string,
  trigger: string,
): Promise<string> {
  const graph = await getGraph(uid, situationId);
  if (!graph) return '';

  const timestamp = new Date().toISOString();
  await setDoc(snapshotDoc(uid, situationId, timestamp), {
    ...graph,
    snapshot: {
      timestamp,
      trigger,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
    },
  });
  return timestamp;
}

/**
 * Get graph evolution between two points in time.
 * Compares node/edge sets to identify additions, removals, and modifications.
 */
export async function getGraphEvolution(
  uid: string,
  situationId: string,
  fromSnapshot: string,
  toSnapshot?: string,
): Promise<{
  addedNodes: GraphNode[];
  removedNodes: GraphNode[];
  addedEdges: GraphEdge[];
  removedEdges: GraphEdge[];
  modifiedNodes: Array<{ id: string; changes: Record<string, { from: unknown; to: unknown }> }>;
}> {
  const fromDoc = await getDoc(snapshotDoc(uid, situationId, fromSnapshot));
  const toData = toSnapshot
    ? (await getDoc(snapshotDoc(uid, situationId, toSnapshot))).data() as GraphData | undefined
    : await getGraph(uid, situationId);

  if (!fromDoc.exists() || !toData) {
    return { addedNodes: [], removedNodes: [], addedEdges: [], removedEdges: [], modifiedNodes: [] };
  }

  const fromData = fromDoc.data() as GraphData;
  const fromNodeMap = new Map(fromData.nodes.map((n) => [n.id, n]));
  const toNodeMap = new Map(toData.nodes.map((n) => [n.id, n]));
  const fromEdgeMap = new Map(fromData.edges.map((e) => [e.id, e]));
  const toEdgeMap = new Map(toData.edges.map((e) => [e.id, e]));

  const addedNodes = toData.nodes.filter((n) => !fromNodeMap.has(n.id));
  const removedNodes = fromData.nodes.filter((n) => !toNodeMap.has(n.id));
  const addedEdges = toData.edges.filter((e) => !fromEdgeMap.has(e.id));
  const removedEdges = fromData.edges.filter((e) => !toEdgeMap.has(e.id));

  const modifiedNodes: Array<{ id: string; changes: Record<string, { from: unknown; to: unknown }> }> = [];
  for (const [id, toNode] of toNodeMap) {
    const fromNode = fromNodeMap.get(id);
    if (!fromNode) continue;
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (fromNode.label !== toNode.label) changes.label = { from: fromNode.label, to: toNode.label };
    if (fromNode.type !== toNode.type) changes.type = { from: fromNode.type, to: toNode.type };
    if (JSON.stringify(fromNode.metadata) !== JSON.stringify(toNode.metadata)) {
      changes.metadata = { from: fromNode.metadata, to: toNode.metadata };
    }
    if (Object.keys(changes).length > 0) {
      modifiedNodes.push({ id, changes });
    }
  }

  return { addedNodes, removedNodes, addedEdges, removedEdges, modifiedNodes };
}

// ─── Graph analysis helpers ─────────────────────────────────────────────────

/**
 * Get timeline of events from the graph, sorted chronologically.
 */
export function getGraphTimeline(graph: GraphData): Array<{
  id: string;
  label: string;
  date: string;
  type: string;
  location?: string;
  significance?: string;
  connectedActors: string[];
}> {
  const events = graph.nodes.filter(
    (n) => n.type.toLowerCase() === 'event' && (n.metadata?.date || n.properties?.date),
  );

  return events
    .map((event) => {
      const connectedActors = graph.edges
        .filter((e) =>
          (e.source === event.id || e.target === event.id) &&
          (e.type === 'involves_actor' || e.type === 'participated_in'),
        )
        .map((e) => {
          const otherId = e.source === event.id ? e.target : e.source;
          return graph.nodes.find((n) => n.id === otherId)?.label || otherId;
        });

      return {
        id: event.id,
        label: event.label,
        date: (event.metadata?.date as string) || (event.properties?.date as string) || '',
        type: (event.metadata?.subtype as string) || 'event',
        location: event.metadata?.location as string,
        significance: event.metadata?.status as string,
        connectedActors,
      };
    })
    .filter((e) => e.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get entity type distribution for graph statistics.
 */
export function getEntityDistribution(graph: GraphData): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const node of graph.nodes) {
    const type = node.type.charAt(0).toUpperCase() + node.type.slice(1).toLowerCase();
    counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
}

/**
 * Find pivot actors — nodes with highest connectivity (betweenness proxy).
 */
export function findPivotActors(graph: GraphData, topN = 5): Array<{
  id: string;
  label: string;
  connectionCount: number;
  types: string[];
}> {
  const connectionMap = new Map<string, { count: number; types: Set<string> }>();

  for (const edge of graph.edges) {
    for (const nodeId of [edge.source, edge.target]) {
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (!node || node.type.toLowerCase() !== 'actor') continue;
      const entry = connectionMap.get(nodeId) ?? { count: 0, types: new Set<string>() };
      entry.count++;
      entry.types.add(edge.type);
      connectionMap.set(nodeId, entry);
    }
  }

  return Array.from(connectionMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, topN)
    .map(([id, data]) => ({
      id,
      label: graph.nodes.find((n) => n.id === id)?.label || id,
      connectionCount: data.count,
      types: Array.from(data.types),
    }));
}
