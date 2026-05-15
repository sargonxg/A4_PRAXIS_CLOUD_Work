import Link from 'next/link';
import { ArrowRight, CheckCircle2, CircleAlert, CircleDashed } from 'lucide-react';
import type { ContextHealthReport, ContextHealthSignal } from '@/lib/context/context-health';
import { cn } from '@/lib/utils/cn';

const SIGNAL_IDS = ['user-core', 'situation-core', 'sources', 'draft'] as const;

interface ContextQualityMeterProps {
  report: ContextHealthReport;
  className?: string;
}

export function ContextQualityMeter({ report, className }: ContextQualityMeterProps) {
  const visibleSignals = SIGNAL_IDS.map((id) => report.signals.find((signal) => signal.id === id)).filter(Boolean) as ContextHealthSignal[];
  const actions = (report.nextActions.length ? report.nextActions : [{
    id: 'ask-context',
    label: 'Ask PRAXIS',
    detail: 'Reason with the active context.',
    href: '/app/assistant',
    priority: 'optional' as const,
  }]).slice(0, 3);
  const primaryAction = actions[0];

  return (
    <section className={cn('rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-700">Context quality</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-navy-950">{report.score}</p>
            <p className="text-sm font-semibold text-slate-700">/100 · {report.label}</p>
          </div>
        </div>
        <Link href={primaryAction.href} className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800">
          Improve context
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {visibleSignals.map((signal) => (
          <div key={signal.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-1.5">
              {signal.status === 'ready' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : signal.status === 'partial' ? (
                <CircleDashed className="h-3.5 w-3.5 text-gold-700" />
              ) : (
                <CircleAlert className="h-3.5 w-3.5 text-crimson" />
              )}
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                {signal.id === 'draft' ? 'Output' : signal.label.replace(' Core', '')}
              </p>
            </div>
            <p className={cn('mt-1 text-xs font-semibold', signal.status === 'ready' ? 'text-emerald-700' : signal.status === 'partial' ? 'text-gold-800' : 'text-crimson')}>
              {signal.status}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {actions.map((action, index) => (
          <Link
            key={action.id}
            href={action.href}
            className={cn(
              'flex items-start gap-2 rounded-md border px-3 py-2 text-xs leading-5 transition',
              index === 0 ? 'border-gold-200 bg-gold-50 text-navy-950 hover:bg-gold-100' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white',
            )}
          >
            <span className="mt-0.5 font-semibold tabular-nums text-gold-800">{index + 1}</span>
            <span>
              <span className="block font-semibold">{action.label}</span>
              <span className="block text-slate-600">{action.detail}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
