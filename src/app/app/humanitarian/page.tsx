'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { useState, useEffect, useCallback } from 'react';
import {
  Heart, Users, Utensils, DollarSign, AlertTriangle,
  Loader2, RefreshCw, Globe, ExternalLink, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { PraxisLink } from '@/components/shared/praxis-link';

// IPC Phase colors for food security
const IPC_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  '1': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Minimal' },
  '2': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Stressed' },
  '3': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Crisis' },
  '3+': { bg: 'bg-red-100', text: 'text-red-700', label: 'Crisis+' },
  '4': { bg: 'bg-red-200', text: 'text-red-800', label: 'Emergency' },
  '5': { bg: 'bg-red-900/20', text: 'text-red-900', label: 'Famine' },
};

interface HumanitarianData {
  displacement: { idps: number; refugees: number; source: string } | null;
  foodSecurity: { phases: { phase: string; population: number; percentage: number }[] } | null;
  funding: { required: number; funded: number; percentage: number } | null;
  reports: { id: string; title: string; date: string; source: string; url: string }[];
  disasters: { name: string; status: string; date: string }[];
}

function StatCard({
  icon: Icon, label, value, subtitle, color,
}: {
  icon: React.ElementType; label: string; value: string; subtitle?: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-navy-400">{label}</p>
          <p className="text-xl font-bold text-navy-900">{value}</p>
          {subtitle && <p className="text-xs text-navy-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

export default function HumanitarianPage() {
  const { showGuard, situation } = useSituationGuard();
  const [data, setData] = useState<HumanitarianData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!situation) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch humanitarian intelligence from the feed aggregator
      const res = await fetch('/api/data/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: situation.region || situation.name,
          query: situation.name,
          limit: 30,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch humanitarian data');
      const intel = await res.json();

      setData({
        displacement: intel.humanitarian?.displacement || null,
        foodSecurity: intel.humanitarian?.foodSecurity ? { phases: intel.humanitarian.foodSecurity } : null,
        funding: intel.humanitarian?.funding || null,
        reports: (intel.events || [])
          .filter((e: { source: string }) => e.source === 'reliefweb')
          .slice(0, 10)
          .map((e: { id: string; title: string; date: string; source: string; url: string }) => ({
            id: e.id, title: e.title, date: e.date, source: e.source, url: e.url,
          })),
        disasters: [],
      });
    } catch (err) {
      setError('Unable to load humanitarian data. Please check your connection.');
      console.error('[humanitarian] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [situation]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (showGuard || !situation) return <NoSituationState />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
            <Heart className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Humanitarian Dashboard</h1>
            <p className="text-sm text-navy-500">
              Live humanitarian data for {situation.region || situation.name}
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-medium text-navy-600 hover:border-diplomatic-blue/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Data sources badge */}
      <div className="flex items-center gap-2 text-xs text-navy-400">
        <Globe className="h-3.5 w-3.5" />
        Sources: HDX HAPI, ReliefWeb, UNHCR, WFP, OCHA FTS
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-diplomatic-blue" />
          <span className="ml-3 text-sm text-navy-500">Loading humanitarian data...</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-3 text-sm text-red-700">{error}</p>
          <button onClick={fetchData} className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-200">Retry</button>
        </div>
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Internally Displaced"
              value={data?.displacement?.idps ? formatNumber(data.displacement.idps) : 'N/A'}
              subtitle={data?.displacement?.source}
              color="bg-amber-500"
            />
            <StatCard
              icon={Users}
              label="Refugees"
              value={data?.displacement?.refugees ? formatNumber(data.displacement.refugees) : 'N/A'}
              subtitle="UNHCR data"
              color="bg-blue-500"
            />
            <StatCard
              icon={DollarSign}
              label="Funding Gap"
              value={data?.funding ? `${(100 - data.funding.percentage).toFixed(0)}%` : 'N/A'}
              subtitle={data?.funding ? `$${formatNumber(data.funding.required)} required` : undefined}
              color="bg-red-500"
            />
            <StatCard
              icon={Utensils}
              label="Food Insecure"
              value={data?.foodSecurity?.phases
                ? formatNumber(data.foodSecurity.phases
                    .filter((p) => parseInt(p.phase) >= 3)
                    .reduce((sum, p) => sum + p.population, 0))
                : 'N/A'}
              subtitle="IPC Phase 3+"
              color="bg-orange-500"
            />
          </div>

          {/* Food Security breakdown */}
          {data?.foodSecurity?.phases && data.foodSecurity.phases.length > 0 && (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-navy-700">IPC Food Security Classification</h2>
              <div className="space-y-2">
                {data.foodSecurity.phases.map((phase) => {
                  const colors = IPC_COLORS[phase.phase] || IPC_COLORS['1'];
                  return (
                    <div key={phase.phase} className="flex items-center gap-3">
                      <Badge className={cn('min-w-[80px] justify-center text-[10px]', colors.bg, colors.text)}>
                        Phase {phase.phase}: {colors.label}
                      </Badge>
                      <div className="flex-1">
                        <div className="h-4 overflow-hidden rounded-full bg-navy-100">
                          <div
                            className={cn('h-full rounded-full transition-all', colors.bg)}
                            style={{ width: `${Math.min(phase.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span className="min-w-[80px] text-right text-xs font-mono text-navy-600">
                        {formatNumber(phase.population)} ({phase.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Funding progress */}
          {data?.funding && (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy-700">Humanitarian Funding (OCHA FTS)</h2>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-6 overflow-hidden rounded-full bg-navy-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(data.funding.percentage, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold text-navy-900">{data.funding.percentage.toFixed(0)}%</span>
              </div>
              <div className="mt-2 flex justify-between text-xs text-navy-500">
                <span>Funded: ${formatNumber(data.funding.funded)}</span>
                <span>Required: ${formatNumber(data.funding.required)}</span>
              </div>
            </div>
          )}

          {/* ReliefWeb reports */}
          {data?.reports && data.reports.length > 0 && (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy-700">Latest Humanitarian Reports</h2>
              <div className="space-y-2">
                {data.reports.map((report) => (
                  <a
                    key={report.id}
                    href={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-lg border border-navy-100 p-3 hover:border-diplomatic-blue/20 hover:bg-diplomatic-blue/2 transition-colors"
                  >
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-navy-800 line-clamp-2">{report.title}</p>
                      <p className="mt-0.5 text-[10px] text-navy-400">{report.source} &middot; {report.date}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* No data fallback */}
          {!data?.displacement && !data?.foodSecurity && !data?.funding && data?.reports?.length === 0 && (
            <div className="rounded-xl border border-dashed border-navy-200 p-12 text-center">
              <Heart className="mx-auto h-8 w-8 text-navy-300" />
              <p className="mt-3 text-sm font-medium text-navy-600">No humanitarian data available for this region</p>
              <p className="mt-1 text-xs text-navy-400">HDX HAPI data may not cover all countries. Try adjusting the situation region.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
