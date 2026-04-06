'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useSituationStore } from '@/stores/situation-store';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { PraxisLink } from '@/components/shared/praxis-link';
import { usePraxisRoute } from '@/lib/utils/routes';
import { usePersistedToolData } from '@/hooks/use-persisted-tool-data';
import {
  GitCompare, ChevronDown, Sparkles, Loader2, ArrowLeftRight, BookOpen,
  Plus, ChevronUp, TrendingUp, BarChart2, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import { HeatmapGrid } from '@/components/visualizations/heatmap-grid';
import type { Situation } from '@/types/situation';

interface CaseData {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'escalating' | 'frozen' | 'resolved';
  riskScore: number;
  actorCount: number;
  eventCount: number;
  glaslStage: number | null;
  escalationTrend: string;
  themes: string[];
  institutions: string[];
  startYear: number;
  endYear?: number;
  description: string;
  primaryConflictType: string;
  // Spider chart dimensions (0-10)
  dimensions: { political: number; security: number; humanitarian: number; economic: number; social: number };
}

// ---------------------------------------------------------------------------
// Demo-only hardcoded cases (shown in /demo path)
// ---------------------------------------------------------------------------
const DEMO_CASES: CaseData[] = [
  {
    id: 'ukraine-russia',
    name: 'Ukraine-Russia Conflict',
    region: 'Eastern Europe',
    status: 'active',
    riskScore: 9.2,
    actorCount: 12,
    eventCount: 156,
    glaslStage: 8,
    escalationTrend: 'stable',
    themes: ['International Armed Conflict', 'Nuclear Deterrence', 'Sanctions', 'War Crimes', 'Energy Security'],
    institutions: ['UNGA', 'UNSC', 'ICJ', 'ICC', 'OSCE', 'NATO', 'EU'],
    startYear: 2022,
    description: 'Full-scale international armed conflict following Russia\'s invasion of Ukraine. Multiple international legal proceedings underway.',
    primaryConflictType: 'Interstate armed conflict with global systemic implications',
    dimensions: { political: 9.0, security: 9.5, humanitarian: 8.5, economic: 8.0, social: 7.5 },
  },
  {
    id: 'sudan-crisis',
    name: 'Sudan Armed Conflict',
    region: 'East Africa / Horn',
    status: 'escalating',
    riskScore: 8.8,
    actorCount: 10,
    eventCount: 89,
    glaslStage: 7,
    escalationTrend: 'escalating',
    themes: ['Internal Armed Conflict', 'Mass Displacement', 'Famine Risk', 'Mediation Failure', 'Regional Spillover'],
    institutions: ['UNSC', 'AU', 'IGAD', 'League of Arab States'],
    startYear: 2023,
    description: 'Armed conflict between SAF and RSF causing one of the world\'s largest displacement crises.',
    primaryConflictType: 'Internal armed conflict with regional spillover',
    dimensions: { political: 8.0, security: 9.0, humanitarian: 9.5, economic: 8.5, social: 8.0 },
  },
  {
    id: 'nordalia',
    name: 'Nordalia Crisis',
    region: 'East Africa',
    status: 'active',
    riskScore: 7.8,
    actorCount: 12,
    eventCount: 47,
    glaslStage: 6,
    escalationTrend: 'escalating',
    themes: ['Electoral Violence', 'Armed Conflict', 'Peace Process', 'Sanctions', 'Humanitarian Crisis'],
    institutions: ['UNSC', 'AU', 'EU', 'UNMN', 'ICC'],
    startYear: 2025,
    description: 'Multi-party political crisis triggered by disputed elections. Government forces and DRM engaged in armed conflict over eastern provincial autonomy and resource control.',
    primaryConflictType: 'Internal armed conflict with regional proxy dimensions',
    dimensions: { political: 8.5, security: 7.5, humanitarian: 8.0, economic: 6.0, social: 7.0 },
  },
  {
    id: 'sahel',
    name: 'Sahel Security Crisis',
    region: 'West Africa',
    status: 'active',
    riskScore: 6.2,
    actorCount: 8,
    eventCount: 31,
    glaslStage: 5,
    escalationTrend: 'stable',
    themes: ['Terrorism', 'Governance Failure', 'Displacement', 'Climate Fragility', 'Cross-Border'],
    institutions: ['AU PSC', 'ECOWAS', 'UN MINUSMA', 'EU'],
    startYear: 2020,
    description: 'Persistent insecurity driven by jihadist groups and governance failures across Mali, Burkina Faso, Niger, and Chad.',
    primaryConflictType: 'Regional insurgency and state fragility',
    dimensions: { political: 7.0, security: 8.5, humanitarian: 7.0, economic: 7.5, social: 6.5 },
  },
  {
    id: 'scs',
    name: 'South China Sea Tensions',
    region: 'East Asia',
    status: 'escalating',
    riskScore: 5.8,
    actorCount: 6,
    eventCount: 23,
    glaslStage: 4,
    escalationTrend: 'escalating',
    themes: ['Maritime Dispute', 'Territorial Conflict', 'Great Power Competition', 'UNCLOS'],
    institutions: ['ASEAN', 'UN', 'US', 'NATO'],
    startYear: 2010,
    description: 'Ongoing territorial disputes and maritime incidents in disputed waters involving competing claims by six parties.',
    primaryConflictType: 'Interstate territorial and maritime dispute',
    dimensions: { political: 7.5, security: 6.0, humanitarian: 2.0, economic: 7.0, social: 4.0 },
  },
  {
    id: 'kolari-borders',
    name: 'Kolari-Barantum Border Dispute',
    region: 'Central Africa',
    status: 'frozen',
    riskScore: 3.2,
    actorCount: 4,
    eventCount: 12,
    glaslStage: 3,
    escalationTrend: 'de-escalating',
    themes: ['Border Dispute', 'Natural Resources', 'Frozen Conflict', 'ICJ Proceedings'],
    institutions: ['AU', 'ICJ'],
    startYear: 2018,
    description: 'Frozen territorial conflict over mineral-rich border region with ICJ proceedings ongoing since 2022.',
    primaryConflictType: 'Interstate border and resource dispute',
    dimensions: { political: 4.0, security: 2.5, humanitarian: 2.0, economic: 5.0, social: 3.0 },
  },
  {
    id: 'meldova-1991',
    name: 'Meldova Civil War (Historical)',
    region: 'Eastern Europe',
    status: 'resolved',
    riskScore: 0,
    actorCount: 5,
    eventCount: 89,
    glaslStage: null,
    escalationTrend: 'resolved',
    themes: ['Civil War', 'Peace Agreement', 'Post-Conflict Reconstruction', 'OSCE Mediation'],
    institutions: ['OSCE', 'UN', 'EU'],
    startYear: 1992,
    endYear: 1997,
    description: 'Historical case: civil war resolved through comprehensive peace agreement brokered by OSCE.',
    primaryConflictType: 'Internal armed conflict \u2014 resolved',
    dimensions: { political: 6.0, security: 7.0, humanitarian: 6.5, economic: 5.5, social: 7.0 },
  },
];

// ---------------------------------------------------------------------------
// Map a real Situation to the CaseData format used by the comparison UI
// ---------------------------------------------------------------------------
const SITUATION_TYPE_LABELS: Record<string, string> = {
  international: 'International conflict',
  civil: 'Civil / internal conflict',
  political: 'Political crisis',
  trade: 'Trade / economic dispute',
  workplace: 'Workplace dispute',
  community: 'Community conflict',
  legal: 'Legal dispute',
  custom: 'Custom situation',
};

function situationToCaseData(s: Situation): CaseData {
  // Map Situation.status + escalationTrend -> CaseData.status
  let status: CaseData['status'] = 'active';
  if (s.status === 'resolved') status = 'resolved';
  else if (s.status === 'archived') status = 'frozen';
  else if (s.escalationTrend === 'escalating') status = 'escalating';

  // Derive spider-chart dimensions from available metadata.
  // riskScore is 0-10 and serves as the baseline. We vary each dimension
  // slightly based on situation type so comparisons are meaningful.
  const base = Math.min(s.riskScore, 10);
  const typeWeights: Record<string, { political: number; security: number; humanitarian: number; economic: number; social: number }> = {
    international: { political: 1.1, security: 1.15, humanitarian: 0.95, economic: 0.9, social: 0.85 },
    civil:         { political: 0.95, security: 1.1, humanitarian: 1.15, economic: 0.85, social: 1.0 },
    political:     { political: 1.2, security: 0.8, humanitarian: 0.7, economic: 0.9, social: 1.1 },
    trade:         { political: 0.8, security: 0.5, humanitarian: 0.4, economic: 1.3, social: 0.7 },
    workplace:     { political: 0.6, security: 0.3, humanitarian: 0.5, economic: 0.9, social: 1.3 },
    community:     { political: 0.7, security: 0.5, humanitarian: 0.8, economic: 0.6, social: 1.3 },
    legal:         { political: 1.0, security: 0.4, humanitarian: 0.5, economic: 1.1, social: 0.8 },
    custom:        { political: 1.0, security: 1.0, humanitarian: 1.0, economic: 1.0, social: 1.0 },
  };
  const w = typeWeights[s.type] ?? typeWeights.custom;
  const clamp = (v: number) => Math.round(Math.min(10, Math.max(0, v)) * 10) / 10;

  // Glasl stage (1-9) influences the security/humanitarian dimensions upward
  const glaslBoost = s.glaslStage ? (s.glaslStage / 9) * 2 : 0;

  const dimensions = {
    political: clamp(base * w.political),
    security: clamp(base * w.security + glaslBoost * 0.7),
    humanitarian: clamp(base * w.humanitarian + glaslBoost * 0.5),
    economic: clamp(base * w.economic),
    social: clamp(base * w.social),
  };

  return {
    id: s.id,
    name: s.name,
    region: s.region || 'Unspecified',
    status,
    riskScore: s.riskScore,
    actorCount: s.actorCount || s.actors.length,
    eventCount: s.documentCount || 0,
    glaslStage: s.glaslStage,
    escalationTrend: s.escalationTrend || 'stable',
    themes: s.actors.slice(0, 5), // Use actor names as stand-in tags
    institutions: [],
    startYear: new Date(s.createdAt).getFullYear(),
    description: s.description,
    primaryConflictType: SITUATION_TYPE_LABELS[s.type] ?? s.type,
    dimensions,
  };
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-crimson',
  escalating: 'text-gold-600',
  frozen: 'text-teal',
  resolved: 'text-sage',
};

// SVG Pentagon (spider/radar) chart
function RadarChart({ dataA, dataB, nameA, nameB, colorA, colorB }: {
  dataA: CaseData['dimensions'];
  dataB: CaseData['dimensions'];
  nameA: string;
  nameB: string;
  colorA: string;
  colorB: string;
}) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = 80;
  const dims: { key: keyof CaseData['dimensions']; label: string }[] = [
    { key: 'political', label: 'Political' },
    { key: 'security', label: 'Security' },
    { key: 'humanitarian', label: 'Humanitarian' },
    { key: 'economic', label: 'Economic' },
    { key: 'social', label: 'Social' },
  ];
  const n = dims.length;

  // Pentagon points (top-facing)
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const getPoint = (i: number, scale: number) => {
    const angle = startAngle + i * angleStep;
    return {
      x: cx + scale * Math.cos(angle),
      y: cy + scale * Math.sin(angle),
    };
  };

  const polygonPoints = (data: CaseData['dimensions'], maxR: number) =>
    dims.map((d, i) => {
      const val = data[d.key] / 10;
      return getPoint(i, val * maxR);
    });

  const toSvgPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

  const ptsA = polygonPoints(dataA, r);
  const ptsB = polygonPoints(dataB, r);

  // Grid rings
  const gridRings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {gridRings.map((scale) => {
          const pts = dims.map((_, i) => getPoint(i, scale * r));
          return <polygon key={scale} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#E2E8F0" strokeWidth="1" />;
        })}
        {/* Spokes */}
        {dims.map((_, i) => {
          const outer = getPoint(i, r);
          return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#E2E8F0" strokeWidth="1" />;
        })}
        {/* Case B polygon (behind) */}
        <path d={toSvgPath(ptsB)} fill={colorB + '25'} stroke={colorB} strokeWidth="1.5" strokeLinejoin="round" />
        {/* Case A polygon (front) */}
        <path d={toSvgPath(ptsA)} fill={colorA + '20'} stroke={colorA} strokeWidth="1.5" strokeLinejoin="round" />
        {/* Axis labels */}
        {dims.map((d, i) => {
          const pt = getPoint(i, r + 22);
          return (
            <text key={d.key} x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#64748B" fontFamily="system-ui" fontWeight="600">
              {d.label}
            </text>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex items-center gap-5 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-6 rounded" style={{ backgroundColor: colorA + '40', border: `2px solid ${colorA}` }} />
          <span className="text-navy-600 font-medium">{nameA}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-6 rounded" style={{ backgroundColor: colorB + '40', border: `2px solid ${colorB}` }} />
          <span className="text-navy-600 font-medium">{nameB}</span>
        </div>
      </div>
    </div>
  );
}

function RiskBar({ score, maxScore = 10 }: { score: number; maxScore?: number }) {
  const pct = (score / maxScore) * 100;
  const color = score >= 7 ? '#A63D40' : score >= 5 ? '#C8961E' : score >= 3 ? '#2E8A8A' : '#5B8C5A';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-[var(--color-app-surface-alt)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-xs font-semibold text-navy-700">{score > 0 ? score.toFixed(1) : '\u2014'}</span>
    </div>
  );
}

function CompRow({ label, a, b, highlight }: { label: string; a: React.ReactNode; b: React.ReactNode; highlight?: boolean }) {
  return (
    <tr className={cn('border-b border-[var(--color-app-border-light)]', highlight && 'bg-gold-500/3')}>
      <td className="py-3 pr-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400 whitespace-nowrap w-36 align-top">{label}</td>
      <td className="py-3 pr-6 text-sm text-navy-800 align-top">{a}</td>
      <td className="py-3 text-sm text-navy-800 align-top">{b}</td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// 8 Comparison Dimensions definition
// ---------------------------------------------------------------------------
const COMP_DIMENSIONS = [
  { key: 'actors',        label: 'Actors',        dimKey: null as null | keyof CaseData['dimensions'] },
  { key: 'escalation',    label: 'Escalation',     dimKey: null as null | keyof CaseData['dimensions'] },
  { key: 'humanitarian',  label: 'Humanitarian',   dimKey: 'humanitarian' as keyof CaseData['dimensions'] },
  { key: 'political',     label: 'Political',      dimKey: 'political' as keyof CaseData['dimensions'] },
  { key: 'economic',      label: 'Economic',       dimKey: 'economic' as keyof CaseData['dimensions'] },
  { key: 'regional',      label: 'Regional',       dimKey: null as null | keyof CaseData['dimensions'] },
  { key: 'historical',    label: 'Historical',     dimKey: null as null | keyof CaseData['dimensions'] },
  { key: 'governance',    label: 'Governance',     dimKey: null as null | keyof CaseData['dimensions'] },
];

function getDimensionScore(dim: typeof COMP_DIMENSIONS[number], c: CaseData): number {
  if (dim.dimKey && c.dimensions[dim.dimKey] != null) {
    return Math.round(c.dimensions[dim.dimKey]);
  }
  // Derived scores for non-dimension keys
  switch (dim.key) {
    case 'actors':
      return Math.min(10, Math.round(c.actorCount * 0.8));
    case 'escalation':
      return c.glaslStage ?? Math.round(c.riskScore);
    case 'regional':
      return Math.round((c.riskScore * 0.7 + (c.institutions.length * 0.4)));
    case 'historical':
      return c.endYear ? 3 : Math.round(c.riskScore * 0.6);
    case 'governance':
      return Math.round((c.dimensions.political + c.dimensions.economic) / 2);
    default:
      return 5;
  }
}

// ---------------------------------------------------------------------------
// Similarity Score
// ---------------------------------------------------------------------------
function computeSimilarity(caseA: CaseData, caseB: CaseData): number {
  let matches = 0;
  COMP_DIMENSIONS.forEach(dim => {
    const a = getDimensionScore(dim, caseA);
    const b = getDimensionScore(dim, caseB);
    if (Math.abs(a - b) <= 2) matches++;
  });
  return Math.round((matches / COMP_DIMENSIONS.length) * 100);
}

// Circular gauge SVG for similarity score
function SimilarityGauge({ pct }: { pct: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? '#10B981' : pct >= 40 ? '#C8961E' : '#A63D40';
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="#E2E8F0" strokeWidth={8} />
        <circle
          cx={50} cy={50} r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={50} y={46} textAnchor="middle" fontSize={18} fontWeight={700} fill="#0F172A" fontFamily="system-ui">
          {pct}%
        </text>
        <text x={50} y={61} textAnchor="middle" fontSize={9} fill="#64748B" fontFamily="system-ui">
          similarity
        </text>
      </svg>
      <p className="text-[10px] font-medium text-navy-500">
        {pct >= 70 ? 'High structural similarity' : pct >= 40 ? 'Moderate similarity' : 'Low similarity'}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Demo timeline events
// ---------------------------------------------------------------------------
interface TimelineEvent {
  year: number;
  label: string;
  type: 'political' | 'military' | 'diplomatic' | 'humanitarian';
}

const EVENT_COLORS: Record<TimelineEvent['type'], string> = {
  political:    'bg-indigo-100 border-indigo-300 text-indigo-700',
  military:     'bg-red-100 border-red-300 text-red-700',
  diplomatic:   'bg-emerald-100 border-emerald-300 text-emerald-700',
  humanitarian: 'bg-amber-100 border-amber-300 text-amber-700',
};

const DEMO_TIMELINES: Record<string, TimelineEvent[]> = {
  'nordalia': [
    { year: 2025, label: 'Disputed elections — DRM alleges fraud', type: 'political' },
    { year: 2025, label: 'AU mediation mission deployed', type: 'diplomatic' },
    { year: 2025, label: 'DRM seizes eastern provincial capital', type: 'military' },
    { year: 2025, label: 'UNSC Resolution 2891 — targeted sanctions', type: 'political' },
    { year: 2025, label: '2M IDPs — OCHA emergency appeal', type: 'humanitarian' },
    { year: 2026, label: 'Ceasefire talks stall — DRM walks out', type: 'diplomatic' },
  ],
  'sudan-crisis': [
    { year: 2023, label: 'SAF-RSF conflict erupts in Khartoum', type: 'military' },
    { year: 2023, label: 'Jeddah negotiations — brief ceasefire', type: 'diplomatic' },
    { year: 2023, label: 'RSF advances into Darfur — mass atrocities', type: 'military' },
    { year: 2024, label: 'Famine declared in North Darfur', type: 'humanitarian' },
    { year: 2024, label: 'AU-IGAD mediation — parallel tracks', type: 'diplomatic' },
    { year: 2025, label: 'SAF recaptures Khartoum districts', type: 'military' },
  ],
  'ukraine-russia': [
    { year: 2022, label: 'Full-scale invasion begins — Feb 24', type: 'military' },
    { year: 2022, label: 'UNGA Resolution ES-11/1 — 141-5 vote', type: 'political' },
    { year: 2022, label: 'Kherson liberated — Ukrainian counteroffensive', type: 'military' },
    { year: 2023, label: 'Wagner mutiny — Prigozhin\'s march on Moscow', type: 'political' },
    { year: 2024, label: 'ICJ jurisdiction ruling on genocide case', type: 'diplomatic' },
    { year: 2025, label: 'Trump administration peace talks initiative', type: 'diplomatic' },
  ],
};

function getTimeline(c: CaseData): TimelineEvent[] {
  if (DEMO_TIMELINES[c.id]) return DEMO_TIMELINES[c.id];
  // Fallback: generic events from case metadata
  return [
    { year: c.startYear, label: `Conflict begins — ${c.primaryConflictType}`, type: 'political' },
    { year: c.startYear, label: `Initial escalation — Glasl stage ${c.glaslStage ?? '?'}`, type: 'military' },
    { year: Math.max(c.startYear + 1, new Date().getFullYear() - 1), label: 'International engagement', type: 'diplomatic' },
    { year: new Date().getFullYear(), label: `Current status: ${c.status} — Risk ${c.riskScore}/10`, type: 'humanitarian' },
  ];
}

// ---------------------------------------------------------------------------
// Transferable Lessons
// ---------------------------------------------------------------------------
interface LessonCard {
  title: string;
  detail: string;
  applicableTo: string;
}

function parseLessons(text: string, caseAName: string, caseBName: string): LessonCard[] {
  // Try to extract numbered/bulleted points
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const lessons: LessonCard[] = [];
  let current: Partial<LessonCard> | null = null;

  for (const line of lines) {
    // Numbered or bulleted start
    if (/^(\d+\.|[-•*])/.test(line.trim())) {
      if (current?.title) lessons.push({ title: current.title, detail: current.detail ?? '', applicableTo: current.applicableTo ?? caseAName });
      const text = line.replace(/^(\d+\.|[-•*])\s*/, '').trim();
      // Split on first colon or period if present
      const colonIdx = text.indexOf(':');
      if (colonIdx > 0 && colonIdx < 60) {
        current = {
          title: text.slice(0, colonIdx).trim(),
          detail: text.slice(colonIdx + 1).trim(),
          applicableTo: caseAName,
        };
      } else {
        current = { title: text.slice(0, 80), detail: text, applicableTo: caseAName };
      }
    } else if (current && line.trim()) {
      current.detail = ((current.detail ?? '') + ' ' + line.trim()).trim();
    }
  }
  if (current?.title) lessons.push({ title: current.title, detail: current.detail ?? '', applicableTo: caseAName });

  // Assign applicableTo alternating
  return lessons.slice(0, 5).map((l, i) => ({
    ...l,
    applicableTo: i % 2 === 0 ? caseAName : caseBName,
  }));
}

// ---------------------------------------------------------------------------
// Inner component — accepts the case list as a prop
// ---------------------------------------------------------------------------
function ComparePageInner({ cases, activeSituationId }: { cases: CaseData[]; activeSituationId?: string }) {
  const searchParams = useSearchParams();
  const initialA = searchParams.get('a') ?? '';
  const initialB = searchParams.get('b') ?? '';

  const [caseAId, setCaseAId] = useState(initialA || (cases[0]?.id ?? ''));
  const [caseBId, setCaseBId] = useState(initialB || (cases[1]?.id ?? ''));
  const [comparison, setComparison] = useState('');
  const [isComparing, setIsComparing] = useState(false);

  // Phase 6 state
  const [lessons, setLessons] = useState<LessonCard[]>([]);
  const [lessonsRaw, setLessonsRaw] = useState('');
  const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTimeline, setShowTimeline] = useState(true);

  // Active situation for context grounding
  const { activeSituation } = useSituationStore();

  // Persist comparison results
  const persisted = usePersistedToolData('compare', activeSituationId);

  // Restore persisted comparison on load
  useEffect(() => {
    if (persisted.data && !comparison) {
      const saved = persisted.data as { caseAId?: string; caseBId?: string; comparison?: string };
      if (saved.comparison) {
        setComparison(saved.comparison);
        if (saved.caseAId && cases.find((c) => c.id === saved.caseAId)) setCaseAId(saved.caseAId);
        if (saved.caseBId && cases.find((c) => c.id === saved.caseBId)) setCaseBId(saved.caseBId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persisted.data]);

  const caseA = cases.find((c) => c.id === caseAId);
  const caseB = cases.find((c) => c.id === caseBId);

  // Similarity score
  const similarity = caseA && caseB ? computeSimilarity(caseA, caseB) : 0;

  // Heatmap data (8 dimensions × 2 cases)
  const heatmapData = useMemo(() => {
    if (!caseA || !caseB) return [];
    return COMP_DIMENSIONS.map(dim => [
      getDimensionScore(dim, caseA),
      getDimensionScore(dim, caseB),
    ]);
  }, [caseA, caseB]);

  const runComparison = useCallback(async () => {
    if (!caseA || !caseB || isComparing || caseAId === caseBId) return;
    setIsComparing(true);
    setComparison('');

    const prompt = `Compare these two conflict cases for a senior conflict analyst:

CASE A: ${caseA.name} (${caseA.region}, ${caseA.startYear}${caseA.endYear ? `\u2013${caseA.endYear}` : '\u2013present'})
Type: ${caseA.primaryConflictType}
Status: ${caseA.status} | Risk: ${caseA.riskScore}/10
Description: ${caseA.description}
Key themes: ${caseA.themes.join(', ')}
Institutions: ${caseA.institutions.join(', ')}

CASE B: ${caseB.name} (${caseB.region}, ${caseB.startYear}${caseB.endYear ? `\u2013${caseB.endYear}` : '\u2013present'})
Type: ${caseB.primaryConflictType}
Status: ${caseB.status} | Risk: ${caseB.riskScore}/10
Description: ${caseB.description}
Key themes: ${caseB.themes.join(', ')}
Institutions: ${caseB.institutions.join(', ')}

Provide a structured comparative analysis with these headers:

## Structural Similarities
What core conflict dynamics are shared? What makes these structurally analogous?

## Key Differences
Where do they diverge most significantly \u2014 causes, actors, internationalization, resolution prospects?

## Applicable Precedents
Which precedents from ${caseB.name} apply to ${caseA.name}? Be specific about lessons, mechanisms, and analogous situations.

## Unique Risk Factors
What makes each case particularly resistant to cross-case learning?

## Practitioner Lessons
5 specific, actionable insights for diplomats or analysts working on ${caseA.name} based on this comparison.

Be analytically specific. Cite conflict resolution theory where relevant. Avoid generic observations.`;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          ...(activeSituation && { situation: activeSituation }),
        }),
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { accumulated += parsed; setComparison(accumulated); }
        }
      }
    } catch {
      setComparison(`**Comparison: ${caseA.name} vs ${caseB.name}**\n\nAI analysis temporarily unavailable. Both conflicts share ${caseA.primaryConflictType === caseB.primaryConflictType ? 'similar conflict typologies' : 'distinct dynamics'} in different regional contexts.`);
    } finally {
      setIsComparing(false);
    }
  }, [caseA, caseB, isComparing, caseAId, caseBId, persisted]);

  // Generate transferable lessons
  const runLessons = useCallback(async () => {
    if (!caseA || !caseB || isGeneratingLessons || caseAId === caseBId) return;
    setIsGeneratingLessons(true);
    setLessons([]);
    setLessonsRaw('');

    const prompt = `You are a conflict resolution specialist. Based on these two conflict cases, identify 4-5 specific, transferable lessons that practitioners can apply cross-case.

CASE A: ${caseA.name} — ${caseA.primaryConflictType} — Risk ${caseA.riskScore}/10
${caseA.description}
Themes: ${caseA.themes.join(', ')}

CASE B: ${caseB.name} — ${caseB.primaryConflictType} — Risk ${caseB.riskScore}/10
${caseB.description}
Themes: ${caseB.themes.join(', ')}

Provide 4-5 transferable lessons in this format:
1. [Concise title]: [2-3 sentence explanation of the lesson and how it transfers between these specific cases]
2. [Concise title]: ...

Focus on actionable insights. Reference specific dynamics of these cases.`;

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          ...(activeSituation && { situation: activeSituation }),
        }),
      });
      if (!response.ok || !response.body) throw new Error();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { accumulated += parsed; setLessonsRaw(accumulated); }
        }
      }
      setLessons(parseLessons(accumulated, caseA.name, caseB.name));
    } catch {
      setLessons([
        {
          title: 'Mediation Timing',
          detail: `Both ${caseA.name} and ${caseB.name} demonstrate that early mediation before military escalation produces better outcomes. Ripeness theory applies: identify the MHS (mutually hurting stalemate) early.`,
          applicableTo: caseA.name,
        },
        {
          title: 'Regional Actor Engagement',
          detail: `Regional organisations played pivotal roles in both cases. Engaging neighbours early — as seen with AU in ${caseB.name} — can establish monitoring frameworks that constrain spoilers.`,
          applicableTo: caseB.name,
        },
      ]);
    } finally {
      setIsGeneratingLessons(false);
    }
  }, [caseA, caseB, isGeneratingLessons, caseAId, caseBId]);

  // Auto-persist when comparison finishes
  useEffect(() => {
    if (comparison && !isComparing && activeSituationId) {
      persisted.save({ caseAId, caseBId, comparison });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComparing]);

  const colorA = '#4B92DB';
  const colorB = '#A63D40';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple/8">
          <GitCompare className="h-5 w-5 text-purple" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Conflict Compare</h1>
          <p className="text-sm text-navy-500">Side-by-side structural analysis with AI-generated comparative insights and radar visualization.</p>
        </div>
      </div>

      {/* Case selectors + Similarity score */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colorA }} />
                Case A
              </span>
            </label>
            <div className="relative">
              <select
                value={caseAId}
                onChange={(e) => setCaseAId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-3 text-sm font-medium text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none"
              >
                {cases.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center justify-center pb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)]">
              <ArrowLeftRight className="h-4 w-4 text-navy-400" />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colorB }} />
                Case B
              </span>
            </label>
            <div className="relative">
              <select
                value={caseBId}
                onChange={(e) => setCaseBId(e.target.value)}
                className="w-full appearance-none rounded-lg border border-[var(--color-app-border)] bg-white px-4 py-3 text-sm font-medium text-navy-900 focus:border-diplomatic-blue/30 focus:outline-none"
              >
                {cases.filter((c) => c.id !== caseAId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Similarity Badge */}
        {caseA && caseB && caseAId !== caseBId && (
          <div className="flex items-center justify-center rounded-xl border border-[var(--color-app-border)] bg-white p-4 lg:w-32">
            <SimilarityGauge pct={similarity} />
          </div>
        )}
      </div>

      {caseA && caseB && caseAId !== caseBId && (
        <>
          {/* Main comparison block */}
          <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
            {/* Data table */}
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-[144px_1fr_1fr] border-b border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] px-5 py-4">
                <div />
                <div className="flex items-center gap-2 pr-6">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colorA }} />
                  <div>
                    <p className="text-xs font-bold text-navy-900">{caseA.name}</p>
                    <p className="text-[11px] text-navy-400">{caseA.region}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colorB }} />
                  <div>
                    <p className="text-xs font-bold text-navy-900">{caseB.name}</p>
                    <p className="text-[11px] text-navy-400">{caseB.region}</p>
                  </div>
                </div>
              </div>
              <div className="px-5 py-2">
                <table className="w-full">
                  <tbody>
                    <CompRow
                      label="Status"
                      a={<span className={cn('capitalize font-semibold', STATUS_COLORS[caseA.status])}>{caseA.status}</span>}
                      b={<span className={cn('capitalize font-semibold', STATUS_COLORS[caseB.status])}>{caseB.status}</span>}
                    />
                    <CompRow
                      label="Risk Score"
                      a={<RiskBar score={caseA.riskScore} />}
                      b={<RiskBar score={caseB.riskScore} />}
                      highlight
                    />
                    <CompRow
                      label="Region"
                      a={<span className="text-navy-700">{caseA.region}</span>}
                      b={<span className="text-navy-700">{caseB.region}</span>}
                    />
                    <CompRow
                      label="Start Year"
                      a={<span className="font-mono">{caseA.startYear}</span>}
                      b={<span className="font-mono">{caseB.startYear}</span>}
                    />
                    <CompRow
                      label="Actor Count"
                      a={<span className="font-mono font-semibold">{caseA.actorCount}</span>}
                      b={<span className="font-mono font-semibold">{caseB.actorCount}</span>}
                      highlight
                    />
                    <CompRow
                      label="Event Count"
                      a={<span className="font-mono">{caseA.eventCount}</span>}
                      b={<span className="font-mono">{caseB.eventCount}</span>}
                    />
                    <CompRow
                      label="Glasl Stage"
                      a={<span className="font-mono font-semibold">{caseA.glaslStage != null ? `${caseA.glaslStage}/9` : '\u2014'}</span>}
                      b={<span className="font-mono font-semibold">{caseB.glaslStage != null ? `${caseB.glaslStage}/9` : '\u2014'}</span>}
                      highlight
                    />
                    <CompRow
                      label="Escalation"
                      a={<span className={cn('text-xs font-medium capitalize', caseA.escalationTrend === 'escalating' ? 'text-crimson' : caseA.escalationTrend === 'de-escalating' ? 'text-sage' : 'text-navy-600')}>{caseA.escalationTrend}</span>}
                      b={<span className={cn('text-xs font-medium capitalize', caseB.escalationTrend === 'escalating' ? 'text-crimson' : caseB.escalationTrend === 'de-escalating' ? 'text-sage' : 'text-navy-600')}>{caseB.escalationTrend}</span>}
                    />
                    <CompRow
                      label="Conflict Type"
                      a={<span className="text-xs text-navy-700">{caseA.primaryConflictType}</span>}
                      b={<span className="text-xs text-navy-700">{caseB.primaryConflictType}</span>}
                      highlight
                    />
                    <CompRow
                      label="Key Themes"
                      a={
                        <div className="flex flex-wrap gap-1">
                          {caseA.themes.slice(0, 3).map((t) => (
                            <span key={t} className="rounded-full border border-[var(--color-app-border-light)] bg-[var(--color-app-surface-alt)] px-2 py-0.5 text-[9px]">{t}</span>
                          ))}
                        </div>
                      }
                      b={
                        <div className="flex flex-wrap gap-1">
                          {caseB.themes.slice(0, 3).map((t) => (
                            <span key={t} className="rounded-full border border-[var(--color-app-border-light)] bg-[var(--color-app-surface-alt)] px-2 py-0.5 text-[9px]">{t}</span>
                          ))}
                        </div>
                      }
                    />
                    <CompRow
                      label="Institutions"
                      a={<span className="text-xs text-navy-700">{caseA.institutions.join(', ') || '\u2014'}</span>}
                      b={<span className="text-xs text-navy-700">{caseB.institutions.join(', ') || '\u2014'}</span>}
                    />
                  </tbody>
                </table>
              </div>
            </div>

            {/* Radar chart */}
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5 flex flex-col items-center justify-center min-w-[260px]">
              <p className="mb-4 text-xs font-semibold text-navy-700">Conflict Dimensions</p>
              <RadarChart
                dataA={caseA.dimensions}
                dataB={caseB.dimensions}
                nameA={caseA.name.split(' ')[0]}
                nameB={caseB.name.split(' ')[0]}
                colorA={colorA}
                colorB={colorB}
              />
              <p className="mt-3 text-[10px] text-navy-400 text-center">Score 0\u201310 across five conflict dimensions</p>
            </div>
          </div>

          {/* ── Phase 6: Comparison Matrix (HeatmapGrid) ─────────────────── */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
            <button
              onClick={() => setShowHeatmap(v => !v)}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-[var(--color-app-surface-alt)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-diplomatic-blue" />
                <p className="text-sm font-semibold text-navy-900">8-Dimension Comparison Matrix</p>
                <span className="text-[10px] text-navy-400">
                  {caseA.name.split(' ')[0]} vs {caseB.name.split(' ')[0]}
                </span>
              </div>
              {showHeatmap ? <ChevronUp className="h-4 w-4 text-navy-400" /> : <ChevronDown className="h-4 w-4 text-navy-400" />}
            </button>

            {showHeatmap && (
              <div className="border-t border-[var(--color-app-border)] p-5">
                <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-navy-500">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded" style={{ backgroundColor: colorA }} />
                    <span>{caseA.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded" style={{ backgroundColor: colorB }} />
                    <span>{caseB.name}</span>
                  </div>
                  <span className="text-[10px] text-navy-400">Score 1–10 per dimension. Diverging scale: red = lower, green = higher.</span>
                </div>
                <HeatmapGrid
                  rows={COMP_DIMENSIONS.map(d => d.label)}
                  cols={[
                    caseA.name.split(' ').slice(0, 2).join(' '),
                    caseB.name.split(' ').slice(0, 2).join(' '),
                  ]}
                  data={heatmapData}
                  colorScale="diverging"
                  showValues={true}
                />
                <p className="mt-3 text-[10px] text-navy-400">
                  Cells show scores 1–10. Colour intensity indicates relative magnitude — diverging scale shows which case scores higher per dimension.
                </p>
              </div>
            )}
          </div>

          {/* ── Phase 6: Parallel Timeline ───────────────────────────────── */}
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
            <button
              onClick={() => setShowTimeline(v => !v)}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-[var(--color-app-surface-alt)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-diplomatic-blue" />
                <p className="text-sm font-semibold text-navy-900">Timeline Comparison</p>
                <span className="text-[10px] text-navy-400">Key events side by side</span>
              </div>
              {showTimeline ? <ChevronUp className="h-4 w-4 text-navy-400" /> : <ChevronDown className="h-4 w-4 text-navy-400" />}
            </button>

            {showTimeline && (
              <div className="border-t border-[var(--color-app-border)] p-5">
                {/* Legend */}
                <div className="mb-4 flex flex-wrap gap-3">
                  {(Object.keys(EVENT_COLORS) as TimelineEvent['type'][]).map(t => (
                    <span key={t} className={cn('rounded-full border px-2 py-0.5 text-[9px] font-semibold capitalize', EVENT_COLORS[t])}>
                      {t}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Case A timeline */}
                  <div>
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-bold text-navy-900">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorA }} />
                      {caseA.name}
                    </p>
                    <div className="relative space-y-3 pl-4">
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-navy-100" />
                      {getTimeline(caseA).map((ev, i) => (
                        <div key={i} className="relative">
                          <div
                            className="absolute -left-4 top-1.5 h-2 w-2 rounded-full border-2 border-white"
                            style={{ backgroundColor: colorA }}
                          />
                          <div className={cn('rounded-lg border px-2.5 py-2', EVENT_COLORS[ev.type])}>
                            <p className="text-[9px] font-bold uppercase tracking-wide opacity-60">{ev.year} · {ev.type}</p>
                            <p className="mt-0.5 text-[10px] font-medium leading-snug">{ev.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Case B timeline */}
                  <div>
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-bold text-navy-900">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorB }} />
                      {caseB.name}
                    </p>
                    <div className="relative space-y-3 pl-4">
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-navy-100" />
                      {getTimeline(caseB).map((ev, i) => (
                        <div key={i} className="relative">
                          <div
                            className="absolute -left-4 top-1.5 h-2 w-2 rounded-full border-2 border-white"
                            style={{ backgroundColor: colorB }}
                          />
                          <div className={cn('rounded-lg border px-2.5 py-2', EVENT_COLORS[ev.type])}>
                            <p className="text-[9px] font-bold uppercase tracking-wide opacity-60">{ev.year} · {ev.type}</p>
                            <p className="mt-0.5 text-[10px] font-medium leading-snug">{ev.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Phase 6: Transferable Lessons ───────────────────────────── */}
          <div className="rounded-xl border border-gold-500/15 bg-white p-5">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gold-600" />
                <p className="text-sm font-semibold text-navy-900">Transferable Lessons</p>
                <span className="text-[10px] text-navy-400">Cross-case insights for practitioners</span>
              </div>
              <button
                onClick={runLessons}
                disabled={isGeneratingLessons}
                className="flex items-center gap-1.5 rounded-lg border border-gold-500/20 bg-gold-500/5 px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-500/10 disabled:opacity-50 transition-colors"
              >
                {isGeneratingLessons ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {lessons.length > 0 ? 'Regenerate' : 'Generate Lessons'}
              </button>
            </div>

            {isGeneratingLessons && lessons.length === 0 && (
              <div className="flex items-center gap-2 py-6 text-sm text-navy-400">
                <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
                Extracting transferable lessons from {caseA.name} and {caseB.name}...
              </div>
            )}

            {lessons.length > 0 && (
              <div className="space-y-2">
                {lessons.map((lesson, i) => (
                  <div key={i} className="rounded-lg border border-navy-100 overflow-hidden">
                    <button
                      onClick={() => setExpandedLesson(expandedLesson === i ? null : i)}
                      className="flex w-full items-start justify-between gap-3 p-3 text-left hover:bg-navy-50 transition-colors"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500/10 text-[10px] font-bold text-gold-700">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy-900">{lesson.title}</p>
                          <span className="mt-0.5 inline-flex items-center rounded-full bg-diplomatic-blue/8 px-2 py-0.5 text-[9px] font-medium text-diplomatic-blue">
                            Applicable to: {lesson.applicableTo.split(' ').slice(0, 2).join(' ')}
                          </span>
                        </div>
                      </div>
                      {expandedLesson === i
                        ? <ChevronUp className="h-4 w-4 shrink-0 text-navy-400 mt-0.5" />
                        : <ChevronDown className="h-4 w-4 shrink-0 text-navy-400 mt-0.5" />
                      }
                    </button>
                    {expandedLesson === i && (
                      <div className="border-t border-navy-100 bg-navy-50/50 px-4 py-3">
                        <p className="text-xs leading-relaxed text-navy-700">{lesson.detail}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isGeneratingLessons && lessons.length === 0 && (
              <div className="rounded-lg border border-dashed border-[var(--color-app-border)] p-6 text-center">
                <TrendingUp className="mx-auto mb-2 h-6 w-6 text-navy-300" />
                <p className="text-sm font-medium text-navy-700 mb-1">AI-powered cross-case lessons</p>
                <p className="text-xs text-navy-500 max-w-sm mx-auto">
                  Generate transferable insights applicable to both cases based on structural analysis and historical precedents.
                </p>
              </div>
            )}
          </div>

          {/* AI Comparative Analysis */}
          <div className="rounded-xl border border-gold-500/15 bg-white p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-600" />
                <p className="text-sm font-semibold text-navy-900">AI Comparative Analysis</p>
                <span className="text-[10px] text-navy-400">
                  {caseA.name} vs {caseB.name}
                </span>
              </div>
              <button
                onClick={runComparison}
                disabled={isComparing}
                className="flex items-center gap-1.5 rounded-lg border border-gold-500/20 bg-gold-500/5 px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-500/10 disabled:opacity-50 transition-colors"
              >
                {isComparing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {comparison ? 'Regenerate Analysis' : 'Generate Comparative Analysis'}
              </button>
            </div>

            {comparison ? (
              <div className="prose prose-sm max-w-none text-navy-700">
                <MarkdownRenderer content={comparison} />
                {isComparing && <span className="inline-block h-4 w-0.5 animate-pulse bg-gold-500 ml-0.5" />}
              </div>
            ) : isComparing ? (
              <div className="flex items-center gap-2 py-8 text-sm text-navy-400">
                <Loader2 className="h-4 w-4 animate-spin text-gold-600" />
                Generating structural comparison between {caseA.name} and {caseB.name}...
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--color-app-border)] p-8 text-center">
                <GitCompare className="mx-auto mb-3 h-7 w-7 text-navy-300" />
                <p className="text-sm font-medium text-navy-700 mb-1">Ready for comparative analysis</p>
                <p className="max-w-md mx-auto text-xs text-navy-500">
                  Click &ldquo;Generate Comparative Analysis&rdquo; to receive an AI-powered structural comparison highlighting similarities, applicable precedents, unique risk factors, and practitioner lessons.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {caseAId === caseBId && (
        <div className="rounded-xl border border-gold-500/15 bg-gold-500/4 p-6 text-center">
          <p className="text-sm font-medium text-navy-700">Please select two different cases to compare.</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PraxisLink href="/cases" className="flex items-center gap-1.5 text-sm text-navy-400 hover:text-navy-600 transition-colors">
          <BookOpen className="h-4 w-4" />
          Back to Case Library
        </PraxisLink>
        <p className="text-[10px] text-navy-400">AI analysis is illustrative and for research purposes only.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimum situations message for real users with < 2 situations
// ---------------------------------------------------------------------------
function NeedMoreSituations({ count }: { count: number }) {
  const router = useRouter();
  const route = usePraxisRoute();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple/10">
        <GitCompare className="h-8 w-8 text-purple" />
      </div>
      <h2 className="mt-6 text-lg font-semibold text-navy-900">
        {count === 0 ? 'No situations yet' : 'Need at least 2 situations'}
      </h2>
      <p className="mt-2 max-w-md text-center text-sm text-navy-500">
        {count === 0
          ? 'Create your first situation to get started. The Compare tool lets you run side-by-side structural analysis across your situations once you have two or more.'
          : 'The Compare tool runs side-by-side structural analysis between two situations. Create one more situation to unlock comparative insights and radar visualization.'}
      </p>
      <button
        onClick={() => router.push(route('/situations/new'))}
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-gold-400"
      >
        <Plus className="h-4 w-4" />
        Create New Situation
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Default export — routes demo vs real users to the right experience
// ---------------------------------------------------------------------------
export default function ComparePage() {
  const { isDemo, showGuard } = useSituationGuard();
  const { situations, activeSituation } = useSituationStore();

  // Convert real user situations to CaseData format (memoised for stability)
  const userCases = useMemo(
    () => situations.map(situationToCaseData),
    [situations],
  );

  // Guard: no active situation selected (real users only)
  if (showGuard) return <NoSituationState />;

  // Demo path: always use the curated demo cases
  if (isDemo) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center p-16">
          <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
        </div>
      }>
        <ComparePageInner cases={DEMO_CASES} activeSituationId={undefined} />
      </Suspense>
    );
  }

  // Real user: need at least 2 situations to compare
  if (userCases.length < 2) {
    return <NeedMoreSituations count={userCases.length} />;
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
      </div>
    }>
      <ComparePageInner cases={userCases} activeSituationId={activeSituation?.id} />
    </Suspense>
  );
}
