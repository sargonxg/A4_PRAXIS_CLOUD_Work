'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { usePersistedToolData } from '@/hooks/use-persisted-tool-data';
import { useToolData } from '@/hooks/useToolData';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import type { Situation } from '@/types/situation';

import { useState, useCallback, useRef } from 'react';
import {
  GitCompare,
  Play,
  Save,
  Loader2,
  Sparkles,
  X,
  ChevronDown,
  Plus,
  Trash2,
  Wind,
  SlidersHorizontal,
  ExternalLink,
  Info,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  BarChart2,
  GitBranch,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { EcosystemBadge } from '@/components/shared/ecosystem-badge';
import { useConflictList } from '@/hooks/use-conflict-data';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import {
  SCENARIO_PRESETS,
  DEFAULT_PARAMS,
  PARAM_METADATA,
  type ScenarioParams,
  type ScenarioPreset,
} from '@/lib/constants/scenario-configs';

import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
// ─── Constants ───────────────────────────────────────────────────────────────

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

const EXAMPLE_TRIGGERS = [
  'DRM withdraws from the Framework Agreement',
  'Karovia increases military support to DRM',
  'UNMN mandate lapses without renewal',
  'Ceasefire collapses after major IHL violation',
  'Mining revenues seized by DRM, triggering sanctions',
];

type AnalysisTab = 'narrative' | 'probability-tree' | 'sensitivity';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SavedScenario {
  id: string;
  title: string;
  trigger: string;
  conflictContext: string;
  timeHorizon: string;
  analysis: string;
  savedAt: Date;
}

// ─── Helper components ───────────────────────────────────────────────────────

function RiskDirectionIcon({ direction }: { direction: ScenarioPreset['riskDirection'] }) {
  if (direction === 'up')
    return <TrendingUp className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  if (direction === 'down')
    return <TrendingDown className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
  return <Minus className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
}

function ParamSlider({
  paramKey,
  value,
  onChange,
}: {
  paramKey: keyof ScenarioParams;
  value: number;
  onChange: (v: number) => void;
}) {
  const meta = PARAM_METADATA[paramKey];
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-navy-400 truncate">
            {meta.label}
          </span>
          <div className="relative flex-shrink-0">
            <button
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
              className="flex items-center justify-center text-navy-300 hover:text-navy-500 transition-colors"
              aria-label={`Info: ${meta.label}`}
            >
              <Info className="h-3 w-3" />
            </button>
            {tooltipVisible && (
              <div className="absolute left-5 top-0 z-50 w-56 rounded-lg border border-[var(--color-app-border)] bg-white p-2.5 shadow-lg">
                <p className="text-[10px] text-navy-600 leading-relaxed">{meta.tooltip}</p>
              </div>
            )}
          </div>
        </div>
        <span className="text-[11px] font-bold text-navy-700 tabular-nums flex-shrink-0">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-diplomatic-blue h-1.5 cursor-pointer"
      />
      <div className="flex justify-between text-[9px] text-navy-300">
        <span>{meta.lowLabel}</span>
        <span>{meta.highLabel}</span>
      </div>
    </div>
  );
}

// ─── Probability Tree (static — reads from preset outcomes) ──────────────────

function ProbabilityTree({ preset }: { preset: ScenarioPreset | null }) {
  if (!preset) {
    return (
      <div className="flex h-48 flex-col items-center justify-center text-center">
        <GitBranch className="h-8 w-8 text-navy-300 mb-2" />
        <p className="text-sm text-navy-500">Select a scenario preset to view the probability tree</p>
      </div>
    );
  }

  const branches = [
    {
      key: 'best' as const,
      label: 'Best Case',
      lineColor: '#10B981',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      badgeBg: 'bg-emerald-100',
    },
    {
      key: 'base' as const,
      label: 'Base Case',
      lineColor: '#F59E0B',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      badgeBg: 'bg-amber-100',
    },
    {
      key: 'worst' as const,
      label: 'Worst Case',
      lineColor: '#EF4444',
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      badgeBg: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2 text-[11px] font-semibold text-navy-800">
          {preset.name}
        </div>
        <div className="flex items-center gap-1 text-navy-300">
          <ChevronRight className="h-4 w-4" />
          <span className="text-[10px]">Scenario outcomes</span>
        </div>
      </div>

      <div className="space-y-3">
        {branches.map(({ key, label, textColor, bgColor, borderColor, badgeBg, lineColor }) => {
          const outcome = preset.outcomes[key];
          return (
            <div
              key={key}
              className={cn('rounded-lg border p-3', bgColor, borderColor)}
              style={{ borderLeftWidth: 3, borderLeftColor: lineColor }}
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <span className={cn('text-[11px] font-semibold uppercase tracking-wide', textColor)}>
                  {label}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', badgeBg, textColor)}>
                    {outcome.probability}%
                  </span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', badgeBg, textColor)}>
                    {outcome.riskDelta > 0 ? '+' : ''}{outcome.riskDelta} risk
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-navy-700 leading-relaxed">{outcome.summary}</p>
              {/* Probability bar */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/60">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${outcome.probability}%`, backgroundColor: lineColor }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-navy-400 pt-1">
        Probabilities sum to 100%. Outcome probabilities and risk deltas are preset-level estimates based on historical analogues.
      </p>
    </div>
  );
}

// ─── Sensitivity Analysis (client-side tornado chart) ────────────────────────

function computeCompositeRisk(params: ScenarioParams): number {
  // Simple composite: average of inverted-good and direct-bad params
  const securityRisk = 100 - params.ceasefireCompliance;
  const interventionRisk = params.externalIntervention;
  const sanctionsStress = params.economicPressure;
  const accessRisk = 100 - params.humanitarianAccess;
  const infoRisk = 100 - params.mediaEnvironment;
  const stabilityRisk = 100 - params.domesticPoliticalStability;
  const contagionRisk = params.regionalContagionRisk;
  const diplomacyRisk = 100 - params.diplomaticEngagement;

  return (
    (securityRisk * 0.20 +
      interventionRisk * 0.15 +
      sanctionsStress * 0.10 +
      accessRisk * 0.12 +
      infoRisk * 0.08 +
      stabilityRisk * 0.15 +
      contagionRisk * 0.10 +
      diplomacyRisk * 0.10)
  );
}

function SensitivityAnalysis({ params }: { params: ScenarioParams }) {
  const DELTA = 20;
  const paramKeys = Object.keys(params) as Array<keyof ScenarioParams>;

  const baseRisk = computeCompositeRisk(params);

  const sensitivities = paramKeys.map((key) => {
    const upParams = { ...params, [key]: Math.min(100, params[key] + DELTA) };
    const downParams = { ...params, [key]: Math.max(0, params[key] - DELTA) };
    const upRisk = computeCompositeRisk(upParams);
    const downRisk = computeCompositeRisk(downParams);
    const impact = Math.abs(upRisk - downRisk);
    return { key, impact, upRisk, downRisk, upDelta: upRisk - baseRisk, downDelta: downRisk - baseRisk };
  });

  // Sort by impact descending
  sensitivities.sort((a, b) => b.impact - a.impact);
  const maxImpact = sensitivities[0]?.impact ?? 1;

  return (
    <div className="space-y-4 py-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-navy-400 mb-1">
          Composite Risk Score
        </p>
        <p className="text-2xl font-bold text-navy-900">{baseRisk.toFixed(1)}<span className="text-sm font-normal text-navy-400">/100</span></p>
        <p className="text-[10px] text-navy-400 mt-0.5">
          Tornado chart shows ±20-point sensitivity for each parameter
        </p>
      </div>

      <div className="space-y-2">
        {sensitivities.map(({ key, impact, upDelta, downDelta }) => {
          const meta = PARAM_METADATA[key];
          const barWidth = (impact / maxImpact) * 100;
          const isHighSensitivity = impact > maxImpact * 0.6;
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-navy-600 truncate max-w-[55%]">
                  {meta.label}
                </span>
                <div className="flex items-center gap-2 text-[9px] text-navy-400">
                  <span className="text-emerald-600">
                    {downDelta > 0 ? '+' : ''}{downDelta.toFixed(1)}
                  </span>
                  <span>/</span>
                  <span className="text-red-600">
                    {upDelta > 0 ? '+' : ''}{upDelta.toFixed(1)}
                  </span>
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 font-semibold',
                      isHighSensitivity
                        ? 'bg-red-100 text-red-700'
                        : 'bg-navy-100 text-navy-500'
                    )}
                  >
                    ±{impact.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="relative h-2 w-full rounded-full bg-navy-100 overflow-hidden">
                <div
                  className={cn(
                    'absolute top-0 h-full rounded-full transition-all duration-500',
                    isHighSensitivity ? 'bg-red-400' : 'bg-diplomatic-blue/60'
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-navy-400 border-t border-[var(--color-app-border)] pt-2">
        Higher sensitivity bars indicate parameters with greater leverage over the composite risk score. Prioritize these in diplomatic and policy interventions.
      </p>
    </div>
  );
}

// ─── Theory Grounding Panel ───────────────────────────────────────────────────

function TheoryGroundingPanel({
  params,
  isOpen,
  onToggle,
}: {
  params: ScenarioParams;
  isOpen: boolean;
  onToggle: () => void;
}) {
  // Estimate Glasl stage from params
  const avgStress =
    (100 - params.ceasefireCompliance +
      params.externalIntervention * 0.5 +
      (100 - params.humanitarianAccess) * 0.7 +
      params.regionalContagionRisk * 0.4 +
      (100 - params.domesticPoliticalStability) * 0.6) /
    5;
  const glaslStage = Math.min(9, Math.max(1, Math.round((avgStage(avgStress) * 9) / 100)));

  // Ripeness indicator
  const isRipe =
    params.diplomaticEngagement > 60 &&
    params.ceasefireCompliance > 40 &&
    params.ceasefireCompliance < 80;

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-100">
            <BookOpen className="h-4 w-4 text-navy-500" />
          </div>
          <span className="text-sm font-semibold text-navy-800">Theory Grounding</span>
          <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-medium text-navy-500">
            3 frameworks
          </span>
        </div>
        <ChevronDown
          className={cn('h-4 w-4 text-navy-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="border-t border-[var(--color-app-border)] px-5 pb-5 pt-4 space-y-4">
          {/* Glasl */}
          <div className="rounded-lg border border-[var(--color-app-border)] p-3.5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-[11px] font-semibold text-navy-800">Glasl 9-Stage Escalation Model</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 flex-shrink-0">
                Stage {glaslStage}
              </span>
            </div>
            <p className="text-[11px] text-navy-600 leading-relaxed">
              This scenario uses Friedrich Glasl&rsquo;s 9-stage escalation model (Glasl 1997) to map parameter
              changes to conflict intensity stages. Current parameter configuration maps to approximately{' '}
              <strong>Stage {glaslStage}</strong>
              {glaslStage <= 3
                ? ' — Win/Win zone: parties still believe in negotiated outcomes'
                : glaslStage <= 6
                ? ' — Win/Lose zone: zero-sum logic dominates, third-party mediation essential'
                : ' — Lose/Lose zone: parties accept own losses to damage the other, escalation management critical'}.
            </p>
          </div>

          {/* Zartman */}
          <div className="rounded-lg border border-[var(--color-app-border)] p-3.5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-[11px] font-semibold text-navy-800">Zartman Ripeness Theory</p>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0',
                  isRipe
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-navy-100 text-navy-500'
                )}
              >
                {isRipe ? 'Potential MHS' : 'Not ripe'}
              </span>
            </div>
            <p className="text-[11px] text-navy-600 leading-relaxed">
              William Zartman&rsquo;s Ripeness Theory (1989) identifies Mutually Hurting Stalemates (MHS) as
              optimal entry points for mediation.{' '}
              {isRipe
                ? 'High diplomatic engagement and moderate ceasefire compliance suggests a potential ripeness window — mediation entry should be prioritized.'
                : 'Current parameters do not indicate a ripe moment. Diplomatic engagement or ceasefire stability must improve before mediation entry is viable.'}
            </p>
          </div>

          {/* Stedman */}
          <div className="rounded-lg border border-[var(--color-app-border)] p-3.5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <p className="text-[11px] font-semibold text-navy-800">Stedman Spoiler Theory</p>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 flex-shrink-0">
                Spoiler risk: {params.regionalContagionRisk > 60 ? 'High' : params.regionalContagionRisk > 35 ? 'Medium' : 'Low'}
              </span>
            </div>
            <p className="text-[11px] text-navy-600 leading-relaxed">
              Stephen Stedman&rsquo;s spoiler theory (1997) distinguishes total, limited, and greedy spoilers.
              Regional contagion risk ({params.regionalContagionRisk}/100) and external intervention (
              {params.externalIntervention}/100) parameters proxy spoiler capacity and reach. High values
              indicate elevated spoiler threat requiring active management strategies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to convert 0-100 avg stress to 1-9 Glasl stage (S-curve approximation)
function avgStage(stress: number): number {
  // Mild sigmoid-like: low stress stays low, high stress pushes to upper stages
  return Math.pow(stress / 100, 0.7) * 100;
}

// ─── Shared: Parameter Panel ─────────────────────────────────────────────────

function ParameterPanel({
  params,
  onParamChange,
  onReset,
  onSyncFromSituation,
}: {
  params: ScenarioParams;
  onParamChange: (key: keyof ScenarioParams, value: number) => void;
  onReset: () => void;
  onSyncFromSituation?: () => void;
}) {
  const paramKeys = Object.keys(DEFAULT_PARAMS) as Array<keyof ScenarioParams>;

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-amber-600" />
          <span className="text-[11px] font-semibold text-navy-800">Scenario Parameters</span>
        </div>
        <div className="flex items-center gap-1.5">
          {onSyncFromSituation && (
            <button
              onClick={onSyncFromSituation}
              className="flex items-center gap-1 rounded-md border border-[var(--color-app-border)] px-2 py-1 text-[10px] font-medium text-navy-500 hover:text-navy-700 transition-colors"
              title="Approximate params from situation data"
            >
              <Sparkles className="h-3 w-3" />
              Sync from Situation
            </button>
          )}
          <button
            onClick={onReset}
            className="flex items-center gap-1 rounded-md border border-[var(--color-app-border)] px-2 py-1 text-[10px] font-medium text-navy-500 hover:text-navy-700 transition-colors"
            title="Reset to defaults"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {paramKeys.map((key) => (
          <ParamSlider
            key={key}
            paramKey={key}
            value={params[key]}
            onChange={(v) => onParamChange(key, v)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Shared: Preset Cards Grid ────────────────────────────────────────────────

function PresetCardsGrid({
  activePreset,
  onSelectPreset,
  isOpen,
  onToggle,
}: {
  activePreset: string | null;
  onSelectPreset: (preset: ScenarioPreset) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left border-b border-[var(--color-app-border)]"
      >
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-diplomatic-blue/70" />
          <span className="text-[11px] font-semibold text-navy-800">Scenario Templates</span>
          <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-medium text-navy-500">
            {SCENARIO_PRESETS.length}
          </span>
        </div>
        <ChevronDown
          className={cn('h-4 w-4 text-navy-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="grid grid-cols-2 gap-2 p-3">
          {SCENARIO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={cn(
                'rounded-lg border p-2.5 text-left transition-all',
                activePreset === preset.id
                  ? 'border-diplomatic-blue/40 bg-diplomatic-blue/5 ring-1 ring-diplomatic-blue/20'
                  : 'border-[var(--color-app-border)] hover:bg-[var(--color-app-surface-alt)]'
              )}
            >
              <div className="flex items-center justify-between mb-1 gap-1">
                <p className="text-[10px] font-semibold text-navy-800 leading-tight truncate">
                  {preset.name}
                </p>
                <RiskDirectionIcon direction={preset.riskDirection} />
              </div>
              <p className="text-[9px] text-navy-500 leading-snug line-clamp-2">
                {preset.description}
              </p>
              <div className="mt-1.5 flex items-center gap-1">
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                    preset.riskDirection === 'up'
                      ? 'bg-red-100 text-red-600'
                      : preset.riskDirection === 'down'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-amber-100 text-amber-600'
                  )}
                >
                  ~{preset.probability}% likely
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared: Analysis Tabs ────────────────────────────────────────────────────

function AnalysisTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: AnalysisTab;
  onTabChange: (tab: AnalysisTab) => void;
}) {
  const tabs: { id: AnalysisTab; label: string; icon: React.ReactNode }[] = [
    { id: 'narrative', label: 'Narrative Analysis', icon: <Sparkles className="h-3.5 w-3.5" /> },
    { id: 'probability-tree', label: 'Probability Tree', icon: <GitBranch className="h-3.5 w-3.5" /> },
    { id: 'sensitivity', label: 'Sensitivity Analysis', icon: <BarChart2 className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="flex gap-1 border-b border-[var(--color-app-border)] px-5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 border-b-2 px-3 py-3 text-[11px] font-semibold transition-colors',
            activeTab === tab.id
              ? 'border-diplomatic-blue text-diplomatic-blue'
              : 'border-transparent text-navy-400 hover:text-navy-600'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// DemoScenariosPage
// ============================================================================

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

  // Params & presets
  const [params, setParams] = useState<ScenarioParams>({ ...DEFAULT_PARAMS });
  const [activePreset, setActivePreset] = useState<string | null>(SCENARIO_PRESETS[0].id);
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [theoryOpen, setTheoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('narrative');

  const demoCases = cases ?? [];
  const selectedCase = demoCases.find((c) => c.id === conflictId) ?? demoCases[0];
  const activePresetData = SCENARIO_PRESETS.find((p) => p.id === activePreset) ?? null;

  const handleParamChange = (key: keyof ScenarioParams, value: number) => {
    const next = { ...params, [key]: value };
    setParams(next);
    // Check if current params exactly match any preset
    const match = SCENARIO_PRESETS.find((p) =>
      (Object.keys(p.params) as Array<keyof ScenarioParams>).every(
        (k) => p.params[k] === next[k]
      )
    );
    setActivePreset(match?.id ?? null);
  };

  const applyPreset = (preset: ScenarioPreset) => {
    setParams({ ...preset.params });
    setActivePreset(preset.id);
  };

  const toggleActor = (actor: string) => {
    setSelectedActors((prev) =>
      prev.includes(actor) ? prev.filter((a) => a !== actor) : [...prev, actor]
    );
  };

  const runScenario = useCallback(async () => {
    if (!trigger.trim() || isRunning || !selectedCase) return;
    setIsRunning(true);
    setAnalysis('');
    setActiveTab('narrative');
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
          params,
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
      setAnalysis(
        `**Scenario analysis failed.** Please try again.\n\n*Trigger: ${trigger}*\n\n*Conflict: ${selectedCase?.name}*\n\n*Time horizon: ${timeHorizon}*`
      );
    } finally {
      setIsRunning(false);
    }
  }, [trigger, isRunning, selectedCase, selectedActors, timeHorizon, params]);

  const saveScenario = () => {
    if (!analysis || !selectedCase) return;
    const scenario: SavedScenario = {
      id: Date.now().toString(),
      title: trigger.slice(0, 60) + (trigger.length > 60 ? '\u2026' : ''),
      trigger,
      conflictContext: selectedCase.name,
      timeHorizon,
      analysis,
      savedAt: new Date(),
    };
    setSavedScenarios((prev) => [scenario, ...prev]);
  };

  if (casesLoading) {
    return (
      <div className="space-y-6">
      <RegistryToolInfo toolId="scenarios" />
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-steel/8">
          <GitCompare className="h-5 w-5 text-steel" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Scenario Planner</h1>
          <p className="text-sm text-navy-500">
            Model &ldquo;what if&rdquo; scenarios across political, security, humanitarian, and economic
            dimensions using Gemini 2.5 Pro.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Setup panel */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5 space-y-5">
            {/* Base conflict */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Base Conflict
              </label>
              <div className="relative">
                <select
                  value={conflictId}
                  onChange={(e) => setConflictId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2.5 text-sm text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none focus:ring-2 focus:ring-diplomatic-blue/10"
                >
                  {demoCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
              </div>
              {selectedCase && (
                <p className="mt-1.5 text-[11px] text-navy-500">
                  {selectedCase.description.slice(0, 100)}&hellip;
                </p>
              )}
            </div>

            {/* Scenario trigger */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Scenario Trigger
              </label>
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
                    {ex.slice(0, 35)}&hellip;
                  </button>
                ))}
              </div>
            </div>

            {/* Involved actors */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Involved Actors
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(conflictId === 'nordalia'
                  ? NORDALIA_ACTORS
                  : ['Primary state', 'Opposition', 'International mediator', 'Regional power']
                ).map((actor) => (
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

            {/* Time horizon */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Time Horizon
              </label>
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
              {isRunning ? 'Running Scenario\u2026' : 'Run Scenario Analysis'}
            </button>
          </div>

          {/* 8-slider parameter panel */}
          <ParameterPanel
            params={params}
            onParamChange={handleParamChange}
            onReset={() => { setParams({ ...DEFAULT_PARAMS }); setActivePreset(null); }}
          />

          {/* Preset cards */}
          <PresetCardsGrid
            activePreset={activePreset}
            onSelectPreset={applyPreset}
            isOpen={presetsOpen}
            onToggle={() => setPresetsOpen((v) => !v)}
          />

          {/* Saved scenarios */}
          {savedScenarios.length > 0 && (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Saved Scenarios ({savedScenarios.length})
              </p>
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
                      <p className="text-[10px] text-navy-400">
                        {s.conflictContext} &middot; {s.timeHorizon}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSavedScenarios((prev) => prev.filter((_, i) => i !== idx));
                        if (compareIdx === idx) setCompareIdx(null);
                      }}
                      className="text-navy-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wind Tunnel CTA */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <div className="flex items-start gap-2">
              <Wind className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-navy-800">Run in Wind Tunnel</p>
                <p className="mt-0.5 text-[10px] text-navy-500 leading-snug">
                  For psychographic impact analysis across 27 population tribes, run this scenario in Wind
                  Tunnel.
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

        {/* Right: analysis + tabs */}
        <div className="space-y-4" ref={analysisRef}>
          {!analysis && !isRunning ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-app-border)] bg-white p-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-diplomatic-blue/8">
                <GitCompare className="h-6 w-6 text-diplomatic-blue" />
              </div>
              <p className="text-base font-semibold text-navy-800">Configure Your Scenario</p>
              <p className="mt-2 text-sm text-navy-500 max-w-xs">
                Select a conflict, define a trigger event, and choose a time horizon. Gemini will analyze
                consequences across 4 temporal phases.
              </p>
              <div className="mt-6 space-y-2 text-left w-full max-w-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 text-center mb-3">
                  Example Triggers
                </p>
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
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
              {/* Analysis header */}
              <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10">
                    <Sparkles className="h-4 w-4 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">Scenario Analysis</p>
                    <p className="text-[11px] text-navy-500">
                      {selectedCase?.name} &middot; {timeHorizon}
                    </p>
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 mb-1">
                  Trigger Event
                </p>
                <p className="text-sm text-navy-800 italic">&ldquo;{trigger}&rdquo;</p>
              </div>

              {/* Methodology tabs */}
              <AnalysisTabs activeTab={activeTab} onTabChange={setActiveTab} />

              {/* Tab content */}
              <div className="px-5 py-5">
                {activeTab === 'narrative' && (
                  <>
                    {isRunning && !analysis && (
                      <div className="flex items-center gap-2 text-sm text-navy-400">
                        <Loader2 className="h-4 w-4 animate-spin text-diplomatic-blue" />
                        Analyzing scenario across temporal phases&hellip;
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
                  </>
                )}

                {activeTab === 'probability-tree' && (
                  <ProbabilityTree preset={activePresetData} />
                )}

                {activeTab === 'sensitivity' && (
                  <SensitivityAnalysis params={params} />
                )}
              </div>

              {/* Comparison view */}
              {compareIdx !== null && savedScenarios[compareIdx] && (
                <div className="border-t border-[var(--color-app-border)] px-5 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-navy-900">
                      Comparing with:{' '}
                      <span className="text-diplomatic-blue">{savedScenarios[compareIdx].title}</span>
                    </p>
                    <button
                      onClick={() => setCompareIdx(null)}
                      className="text-navy-400 hover:text-navy-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 mb-2">
                      Trigger: {savedScenarios[compareIdx].trigger}
                    </p>
                    <div className="prose prose-sm max-w-none text-navy-700 text-xs">
                      <MarkdownRenderer
                        content={savedScenarios[compareIdx].analysis.slice(0, 600) + '\u2026'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Theory Grounding Panel */}
      <TheoryGroundingPanel
        params={params}
        isOpen={theoryOpen}
        onToggle={() => setTheoryOpen((v) => !v)}
      />

      {/* Methodology note */}
      <div className="flex items-start gap-3 rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-navy-200 text-[10px] font-semibold text-navy-400">
          ?
        </div>
        <div>
          <p className="text-[11px] font-semibold text-navy-700">Analytical Framework</p>
          <p className="text-[11px] text-navy-500 leading-relaxed mt-0.5">
            Scenarios are analyzed across four temporal phases (Initial Trigger, Short-term, Medium-term,
            Long-term) with Key Pivot Points and Policy Recommendations. Each section uses calibrated confidence
            language and applies Glasl escalation staging. Sensitivity Analysis calculates composite risk
            variance across all 8 parameters to identify highest-leverage intervention points.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// RealScenariosPage
// ============================================================================

function RealScenariosPage({
  situation,
  persisted,
}: {
  situation: Situation;
  persisted: ReturnType<typeof usePersistedToolData>;
}) {
  const actors = situation.actors ?? [];
  const [trigger, setTrigger] = useState('');
  const [selectedActors, setSelectedActors] = useState<string[]>([]);
  const [timeHorizon, setTimeHorizon] = useState('90 days');
  const [analysis, setAnalysis] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(
    () => (persisted.data as SavedScenario[] | null) ?? []
  );
  const [compareIdx, setCompareIdx] = useState<number | null>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  // Params & presets
  const [params, setParams] = useState<ScenarioParams>(() => {
    // Attempt to map situation data to sensible defaults
    const riskScore = situation.riskScore ?? 50;
    return {
      ...DEFAULT_PARAMS,
      ceasefireCompliance: Math.max(0, 100 - riskScore),
      domesticPoliticalStability: Math.max(0, 100 - riskScore * 0.8),
      regionalContagionRisk: Math.min(100, riskScore * 0.6),
    };
  });
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [theoryOpen, setTheoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalysisTab>('narrative');

  const conflictContext = `${situation.name} — ${situation.description}`;
  const activePresetData = SCENARIO_PRESETS.find((p) => p.id === activePreset) ?? null;

  const handleParamChange = (key: keyof ScenarioParams, value: number) => {
    const next = { ...params, [key]: value };
    setParams(next);
    const match = SCENARIO_PRESETS.find((p) =>
      (Object.keys(p.params) as Array<keyof ScenarioParams>).every((k) => p.params[k] === next[k])
    );
    setActivePreset(match?.id ?? null);
  };

  const applyPreset = (preset: ScenarioPreset) => {
    setParams({ ...preset.params });
    setActivePreset(preset.id);
  };

  const syncFromSituation = () => {
    const riskScore = situation.riskScore ?? 50;
    const glaslStage = (situation as { glaslStage?: number }).glaslStage ?? null;
    const stageMultiplier = glaslStage ? (glaslStage / 9) * 100 : riskScore;
    setParams({
      ceasefireCompliance: Math.max(0, Math.min(100, 100 - stageMultiplier)),
      externalIntervention: Math.min(100, riskScore * 0.5),
      economicPressure: Math.min(100, riskScore * 0.4),
      humanitarianAccess: Math.max(0, Math.min(100, 100 - riskScore * 0.6)),
      mediaEnvironment: Math.max(0, Math.min(100, 100 - riskScore * 0.3)),
      domesticPoliticalStability: Math.max(0, Math.min(100, 100 - stageMultiplier * 0.8)),
      regionalContagionRisk: Math.min(100, riskScore * 0.5),
      diplomaticEngagement: Math.max(0, Math.min(100, 100 - riskScore * 0.4)),
    });
    setActivePreset(null);
  };

  const toggleActor = (actor: string) => {
    setSelectedActors((prev) =>
      prev.includes(actor) ? prev.filter((a) => a !== actor) : [...prev, actor]
    );
  };

  const runScenario = useCallback(async () => {
    if (!trigger.trim() || isRunning) return;
    setIsRunning(true);
    setAnalysis('');
    setActiveTab('narrative');
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
          situation,
          params,
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
      setAnalysis(
        `**Scenario analysis failed.** Please try again.\n\n*Trigger: ${trigger}*\n\n*Situation: ${situation.name}*\n\n*Time horizon: ${timeHorizon}*`
      );
    } finally {
      setIsRunning(false);
    }
  }, [trigger, isRunning, conflictContext, selectedActors, timeHorizon, situation, params]);

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
    const updated = [scenario, ...savedScenarios];
    setSavedScenarios(updated);
    persisted.save(updated);
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
            {situation.name} &mdash; model &ldquo;what if&rdquo; scenarios across political, security,
            humanitarian, and economic dimensions
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left column */}
        <div className="space-y-4">
          {/* Setup panel */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5 space-y-5">
            {/* Situation context (read-only) */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Situation
              </label>
              <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-3 py-2.5 text-sm text-navy-700">
                {situation.name}
              </div>
              <p className="mt-1.5 text-[11px] text-navy-500">
                {situation.description.slice(0, 120)}
                {situation.description.length > 120 ? '...' : ''}
              </p>
            </div>

            {/* Scenario trigger */}
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Scenario Trigger
              </label>
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
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                  Involved Actors
                </label>
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
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Time Horizon
              </label>
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

            <p className="text-center text-[10px] text-navy-400">Included in eligible monthly workspaces</p>
          </div>

          {/* 8-slider parameter panel */}
          <ParameterPanel
            params={params}
            onParamChange={handleParamChange}
            onReset={() => { setParams({ ...DEFAULT_PARAMS }); setActivePreset(null); }}
            onSyncFromSituation={syncFromSituation}
          />

          {/* Preset cards */}
          <PresetCardsGrid
            activePreset={activePreset}
            onSelectPreset={applyPreset}
            isOpen={presetsOpen}
            onToggle={() => setPresetsOpen((v) => !v)}
          />

          {/* Saved scenarios */}
          {savedScenarios.length > 0 && (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Saved Scenarios ({savedScenarios.length})
              </p>
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
                      <p className="text-[10px] text-navy-400">
                        {s.conflictContext} &middot; {s.timeHorizon}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = savedScenarios.filter((_, i) => i !== idx);
                        setSavedScenarios(updated);
                        persisted.save(updated);
                        if (compareIdx === idx) setCompareIdx(null);
                      }}
                      className="text-navy-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: analysis + tabs */}
        <div className="space-y-4" ref={analysisRef}>
          {!analysis && !isRunning ? (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-app-border)] bg-white p-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-diplomatic-blue/8">
                <GitCompare className="h-6 w-6 text-diplomatic-blue" />
              </div>
              <p className="text-base font-semibold text-navy-800">Configure Your Scenario</p>
              <p className="mt-2 text-sm text-navy-500 max-w-xs">
                Define a trigger event and choose a time horizon. Gemini will analyze consequences across 4
                temporal phases for {situation.name}.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
              {/* Analysis header */}
              <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10">
                    <Sparkles className="h-4 w-4 text-gold-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-navy-900">Scenario Analysis</p>
                    <p className="text-[11px] text-navy-500">
                      {situation.name} &middot; {timeHorizon}
                    </p>
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 mb-1">
                  Trigger Event
                </p>
                <p className="text-sm text-navy-800 italic">&ldquo;{trigger}&rdquo;</p>
              </div>

              {/* Methodology tabs */}
              <AnalysisTabs activeTab={activeTab} onTabChange={setActiveTab} />

              {/* Tab content */}
              <div className="px-5 py-5">
                {activeTab === 'narrative' && (
                  <>
                    {isRunning && !analysis && (
                      <div className="flex items-center gap-2 text-sm text-navy-400">
                        <Loader2 className="h-4 w-4 animate-spin text-diplomatic-blue" />
                        Analyzing scenario across temporal phases...
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
                  </>
                )}

                {activeTab === 'probability-tree' && (
                  <ProbabilityTree preset={activePresetData} />
                )}

                {activeTab === 'sensitivity' && (
                  <SensitivityAnalysis params={params} />
                )}
              </div>

              {/* Comparison view */}
              {compareIdx !== null && savedScenarios[compareIdx] && (
                <div className="border-t border-[var(--color-app-border)] px-5 py-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-navy-900">
                      Comparing with:{' '}
                      <span className="text-diplomatic-blue">{savedScenarios[compareIdx].title}</span>
                    </p>
                    <button
                      onClick={() => setCompareIdx(null)}
                      className="text-navy-400 hover:text-navy-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 mb-2">
                      Trigger: {savedScenarios[compareIdx].trigger}
                    </p>
                    <div className="prose prose-sm max-w-none text-navy-700 text-xs">
                      <MarkdownRenderer
                        content={savedScenarios[compareIdx].analysis.slice(0, 600) + '...'}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Theory Grounding Panel */}
      <TheoryGroundingPanel
        params={params}
        isOpen={theoryOpen}
        onToggle={() => setTheoryOpen((v) => !v)}
      />

      {/* Methodology note */}
      <div className="flex items-start gap-3 rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-navy-200 text-[10px] font-semibold text-navy-400">
          ?
        </div>
        <div>
          <p className="text-[11px] font-semibold text-navy-700">Analytical Framework</p>
          <p className="text-[11px] text-navy-500 leading-relaxed mt-0.5">
            Scenarios are analyzed across four temporal phases (Initial Trigger, Short-term, Medium-term,
            Long-term) with Key Pivot Points and Policy Recommendations. Each section uses calibrated
            confidence language and applies Glasl escalation staging. Sensitivity Analysis calculates composite
            risk variance across all 8 parameters to identify highest-leverage intervention points.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ScenariosPage — default export
// ============================================================================

export default function ScenariosPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  const persisted = usePersistedToolData('scenarios', situation?.id);
  const { hasData, loading: firestoreLoading } = useToolData('scenario_analysis');
  const [regenerating, setRegenerating] = useState(false);

  if (isDemo) return <DemoScenariosPage />;
  if (showGuard || !situation) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      await fetch('/api/ai/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: situation.id }),
      });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {firestoreLoading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-navy-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </span>
        ) : hasData ? (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-200 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Regenerate
          </button>
        ) : (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate with PRAXIS
          </button>
        )}
      </div>
      <RealScenariosPage situation={situation} persisted={persisted} />
    </div>
  );
}
