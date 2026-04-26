'use client';

import { Activity, AlertTriangle, CheckCircle2, Clock3, Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { SemaphoreChip } from '@/components/app/semaphore-chip';
import { useAllToolStatuses } from '@/hooks/use-tool-status';
import { summarizeToolStatuses } from '@/lib/dashboard/tool-status-summary';
import { getToolById } from '@/lib/constants/tool-registry';
import { formatRelativeTime } from '@/lib/utils/format';

interface OperationalStatusPanelProps {
  situationId: string;
}

export function OperationalStatusPanel({ situationId }: OperationalStatusPanelProps) {
  const statuses = useAllToolStatuses(situationId);
  const summary = summarizeToolStatuses(statuses);

  return (
    <section className="rounded-md border border-slate-800 bg-slate-900/40 p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Operational status</h2>
          <p className="mt-1 text-xs text-slate-400">
            Tool freshness, running work, and attention points for this situation.
          </p>
        </div>
        {summary.running > 0 ? (
          <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-gold-400" />
        ) : (
          <Activity className="mt-0.5 h-4 w-4 text-slate-500" />
        )}
      </header>

      {summary.total === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-800 bg-slate-950/40 p-3">
          <p className="text-xs text-slate-400">
            No tool status rows yet. Run a tool, generate a daily read, or seed the graph to start building
            observable situation history.
          </p>
        </div>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <StatusMetric label="Fresh" value={summary.fresh} icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
            <StatusMetric label="Running" value={summary.running} icon={<Loader2 className="h-3.5 w-3.5" />} />
            <StatusMetric label="Stale" value={summary.stale} icon={<Clock3 className="h-3.5 w-3.5" />} />
            <StatusMetric label="Warnings" value={summary.warning} icon={<AlertTriangle className="h-3.5 w-3.5" />} />
            <StatusMetric label="Failed" value={summary.failed} icon={<AlertTriangle className="h-3.5 w-3.5" />} />
          </dl>

          <div className="mt-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Needs attention
            </h3>
            {summary.priorityItems.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                No failed, stale, or running tool outputs detected.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1.5">
                {summary.priorityItems.map((item) => {
                  const tool = getToolById(item.toolId);
                  return (
                    <li key={item.toolId} className="flex items-center justify-between gap-3 rounded px-1.5 py-1 hover:bg-slate-800/50">
                      <div className="flex min-w-0 items-center gap-2">
                        <SemaphoreChip state={item.health} />
                        <span className="truncate text-xs text-slate-200">{tool?.name ?? item.toolId}</span>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-500">
                        {item.isResearching
                          ? 'running'
                          : item.lastError
                            ? 'failed'
                            : item.isStale
                              ? 'stale'
                              : item.generatedAt
                                ? formatRelativeTime(item.generatedAt)
                                : 'not run'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function StatusMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/35 px-3 py-2">
      <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-slate-100">{value}</dd>
    </div>
  );
}
