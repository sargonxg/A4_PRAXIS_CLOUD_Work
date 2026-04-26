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
  // Color tokens flipped 2026-04-26 for light-mode dashboard. Earlier
  // revisions used dark-theme slate-800/900/300/500/600 which left card
  // text barely legible on the cream/white app background. The new tokens
  // hit WCAG AA contrast on the navy-on-white surface.
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
        <div className="flex flex-col items-start gap-2 pt-2 text-sm text-navy-600">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-navy-700 hover:bg-slate-50"
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
        'group relative flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5 transition-colors',
        href ? 'hover:border-diplomatic-blue/30 hover:shadow-md cursor-pointer' : '',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon ? <span className="shrink-0 text-diplomatic-blue/80">{icon}</span> : null}
          <div className="min-w-0">
            <h3 className="truncate text-xs font-semibold uppercase tracking-wider text-navy-700">
              {title}
            </h3>
            {subtitle ? (
              <p className="truncate text-[11px] text-navy-500">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {href ? (
          <ArrowUpRight className="h-4 w-4 shrink-0 text-navy-400 transition-colors group-hover:text-diplomatic-blue" />
        ) : null}
      </header>
      <div className="mt-3 flex-1 text-navy-800">{body}</div>
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
