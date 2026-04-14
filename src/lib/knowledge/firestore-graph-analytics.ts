/**
 * PRAXIS Graph Analytics — JavaScript implementations for Firestore graph layer.
 * Used when Neo4j is not configured. Provides the same API as Neo4j GDS library.
 * Performance: suitable for typical PRAXIS situations (20-200 nodes, 50-500 edges).
 */

import type { ACONode, ACOEdge } from './types';

/** Build adjacency list from edges (undirected) */
function buildAdjacency(nodes: ACONode[], edges: ACOEdge[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  edges.forEach(e => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!adj.has(e.target)) adj.set(e.target, []);
    adj.get(e.source)!.push(e.target);
    adj.get(e.target)!.push(e.source);
  });
  return adj;
}

/** Degree centrality (normalized 0-1) */
export function computeDegreeCentrality(nodes: ACONode[], edges: ACOEdge[]): Map<string, number> {
  const degree = new Map<string, number>();
  nodes.forEach(n => degree.set(n.id, 0));
  edges.forEach(e => {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  });
  const maxDeg = Math.max(...Array.from(degree.values()), 1);
  degree.forEach((v, k) => degree.set(k, v / maxDeg));
  return degree;
}

/** Betweenness centrality using Brandes' algorithm (normalized 0-1) */
export function computeBetweennessCentrality(nodes: ACONode[], edges: ACOEdge[]): Map<string, number> {
  const adj = buildAdjacency(nodes, edges);
  const CB = new Map<string, number>();
  nodes.forEach(n => CB.set(n.id, 0));

  for (const s of nodes) {
    const S: string[] = [];
    const P = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const d = new Map<string, number>();
    const delta = new Map<string, number>();
    nodes.forEach(n => { P.set(n.id, []); sigma.set(n.id, 0); d.set(n.id, -1); delta.set(n.id, 0); });
    sigma.set(s.id, 1); d.set(s.id, 0);
    const Q: string[] = [s.id];
    while (Q.length > 0) {
      const v = Q.shift()!;
      S.push(v);
      for (const w of adj.get(v) ?? []) {
        if (d.get(w)! < 0) { Q.push(w); d.set(w, d.get(v)! + 1); }
        if (d.get(w) === d.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          P.get(w)!.push(v);
        }
      }
    }
    while (S.length > 0) {
      const w = S.pop()!;
      for (const v of P.get(w) ?? []) {
        const contrib = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + contrib);
      }
      if (w !== s.id) CB.set(w, CB.get(w)! + delta.get(w)!);
    }
  }
  const n = nodes.length;
  const norm = n > 2 ? (n - 1) * (n - 2) : 1;
  CB.forEach((v, k) => CB.set(k, v / norm));
  return CB;
}

/** Community detection via connected components (Louvain-style simplification) */
export function detectCommunities(nodes: ACONode[], edges: ACOEdge[]): Map<string, number> {
  const adj = buildAdjacency(nodes, edges);
  const visited = new Set<string>();
  const communities = new Map<string, number>();
  let communityId = 0;
  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const queue = [node.id];
    while (queue.length > 0) {
      const v = queue.shift()!;
      if (visited.has(v)) continue;
      visited.add(v);
      communities.set(v, communityId);
      for (const w of adj.get(v) ?? []) {
        if (!visited.has(w)) queue.push(w);
      }
    }
    communityId++;
  }
  return communities;
}

/** BFS shortest path between two nodes */
export function findShortestPath(nodes: ACONode[], edges: ACOEdge[], fromId: string, toId: string): string[] | null {
  const adj = buildAdjacency(nodes, edges);
  const visited = new Set<string>();
  const parent = new Map<string, string | null>();
  const queue = [fromId];
  visited.add(fromId);
  parent.set(fromId, null);
  while (queue.length > 0) {
    const v = queue.shift()!;
    if (v === toId) {
      const path: string[] = [];
      let cur: string | null = toId;
      while (cur !== null) { path.unshift(cur); cur = parent.get(cur) ?? null; }
      return path;
    }
    for (const w of adj.get(v) ?? []) {
      if (!visited.has(w)) { visited.add(w); parent.set(w, v); queue.push(w); }
    }
  }
  return null;
}

/** Compute most central node by betweenness centrality */
export function getMostCentralNode(nodes: ACONode[], edges: ACOEdge[]): string {
  if (nodes.length === 0) return '';
  const bc = computeBetweennessCentrality(nodes, edges);
  let best = nodes[0].id;
  let bestScore = 0;
  bc.forEach((score, id) => { if (score > bestScore) { bestScore = score; best = id; } });
  return best;
}

/** Compute graph density */
export function computeDensity(nodeCount: number, edgeCount: number): number {
  if (nodeCount < 2) return 0;
  const maxEdges = (nodeCount * (nodeCount - 1)) / 2;
  return edgeCount / maxEdges;
}
