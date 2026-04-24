'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertCircle, XCircle, RefreshCw, Cpu, Database, Lock, Globe, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Probe {
  id: string;
  label: string;
  status: 'ok' | 'degraded' | 'error' | 'unconfigured';
  detail?: string;
  latencyMs?: number;
}

interface FeedCapability {
  provider: string;
  label: string;
  status: string;
  tier: string;
}

interface Diagnostics {
  computedAt: string;
  probes: { storage: Probe[]; ai: Probe[]; secrets: Probe[] };
  feeds: { feeds: Record<string, FeedCapability>; availableProviders: string[]; coverageScore: number };
  counters: {
    users_sampled: number;
    situations_recent: number;
    credits_burn_24h: { burn: number; count: number };
    credits_burn_7d: { burn: number; count: number };
  };
  runtime: { node: string; aiProvider: string; vertexProject: string | null; region: string | null };
}

const STATUS_ICON = {
  ok: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
  degraded: <AlertCircle className="h-4 w-4 text-amber-400" />,
  error: <XCircle className="h-4 w-4 text-red-400" />,
  unconfigured: <AlertCircle className="h-4 w-4 text-slate-500" />,
} as const;

const STATUS_RING = {
  ok: 'ring-emerald-500/30',
  degraded: 'ring-amber-500/30',
  error: 'ring-red-500/30',
  unconfigured: 'ring-slate-600/30',
} as const;

export default function DiagnosticsPage() {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/diagnostics', { cache: 'no-store' });
      if (res.status === 403) {
        setError('Forbidden — your uid is not on ADMIN_ALLOWLIST');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as Diagnostics);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl p-6 text-slate-100">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            <h1 className="text-2xl font-semibold">Platform Diagnostics</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Admin-only heartbeat of the PRAXIS platform. Probes run in parallel and each fails
            independently — a red card means that one thing is wrong, nothing else.
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950/30 p-4 text-sm text-red-300">{error}</div>
      )}

      {data && (
        <div className="space-y-6">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CounterCard icon={<Database className="h-4 w-4" />} label="Users sampled" value={String(data.counters.users_sampled)} hint="First 500 Firestore user docs" />
            <CounterCard icon={<Zap className="h-4 w-4" />} label="Credits burned 24h" value={data.counters.credits_burn_24h.burn.toLocaleString()} hint={`${data.counters.credits_burn_24h.count} transactions`} />
            <CounterCard icon={<Zap className="h-4 w-4" />} label="Credits burned 7d" value={data.counters.credits_burn_7d.burn.toLocaleString()} hint={`${data.counters.credits_burn_7d.count} transactions`} />
            <CounterCard icon={<Globe className="h-4 w-4" />} label="Feed coverage" value={`${data.feeds.coverageScore}%`} hint={`${data.feeds.availableProviders.length} providers active`} />
          </section>

          <ProbeGroup title="Storage" icon={<Database className="h-4 w-4 text-slate-300" />} probes={data.probes.storage} />
          <ProbeGroup title="AI Providers" icon={<Cpu className="h-4 w-4 text-slate-300" />} probes={data.probes.ai} />
          <ProbeGroup title="Secrets" icon={<Lock className="h-4 w-4 text-slate-300" />} probes={data.probes.secrets} />

          <section>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Globe className="h-4 w-4 text-slate-300" /> Feed Matrix
            </h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.values(data.feeds.feeds).map((f) => (
                <div key={f.provider} className="rounded-md border border-slate-800 bg-slate-900/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-100">{f.label}</span>
                    <StatusPill status={f.status as Probe['status']} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-wider">
                    <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-slate-400">{f.tier}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-200">Runtime</h2>
            <div className="rounded-md border border-slate-800 bg-slate-900/50 p-4 text-xs text-slate-300">
              <dl className="grid gap-2 sm:grid-cols-2">
                <Kv label="Node" value={data.runtime.node} />
                <Kv label="AI provider" value={data.runtime.aiProvider} />
                <Kv label="Vertex project" value={data.runtime.vertexProject ?? '—'} />
                <Kv label="Region" value={data.runtime.region ?? '—'} />
                <Kv label="Computed at" value={new Date(data.computedAt).toLocaleString()} />
              </dl>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function CounterCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold text-slate-100">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function ProbeGroup({ title, icon, probes }: { title: string; icon: React.ReactNode; probes: Probe[] }) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
        {icon} {title}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {probes.map((p) => (
          <div key={p.id} className={cn('rounded-md border border-slate-800 bg-slate-900/50 p-3 ring-1', STATUS_RING[p.status])}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-100">{p.label}</span>
              {STATUS_ICON[p.status]}
            </div>
            {p.detail && <p className="mt-1 text-[11px] text-slate-500">{p.detail}</p>}
            {p.latencyMs != null && <p className="mt-0.5 text-[10px] text-slate-600">{p.latencyMs}ms</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: Probe['status'] }) {
  const labels: Record<Probe['status'], string> = {
    ok: 'OK',
    degraded: 'Degraded',
    error: 'Error',
    unconfigured: 'Not configured',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1', STATUS_RING[status])}>
      {STATUS_ICON[status]}
      {labels[status]}
    </span>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 shrink-0 text-slate-500">{label}</dt>
      <dd className="font-mono text-slate-200">{value}</dd>
    </div>
  );
}
