'use client';

import type { ReactNode } from 'react';
import { FileSearch } from 'lucide-react';

export function EmptyState({
  headline,
  subtext,
  primaryCta,
  secondaryCta,
}: {
  headline: string;
  subtext: string;
  primaryCta?: ReactNode;
  secondaryCta?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center" data-testid="praxis-empty-state">
      <FileSearch className="mx-auto h-6 w-6 text-slate-400" />
      <h3 className="mt-2 text-sm font-semibold text-navy-950">{headline}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-600">{subtext}</p>
      {(primaryCta || secondaryCta) ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {primaryCta}
          {secondaryCta}
        </div>
      ) : null}
    </div>
  );
}
