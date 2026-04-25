'use client';

import { cn } from '@/lib/utils/cn';

export type Semaphore = 'grey' | 'blue' | 'purple' | 'yellow' | 'green' | 'red';

const STYLES: Record<Semaphore, { dot: string; label: string; ring: string }> = {
  grey:   { dot: 'bg-zinc-400',    label: 'Idle',       ring: 'ring-zinc-400/30' },
  blue:   { dot: 'bg-sky-500',     label: 'Scheduled',  ring: 'ring-sky-500/30' },
  purple: { dot: 'bg-violet-500 animate-pulse', label: 'Reasoning',  ring: 'ring-violet-500/30' },
  yellow: { dot: 'bg-amber-500 animate-pulse',  label: 'Working',    ring: 'ring-amber-500/30' },
  green:  { dot: 'bg-emerald-500', label: 'Done',       ring: 'ring-emerald-500/30' },
  red:    { dot: 'bg-rose-500',    label: 'Failed',     ring: 'ring-rose-500/30' },
};

export function SemaphoreChip({
  state,
  label,
  className,
  size = 'sm',
}: {
  state: Semaphore;
  label?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  const s = STYLES[state] ?? STYLES.grey;
  const sizeClass = size === 'xs' ? 'h-1.5 w-1.5' : size === 'md' ? 'h-3 w-3' : 'h-2 w-2';
  const textClass = size === 'xs' ? 'text-[10px]' : size === 'md' ? 'text-sm' : 'text-xs';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ring-1',
        textClass,
        s.ring,
        className,
      )}
    >
      <span className={cn('rounded-full', sizeClass, s.dot)} aria-hidden />
      <span className="font-medium tracking-wide text-zinc-200">
        {label ?? s.label}
      </span>
    </span>
  );
}
