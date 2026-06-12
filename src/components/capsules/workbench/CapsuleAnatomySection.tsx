'use client';

import { memo, type ReactNode } from 'react';
import { BrainCircuit, Database, ShieldCheck } from 'lucide-react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { cn } from '@/lib/utils/cn';
import { CompactList, InfoLine, StateDot, StatePill, WorkbenchSection } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsuleAnatomySection = memo(function CapsuleAnatomySection({
  compact,
  summaryFacts,
  evidence,
  sparse,
  anatomy,
  graphSection,
}: {
  compact: boolean;
  summaryFacts: CapsuleWorkbenchViewModel['summaryFacts'];
  evidence: CapsuleWorkbenchViewModel['evidence'];
  sparse: boolean;
  anatomy: CapsuleWorkbenchViewModel['anatomy'];
  graphSection: ReactNode;
}) {
  return (
    <>
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]')}>
        <WorkbenchSection title="Overview" icon={ShieldCheck}>
          <div className="grid gap-2 text-sm leading-6 text-slate-600">
            <InfoLine label="Domain" value={summaryFacts.domain ?? 'Policy work'} />
            <InfoLine label="Jurisdiction" value={summaryFacts.jurisdiction ?? 'Review before local use'} />
            <InfoLine label="Output goal" value={summaryFacts.outputGoal ?? 'No output target set'} />
            <InfoLine label="Next action" value={summaryFacts.nextAction} strong />
          </div>
        </WorkbenchSection>
        <WorkbenchSection title="Evidence" icon={Database}>
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
            <StatePill state={evidence.sourceCount ? 'canonical' : 'missing'} label={evidence.sourcePosture || 'No source receipts attached yet.'} />
            <StatePill state={evidence.unsupportedClaims.length ? 'proposed' : 'canonical'} label={`${evidence.unsupportedClaims.length} unsupported`} />
            <StatePill state={evidence.dateChecks.length ? 'proposed' : 'canonical'} label={`${evidence.dateChecks.length} date checks`} />
          </div>
          <CompactList
            items={evidence.gaps.length ? evidence.gaps : sparse ? ['No source receipts attached yet.'] : ['No evidence gap recorded.']}
            empty="No evidence gap recorded."
          />
        </WorkbenchSection>
      </div>
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : '2xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]')}>
        <WorkbenchSection title="Anatomy" icon={BrainCircuit}>
          <div className="grid gap-2 sm:grid-cols-2">
            {anatomy.map((core) => (
              <div key={core.kind} className="rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{core.kind}</p>
                  <StateDot state={core.reviewState} />
                </div>
                <p className="mt-1 truncate text-xs font-semibold text-slate-800">{core.status === 'present' ? core.ids.join(', ') : core.label}</p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">{core.description}</p>
              </div>
            ))}
          </div>
        </WorkbenchSection>
        {graphSection}
      </div>
    </>
  );
});
