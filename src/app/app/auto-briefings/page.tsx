'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { AiPopulate } from '@/components/praxis/ai-populate';

import { useState, useEffect, useCallback } from 'react';
import {
  Newspaper, ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  Minus, Clock, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { recordActivity } from '@/lib/utils/activity';

// ─── Types ─────────────────────────────────────────────────────────────────

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
type Trend = 'escalating' | 'stable' | 'de-escalating';

interface AutoBriefing {
  situationName: string;
  riskLevel: RiskLevel;
  trend: Trend;
  headline: string;
  keyDevelopments: string[];
  securitySituation: string;
  politicalDynamics: string;
  humanitarianUpdate: string;
  mediaEnvironment: string;
  actionItems: string[];
  nextReview: string;
  generatedAt?: string;
}

// ─── Style helpers ──────────────────────────────────────────────────────────

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'CRITICAL', color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-300'    },
  high:     { label: 'HIGH',     color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-300' },
  medium:   { label: 'MEDIUM',   color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-300'  },
  low:      { label: 'LOW',      color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-300'},
};

const TREND_ICON: Record<Trend, { Icon: typeof TrendingUp; color: string; label: string }> = {
  escalating:    { Icon: TrendingUp,   color: 'text-red-500',     label: 'Escalating'    },
  stable:        { Icon: Minus,        color: 'text-navy-400',    label: 'Stable'        },
  'de-escalating':{ Icon: TrendingDown, color: 'text-emerald-500', label: 'De-escalating' },
};

const BRIEF_HISTORY_KEY = (situationId: string) => `praxis-auto-brief-history-${situationId}`;
const MAX_HISTORY = 7;

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_DATA: AutoBriefing = {
  situationName: 'Nordalia Crisis',
  riskLevel: 'high',
  trend: 'escalating',
  headline: 'Ceasefire under severe stress following AFN artillery incidents; humanitarian access blocked for 11th consecutive day',
  keyDevelopments: [
    'UNMN confirmed 14 AFN artillery incidents in buffer zone over past 30 days — highest frequency since ceasefire signing',
    'OCHA convoy blocked at Marka checkpoint for 11th consecutive day; 2.3M civilians without sustained aid access',
    'DRM issued statement claiming GoN is preparing offensive operation in Kessara corridor',
    'Karovia Foreign Minister cancelled scheduled meeting with GoN counterpart — no reason given',
    'World Bank escrow compliance maintained — only commitment with full compliance this week',
  ],
  securitySituation: 'UNMN reports sustained pattern of ceasefire violations by AFN forces, with artillery incidents in the 5km buffer zone occurring daily. DRM has responded with tactical repositioning near Kessara. No direct engagement reported, but proximity is increasing. UNMN Joint Ceasefire Monitoring Commission has not yet been established (overdue 45 days) — monitoring relies on ad hoc UNMN patrols only.',
  politicalDynamics: 'The GoN-DRM political track is stalled. No pre-negotiation contacts have been made this week. Karovia\'s cancellation of the GoN foreign minister meeting is the most significant political signal — possibly indicating Karovian displeasure with GoN escalatory behavior, or alternatively preparation for increased DRM support. AU mediation team reports no progress on establishing pre-talk ground rules.',
  humanitarianUpdate: 'CRITICAL: OCHA reports 11 consecutive days of blocked convoy access. 2.3M people in DRM-controlled territory are relying on pre-positioned stocks only. Nutrition surveillance indicates acute malnutrition rates increasing in three eastern districts. MSF field team reporting increasing critical medical cases unable to reach Nordalia City hospitals.',
  mediaEnvironment: 'State media heavily amplifying "counterterrorism" narrative around Kessara corridor. NIMN published documentation of buffer zone violations today. International coverage increasing — BBC and Al Jazeera both ran extended features on humanitarian crisis. GoN information operation (Operation MIRROR) actively suppressing UNMN reporting on social media.',
  actionItems: [
    'URGENT: Invoke OCHA escalation mechanism — convene emergency humanitarian access meeting within 48 hours',
    'Request UNMN to formally report buffer zone violations to UNSC under S/2025/891 monitoring mandate',
    'Engage Karovia at senior level to understand significance of cancelled FM meeting',
    'Issue joint AU-UN statement on ceasefire compliance before international media cycle closes today',
    'Brief UNSC P3 on deteriorating access situation ahead of monthly Nordalia consultation',
  ],
  nextReview: '24 hours — monitor for any Karovian diplomatic signals and OCHA convoy status',
  generatedAt: new Date().toISOString(),
};

// ─── Brief History helpers ─────────────────────────────────────────────────

interface HistoricalBrief {
  generatedAt: string;
  headline: string;
  riskLevel: RiskLevel;
  trend: Trend;
  actionItems: string[];
}

function saveBriefToHistory(situationId: string, brief: AutoBriefing) {
  if (typeof window === 'undefined') return;
  try {
    const key = BRIEF_HISTORY_KEY(situationId);
    const existing: HistoricalBrief[] = JSON.parse(localStorage.getItem(key) || '[]');
    const entry: HistoricalBrief = {
      generatedAt: brief.generatedAt || new Date().toISOString(),
      headline: brief.headline,
      riskLevel: brief.riskLevel,
      trend: brief.trend,
      actionItems: brief.actionItems,
    };
    const updated = [entry, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable
  }
}

function loadBriefHistory(situationId: string): HistoricalBrief[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(BRIEF_HISTORY_KEY(situationId)) || '[]');
  } catch {
    return [];
  }
}

// ─── Section component ───────────────────────────────────────────────────────

function BriefSection({ title, content, urgent }: { title: string; content: string; urgent?: boolean }) {
  return (
    <div className={cn(
      'rounded-xl border p-4',
      urgent ? 'border-red-200 bg-red-50/40' : 'border-[var(--color-app-border)] bg-white'
    )}>
      <p className={cn(
        'mb-1.5 text-[10px] font-semibold uppercase tracking-wide',
        urgent ? 'text-red-500' : 'text-navy-400'
      )}>{title}</p>
      <p className="text-xs leading-relaxed text-navy-700">{content}</p>
    </div>
  );
}

// ─── Main brief display ──────────────────────────────────────────────────────

function BriefContent({ data }: { data: AutoBriefing }) {
  const risk = RISK_CONFIG[data.riskLevel];
  const { Icon: TrendIcon, color: trendColor, label: trendLabel } = TREND_ICON[data.trend];
  const isHumanitarianCritical = data.riskLevel === 'critical' || data.riskLevel === 'high';

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className={cn('rounded-xl border p-4', risk.border, risk.bg)}>
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', risk.bg, risk.color)}>
            RISK: {risk.label}
          </span>
          <span className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
            <TrendIcon className="h-3.5 w-3.5" />
            {trendLabel}
          </span>
          {data.generatedAt && (
            <span className="ml-auto flex items-center gap-1 text-[11px] text-navy-400">
              <Clock className="h-3 w-3" />
              {new Date(data.generatedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm font-semibold leading-snug text-navy-900">{data.headline}</p>
      </div>

      {/* Key developments */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-navy-400">Key Developments</p>
        <ul className="space-y-1.5">
          {data.keyDevelopments.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-navy-700">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-diplomatic-blue/50" />
              {d}
            </li>
          ))}
        </ul>
      </div>

      {/* 4-section grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        <BriefSection title="Security Situation" content={data.securitySituation} />
        <BriefSection title="Political Dynamics" content={data.politicalDynamics} />
        <BriefSection
          title="Humanitarian Update"
          content={data.humanitarianUpdate}
          urgent={isHumanitarianCritical}
        />
        <BriefSection title="Media Environment" content={data.mediaEnvironment} />
      </div>

      {/* Action items */}
      <div className="rounded-xl border border-diplomatic-blue/20 bg-diplomatic-blue/4 p-4">
        <div className="mb-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-diplomatic-blue/70" />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-500">Action Items</p>
        </div>
        <ol className="space-y-1.5">
          {data.actionItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-navy-700">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue/15 text-[9px] font-bold text-diplomatic-blue">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </div>

      {data.nextReview && (
        <p className="flex items-center gap-1.5 text-[11px] text-navy-400">
          <RefreshCw className="h-3 w-3" />
          Next review: {data.nextReview}
        </p>
      )}
    </div>
  );
}

// ─── History card ────────────────────────────────────────────────────────────

function HistoryCard({ brief }: { brief: HistoricalBrief }) {
  const [expanded, setExpanded] = useState(false);
  const risk = RISK_CONFIG[brief.riskLevel];

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
      <div
        className="flex cursor-pointer items-start gap-3 p-3"
        onClick={() => setExpanded(!expanded)}
      >
        <span className={cn('mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold', risk.bg, risk.color)}>
          {risk.label}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium leading-snug text-navy-700 line-clamp-2">{brief.headline}</p>
          <p className="mt-0.5 text-[10px] text-navy-400">
            {new Date(brief.generatedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div className="shrink-0 text-navy-400">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-[var(--color-app-border)] px-3 pb-3 pt-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-navy-400">Action Items</p>
          <ul className="space-y-1">
            {brief.actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-navy-600">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-navy-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AutoBriefingsPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  const [data, setData] = useState<AutoBriefing | null>(null);
  const [history, setHistory] = useState<HistoricalBrief[]>([]);

  useEffect(() => {
    const situationId = isDemo ? 'demo' : situation?.id;
    if (situationId) {
      recordActivity({ tool: 'Auto Briefings', href: '/auto-briefings', situationId });
      setHistory(loadBriefHistory(situationId));
    }
  }, [isDemo, situation?.id]);

  const handleDataGenerated = useCallback((raw: unknown) => {
    const brief = raw as AutoBriefing;
    brief.generatedAt = new Date().toISOString();
    setData(brief);
    const situationId = isDemo ? 'demo' : situation?.id;
    if (situationId) {
      saveBriefToHistory(situationId, brief);
      setHistory(loadBriefHistory(situationId));
    }
  }, [isDemo, situation?.id]);

  if (isDemo) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">Daily Intelligence Brief</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            Auto-generated morning briefing — Nordalia Crisis (Demo)
          </p>
        </div>
        <BriefContent data={DEMO_DATA} />
      </div>
    );
  }

  if (showGuard) return <NoSituationState />;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-navy-400" />
          <h1 className="font-serif text-2xl font-normal text-navy-900">Daily Intelligence Brief</h1>
        </div>
        <p className="mt-1 text-sm text-navy-500">
          {situation?.name
            ? `Auto-generated morning briefing — ${situation.name}`
            : 'Auto-generated daily situation briefing with key developments and action items'}
        </p>
      </div>

      <AiPopulate
        toolId="auto-briefing"
        toolName="Daily Intelligence Brief"
        apiEndpoint="/api/ai/auto-briefing"
        creditCost={2}
        hasExistingData={!!data}
        onDataGenerated={handleDataGenerated}
      >
        {data ? <BriefContent data={data} /> : null}
      </AiPopulate>

      {history.length > 1 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-400">
            Brief History (last {history.length - 1})
          </h2>
          <div className="space-y-2">
            {history.slice(1).map((brief, i) => (
              <HistoryCard key={i} brief={brief} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
