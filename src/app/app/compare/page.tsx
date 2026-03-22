'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PraxisLink } from '@/components/shared/praxis-link';
import { GitCompare, ChevronDown, Sparkles, Loader2, ArrowLeftRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { parseDataStreamChunk } from '@/lib/utils/stream';

interface CaseData {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'escalating' | 'frozen' | 'resolved';
  riskScore: number;
  actorCount: number;
  eventCount: number;
  themes: string[];
  institutions: string[];
  startYear: number;
  endYear?: number;
  description: string;
  primaryConflictType: string;
  // Spider chart dimensions (0-10)
  dimensions: { political: number; security: number; humanitarian: number; economic: number; social: number };
}

const CASES: CaseData[] = [
  {
    id: 'ukraine-russia',
    name: 'Ukraine-Russia Conflict',
    region: 'Eastern Europe',
    status: 'active',
    riskScore: 9.2,
    actorCount: 12,
    eventCount: 156,
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
    themes: ['Civil War', 'Peace Agreement', 'Post-Conflict Reconstruction', 'OSCE Mediation'],
    institutions: ['OSCE', 'UN', 'EU'],
    startYear: 1992,
    endYear: 1997,
    description: 'Historical case: civil war resolved through comprehensive peace agreement brokered by OSCE.',
    primaryConflictType: 'Internal armed conflict — resolved',
    dimensions: { political: 6.0, security: 7.0, humanitarian: 6.5, economic: 5.5, social: 7.0 },
  },
];

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
      <span className="font-mono text-xs font-semibold text-navy-700">{score > 0 ? score.toFixed(1) : '—'}</span>
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

function ComparePageInner() {
  const searchParams = useSearchParams();
  const initialA = searchParams.get('a') ?? '';
  const initialB = searchParams.get('b') ?? '';

  const [caseAId, setCaseAId] = useState(initialA || CASES[0].id);
  const [caseBId, setCaseBId] = useState(initialB || (CASES[1]?.id ?? ''));
  const [comparison, setComparison] = useState('');
  const [isComparing, setIsComparing] = useState(false);

  const caseA = CASES.find((c) => c.id === caseAId);
  const caseB = CASES.find((c) => c.id === caseBId);

  const runComparison = useCallback(async () => {
    if (!caseA || !caseB || isComparing || caseAId === caseBId) return;
    setIsComparing(true);
    setComparison('');

    const prompt = `Compare these two conflict cases for a senior conflict analyst:

CASE A: ${caseA.name} (${caseA.region}, ${caseA.startYear}${caseA.endYear ? `–${caseA.endYear}` : '–present'})
Type: ${caseA.primaryConflictType}
Status: ${caseA.status} | Risk: ${caseA.riskScore}/10
Description: ${caseA.description}
Key themes: ${caseA.themes.join(', ')}
Institutions: ${caseA.institutions.join(', ')}

CASE B: ${caseB.name} (${caseB.region}, ${caseB.startYear}${caseB.endYear ? `–${caseB.endYear}` : '–present'})
Type: ${caseB.primaryConflictType}
Status: ${caseB.status} | Risk: ${caseB.riskScore}/10
Description: ${caseB.description}
Key themes: ${caseB.themes.join(', ')}
Institutions: ${caseB.institutions.join(', ')}

Provide a structured comparative analysis with these headers:

## Structural Similarities
What core conflict dynamics are shared? What makes these structurally analogous?

## Key Differences
Where do they diverge most significantly — causes, actors, internationalization, resolution prospects?

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
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
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
  }, [caseA, caseB, isComparing, caseAId, caseBId]);

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

      {/* Case selectors */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
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
              {CASES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
              {CASES.filter((c) => c.id !== caseAId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400 pointer-events-none" />
          </div>
        </div>
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
                      a={<span className="text-xs text-navy-700">{caseA.institutions.join(', ')}</span>}
                      b={<span className="text-xs text-navy-700">{caseB.institutions.join(', ')}</span>}
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
              <p className="mt-3 text-[10px] text-navy-400 text-center">Score 0–10 across five conflict dimensions</p>
            </div>
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

export default function ComparePage() {

  const { isDemo, showGuard, situation } = useSituationGuard();
  if (showGuard) return <NoSituationState />;
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-navy-400" />
      </div>
    }>
      <ComparePageInner />
    </Suspense>
  );
}
