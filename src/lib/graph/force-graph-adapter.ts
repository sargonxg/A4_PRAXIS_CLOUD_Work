import type { WorkbenchGraph, WorkbenchGraphNode } from '@/lib/graph/workbench-case-graph';

const NODE_COLORS: Record<WorkbenchGraphNode['type'], string> = {
  case: '#0F172A',
  actor: '#7C3AED',
  source: '#0EA5E9',
  claim: '#B45309',
  evidence: '#059669',
  verdict: '#BE123C',
};

export function toForceGraphData(graph: WorkbenchGraph) {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      name: node.label,
      color: NODE_COLORS[node.type],
      centralityValue: node.metrics?.centrality?.betweenness ?? 0,
      val: node.type === 'case' ? 11 : 4 + Math.round(node.confidence * 8),
      centralityVal: node.type === 'case' ? 11 : 5 + Math.round((node.metrics?.centrality?.betweenness ?? 0) * 24),
    })),
    links: graph.edges.map((edge) => ({
      ...edge,
      source: edge.source,
      target: edge.target,
      name: edge.label,
    })),
  };
}

export function nodeColor(type: WorkbenchGraphNode['type']) {
  return NODE_COLORS[type];
}
