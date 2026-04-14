'use client';

import { useState } from 'react';
import {
  ShieldAlert,
  Microscope,
  Swords,
  GitFork,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Situation } from '@/types/situation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SatType = 'challenge' | 'assumptions' | 'red_team' | 'competing_hypotheses';

interface SatFinding {
  point: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string;
  implication: string;
}

interface SatResult {
  satType: SatType;
  title: string;
  findings: SatFinding[];
  overallAssessment: string;
  revisedConfidence: 'confirmed' | 'partially_confirmed' | 'uncertain' | 'challenged' | 'refuted';
  keyUncertainties: string[];
  recommendedActions: string[];
}

interface SatToolbarProps {
  /** Raw text content of the assessment to analyze */
  assessmentContent: string;
  /** Which tool generated this assessment */
  toolName?: string;
  /** Current situation for graph context */
  situation?: Situation;
  className?: string;
}

// ---------------------------------------------------------------------------
// SAT button config
// ---------------------------------------------------------------------------

const SAT_BUTTONS: Array<{
  type: SatType;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  color: string;
}> = [
  {
    type: 'challenge',
    label: 'Challenge',
    shortLabel: 'Challenge',
    icon: ShieldAlert,
    description: 'Challenge the key claims in this assessment',
    color: 'text-amber-600 hover:bg-amber-50 border-amber-200',
  },
  {
    type: 'assumptions',
    label: 'Key Assumptions',
    shortLabel: 'Assumptions',
    icon: Microscope,
    description: 'Surface and scrutinize hidden assumptions',
    color: 'text-blue-600 hover:bg-blue-50 border-blue-200',
  },
  {
    type: 'red_team',
    label: 'Red Team',
    shortLabel: 'Red Team',
    icon: Swords,
    description: 'Argue the strongest counter-case',
    color: 'text-red-600 hover:bg-red-50 border-red-200',
  },
  {
    type: 'competing_hypotheses',
    label: 'Competing Hypotheses',
    shortLabel: 'Hypotheses',
    icon: GitFork,
    description: 'Analyze competing explanations (ACH)',
    color: 'text-purple-600 hover:bg-purple-50 border-purple-200',
  },
];

// ---------------------------------------------------------------------------
// Confidence badge
// ---------------------------------------------------------------------------

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
      level === 'high' ? 'bg-emerald-50 text-emerald-700' :
      level === 'medium' ? 'bg-amber-50 text-amber-700' :
      'bg-red-50 text-red-700'
    )}>
      {level}
    </span>
  );
}

const VERDICT_CONFIG = {
  confirmed: { icon: CheckCircle2, label: 'Assessment Confirmed', color: 'text-emerald-600 bg-emerald-50' },
  partially_confirmed: { icon: MinusCircle, label: 'Partially Confirmed', color: 'text-amber-600 bg-amber-50' },
  uncertain: { icon: HelpCircle, label: 'Assessment Uncertain', color: 'text-blue-600 bg-blue-50' },
  challenged: { icon: AlertTriangle, label: 'Assessment Challenged', color: 'text-orange-600 bg-orange-50' },
  refuted: { icon: XCircle, label: 'Assessment Refuted', color: 'text-red-600 bg-red-50' },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SatToolbar({ assessmentContent, toolName, situation, className }: SatToolbarProps) {
  const [activeSat, setActiveSat] = useState<SatType | null>(null);
  const [loading, setLoading] = useState<SatType | null>(null);
  const [results, setResults] = useState<Partial<Record<SatType, SatResult>>>({});
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const runSat = async (satType: SatType) => {
    if (loading) return;
    setError(null);

    // If already have result, just show it
    if (results[satType]) {
      setActiveSat(satType);
      setExpanded(true);
      return;
    }

    setLoading(satType);
    setExpanded(true);

    try {
      const res = await fetch('/api/ai/sat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          satType,
          assessmentContent: assessmentContent.slice(0, 8000), // Token safety
          toolName,
          situation,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json() as SatResult;
      setResults((prev) => ({ ...prev, [satType]: data }));
      setActiveSat(satType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setExpanded(false);
    } finally {
      setLoading(null);
    }
  };

  const activeResult = activeSat ? results[activeSat] : null;

  return (
    <div className={cn('border-t border-navy-200 bg-navy-50/30', className)}>
      {/* Toolbar header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">
            SAT Analysis
          </span>
          <span className="text-[9px] text-navy-300">Structured Analytical Techniques</span>
        </div>

        {/* SAT buttons */}
        <div className="flex items-center gap-1.5">
          {SAT_BUTTONS.map(({ type, shortLabel, icon: Icon, color, description }) => (
            <button
              key={type}
              onClick={() => runSat(type)}
              disabled={loading !== null}
              title={description}
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-all',
                color,
                activeSat === type && results[type]
                  ? 'ring-1 ring-current bg-current/5'
                  : 'bg-white',
                loading === type ? 'opacity-70' : '',
                'disabled:cursor-not-allowed',
              )}
            >
              {loading === type ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              {shortLabel}
            </button>
          ))}

          {(activeResult || error) && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="ml-1 flex items-center gap-1 rounded-md border border-navy-200 bg-white px-2 py-1 text-[11px] text-navy-500 hover:border-navy-300 transition-colors"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Results panel */}
      {expanded && activeResult && (
        <div className="border-t border-navy-100 px-4 py-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-navy-900">{activeResult.title}</h4>
            {(() => {
              const cfg = VERDICT_CONFIG[activeResult.revisedConfidence];
              const Icon = cfg.icon;
              return (
                <span className={cn('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', cfg.color)}>
                  <Icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </span>
              );
            })()}
          </div>

          {/* Overall assessment */}
          <div className="rounded-lg bg-white border border-navy-100 p-3">
            <p className="text-xs text-navy-700 leading-relaxed">{activeResult.overallAssessment}</p>
          </div>

          {/* Findings */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">
              Key Findings ({activeResult.findings.length})
            </h5>
            {activeResult.findings.map((finding, i) => (
              <div key={i} className="rounded-lg border border-navy-100 bg-white p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-navy-900">{finding.point}</p>
                  <ConfidenceBadge level={finding.confidence} />
                </div>
                <p className="text-[11px] text-navy-600 leading-relaxed">{finding.evidence}</p>
                <p className="text-[11px] text-navy-500 italic">{finding.implication}</p>
              </div>
            ))}
          </div>

          {/* Uncertainties + Actions side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
              <h5 className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-2">
                Key Uncertainties
              </h5>
              <ul className="space-y-1">
                {activeResult.keyUncertainties.map((u, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-amber-800">
                    <HelpCircle className="h-3 w-3 mt-0.5 shrink-0 text-amber-600" />
                    {u}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <h5 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-2">
                Recommended Actions
              </h5>
              <ul className="space-y-1">
                {activeResult.recommendedActions.map((a, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-emerald-800">
                    <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full bg-emerald-200 text-[9px] flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    {a}
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
