'use client';

import { Clock3, Globe2, Orbit, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { GraphLayoutMode, GraphLayoutOption } from '@/types/visualization';

const ICONS = {
  oval: Orbit,
  force: Share2,
  timeline: Clock3,
  map: Globe2,
} satisfies Record<GraphLayoutMode, typeof Orbit>;

export function GraphLayoutToggle({
  options,
  value,
  onChange,
  className,
}: {
  options: GraphLayoutOption[];
  value: GraphLayoutMode;
  onChange: (mode: GraphLayoutMode) => void;
  className?: string;
}) {
  return (
    <div
      data-testid="graph-layout-toggle"
      className={cn('rounded-lg border border-slate-200 bg-white p-2 shadow-sm shadow-navy-950/5', className)}
      aria-label="Graph visualization mode"
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {options.map((option) => {
          const Icon = ICONS[option.id];
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => option.available && onChange(option.id)}
              disabled={!option.available}
              aria-pressed={value === option.id}
              title={option.available ? option.description : option.unavailableReason}
              className={cn(
                'flex min-h-14 items-center gap-2 rounded-md border px-3 py-2 text-left transition',
                value === option.id
                  ? 'border-navy-800 bg-navy-950 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-navy-900 hover:border-navy-300 hover:bg-white',
                !option.available && 'cursor-not-allowed opacity-55 hover:border-slate-200 hover:bg-slate-50',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', value === option.id ? 'text-gold-300' : 'text-gold-700')} />
              <span>
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className={cn('block text-[11px] leading-4', value === option.id ? 'text-blue-100/75' : 'text-slate-700')}>
                  {option.available ? option.description : option.unavailableReason}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
