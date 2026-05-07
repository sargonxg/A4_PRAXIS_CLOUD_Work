import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { SurfaceFact } from '@/lib/workbench/surface-state';

export function StaleContextPanel({ staleSignals }: { staleSignals: SurfaceFact[] }) {
  const stale = staleSignals.length > 0;
  const Icon = stale ? AlertTriangle : CheckCircle2;

  return (
    <section className={stale ? 'rounded-lg border border-amber-200 bg-amber-50 p-4' : 'rounded-lg border border-emerald-200 bg-emerald-50 p-4'}>
      <Icon className={stale ? 'h-5 w-5 text-amber-700' : 'h-5 w-5 text-emerald-700'} />
      <p className="mt-3 text-sm font-semibold text-navy-950">
        {stale ? 'Stale context advisory' : 'Context freshness acceptable'}
      </p>
      <p className={stale ? 'mt-1 text-sm leading-5 text-amber-900' : 'mt-1 text-sm leading-5 text-emerald-900'}>
        {staleSignals[0]?.detail ?? 'No stale source or context-health signal is currently elevated.'}
      </p>
      {staleSignals.length > 1 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-5 text-amber-900">
          {staleSignals.slice(1, 4).map((signal) => (
            <li key={`${signal.label}:${signal.value}`}>{signal.label}: {signal.detail}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
