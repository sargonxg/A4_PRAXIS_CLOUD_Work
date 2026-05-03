'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export function ErrorState({
  headline,
  subtext,
  onRetry,
  children,
}: {
  headline: string;
  subtext: string;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-amber-950">{headline}</h3>
          <p className="mt-1 text-xs leading-5 text-amber-900">{subtext}</p>
          {children ? <div className="mt-3">{children}</div> : null}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
