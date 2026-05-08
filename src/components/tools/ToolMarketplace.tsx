'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, GitBranchPlus, GitCompare, History, Loader2, Play, RefreshCw, RotateCcw, Search, SlidersHorizontal, Square, Wrench } from 'lucide-react';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { RunDiff } from '@/components/evidence/RunDiff';
import { getOntologyForDomain } from '@/lib/ontology/registry';
import { filterMarketplaceTools, sortMarketplaceTools } from '@/lib/tools/marketplace/filter-engine';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';
import { getMarketplaceStageTarget, renderMarketplaceStagePrompt, stageTargetHref } from '@/lib/tools/marketplace/stage-targets';
import { writeStagedMarketplaceContext } from '@/lib/tools/marketplace/staged-context';
import { rankMarketplaceToolsForCase } from '@/lib/tools/marketplace/suggestions';
import type { MarketplaceToolCategory, MarketplaceCostClass } from '@/lib/tools/marketplace/types';
import { redactMarketplaceFoundationJson, redactMarketplaceFoundationMarkers } from '@/lib/tools/marketplace/ui-redaction';
import { useWorkbenchScope } from '@/components/workbench/workbench-scope';
import { cn } from '@/lib/utils/cn';
import { ToolTransparencyCard } from '@/components/tools/ToolTransparencyCard';

const CATEGORIES: Array<MarketplaceToolCategory | 'all'> = [
  'all',
  'conflict',
  'mediation',
  'governance',
  'narrative',
  'human-rights',
  'economic',
  'humanitarian',
  'legal',
  'security',
  'cross',
];
const COSTS: MarketplaceCostClass[] = ['low', 'medium', 'high'];

interface MarketplaceRunState {
  toolId: string;
  toolName: string;
  artifactId: string;
  persisted: boolean;
  persistenceReason?: string;
  prompt?: string | null;
  summary: string;
  rawText: string;
  structuredOutput?: Record<string, unknown>;
  contextDump?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  health: number;
  advisoryCount: number;
  generatedAt?: string;
  durationMs?: number;
  costClass?: string;
}

interface MarketplaceRunHistoryItem {
  id: string;
  toolId: string;
  toolRunId: string;
  prompt: string | null;
  summary: string | null;
  rawText: string | null;
  createdAt: string;
  handlerStage: string | null;
  contextHealth: number | null;
  advisoryCount: number | null;
  durationMs: number | null;
  costClass: string | null;
  providerCostUsd: number | null;
}

interface MarketplaceFullRunArtifact {
  id: string;
  toolId: string;
  toolRunId: string;
  prompt: string | null;
  rawText: string | null;
  structuredOutput: Record<string, unknown>;
  contextDump: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface DialecticaRecipe {
  id: string;
  title: string;
  mode: string;
  tokenBudget: number;
}

const DIALECTICA_RECIPE_PATTERNS: DialecticaRecipe[] = [
  { id: 'stakeholder-map', title: 'StakeholderMap', mode: 'graph_completion', tokenBudget: 8000 },
  { id: 'contradiction-scan', title: 'ContradictionScan', mode: 'insights', tokenBudget: 8000 },
  { id: 'constraint-leverage-map', title: 'ConstraintLeverageMap', mode: 'graph_completion', tokenBudget: 8000 },
  { id: 'commitment-tracker', title: 'CommitmentTracker', mode: 'graph_completion', tokenBudget: 8000 },
  { id: 'narrative-arc', title: 'NarrativeArc', mode: 'summaries', tokenBudget: 8000 },
  { id: 'ambiguity-audit', title: 'AmbiguityAudit', mode: 'insights', tokenBudget: 8000 },
  { id: 'red-team-counterclaim', title: 'RedTeamCounterclaim', mode: 'insights', tokenBudget: 8000 },
  { id: 'counterfactual-branch', title: 'CounterfactualBranch', mode: 'graph_completion', tokenBudget: 8000 },
  { id: 'evidence-gap-finder', title: 'EvidenceGapFinder', mode: 'insights', tokenBudget: 8000 },
  { id: 'policy-option-generator', title: 'PolicyOptionGenerator', mode: 'summaries', tokenBudget: 8000 },
  { id: 'risk-weighting', title: 'RiskWeighting', mode: 'graph_completion', tokenBudget: 8000 },
  { id: 'decision-memo-synth', title: 'DecisionMemoSynth', mode: 'summaries', tokenBudget: 8000 },
];

export function ToolMarketplace() {
  const router = useRouter();
  const { caseId, caseModule, activeTab } = useWorkbenchScope();
  const ontology = getOntologyForDomain(caseModule.manifest.domain);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MarketplaceToolCategory | 'all'>('all');
  const [maxCostClass, setMaxCostClass] = useState<MarketplaceCostClass>('high');
  const [runningToolId, setRunningToolId] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<MarketplaceRunState | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [runHistory, setRunHistory] = useState<MarketplaceRunHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [lastRunRequest, setLastRunRequest] = useState<string | null>(null);
  const [runningRecipeId, setRunningRecipeId] = useState<string | null>(null);
  const [recipeNote, setRecipeNote] = useState<string | null>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const runAbortController = useRef<AbortController | null>(null);
  const contextHealth =
    (caseModule.truthLayers.source.provenanceCoverage +
      caseModule.truthLayers.claim.provenanceCoverage +
      caseModule.truthLayers.evidence.provenanceCoverage +
      caseModule.truthLayers.verdict.provenanceCoverage) / 4;

  const visibleTools = useMemo(() => {
    const filtered = filterMarketplaceTools(MARKETPLACE_TOOLS, {
      ontologyId: ontology.id,
      category,
      maxCostClass,
      contextHealth,
    });
    const needle = query.trim().toLowerCase();
    const searched = needle
      ? filtered.filter((tool) => `${tool.name} ${tool.description} ${tool.id}`.toLowerCase().includes(needle))
      : filtered;
    return sortMarketplaceTools(searched);
  }, [category, contextHealth, maxCostClass, ontology.id, query]);
  const suggestions = useMemo(
    () => rankMarketplaceToolsForCase(MARKETPLACE_TOOLS, caseModule).slice(0, 3),
    [caseModule],
  );
  const analystToolkitTools = useMemo(
    () => MARKETPLACE_TOOLS.filter((tool) => tool.satCategory),
    [],
  );
  const visibleNonSatTools = useMemo(
    () => visibleTools.filter((tool) => !tool.satCategory),
    [visibleTools],
  );
  const previousComparableRun = useMemo(() => {
    if (!lastRun) return null;
    return runHistory.find((item) => item.toolId === lastRun.toolId && item.id !== lastRun.artifactId) ?? null;
  }, [lastRun, runHistory]);

  const loadRunHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const response = await fetch(`/api/tools/marketplace/run?caseId=${encodeURIComponent(caseId)}&limit=8`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to load run history');
      setRunHistory(payload.items ?? []);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Failed to load run history');
    } finally {
      setHistoryLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void loadRunHistory();
  }, [loadRunHistory]);

  function buildLastRunFromSummary(item: MarketplaceRunHistoryItem): MarketplaceRunState {
    const tool = MARKETPLACE_TOOLS.find((candidate) => candidate.id === item.toolId);
    return {
      toolId: item.toolId,
      toolName: tool?.name ?? item.toolId,
      artifactId: item.id,
      persisted: true,
      prompt: item.prompt,
      summary: redactMarketplaceFoundationMarkers(item.summary ?? `${tool?.name ?? item.toolId} completed.`),
      rawText: redactMarketplaceFoundationMarkers(item.rawText ?? ''),
      health: item.contextHealth ?? 0,
      advisoryCount: item.advisoryCount ?? 0,
      generatedAt: item.createdAt,
      durationMs: item.durationMs ?? undefined,
      costClass: item.costClass ?? undefined,
    };
  }

  async function loadHistoryItem(item: MarketplaceRunHistoryItem) {
    const fallback = buildLastRunFromSummary(item);
    setRunError(null);
    setHistoryError(null);
    setEvidenceOpen(false);
    setDiffOpen(false);
    try {
      const response = await fetch(`/api/tools/marketplace/run?caseId=${encodeURIComponent(caseId)}&artifactId=${encodeURIComponent(item.id)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Failed to load full artifact');
      const full = payload.item as MarketplaceFullRunArtifact;
      const tool = MARKETPLACE_TOOLS.find((candidate) => candidate.id === full.toolId);
      const summary = typeof full.structuredOutput?.summary === 'string'
        ? full.structuredOutput.summary
        : fallback.summary;
      const caseOutput = full.structuredOutput?.case as { contextHealth?: { score?: unknown } } | undefined;
      const advisories = Array.isArray(full.structuredOutput?.advisories) ? full.structuredOutput.advisories : [];
      const telemetry = full.metadata?.runTelemetry as Record<string, unknown> | undefined;
      setLastRun({
        toolId: full.toolId,
        toolName: tool?.name ?? full.toolId,
        artifactId: full.id,
        persisted: true,
        prompt: full.prompt,
        summary: redactMarketplaceFoundationMarkers(summary),
        rawText: redactMarketplaceFoundationMarkers(full.rawText ?? ''),
        structuredOutput: redactMarketplaceFoundationJson(full.structuredOutput) as Record<string, unknown>,
        contextDump: redactMarketplaceFoundationJson(full.contextDump) as Record<string, unknown>,
        metadata: redactMarketplaceFoundationJson(full.metadata) as Record<string, unknown>,
        health: typeof caseOutput?.contextHealth?.score === 'number' ? caseOutput.contextHealth.score : fallback.health,
        advisoryCount: advisories.length,
        generatedAt: full.createdAt,
        durationMs: typeof telemetry?.durationMs === 'number' ? telemetry.durationMs : fallback.durationMs,
        costClass: typeof telemetry?.costClass === 'string' ? telemetry.costClass : fallback.costClass,
      });
    } catch (err) {
      setLastRun(fallback);
      setHistoryError(err instanceof Error ? `Loaded summary only: ${err.message}` : 'Loaded summary only.');
    }
  }

  function stageTool(toolId: string) {
    const tool = MARKETPLACE_TOOLS.find((item) => item.id === toolId);
    if (!tool || tool.satCategory) return;
    const target = getMarketplaceStageTarget(tool);
    if (!target) {
      setRunError(`No stage target configured for ${tool.id}.`);
      return;
    }
    const prompt = renderMarketplaceStagePrompt(target, caseModule.manifest.name);

    writeStagedMarketplaceContext({
      recipeId: tool.id,
      recipeName: tool.name,
      recipeDescription: tool.description,
      heroToolId: target.heroToolId,
      heroToolName: target.heroToolName,
      chapter: target.chapter,
      caseId,
      caseName: caseModule.manifest.name,
      prompt,
      flags: target.flags,
      rationale: target.rationale,
      context: {
        activeTab,
        caseName: caseModule.manifest.name,
        domain: caseModule.manifest.domain,
        truthLayers: caseModule.truthLayers,
        ontologyRequirements: tool.ontologyRequirements,
        contextSpec: tool.contextSpec,
        sideEffects: tool.sideEffects,
        composition: tool.composition,
      },
      stagedAt: new Date().toISOString(),
    });
    router.push(stageTargetHref(caseId, target));
  }

  async function runSatTool(toolId: string) {
    const tool = MARKETPLACE_TOOLS.find((item) => item.id === toolId);
    if (!tool?.satCategory) return;
    const controller = new AbortController();

    runAbortController.current = controller;
    setRunningToolId(toolId);
    setRunError(null);
    setLastRunRequest(toolId);

    try {
      const response = await fetch('/api/tools/marketplace/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          toolId,
          caseId,
          prompt: `Run ${tool.name} for ${caseModule.manifest.name}.`,
          context: {
            activeTab,
            caseName: caseModule.manifest.name,
            domain: caseModule.manifest.domain,
            truthLayers: caseModule.truthLayers,
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Marketplace run failed');
      }
      setLastRun({
        toolId: payload.tool.id,
        toolName: payload.tool.name,
        artifactId: payload.artifact.id,
        persisted: payload.persistence.persisted,
        persistenceReason: payload.persistence.reason,
        prompt: payload.artifact.prompt,
        summary: redactMarketplaceFoundationMarkers(payload.artifact.structuredOutput?.summary ?? `${payload.tool.name} completed.`),
        rawText: redactMarketplaceFoundationMarkers(payload.artifact.rawText ?? ''),
        structuredOutput: redactMarketplaceFoundationJson(payload.artifact.structuredOutput) as Record<string, unknown>,
        contextDump: redactMarketplaceFoundationJson(payload.artifact.contextDump) as Record<string, unknown>,
        metadata: redactMarketplaceFoundationJson(payload.artifact.metadata) as Record<string, unknown>,
        health: payload.runContext.health,
        advisoryCount: payload.runContext.advisories?.length ?? 0,
        generatedAt: payload.artifact.createdAt,
        durationMs: payload.telemetry?.durationMs,
        costClass: payload.telemetry?.costClass,
      });
      setEvidenceOpen(false);
      setDiffOpen(false);
      void loadRunHistory();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setRunError('Run cancelled before completion.');
      } else {
        setRunError(err instanceof Error ? err.message : 'Marketplace run failed');
      }
    } finally {
      if (runAbortController.current === controller) runAbortController.current = null;
      setRunningToolId(null);
    }
  }

  function cancelRunningTool() {
    runAbortController.current?.abort();
  }

  async function runDialecticaRecipe(recipe: DialecticaRecipe) {
    setRunningRecipeId(recipe.id);
    setRecipeNote(`${recipe.title} is a backend pattern. Stage a recipe card below into a hero tool to run live AI.`);
    window.setTimeout(() => setRunningRecipeId(null), 250);
  }

  return (
    <section data-testid="tool-marketplace" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-navy-950">
            <Wrench className="h-5 w-5 text-gold-600" />
            <h2 className="text-lg font-semibold">Recipe library</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Patterns that frame what the AI tools should answer. Each recipe stages context for a hero tool below.
          </p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Recipes</p>
          <p className="font-mono text-2xl font-semibold text-navy-950">{visibleTools.length}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto_auto]">
        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools"
            className="min-w-0 flex-1 bg-transparent text-sm text-navy-950 outline-none placeholder:text-slate-500"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                'rounded-md px-3 py-2 text-xs font-semibold capitalize transition-colors',
                category === item ? 'bg-navy-950 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100',
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
          <SlidersHorizontal className="h-4 w-4" />
          Max cost
          <select
            value={maxCostClass}
            onChange={(event) => setMaxCostClass(event.target.value as MarketplaceCostClass)}
            className="bg-transparent text-navy-950 outline-none"
          >
            {COSTS.map((cost) => (
              <option key={cost} value={cost}>{cost}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 rounded-md border border-gold-200 bg-gold-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-800">Recommended for this case</p>
        <div className="mt-3 grid gap-2 lg:grid-cols-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.tool.id} className="rounded border border-gold-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-navy-950">{suggestion.tool.name}</p>
                <span className="font-mono text-xs font-semibold text-gold-800">{suggestion.score}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600">{suggestion.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">DIALECTICA recipes</p>
            <h3 className="mt-1 text-base font-semibold text-navy-950">Backend recipe patterns</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
              These guide-level recipes describe useful graph-grounded frames. Use the recipe cards below to stage context into live hero tools.
            </p>
          </div>
          {recipeNote ? <p className="max-w-xl text-sm font-semibold text-navy-900">{recipeNote}</p> : null}
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {DIALECTICA_RECIPE_PATTERNS.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => void runDialecticaRecipe(recipe)}
              disabled={runningRecipeId !== null}
              className="rounded-md border border-slate-200 bg-white p-3 text-left transition hover:border-navy-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-navy-950">{recipe.title}</span>
                {runningRecipeId === recipe.id ? <Loader2 className="h-4 w-4 animate-spin text-gold-700" /> : <Eye className="h-4 w-4 text-gold-700" />}
              </span>
              <span className="mt-2 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                {recipe.mode} · {recipe.tokenBudget.toLocaleString()} tokens
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-navy-200 bg-navy-950 p-4 text-white shadow-sm shadow-navy-950/10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Analyst&apos;s Toolkit</p>
            <h3 className="mt-1 text-lg font-semibold">Heuer-Pherson Structured Analytic Techniques</h3>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-blue-100/85">
              ACH, Key Assumptions Check, Red Team Analysis, and Premortem are grouped as first-class SAT actions. PRAXIS implementations are independent and keep synthesized outputs advisory until a user promotes them through review.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
            Pack 15
          </span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          {analystToolkitTools.map((tool) => (
            <article key={tool.id} className="rounded-lg border border-white/10 bg-white/8 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{tool.name}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100/55">
                    {tool.satCategory?.replace('_', ' ')}
                  </p>
                </div>
                <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                  {tool.costClass}
                </span>
              </div>
              <p className="mt-3 min-h-20 text-xs leading-5 text-blue-100/80">{tool.description}</p>
              <div className="[&_details]:border-white/10 [&_details]:bg-white/10 [&_details_summary_span]:text-blue-50 [&_details_div]:border-white/10 [&_details_p]:text-blue-100/80 [&_details_li]:text-blue-100/75">
                <ToolTransparencyCard tool={tool} />
              </div>
              {tool.satCategory === 'ach' ? (
                <Link
                  href={`/app/workbench/${encodeURIComponent(caseId)}/ach`}
                  className="mt-3 inline-flex h-8 items-center gap-1 rounded-md bg-gold-500 px-3 text-xs font-semibold text-navy-950 transition-colors hover:bg-gold-400"
                >
                  <GitBranchPlus className="h-3.5 w-3.5" />
                  Open ACH
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void runSatTool(tool.id)}
                  disabled={runningToolId !== null}
                  className="mt-3 inline-flex h-8 items-center gap-1 rounded-md bg-white px-3 text-xs font-semibold text-navy-950 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-white/40"
                >
                  {runningToolId === tool.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Run
                </button>
              )}
            </article>
          ))}
        </div>
        <p className="mt-3 text-[10px] leading-5 text-blue-100/60">
          Based on Richards J. Heuer Jr. and Randolph H. Pherson, Structured Analytic Techniques for Intelligence Analysis, with Klein 2007 for Premortem.
        </p>
      </div>

      {(lastRun || runError) && (
        <div className={cn(
          'mt-5 rounded-md border p-4',
          runError ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50',
        )}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2">
              {runError ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              )}
              <div className="min-w-0">
                <p className={cn('text-sm font-semibold', runError ? 'text-red-900' : 'text-emerald-950')}>
                  {runError ? 'Run failed' : `${lastRun?.toolName} completed`}
                </p>
                <p className={cn('mt-1 text-sm leading-6', runError ? 'text-red-800' : 'text-emerald-900')}>
                  {runError ?? lastRun?.summary}
                </p>
              </div>
            </div>
            {lastRun && (
              <div className="grid gap-2 text-right text-[10px] font-semibold uppercase tracking-wider text-emerald-900 sm:grid-cols-3">
                <span>Health {lastRun.health}/100</span>
                <span>{lastRun.advisoryCount} advisories</span>
                <span>{lastRun.durationMs != null ? `${lastRun.durationMs}ms` : lastRun.costClass ?? 'Telemetry pending'}</span>
                <span>{lastRun.persisted ? 'Persisted' : lastRun.persistenceReason ?? 'Not persisted'}</span>
              </div>
            )}
            <div className="flex gap-2">
              {runningToolId && (
                <button
                  type="button"
                  onClick={cancelRunningTool}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                >
                  <Square className="h-3.5 w-3.5" />
                  Cancel
                </button>
              )}
              {lastRun && (
                <button
                  type="button"
                  onClick={() => setEvidenceOpen(true)}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-50"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Evidence
                </button>
              )}
              {lastRun && (
                <button
                  type="button"
                  onClick={() => setDiffOpen((value) => !value)}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-900 transition-colors hover:bg-emerald-50"
                >
                  <GitCompare className="h-3.5 w-3.5" />
                  Compare
                </button>
              )}
              {runError && lastRunRequest && (
                <button
                  type="button"
                  onClick={() => void runSatTool(lastRunRequest)}
                  disabled={runningToolId !== null}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-800 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Retry
                </button>
              )}
            </div>
          </div>
          {lastRun && (
            <pre className="mt-3 max-h-40 overflow-auto rounded border border-emerald-200 bg-white p-3 text-xs leading-5 text-slate-700">
              {lastRun.rawText}
            </pre>
          )}
          {lastRun && diffOpen && (
            <RunDiff
              currentLabel={`${lastRun.toolName} current`}
              baselineLabel={previousComparableRun ? `${previousComparableRun.toolId} previous` : 'Previous run'}
              currentText={lastRun.rawText}
              baselineText={previousComparableRun?.rawText}
            />
          )}
          {lastRun && (
            <ToolChainActions
              toolId={lastRun.toolId}
              runningToolId={runningToolId}
              onRun={runSatTool}
            />
          )}
        </div>
      )}

      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <History className="h-4 w-4 text-slate-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-950">Run history</p>
              <p className="text-xs text-slate-600">Reload persisted marketplace artifacts for this case.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadRunHistory()}
            disabled={historyLoading}
            aria-label="Refresh run history"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            <RefreshCw className={cn('h-4 w-4', historyLoading && 'animate-spin')} />
          </button>
        </div>
        {historyError ? (
          <p className="mt-3 rounded border border-red-200 bg-white px-3 py-2 text-xs text-red-800">{historyError}</p>
        ) : historyLoading && runHistory.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">Loading run history...</p>
        ) : runHistory.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">No persisted marketplace artifacts for this case yet.</p>
        ) : (
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {runHistory.map((item) => {
              const tool = MARKETPLACE_TOOLS.find((candidate) => candidate.id === item.toolId);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void loadHistoryItem(item)}
                  className="rounded-md border border-slate-200 bg-white p-3 text-left transition-colors hover:border-gold-300 hover:bg-gold-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy-950">{tool?.name ?? item.toolId}</p>
                      <p className="mt-1 truncate text-xs text-slate-600">{item.summary ?? item.prompt ?? item.toolRunId}</p>
                    </div>
                    <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                      {item.handlerStage ?? 'stored'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <span>{item.contextHealth ?? 0}/100 health</span>
                    <span>{item.advisoryCount ?? 0} advisories</span>
                    <span>{item.durationMs != null ? `${item.durationMs}ms` : 'latency pending'}</span>
                    <span>{item.costClass ?? 'cost pending'}</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {visibleNonSatTools.map((tool) => (
          <article key={tool.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
            {(() => {
              const stageTarget = getMarketplaceStageTarget(tool);
              return (
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-950">{tool.name}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{tool.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">{tool.costClass}</span>
                <button
                  type="button"
                  onClick={() => stageTool(tool.id)}
                  disabled={!stageTarget}
                  title={stageTarget?.rationale ?? 'No stage target configured'}
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-navy-950 px-3 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <GitBranchPlus className="h-3.5 w-3.5" />
                  {stageTarget ? `Stage in ${stageTarget.heroToolName}` : 'Stage unavailable'}
                </button>
              </div>
            </div>
              );
            })()}
            <p className="mt-3 text-sm leading-6 text-slate-650">{tool.description}</p>
            {(() => {
              const stageTarget = getMarketplaceStageTarget(tool);
              return stageTarget ? (
                <p className="mt-2 text-[11px] italic leading-5 text-slate-600">{stageTarget.rationale}</p>
              ) : null;
            })()}
            <ToolTransparencyCard tool={tool} />
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Chip label="Runtime" value={`${Math.round(tool.estimatedRuntimeMs / 1000)}s`} />
              <Chip label="Context" value={`${Math.round(tool.minContextHealth * 100)}%`} />
              <Chip label="Mode" value={tool.streaming ? 'stream' : 'batch'} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">v{tool.version}</span>
              <span className="rounded bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">context-aware</span>
              {tool.subagentDeps.map((subagent) => (
                <span key={subagent} className="rounded bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">{subagent}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <EvidenceDrawer
        open={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        caseId={caseId}
        artifact={lastRun ? {
          toolName: lastRun.toolName,
          artifactId: lastRun.artifactId,
          prompt: lastRun.prompt,
          summary: lastRun.summary,
          rawText: lastRun.rawText,
          structuredOutput: lastRun.structuredOutput,
          contextDump: lastRun.contextDump,
          metadata: lastRun.metadata,
          generatedAt: lastRun.generatedAt,
        } : null}
      />
    </section>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white px-2 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-semibold text-navy-950">{value}</p>
    </div>
  );
}

function ToolChainActions({
  toolId,
  runningToolId,
  onRun,
}: {
  toolId: string;
  runningToolId: string | null;
  onRun: (toolId: string) => void;
}) {
  const tool = MARKETPLACE_TOOLS.find((item) => item.id === toolId);
  const chainTargets = tool?.composition.canChainInto
    .map((targetId) => MARKETPLACE_TOOLS.find((item) => item.id === targetId))
    .filter((item): item is (typeof MARKETPLACE_TOOLS)[number] => Boolean(item))
    .filter((item) => Boolean(item.satCategory))
    .slice(0, 3) ?? [];

  if (chainTargets.length === 0) return null;

  return (
    <div className="mt-3 rounded border border-emerald-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-900">Chain into</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {chainTargets.map((target) => (
          <button
            key={target.id}
            type="button"
            onClick={() => onRun(target.id)}
            disabled={runningToolId !== null}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-950 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {runningToolId === target.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {target.name}
          </button>
        ))}
      </div>
    </div>
  );
}
