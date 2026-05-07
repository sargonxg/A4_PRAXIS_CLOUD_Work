'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { GraphLayoutToggle } from '@/components/graph/GraphLayoutToggle';
import { GraphVisualizationSkeleton } from '@/components/graph/GraphVisualizationSkeleton';
import { PraxisGraphCanvas } from '@/components/graph/PraxisGraphCanvas';
import { firstAvailableLayout, getGraphLayoutOptions } from '@/lib/graph/layout-capability';
import type { WorkbenchGraph } from '@/lib/graph/workbench-case-graph';
import type { GraphLayoutMode } from '@/types/visualization';

const PraxisForceGraph = dynamic(
  () => import('@/components/graph/PraxisForceGraph').then((module) => module.PraxisForceGraph),
  {
    ssr: false,
    loading: () => <GraphVisualizationSkeleton label="Loading force graph" />,
  },
);

const PraxisTimeline = dynamic(
  () => import('@/components/graph/PraxisTimeline').then((module) => module.PraxisTimeline),
  {
    ssr: false,
    loading: () => <GraphVisualizationSkeleton label="Loading timeline" />,
  },
);

const PraxisMap = dynamic(
  () => import('@/components/graph/PraxisMap').then((module) => module.PraxisMap),
  {
    ssr: false,
    loading: () => <GraphVisualizationSkeleton label="Loading map" />,
  },
);

export function PraxisGraphView({
  graph,
  initialLayout = 'oval',
  persistToUrl = true,
}: {
  graph: WorkbenchGraph;
  initialLayout?: GraphLayoutMode;
  persistToUrl?: boolean;
}) {
  const options = useMemo(() => getGraphLayoutOptions(graph), [graph]);
  const fallbackLayout = firstAvailableLayout(options);
  const urlLayout = typeof window === 'undefined' ? null : (new URL(window.location.href).searchParams.get('layout') as GraphLayoutMode | null);
  const [layout, setLayout] = useState<GraphLayoutMode>(() => safeLayout(urlLayout ?? initialLayout, options, fallbackLayout));

  useEffect(() => {
    setLayout((current) => safeLayout(current, options, fallbackLayout));
  }, [fallbackLayout, options]);

  const onChange = (nextLayout: GraphLayoutMode) => {
    const safeNext = safeLayout(nextLayout, options, fallbackLayout);
    setLayout(safeNext);
    if (!persistToUrl || typeof window === 'undefined') return;
    const next = new URL(window.location.href);
    next.searchParams.set('layout', safeNext);
    window.history.replaceState(null, '', next.toString());
  };

  return (
    <div data-testid="praxis-graph-view" className="space-y-3">
      <GraphLayoutToggle options={options} value={layout} onChange={onChange} />
      {layout === 'oval' ? <PraxisGraphCanvas graph={graph} /> : null}
      {layout === 'force' ? <PraxisForceGraph graph={graph} /> : null}
      {layout === 'timeline' ? <PraxisTimeline graph={graph} /> : null}
      {layout === 'map' ? <PraxisMap graph={graph} /> : null}
    </div>
  );
}

function safeLayout(mode: GraphLayoutMode, options: ReturnType<typeof getGraphLayoutOptions>, fallback: GraphLayoutMode) {
  const option = options.find((candidate) => candidate.id === mode);
  return option?.available ? option.id : fallback;
}
