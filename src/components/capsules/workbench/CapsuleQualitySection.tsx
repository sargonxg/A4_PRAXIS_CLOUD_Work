'use client';

import { memo } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { cn } from '@/lib/utils/cn';
import { clampPercent, CompactList, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleQualitySection = memo(function CapsuleQualitySection({ quality }: { quality: CapsuleWorkbenchViewModel['quality'] }) {
  return (
    <WorkbenchSection title="Quality meter" icon={ShieldCheck}>
      <div data-testid="capsule-quality-meter" className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-lg font-semibold text-slate-950">
            {quality.score}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Live capsule quality</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{quality.diagnostics[0] ?? 'All tracked quality sections are currently clear.'}</p>
          </div>
        </div>
        <div className="grid gap-2">
          {quality.sections.map((section) => {
            const ratio = section.maxScore > 0 ? Math.round((section.score / section.maxScore) * 100) : 0;
            return (
              <div key={section.id} className="rounded-md border border-slate-100 bg-slate-50 p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-800">{section.label}</p>
                  <a
                    href={`#capsule-review-${section.fixTarget.reviewCardId ?? section.fixTarget.target}`}
                    className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-400"
                    data-builder-step={section.fixTarget.builderStep}
                    data-review-target={section.fixTarget.target}
                  >
                    Fix this
                  </a>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className={cn('h-full rounded-full', ratio >= 75 ? 'bg-emerald-500' : ratio >= 45 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${clampPercent(ratio)}%` }} />
                </div>
                <p className="mt-1 text-[11px] font-semibold text-slate-500">{section.score}/{section.maxScore}</p>
                <CompactList items={section.diagnostics} empty="No issue in this section." />
              </div>
            );
          })}
        </div>
      </div>
    </WorkbenchSection>
  );
});
