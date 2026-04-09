'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState } from 'react';
import {
  DollarSign, CheckCircle2, Loader2, Sparkles,
  TrendingDown, Building2, AlertTriangle, Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────

interface MacroIndicators {
  gdpGrowthDeviation: string;
  inflationRate: string;
  unemploymentRate: string;
  tradeBalanceImpact: string;
  debtGdpRatio: string;
}

interface SanctionsImpact {
  regimesApplicable: string[];
  sectorEffects: string[];
  humanitarianExemptions: string;
}

interface ReconstructionEstimate {
  infrastructure: string;
  institutional: string;
  social: string;
  total: string;
}

interface WarEconomyActor {
  actor: string;
  benefitFromConflict: string;
  stakeInPeace: string;
}

interface PeaceDividend {
  gdpGainEstimate: string;
  employmentCreation: string;
  timeframe: string;
}

interface EconomicImpactData {
  summary: string;
  macroIndicators: MacroIndicators;
  sanctionsImpact?: SanctionsImpact;
  reconstructionEstimate?: ReconstructionEstimate;
  warEconomyActors?: WarEconomyActor[];
  peaceDividend?: PeaceDividend;
  recommendations: string[];
  intelligenceGaps: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const MACRO_LABELS: { key: keyof MacroIndicators; label: string }[] = [
  { key: 'gdpGrowthDeviation', label: 'GDP Growth Deviation' },
  { key: 'inflationRate',       label: 'Inflation Rate' },
  { key: 'unemploymentRate',    label: 'Unemployment Rate' },
  { key: 'tradeBalanceImpact',  label: 'Trade Balance Impact' },
  { key: 'debtGdpRatio',        label: 'Debt-to-GDP Ratio' },
];

const RECONSTRUCTION_LABELS: { key: keyof ReconstructionEstimate; label: string }[] = [
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'institutional',  label: 'Institutional' },
  { key: 'social',         label: 'Social' },
  { key: 'total',          label: 'Total (5 years)' },
];

// ─── Content ────────────────────────────────────────────────────────────────

function EconomicImpactContent({ data }: { data: EconomicImpactData }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-navy-900">Economic Assessment</h3>
        <p className="text-xs leading-relaxed text-navy-600">{data.summary}</p>
      </div>

      {/* Macro indicators */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
          <TrendingDown className="h-4 w-4 text-red-500" />
          Macroeconomic Indicators
        </h3>
        <div className="space-y-2">
          {MACRO_LABELS.map(({ key, label }) => (
            <div key={key} className="flex items-start justify-between gap-4 rounded-lg bg-navy-50 px-3 py-2">
              <span className="text-[11px] font-medium text-navy-600 shrink-0">{label}</span>
              <span className="text-[11px] text-navy-800 text-right">{data.macroIndicators[key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sanctions impact */}
      {data.sanctionsImpact && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="mb-3 text-sm font-semibold text-amber-800">Sanctions Impact</h3>
          <div className="mb-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600">Applicable Regimes</p>
            <ul className="space-y-1">
              {data.sanctionsImpact.regimesApplicable.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="mb-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600">Sector Effects</p>
            <ul className="space-y-1">
              {data.sanctionsImpact.sectorEffects.map((e, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                  {e}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg bg-amber-100/60 px-3 py-2">
            <p className="text-[11px] text-amber-700">
              <span className="font-semibold">Humanitarian exemptions: </span>
              {data.sanctionsImpact.humanitarianExemptions}
            </p>
          </div>
        </div>
      )}

      {/* Reconstruction */}
      {data.reconstructionEstimate && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Building2 className="h-4 w-4 text-navy-400" />
            Reconstruction Cost Estimate
          </h3>
          <div className="space-y-2">
            {RECONSTRUCTION_LABELS.map(({ key, label }) => (
              <div
                key={key}
                className={cn(
                  'flex items-center justify-between rounded-lg px-3 py-2',
                  key === 'total' ? 'bg-navy-900 text-white' : 'bg-navy-50'
                )}
              >
                <span className={cn('text-xs font-medium', key === 'total' ? 'text-white' : 'text-navy-600')}>
                  {label}
                </span>
                <span className={cn('text-xs font-bold', key === 'total' ? 'text-white' : 'text-navy-900')}>
                  {data.reconstructionEstimate![key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* War economy actors */}
      {data.warEconomyActors && data.warEconomyActors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-800">
            <AlertTriangle className="h-4 w-4" />
            War Economy Actors
          </h3>
          <div className="space-y-3">
            {data.warEconomyActors.map((actor, i) => (
              <div key={i} className="rounded-lg border border-red-200 bg-white p-3">
                <p className="text-xs font-semibold text-navy-800 mb-1">{actor.actor}</p>
                <p className="text-[11px] text-red-700 mb-1">
                  <span className="font-medium">Conflict benefit: </span>{actor.benefitFromConflict}
                </p>
                <p className="text-[11px] text-emerald-700">
                  <span className="font-medium">Stake in peace: </span>{actor.stakeInPeace}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peace dividend */}
      {data.peaceDividend && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Leaf className="h-4 w-4" />
            Peace Dividend Estimate
          </h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-white p-3 text-center">
              <p className="text-xs font-bold text-emerald-700">{data.peaceDividend.gdpGainEstimate}</p>
              <p className="text-[10px] text-navy-500 mt-0.5">GDP Gain</p>
            </div>
            <div className="rounded-lg bg-white p-3 text-center">
              <p className="text-xs font-bold text-emerald-700">{data.peaceDividend.employmentCreation}</p>
              <p className="text-[10px] text-navy-500 mt-0.5">Employment</p>
            </div>
            <div className="rounded-lg bg-white p-3 text-center">
              <p className="text-xs font-bold text-emerald-700">{data.peaceDividend.timeframe}</p>
              <p className="text-[10px] text-navy-500 mt-0.5">Timeframe</p>
            </div>
          </div>
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

export default function EconomicImpactPage() {
  const { showGuard, situation } = useSituationGuard();
  const [data, setData] = useState<EconomicImpactData | null>(null);
  const { hasData, loading: firestoreLoading } = useToolData('economic_impact' as never);
  const [regenerating, setRegenerating] = useState(false);

  if (showGuard) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/ai/economic-impact', {
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
            <DollarSign className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">Economic Impact Analyzer</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            {situation?.name
              ? `Conflict economic costs, sanctions impact, war economy, and peace dividend — ${situation.name}`
              : 'Macroeconomic impact, sanctions analysis, reconstruction costs, and peace dividend estimates'}
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

      <RegistryToolInfo toolId="economic-impact" />
      <AiPopulate
        toolId="economic-impact"
        toolName="Economic Impact Analyzer"
        apiEndpoint="/api/ai/economic-impact"
        creditCost={3}
        hasExistingData={hasData || !!data}
        onDataGenerated={(raw) => setData(raw as EconomicImpactData)}
      >
        {data ? <EconomicImpactContent data={data} /> : null}
      </AiPopulate>
    </div>
  );
}
