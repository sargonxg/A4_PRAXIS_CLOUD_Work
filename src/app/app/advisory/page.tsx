'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { usePersistedToolData } from '@/hooks/use-persisted-tool-data';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { RegistryToolInfo } from '@/components/praxis/tool-info-from-registry';
import { AdvisorPicker } from '@/components/advisory/advisor-picker';
import { AdvisorChatPane } from '@/components/advisory/advisor-chat-pane';
import type { AdvisorConfig } from '@/types/advisor';

import { useState, useCallback, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
  Info,
  Target,
  Users,
  Globe,
  Zap,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'immediate' | 'short-term' | 'medium-term' | 'long-term';
type Category = 'diplomatic' | 'security' | 'humanitarian' | 'political' | 'economic' | 'informational';
type Momentum = 'positive' | 'neutral' | 'negative';
type Confidence = 'high' | 'medium' | 'low';

interface Recommendation {
  priority: Priority;
  category: Category;
  action: string;
  rationale: string;
  actors: string[];
  risks: string[];
  successIndicators: string[];
  timeframe: string;
}

interface AdvisoryData {
  recommendations: Recommendation[];
  strategicAssessment: {
    currentMomentum: Momentum;
    windowOfOpportunity: string;
    criticalPath: string[];
    redLines: string[];
  };
  confidenceLevel: Confidence;
  analystNotes: string;
}

// ─── Style maps ───────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<Priority, { badge: string; border: string; dot: string; label: string }> = {
  immediate: {
    badge: 'bg-red-500/10 text-red-700 border border-red-500/25',
    border: 'border-l-red-500',
    dot: 'bg-red-500',
    label: 'Immediate',
  },
  'short-term': {
    badge: 'bg-amber-500/10 text-amber-700 border border-amber-500/25',
    border: 'border-l-amber-500',
    dot: 'bg-amber-500',
    label: 'Short-term',
  },
  'medium-term': {
    badge: 'bg-blue-500/10 text-blue-700 border border-blue-500/25',
    border: 'border-l-blue-500',
    dot: 'bg-blue-500',
    label: 'Medium-term',
  },
  'long-term': {
    badge: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/25',
    border: 'border-l-emerald-500',
    dot: 'bg-emerald-500',
    label: 'Long-term',
  },
};

const CATEGORY_STYLES: Record<Category, { icon: typeof Globe; color: string; label: string }> = {
  diplomatic: { icon: Globe, color: '#4B92DB', label: 'Diplomatic' },
  security: { icon: ShieldAlert, color: '#A63D40', label: 'Security' },
  humanitarian: { icon: Users, color: '#5B8C5A', label: 'Humanitarian' },
  political: { icon: BarChart3, color: '#7C5CBF', label: 'Political' },
  economic: { icon: TrendingUp, color: '#C8961E', label: 'Economic' },
  informational: { icon: Zap, color: '#D4722C', label: 'Informational' },
};

const MOMENTUM_CONFIG: Record<Momentum, { icon: typeof Minus; label: string; color: string; bg: string }> = {
  positive: { icon: TrendingUp, label: 'Positive Momentum', color: 'text-emerald-700', bg: 'bg-emerald-500/10 border-emerald-500/25' },
  neutral: { icon: Minus, label: 'Neutral', color: 'text-amber-700', bg: 'bg-amber-500/10 border-amber-500/25' },
  negative: { icon: TrendingDown, label: 'Negative Momentum', color: 'text-red-700', bg: 'bg-red-500/10 border-red-500/25' },
};

const CONFIDENCE_CONFIG: Record<Confidence, { label: string; color: string; bg: string }> = {
  high: { label: 'High', color: 'text-emerald-700', bg: 'bg-emerald-500/10 border-emerald-500/25' },
  medium: { label: 'Medium', color: 'text-amber-700', bg: 'bg-amber-500/10 border-amber-500/25' },
  low: { label: 'Low', color: 'text-red-700', bg: 'bg-red-500/10 border-red-500/25' },
};

const PRIORITY_ORDER: Priority[] = ['immediate', 'short-term', 'medium-term', 'long-term'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const [expanded, setExpanded] = useState(index < 2);
  const pStyle = PRIORITY_STYLES[rec.priority];
  const cConfig = CATEGORY_STYLES[rec.category];
  const CatIcon = cConfig.icon;

  return (
    <div className={cn(
      'rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden border-l-4 transition-all',
      pStyle.border
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-4 p-4 text-left hover:bg-navy-50/50 transition-colors"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mt-0.5"
          style={{ backgroundColor: `${cConfig.color}15` }}
        >
          <CatIcon size={16} style={{ color: cConfig.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider', pStyle.badge)}>
              {pStyle.label}
            </span>
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border border-navy-200/60 text-navy-500 bg-navy-50">
              {cConfig.label}
            </span>
            <span className="text-[10px] text-navy-400 ml-auto flex items-center gap-1">
              <Clock size={10} />
              {rec.timeframe}
            </span>
          </div>
          <p className="text-sm font-medium text-navy-900 leading-snug">{rec.action}</p>
        </div>
        <div className="shrink-0 mt-1 text-navy-400">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[var(--color-app-border)]/50 pt-4">
          {/* Rationale */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Strategic Rationale</p>
            <p className="text-sm text-navy-700 leading-relaxed">{rec.rationale}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Actors */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-2 flex items-center gap-1">
                <Users size={10} /> Implementing Actors
              </p>
              <ul className="space-y-1">
                {rec.actors.map((actor, i) => (
                  <li key={i} className="text-xs text-navy-700 flex items-start gap-1.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-400" />
                    {actor}
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-2 flex items-center gap-1">
                <AlertTriangle size={10} /> Risks
              </p>
              <ul className="space-y-1">
                {rec.risks.map((risk, i) => (
                  <li key={i} className="text-xs text-red-700/80 flex items-start gap-1.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>

            {/* Success Indicators */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-2 flex items-center gap-1">
                <CheckCircle2 size={10} /> Success Indicators
              </p>
              <ul className="space-y-1">
                {rec.successIndicators.map((indicator, i) => (
                  <li key={i} className="text-xs text-emerald-700/80 flex items-start gap-1.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdvisoryPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  const persisted = usePersistedToolData('advisory', situation?.id);

  const [isGenerating, setIsGenerating] = useState(false);
  const [advisoryData, setAdvisoryData] = useState<AdvisoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analystRole, setAnalystRole] = useState('');
  const [activeAdvisor, setActiveAdvisor] = useState<AdvisorConfig | null>(null);

  // Restore from persisted data
  useEffect(() => {
    if (persisted.data && !advisoryData && !isGenerating) {
      setAdvisoryData(persisted.data as AdvisoryData);
    }
  }, [persisted.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: situation ?? undefined,
          analystRole: analystRole.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${response.status})`);
      }

      const data: AdvisoryData = await response.json();
      setAdvisoryData(data);
      persisted.save(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, situation, analystRole, persisted]);

  if (showGuard) return <NoSituationState />;

  // Group recommendations by priority
  const grouped: Record<Priority, Recommendation[]> = {
    immediate: [],
    'short-term': [],
    'medium-term': [],
    'long-term': [],
  };
  if (advisoryData) {
    for (const rec of advisoryData.recommendations) {
      grouped[rec.priority]?.push(rec);
    }
  }

  const assessment = advisoryData?.strategicAssessment;
  const momentumCfg = assessment ? MOMENTUM_CONFIG[assessment.currentMomentum] : null;
  const MomentumIcon = momentumCfg?.icon ?? Minus;
  const confidenceCfg = advisoryData ? CONFIDENCE_CONFIG[advisoryData.confidenceLevel] : null;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1200px] mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-diplomatic-blue/10 border border-diplomatic-blue/20">
            <Target size={20} className="text-diplomatic-blue" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-semibold text-navy-900">Strategic Advisory</h1>
            <p className="text-sm text-navy-500">
              {situation
                ? `AI-generated strategic recommendations for ${situation.name}`
                : 'Prioritized recommendations grounded in PRAXIS analytical frameworks'}
            </p>
          </div>
        </div>
        <RegistryToolInfo toolId="advisory" />
      </div>

      {/* Advisor Council v2 — 4 flagship advisors, Firestore-backed */}
      <section className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-navy-900">Advisor Council</h2>
            <p className="text-[11px] text-navy-500">Pick a specialist to chat with. Each one brings a distinct method, source diet, and model tier.</p>
          </div>
          {activeAdvisor && (
            <button
              type="button"
              onClick={() => setActiveAdvisor(null)}
              className="text-[11px] text-navy-500 underline"
            >
              Back to picker
            </button>
          )}
        </div>
        {activeAdvisor
          ? <AdvisorChatPane advisor={activeAdvisor} situation={situation ?? null} />
          : <AdvisorPicker onPick={setActiveAdvisor} selectedId={activeAdvisor ? (activeAdvisor as AdvisorConfig).id : undefined} />
        }
      </section>

      {/* Generate panel */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1.5">
              Your Role (optional)
            </label>
            <input
              value={analystRole}
              onChange={(e) => setAnalystRole(e.target.value)}
              placeholder="e.g. UN Special Envoy, Political Affairs Officer, Humanitarian Coordinator..."
              className="w-full rounded-lg border border-[var(--color-app-border)] bg-navy-50/50 px-3 py-2 text-sm text-navy-900 placeholder:text-navy-400 focus:border-gold-500/40 focus:outline-none focus:ring-2 focus:ring-gold-500/10"
              disabled={isGenerating}
            />
            <p className="mt-1 text-[10px] text-navy-400">
              Tailors language, detail level, and actor engagement assumptions to your specific mandate.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              'flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all shrink-0',
              isGenerating
                ? 'bg-navy-400 cursor-not-allowed'
                : 'bg-diplomatic-blue hover:bg-diplomatic-blue/90 shadow-sm hover:shadow'
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {advisoryData ? 'Regenerate Advisory' : 'Generate Advisory'}
              </>
            )}
          </button>
        </div>

        {isGenerating && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 px-4 py-3">
            <Loader2 size={14} className="animate-spin text-diplomatic-blue shrink-0" />
            <p className="text-xs text-diplomatic-blue">
              Synthesising cross-tool intelligence — applying Glasl, Fisher-Ury, Zartman, and Stedman frameworks…
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-3">
            <AlertTriangle size={14} className="text-red-600 shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {advisoryData && (
        <>
          {/* Strategic Assessment strip */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
            <h2 className="text-sm font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <BarChart3 size={15} className="text-navy-500" />
              Strategic Assessment
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              {/* Momentum */}
              {momentumCfg && (
                <div className={cn('rounded-lg border p-3', momentumCfg.bg)}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Current Momentum</p>
                  <div className={cn('flex items-center gap-2', momentumCfg.color)}>
                    <MomentumIcon size={16} />
                    <span className="text-sm font-semibold">{momentumCfg.label}</span>
                  </div>
                </div>
              )}

              {/* Confidence */}
              {confidenceCfg && (
                <div className={cn('rounded-lg border p-3', confidenceCfg.bg)}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Assessment Confidence</p>
                  <div className={cn('flex items-center gap-2', confidenceCfg.color)}>
                    <CheckCircle2 size={16} />
                    <span className="text-sm font-semibold">{confidenceCfg.label} confidence</span>
                  </div>
                </div>
              )}

              {/* Recommendation count */}
              <div className="rounded-lg border border-navy-200/60 bg-navy-50/50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Recommendations</p>
                <div className="flex items-center gap-2 text-navy-700">
                  <Target size={16} className="text-navy-500" />
                  <span className="text-sm font-semibold">{advisoryData.recommendations.length} prioritised actions</span>
                </div>
              </div>
            </div>

            {/* Window of Opportunity */}
            <div className="mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-2">Window of Opportunity</p>
              <p className="text-sm text-navy-700 leading-relaxed bg-navy-50/50 rounded-lg p-3 border border-navy-100">
                {assessment?.windowOfOpportunity}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Critical Path */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-2 flex items-center gap-1">
                  <ArrowRight size={10} /> Critical Path
                </p>
                <ol className="space-y-2">
                  {assessment?.criticalPath.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue/10 text-[10px] font-bold text-diplomatic-blue mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-xs text-navy-700 leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Red Lines */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-2 flex items-center gap-1">
                  <ShieldAlert size={10} className="text-red-500" /> Red Lines — Do Not Cross
                </p>
                <ul className="space-y-2">
                  {assessment?.redLines.map((line, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <p className="text-xs text-red-700/90 leading-relaxed">{line}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Recommendations by priority */}
          <div className="space-y-6">
            {PRIORITY_ORDER.map((priority) => {
              const recs = grouped[priority];
              if (!recs.length) return null;
              const pStyle = PRIORITY_STYLES[priority];
              return (
                <section key={priority}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={cn('h-2 w-2 rounded-full', pStyle.dot)} />
                    <h2 className="text-sm font-semibold text-navy-800 uppercase tracking-wide">
                      {pStyle.label} Actions
                    </h2>
                    <span className="text-[10px] text-navy-400 font-medium bg-navy-100 rounded-full px-2 py-0.5">
                      {recs.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {recs.map((rec, i) => (
                      <RecommendationCard key={i} rec={rec} index={i} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Analyst Notes */}
          <div className="rounded-xl border border-navy-200/60 bg-navy-50/50 p-5">
            <div className="flex items-start gap-3">
              <Info size={15} className="text-navy-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400 mb-1.5">Analyst Notes — Data Quality &amp; Limitations</p>
                <p className="text-sm text-navy-600 leading-relaxed">{advisoryData.analystNotes}</p>
              </div>
            </div>
          </div>

          {/* Generated at */}
          {persisted.generatedAt && (
            <p className="text-[10px] text-navy-400 text-right">
              Generated {new Date(persisted.generatedAt).toLocaleString()}
              {persisted.isStale && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                  <AlertTriangle size={9} /> Stale — consider regenerating
                </span>
              )}
            </p>
          )}
        </>
      )}

      {/* Empty state */}
      {!advisoryData && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-[var(--color-app-border)] bg-white">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-diplomatic-blue/8 border border-diplomatic-blue/15 mb-4">
            <Target size={24} className="text-diplomatic-blue" />
          </div>
          <h3 className="text-sm font-semibold text-navy-800 mb-1">No Advisory Generated</h3>
          <p className="text-sm text-navy-500 text-center max-w-md mb-5">
            Generate AI-powered strategic recommendations grounded in Glasl, Fisher-Ury, Zartman, and Stedman frameworks — tailored to the active situation.
          </p>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 rounded-lg bg-diplomatic-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-diplomatic-blue/90 shadow-sm"
          >
            <Sparkles size={15} />
            Generate Advisory
          </button>
        </div>
      )}
    </div>
  );
}
