import type { ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function EmptyState({
  action,
  className,
  hint,
  icon: Icon = Inbox,
  label,
  testId,
}: {
  action?: ReactNode;
  className?: string;
  hint?: string;
  icon?: LucideIcon;
  label: string;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId ?? 'empty-state'}
      className={cn(
        'grid min-h-28 place-items-center rounded-lg border border-dashed border-emerald-200 bg-emerald-50/45 p-4 text-center',
        className,
      )}
    >
      <div className="max-w-sm">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-emerald-200 bg-white text-emerald-700">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-950">{label}</p>
        {hint ? <p className="mt-1 text-xs leading-5 text-slate-600">{hint}</p> : null}
        {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
