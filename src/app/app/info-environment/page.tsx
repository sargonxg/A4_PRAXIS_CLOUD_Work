'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useToolData } from '@/hooks/useToolData';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { AiPopulate } from '@/components/praxis/ai-populate';

import { useState, useEffect } from 'react';
import {
  Radio, AlertTriangle, TrendingUp, TrendingDown, Minus,
  ChevronDown, ChevronUp, Shield, MessageSquare, Globe, Zap, Loader2, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { recordActivity } from '@/lib/utils/activity';

// ─── Types ─────────────────────────────────────────────────────────────────

type NarrativeTrend = 'rising' | 'stable' | 'declining';
type ThreatLevel = 'critical' | 'high' | 'medium' | 'low';
type Platform = 'social_media' | 'state_media' | 'independent_media' | 'diaspora' | 'international';

interface Narrative {
  id: string;
  title: string;
  framing: string;
  amplifiers: string[];
  platform: Platform;
  trend: NarrativeTrend;
  reachScore: number;
  isHostile: boolean;
  counterNarrative?: string;
}

interface InfoOperation {
  name: string;
  type: 'disinformation' | 'propaganda' | 'coordinated_inauthentic' | 'astroturfing' | 'hack_and_leak';
  attribution: string;
  indicators: string[];
  threatLevel: ThreatLevel;
  platforms: string[];
}

interface InfoEnvironmentData {
  dominantNarratives: Narrative[];
  infoOperations: InfoOperation[];
  platformDynamics: {
    platform: string;
    dominantTone: string;
    keyActors: string[];
    riskLevel: ThreatLevel;
  }[];
  overallAssessment: string;
  counterMessagingRecommendations: string[];
  keyAmplifiers: { name: string; platform: string; alignment: 'hostile' | 'neutral' | 'friendly' }[];
}

// ─── Style helpers ──────────────────────────────────────────────────────────

const THREAT_CONFIG: Record<ThreatLevel, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: 'Critical',  color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200'   },
  high:     { label: 'High',      color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200'},
  medium:   { label: 'Medium',    color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  low:      { label: 'Low',       color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200'},
};

const TREND_ICON = {
  rising:   { Icon: TrendingUp,   color: 'text-red-500'    },
  stable:   { Icon: Minus,        color: 'text-navy-400'   },
  declining:{ Icon: TrendingDown, color: 'text-emerald-500'},
};

const OP_TYPE_LABELS: Record<InfoOperation['type'], string> = {
  disinformation:           'Disinformation',
  propaganda:               'Propaganda',
  coordinated_inauthentic:  'Coordinated Inauthentic Behavior',
  astroturfing:             'Astroturfing',
  hack_and_leak:            'Hack & Leak',
};

const PLATFORM_LABELS: Record<Platform, string> = {
  social_media:      'Social Media',
  state_media:       'State Media',
  independent_media: 'Independent Media',
  diaspora:          'Diaspora Networks',
  international:     'International Media',
};

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_DATA: InfoEnvironmentData = {
  dominantNarratives: [
    {
      id: 'n1',
      title: 'Counter-terrorism framing',
      framing: 'GoN state media frames the conflict as a counterterrorism operation against a foreign-backed insurgency, systematically excluding DRM\'s political grievances from coverage.',
      amplifiers: ['Nordalian State Broadcasting', 'Presidential press office', 'GoN-aligned diaspora blogs'],
      platform: 'state_media',
      trend: 'stable',
      reachScore: 78,
      isHostile: true,
      counterNarrative: 'Amplify UNMN and OCHA documentation of civilian harm; highlight DRM\'s political manifesto and democratic demands.',
    },
    {
      id: 'n2',
      title: 'Humanitarian crisis narrative',
      framing: 'International and independent media lead with civilian displacement and access restrictions, framing the conflict primarily through a humanitarian lens rather than political.',
      amplifiers: ['BBC Africa', 'Al Jazeera English', 'NIMN investigative unit'],
      platform: 'international',
      trend: 'rising',
      reachScore: 65,
      isHostile: false,
      counterNarrative: 'Ensure peace process updates receive equal prominence alongside humanitarian coverage to prevent crisis fatigue dominating the narrative.',
    },
    {
      id: 'n3',
      title: 'DRM liberation movement framing',
      framing: 'Karovian and Westmark-adjacent media frame DRM as a democratic liberation movement, overemphasizing eastern province autonomy demands while downplaying DRM human rights violations.',
      amplifiers: ['Karovia Today', 'DRM diaspora networks (Telegram)', 'Westmark opposition blogs'],
      platform: 'diaspora',
      trend: 'rising',
      reachScore: 52,
      isHostile: false,
    },
    {
      id: 'n4',
      title: 'Foreign interference narrative',
      framing: 'GoN and allied commentators attribute DRM military capacity entirely to Karovian interference, deflecting from internal governance failures and DRM\'s domestic support base.',
      amplifiers: ['Nordalian State Broadcasting', 'Government spokesman Twitter/X accounts'],
      platform: 'state_media',
      trend: 'stable',
      reachScore: 44,
      isHostile: true,
      counterNarrative: 'Counter with documented evidence of GoN\'s own foreign military procurement and external support networks.',
    },
  ],
  infoOperations: [
    {
      name: 'Operation MIRROR',
      type: 'coordinated_inauthentic',
      attribution: 'Attributed to GoN Ministry of Information (OSINT analysis)',
      indicators: [
        '340+ newly-created social media accounts coordinated posting GoN talking points (11 March 2026)',
        'Identical phrasing appearing across accounts within 2-minute windows (bot behavior)',
        'Targeting of UNMN spokesperson accounts with harassment campaign',
        'Amplification of fabricated UNMN "neutrality bias" claim with no evidentiary basis',
      ],
      threatLevel: 'high',
      platforms: ['Twitter/X', 'Facebook', 'WhatsApp'],
    },
    {
      name: 'DRM propaganda channel',
      type: 'propaganda',
      attribution: 'DRM Information Directorate (self-identified)',
      indicators: [
        'Official DRM Telegram channel (87,000 subscribers) posting unverified casualty claims',
        'Strategic release of GoN military operation details (possible OPSEC leak exploitation)',
        'Framing all humanitarian incidents as deliberate GoN targeting of civilians',
      ],
      threatLevel: 'medium',
      platforms: ['Telegram', 'YouTube'],
    },
  ],
  platformDynamics: [
    {
      platform: 'Twitter/X',
      dominantTone: 'Contested — GoN and DRM narratives clash with high-volume bot activity; international journalists dominate credibility.',
      keyActors: ['GoN spokesperson', 'UNMN communications', 'DRM Information Directorate', 'Nordalia diaspora'],
      riskLevel: 'high',
    },
    {
      platform: 'Telegram',
      dominantTone: 'DRM-favorable — closed channels with limited fact-checking capacity; key coordination tool for DRM supporters.',
      keyActors: ['DRM official channel', 'Karovia-based support networks', 'Anonymous leak channels'],
      riskLevel: 'high',
    },
    {
      platform: 'State television',
      dominantTone: 'GoN-controlled — no opposition voices; functions as government messaging platform.',
      keyActors: ['Nordalian State Broadcasting', 'Government press office'],
      riskLevel: 'medium',
    },
  ],
  overallAssessment: 'The information environment is highly polarized with two parallel information ecosystems: a GoN-controlled domestic media landscape and an externally-oriented digital space dominated by DRM and diaspora narratives. The most significant risk is coordinated inauthentic behavior (Operation MIRROR) targeting international observers and the UN mission — a clear effort to delegitimize international monitoring. Recommendation: UNMN communications team should proactively respond to bot-amplified disinformation within 4 hours of detection to prevent narrative capture.',
  counterMessagingRecommendations: [
    'Establish a UNMN rapid-response protocol (under 4 hours) for responding to coordinated disinformation targeting the mission',
    'Support NIMN investigative unit with secure source protection infrastructure — they are the most credible independent voice',
    'Brief international correspondents on Operation MIRROR attribution evidence to enable accurate framing of GoN IO activity',
    'Work with platform trust & safety teams to flag coordinated inauthentic networks — provide evidence package to Twitter/X and Meta',
    'Commission regular narrative analysis reports to track campaign effectiveness and identify emerging disinformation vectors',
  ],
  keyAmplifiers: [
    { name: 'UNMN Spokesperson', platform: 'Twitter/X', alignment: 'friendly' },
    { name: 'GoN Official Telegram', platform: 'Telegram', alignment: 'hostile' },
    { name: 'NIMN Investigative', platform: 'Web', alignment: 'neutral' },
    { name: 'Karovia Today', platform: 'Web', alignment: 'neutral' },
    { name: 'DRM Info Directorate', platform: 'Telegram', alignment: 'hostile' },
    { name: 'BBC Africa', platform: 'Web/TV', alignment: 'neutral' },
  ],
};

// ─── Sub-components ─────────────────────────────────────────────────────────

function NarrativeCard({ narrative }: { narrative: Narrative }) {
  const [expanded, setExpanded] = useState(false);
  const { Icon, color } = TREND_ICON[narrative.trend];

  return (
    <div className={cn(
      'rounded-xl border bg-white transition-shadow hover:shadow-sm',
      narrative.isHostile ? 'border-red-200' : 'border-[var(--color-app-border)]'
    )}>
      <div
        className="flex cursor-pointer items-start gap-3 p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn(
          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
          narrative.isHostile ? 'bg-red-50' : 'bg-navy-50'
        )}>
          <MessageSquare className={cn('h-3.5 w-3.5', narrative.isHostile ? 'text-red-500' : 'text-navy-400')} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-navy-900">{narrative.title}</h3>
            <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-medium text-navy-500">
              {PLATFORM_LABELS[narrative.platform]}
            </span>
            {narrative.isHostile && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">Hostile</span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-3 text-[11px] text-navy-400">
            <span className="flex items-center gap-1">
              <Icon className={cn('h-3 w-3', color)} />
              {narrative.trend}
            </span>
            <span>· Reach {narrative.reachScore}%</span>
          </div>

          {/* Reach bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-navy-100">
              <div
                className={cn('h-full rounded-full', narrative.isHostile ? 'bg-red-400' : 'bg-diplomatic-blue/50')}
                style={{ width: `${narrative.reachScore}%` }}
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 text-navy-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--color-app-border)] px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs leading-relaxed text-navy-600">{narrative.framing}</p>

          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-navy-400">Key Amplifiers</p>
            <div className="flex flex-wrap gap-1.5">
              {narrative.amplifiers.map((a) => (
                <span key={a} className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] text-navy-600">{a}</span>
              ))}
            </div>
          </div>

          {narrative.counterNarrative && (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Counter-Messaging</p>
              <p className="text-xs text-emerald-800">{narrative.counterNarrative}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoOpCard({ op }: { op: InfoOperation }) {
  const [expanded, setExpanded] = useState(false);
  const threat = THREAT_CONFIG[op.threatLevel];

  return (
    <div className={cn('rounded-xl border bg-white transition-shadow hover:shadow-sm', threat.border)}>
      <div
        className="flex cursor-pointer items-start gap-3 p-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full', threat.bg)}>
          <Zap className={cn('h-3.5 w-3.5', threat.color)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-navy-900">{op.name}</h3>
            <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-medium text-navy-500">
              {OP_TYPE_LABELS[op.type]}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', threat.bg, threat.color)}>
              {threat.label}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-navy-400">{op.attribution}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {op.platforms.map(p => (
              <span key={p} className="rounded-full border border-navy-100 px-1.5 py-0.5 text-[10px] text-navy-500">{p}</span>
            ))}
          </div>
        </div>

        <div className="shrink-0 text-navy-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--color-app-border)] px-4 pb-4 pt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-500">Indicators</p>
          <ul className="space-y-1">
            {op.indicators.map((ind, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-navy-600">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-navy-300" />
                {ind}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Shared content ──────────────────────────────────────────────────────────

function InfoEnvironmentContent({ data }: { data: InfoEnvironmentData }) {
  const criticalOps = data.infoOperations.filter(o => o.threatLevel === 'critical' || o.threatLevel === 'high');
  const hostileNarratives = data.dominantNarratives.filter(n => n.isHostile);

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Active Narratives',   value: data.dominantNarratives.length,  color: 'text-navy-900',    bg: 'bg-navy-50'    },
          { label: 'Hostile Narratives',  value: hostileNarratives.length,        color: 'text-red-600',     bg: 'bg-red-50'     },
          { label: 'Info Operations',     value: data.infoOperations.length,      color: 'text-orange-600',  bg: 'bg-orange-50'  },
          { label: 'High-Risk Ops',       value: criticalOps.length,              color: 'text-amber-600',   bg: 'bg-amber-50'   },
        ].map((k) => (
          <div key={k.label} className={cn('rounded-xl border border-[var(--color-app-border)] p-4', k.bg)}>
            <div className={cn('text-2xl font-bold', k.color)}>{k.value}</div>
            <div className="text-[11px] text-navy-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Info operations alert */}
      {data.infoOperations.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-semibold text-orange-800">Active Information Operations Detected</span>
          </div>
          <div className="space-y-3">
            {data.infoOperations.map((op, i) => (
              <InfoOpCard key={i} op={op} />
            ))}
          </div>
        </div>
      )}

      {/* Narrative tracker */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-400">Dominant Narratives</h2>
        <div className="space-y-3">
          {data.dominantNarratives.map((n) => (
            <NarrativeCard key={n.id} narrative={n} />
          ))}
        </div>
      </div>

      {/* Platform dynamics */}
      {data.platformDynamics.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-navy-400">Platform Dynamics</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.platformDynamics.map((pd, i) => {
              const risk = THREAT_CONFIG[pd.riskLevel];
              return (
                <div key={i} className={cn('rounded-xl border p-4', risk.border, risk.bg)}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Globe className={cn('h-3.5 w-3.5', risk.color)} />
                      <span className="text-sm font-semibold text-navy-900">{pd.platform}</span>
                    </div>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', risk.color)}>
                      {risk.label} risk
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-navy-600">{pd.dominantTone}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {pd.keyActors.map(a => (
                      <span key={a} className="rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] text-navy-500">{a}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Key amplifiers */}
      {data.keyAmplifiers.length > 0 && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-3 text-sm font-semibold text-navy-900">Key Amplifiers</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.keyAmplifiers.map((amp, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-navy-50 px-3 py-2">
                <span className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  amp.alignment === 'hostile' ? 'bg-red-400' :
                  amp.alignment === 'friendly' ? 'bg-emerald-400' : 'bg-navy-300'
                )} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-navy-700">{amp.name}</p>
                  <p className="text-[10px] text-navy-400">{amp.platform}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall assessment */}
      {data.overallAssessment && (
        <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
          <h3 className="mb-2 text-sm font-semibold text-navy-900">Information Environment Assessment</h3>
          <p className="text-xs leading-relaxed text-navy-600">{data.overallAssessment}</p>
        </div>
      )}

      {/* Counter-messaging recommendations */}
      {data.counterMessagingRecommendations.length > 0 && (
        <div className="rounded-xl border border-diplomatic-blue/20 bg-diplomatic-blue/4 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-diplomatic-blue/70" />
            <h3 className="text-sm font-semibold text-navy-900">Counter-Messaging Recommendations</h3>
          </div>
          <ol className="space-y-2">
            {data.counterMessagingRecommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-navy-600">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-diplomatic-blue/15 text-[9px] font-bold text-diplomatic-blue">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function InfoEnvironmentPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  const [data, setData] = useState<InfoEnvironmentData | null>(null);
  const { hasData, loading: firestoreLoading } = useToolData('info_environment');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const situationId = isDemo ? 'demo' : situation?.id;
    if (situationId) {
      recordActivity({ tool: 'Info Environment', href: '/info-environment', situationId });
    }
  }, [isDemo, situation?.id]);

  if (isDemo) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">Information Environment Monitor</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            Narrative tracking, information operations detection, and counter-messaging — Nordalia Crisis (Demo)
          </p>
        </div>
        <InfoEnvironmentContent data={DEMO_DATA} />
      </div>
    );
  }

  if (showGuard) return <NoSituationState />;

  async function handleRegenerate() {
    if (regenerating || !situation) return;
    setRegenerating(true);
    try {
      await fetch('/api/ai/info-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situationId: situation.id }),
      });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-navy-400" />
            <h1 className="font-serif text-2xl font-normal text-navy-900">Information Environment Monitor</h1>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            {situation?.name
              ? `Narrative tracking, IO detection, and counter-messaging — ${situation.name}`
              : 'Monitor narratives, detect information operations, and develop counter-messaging strategies'}
          </p>
        </div>
        {firestoreLoading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-navy-400 mt-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </span>
        ) : hasData ? (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-navy-100 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-200 disabled:opacity-50 shrink-0"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Radio className="h-3.5 w-3.5" />}
            Regenerate
          </button>
        ) : (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 shrink-0"
          >
            {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate with PRAXIS
          </button>
        )}
      </div>

      <AiPopulate
        toolId="info-environment"
        toolName="Information Environment Scan"
        apiEndpoint="/api/ai/info-environment"
        creditCost={3}
        hasExistingData={hasData || !!data}
        onDataGenerated={(raw) => setData(raw as InfoEnvironmentData)}
      >
        {data ? <InfoEnvironmentContent data={data} /> : null}
      </AiPopulate>
    </div>
  );
}
