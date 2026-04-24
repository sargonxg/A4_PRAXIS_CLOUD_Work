'use client';

import { Users } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { WidgetShell } from './widget-shell';
import { ADVISOR_IDS } from '@/types/advisor';

const ADVISOR_META: Record<
  string,
  { name: string; title: string; initials: string; accent: string }
> = {
  adeyemi:    { name: 'Dr. Ngozi Adeyemi',     title: 'Political Affairs',     initials: 'NA', accent: '#4E79A7' },
  reyes:      { name: 'Gen. (Ret.) Reyes',      title: 'Security & Operations', initials: 'AR', accent: '#A63D40' },
  vanderberg: { name: 'Dr. Sigrid Vanderberg',  title: 'Political Economy',     initials: 'SV', accent: '#E8B931' },
  takeda:     { name: 'Amb. Hiroshi Takeda',    title: 'Diplomatic Craft',      initials: 'HT', accent: '#59A14F' },
};

export function AdvisorsWidget() {
  return (
    <WidgetShell
      title="Advisor council"
      subtitle="4 flagship voices — click one to open chat"
      icon={<Users className="h-4 w-4" />}
    >
      <div className="grid grid-cols-2 gap-1.5">
        {ADVISOR_IDS.map((id) => {
          const a = ADVISOR_META[id];
          return (
            <PraxisLink
              key={id}
              href={`/advisory?advisor=${id}`}
              className="flex items-center gap-1.5 rounded border border-slate-800 bg-slate-950/40 px-2 py-1.5 hover:border-slate-600"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-slate-950"
                style={{ background: a.accent }}
              >
                {a.initials}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[11px] font-medium text-slate-200">{a.name}</span>
                <span className="truncate text-[10px] text-slate-500">{a.title}</span>
              </div>
            </PraxisLink>
          );
        })}
      </div>
    </WidgetShell>
  );
}
