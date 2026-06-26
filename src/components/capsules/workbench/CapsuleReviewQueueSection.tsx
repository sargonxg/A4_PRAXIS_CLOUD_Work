'use client';

import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { StatePill, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleReviewQueueSection = memo(function CapsuleReviewQueueSection({ reviewQueue }: { reviewQueue: CapsuleWorkbenchViewModel['reviewQueue'] }) {
  return (
    <div id="capsule-review-queue">
      <WorkbenchSection title="Review Queue" icon={AlertTriangle}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <StatePill state="proposed" label="proposals stay review-gated" />
          <StatePill state={reviewQueue.length ? 'advisory' : 'reviewed'} label={`${reviewQueue.length} open card${reviewQueue.length === 1 ? '' : 's'}`} />
        </div>
        {reviewQueue.length ? (
          <div className="grid gap-2" data-testid="capsule-unified-review-queue">
            {reviewQueue.map((item) => (
              <article key={item.id} id={`capsule-review-${item.id}`} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.why}</p>
                  </div>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {item.target}
                  </span>
                </div>
                <div className="mt-2 grid gap-2 text-xs leading-5 text-slate-600 md:grid-cols-2">
                  <div className="rounded-md bg-slate-50 px-2 py-1.5">
                    <span className="font-semibold text-slate-900">Evidence: </span>
                    {item.evidenceLabels.length ? item.evidenceLabels.join(', ') : item.sourceType}
                  </div>
                  <div className="rounded-md bg-slate-50 px-2 py-1.5">
                    <span className="font-semibold text-slate-900">Impact: </span>
                    {item.impact}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.allowedActions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled
                      title={`${action} stays wired through the capsule proposal API.`}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold capitalize text-slate-500"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            No review cards are open.
          </p>
        )}
      </WorkbenchSection>
    </div>
  );
});
