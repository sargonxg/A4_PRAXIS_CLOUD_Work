'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { WidgetShell } from './widget-shell';
import { ADVISOR_IDS, type AdvisorId } from '@/types/advisor';
import { formatRelativeTime } from '@/lib/utils/format';

const ADVISOR_META: Record<
  string,
  { name: string; title: string; initials: string; accent: string }
> = {
  adeyemi:    { name: 'Dr. Ngozi Adeyemi',     title: 'Political Affairs',     initials: 'NA', accent: '#4E79A7' },
  reyes:      { name: 'Gen. (Ret.) Reyes',      title: 'Security & Operations', initials: 'AR', accent: '#A63D40' },
  vanderberg: { name: 'Dr. Sigrid Vanderberg',  title: 'Political Economy',     initials: 'SV', accent: '#E8B931' },
  takeda:     { name: 'Amb. Hiroshi Takeda',    title: 'Diplomatic Craft',      initials: 'HT', accent: '#59A14F' },
};

interface RecentTurn {
  advisorId: AdvisorId;
  lastTurnAt: string | null;
  snippet: string | null;
}

interface AdvisorsWidgetProps {
  /** When provided, fetches recent last-turn-per-advisor for this situation. */
  situationId?: string;
}

export function AdvisorsWidget({ situationId }: AdvisorsWidgetProps) {
  const [recent, setRecent] = useState<Record<AdvisorId, RecentTurn | null> | null>(null);

  useEffect(() => {
    if (!situationId) {
      setRecent(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/advisors/recent-by-situation?sid=${encodeURIComponent(situationId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items?: RecentTurn[] } | null) => {
        if (cancelled || !data?.items) return;
        const map = Object.fromEntries(
          data.items.map((t) => [t.advisorId, t]),
        ) as Record<AdvisorId, RecentTurn | null>;
        setRecent(map);
      })
      .catch(() => {
        /* best-effort; falls back to no-recency render */
      });
    return () => {
      cancelled = true;
    };
  }, [situationId]);

  return (
    <WidgetShell
      title="Advisor council"
      subtitle="4 flagship voices — click one to open chat"
      icon={<Users className="h-4 w-4" />}
    >
      <div className="grid grid-cols-2 gap-1.5">
        {ADVISOR_IDS.map((id) => {
          const a = ADVISOR_META[id];
          const turn = recent?.[id] ?? null;
          const interacted = Boolean(turn?.lastTurnAt);
          return (
            <PraxisLink
              key={id}
              href={`/advisory?advisor=${id}`}
              className={`flex items-center gap-1.5 rounded border px-2 py-1.5 hover:border-slate-600 ${
                interacted
                  ? 'border-slate-800 bg-slate-950/40'
                  : 'border-slate-800/60 bg-slate-950/20 opacity-70'
              }`}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-slate-950"
                style={{ background: a.accent }}
              >
                {a.initials}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[11px] font-medium text-slate-200">{a.name}</span>
                <span className="truncate text-[10px] text-slate-500">
                  {turn?.lastTurnAt
                    ? `Last turn ${formatRelativeTime(turn.lastTurnAt)}`
                    : a.title}
                </span>
              </div>
            </PraxisLink>
          );
        })}
      </div>
    </WidgetShell>
  );
}
