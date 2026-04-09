'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState } from 'react';
import {
  Globe, CheckCircle2, Loader2, Sparkles, DollarSign,
  Package, MessageSquare, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────

type ActorType = 'state' | 'diaspora' | 'proxy' | 'ingo' | 'multilateral' | 'regional-body';
type InvolvementMode = 'military' | 'financial' | 'diplomatic' | 'informational' | 'humanitarian';
type Alignment = 'pro-party-a' | 'pro-party-b' | 'neutral' | 'spoiler' | 'mediator';
type EngagementLikelihood = 'very-likely' | 'likely' | 'unlikely' | 'very-unlikely';

interface ExternalActor {
  name: string;
  type: ActorType;
  involvement: InvolvementMode[];
  alignment: Alignment;
  leverage: string;
  engagementLikelihood: EngagementLikelihood;
  conditionsForWithdrawal?: string;
  source: string;
}

interface ExternalActorsData {
  summary: string;
  externalActors: ExternalActor[];
  remittanceFlows?: string;
  armsFlows?: string;
  diplomaticInterventions: string[];
  keyFindings: string[];
  recommendations: string[];
  intelligenceGaps: string[];
}

// ─── Style helpers ──────────────────────────────────────────────────────────

const ACTOR_TYPE_CONFIG: Record<ActorType, { label: string; color: string; bg: string }> = {
  state:          { label: 'State',          color: 'text-diplomatic-blue', bg: 'bg-diplomatic-blue/8' },
  diaspora:       { label: 'Diaspora',        color: 'text-purple-700',       bg: 'bg-purple-50' },
  proxy:          { label: 'Proxy',           color: 'text-red-700',          bg: 'bg-red-50' },
  ingo:           { label: 'INGO',            color: 'text-teal-700',         bg: 'bg-teal-50' },
  multilateral:   { label: 'Multilateral',    color: 'text-blue-700',         bg: 'bg-blue-50' },
  'regional-body':{ label: 'Regional Body',   color: 'text-amber-700',        bg: 'bg-amber-50' },
};

const ALIGNMENT_CONFIG: Record<Alignment, { label: string; color: string }> = {
  'pro-party-a': { label: 'Pro Party A', color: 'text-blue-700' },
  'pro-party-b': { label: 'Pro Party B', color: 'text-amber-700' },
  neutral:       { label: 'Neutral',     color: 'text-green-700' },
  spoiler:       { label: 'Spoiler',     color: 'text-red-700' },
  mediator:      { label: 'Mediator',    color: 'text-emerald-700' },
};

const INVOLVEMENT_LABELS: Record<InvolvementMode, string> = {
  military:      'Military',
  financial:     'Financial',
  diplomatic:    'Diplomatic',
  informational: 'Informational',
  humanitarian:  'Humanitarian',
};

const INVOLVEMENT_COLORS: Record<InvolvementMode, string> = {
  military:      'bg-red-50 text-red-700 border-red-200',
  financial:     'bg-amber-50 text-amber-700 border-amber-200',
  diplomatic:    'bg-blue-50 text-blue-700 border-blue-200',
  informational: 'bg-purple-50 text-purple-700 border-purple-200',
  humanitarian:  'bg-teal-50 text-teal-700 border-teal-200',
};

const LIKELIHOOD_CONFIG: Record<EngagementLikelihood, { label: string; color: string }> = {
  'very-likely':   { label: 'Very Likely',    color: 'text-emerald-600' },
  'likely':        { label: 'Likely',          color: 'text-blue-600' },
  'unlikely':      { label: 'Unlikely',        color: 'text-amber-600' },
  'very-unlikely': { label: 'Very Unlikely',   color: 'text-red-600' },
};

// ─── ActorCard ───────────────────────────────────────────────────────────────

function ActorCard({ actor }: { actor: ExternalActor }) {
  const typeCfg = ACTOR_TYPE_CONFIG[actor.type];
  const alignCfg = ALIGNMENT_CONFIG[actor.alignment];
  const likelihoodCfg = LIKELIHOOD_CONFIG[actor.engagementLikelihood];

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-navy-900">{actor.name}</h3>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', typeCfg.color, typeCfg.bg)}>
            {typeCfg.label}
          </span>
        </div>
        <span className={cn('text-[11px] font-semibold', alignCfg.color)}>{alignCfg.label}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {actor.involvement.map((inv) => (
          <span key={inv} className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', INVOLVEMENT_COLORS[inv])}>
            {INVOLVEMENT_LABELS[inv]}
          </span>
        ))}
      </div>

      <p className="text-xs text-navy-700 mb-2">{actor.leverage}</p>

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-navy-400">Peace engagement:</span>
        <span className={cn('font-semibold', likelihoodCfg.color)}>{likelihoodCfg.label}</span>
      </div>

      {actor.conditionsForWithdrawal && (
        <div className="mt-2 rounded-lg bg-navy-50 px-3 py-2">
          <p className="text-[11px] text-navy-500">
            <span className="font-semibold text-navy-600">Withdrawal conditions: </span>
            {actor.conditionsForWithdrawal}
          </p>
        </div>
      )}

      <p className="mt-2 text-[10px] text-navy-400">Source: {actor.source}</p>
    </div>
  );
}

// ─── Content ────────────────────────────────────────────────────────────────

function ExternalActorsContent({ data }: { data: ExternalActorsData }) {
  const stateActors = data.externalActors.filter(a => a.type === 'state').length;
  const diasporaActors = data.externalActors.filter(a => a.type === 'diaspora').length;
  const spoilers = data.externalActors.filter(a => a.alignment === 'spoiler').length;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
          <div className="text-2xl font-bold text-navy-900">{data.externalActors.length}</div>
          <div className="text-[11px] text-navy-500">External Actors</div>
        </div>
        <div className="rounded-xl border border-[var(--color-app-border)] bg-diplomatic-blue/5 p-4">
          <div className="text-2xl font-bold text-diplomatic-blue">{stateActors}</div>
          <div className="text-[11px] text-navy-500">State Actors</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-2xl font-bold text-red-700">{spoilers}</div>
          <div className="text-[11px] text-navy-500">Spoilers</div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <h3 className="mb-2 text-sm font-semibold text-navy-900">Assessment Summary</h3>
        <p className="text-xs leading-relaxed text-navy-600">{data.summary}</p>
      </div>

      {/* Actors */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
          <Globe className="h-4 w-4 text-navy-400" />
          External Actors ({data.externalActors.length})
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.externalActors.map((actor, i) => (
            <ActorCard key={i} actor={actor} />
          ))}
        </div>
      </div>

      {/* Flows */}
      {(data.remittanceFlows || data.armsFlows) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.remittanceFlows && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
                <DollarSign className="h-4 w-4" /> Remittance Flows
              </h3>
              <p className="text-xs text-amber-700">{data.remittanceFlows}</p>
            </div>
          )}
          {data.armsFlows && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-800">
                <Package className="h-4 w-4" /> Arms Flows
              </h3>
              <p className="text-xs text-red-700">{data.armsFlows}</p>
            </div>
          )}
        </div>
      )}

      {/* Diplomatic interventions */}
      {data.diplomaticInterventions.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy-900">
            <MessageSquare className="h-4 w-4 text-diplomatic-blue" />
            Diplomatic Interventions
          </h3>
          <ul className="space-y-1.5">
            {data.diplomaticInterventions.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-navy-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-diplomatic-blue/60" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key findings */}
      {data.keyFindings.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Key Findings</h3>
          <ul className="space-y-2">
            {data.keyFindings.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-navy-700">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                {f}
              </li>
            ))}
          </ul>
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

export default function ExternalActorsPage() {
  const { showGuard, situation } = useSituationGuard();
  const [data, setData] = useState<ExternalActorsData | null>(null);
  const { hasData, loading: firestoreLoading } = useToolData('external_actors' as never);
  const [regenerating, setRegenerating] = useState(false);

  if (showGuard) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/ai/external-actors', {
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
            <Globe className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">Diaspora & External Actor Monitor</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            {situation?.name
              ? `External actor mapping, influence flows, and diplomatic interventions — ${situation.name}`
              : 'Map external actors, diaspora networks, remittance flows, and diplomatic leverage'}
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

      <RegistryToolInfo toolId="external-actors" />
      <AiPopulate
        toolId="external-actors"
        toolName="External Actor Monitor"
        apiEndpoint="/api/ai/external-actors"
        creditCost={3}
        hasExistingData={hasData || !!data}
        onDataGenerated={(raw) => setData(raw as ExternalActorsData)}
      >
        {data ? <ExternalActorsContent data={data} /> : null}
      </AiPopulate>
    </div>
  );
}
