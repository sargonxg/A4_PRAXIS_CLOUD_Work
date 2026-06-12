'use client';

import { memo, useEffect, useRef } from 'react';

export type CapsuleTemporalViewerItem = {
  id: string;
  label: string;
  start: string;
  end: string | null;
  group: string;
  kind: string;
  confidence: number | null;
  nodeIds?: string[];
  sourceIds?: string[];
};

export type CapsuleTemporalViewerProps = {
  items: CapsuleTemporalViewerItem[];
  groups?: string[];
  onSelect?: (item: CapsuleTemporalViewerItem | null) => void;
};

type TimelineHandle = {
  destroy: () => void;
  on?: (eventName: 'select', callback: (properties: { items?: Array<string | number> }) => void) => void;
};

function CapsuleTemporalViewerComponent({ items, onSelect }: CapsuleTemporalViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !items.length) return undefined;
    let cancelled = false;
    let timeline: TimelineHandle | null = null;

    async function mountTimeline() {
      const mod = await import('vis-timeline/standalone');
      const timelineLib = mod as unknown as {
        DataSet: new (items: Array<Record<string, unknown>>) => unknown;
        Timeline: new (container: HTMLElement, items: unknown, options: Record<string, unknown>) => TimelineHandle;
      };
      if (cancelled || !containerRef.current) return;
      const dataSet = new timelineLib.DataSet(items.map((item) => ({
        id: item.id,
        content: item.label,
        start: item.start,
        end: item.end ?? undefined,
        group: item.group,
        title: `${item.kind}${item.confidence === null ? '' : ` - ${Math.round(item.confidence * 100)}% confidence`}`,
      })));
      timeline = new timelineLib.Timeline(containerRef.current, dataSet, {
        height: '180px',
        margin: { item: 8, axis: 10 },
        orientation: 'top',
        selectable: true,
        stack: true,
        zoomable: true,
      });
      if (onSelect) {
        timeline.on?.('select', (properties) => {
          const selectedId = properties.items?.[0];
          onSelect(items.find((item) => item.id === selectedId) ?? null);
        });
      }
    }

    void mountTimeline();
    return () => {
      cancelled = true;
      timeline?.destroy();
    };
  }, [items, onSelect]);

  return <div ref={containerRef} className="min-h-[180px] w-full overflow-hidden rounded-md border border-slate-200 bg-white" />;
}

export const CapsuleTemporalViewer = memo(CapsuleTemporalViewerComponent);
export default CapsuleTemporalViewerComponent;
