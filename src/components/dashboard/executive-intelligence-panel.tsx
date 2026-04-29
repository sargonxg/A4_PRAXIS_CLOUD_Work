'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Download,
  Loader2,
  Network,
  Sparkles,
} from 'lucide-react';
import { usePersistedToolData } from '@/hooks/use-persisted-tool-data';
import type { SituationIntelligence } from '@/lib/ai/schemas/situation-intelligence';
import type { Situation } from '@/types/situation';

type IntelligenceResult = SituationIntelligence & {
  generatedAt: string;
  toolId: string;
  persistence?: { toolDataSaved?: boolean };
};

const TOOL_ID = 'situation-intelligence';

function isIntelligenceResult(value: unknown): value is IntelligenceResult {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'executivePanel' in value &&
    'strategicInsight' in value &&
    'liveGraph' in value,
  );
}

function buildExportPayload(situation: Situation, result: IntelligenceResult) {
  return {
    exportedAt: new Date().toISOString(),
    situation: {
      id: situation.id,
      name: situation.name,
      region: situation.region,
      actors: situation.actors,
      status: situation.status,
    },
    analysis: result,
  };
}

function saveJsonExport(situation: Situation, result: IntelligenceResult) {
  const payload = buildExportPayload(situation, result);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${situation.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-praxis-intelligence.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExecutiveIntelligencePanel({ situation }: { situation: Situation }) {
  const persisted = usePersistedToolData(TOOL_ID, situation.id);
  const [result, setResult] = useState<IntelligenceResult | null>(() =>
    isIntelligenceResult(persisted.data) ? persisted.data : null,
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeResult = result ?? (isIntelligenceResult(persisted.data) ? persisted.data : null);

  const selectedNode = useMemo(() => {
    if (!activeResult?.liveGraph.nodes.length) return null;
    return activeResult.liveGraph.nodes.find((node) => node.id === selectedNodeId)
      ?? activeResult.liveGraph.nodes[0];
  }, [activeResult, selectedNodeId]);

  const inputWeak = !situation.description || situation.description.length < 80 || situation.actors.length < 2;

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/situation-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      if (!isIntelligenceResult(data)) {
        throw new Error('PRAXIS returned an unexpected intelligence shape.');
      }
      setResult(data);
      setSelectedNodeId(data.liveGraph.nodes[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Situation intelligence failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <span id="executive-intelligence" className="block -translate-y-24" aria-hidden="true" />
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-gold-600" />
            <h2 className="text-sm font-semibold text-navy-900">Executive intelligence</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-navy-600">
            Structured diagnosis, scenarios, graph primitives, provenance, and confidence generated from the active situation.
          </p>
          {persisted.generatedAt ? (
            <p className="mt-1 text-[11px] text-navy-400">Last saved {new Date(persisted.generatedAt).toLocaleString()}</p>
          ) : activeResult?.persistence?.toolDataSaved ? (
            <p className="mt-1 text-[11px] text-navy-400">Saved to this situation. Reopen the situation to restore it.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeResult ? (
            <button
              type="button"
              onClick={() => saveJsonExport(situation, activeResult)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </button>
          ) : null}
          <button
            type="button"
            onClick={generate}
            disabled={loading || persisted.isLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-gold-500/40 bg-gold-500/10 px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-500/20 disabled:opacity-60"
          >
            {loading || persisted.isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {activeResult ? 'Refresh intelligence' : 'Generate intelligence'}
          </button>
        </div>
      </div>

      {inputWeak && !activeResult ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
          Add a fuller description and at least two actors for higher-confidence analysis. PRAXIS will refuse inputs that are too thin to support a trustworthy output.
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
          <span>{error}</span>
        </div>
      ) : null}

      {!activeResult ? (
        <div className="mt-4 grid gap-3 text-xs text-navy-600 md:grid-cols-4">
          {['Diagnosis', 'Scenario paths', 'Evidence graph', 'Exportable brief'].map((label) => (
            <div key={label} className="rounded-md border border-slate-200 p-3">
              <CheckCircle2 className="mb-2 h-4 w-4 text-slate-400" />
              <p className="font-medium text-navy-800">{label}</p>
              <p className="mt-1">Generated only after a real AI call against this situation.</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-[11px] uppercase tracking-wider text-navy-500">Diagnosis</p>
              <p className="mt-1 text-base font-semibold leading-snug text-navy-950">{activeResult.executivePanel.diagnosis}</p>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {activeResult.executivePanel.keyInsights.map((insight) => (
                  <p key={insight} className="rounded-md bg-slate-50 p-2 text-xs leading-relaxed text-navy-700">{insight}</p>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 p-3 text-xs">
              <p className="font-semibold text-navy-900">Risk {activeResult.riskScoring.score}/100</p>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-gold-500"
                  style={{ width: `${activeResult.riskScoring.score}%` }}
                />
              </div>
              <p className="mt-2 leading-relaxed text-navy-600">{activeResult.riskScoring.explanation}</p>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-sm font-semibold text-navy-900">Strategic insight</p>
              <p className="mt-1 text-sm leading-relaxed text-navy-800">{activeResult.strategicInsight.insight}</p>
              <p className="mt-2 text-xs text-navy-500">
                Actors: {activeResult.strategicInsight.actors.join(', ')} · Constraint: {activeResult.strategicInsight.constraint}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-sm font-semibold text-navy-900">Best action</p>
              <p className="mt-1 text-sm leading-relaxed text-navy-800">{activeResult.executivePanel.bestAction}</p>
              <p className="mt-2 text-xs font-medium text-red-700">Biggest risk: {activeResult.executivePanel.biggestRisk}</p>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            <Panel title="Causal timeline">
              <div className="flex flex-col gap-2">
                {activeResult.causalTimeline.map((item) => (
                  <div key={`${item.date}-${item.event}`} className="border-l-2 border-gold-400 pl-3">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-navy-500">{item.date}</p>
                    <p className="text-xs font-semibold text-navy-900">{item.event}</p>
                    <p className="mt-1 text-xs text-navy-600">{item.cause} → {item.effect}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Scenarios">
              <div className="flex flex-col gap-2">
                {activeResult.scenarios.map((scenario) => (
                  <div key={scenario.type} className="rounded-md bg-slate-50 p-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <p className="font-semibold capitalize text-navy-900">{scenario.type}</p>
                      <p className="text-navy-500">{scenario.probabilityEstimate}%</p>
                    </div>
                    <p className="mt-1 text-navy-700">{scenario.summary}</p>
                    <p className="mt-1 text-navy-500">Signals: {scenario.earlyWarningSignals.join('; ')}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Actions">
              <div className="flex flex-col gap-2">
                {activeResult.actions.map((action) => (
                  <div key={action.action} className="rounded-md border border-slate-100 p-2 text-xs">
                    <p className="font-semibold text-navy-900">{action.action}</p>
                    <p className="mt-1 text-navy-600">{action.expectedOutcome}</p>
                    <p className="mt-1 uppercase tracking-wider text-gold-700">{action.urgency}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <Panel title="Actor dossiers">
              <div className="grid gap-2 md:grid-cols-2">
                {activeResult.actorDossiers.map((dossier) => (
                  <div key={dossier.actor} className="rounded-md border border-slate-100 p-2 text-xs">
                    <p className="font-semibold text-navy-900">{dossier.actor}</p>
                    <p className="mt-1 text-navy-600">Goals: {dossier.goals.join('; ')}</p>
                    <p className="mt-1 text-navy-600">Leverage: {dossier.leverage.join('; ')}</p>
                    <p className="mt-1 text-navy-600">Vulnerabilities: {dossier.vulnerabilities.join('; ')}</p>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Live graph">
              <div className="flex items-center gap-2 text-xs text-navy-500">
                <Network className="h-3.5 w-3.5" />
                <span>{activeResult.liveGraph.nodes.length} nodes · {activeResult.liveGraph.edges.length} explicit edges</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {activeResult.liveGraph.nodes.map((node) => (
                  <button
                    type="button"
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
                      selectedNode?.id === node.id
                        ? 'border-gold-500 bg-gold-500/10 text-gold-700'
                        : 'border-slate-200 text-navy-600 hover:bg-slate-50'
                    }`}
                  >
                    {node.type}: {node.label}
                  </button>
                ))}
              </div>
              {selectedNode ? (
                <div className="mt-3 rounded-md bg-slate-50 p-2 text-xs">
                  <p className="font-semibold text-navy-900">{selectedNode.label}</p>
                  <p className="mt-1 text-navy-600">{selectedNode.summary}</p>
                  <p className="mt-1 text-navy-500">Evidence: {selectedNode.evidence}</p>
                </div>
              ) : null}
              <div className="mt-2 max-h-32 overflow-auto text-[11px] text-navy-500">
                {activeResult.liveGraph.edges.map((edge) => (
                  <p key={edge.id}>{edge.source} → {edge.target}: {edge.type}</p>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Provenance">
              <p className="text-xs leading-relaxed text-navy-600">{activeResult.provenance.derivationNote}</p>
              <div className="mt-2 flex flex-col gap-1.5">
                {activeResult.provenance.sourceFragments.map((fragment) => (
                  <p key={fragment.id} className="rounded-md bg-slate-50 p-2 text-xs text-navy-600">
                    <span className="font-medium text-navy-900">{fragment.label}:</span> {fragment.excerpt}
                  </p>
                ))}
              </div>
            </Panel>
            <Panel title="Confidence">
              <p className="text-sm font-semibold capitalize text-navy-900">{activeResult.confidence.level}</p>
              <p className="mt-1 text-xs leading-relaxed text-navy-600">{activeResult.confidence.note}</p>
              {activeResult.confidence.inputWeaknesses.length ? (
                <ul className="mt-2 list-disc pl-4 text-xs text-navy-600">
                  {activeResult.confidence.inputWeaknesses.map((weakness) => <li key={weakness}>{weakness}</li>)}
                </ul>
              ) : null}
            </Panel>
          </div>
        </div>
      )}
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <h3 className="mb-2 text-sm font-semibold text-navy-900">{title}</h3>
      {children}
    </div>
  );
}
