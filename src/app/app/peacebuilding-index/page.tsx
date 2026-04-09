'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState } from 'react';
import {
  BarChart3, CheckCircle2, Loader2, Sparkles,
  TrendingUp, TrendingDown, Minus, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────

type Trend = 'improving' | 'stable' | 'deteriorating';

interface Pillar {
  score: number;
  indicators: string[];
  trend: Trend;
}

interface PeacebuildingData {
  compositeScore: number;
  pillars: {
    security: Pillar;
    ruleOfLaw: Pillar;
    governance: Pillar;
    economicRecovery: Pillar;
    socialCohesion: Pillar;
    humanRights: Pillar;
  };
  overallTrend: Trend;
  benchmarkComparison: string;
  priorities: string[];
  recommendations: string[];
  intelligenceGaps: string[];
}

// ─── Style helpers ──────────────────────────────────────────────────────────

const TREND_CONFIG: Record<Trend, { icon: typeof TrendingUp; label: string; color: string }> = {
  improving:     { icon: TrendingUp,   label: 'Improving',     color: 'text-emerald-600' },
  stable:        { icon: Minus,        label: 'Stable',         color: 'text-amber-600' },
  deteriorating: { icon: TrendingDown, label: 'Deteriorating',  color: 'text-red-600' },
};

const PILLAR_META: { key: keyof PeacebuildingData['pillars']; label: string; color: string }[] = [
  { key: 'security',        label: 'Security',          color: '#ef4444' },
  { key: 'ruleOfLaw',       label: 'Rule of Law',       color: '#f59e0b' },
  { key: 'governance',      label: 'Governance',        color: '#3b82f6' },
  { key: 'economicRecovery',label: 'Economic Recovery', color: '#10b981' },
  { key: 'socialCohesion',  label: 'Social Cohesion',   color: '#8b5cf6' },
  { key: 'humanRights',     label: 'Human Rights',      color: '#ec4899' },
];

function scoreColor(score: number): string {
  if (score >= 7) return 'text-emerald-600';
  if (score >= 5) return 'text-amber-600';
  if (score >= 3) return 'text-orange-600';
  return 'text-red-600';
}

function barColor(score: number): string {
  if (score >= 7) return 'bg-emerald-500';
  if (score >= 5) return 'bg-amber-500';
  if (score >= 3) return 'bg-orange-500';
  return 'bg-red-500';
}

function compositeColor(score: number): string {
  if (score >= 60) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  if (score >= 20) return 'text-orange-600';
  return 'text-red-600';
}

// ─── PillarCard ─────────────────────────────────────────────────────────────

function PillarCard({ pillar, label, color }: { pillar: Pillar; label: string; color: string }) {
  const trendCfg = TREND_CONFIG[pillar.trend];
  const TrendIcon = trendCfg.icon;

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-navy-700">{label}</span>
        <div className="flex items-center gap-1.5">
          <TrendIcon className={cn('h-3.5 w-3.5', trendCfg.color)} />
          <span className={cn('text-2xl font-bold', scoreColor(pillar.score))}>
            {pillar.score.toFixed(1)}
          </span>
          <span className="text-xs text-navy-400">/10</span>
        </div>
      </div>
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-navy-100">
        <div
          className={cn('h-full rounded-full transition-all', barColor(pillar.score))}
          style={{ width: `${(pillar.score / 10) * 100}%` }}
        />
      </div>
      <ul className="space-y-1">
        {pillar.indicators.map((ind, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-navy-500">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-navy-300" />
            {ind}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Content ────────────────────────────────────────────────────────────────

function PeacebuildingContent({ data }: { data: PeacebuildingData }) {
  const overallTrendCfg = TREND_CONFIG[data.overallTrend];
  const OverallTrendIcon = overallTrendCfg.icon;

  return (
    <div className="space-y-6">
      {/* Composite score */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-6 flex flex-col items-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-400 mb-1">UN PBC Composite Score</p>
        <div className={cn('text-7xl font-bold', compositeColor(data.compositeScore))}>
          {data.compositeScore}
        </div>
        <p className="text-sm text-navy-400 mb-3">out of 100</p>
        <div className="w-full max-w-sm h-3 overflow-hidden rounded-full bg-navy-100">
          <div
            className={cn('h-full rounded-full transition-all', barColor(data.compositeScore / 10))}
            style={{ width: `${data.compositeScore}%` }}
          />
        </div>
        <div className={cn('mt-3 flex items-center gap-1.5 text-sm font-semibold', overallTrendCfg.color)}>
          <OverallTrendIcon className="h-4 w-4" />
          Overall trend: {overallTrendCfg.label}
        </div>
      </div>

      {/* Pillar scorecard */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-navy-900">6 UN PBC Pillars</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PILLAR_META.map(({ key, label, color }) => (
            <PillarCard key={key} pillar={data.pillars[key]} label={label} color={color} />
          ))}
        </div>
      </div>

      {/* Benchmark comparison */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-navy-900">Benchmark Comparison</h3>
        <p className="text-xs leading-relaxed text-navy-600">{data.benchmarkComparison}</p>
      </div>

      {/* Priorities */}
      {data.priorities.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Priority Pillars to Address</h3>
          <ol className="space-y-2">
            {data.priorities.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-xs text-navy-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[10px] font-bold text-navy-600">
                  {i + 1}
                </span>
                {p}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Recommendations</h3>
          <ul className="space-y-2">
            {data.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-navy-700">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Intelligence gaps */}
      {data.intelligenceGaps.length > 0 && (
        <div className="rounded-xl border border-navy-200 bg-navy-50 p-4">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-navy-500">Intelligence Gaps</h3>
          <ul className="space-y-1">
            {data.intelligenceGaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-navy-500">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-navy-400" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PeacebuildingIndexPage() {
  const { showGuard, situation } = useSituationGuard();
  const [data, setData] = useState<PeacebuildingData | null>(null);
  const { hasData, loading: firestoreLoading } = useToolData('peacebuilding-index');
  const [regenerating, setRegenerating] = useState(false);

  if (showGuard) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/ai/peacebuilding-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation }),
      });
      if (res.ok) setData(await res.json());
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">Peacebuilding Index</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            {situation?.name
              ? `UN PBC 6-pillar scorecard and composite peacebuilding assessment — ${situation.name}`
              : 'UN Peacebuilding Commission 6-pillar scorecard with 0-100 composite score'}
          </p>
        </div>
        {firestoreLoading ? (
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-navy-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </span>
        ) : (hasData || data) ? (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-200 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Regenerate
          </button>
        ) : (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate with PRAXIS
          </button>
        )}
      </div>

      <RegistryToolInfo toolId="peacebuilding-index" />
      <AiPopulate
        toolId="peacebuilding-index"
        toolName="Peacebuilding Index"
        apiEndpoint="/api/ai/peacebuilding-index"
        creditCost={3}
        hasExistingData={hasData || !!data}
        onDataGenerated={(raw) => setData(raw as PeacebuildingData)}
      >
        {data ? <PeacebuildingContent data={data} /> : null}
      </AiPopulate>
    </div>
  );
}
