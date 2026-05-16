'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Circle, Sparkles, Wrench } from 'lucide-react';
import { CapsuleRadar } from '@/components/cores/CapsuleRadar';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import { cn } from '@/lib/utils/cn';

interface CapsuleReadinessRailProps {
  capsule: PraxisCapsule | null;
  onAxisActivate?: (axis: string) => void;
}

export function CapsuleReadinessRail({ capsule, onAxisActivate }: CapsuleReadinessRailProps) {
  const warnings = capsule?.health.warnings ?? [];
  const missing = capsule?.health.missingCores ?? [];
  const score = capsule?.health.score ?? 0;
  const trust = capsule?.trust;
  const signals = useMemo(() => capsule?.health.signals ?? [], [capsule]);
  const ready = signals.filter((s) => s.status === 'ready').length;
  const thin = signals.filter((s) => s.status === 'thin').length;

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">
      <section className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm shadow-navy-950/5 backdrop-blur">
        <header className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">Core health semaphore</p>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold',
              trust?.level === 'green' ? 'bg-emerald-100 text-emerald-800' : trust?.level === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800',
            )}
          >
            {trust?.label ?? `${score}/100`}
          </span>
        </header>
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <Circle
            className={cn(
              'mt-0.5 h-3.5 w-3.5 fill-current',
              trust?.level === 'green' ? 'text-emerald-600' : trust?.level === 'amber' ? 'text-amber-500' : 'text-rose-600',
            )}
          />
          <div>
            <p className="text-xs font-semibold text-navy-950">{score}/100 · {trust?.level ?? 'grey'}</p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-600">
              {trust?.summary ?? 'Select or build a capsule to check whether its cores are solid enough.'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <CapsuleRadar size="full" capsuleId={capsule?.capsuleId ?? null} onAxisActivate={onAxisActivate} />
        </div>
        <p className="mt-2 text-[10px] text-slate-500">
          {ready} ready · {thin} thin · {missing.length} missing
        </p>
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm shadow-navy-950/5 backdrop-blur">
        <header className="mb-2 flex items-center gap-2">
          <Wrench className="h-3 w-3 text-amber-600" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">Repair suggestions</p>
        </header>
        {warnings.length === 0 ? (
          <p className="flex items-center gap-2 text-[11px] text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Capsule is well-formed.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {warnings.slice(0, 5).map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-slate-700">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                <span className="leading-snug">{w}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/85 p-4 shadow-sm shadow-navy-950/5 backdrop-blur">
        <header className="mb-2 flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-diplomatic-blue" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">What this capsule unlocks</p>
        </header>
        <ul className="space-y-1 text-[11px] text-slate-700">
          <li>Ask PRAXIS reads every core slot above as context.</li>
          <li>Suggested actions appear in Ask and Memo Studio.</li>
          <li>Lock a core to pin it across reasoning turns.</li>
        </ul>
      </section>
    </aside>
  );
}
