'use client';

/**
 * FixThisFirstPanel — the inline affordance PRAXIS shows in place of
 * a tool result when the active capsule is missing one or more
 * required cores. Designed to be rendered by tool error boundaries
 * when an AI route returns 412 with a `missingCores: CoreId[]` body.
 *
 * Replaces the generic "tool failed" red toast for the most common
 * authentic failure mode: thin context. The user gets a warm,
 * structured nudge to repair the capsule rather than retry blindly.
 *
 * Design rules §1 (two actions max) and §4 (short empty state).
 */

import Link from 'next/link';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type RequiredCoreKind =
  | 'user'
  | 'situation'
  | 'source'
  | 'graph'
  | 'time'
  | 'output';

const CORE_LABEL: Record<RequiredCoreKind, string> = {
  user: 'User Core',
  situation: 'Situation Core',
  source: 'Source Core',
  graph: 'Graph Core',
  time: 'Time Core',
  output: 'Output Core',
};

const CORE_REPAIR_HREF: Record<RequiredCoreKind, string> = {
  user: '/app/cores/user',
  situation: '/app/contexts',
  source: '/app/workbench',
  graph: '/app/workbench?tab=graph',
  time: '/app/workbench',
  output: '/app/write',
};

const CORE_REPAIR_CTA: Record<RequiredCoreKind, string> = {
  user: 'Set posture',
  situation: 'Attach situation',
  source: 'Add receipts',
  graph: 'Open graph',
  time: 'Set horizon',
  output: 'Open memo',
};

export interface FixThisFirstPanelProps {
  /** Cores this tool requires but the active capsule doesn't have. */
  missing: RequiredCoreKind[];
  /** Cores that exist but are stale (e.g. older than the freshness gate). */
  stale?: RequiredCoreKind[];
  /** Optional headline override. Default: "Fix this first." */
  title?: string;
  /** Optional one-line explanation of what tool was attempted. */
  toolHint?: string;
  className?: string;
}

export function FixThisFirstPanel({
  missing,
  stale = [],
  title = 'Fix this first.',
  toolHint,
  className,
}: FixThisFirstPanelProps) {
  const rows = [
    ...missing.map((k) => ({ kind: k, status: 'missing' as const })),
    ...stale.map((k) => ({ kind: k, status: 'stale' as const })),
  ];
  // De-dupe in case a kind shows up as both missing and stale.
  const seen = new Set<string>();
  const deduped = rows.filter((r) => {
    const key = `${r.kind}-${r.status}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduped.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-amber-200/80 bg-[#FFF8EC] p-5 shadow-sm shadow-amber-900/5',
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8A5A00]">Thin capsule</p>
          <h3 className="mt-1 font-serif text-xl text-slate-950">{title}</h3>
          {toolHint ? (
            <p className="mt-1 text-sm text-slate-700">{toolHint}</p>
          ) : null}
          <ul className="mt-4 space-y-2">
            {deduped.map((row) => (
              <li key={`${row.kind}-${row.status}`}>
                <Link
                  href={CORE_REPAIR_HREF[row.kind]}
                  className="group flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-3 py-2 transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className={cn(
                        'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
                        row.status === 'missing' ? 'bg-amber-600' : 'bg-amber-400',
                      )}
                    />
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {CORE_LABEL[row.kind]}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-800">
                      {row.status}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#8A5A00] group-hover:text-amber-900">
                    {CORE_REPAIR_CTA[row.kind]}
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
