export interface GraphSnapshot {
  nodes: Array<{ id: string; label?: string; updatedAt?: string; [key: string]: unknown }>;
  edges: Array<{ id: string; source: string; target: string; type?: string; updatedAt?: string; [key: string]: unknown }>;
  sources?: Array<{ id: string; title?: string; updatedAt?: string; [key: string]: unknown }>;
}

export interface GraphDiff {
  addedNodes: GraphSnapshot['nodes'];
  removedNodes: GraphSnapshot['nodes'];
  modifiedNodes: GraphSnapshot['nodes'];
  addedEdges: GraphSnapshot['edges'];
  removedEdges: GraphSnapshot['edges'];
  modifiedEdges: GraphSnapshot['edges'];
  sourceUpdates: NonNullable<GraphSnapshot['sources']>;
}

function changed(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return JSON.stringify(a) !== JSON.stringify(b);
}

export function diffGraphSnapshots(before: GraphSnapshot, after: GraphSnapshot): GraphDiff {
  const beforeNodes = new Map(before.nodes.map((node) => [node.id, node]));
  const afterNodes = new Map(after.nodes.map((node) => [node.id, node]));
  const beforeEdges = new Map(before.edges.map((edge) => [edge.id, edge]));
  const afterEdges = new Map(after.edges.map((edge) => [edge.id, edge]));
  const beforeSources = new Map((before.sources ?? []).map((source) => [source.id, source]));

  return {
    addedNodes: after.nodes.filter((node) => !beforeNodes.has(node.id)),
    removedNodes: before.nodes.filter((node) => !afterNodes.has(node.id)),
    modifiedNodes: after.nodes.filter((node) => {
      const previous = beforeNodes.get(node.id);
      return Boolean(previous && changed(previous, node));
    }),
    addedEdges: after.edges.filter((edge) => !beforeEdges.has(edge.id)),
    removedEdges: before.edges.filter((edge) => !afterEdges.has(edge.id)),
    modifiedEdges: after.edges.filter((edge) => {
      const previous = beforeEdges.get(edge.id);
      return Boolean(previous && changed(previous, edge));
    }),
    sourceUpdates: (after.sources ?? []).filter((source) => {
      const previous = beforeSources.get(source.id);
      return Boolean(previous && changed(previous, source));
    }),
  };
}
