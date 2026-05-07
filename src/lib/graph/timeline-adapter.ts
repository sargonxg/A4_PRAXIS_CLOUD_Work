import type { WorkbenchGraph, WorkbenchGraphNode } from '@/lib/graph/workbench-case-graph';

export function toTimelineItems(graph: WorkbenchGraph) {
  return graph.nodes
    .filter((node) => Boolean(node.occurredAt))
    .map((node, index) => ({
      id: node.id,
      content: node.label,
      title: `${node.timelineLabel ?? node.type}: ${node.description}`,
      start: normalizeDate(node.occurredAt, index),
      className: `praxis-timeline-${node.type}`,
      group: node.type,
      node,
    }))
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
}

export function toTimelineGroups(graph: WorkbenchGraph) {
  const types = Array.from(new Set(graph.nodes.map((node) => node.type)));
  return types.map((type) => ({ id: type, content: labelForType(type) }));
}

function normalizeDate(value: string | undefined, offset: number) {
  const parsed = value ? Date.parse(value) : Number.NaN;
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  const fallback = new Date('2026-01-01T00:00:00.000Z');
  fallback.setDate(fallback.getDate() + offset);
  return fallback.toISOString();
}

function labelForType(type: WorkbenchGraphNode['type']) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
