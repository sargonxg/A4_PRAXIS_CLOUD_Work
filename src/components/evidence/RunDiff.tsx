'use client';

import { GitCompare } from 'lucide-react';
import { redactMarketplaceFoundationMarkers } from '@/lib/tools/marketplace/ui-redaction';

interface RunDiffProps {
  currentLabel: string;
  baselineLabel: string;
  currentText?: string | null;
  baselineText?: string | null;
}

interface DiffRow {
  key: string;
  kind: 'same' | 'added' | 'removed' | 'changed';
  before?: string;
  after?: string;
}

function buildDiff(baselineText: string, currentText: string): DiffRow[] {
  const baseline = redactMarketplaceFoundationMarkers(baselineText).split(/\r?\n/).slice(0, 80);
  const current = redactMarketplaceFoundationMarkers(currentText).split(/\r?\n/).slice(0, 80);
  const length = Math.max(baseline.length, current.length);
  const rows: DiffRow[] = [];

  for (let index = 0; index < length; index += 1) {
    const before = baseline[index];
    const after = current[index];
    if (before === after) rows.push({ key: `same-${index}`, kind: 'same', before, after });
    else if (before == null) rows.push({ key: `added-${index}`, kind: 'added', after });
    else if (after == null) rows.push({ key: `removed-${index}`, kind: 'removed', before });
    else rows.push({ key: `changed-${index}`, kind: 'changed', before, after });
  }

  return rows;
}

export function RunDiff({ currentLabel, baselineLabel, currentText, baselineText }: RunDiffProps) {
  if (!currentText || !baselineText) {
    return (
      <div className="mt-3 rounded border border-slate-200 bg-white p-3">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <GitCompare className="h-3 w-3" />
          Run comparison
        </p>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          A previous raw output is needed before PRAXIS can compare this run.
        </p>
      </div>
    );
  }

  const rows = buildDiff(baselineText, currentText);
  const changedRows = rows.filter((row) => row.kind !== 'same').length;

  return (
    <div className="mt-3 rounded border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          <GitCompare className="h-3 w-3" />
          Run comparison
        </p>
        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
          {changedRows} changed lines
        </span>
      </div>
      <div className="mt-2 grid gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:grid-cols-2">
        <span>{baselineLabel}</span>
        <span>{currentLabel}</span>
      </div>
      <div className="mt-2 max-h-72 overflow-auto rounded border border-slate-200">
        {rows.map((row) => (
          <div
            key={row.key}
            className={
              row.kind === 'same'
                ? 'grid grid-cols-2 border-b border-slate-100 bg-white text-slate-500'
                : row.kind === 'added'
                  ? 'grid grid-cols-2 border-b border-emerald-100 bg-emerald-50 text-emerald-950'
                  : row.kind === 'removed'
                    ? 'grid grid-cols-2 border-b border-red-100 bg-red-50 text-red-900'
                    : 'grid grid-cols-2 border-b border-gold-100 bg-gold-50 text-navy-950'
            }
          >
            <pre className="min-w-0 whitespace-pre-wrap border-r border-inherit px-2 py-1.5 text-[11px] leading-5">{row.before ?? ''}</pre>
            <pre className="min-w-0 whitespace-pre-wrap px-2 py-1.5 text-[11px] leading-5">{row.after ?? ''}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
