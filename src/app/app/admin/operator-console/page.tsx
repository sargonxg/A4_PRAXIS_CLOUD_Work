'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { SemaphoreChip, type Semaphore } from '@/components/app/semaphore-chip';
import { cn } from '@/lib/utils/cn';

interface FirestoreTimestamp {
  _seconds?: number;
  _nanoseconds?: number;
  seconds?: number;
  nanoseconds?: number;
}

interface SystemEvent {
  eventId: string;
  kind: string;
  severity: 'info' | 'warn' | 'error' | 'critical';
  uid: string | null;
  situationId: string | null;
  jobId: string | null;
  toolRunId: string | null;
  message: string;
  source: string;
  serviceAccount: string;
  createdAt: FirestoreTimestamp;
}

interface BackgroundJobAdmin {
  jobId: string;
  uid: string | null;
  kind: string;
  status: string;
  semaphore: Semaphore;
  attempt: number;
  maxAttempts: number;
  error: { code: string; message: string } | null;
  progress: { percent: number; message: string } | null;
  updatedAt: FirestoreTimestamp;
}

interface ToolRunAdmin {
  toolRunId: string;
  uid: string;
  toolId: string;
  status: string;
  semaphore: Semaphore;
  startedAt: FirestoreTimestamp;
  durationMs: number | null;
  error: { code: string; message: string } | null;
}

const SEVERITY_RANK: Record<string, number> = { critical: 4, error: 3, warn: 2, info: 1 };

export default function OperatorConsole() {
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [jobs, setJobs] = useState<BackgroundJobAdmin[]>([]);
  const [runs, setRuns] = useState<ToolRunAdmin[]>([]);
  const [filter, setFilter] = useState<'all' | 'failed' | 'warn'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch('/api/admin/operator-console', { cache: 'no-store' });
        if (!res.ok) {
          if (!cancelled) setError(`HTTP ${res.status}`);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setEvents(data.events ?? []);
        setJobs(data.jobs ?? []);
        setRuns(data.runs ?? []);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user]);

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    if (filter === 'failed') return events.filter((e) => e.severity === 'error' || e.severity === 'critical');
    return events.filter((e) => SEVERITY_RANK[e.severity] >= 2);
  }, [events, filter]);

  const counters = useMemo(() => ({
    runningJobs: jobs.filter((j) => j.status === 'running').length,
    failedJobs: jobs.filter((j) => j.status === 'failed').length,
    deadLetter: jobs.filter((j) => j.status === 'dead_letter').length,
    failedRunsLast: runs.filter((r) => r.status === 'failed').length,
    errorEventsLast: events.filter((e) => e.severity === 'error' || e.severity === 'critical').length,
  }), [jobs, runs, events]);

  if (loading) return null;
  if (!user) return <div className="p-6 text-zinc-400">Not authenticated.</div>;

  return (
    <div className="mx-auto max-w-7xl p-6 text-zinc-100">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Operator Console</h1>
          <p className="text-sm text-zinc-400">PRAXIS platform health, jobs, events, and incidents.</p>
        </div>
        <div className="flex gap-2 text-xs">
          {(['all', 'warn', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-full border px-3 py-1 transition',
                filter === f
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-500',
              )}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {error ? (
        <div className="mb-4 rounded-md border border-rose-700 bg-rose-950/40 p-3 text-sm text-rose-300">
          Operator console fetch failed: {error}. If you are seeing 403, your uid is not in ADMIN_ALLOWLIST.
        </div>
      ) : null}

      <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Counter label="Running" value={counters.runningJobs} state="yellow" />
        <Counter label="Failed jobs" value={counters.failedJobs} state={counters.failedJobs > 0 ? 'red' : 'green'} />
        <Counter label="Dead-letter" value={counters.deadLetter} state={counters.deadLetter > 0 ? 'red' : 'green'} />
        <Counter label="Failed tool runs" value={counters.failedRunsLast} state={counters.failedRunsLast > 0 ? 'yellow' : 'green'} />
        <Counter label="Error events" value={counters.errorEventsLast} state={counters.errorEventsLast > 0 ? 'red' : 'green'} />
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">Background jobs</h2>
        <Table
          rows={jobs.slice(0, 30)}
          columns={[
            { key: 'kind', label: 'Kind' },
            { key: 'status', label: 'Status', render: (r) => <SemaphoreChip state={r.semaphore} label={r.status} /> },
            { key: 'attempt', label: 'Attempt', render: (r) => `${r.attempt}/${r.maxAttempts}` },
            { key: 'progress', label: 'Progress', render: (r) => r.progress ? `${r.progress.percent}% ${r.progress.message}` : '—' },
            { key: 'error', label: 'Error', render: (r) => r.error ? <span className="text-rose-400">{r.error.code}</span> : '—' },
            { key: 'updatedAt', label: 'Updated', render: (r) => formatRel(r.updatedAt) },
          ]}
        />
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">Recent tool runs</h2>
        <Table
          rows={runs.slice(0, 30)}
          columns={[
            { key: 'toolId', label: 'Tool' },
            { key: 'status', label: 'Status', render: (r) => <SemaphoreChip state={r.semaphore} label={r.status} /> },
            { key: 'durationMs', label: 'Duration', render: (r) => r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : '—' },
            { key: 'error', label: 'Error', render: (r) => r.error ? r.error.code : '—' },
            { key: 'startedAt', label: 'Started', render: (r) => formatRel(r.startedAt) },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">System events</h2>
        <Table
          rows={filteredEvents.slice(0, 80)}
          columns={[
            { key: 'kind', label: 'Kind' },
            { key: 'severity', label: 'Severity', render: (r) => severityBadge(r.severity) },
            { key: 'source', label: 'Source' },
            { key: 'message', label: 'Message', render: (r) => <span className="truncate">{r.message}</span> },
            { key: 'createdAt', label: 'When', render: (r) => formatRel(r.createdAt) },
          ]}
        />
      </section>
    </div>
  );
}

function Counter({ label, value, state }: { label: string; value: number; state: Semaphore }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="text-xs text-zinc-400">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <SemaphoreChip state={state} label={value === 0 ? 'OK' : undefined} size="sm" />
      </div>
    </div>
  );
}

function severityBadge(s: SystemEvent['severity']) {
  const map: Record<SystemEvent['severity'], Semaphore> = {
    info: 'green', warn: 'yellow', error: 'red', critical: 'red',
  };
  return <SemaphoreChip state={map[s]} label={s} />;
}

function formatRel(ts: FirestoreTimestamp | undefined): string {
  if (!ts) return '—';
  const seconds = ts._seconds ?? ts.seconds;
  if (typeof seconds !== 'number') return '—';
  const ms = seconds * 1000;
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return new Date(ms).toLocaleString();
}

function Table<T extends { [k: string]: unknown }>({
  rows,
  columns,
}: {
  rows: T[];
  columns: { key: keyof T; label: string; render?: (r: T) => React.ReactNode }[];
}) {
  if (rows.length === 0) {
    return <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-500">No rows.</div>;
  }
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-400">
          <tr>{columns.map((c) => <th key={String(c.key)} className="px-3 py-2 text-left font-medium">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-zinc-800 hover:bg-zinc-900/40">
              {columns.map((c) => (
                <td key={String(c.key)} className="px-3 py-2 align-top">
                  {c.render ? c.render(r) : String(r[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
