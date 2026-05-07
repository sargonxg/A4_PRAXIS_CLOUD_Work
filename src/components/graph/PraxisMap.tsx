'use client';

import dynamic from 'next/dynamic';
import { Globe2, ShieldCheck } from 'lucide-react';
import type { WorkbenchGraph } from '@/lib/graph/workbench-case-graph';
import { toMapPoints } from '@/lib/graph/map-adapter';
import { cn } from '@/lib/utils/cn';
import { GraphVisualizationSkeleton } from '@/components/graph/GraphVisualizationSkeleton';

const PraxisMapReact = dynamic(
  () => import('@/components/graph/PraxisMapReact').then((module) => module.PraxisMapReact),
  {
    ssr: false,
    loading: () => <GraphVisualizationSkeleton label="Loading map" />,
  },
);

export function PraxisMap({ graph, className }: { graph: WorkbenchGraph; className?: string }) {
  const points = toMapPoints(graph);
  const usesDerivedPoints = points.some((point) => point.derived);

  return (
    <section data-testid="praxis-map" className={cn('rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-navy-950">
            <Globe2 className="h-5 w-5 text-gold-600" />
            <h2 className="text-lg font-semibold">Map Projection</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Geospatial graph projection using MapLibre. When source coordinates are absent, PRAXIS displays derived regional anchors instead of blocking the analyst.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4" />
          {points.length} mapped nodes
        </div>
      </div>

      {usesDerivedPoints ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950">
          Some points are derived from the case region. They are usable for orientation, not evidence-grade geolocation.
        </div>
      ) : null}

      <div className="mt-5 rounded-md border border-slate-200 bg-slate-100 p-3">
        <PraxisMapReact graph={graph} />
      </div>
    </section>
  );
}
