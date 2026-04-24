'use client';

/**
 * WidgetShell — base layout for dashboard widgets.
 * Handles the uniform card chrome, header, footnote, click target, loading
 * and error states so each widget body can focus on its data rendering.
 *
 * Per spec §8.1: any single widget failing must not break the page.
 */

import { cn } from '@/lib/utils/cn';
import { PraxisLink } from '@/components/shared/praxis-link';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReactNode } from 'react';

export interface WidgetShellProps {
  title: string;
  subtitle?: string;
  href?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function WidgetShell({
  title,
  subtitle,
  href,
  loading,
  error,
  onRetry,
  className,
  icon,
  children,
}: WidgetShellProps) {
  const body = (() => {
    if (loading) {
      return (
        <div className="flex flex-col gap-2 pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-start gap-2 pt-2 text-sm text-slate-400">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              Retry
            </button>
          ) : null}
        </div>
      );
    }
    return children;
  })();

  const inner = (
    <div
      className={cn(
        'group relative flex h-full flex-col rounded-lg border border-slate-800 bg-slate-900/40 p-4 transition-colors',
        href ? 'hover:border-slate-600 hover:bg-slate-900/70 cursor-pointer' : '',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon ? <span className="shrink-0 text-slate-400">{icon}</span> : null}
          <div className="min-w-0">
            <h3 className="truncate text-xs font-semibold uppercase tracking-wider text-slate-300">
              {title}
            </h3>
            {subtitle ? (
              <p className="truncate text-[11px] text-slate-500">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {href ? (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-slate-300" />
        ) : null}
      </header>
      <div className="mt-3 flex-1">{body}</div>
    </div>
  );

  return href ? (
    <PraxisLink href={href} className="block h-full focus:outline-none">
      {inner}
    </PraxisLink>
  ) : (
    inner
  );
}
