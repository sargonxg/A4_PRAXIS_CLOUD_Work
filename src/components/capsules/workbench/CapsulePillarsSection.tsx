'use client';

import { memo } from 'react';
import type { CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { InfoLine, PILLAR_TITLES, StatePill } from '@/components/capsules/workbench/CapsuleWorkbenchSections';

export const CapsulePillarsSection = memo(function CapsulePillarsSection({ pillars }: { pillars: CapsuleWorkbenchViewModel['pillars'] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Capsule four-pillar model">
      {pillars.map((pillar) => (
        <section key={pillar.id} className="min-w-0 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{pillar.id}</p>
              <h4 className="mt-1 text-sm font-semibold text-slate-950">{PILLAR_TITLES[pillar.id] ?? pillar.title}</h4>
            </div>
            <StatePill state={pillar.facts.some((fact) => fact.reviewState === 'missing') ? 'missing' : 'canonical'} label={`${pillar.sections.length} panels`} />
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{pillar.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {pillar.sections.map((section) => (
              <span key={section} className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">
                {section}
              </span>
            ))}
          </div>
          <div className="mt-3 grid gap-1.5">
            {pillar.facts.map((fact) => (
              <InfoLine key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
});
