import type { GraphData, GraphEdge, GraphNode } from '@/lib/firebase/graph-service';
import { normalizeCanonicalGraph } from '@/lib/graph/canonical-graph';

export interface GraphContextPack {
  actors: GraphNode[];
  claims: GraphNode[];
  interests: GraphNode[];
  constraints: GraphNode[];
  risks: GraphNode[];
  events: GraphNode[];
  commitments: GraphNode[];
  neighborhood: Array<{ node: GraphNode; edges: GraphEdge[] }>;
  missingEvidenceNodeIds: string[];
  summaryLines: string[];
}

function byType(nodes: GraphNode[], type: string) {
  return nodes.filter((node) => node.type === type);
}

function hasEvidence(nodeOrEdge: GraphNode | GraphEdge): boolean {
  const evidence = nodeOrEdge.metadata?.evidence;
  return Array.isArray(evidence) && evidence.length > 0;
}

export function buildGraphContextPack(graph: GraphData | null | undefined, opts: { focusActorId?: string; limit?: number } = {}): GraphContextPack {
  const normalized = normalizeCanonicalGraph(graph);
  const limit = Math.max(1, Math.min(opts.limit ?? 8, 30));
  const actors = byType(normalized.nodes, 'actor').slice(0, limit);
  const claims = byType(normalized.nodes, 'claim').slice(0, limit);
  const interests = byType(normalized.nodes, 'interest').slice(0, limit);
  const constraints = byType(normalized.nodes, 'constraint').slice(0, limit);
  const risks = byType(normalized.nodes, 'risk').slice(0, limit);
  const events = byType(normalized.nodes, 'event').slice(0, limit);
  const commitments = byType(normalized.nodes, 'commitment').slice(0, limit);
  const focusIds = new Set([opts.focusActorId, ...actors.slice(0, 3).map((actor) => actor.id)].filter(Boolean) as string[]);
  const neighborhood = normalized.nodes
    .filter((node) => focusIds.has(node.id))
    .map((node) => ({ node, edges: normalized.edges.filter((edge) => edge.source === node.id || edge.target === node.id).slice(0, limit) }));
  const missingEvidenceNodeIds = normalized.nodes.filter((node) => !hasEvidence(node)).map((node) => node.id).slice(0, 20);

  return {
    actors,
    claims,
    interests,
    constraints,
    risks,
    events,
    commitments,
    neighborhood,
    missingEvidenceNodeIds,
    summaryLines: [
      `${normalized.nodes.length} canonical nodes and ${normalized.edges.length} canonical edges.`,
      `${actors.length} actor seeds, ${events.length} event seeds, ${commitments.length} commitment seeds in context pack.`,
      missingEvidenceNodeIds.length ? `${missingEvidenceNodeIds.length} graph nodes need stronger evidence envelopes.` : 'Visible graph nodes have evidence envelopes.',
    ],
  };
}
