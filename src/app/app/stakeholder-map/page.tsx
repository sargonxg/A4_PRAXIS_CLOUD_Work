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
import { Users, Sparkles, Loader2, X, Target, Building2, Quote as QuoteIcon, ExternalLink, Download } from 'lucide-react';
import Link from 'next/link';
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
import { resolveCaseTemplate } from '@/lib/constants/cases';
import type { CaseStakeholder } from '@/lib/constants/cases/case-types';
import { getDemoTemplate } from '@/lib/constants/demo-templates';

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
  const caseParam = searchParams.get('case');
  const isSyriaCase = isSyriaWorkspaceCase(caseParam, isDemo);
  const genericTemplate = resolveCaseTemplate(caseParam);
  const isGenericTemplate = Boolean(genericTemplate);

  if (needsOnboarding) return <OnboardingRequiredState />;
  // For generic templates we render demo data without requiring a real situation.
  if (!isDemo && !isGenericTemplate && (showGuard || !situation)) return <NoSituationState />;

  const activeSituation: Situation = situation ?? (isSyriaCase
    ? SYRIA_DEMO_SITUATION
    : (genericTemplate ? buildTemplateSituation(genericTemplate) : DEMO_SITUATION));

  return (
    <StakeholderMap
      situation={activeSituation}
      isDemo={isDemo || isGenericTemplate}
      isSyriaCase={isSyriaCase}
      caseParam={caseParam}
    />
  );
}

function buildTemplateSituation(tpl: ReturnType<typeof resolveCaseTemplate>): Situation {
  if (!tpl) return DEMO_SITUATION;
  return {
    ...DEMO_SITUATION,
    id: tpl.id,
    name: tpl.contextLabel,
    description: tpl.subtitle,
    region: tpl.contextLabel.split('·')[0]?.trim() ?? DEMO_SITUATION.region,
    actorCount: tpl.situationStakeholders.length,
    riskScore: tpl.risk.score,
  };
}

function StakeholderMap({ situation, isDemo, isSyriaCase, caseParam }: { situation: Situation; isDemo: boolean; isSyriaCase: boolean; caseParam: string | null }) {
  const genericTemplate = resolveCaseTemplate(caseParam);
  const isGenericTemplate = Boolean(genericTemplate);
  const templateMeta = getDemoTemplate(caseParam);

  const [salience, setSalience] = useState<Salience[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [graphLoaded, setGraphLoaded] = useState(false);

  const [axisKey, setAxisKey] = useState<keyof typeof AXIS_PAIRS>('p-l');
  const [quadrantFilter, setQuadrantFilter] = useState<Set<SalienceQuadrant>>(new Set(QUADRANTS));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [setView, setSetView] = useState<'situation' | 'office'>('situation');

  const [explainById, setExplainById] = useState<Record<string, ExplainOutput>>({});
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  /**
   * Source of truth for stakeholder profile data — keyed by id so the card can
   * show interests / leverage / constraints / quote / docRefs without a server
   * roundtrip when the active case is a known demo template.
   */
  const stakeholdersById = useMemo<Record<string, CaseStakeholder>>(() => {
    if (genericTemplate) {
      const all = setView === 'office'
        ? genericTemplate.officeStakeholders
        : genericTemplate.situationStakeholders;
      return Object.fromEntries(all.map((s) => [s.id, s]));
    }
    if (isSyriaCase) {
      return Object.fromEntries(
        SYRIA_STAKEHOLDERS.map((s) => [s.id, {
          id: s.id,
          name: s.name,
          shortName: s.shortName,
          type: s.type as CaseStakeholder['type'],
          power: s.power,
          legitimacy: s.legitimacy,
          urgency: s.urgency,
          quadrant: s.quadrant as CaseStakeholder['quadrant'],
          position: s.position,
          interests: s.interests,
          leverage: s.leverage,
          constraints: s.constraints,
        }]),
      );
    }
    return {};
  }, [genericTemplate, setView, isSyriaCase]);

  const runScore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Generic demo template (Pakistan, US-Housing, ...): render the seeded set locally.
      if (genericTemplate) {
        const set = setView === 'office'
          ? genericTemplate.officeStakeholders
          : genericTemplate.situationStakeholders;
        setSalience(
          set.map((s) => ({
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
  }, [situation, isDemo, isSyriaCase, genericTemplate, setView]);

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
      // Generic demo template path: synthesize explain output locally.
      if (genericTemplate) {
        const set = setView === 'office'
          ? genericTemplate.officeStakeholders
          : genericTemplate.situationStakeholders;
        const stk = set.find((s) => s.id === actorId);
        if (stk) {
          setExplainById((prev) => ({
            ...prev,
            [actorId]: {
              actorId,
              actorLabel: stk.shortName ?? stk.name,
              rationale: `${stk.name} — ${stk.position} PRAXIS scores them as ${stk.quadrant} given Power ${(stk.power * 100).toFixed(0)} · Legitimacy ${(stk.legitimacy * 100).toFixed(0)} · Urgency ${(stk.urgency * 100).toFixed(0)}.`,
              keyInterests: stk.interests,
              leverage: stk.leverage,
              constraints: stk.constraints,
              linkedEntities: set.filter((other) => other.id !== stk.id).slice(0, 4).map((o) => o.shortName ?? o.name),
            },
          }));
        }
        return;
      }
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

  function exportCsv() {
    const rows = (salience ?? []).map((s) => {
      const stk = stakeholdersById[s.actorId];
      return {
        id: s.actorId,
        name: stk?.name ?? s.actorLabel,
        type: stk?.type ?? '',
        power: s.power.toFixed(2),
        legitimacy: s.legitimacy.toFixed(2),
        urgency: s.urgency.toFixed(2),
        quadrant: s.quadrant,
        position: stk?.position ?? '',
      };
    });
    if (!rows.length) return;
    const header = Object.keys(rows[0]).join(',');
    const body = rows
      .map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stakeholder-map-${caseParam ?? 'workspace'}-${setView}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasOfficeSet = Boolean(genericTemplate && genericTemplate.officeStakeholders.length);

  return (
    <div className="flex flex-col gap-4 p-6">
      <RegistryToolInfo toolId="stakeholder-map" />

      {/* Header + toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-diplomatic-blue" />
          <h1 className="text-lg font-semibold text-slate-100">Stakeholder Map</h1>
          {templateMeta && (
            <span className="rounded-full border border-gold-500/40 bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-400">
              {templateMeta.flag} {templateMeta.shortName}
            </span>
          )}
          <span className="text-xs text-slate-500">
            {graphLoaded ? 'Scored from situation graph' : 'Fallback scoring (no graph yet)'}
            {isDemo ? ' · demo' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasOfficeSet && (
            <div className="inline-flex rounded border border-slate-700 bg-slate-900/60 p-0.5 text-[11px]">
              <button
                onClick={() => setSetView('situation')}
                className={cn(
                  'inline-flex items-center gap-1 rounded px-2 py-1 transition-colors',
                  setView === 'situation' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200',
                )}
              >
                <Target className="h-3 w-3" /> Situation
              </button>
              <button
                onClick={() => setSetView('office')}
                className={cn(
                  'inline-flex items-center gap-1 rounded px-2 py-1 transition-colors',
                  setView === 'office' ? 'bg-slate-700 text-slate-100' : 'text-slate-400 hover:text-slate-200',
                )}
              >
                <Building2 className="h-3 w-3" /> Office
              </button>
            </div>
          )}
          <AxisToggle axisKey={axisKey} setAxisKey={setAxisKey} />
          <button
            onClick={() => void runScore()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Target className="h-3 w-3" />}
            Rescore
          </button>
          <button
            onClick={exportCsv}
            disabled={!salience || salience.length === 0}
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-60"
          >
            <Download className="h-3 w-3" /> Export
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
        <div className="relative min-h-[460px] flex-1 overflow-hidden rounded-md border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 p-4">
          {/* Decorative backdrop — radial glow + dotted grid for the dark force-graph aesthetic. */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_25%_30%,#1d4ed8_0%,transparent_45%),radial-gradient(circle_at_75%_70%,#a63d40_0%,transparent_45%)]" />
            <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#475569_1px,transparent_1px)] [background-size:14px_14px]" />
          </div>
          {error ? (
            <div className="relative flex h-full items-center justify-center text-sm text-amber-500">{error}</div>
          ) : !salience ? (
            <div className="relative flex h-full items-center justify-center text-sm text-slate-400">
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

        <aside className="w-full shrink-0 rounded-md border border-slate-800 bg-slate-950/60 p-4 lg:w-[360px]">
          {selected ? (
            <StakeholderCard
              item={selected}
              profile={stakeholdersById[selected.actorId]}
              explain={explainById[selected.actorId]}
              onExplain={() => void runExplain(selected.actorId)}
              explainLoading={explainLoading}
              explainError={explainError}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Click any actor on the map to see scores, position, interests, leverage, constraints, and a sourced quote when available.
              </p>
              {templateMeta && (
                <p className="text-[11px] text-slate-500">
                  This map is showing the {templateMeta.shortName} demo template — {setView === 'office' ? 'office-side' : 'situation-side'} stakeholders.
                </p>
              )}
            </div>
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
  const PAD = 40;
  const W = 700;
  const H = 460;
  const innerW = W - 2 * PAD;
  const innerH = H - 2 * PAD;

  function x(v: number) { return PAD + v * innerW; }
  function y(v: number) { return H - PAD - v * innerH; }

  // Edges between high-salience pairs — purely decorative, gives the map a
  // network feel without making any factual claim about specific relationships.
  const edges = useMemo(() => {
    const high = data.filter((d) => d.power + d.legitimacy + d.urgency > 1.4);
    const out: Array<{ a: Salience; b: Salience; w: number }> = [];
    for (let i = 0; i < high.length; i++) {
      for (let j = i + 1; j < high.length; j++) {
        const a = high[i];
        const b = high[j];
        const dx = a.power - b.power;
        const dy = a.legitimacy - b.legitimacy;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.5) out.push({ a, b, w: 0.5 - dist });
      }
    }
    return out;
  }, [data]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="relative h-full w-full">
      {/* Quadrant tint */}
      <defs>
        <linearGradient id="map-bg-1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.08" />
        </linearGradient>
      </defs>
      <rect x={PAD} y={PAD} width={innerW} height={innerH} fill="url(#map-bg-1)" stroke="#1E293B" />
      <line x1={PAD + innerW / 2} y1={PAD} x2={PAD + innerW / 2} y2={H - PAD} stroke="#1E293B" strokeDasharray="3 3" />
      <line x1={PAD} y1={PAD + innerH / 2} x2={W - PAD} y2={PAD + innerH / 2} stroke="#1E293B" strokeDasharray="3 3" />

      {/* Quadrant labels */}
      <text x={PAD + innerW * 0.25} y={PAD + 14} textAnchor="middle" fontSize="9" fill="#475569">low {AXIS_LABEL[pair.x]} · high {AXIS_LABEL[pair.y]}</text>
      <text x={PAD + innerW * 0.75} y={PAD + 14} textAnchor="middle" fontSize="9" fill="#475569">high {AXIS_LABEL[pair.x]} · high {AXIS_LABEL[pair.y]}</text>
      <text x={PAD + innerW * 0.25} y={H - PAD + 14} textAnchor="middle" fontSize="9" fill="#475569">low {AXIS_LABEL[pair.x]} · low {AXIS_LABEL[pair.y]}</text>
      <text x={PAD + innerW * 0.75} y={H - PAD + 14} textAnchor="middle" fontSize="9" fill="#475569">high {AXIS_LABEL[pair.x]} · low {AXIS_LABEL[pair.y]}</text>

      {/* Axis labels */}
      <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#94A3B8">{AXIS_LABEL[pair.x]} →</text>
      <text
        x={14}
        y={H / 2}
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="#94A3B8"
        transform={`rotate(-90 14 ${H / 2})`}
      >
        {AXIS_LABEL[pair.y]} →
      </text>

      {/* Decorative edges between high-salience pairs */}
      <g opacity="0.4">
        {edges.map((e, i) => (
          <line
            key={`edge-${i}`}
            x1={x(e.a[pair.x])}
            y1={y(e.a[pair.y])}
            x2={x(e.b[pair.x])}
            y2={y(e.b[pair.y])}
            stroke="#3B82F6"
            strokeOpacity={0.4 * e.w}
            strokeWidth={0.6}
          />
        ))}
      </g>

      {/* Points */}
      {data.map((s) => {
        const cx = x(s[pair.x]);
        const cy = y(s[pair.y]);
        const isSelected = s.actorId === selectedId;
        const r = isSelected ? 10 : 6 + (s.power + s.legitimacy + s.urgency) * 0.8;
        return (
          <g
            key={s.actorId}
            onClick={() => onSelect(s.actorId)}
            style={{ cursor: 'pointer' }}
          >
            {isSelected && (
              <circle
                cx={cx}
                cy={cy}
                r={r + 6}
                fill="none"
                stroke={QUADRANT_COLOR[s.quadrant]}
                strokeOpacity={0.4}
                strokeWidth={1}
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={QUADRANT_COLOR[s.quadrant]}
              fillOpacity={isSelected ? 0.9 : 0.72}
              stroke={isSelected ? '#F9FAFB' : QUADRANT_COLOR[s.quadrant]}
              strokeOpacity={isSelected ? 1 : 0.45}
              strokeWidth={isSelected ? 1.5 : 1}
            />
            <text
              x={cx + r + 4}
              y={cy + 3}
              fontSize="10"
              fontWeight={isSelected ? 600 : 400}
              fill={isSelected ? '#F9FAFB' : '#CBD5E1'}
              pointerEvents="none"
            >
              {truncate(s.actorLabel, 30)}
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
  profile,
  explain,
  onExplain,
  explainLoading,
  explainError,
  onClose,
}: {
  item: Salience;
  profile: CaseStakeholder | undefined;
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
          <h3 className="truncate text-sm font-semibold text-slate-100">{profile?.name ?? item.actorLabel}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: `${QUADRANT_COLOR[item.quadrant]}33`, color: QUADRANT_COLOR[item.quadrant] }}
            >
              {item.quadrant}
            </span>
            {profile?.type && (
              <span className="rounded border border-slate-700 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">
                {profile.type.replace(/_/g, ' ')}
              </span>
            )}
            {profile?.office && (
              <span className="rounded border border-emerald-700/60 bg-emerald-700/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-emerald-300">
                Office side
              </span>
            )}
          </div>
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

      {/* Local profile (interests/leverage/constraints) */}
      {profile && (
        <div className="border-t border-slate-800 pt-3">
          <p className="text-xs leading-relaxed text-slate-200"><span className="font-semibold">Position.</span> {profile.position}</p>
          <div className="mt-2 grid gap-2">
            {profile.interests.length ? <Section label="Interests" items={profile.interests} /> : null}
            {profile.leverage.length ? <Section label="Leverage" items={profile.leverage} /> : null}
            {profile.constraints.length ? <Section label="Constraints" items={profile.constraints} /> : null}
            {profile.quote && (
              <div className="rounded border border-slate-700 bg-slate-900/50 p-2 text-[11px] leading-4 text-slate-300">
                <QuoteIcon className="mb-1 h-3 w-3 text-slate-500" />
                <p className="italic">“{profile.quote.text}”</p>
                <p className="mt-1 text-[10px] text-slate-500">— {profile.quote.attribution}{profile.quote.url ? (
                  <Link href={profile.quote.url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center text-emerald-400 hover:text-emerald-300">
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                ) : null}</p>
              </div>
            )}
            {profile.docRefs && profile.docRefs.length ? (
              <Section label="Document refs" items={profile.docRefs} />
            ) : null}
          </div>
        </div>
      )}

      {/* Explain */}
      <div className="mt-1 border-t border-slate-800 pt-3">
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
            {!profile && explain.keyInterests.length ? (
              <Section label="Interests" items={explain.keyInterests} />
            ) : null}
            {!profile && explain.leverage.length ? (
              <Section label="Leverage" items={explain.leverage} />
            ) : null}
            {!profile && explain.constraints.length ? (
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
