'use client';

import dynamic from 'next/dynamic';
import { memo } from 'react';
import { GitBranch } from 'lucide-react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import type { CapsuleTemporalViewerProps } from '@/components/capsules/viewers/CapsuleTemporalViewer';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { CompactList, StatePill, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

const CapsuleTemporalViewer = dynamic<CapsuleTemporalViewerProps>(
  () => import('@/components/capsules/viewers/CapsuleTemporalViewer').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <Skeleton className="min-h-[180px] w-full rounded-md border border-slate-200 bg-white" />,
  },
);

export const CapsuleTimelineSection = memo(function CapsuleTimelineSection({ timeline }: { timeline: CapsuleWorkbenchViewModel['timeline'] }) {
  return (
    <WorkbenchSection title="Timeline scrubber" icon={GitBranch}>
      <div data-testid="capsule-timeline-scrubber" className="space-y-3">
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
          <StatePill state={timeline.items.length ? 'canonical' : 'missing'} label={`${timeline.items.length} temporal anchors`} />
          {timeline.asOf ? <StatePill state="canonical" label={`as of ${timeline.asOf}`} /> : null}
          {timeline.validFrom || timeline.validUntil ? <StatePill state="canonical" label={`${timeline.validFrom ?? 'open'} to ${timeline.validUntil ?? 'open'}`} /> : null}
        </div>
        {timeline.items.length ? <CapsuleTemporalViewer items={timeline.items} /> : (
          <EmptyState
            icon={GitBranch}
            label="No timeline anchors attached yet."
            hint="Claim validity windows will appear here after the capsule has temporal receipts."
            testId="capsule-timeline-empty"
            className="min-h-32"
          />
        )}
        <CompactList
          items={timeline.items.map((item) => `${item.group}: ${item.label} (${item.start}${item.end ? ` to ${item.end}` : ''})`)}
          empty="No timeline anchors or claim validity windows attached yet."
        />
      </div>
    </WorkbenchSection>
  );
});
