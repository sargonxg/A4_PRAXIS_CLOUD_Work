'use client';

import { useState, useCallback, useRef } from 'react';
import { GitCompare, Play, Save, Loader2, Sparkles, X, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { DEMO_CASES } from '@/lib/constants/demo-cases';
import { parseDataStreamChunk } from '@/lib/utils/stream';

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

export default function ScenariosPage() {
  const [conflictId, setConflictId] = useState('nordalia');
  const [trigger, setTrigger] = useState('');
  const [selectedActors, setSelectedActors] = useState<string[]>([]);
  const [timeHorizon, setTimeHorizon] = useState('90 days');
  const [analysis, setAnalysis] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [compareIdx, setCompareIdx] = useState<number | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const selectedCase = DEMO_CASES.find((c) => c.id === conflictId) ?? DEMO_CASES[0];

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
      setAnalysis(`**Scenario analysis failed.** Please try again.\n\n*Trigger: ${trigger}*\n\n*Conflict: ${selectedCase.name}*\n\n*Time horizon: ${timeHorizon}*`);
    } finally {
      setIsRunning(false);
    }
  }, [trigger, isRunning, selectedCase, selectedActors, timeHorizon]);

  const saveScenario = () => {
    if (!analysis) return;
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

  const EXAMPLE_TRIGGERS = [
    'DRM withdraws from the Framework Agreement',
    'Karovia increases military support to DRM',
    'UNMN mandate lapses without renewal',
    'Ceasefire collapses after major IHL violation',
    'Mining revenues seized by DRM, triggering sanctions',
  ];

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
                  {DEMO_CASES.map((c) => (
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
                    <p className="text-[11px] text-navy-500">{selectedCase.name} · {timeHorizon}</p>
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
