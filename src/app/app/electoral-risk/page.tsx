'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState } from 'react';
import {
  Vote, AlertTriangle, CheckCircle2, Loader2, Sparkles,
  Building2, Users, TrendingUp, MapPin, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
type Severity = 'high' | 'medium' | 'low';
type Priority = 'immediate' | 'short-term' | 'medium-term';

interface RiskIndicator {
  indicator: string;
  severity: Severity;
  evidence: string;
}

interface PhaseRisk {
  risk: RiskLevel;
  keyThreats: string[];
}

interface MitigationMeasure {
  measure: string;
  actor: string;
  timeframe: string;
  priority: Priority;
}

interface ElectoralRiskData {
  electionDetails: {
    scheduledDate?: string;
    electionType: string;
    keyContestants: string[];
    electoralSystem: string;
  };
  overallRisk: RiskLevel;
  riskIndicators: {
    structural: RiskIndicator[];
    institutional: RiskIndicator[];
    behavioral: RiskIndicator[];
  };
  riskByPhase: {
    preElection: PhaseRisk;
    electionDay: PhaseRisk;
    postElection: PhaseRisk;
  };
  mitigationMeasures: MitigationMeasure[];
  hotspotRegions?: string[];
  intelligenceGaps: string[];
}

// ─── Style helpers ──────────────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Critical', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  high:     { label: 'High',     color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  medium:   { label: 'Medium',   color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  low:      { label: 'Low',      color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
};

const SEVERITY_DOT: Record<Severity, string> = {
  high:   'bg-red-500',
  medium: 'bg-amber-500',
  low:    'bg-green-500',
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  immediate:    { label: 'Immediate',   color: 'text-red-700',   bg: 'bg-red-50' },
  'short-term': { label: 'Short-term',  color: 'text-amber-700', bg: 'bg-amber-50' },
  'medium-term':{ label: 'Medium-term', color: 'text-blue-700',  bg: 'bg-blue-50' },
};

// ─── IndicatorList ───────────────────────────────────────────────────────────

function IndicatorList({ indicators, title, icon: Icon }: {
  indicators: RiskIndicator[];
  title: string;
  icon: typeof Building2;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
        <Icon className="h-4 w-4 text-navy-400" />
        {title}
      </h3>
      <div className="space-y-3">
        {indicators.map((ind, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', SEVERITY_DOT[ind.severity])} />
            <div>
              <p className="text-xs font-medium text-navy-800">{ind.indicator}</p>
              <p className="mt-0.5 text-[11px] text-navy-400">{ind.evidence}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PhaseCard ───────────────────────────────────────────────────────────────

function PhaseCard({ label, phase }: { label: string; phase: PhaseRisk }) {
  const cfg = RISK_CONFIG[phase.risk];
  return (
    <div className={cn('rounded-xl border p-4', cfg.bg, cfg.border)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-navy-700">{label}</span>
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', cfg.color, cfg.bg)}>
          {cfg.label}
        </span>
      </div>
      <ul className="space-y-1">
        {phase.keyThreats.map((t, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-navy-700">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-navy-400" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Content ────────────────────────────────────────────────────────────────

function ElectoralRiskContent({ data }: { data: ElectoralRiskData }) {
  const overallCfg = RISK_CONFIG[data.overallRisk];

  return (
    <div className="space-y-6">
      {/* Election details + overall risk */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Election Details</h3>
          <dl className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <dt className="text-navy-500">Type</dt>
              <dd className="font-medium text-navy-800">{data.electionDetails.electionType}</dd>
            </div>
            {data.electionDetails.scheduledDate && (
              <div className="flex justify-between text-xs">
                <dt className="text-navy-500">Scheduled</dt>
                <dd className="font-medium text-navy-800">{data.electionDetails.scheduledDate}</dd>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <dt className="text-navy-500">System</dt>
              <dd className="font-medium text-navy-800">{data.electionDetails.electoralSystem}</dd>
            </div>
          </dl>
          {data.electionDetails.keyContestants.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy-400">Key Contestants</p>
              <div className="flex flex-wrap gap-1.5">
                {data.electionDetails.keyContestants.map((c, i) => (
                  <span key={i} className="rounded-full bg-diplomatic-blue/8 px-2 py-0.5 text-[11px] font-medium text-diplomatic-blue">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={cn('rounded-xl border p-5 flex flex-col items-center justify-center', overallCfg.bg, overallCfg.border)}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-500 mb-2">Overall Electoral Violence Risk</p>
          <div className={cn('text-5xl font-bold', overallCfg.color)}>{overallCfg.label}</div>
        </div>
      </div>

      {/* Phase risk */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-navy-900">Risk by Electoral Phase</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PhaseCard label="Pre-Election" phase={data.riskByPhase.preElection} />
          <PhaseCard label="Election Day" phase={data.riskByPhase.electionDay} />
          <PhaseCard label="Post-Election" phase={data.riskByPhase.postElection} />
        </div>
      </div>

      {/* Indicators */}
      <div className="space-y-4">
        <IndicatorList indicators={data.riskIndicators.structural}    title="Structural Indicators"    icon={Building2} />
        <IndicatorList indicators={data.riskIndicators.institutional} title="Institutional Indicators" icon={Shield} />
        <IndicatorList indicators={data.riskIndicators.behavioral}    title="Behavioral Indicators"    icon={Users} />
      </div>

      {/* Hotspot regions */}
      {data.hotspotRegions && data.hotspotRegions.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
            <MapPin className="h-4 w-4 text-red-500" />
            Hotspot Regions
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.hotspotRegions.map((r, i) => (
              <span key={i} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Mitigation measures */}
      {data.mitigationMeasures.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Mitigation Measures</h3>
          <div className="space-y-3">
            {data.mitigationMeasures.map((m, i) => {
              const pcfg = PRIORITY_CONFIG[m.priority];
              return (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-[var(--color-app-border)] p-3">
                  <span className={cn('mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0', pcfg.color, pcfg.bg)}>
                    {pcfg.label}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-navy-800">{m.measure}</p>
                    <p className="mt-0.5 text-[11px] text-navy-400">{m.actor} · {m.timeframe}</p>
                  </div>
                </div>
              );
            })}
          </div>
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

export default function ElectoralRiskPage() {
  const { showGuard, situation } = useSituationGuard();
  const [data, setData] = useState<ElectoralRiskData | null>(null);
  const { hasData, loading: firestoreLoading } = useToolData('electoral-risk');
  const [regenerating, setRegenerating] = useState(false);

  if (showGuard) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/ai/electoral-risk', {
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
            <Vote className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">Electoral Violence Risk</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            {situation?.name
              ? `Electoral violence risk assessment across all phases — ${situation.name}`
              : 'Structural, institutional, and behavioral electoral violence risk assessment'}
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

      <RegistryToolInfo toolId="electoral-risk" />
      <AiPopulate
        toolId="electoral-risk"
        toolName="Electoral Violence Risk"
        apiEndpoint="/api/ai/electoral-risk"
        creditCost={3}
        hasExistingData={hasData || !!data}
        onDataGenerated={(raw) => setData(raw as ElectoralRiskData)}
      >
        {data ? <ElectoralRiskContent data={data} /> : null}
      </AiPopulate>
    </div>
  );
}
