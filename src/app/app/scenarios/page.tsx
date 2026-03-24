'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import type { Situation } from '@/types/situation';

import { useState, useCallback, useRef } from 'react';
import { GitCompare, Play, Save, Loader2, Sparkles, X, ChevronDown, Plus, Trash2, Wind, SlidersHorizontal, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { EcosystemBadge } from '@/components/shared/ecosystem-badge';
import { useConflictList } from '@/hooks/use-conflict-data';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import { SCENARIO_PRESETS, type ScenarioPreset } from '@/lib/constants/scenario-configs';

const TIME_HORIZONS = ['30 days', '90 days', '6 months', '1 year'];

const NORDALIA_ACTORS = [
  'Government of Nordalia',
  'DRM (Democratic Reform Movement)',
  'UNMN (UN Mission in Nordalia)',
  'Republic of Karovia',
  'Civil Society Coalition',
  'African Union Mediation Team',
  'Sertania (Neighboring State)',
];

interface SavedScenario {
  id: string;
  title: string;
  trigger: string;
  conflictContext: string;
  timeHorizon: string;
  analysis: string;
  savedAt: Date;
}

function DemoScenariosPage() {

  const { data: cases, loading: casesLoading } = useConflictList();
  const [conflictId, setConflictId] = useState('nordalia');
  const [trigger, setTrigger] = useState('');
  const [selectedActors, setSelectedActors] = useState<string[]>([]);
  const [timeHorizon, setTimeHorizon] = useState('90 days');
  const [analysis, setAnalysis] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [compareIdx, setCompareIdx] = useState<number | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const [builderParams, setBuilderParams] = useState(SCENARIO_PRESETS[0].params);
  const [activePreset, setActivePreset] = useState<string | null>(SCENARIO_PRESETS[0].id);

  const demoCases = cases ?? [];
  const selectedCase = demoCases.find((c) => c.id === conflictId) ?? demoCases[0];

  const toggleActor = (actor: string) => {
    setSelectedActors((prev) =>
      prev.includes(actor) ? prev.filter((a) => a !== actor) : [...prev, actor]
    );
  };

  const runScenario = useCallback(async () => {
    if (!trigger.trim() || isRunning || !selectedCase) return;
    setIsRunning(true);
    setAnalysis('');
    setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      const response = await fetch('/api/ai/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictContext: `${selectedCase.name} — ${selectedCase.description}`,
          scenarioTrigger: trigger,
          actors: selectedActors,
          timeHorizon,
        }),
      });

      if (!response.ok || !response.body) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += parseDataStreamChunk(decoder.decode(value, { stream: true }));
        setAnalysis(accumulated);
      }
    } catch {
      setAnalysis(`**Scenario analysis failed.** Please try again.\n\n*Trigger: ${trigger}*\n\n*Conflict: ${selectedCase?.name}*\n\n*Time horizon: ${timeHorizon}*`);
    } finally {
      setIsRunning(false);
    }
  }, [trigger, isRunning, selectedCase, selectedActors, timeHorizon]);

  const saveScenario = () => {
    if (!analysis || !selectedCase) return;
    const scenario: SavedScenario = {
      id: Date.now().toString(),
      title: trigger.slice(0, 60) + (trigger.length > 60 ? '…' : ''),
      trigger,
      conflictContext: selectedCase.name,
      timeHorizon,
      analysis,
      savedAt: new Date(),
    };
    setSavedScenarios((prev) => [scenario, ...prev]);
  };

  const updateParam = <K extends keyof ScenarioPreset['params']>(key: K, value: ScenarioPreset['params'][K]) => {
    const next = { ...builderParams, [key]: value };
    setBuilderParams(next);
    const match = SCENARIO_PRESETS.find(
      (p) =>
        p.params.ceasefireCompliance === next.ceasefireCompliance &&
        p.params.externalIntervention === next.externalIntervention &&
        p.params.economicPressure === next.economicPressure &&
        p.params.humanitarianAccess === next.humanitarianAccess &&
        p.params.mediaEnvironment === next.mediaEnvironment &&
        p.params.timelineHorizon === next.timelineHorizon
    );
    setActivePreset(match?.id ?? null);
  };

  const applyPreset = (preset: ScenarioPreset) => {
    setBuilderParams({ ...preset.params });
    setActivePreset(preset.id);
  };

  const activePresetData = SCENARIO_PRESETS.find((p) => p.id === activePreset);

  const EXAMPLE_TRIGGERS = [
    'DRM withdraws from the Framework Agreement',
    'Karovia increases military support to DRM',
    'UNMN mandate lapses without renewal',
    'Ceasefire collapses after major IHL violation',
    'Mining revenues seized by DRM, triggering sanctions',
  ];

  // Loading skeleton while cases are being fetched
  if (casesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-steel/8">
            <GitCompare className="h-5 w-5 text-steel" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Scenario Planner</h1>
            <p className="text-sm text-navy-500">Loading conflict data...</p>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5 space-y-5">
              <div className="h-10 w-full animate-pulse rounded-lg bg-navy-100" />
              <div className="h-20 w-full animate-pulse rounded-lg bg-navy-100" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-navy-100" />
            </div>
          </div>
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-app-border)] bg-white p-8">
            <div className="h-14 w-14 animate-pulse rounded-2xl bg-navy-100" />
            <div className="mt-4 h-5 w-48 animate-pulse rounded bg-navy-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scenario Builder */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
        <div className="flex items-center gap-3 border-b border-[var(--color-app-border)] px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
            <SlidersHorizontal className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Scenario Builder</h2>
            <p className="text-[11px] text-navy-500">Adjust parameters to model conflict trajectories</p>
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-2">
          {/* Left: Parameters */}
          <div className="space-y-4">
            {/* Ceasefire Compliance Slider */}
            <div>
              <label className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                <span>Ceasefire Compliance</span>
                <span className="text-[11px] font-bold text-navy-700 normal-case tracking-normal">{builderParams.ceasefireCompliance}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={builderParams.ceasefireCompliance}
                onChange={(e) => updateParam('ceasefireCompliance', Number(e.target.value))}
                className="w-full accent-diplomatic-blue"
              />
              <div className="mt-1 flex justify-between text-[9px] text-navy-300">
                <span>Non-compliant</span>
                <span>Full compliance</span>
              </div>
            </div>

            {/* External Intervention Select */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">External Intervention</label>
              <div className="relative">
                <select
                  value={builderParams.externalIntervention}
                  onChange={(e) => updateParam('externalIntervention', e.target.value as ScenarioPreset['params']['externalIntervention'])}
                  className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-sm text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
                >
                  <option value="none">None</option>
                  <option value="diplomatic">Diplomatic</option>
                  <option value="military">Military</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
            </div>

            {/* Economic Pressure Select */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Economic Pressure</label>
              <div className="relative">
                <select
                  value={builderParams.economicPressure}
                  onChange={(e) => updateParam('economicPressure', e.target.value as ScenarioPreset['params']['economicPressure'])}
                  className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-sm text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="sanctions">Sanctions</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
            </div>

            {/* Humanitarian Access Select */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Humanitarian Access</label>
              <div className="relative">
                <select
                  value={builderParams.humanitarianAccess}
                  onChange={(e) => updateParam('humanitarianAccess', e.target.value as ScenarioPreset['params']['humanitarianAccess'])}
                  className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-sm text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
                >
                  <option value="full">Full</option>
                  <option value="partial">Partial</option>
                  <option value="blocked">Blocked</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
            </div>

            {/* Media Environment Select */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Media Environment</label>
              <div className="relative">
                <select
                  value={builderParams.mediaEnvironment}
                  onChange={(e) => updateParam('mediaEnvironment', e.target.value as ScenarioPreset['params']['mediaEnvironment'])}
                  className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-sm text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
                >
                  <option value="open">Open</option>
                  <option value="restricted">Restricted</option>
                  <option value="shutdown">Shutdown</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
            </div>

            {/* Timeline Horizon Pills */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Timeline Horizon</label>
              <div className="flex gap-2">
                {([30, 60, 90, 180] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => updateParam('timelineHorizon', d)}
                    className={cn(
                      'flex-1 rounded-lg border py-2 text-[11px] font-medium transition-all',
                      builderParams.timelineHorizon === d
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'border-[var(--color-app-border)] text-navy-600 bg-white hover:bg-[var(--color-app-surface-alt)]'
                    )}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Scenarios */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Preset Scenarios</label>
              <div className="grid grid-cols-2 gap-2">
                {SCENARIO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      'rounded-lg border p-2.5 text-left transition-all',
                      activePreset === preset.id
                        ? 'border-diplomatic-blue/40 bg-diplomatic-blue/5 ring-1 ring-diplomatic-blue/20'
                        : 'border-[var(--color-app-border)] hover:bg-[var(--color-app-surface-alt)]'
                    )}
                  >
                    <p className="text-[11px] font-semibold text-navy-800">{preset.name}</p>
                    <p className="mt-0.5 text-[10px] text-navy-500 leading-snug">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Wind Tunnel CTA */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <div className="flex items-start gap-2">
                <Wind className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-navy-800">Run in Wind Tunnel</p>
                  <p className="mt-0.5 text-[10px] text-navy-500 leading-snug">
                    For psychographic impact analysis across 27 population tribes, run this scenario in Wind Tunnel.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <a
                      href="https://windtunnel.tacitus.me"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-amber-700 transition-colors"
                    >
                      Open Wind Tunnel
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <EcosystemBadge product="WIND_TUNNEL" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Projected Outcomes */}
          <div>
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Projected Outcomes</h3>
            {activePresetData ? (
              <div className="space-y-3">
                {([
                  { key: 'best' as const, label: 'Best Case', color: 'emerald', bgColor: 'bg-emerald-50', barColor: 'bg-emerald-500', textColor: 'text-emerald-700', badgeColor: 'bg-emerald-100 text-emerald-700' },
                  { key: 'base' as const, label: 'Base Case', color: 'amber', bgColor: 'bg-amber-50', barColor: 'bg-amber-500', textColor: 'text-amber-700', badgeColor: 'bg-amber-100 text-amber-700' },
                  { key: 'worst' as const, label: 'Worst Case', color: 'red', bgColor: 'bg-red-50', barColor: 'bg-red-500', textColor: 'text-red-700', badgeColor: 'bg-red-100 text-red-700' },
                ]).map(({ key, label, bgColor, barColor, textColor, badgeColor }) => {
                  const outcome = activePresetData.outcomes[key];
                  return (
                    <div key={key} className={cn('rounded-lg border border-[var(--color-app-border)] p-4', bgColor)}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn('text-[11px] font-semibold uppercase tracking-wide', textColor)}>{label}</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', badgeColor)}>
                          {outcome.riskDelta > 0 ? '+' : ''}{outcome.riskDelta} risk
                        </span>
                      </div>
                      <div className="mb-2 flex items-baseline gap-1">
                        <span className={cn('text-3xl font-bold', textColor)}>{outcome.probability}</span>
                        <span className={cn('text-sm font-medium', textColor)}>%</span>
                      </div>
                      <div className="mb-3 h-2 w-full rounded-full bg-white/60">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', barColor)}
                          style={{ width: `${outcome.probability}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-navy-700 leading-relaxed">{outcome.summary}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-6 text-center">
                <SlidersHorizontal className="h-8 w-8 text-navy-300 mb-3" />
                <p className="text-sm font-semibold text-navy-700">Custom Scenario</p>
                <p className="mt-1.5 text-[11px] text-navy-500 max-w-xs leading-relaxed">
                  Adjust parameters and select a preset to see projected outcomes, or run in Wind Tunnel for custom analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-steel/8">
          <GitCompare className="h-5 w-5 text-steel" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Scenario Planner</h1>
          <p className="text-sm text-navy-500">
            Model &ldquo;what if&rdquo; scenarios across political, security, humanitarian, and economic dimensions using Gemini 2.5 Flash.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left: Setup Panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5 space-y-5">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Base Conflict</label>
              <div className="relative">
                <select
                  value={conflictId}
                  onChange={(e) => setConflictId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
                >
                  {demoCases.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
              {selectedCase && (
                <p className="mt-1.5 text-[11px] text-navy-500">{selectedCase.description.slice(0, 100)}…</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Scenario Trigger</label>
              <textarea
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="Describe the hypothetical event triggering this scenario..."
                rows={3}
                className="w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10 resize-none"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {EXAMPLE_TRIGGERS.slice(0, 3).map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setTrigger(ex)}
                    className="rounded-full border border-[var(--color-app-border)] bg-white px-2.5 py-1 text-[10px] text-navy-500 hover:border-diplomatic-blue/30 hover:text-navy-700 transition-colors"
                  >
                    {ex.slice(0, 35)}…
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Involved Actors</label>
              <div className="flex flex-wrap gap-1.5">
                {(conflictId === 'nordalia' ? NORDALIA_ACTORS : ['Primary state', 'Opposition', 'International mediator', 'Regional power']).map((actor) => (
                  <button
                    key={actor}
                    onClick={() => toggleActor(actor)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all',
                      selectedActors.includes(actor)
                        ? 'bg-diplomatic-blue text-white border-diplomatic-blue'
                        : 'border-[var(--color-app-border)] text-navy-600 bg-white hover:bg-[var(--color-app-surface-alt)]'
                    )}
                  >
                    {actor.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Time Horizon</label>
              <div className="flex gap-2">
                {TIME_HORIZONS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setTimeHorizon(h)}
                    className={cn(
                      'flex-1 rounded-lg border py-2 text-[11px] font-medium transition-all',
                      timeHorizon === h
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'border-[var(--color-app-border)] text-navy-600 bg-white hover:bg-[var(--color-app-surface-alt)]'
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={runScenario}
              disabled={!trigger.trim() || isRunning}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-diplomatic-blue py-3 text-sm font-semibold text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 transition-colors"
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isRunning ? 'Running Scenario…' : 'Run Scenario Analysis'}
            </button>
          </div>

          {/* Saved Scenarios */}
          {savedScenarios.length > 0 && (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Saved Scenarios ({savedScenarios.length})</p>
              <div className="space-y-2">
                {savedScenarios.map((s, idx) => (
                  <div
                    key={s.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors',
                      compareIdx === idx
                        ? 'border-diplomatic-blue/30 bg-diplomatic-blue/5'
                        : 'border-[var(--color-app-border)] hover:bg-[var(--color-app-surface-alt)]'
                    )}
                    onClick={() => setCompareIdx(compareIdx === idx ? null : idx)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-navy-800 truncate">{s.title}</p>
                      <p className="text-[10px] text-navy-400">{s.conflictContext} · {s.timeHorizon}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSavedScenarios((prev) => prev.filter((_, i) => i !== idx)); }}
                      className="text-navy-300 hover:text-crimson"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Analysis Panel */}
        <div ref={analysisRef}>
          {!analysis && !isRunning ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-app-border)] bg-white p-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-diplomatic-blue/8">
                <GitCompare className="h-6 w-6 text-diplomatic-blue" />
              </div>
              <p className="text-base font-semibold text-navy-800">Configure Your Scenario</p>
              <p className="mt-2 text-sm text-navy-500 max-w-xs">
                Select a conflict, define a trigger event, and choose a time horizon. Gemini will analyze consequences across 5 dimensions.
              </p>
              <div className="mt-6 space-y-2 text-left w-full max-w-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 text-center mb-3">Example Triggers</p>
                {EXAMPLE_TRIGGERS.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setTrigger(ex)}
                    className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-app-border)] px-3 py-2.5 text-left text-xs text-navy-600 hover:border-diplomatic-blue/30 hover:text-navy-800 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0 text-navy-400" />
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
              {/* Analysis header */}
              <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10">
                    <Sparkles className="h-4 w-4 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">Scenario Analysis</p>
                    <p className="text-[11px] text-navy-500">{selectedCase?.name} · {timeHorizon}</p>
                  </div>
                </div>
                {analysis && !isRunning && (
                  <button
                    onClick={saveScenario}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] px-3 py-1.5 text-[11px] font-medium text-navy-600 hover:text-diplomatic-blue transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save Scenario
                  </button>
                )}
              </div>

              {/* Trigger display */}
              <div className="border-b border-[var(--color-app-border-light)] bg-[var(--color-app-surface-alt)] px-5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 mb-1">Trigger Event</p>
                <p className="text-sm text-navy-800 italic">&ldquo;{trigger}&rdquo;</p>
              </div>

              {/* Analysis content */}
              <div className="px-5 py-5">
                {isRunning && !analysis && (
                  <div className="flex items-center gap-2 text-sm text-navy-400">
                    <Loader2 className="h-4 w-4 animate-spin text-diplomatic-blue" />
                    Analyzing scenario across 5 dimensions…
                  </div>
                )}
                {analysis && (
                  <div className="prose prose-sm max-w-none text-navy-700">
                    <MarkdownRenderer content={analysis} />
                    {isRunning && (
                      <span className="inline-block h-4 w-0.5 animate-pulse bg-diplomatic-blue ml-0.5" />
                    )}
                  </div>
                )}
              </div>

              {/* Comparison view */}
              {compareIdx !== null && savedScenarios[compareIdx] && (
                <div className="border-t border-[var(--color-app-border)] px-5 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-navy-900">Comparing with: <span className="text-diplomatic-blue">{savedScenarios[compareIdx].title}</span></p>
                    <button onClick={() => setCompareIdx(null)} className="text-navy-400 hover:text-navy-600"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 mb-2">Trigger: {savedScenarios[compareIdx].trigger}</p>
                    <div className="prose prose-sm max-w-none text-navy-700 text-xs">
                      <MarkdownRenderer content={savedScenarios[compareIdx].analysis.slice(0, 600) + '…'} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Methodology note */}
      <div className="flex items-start gap-3 rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-navy-200 text-[10px] font-semibold text-navy-400">?</div>
        <div>
          <p className="text-[11px] font-semibold text-navy-700">Analytical Framework</p>
          <p className="text-[11px] text-navy-500 leading-relaxed mt-0.5">
            Scenarios are analyzed across Political, Security, Humanitarian, Economic, and Regional dimensions. Each dimension provides most likely / best case / worst case outcomes with calibrated confidence language. Policy responses are categorized by type and implementing actor. This follows the structured scenario methodology used at ICG, UN DPPA, and major conflict research centers.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Real mode — situation-driven, no hardcoded Nordalia data
// ============================================================================

function RealScenariosPage({ situation }: { situation: Situation }) {
  const actors = situation.actors ?? [];
  const [trigger, setTrigger] = useState('');
  const [selectedActors, setSelectedActors] = useState<string[]>([]);
  const [timeHorizon, setTimeHorizon] = useState('90 days');
  const [analysis, setAnalysis] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [compareIdx, setCompareIdx] = useState<number | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const conflictContext = `${situation.name} — ${situation.description}`;

  const toggleActor = (actor: string) => {
    setSelectedActors((prev) =>
      prev.includes(actor) ? prev.filter((a) => a !== actor) : [...prev, actor]
    );
  };

  const runScenario = useCallback(async () => {
    if (!trigger.trim() || isRunning) return;
    setIsRunning(true);
    setAnalysis('');
    setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      const response = await fetch('/api/ai/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictContext,
          scenarioTrigger: trigger,
          actors: selectedActors,
          timeHorizon,
        }),
      });

      if (!response.ok || !response.body) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += parseDataStreamChunk(decoder.decode(value, { stream: true }));
        setAnalysis(accumulated);
      }
    } catch {
      setAnalysis(`**Scenario analysis failed.** Please try again.\n\n*Trigger: ${trigger}*\n\n*Situation: ${situation.name}*\n\n*Time horizon: ${timeHorizon}*`);
    } finally {
      setIsRunning(false);
    }
  }, [trigger, isRunning, conflictContext, selectedActors, timeHorizon, situation.name]);

  const saveScenario = () => {
    if (!analysis) return;
    const scenario: SavedScenario = {
      id: Date.now().toString(),
      title: trigger.slice(0, 60) + (trigger.length > 60 ? '...' : ''),
      trigger,
      conflictContext: situation.name,
      timeHorizon,
      analysis,
      savedAt: new Date(),
    };
    setSavedScenarios((prev) => [scenario, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-steel/8">
          <GitCompare className="h-5 w-5 text-steel" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Scenario Planner</h1>
          <p className="text-sm text-navy-500">
            {situation.name} — model &ldquo;what if&rdquo; scenarios across political, security, humanitarian, and economic dimensions
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left: Setup Panel */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5 space-y-5">
            {/* Situation context (read-only) */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Situation</label>
              <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5 text-sm text-navy-700">
                {situation.name}
              </div>
              <p className="mt-1.5 text-[11px] text-navy-500">{situation.description.slice(0, 120)}{situation.description.length > 120 ? '...' : ''}</p>
            </div>

            {/* Scenario trigger */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Scenario Trigger</label>
              <textarea
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="Describe the hypothetical event triggering this scenario..."
                rows={3}
                className="w-full rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10 resize-none"
              />
            </div>

            {/* Involved actors */}
            {actors.length > 0 && (
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Involved Actors</label>
                <div className="flex flex-wrap gap-1.5">
                  {actors.map((actor) => (
                    <button
                      key={actor}
                      onClick={() => toggleActor(actor)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all',
                        selectedActors.includes(actor)
                          ? 'bg-diplomatic-blue text-white border-diplomatic-blue'
                          : 'border-[var(--color-app-border)] text-navy-600 bg-white hover:bg-[var(--color-app-surface-alt)]'
                      )}
                    >
                      {actor}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time horizon */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Time Horizon</label>
              <div className="flex gap-2">
                {TIME_HORIZONS.map((h) => (
                  <button
                    key={h}
                    onClick={() => setTimeHorizon(h)}
                    className={cn(
                      'flex-1 rounded-lg border py-2 text-[11px] font-medium transition-all',
                      timeHorizon === h
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'border-[var(--color-app-border)] text-navy-600 bg-white hover:bg-[var(--color-app-surface-alt)]'
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={runScenario}
              disabled={!trigger.trim() || isRunning}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-diplomatic-blue py-3 text-sm font-semibold text-white hover:bg-diplomatic-blue/90 disabled:opacity-50 transition-colors"
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isRunning ? 'Running Scenario...' : 'Run Scenario Analysis'}
            </button>

            <p className="text-center text-[10px] text-navy-400">Uses 3 credits per analysis</p>
          </div>

          {/* Saved Scenarios */}
          {savedScenarios.length > 0 && (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">Saved Scenarios ({savedScenarios.length})</p>
              <div className="space-y-2">
                {savedScenarios.map((s, idx) => (
                  <div
                    key={s.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors',
                      compareIdx === idx
                        ? 'border-diplomatic-blue/30 bg-diplomatic-blue/5'
                        : 'border-[var(--color-app-border)] hover:bg-[var(--color-app-surface-alt)]'
                    )}
                    onClick={() => setCompareIdx(compareIdx === idx ? null : idx)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-navy-800 truncate">{s.title}</p>
                      <p className="text-[10px] text-navy-400">{s.conflictContext} · {s.timeHorizon}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSavedScenarios((prev) => prev.filter((_, i) => i !== idx)); }}
                      className="text-navy-300 hover:text-crimson"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Analysis Panel */}
        <div ref={analysisRef}>
          {!analysis && !isRunning ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-app-border)] bg-white p-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-diplomatic-blue/8">
                <GitCompare className="h-6 w-6 text-diplomatic-blue" />
              </div>
              <p className="text-base font-semibold text-navy-800">Configure Your Scenario</p>
              <p className="mt-2 text-sm text-navy-500 max-w-xs">
                Define a trigger event and choose a time horizon. Gemini will analyze consequences across 5 dimensions for {situation.name}.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
              {/* Analysis header */}
              <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10">
                    <Sparkles className="h-4 w-4 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">Scenario Analysis</p>
                    <p className="text-[11px] text-navy-500">{situation.name} · {timeHorizon}</p>
                  </div>
                </div>
                {analysis && !isRunning && (
                  <button
                    onClick={saveScenario}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] px-3 py-1.5 text-[11px] font-medium text-navy-600 hover:text-diplomatic-blue transition-colors"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save Scenario
                  </button>
                )}
              </div>

              {/* Trigger display */}
              <div className="border-b border-[var(--color-app-border-light)] bg-[var(--color-app-surface-alt)] px-5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 mb-1">Trigger Event</p>
                <p className="text-sm text-navy-800 italic">&ldquo;{trigger}&rdquo;</p>
              </div>

              {/* Analysis content */}
              <div className="px-5 py-5">
                {isRunning && !analysis && (
                  <div className="flex items-center gap-2 text-sm text-navy-400">
                    <Loader2 className="h-4 w-4 animate-spin text-diplomatic-blue" />
                    Analyzing scenario across 5 dimensions...
                  </div>
                )}
                {analysis && (
                  <div className="prose prose-sm max-w-none text-navy-700">
                    <MarkdownRenderer content={analysis} />
                    {isRunning && (
                      <span className="inline-block h-4 w-0.5 animate-pulse bg-diplomatic-blue ml-0.5" />
                    )}
                  </div>
                )}
              </div>

              {/* Comparison view */}
              {compareIdx !== null && savedScenarios[compareIdx] && (
                <div className="border-t border-[var(--color-app-border)] px-5 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-navy-900">Comparing with: <span className="text-diplomatic-blue">{savedScenarios[compareIdx].title}</span></p>
                    <button onClick={() => setCompareIdx(null)} className="text-navy-400 hover:text-navy-600"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 mb-2">Trigger: {savedScenarios[compareIdx].trigger}</p>
                    <div className="prose prose-sm max-w-none text-navy-700 text-xs">
                      <MarkdownRenderer content={savedScenarios[compareIdx].analysis.slice(0, 600) + '...'} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Methodology note */}
      <div className="flex items-start gap-3 rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-navy-200 text-[10px] font-semibold text-navy-400">?</div>
        <div>
          <p className="text-[11px] font-semibold text-navy-700">Analytical Framework</p>
          <p className="text-[11px] text-navy-500 leading-relaxed mt-0.5">
            Scenarios are analyzed across Political, Security, Humanitarian, Economic, and Regional dimensions. Each dimension provides most likely / best case / worst case outcomes with calibrated confidence language. Policy responses are categorized by type and implementing actor.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Real mode wrapper — separates demo data from situation-specific data
// ============================================================================

export default function ScenariosPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();

  // Demo mode — render with hardcoded demo data
  if (isDemo) return <DemoScenariosPage />;

  // No situation selected
  if (showGuard || !situation) return <NoSituationState />;

  // Real mode — render scenario planner directly (uses streamText, not AiPopulate)
  return <RealScenariosPage situation={situation} />;
}
