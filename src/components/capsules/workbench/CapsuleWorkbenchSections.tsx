'use client';

import { memo, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { CapsuleWorkbenchReviewState, CapsuleWorkbenchViewModel } from '@/lib/context/capsule-workbench-view-model';
import { cn } from '@/lib/utils/cn';

export const PILLAR_TITLES: Record<CapsuleWorkbenchViewModel['pillars'][number]['id'], 'User' | 'Situation' | 'Tools' | 'Output'> = {
  user: 'User',
  situation: 'Situation',
  tools: 'Tools',
  output: 'Output',
};

export const CapsuleWorkbenchHeader = memo(function CapsuleWorkbenchHeader({
  title,
  summary,
  readiness,
  graphNodeCount,
  reviewQueueCount,
  compact,
  dialecticaLineage = false,
}: {
  title: string;
  summary: string;
  readiness: CapsuleWorkbenchViewModel['readiness'];
  graphNodeCount: number;
  reviewQueueCount: number;
  compact: boolean;
  dialecticaLineage?: boolean;
}) {
  return (
    <div className={cn('flex gap-3', compact ? 'flex-col' : 'flex-col lg:flex-row lg:items-start lg:justify-between')}>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Capsule Studio</p>
        <h3 className="mt-1 text-base font-semibold leading-6 text-slate-950">{title}</h3>
        {dialecticaLineage ? (
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-800" data-testid="capsule-dialectica-lineage">
            DIALECTICA <span aria-hidden>◳</span> verified-context lineage
          </p>
        ) : null}
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{summary}</p>
      </div>
      <div className="grid min-w-[12rem] grid-cols-3 gap-1.5 text-center">
        <Metric label="Ready" value={`${readiness.score}`} tone={readiness.tier} />
        <Metric label="Graph" value={`${graphNodeCount}`} />
        <Metric label="Review" value={`${reviewQueueCount}`} tone={reviewQueueCount ? 'amber' : 'green'} />
      </div>
    </div>
  );
});

export function WorkbenchSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <p className="truncate text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{title}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function CompactList({ items, empty }: { items: string[]; empty: string }) {
  const clean = items.filter(Boolean).slice(0, 5);
  return (
    <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
      {clean.length ? clean.map((item, index) => (
        <li key={`${item}-${index}`} className="rounded-md bg-slate-50 px-2 py-1.5">{item}</li>
      )) : <li className="rounded-md border border-dashed border-slate-200 px-2 py-1.5 text-slate-500">{empty}</li>}
    </ul>
  );
}

export function InfoLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <p className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</span>
      <span className={cn('min-w-0', strong ? 'font-semibold text-slate-900' : 'text-slate-600')}>{value}</span>
    </p>
  );
}

export function Metric({ label, value, tone = 'slate' }: { label: string; value: string; tone?: 'red' | 'amber' | 'green' | 'slate' }) {
  const toneClass = {
    red: 'border-rose-200 bg-rose-50 text-rose-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  }[tone];
  return (
    <span className={cn('rounded-md border px-2 py-1.5', toneClass)}>
      <span className="block text-sm font-semibold">{value}</span>
      <span className="block text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</span>
    </span>
  );
}

export function StatePill({ state, label }: { state: CapsuleWorkbenchReviewState | string; label: string }) {
  return (
    <span className={cn('rounded-md border px-2 py-1 text-[10px] font-semibold', stateClass(state))}>
      {label}
    </span>
  );
}

export function StateDot({ state }: { state: CapsuleWorkbenchReviewState }) {
  if (state === 'canonical' || state === 'reviewed') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (state === 'missing') return <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />;
  return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
}

export function formatConfidence(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'confidence not set';
  return `${Math.round(value * 100)}% confidence`;
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function stateClass(state: string): string {
  if (state === 'canonical' || state === 'reviewed' || state === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (state === 'missing') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (state === 'advisory') return 'border-sky-200 bg-sky-50 text-sky-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}
