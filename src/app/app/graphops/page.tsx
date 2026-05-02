'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, GitBranch, Loader2, RefreshCw, ShieldCheck, Wrench } from 'lucide-react';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { WelcomeState } from '@/components/praxis/situation-dashboard';
import { GraphProposalsPanel } from '@/components/situations/graph-proposals-panel';
import { PraxisLink } from '@/components/shared/praxis-link';
import { SyriaRecordingRunway } from '@/components/demo/recording-signal-runway';
import { buildGraphOpsSummary, type GraphOpsSummary } from '@/lib/graph/graphops';
import { isSyriaDemoCase, SYRIA_DEMO_CANONICAL_GRAPH, SYRIA_DEMO_SITUATION } from '@/lib/constants/syria-demo-case';

export default function GraphOpsPage() {
  const { isDemo, needsOnboarding, showGuard, situation, loading } = useSituationGuard();
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<GraphOpsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!situation?.id) return;
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`/api/graph/ops?situationId=${encodeURIComponent(situation.id)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`GraphOps failed (${response.status})`);
      const payload = (await response.json()) as { summary?: GraphOpsSummary };
      setSummary(payload.summary ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GraphOps unavailable');
    } finally {
      setRefreshing(false);
    }
  }, [situation?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (needsOnboarding) return <OnboardingRequiredState />;
  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-500" /></div>;
  if (isDemo && isSyriaDemoCase(searchParams.get('case'))) return <SyriaDemoGraphOpsPage />;
  if (showGuard || !situation) return <WelcomeState />;

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">GraphOps</p>
          <h1 className="text-2xl font-semibold text-navy-900">{situation.name}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-navy-600">
            Canonical graph maintenance for Firestore-first PRAXIS context: proposal review, provenance coverage,
            temporal readiness, repair suggestions, and derived-index preparation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </header>

      {error ? <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

      {summary ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={<GitBranch className="h-4 w-4" />} label="Canonical nodes" value={String(summary.nodeCount)} />
            <MetricCard icon={<GitBranch className="h-4 w-4" />} label="Canonical edges" value={String(summary.edgeCount)} />
            <MetricCard icon={<ShieldCheck className="h-4 w-4" />} label="Provenance" value={`${summary.provenance.coveragePct}%`} />
            <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Temporal coverage" value={`${summary.temporal.coveragePct}%`} />
          </section>

          <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-navy-900">Maintenance queue</h2>
              </div>
              <ul className="space-y-2">
                {summary.maintenanceActions.map((action) => (
                  <li key={action} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-700">
                    {action}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <PraxisLink href="/conflict-graph" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50">
                  Open Conflict Graph
                </PraxisLink>
                <PraxisLink href="/documents" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50">
                  Add Evidence
                </PraxisLink>
                <PraxisLink href="/assistant" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50">
                  Ask PRAXIS
                </PraxisLink>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4 text-diplomatic-blue" />
                <h2 className="text-sm font-semibold text-navy-900">Repair suggestions</h2>
              </div>
              {summary.repairSuggestions.length ? (
                <ul className="space-y-2">
                  {summary.repairSuggestions.slice(0, 8).map((suggestion) => (
                    <li key={suggestion.id} className="rounded-md border border-slate-200 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{suggestion.severity} · {suggestion.kind}</p>
                      <p className="mt-1 text-sm text-navy-700">{suggestion.summary}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-700">No deterministic repair suggestions at this time.</p>
              )}
            </div>
          </section>

          <GraphProposalsPanel situationId={situation.id} onDecision={load} />
        </>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-navy-600">Loading GraphOps summary...</div>
      )}
    </div>
  );
}

function SyriaDemoGraphOpsPage() {
  const summary = useMemo(
    () => buildGraphOpsSummary({
      graph: SYRIA_DEMO_CANONICAL_GRAPH,
      backend: 'firestore-canonical',
      snapshotIds: ['snapshot-2026-02-13T00:00:00.000Z', 'snapshot-2026-03-18T00:00:00.000Z'],
      now: '2026-05-02T09:00:00.000Z',
    }),
    [],
  );

  return (
    <div className="flex flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">GraphOps - public-source demo</p>
          <h1 className="text-2xl font-semibold text-navy-900">{SYRIA_DEMO_SITUATION.name}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-navy-600">
            Syria demo graph health: Firestore-first canonical graph, source receipts, temporal anchors,
            and analyst-visible repair suggestions before any AI product uses the graph as context.
          </p>
        </div>
        <PraxisLink
          href="/conflict-graph?recording=1&case=syria"
          className="inline-flex items-center gap-1.5 rounded-md border border-diplomatic-blue/30 bg-diplomatic-blue/5 px-3 py-1.5 text-xs font-semibold text-diplomatic-blue hover:bg-diplomatic-blue/10"
        >
          Open live graph
        </PraxisLink>
      </header>

      <SyriaRecordingRunway density="compact" focus="graph" />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<GitBranch className="h-4 w-4" />} label="Canonical nodes" value={String(summary.nodeCount)} />
        <MetricCard icon={<GitBranch className="h-4 w-4" />} label="Canonical edges" value={String(summary.edgeCount)} />
        <MetricCard icon={<ShieldCheck className="h-4 w-4" />} label="Provenance" value={`${summary.provenance.coveragePct}%`} />
        <MetricCard icon={<CheckCircle2 className="h-4 w-4" />} label="Temporal coverage" value={`${summary.temporal.coveragePct}%`} />
      </section>

      <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-navy-900">Recording readout</h2>
          </div>
          <ul className="space-y-2">
            {[
              'Graph is demo-populated from five high-reliability public-source receipts.',
              'Use Conflict Graph to click: 30 January agreement -> SDF -> displacement -> regional spillover.',
              ...summary.maintenanceActions,
            ].slice(0, 6).map((action) => (
              <li key={action} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-navy-700">
                {action}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <PraxisLink href="/conflict-graph?recording=1&case=syria" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50">
              Open Conflict Graph
            </PraxisLink>
            <PraxisLink href="/source-scout?recording=1&case=syria" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50">
              Show Receipts
            </PraxisLink>
            <PraxisLink href="/briefing?recording=1&case=syria" className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50">
              Finish Brief
            </PraxisLink>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-diplomatic-blue" />
            <h2 className="text-sm font-semibold text-navy-900">Repair suggestions</h2>
          </div>
          <ul className="space-y-2">
            {summary.repairSuggestions.slice(0, 5).map((suggestion) => (
              <li key={suggestion.id} className="rounded-md border border-slate-200 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{suggestion.severity} - {suggestion.kind}</p>
                <p className="mt-1 text-sm text-navy-700">{suggestion.summary}</p>
              </li>
            ))}
            {summary.repairSuggestions.length === 0 ? (
              <li className="text-sm text-emerald-700">No deterministic repair suggestions at this time.</li>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-navy-500">{icon}<span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span></div>
      <p className="mt-2 text-2xl font-semibold text-navy-900">{value}</p>
    </div>
  );
}
