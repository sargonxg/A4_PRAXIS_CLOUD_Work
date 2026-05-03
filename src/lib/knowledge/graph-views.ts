import type { GraphData, GraphEdge, GraphNode } from '@/lib/firebase/graph-service';

export type GraphViewId = 'all' | 'episodic' | 'semantic' | 'stance';

export interface GraphView {
  id: GraphViewId;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const SEMANTIC_TYPES = new Set(['actor', 'claim', 'interest', 'constraint', 'commitment', 'leverage']);
const STANCE_TYPES = new Set(['narrative', 'actor', 'claim']);

export function graphView(graph: GraphData | null | undefined, view: GraphViewId): GraphView {
  if (view === 'episodic') return episodicView(graph);
  if (view === 'semantic') return semanticView(graph);
  if (view === 'stance') return stanceView(graph);
  return allView(graph);
}

export function allView(graph: GraphData | null | undefined): GraphView {
  const normalized = normalizeGraph(graph);
  return { id: 'all', ...normalized };
}

export function episodicView(graph: GraphData | null | undefined): GraphView {
  const normalized = normalizeGraph(graph);
  const eventIds = new Set(normalized.nodes.filter((node) => isType(node, 'event')).map((node) => node.id));
  const edges = normalized.edges.filter((edge) => eventIds.has(edge.source) || eventIds.has(edge.target));
  const nodeIds = new Set<string>(eventIds);
  edges.forEach((edge) => {
    nodeIds.add(edge.source);
    nodeIds.add(edge.target);
  });
  const nodes = normalized.nodes
    .filter((node) => nodeIds.has(node.id))
    .sort((a, b) => {
      const aEvent = isType(a, 'event');
      const bEvent = isType(b, 'event');
      if (aEvent !== bEvent) return aEvent ? -1 : 1;
      return eventTime(a).localeCompare(eventTime(b));
    });
  return { id: 'episodic', nodes, edges };
}

export function semanticView(graph: GraphData | null | undefined): GraphView {
  const normalized = normalizeGraph(graph);
  const nodeIds = new Set(normalized.nodes.filter((node) => SEMANTIC_TYPES.has(typeKey(node.type))).map((node) => node.id));
  return subsetView('semantic', normalized, nodeIds);
}

export function stanceView(graph: GraphData | null | undefined): GraphView {
  const normalized = normalizeGraph(graph);
  const seedIds = new Set(normalized.nodes.filter((node) => STANCE_TYPES.has(typeKey(node.type))).map((node) => node.id));
  const narrativeIds = new Set(normalized.nodes.filter((node) => isType(node, 'narrative')).map((node) => node.id));
  const edges = normalized.edges.filter((edge) => narrativeIds.has(edge.source) || narrativeIds.has(edge.target));
  edges.forEach((edge) => {
    seedIds.add(edge.source);
    seedIds.add(edge.target);
  });
  return subsetView('stance', normalized, seedIds);
}

function subsetView(id: GraphViewId, graph: Pick<GraphData, 'nodes' | 'edges'>, nodeIds: Set<string>): GraphView {
  const edges = graph.edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  return {
    id,
    nodes: graph.nodes.filter((node) => nodeIds.has(node.id)),
    edges,
  };
}

function normalizeGraph(graph: GraphData | null | undefined): Pick<GraphData, 'nodes' | 'edges'> {
  return {
    nodes: graph?.nodes ?? [],
    edges: graph?.edges ?? [],
  };
}

function isType(node: GraphNode, type: string): boolean {
  return typeKey(node.type) === type;
}

function typeKey(type: string): string {
  return type.toLowerCase().replace(/[_\s-]+/g, '-').replace('non-state', 'non_state');
}

function eventTime(node: GraphNode): string {
  const value =
    stringFrom(node.metadata?.event_time) ??
    stringFrom(node.metadata?.date) ??
    stringFrom(node.metadata?.valid_from) ??
    stringFrom(node.properties?.date) ??
    stringFrom(node.createdAt);
  return value || '9999-12-31';
}

function stringFrom(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}
