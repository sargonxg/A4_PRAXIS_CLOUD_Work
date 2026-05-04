'use client';

/**
 * Stakeholder Map — Mitchell-Agle-Wood salience in a 2D projection.
 *
 * Rebuilt per docs/superpowers/specs/2026-04-21-foundation-hardening-design.md §8.4.
 *   - Server-side scoring of each Actor on Power × Legitimacy × Urgency.
 *   - Axis-pair toggle (P×L default, P×U, L×U).
 *   - Quadrant filter chips.
 *   - Click stakeholder → card with scores, quadrant, interests, leverage,
 *     constraints, linked entities (populated by the AI-explain pass).
 *   - "Explain with AI" button → POST /api/ai/stakeholder-map with
 *     explainActorId; response is persisted for re-open.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, Sparkles, Loader2, X, Target } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { cn } from '@/lib/utils/cn';
import type { Situation } from '@/types/situation';
import type { Salience, SalienceQuadrant } from '@/lib/analytics/salience-engine';
import { isSyriaWorkspaceCase, SYRIA_DEMO_SITUATION } from '@/lib/constants/syria-demo-case';
import { SYRIA_STAKEHOLDERS } from '@/lib/constants/syria-tool-demos';

type AxisKey = 'power' | 'legitimacy' | 'urgency';
type AxisPair = { x: AxisKey; y: AxisKey };

const AXIS_PAIRS: Record<string, AxisPair> = {
  'p-l': { x: 'power', y: 'legitimacy' },
  'p-u': { x: 'power', y: 'urgency' },
  'l-u': { x: 'legitimacy', y: 'urgency' },
};

const AXIS_LABEL: Record<AxisKey, string> = {
  power: 'Power',
  legitimacy: 'Legitimacy',
  urgency: 'Urgency',
};

const QUADRANTS: SalienceQuadrant[] = [
  'definitive', 'dominant', 'dangerous', 'dependent',
  'dormant', 'discretionary', 'demanding', 'non-stakeholder',
];

const QUADRANT_COLOR: Record<SalienceQuadrant, string> = {
  definitive:      '#A63D40',
  dominant:        '#C75B39',
  dangerous:       '#E8B931',
  dependent:       '#4B92DB',
  dormant:         '#6B7280',
  discretionary:   '#5B8C5A',
  demanding:       '#C8961E',
  'non-stakeholder': '#475569',
};

interface ExplainOutput {
  actorId: string;
  actorLabel: string;
  rationale: string;
  keyInterests: string[];
  leverage: string[];
  constraints: string[];
  linkedEntities: string[];
}

interface RouteResponse {
  salience: Salience[];
  generatedAt: string;
  actorCount: number;
  graphLoaded: boolean;
  explain?: ExplainOutput;
}

export default function StakeholderMapPage() {
  const { isDemo, needsOnboarding, showGuard, situation } = useSituationGuard();
  const searchParams = useSearchParams();
  const isSyriaCase = isSyriaWorkspaceCase(searchParams.get('case'), isDemo);

  if (needsOnboarding) return <OnboardingRequiredState />;
  if (!isDemo && (showGuard || !situation)) return <NoSituationState />;

  const activeSituation: Situation = situation ?? (isSyriaCase ? SYRIA_DEMO_SITUATION : DEMO_SITUATION);
  return <StakeholderMap situation={activeSituation} isDemo={isDemo} isSyriaCase={isSyriaCase} />;
}

function StakeholderMap({ situation, isDemo, isSyriaCase }: { situation: Situation; isDemo: boolean; isSyriaCase: boolean }) {
  const [salience, setSalience] = useState<Salience[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphLoaded, setGraphLoaded] = useState(false);

  const [axisKey, setAxisKey] = useState<keyof typeof AXIS_PAIRS>('p-l');
  const [quadrantFilter, setQuadrantFilter] = useState<Set<SalienceQuadrant>>(new Set(QUADRANTS));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [explainById, setExplainById] = useState<Record<string, ExplainOutput>>({});
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const runScore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Syria demo: render the seeded post-Assad stakeholder set without a backend roundtrip.
      if (isDemo && isSyriaCase) {
        setSalience(
          SYRIA_STAKEHOLDERS.map((s) => ({
            actorId: s.id,
            actorLabel: s.shortName ?? s.name,
            power: s.power,
            legitimacy: s.legitimacy,
            urgency: s.urgency,
            quadrant: s.quadrant as SalienceQuadrant,
          })),
        );
        setGraphLoaded(true);
        return;
      }

      const res = await fetch('/api/ai/stakeholder-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, situationId: situation.id }),
      });
      if (!res.ok) throw new Error(`Scoring failed (${res.status})`);
      const data = (await res.json()) as RouteResponse;
      setSalience(data.salience);
      setGraphLoaded(data.graphLoaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [situation, isDemo, isSyriaCase]);

  useEffect(() => {
    void runScore();
  }, [runScore]);

  const filtered = useMemo(
    () => (salience ?? []).filter((s) => quadrantFilter.has(s.quadrant)),
    [salience, quadrantFilter],
  );

  const selected = useMemo(
    () => (salience ?? []).find((s) => s.actorId === selectedId) ?? null,
    [salience, selectedId],
  );

  async function runExplain(actorId: string) {
    setExplainLoading(true);
    setExplainError(null);
    try {
      // Syria demo path: synthesize explain output from local stakeholder data.
      if (isDemo && isSyriaCase) {
        const stk = SYRIA_STAKEHOLDERS.find((s) => s.id === actorId);
        if (stk) {
          setExplainById((prev) => ({
            ...prev,
            [actorId]: {
              actorId,
              actorLabel: stk.shortName ?? stk.name,
              rationale: `${stk.name} — ${stk.position}. PRAXIS scores them as ${stk.quadrant} given Power ${(stk.power * 100).toFixed(0)} · Legitimacy ${(stk.legitimacy * 100).toFixed(0)} · Urgency ${(stk.urgency * 100).toFixed(0)}.`,
              keyInterests: stk.interests,
              leverage: stk.leverage,
              constraints: stk.constraints,
              linkedEntities: SYRIA_STAKEHOLDERS.filter((other) => other.id !== stk.id).slice(0, 4).map((o) => o.shortName ?? o.name),
            },
          }));
        }
        return;
      }

      const res = await fetch('/api/ai/stakeholder-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, situationId: situation.id, explainActorId: actorId }),
      });
      if (!res.ok) throw new Error(`Explain failed (${res.status})`);
      const data = (await res.json()) as RouteResponse;
      if (data.explain) {
        setExplainById((prev) => ({ ...prev, [actorId]: data.explain! }));
        if (data.salience) setSalience(data.salience);
      }
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExplainLoading(false);
    }
  }

  const pair = AXIS_PAIRS[axisKey];

  return (
    <div className="flex flex-col gap-4 p-6">
      <RegistryToolInfo toolId="stakeholder-map" />

      {/* Header + toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-diplomatic-blue" />
          <h1 className="text-lg font-semibold text-slate-100">Stakeholder Map</h1>
          <span className="text-xs text-slate-500">
            {graphLoaded ? 'Scored from situation graph' : 'Fallback scoring (no graph yet)'}
            {isDemo ? ' · demo' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AxisToggle axisKey={axisKey} setAxisKey={setAxisKey} />
          <button
            onClick={() => void runScore()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Target className="h-3 w-3" />}
            Rescore
          </button>
        </div>
      </header>

      {/* Quadrant chips */}
      <QuadrantFilter
        value={quadrantFilter}
        onChange={setQuadrantFilter}
        counts={useMemo(() => countsByQuadrant(salience ?? []), [salience])}
      />

      {/* Scatter + panel */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-h-[420px] flex-1 rounded-md border border-slate-800 bg-slate-950/60 p-4">
          {error ? (
            <div className="flex h-full items-center justify-center text-sm text-amber-500">{error}</div>
          ) : !salience ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scoring actors…
            </div>
          ) : salience.length === 0 ? (
            <EmptyActorsNotice />
          ) : (
            <Scatter
              data={filtered}
              pair={pair}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>

        <aside className="w-full shrink-0 rounded-md border border-slate-800 bg-slate-950/60 p-4 lg:w-[320px]">
          {selected ? (
            <StakeholderCard
              item={selected}
              explain={explainById[selected.actorId]}
              onExplain={() => void runExplain(selected.actorId)}
              explainLoading={explainLoading}
              explainError={explainError}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <p className="text-xs text-slate-500">
              Select an actor on the map to see scores, interests, and AI-explain.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Toolbar parts ──────────────────────────────────────────────────────────

function AxisToggle({
  axisKey,
  setAxisKey,
}: {
  axisKey: keyof typeof AXIS_PAIRS;
  setAxisKey: (v: keyof typeof AXIS_PAIRS) => void;
}) {
  const keys: (keyof typeof AXIS_PAIRS)[] = ['p-l', 'p-u', 'l-u'];
  return (
    <div className="inline-flex rounded border border-slate-700 bg-slate-900/60 p-0.5 text-[11px]">
      {keys.map((k) => {
        const pair = AXIS_PAIRS[k];
        return (
          <button
            key={k}
            onClick={() => setAxisKey(k)}
            className={cn(
              'rounded px-2 py-1 transition-colors',
              axisKey === k ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {AXIS_LABEL[pair.x]} × {AXIS_LABEL[pair.y]}
          </button>
        );
      })}
    </div>
  );
}

function QuadrantFilter({
  value,
  onChange,
  counts,
}: {
  value: Set<SalienceQuadrant>;
  onChange: (v: Set<SalienceQuadrant>) => void;
  counts: Record<SalienceQuadrant, number>;
}) {
  function toggle(q: SalienceQuadrant) {
    const next = new Set(value);
    if (next.has(q)) next.delete(q);
    else next.add(q);
    onChange(next);
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {QUADRANTS.map((q) => {
        const active = value.has(q);
        const n = counts[q] ?? 0;
        return (
          <button
            key={q}
            onClick={() => toggle(q)}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] transition-colors',
              active ? 'border-transparent text-slate-950' : 'border-slate-700 text-slate-400 hover:border-slate-500',
            )}
            style={active ? { background: QUADRANT_COLOR[q] } : undefined}
          >
            {q} <span className="opacity-70">· {n}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Scatter ────────────────────────────────────────────────────────────────

function Scatter({
  data,
  pair,
  selectedId,
  onSelect,
}: {
  data: Salience[];
  pair: AxisPair;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const PAD = 36;
  const W = 640;
  const H = 440;
  const innerW = W - 2 * PAD;
  const innerH = H - 2 * PAD;

  function x(v: number) { return PAD + v * innerW; }
  function y(v: number) { return H - PAD - v * innerH; }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
      {/* Grid + axes */}
      <rect x={PAD} y={PAD} width={innerW} height={innerH} fill="transparent" stroke="#1E293B" />
      <line x1={PAD + innerW / 2} y1={PAD} x2={PAD + innerW / 2} y2={H - PAD} stroke="#1E293B" strokeDasharray="3 3" />
      <line x1={PAD} y1={PAD + innerH / 2} x2={W - PAD} y2={PAD + innerH / 2} stroke="#1E293B" strokeDasharray="3 3" />

      {/* Axis labels */}
      <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#64748B">{AXIS_LABEL[pair.x]}</text>
      <text
        x={12}
        y={H / 2}
        textAnchor="middle"
        fontSize="11"
        fill="#64748B"
        transform={`rotate(-90 12 ${H / 2})`}
      >
        {AXIS_LABEL[pair.y]}
      </text>

      {/* Points */}
      {data.map((s) => {
        const cx = x(s[pair.x]);
        const cy = y(s[pair.y]);
        const isSelected = s.actorId === selectedId;
        return (
          <g
            key={s.actorId}
            onClick={() => onSelect(s.actorId)}
            style={{ cursor: 'pointer' }}
          >
            <circle
              cx={cx}
              cy={cy}
              r={isSelected ? 9 : 6}
              fill={QUADRANT_COLOR[s.quadrant]}
              fillOpacity={0.7}
              stroke={isSelected ? '#F9FAFB' : 'none'}
              strokeWidth={1.5}
            />
            <text
              x={cx + 10}
              y={cy + 3}
              fontSize="10"
              fill={isSelected ? '#F9FAFB' : '#94A3B8'}
              pointerEvents="none"
            >
              {truncate(s.actorLabel, 28)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Side panel card ────────────────────────────────────────────────────────

function StakeholderCard({
  item,
  explain,
  onExplain,
  explainLoading,
  explainError,
  onClose,
}: {
  item: Salience;
  explain: ExplainOutput | undefined;
  onExplain: () => void;
  explainLoading: boolean;
  explainError: string | null;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 text-sm">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-100">{item.actorLabel}</h3>
          <span
            className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ background: `${QUADRANT_COLOR[item.quadrant]}33`, color: QUADRANT_COLOR[item.quadrant] }}
          >
            {item.quadrant}
          </span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* Score bars */}
      <div className="flex flex-col gap-1.5">
        <ScoreBar label="Power"      value={item.power}      />
        <ScoreBar label="Legitimacy" value={item.legitimacy} />
        <ScoreBar label="Urgency"    value={item.urgency}    />
      </div>

      {/* Explain */}
      <div className="mt-2 border-t border-slate-800 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">AI explain</span>
          <button
            onClick={onExplain}
            disabled={explainLoading}
            className="inline-flex items-center gap-1 rounded bg-gold-500/10 px-2 py-0.5 text-[10px] text-gold-500 border border-gold-500/30 hover:bg-gold-500/20 disabled:opacity-60"
          >
            {explainLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {explain ? 'Refresh' : 'Explain'}
          </button>
        </div>

        {explainError ? (
          <p className="mt-2 text-xs text-amber-500">{explainError}</p>
        ) : null}

        {explain ? (
          <div className="mt-2 flex flex-col gap-2 text-xs text-slate-300">
            <p className="leading-relaxed">{explain.rationale}</p>
            {explain.keyInterests.length ? (
              <Section label="Interests" items={explain.keyInterests} />
            ) : null}
            {explain.leverage.length ? (
              <Section label="Leverage" items={explain.leverage} />
            ) : null}
            {explain.constraints.length ? (
              <Section label="Constraints" items={explain.constraints} />
            ) : null}
            {explain.linkedEntities.length ? (
              <Section label="Linked entities" items={explain.linkedEntities} />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Section({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <ul className="mt-1 flex flex-col gap-0.5">
        {items.map((it, i) => (
          <li key={`${label}-${i}`} className="text-xs text-slate-300">· {it}</li>
        ))}
      </ul>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="w-[70px] text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <div className="h-1.5 flex-1 rounded bg-slate-800">
        <div className="h-full rounded bg-diplomatic-blue" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-[10px] tabular-nums text-slate-400">{value.toFixed(2)}</span>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function countsByQuadrant(items: Salience[]): Record<SalienceQuadrant, number> {
  const out = Object.fromEntries(QUADRANTS.map((q) => [q, 0])) as Record<SalienceQuadrant, number>;
  for (const s of items) out[s.quadrant] = (out[s.quadrant] ?? 0) + 1;
  return out;
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function EmptyActorsNotice() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm font-semibold text-slate-200">No actors extracted yet</p>
      <p className="max-w-sm text-xs text-slate-500">
        The stakeholder map draws from entity extraction. Ingest sources and build the situation graph, then return here to see the Mitchell-Agle-Wood salience plot.
      </p>
    </div>
  );
}

const DEMO_SITUATION: Situation = {
  id: 'demo-stakeholder',
  name: 'Nordalia — Demo',
  type: 'international',
  description: 'Demo situation used when no authenticated situation is active.',
  region: 'East Asia (fictional)',
  actors: ['Government of Nordalia', 'DRM', 'UN Mission Nordalia', 'Republic of Karovia', 'Civil Society Coalition', 'African Union'],
  userRole: 'analyst',
  status: 'active',
  riskScore: 68,
  glaslStage: 4,
  escalationTrend: 'escalating',
  actorCount: 6,
  graphEntities: 0,
  documentCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
