'use client';

import { memo } from 'react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { cn } from '@/lib/utils/cn';
import { CompactList, StatePill } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleSourceabilityGatesSection = memo(function CapsuleSourceabilityGatesSection({
  coreSourceability,
}: {
  coreSourceability: CapsuleWorkbenchViewModel['coreSourceability'];
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-3" aria-label="Capsule sourceability gates" data-testid="capsule-core-sourceability-gates">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Per-core sourceability gate</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Ready status requires coverage at or above threshold and no unresolved unsupported claims or evidence gaps.</p>
        </div>
        <StatePill
          state={coreSourceability.every((gate) => gate.ready) ? 'canonical' : 'missing'}
          label={coreSourceability.every((gate) => gate.ready) ? 'all ready' : 'ready blocked'}
        />
      </div>
      <div className="grid gap-2 md:grid-cols-5">
        {coreSourceability.map((gate) => (
          <div key={gate.kind} className="rounded-md border border-slate-100 bg-slate-50 p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-800">{gate.kind}</p>
              <StatePill state={gate.ready ? 'canonical' : 'missing'} label={gate.ready ? 'ready' : 'blocked'} />
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <span
                className={cn('block h-full rounded-full', gate.ready ? 'bg-emerald-500' : gate.sourceCoverageScore >= gate.threshold ? 'bg-amber-500' : 'bg-rose-500')}
                style={{ width: `${Math.min(100, Math.max(0, gate.sourceCoverageScore))}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold text-slate-600">{gate.sourceCoverageScore}/{gate.threshold} coverage</p>
            <p className="mt-1 text-[11px] text-slate-500">{gate.evidenceGapCount} gap(s), {gate.unsupportedClaimCount} unsupported</p>
            <CompactList
              items={[...gate.gapLabels, ...gate.unsupportedClaims.map((claim) => `unsupported: ${claim}`)].slice(0, 3)}
              empty="No open gate issue."
            />
          </div>
        ))}
      </div>
    </section>
  );
});
