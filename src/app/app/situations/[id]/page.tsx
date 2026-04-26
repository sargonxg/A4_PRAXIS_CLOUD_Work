'use client';

/**
 * /app/situations/[id] — focused per-situation overview.
 *
 * Renders a header with situation status + risk + Glasl, an activity feed
 * scoped to this situation, and quick links into the inspect/settings
 * sub-routes plus the workspace dashboard. The main /app/dashboard remains
 * the workspace homepage; this page is for deep links and per-situation
 * operational triage.
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Loader2,
  Globe,
  Users,
  GitBranch,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Minus,
  ArrowRight,
  Settings,
  Eye,
  LayoutDashboard,
} from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useSituationStore } from '@/stores/situation-store';
import { useAuth } from '@/lib/auth/auth-context';
import { ActivityFeed } from '@/components/app/activity-feed';
import { RiskGauge } from '@/components/visualizations/risk-gauge';
import { cn } from '@/lib/utils/cn';
import type { Situation } from '@/types/situation';

const TREND_META: Record<
  Situation['escalationTrend'],
  { icon: React.ElementType; cls: string; label: string }
> = {
  escalating: { icon: TrendingUp, cls: 'text-red-600 bg-red-50 border-red-100', label: 'Escalating' },
  'de-escalating': { icon: TrendingDown, cls: 'text-emerald-600 bg-emerald-50 border-emerald-100', label: 'De-escalating' },
  stable: { icon: Minus, cls: 'text-navy-500 bg-navy-50 border-navy-100', label: 'Stable' },
  volatile: { icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50 border-amber-100', label: 'Volatile' },
};

function GlaslBadge({ stage }: { stage: number }) {
  const cls =
    stage <= 3
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : stage <= 6
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : 'bg-red-50 text-red-700 border-red-100';
  return (
    <div className={cn('flex flex-col items-center gap-1 rounded-lg border px-3 py-2', cls)}>
      <span className="text-lg font-bold leading-none">
        {stage}<span className="text-[11px] font-normal">/9</span>
      </span>
      <span className="text-[10px] uppercase tracking-wider">Glasl</span>
    </div>
  );
}

export default function SituationOverviewPage() {
  const params = useParams();
  const id = useMemo(() => {
    const raw = params?.id;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  }, [params]);

  const { user } = useAuth();
  const situations = useSituationStore((s) => s.situations);
  const fetchSituations = useSituationStore((s) => s.fetchSituations);
  const setActiveSituation = useSituationStore((s) => s.setActiveSituation);
  const storeLoading = useSituationStore((s) => s.loading);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!situations.length && !hasFetched && !storeLoading) {
      setHasFetched(true);
      fetchSituations();
    }
  }, [situations.length, hasFetched, storeLoading, fetchSituations]);

  const situation = useMemo(() => situations.find((s) => s.id === id) ?? null, [situations, id]);

  // Keep the global active situation in sync with the page the analyst is viewing.
  useEffect(() => {
    if (situation && id) setActiveSituation(id);
  }, [situation, id, setActiveSituation]);

  if (!id) {
    return (
      <div className="p-8 text-sm text-navy-500">No situation specified.</div>
    );
  }

  if (storeLoading || (!situation && !hasFetched)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-navy-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading situation…
      </div>
    );
  }

  if (!situation) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-6">
          <h1 className="text-lg font-semibold text-navy-900">Situation not found</h1>
          <p className="mt-2 text-sm text-navy-600">
            We could not locate situation <code className="font-mono text-xs">{id}</code> in your workspace.
            It may have been archived or it may belong to a different account.
          </p>
          <div className="mt-4 flex gap-3">
            <PraxisLink
              href="/situations"
              className="rounded-md bg-diplomatic-blue px-4 py-2 text-xs font-semibold text-white hover:bg-diplomatic-blue/90"
            >
              Back to situations list
            </PraxisLink>
            <PraxisLink
              href="/dashboard"
              className="rounded-md border border-navy-200 px-4 py-2 text-xs font-semibold text-navy-700 hover:border-diplomatic-blue/40"
            >
              Open dashboard
            </PraxisLink>
          </div>
        </div>
      </div>
    );
  }

  const trend = TREND_META[situation.escalationTrend] ?? TREND_META.stable;
  const TrendIcon = trend.icon;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <header className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-navy-900">{situation.name}</h1>
              <span className="rounded-full bg-diplomatic-blue/10 px-2.5 py-0.5 text-[11px] font-medium capitalize text-diplomatic-blue">
                {situation.type.replace('_', ' ')}
              </span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize',
                  situation.status === 'active'
                    ? 'bg-emerald-50 text-emerald-700'
                    : situation.status === 'resolved'
                      ? 'bg-navy-100 text-navy-500'
                      : 'bg-amber-50 text-amber-700'
                )}
              >
                {situation.status}
              </span>
            </div>
            {situation.region && (
              <div className="mt-2 flex items-center gap-1.5 text-sm text-navy-500">
                <Globe className="h-3.5 w-3.5" />
                {situation.region}
              </div>
            )}
            {situation.description && (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-navy-600">
                {situation.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <RiskGauge score={situation.riskScore * 10} size="sm" showValue />
              <span className="text-[10px] text-navy-400">INFORM Risk</span>
            </div>
            {situation.glaslStage ? <GlaslBadge stage={situation.glaslStage} /> : null}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-navy-100 pt-4 text-xs">
          <div className="flex items-center gap-1.5 text-navy-600">
            <Users className="h-3.5 w-3.5 text-navy-400" />
            <strong>{situation.actorCount}</strong> actors
          </div>
          <div className="flex items-center gap-1.5 text-navy-600">
            <GitBranch className="h-3.5 w-3.5 text-navy-400" />
            <strong>{situation.graphEntities}</strong> graph entities
          </div>
          <div className="flex items-center gap-1.5 text-navy-600">
            <FileText className="h-3.5 w-3.5 text-navy-400" />
            <strong>{situation.documentCount}</strong> documents
          </div>
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium',
              trend.cls
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {trend.label}
          </div>
        </div>

        {/* Actor chips */}
        {situation.actors.length > 0 && (
          <div className="mt-4 border-t border-navy-100 pt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
              Key actors
            </p>
            <div className="flex flex-wrap gap-1.5">
              {situation.actors.map((actor) => (
                <span
                  key={actor}
                  className="rounded-full bg-diplomatic-blue/10 px-2.5 py-0.5 text-xs font-medium text-diplomatic-blue"
                >
                  {actor}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Quick navigation row */}
      <nav className="grid gap-3 sm:grid-cols-3">
        <PraxisLink
          href="/dashboard"
          className="group flex items-center gap-3 rounded-xl border border-[var(--color-app-border)] bg-white p-4 transition-all hover:border-diplomatic-blue/30 hover:shadow-sm"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-diplomatic-blue/10">
            <LayoutDashboard className="h-4 w-4 text-diplomatic-blue" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-navy-900 group-hover:text-diplomatic-blue">
              Open in workspace
            </p>
            <p className="text-[11px] text-navy-500">
              Switch to the main dashboard with this situation active.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-navy-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </PraxisLink>

        <PraxisLink
          href={`/situations/${situation.id}/inspect`}
          className="group flex items-center gap-3 rounded-xl border border-[var(--color-app-border)] bg-white p-4 transition-all hover:border-diplomatic-blue/30 hover:shadow-sm"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <Eye className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-navy-900 group-hover:text-diplomatic-blue">
              Inspect situation data
            </p>
            <p className="text-[11px] text-navy-500">
              Raw fields, graph snapshot, tool-output index for this case.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-navy-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </PraxisLink>

        <PraxisLink
          href={`/situations/${situation.id}/settings`}
          className="group flex items-center gap-3 rounded-xl border border-[var(--color-app-border)] bg-white p-4 transition-all hover:border-diplomatic-blue/30 hover:shadow-sm"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-500/10">
            <Settings className="h-4 w-4 text-gold-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-navy-900 group-hover:text-diplomatic-blue">
              Edit situation settings
            </p>
            <p className="text-[11px] text-navy-500">
              Title, type, description, region, sources, status.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-navy-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </PraxisLink>
      </nav>

      {/* Activity feed scoped to this situation */}
      <section className="rounded-xl border border-[var(--color-app-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Activity</h2>
            <p className="text-[11px] text-navy-500">
              Tool runs, background jobs, and notifications for this situation only.
            </p>
          </div>
        </div>
        <div className="px-5 py-4">
          <ActivityFeed
            uid={user?.id ?? null}
            situationId={situation.id}
            emptyHint="No tool runs yet for this situation. Open it in the workspace to start a run."
          />
        </div>
      </section>
    </div>
  );
}
