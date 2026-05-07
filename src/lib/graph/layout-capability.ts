import type { WorkbenchGraph } from '@/lib/graph/workbench-case-graph';
import type { GraphLayoutOption } from '@/types/visualization';

export function getGraphLayoutOptions(graph: WorkbenchGraph): GraphLayoutOption[] {
  const hasNodes = graph.nodes.length > 0;
  const timelineNodes = graph.nodes.filter((node) => node.occurredAt).length;
  const mapNodes = graph.nodes.filter((node) => node.geo).length;

  return [
    {
      id: 'oval',
      label: 'Oval',
      description: 'Canonical PRAXIS SVG view for provenance review.',
      available: hasNodes,
      unavailableReason: hasNodes ? undefined : 'No graph nodes available yet.',
    },
    {
      id: 'force',
      label: 'Force',
      description: 'Interactive force layout for exploring dense relationships.',
      available: hasNodes,
      unavailableReason: hasNodes ? undefined : 'No graph nodes available yet.',
    },
    {
      id: 'timeline',
      label: 'Timeline',
      description: 'Chronological projection from node and receipt timestamps.',
      available: timelineNodes > 0,
      unavailableReason: timelineNodes > 0 ? undefined : 'No dated graph nodes available yet.',
    },
    {
      id: 'map',
      label: 'Map',
      description: 'Geospatial projection with derived region anchors when coordinates are missing.',
      available: mapNodes > 0,
      unavailableReason: mapNodes > 0 ? undefined : 'No geocoded graph nodes available yet.',
    },
  ];
}

export function firstAvailableLayout(options: GraphLayoutOption[]) {
  return options.find((option) => option.available)?.id ?? 'oval';
}
