import { SurfaceFactGrid, SurfaceSection } from '@/components/workbench/workbench-surface-elements';
import type { toTimelineItems } from '@/lib/graph/timeline-adapter';
import type { SurfaceFact } from '@/lib/workbench/surface-state';

export function WhatChangedPanel({
  facts,
  timelineItems,
}: {
  facts: SurfaceFact[];
  timelineItems?: ReturnType<typeof toTimelineItems>;
}) {
  return (
    <SurfaceSection eyebrow="What changed" title="Latest case signals">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SurfaceFactGrid facts={facts} />
        <InlineTimeline items={timelineItems ?? []} />
      </div>
    </SurfaceSection>
  );
}

function InlineTimeline({ items }: { items: ReturnType<typeof toTimelineItems> }) {
  return (
    <div data-testid="desk-inline-timeline" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">Timeline</p>
          <h4 className="mt-1 text-sm font-semibold text-navy-950">Recent graph chronology</h4>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
          {items.length} dated
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-950">No dated entities yet</p>
            <p className="mt-1 text-sm leading-5 text-amber-900">Add event dates or source receipt times to unlock the full timeline mode.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-700">{shortDate(item.start)}</p>
              <div>
                <p className="text-sm font-semibold text-navy-950">{item.content}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-700">{item.node.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function shortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
