'use client';

import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { CompactList, StatePill, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleReviewQueueSection = memo(function CapsuleReviewQueueSection({ reviewQueue }: { reviewQueue: CapsuleWorkbenchViewModel['reviewQueue'] }) {
  return (
    <WorkbenchSection title="Review Queue" icon={AlertTriangle}>
      <div className="mb-2">
        <StatePill state="proposed" label="proposals stay review-gated" />
      </div>
      <CompactList
        items={reviewQueue.map((item) => `${item.target}: ${item.title}`)}
        empty="No review cards are open."
      />
    </WorkbenchSection>
  );
});
