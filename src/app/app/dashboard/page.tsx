'use client';

/**
 * Dashboard — first-touch situation overview.
 *
 * Rebuilt per docs/superpowers/specs/2026-04-21-foundation-hardening-design.md §8.1.
 * Six widgets that compose from cached SKC reads. No blocking AI call on mount.
 * The optional "Daily read" button fires /api/ai/dashboard-summary (1 credit).
 *
 * Each widget lazy-loads and degrades independently; any one failing does not
 * break the page. In demo mode the legacy SituationDashboard is rendered for
 * continuity with prospect content.
 */

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { SituationDashboard, WelcomeState } from '@/components/praxis/situation-dashboard';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { RiskGaugeWidget } from '@/components/dashboard/risk-gauge-widget';
import { EscalationWidget } from '@/components/dashboard/escalation-widget';
import { AdvisorsWidget } from '@/components/dashboard/advisors-widget';
import { RecentToolsWidget } from '@/components/dashboard/recent-tools-widget';
import { FeedAlertsWidget } from '@/components/dashboard/feed-alerts-widget';
import { RecommendedToolsWidget } from '@/components/dashboard/recommended-tools-widget';
import { SourceCoverageBanner } from '@/components/dashboard/source-coverage-banner';
import { OperationalStatusPanel } from '@/components/dashboard/operational-status-panel';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { ActivityFeed } from '@/components/app/activity-feed';
import { useAuth } from '@/lib/auth/auth-context';
import type { Situation } from '@/types/situation';

interface DailyRead {
  headline: string;
  body: string;
  suggestedTools: string[];
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { isDemo, needsOnboarding, showGuard, situation, loading } = useSituationGuard();

  if (needsOnboarding) return <OnboardingRequiredState />;

  // Demo mode retains the rich prospect dashboard.
  if (isDemo) {
    return (
      <div className="p-6">
        <SituationDashboard situation={DEMO_SITUATION} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (showGuard || !situation) {
    return <WelcomeState />;
  }

  return <RealDashboard situation={situation} />;
}

function RealDashboard({ situation }: { situation: Situation }) {
  const { user } = useAuth();
  const [dailyRead, setDailyRead] = useState<DailyRead | null>(null);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

  async function runDailyRead() {
    setReading(true);
    setReadError(null);
    try {
      const res = await fetch('/api/ai/dashboard-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as DailyRead;
      setDailyRead(data);
    } catch (err) {
      setReadError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setReading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <header className="flex flex-col gap-2 border-b border-slate-800 pb-4">
        <div className="flex items-baseline justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-slate-500">{greeting()}</p>
            <h1 className="truncate text-xl font-semibold text-slate-100">{situation.name}</h1>
            <p className="truncate text-xs text-slate-300">
              {situation.region}
              {situation.domain && situation.domain !== 'generic' ? ` · ${situation.domain}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={runDailyRead}
            disabled={reading}
            className="inline-flex items-center gap-1.5 rounded-md bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-500 border border-gold-500/30 hover:bg-gold-500/20 disabled:opacity-60"
          >
            {reading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {dailyRead ? 'Refresh daily read' : 'Generate daily read'}
          </button>
        </div>

        {dailyRead ? (
          <div className="mt-2 rounded-md border border-gold-500/20 bg-gold-500/5 p-3">
            <h2 className="text-sm font-semibold text-slate-100">{dailyRead.headline}</h2>
            <div className="mt-1 prose prose-invert prose-sm max-w-none text-slate-300">
              <MarkdownRenderer content={dailyRead.body} />
            </div>
          </div>
        ) : null}

        {readError ? (
          <p className="text-xs text-amber-500">Daily read failed: {readError}</p>
        ) : null}
      </header>

      {/* Source coverage banner — honest surface of tier state */}
      <SourceCoverageBanner />

      {/* 6-widget grid — Recommended-for-you replaces the credits widget so the
          dashboard surfaces a role-tuned next-action instead of internal metering. */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <RiskGaugeWidget situation={situation} />
        <EscalationWidget situation={situation} />
        <RecommendedToolsWidget situation={situation} />
        <AdvisorsWidget situationId={situation.id} />
        <RecentToolsWidget situationId={situation.id} />
        <FeedAlertsWidget situationId={situation.id} region={situation.region} />
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
        <OperationalStatusPanel situationId={situation.id} />
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">Latest activity</h2>
          <ActivityFeed
            uid={user?.id ?? null}
            situationId={situation.id}
            emptyHint="No activity for this situation yet. Tool runs and background jobs will appear here."
          />
        </div>
      </section>

      {/* Empty-state onboarding nudge */}
      {(!situation.graphEntities || situation.graphEntities === 0) &&
      (!situation.documentCount || situation.documentCount === 0) ? (
        <EmptySituationHint situationId={situation.id} />
      ) : null}

      {/* Tool methodology — frameworks, data sources, related tools */}
      <RegistryToolInfo toolId="dashboard" />
    </div>
  );
}

function EmptySituationHint({ situationId }: { situationId: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function runPopulate() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch('/api/graph/populate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { nodesAfter?: number; edgesAfter?: number; actorsEnriched?: number };
      setResult(`Seeded ${data.nodesAfter ?? 0} nodes, ${data.edgesAfter ?? 0} edges. ${data.actorsEnriched ?? 0} actors enriched.`);
    } catch (e) {
      setResult(e instanceof Error ? e.message : 'Graph seeding failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-md border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-200">Get this situation running</h3>
      <ol className="mt-2 flex flex-col gap-1 text-xs text-slate-400 sm:flex-row sm:gap-4">
        <li>1. Ingest sources — upload documents or add URLs.</li>
        <li>2. Build the graph — extract entities and relationships.</li>
        <li>3. Run a risk scan — classify Glasl stage and INFORM composite.</li>
      </ol>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={runPopulate}
          disabled={busy}
          className="rounded-md bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-400 border border-gold-500/30 hover:bg-gold-500/20 disabled:opacity-60"
        >
          {busy ? 'Seeding graph…' : 'Seed graph from grounded search + docs'}
        </button>
        {result && <span className="text-xs text-slate-400">{result}</span>}
      </div>
    </section>
  );
}

// Demo mode uses the full SituationDashboard experience with a rich fixture.
const DEMO_SITUATION: Situation = {
  id: 'demo-nordalia',
  name: 'Nordalia — Contested Border Arrangement',
  type: 'international',
  description:
    'Nordalia is a fictional sovereignty dispute used to demonstrate PRAXIS capabilities.',
  region: 'East Asia (fictional)',
  actors: ['Nordalia', 'Sudralia', 'Coastal Consortium'],
  userRole: 'analyst',
  status: 'active',
  riskScore: 72,
  glaslStage: 4,
  escalationTrend: 'escalating',
  actorCount: 8,
  graphEntities: 124,
  documentCount: 9,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
