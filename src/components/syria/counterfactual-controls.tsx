'use client';

import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { SYRIA_COUNTERFACTUALS, summarizeCounterfactuals } from '@/lib/syria/counterfactuals';
import { cn } from '@/lib/utils/cn';

export function SyriaCounterfactualControls({
  activeIds,
  onChange,
  compact = false,
}: {
  activeIds: string[];
  onChange: (ids: string[]) => void;
  compact?: boolean;
}) {
  const summary = summarizeCounterfactuals(activeIds);

  function toggle(id: string) {
    onChange(activeIds.includes(id) ? activeIds.filter((item) => item !== id) : [...activeIds, id]);
  }

  return (
    <section className={cn('rounded-lg border border-amber-200 bg-amber-50 p-3', compact && 'p-2')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-amber-700" />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-800">Counterfactual overlay</p>
            <p className="text-xs text-amber-950">Confidence multiplier: x{summary.penalty.toFixed(2)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange([])}
          disabled={activeIds.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-900 disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1">
        {SYRIA_COUNTERFACTUALS.map((item) => {
          const active = activeIds.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => toggle(item.id)}
              className={cn(
                'snap-start rounded-md border px-3 py-2 text-left transition',
                active ? 'border-amber-500 bg-white shadow-sm' : 'border-amber-200 bg-amber-100/50 hover:bg-white',
              )}
              aria-pressed={active}
              title={item.description}
            >
              <span className="block whitespace-nowrap text-xs font-semibold text-navy-950">{item.shortLabel}</span>
              <span className="mt-1 block w-44 text-[11px] leading-4 text-slate-600">{item.pathSearchEffect}</span>
            </button>
          );
        })}
      </div>

      {summary.active.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {summary.active.map((item) => (
            <span key={item.id} className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-amber-900">
              {item.shortLabel}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
