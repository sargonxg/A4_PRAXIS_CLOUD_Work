'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Filter } from 'lucide-react';

interface ReadEvent {
  eventId: string;
  uid: string;
  situationId?: string | null;
  capsuleId?: string | null;
  toolId: string;
  model?: string | null;
  latencyMs?: number | null;
  status?: string | null;
  costClass?: string | null;
  createdAt: string;
}

interface Filters {
  uid: string;
  situationId: string;
  capsuleId: string;
  toolId: string;
  from: string;
  to: string;
}

const COST_CLASS_TINT: Record<string, string> = {
  lo: 'bg-emerald-100 text-emerald-800',
  mid: 'bg-amber-100 text-amber-800',
  hi: 'bg-crimson/10 text-crimson',
  standard: 'bg-amber-100 text-amber-800',
  expensive: 'bg-crimson/10 text-crimson',
};

function normaliseClass(value: string | null | undefined): string {
  if (!value) return 'lo';
  const lower = value.toLowerCase();
  if (lower === 'high' || lower === 'expensive') return 'hi';
  if (lower === 'medium' || lower === 'standard') return 'mid';
  return lower in COST_CLASS_TINT ? lower : 'lo';
}

export default function AdminReadsPage() {
  const [filters, setFilters] = useState<Filters>({ uid: '', situationId: '', capsuleId: '', toolId: '', from: '', to: '' });
  const [events, setEvents] = useState<ReadEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(filters)) {
        if (v) params.set(k, v);
      }
      const res = await fetch(`/api/admin/read-log?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { events: ReadEvent[] };
      // Client-side filter for capsuleId since the API does not index it.
      const list = filters.capsuleId
        ? body.events.filter((e) => e.capsuleId === filters.capsuleId)
        : body.events;
      setEvents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Admin · Reads</p>
          <h1 className="mt-1 text-2xl font-semibold text-navy-950">Read ledger</h1>
          <p className="mt-1 text-sm text-slate-600">
            Latest tool reads, scoped by uid · situation · capsule · tool · date range.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 disabled:opacity-50"
        >
          <RefreshCw className={loading ? 'h-3 w-3 animate-spin' : 'h-3 w-3'} />
          Refresh
        </button>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <Filter className="h-3 w-3" />
          Filters
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          {(['uid', 'situationId', 'capsuleId', 'toolId', 'from', 'to'] as const).map((field) => (
            <input
              key={field}
              type={field === 'from' || field === 'to' ? 'date' : 'text'}
              value={filters[field]}
              onChange={(e) => setFilters((f) => ({ ...f, [field]: e.target.value }))}
              placeholder={field}
              className="rounded-md border border-slate-200 px-2 py-1.5 text-xs"
            />
          ))}
        </div>
      </section>

      {error ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">{error}</p>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-left text-[10px] uppercase tracking-[0.16em] text-slate-500">
            <tr>
              <th className="px-3 py-2">When</th>
              <th className="px-3 py-2">UID</th>
              <th className="px-3 py-2">Situation</th>
              <th className="px-3 py-2">Capsule</th>
              <th className="px-3 py-2">Tool</th>
              <th className="px-3 py-2">Model</th>
              <th className="px-3 py-2">Latency</th>
              <th className="px-3 py-2">Cost</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && !loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-500">No events.</td>
              </tr>
            ) : null}
            {events.map((e) => {
              const cls = normaliseClass(e.costClass);
              return (
                <tr key={e.eventId} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 font-mono text-[10px] text-slate-600">{e.createdAt}</td>
                  <td className="px-3 py-1.5 font-mono text-[10px]">{e.uid}</td>
                  <td className="px-3 py-1.5 font-mono text-[10px]">{e.situationId ?? '—'}</td>
                  <td className="px-3 py-1.5 font-mono text-[10px]">{e.capsuleId ?? '—'}</td>
                  <td className="px-3 py-1.5">{e.toolId}</td>
                  <td className="px-3 py-1.5 font-mono text-[10px]">{e.model ?? '—'}</td>
                  <td className="px-3 py-1.5">{typeof e.latencyMs === 'number' ? `${e.latencyMs} ms` : '—'}</td>
                  <td className="px-3 py-1.5">
                    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase ${COST_CLASS_TINT[cls] ?? 'bg-slate-100 text-slate-700'}`}>
                      {cls}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}
