'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, ShieldCheck } from 'lucide-react';
import type { WorkbenchGraph } from '@/lib/graph/workbench-case-graph';
import { toTimelineGroups, toTimelineItems } from '@/lib/graph/timeline-adapter';
import { cn } from '@/lib/utils/cn';

export function PraxisTimeline({ graph, className }: { graph: WorkbenchGraph; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const items = useMemo(() => toTimelineItems(graph), [graph]);
  const groups = useMemo(() => toTimelineGroups(graph), [graph]);

  useEffect(() => {
    if (!containerRef.current) return;
    let timeline: { destroy: () => void } | null = null;
    let mounted = true;

    Promise.all([import('vis-timeline/standalone'), import('vis-data')])
      .then(([timelineModule, dataModule]) => {
        if (!mounted || !containerRef.current) return;
        const Timeline = timelineModule.Timeline;
        const DataSet = dataModule.DataSet;
        timeline = new Timeline(
          containerRef.current,
          new DataSet(items),
          new DataSet(groups),
          {
            height: '440px',
            margin: { item: 14, axis: 12 },
            stack: true,
            zoomMin: 1000 * 60 * 60 * 24,
            zoomMax: 1000 * 60 * 60 * 24 * 365 * 10,
            orientation: 'both',
            selectable: true,
          },
        );
      })
      .catch(() => {
        if (mounted) setFailed(true);
      });

    return () => {
      mounted = false;
      timeline?.destroy();
    };
  }, [groups, items]);

  return (
    <section data-testid="praxis-timeline" className={cn('rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-navy-950">
            <Clock3 className="h-5 w-5 text-gold-600" />
            <h2 className="text-lg font-semibold">Timeline Projection</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Dated graph nodes, truth-layer updates, and source receipts projected into a navigable chronology.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          <ShieldCheck className="h-4 w-4" />
          {items.length} dated nodes
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
        <div ref={containerRef} className="praxis-timeline min-h-[440px]" />
        {failed ? <TimelineFallback items={items} /> : null}
      </div>
    </section>
  );
}

function TimelineFallback({ items }: { items: ReturnType<typeof toTimelineItems> }) {
  return (
    <div className="grid gap-2 p-4">
      {items.slice(0, 8).map((item) => (
        <div key={item.id} className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-navy-950">{item.content}</p>
          <p className="mt-1 text-[11px] leading-4 text-slate-700">{new Date(item.start).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}
