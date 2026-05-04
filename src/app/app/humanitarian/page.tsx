'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { NoSituationState } from '@/components/praxis/no-situation-state';
import { ToolInfoPanel } from '@/components/praxis/tool-info-panel';
import { useSearchParams } from 'next/navigation';
import { isSyriaWorkspaceCase, SYRIA_DEMO_SITUATION } from '@/lib/constants/syria-demo-case';
import { SYRIA_HUMANITARIAN_DEMO } from '@/lib/constants/syria-tool-demos';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Heart, Users, Utensils, DollarSign, AlertTriangle,
  Loader2, RefreshCw, Globe, ExternalLink, TrendingUp,
  TrendingDown, Minus, FileText, Home, ChevronDown,
  ChevronUp, Sparkles, X,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { PraxisLink } from '@/components/shared/praxis-link';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { DegradedDataChip } from '@/components/praxis/degraded-data-chip';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import type { Situation } from '@/types/situation';

// ── IPC Phase config ───────────────────────────────────────────────────────────
const IPC_PHASES = [
  { phase: '1', label: 'Minimal',   hex: '#4CAF50', textCls: 'text-green-700' },
  { phase: '2', label: 'Stressed',  hex: '#FDD835', textCls: 'text-yellow-700' },
  { phase: '3', label: 'Crisis',    hex: '#FF9800', textCls: 'text-orange-700' },
  { phase: '4', label: 'Emergency', hex: '#F44336', textCls: 'text-red-700'    },
  { phase: '5', label: 'Famine',    hex: '#212121', textCls: 'text-gray-900'   },
] as const;

const IPC_DESCRIPTIONS: Record<string, string> = {
  '1': 'Households are able to meet essential food and non-food needs without engaging in atypical, unsustainable strategies.',
  '2': 'Households have minimally adequate food consumption but are unable to afford some essential non-food expenditures.',
  '3': 'Households have food consumption gaps that are reflected by high or above-usual acute malnutrition.',
  '4': 'Households have large food consumption gaps resulting in very high acute malnutrition and excess mortality.',
  '5': 'At least 20% of households face an extreme lack of food and/or other basic needs. Starvation, death, and destitution are evident.',
};

// ── Nordalia demo data ─────────────────────────────────────────────────────────
const DEMO_DISPLACEMENT = {
  idps: 1_420_000,
  refugees: 386_000,
  asylumSeekers: 47_200,
  returnees: 12_800,
  idpTrend: 'up' as const,
  refugeeTrend: 'up' as const,
};

const DEMO_FOOD_PHASES = [
  { phase: '1', population: 820_000,   percentage: 14.1 },
  { phase: '2', population: 1_340_000, percentage: 23.0 },
  { phase: '3', population: 1_850_000, percentage: 31.7 },
  { phase: '4', population: 1_280_000, percentage: 22.0 },
  { phase: '5', population: 540_000,   percentage: 9.2  },
];

const DEMO_FUNDING = {
  required: 487_000_000,
  funded:   214_280_000,
  percentage: 44,
  sectors: [
    { name: 'Health',       funded: 38, color: 'bg-blue-400' },
    { name: 'Food',         funded: 62, color: 'bg-emerald-400' },
    { name: 'WASH',         funded: 41, color: 'bg-cyan-400' },
    { name: 'Protection',   funded: 28, color: 'bg-purple-400' },
    { name: 'Shelter',      funded: 19, color: 'bg-amber-400' },
    { name: 'Education',    funded: 33, color: 'bg-pink-400' },
  ],
};

// ── Tool info constants ────────────────────────────────────────────────────────
const TOOL_METHODOLOGY = `The PRAXIS Humanitarian Module aggregates real-time data from OCHA, UNHCR, HDX HAPI, ReliefWeb, and WFP to provide a comprehensive view of humanitarian conditions. All figures follow UN OCHA standards and IASC cluster reporting formats.

Food security is measured using IPC Phase classifications (Phases 1-5), displacement using UNHCR Refugee Data Finder, and funding against published Humanitarian Response Plans (HRP).

Data is refreshed every 30 minutes from live API sources where available, with AI-estimated figures clearly marked.`;

const TOOL_FRAMEWORKS = [
  { name: 'OCHA Humanitarian Principles', citation: 'UN OCHA, 2012 — Humanity, Neutrality, Impartiality, Independence' },
  { name: 'IPC Food Security Phases',      citation: 'Integrated Food Security Phase Classification, IPC Global Partners' },
  { name: 'UNHCR Displacement Categories', citation: 'UNHCR Refugee Data Finder & Population Statistics Database' },
];

const TOOL_SOURCES = [
  { name: 'HDX HAPI',                    status: 'live'      as const },
  { name: 'ReliefWeb',                   status: 'live'      as const },
  { name: 'UNHCR Refugee Data Finder',   status: 'live'      as const },
  { name: 'OCHA Financial Tracking',     status: 'estimated' as const },
];

const TOOL_RELATED = [
  { name: 'Risk Monitor',   href: '/risk-monitor'   },
  { name: 'Early Warning',  href: '/early-warning'  },
  { name: 'Documents',      href: '/documents'      },
];

const HOW_TO_USE: [string, string, string] = [
  'Select a situation — all figures are scoped to the active situation region.',
  'Review IPC food security phases and displacement metrics at the top.',
  'Expand sections to explore funding gaps, sector breakdown, and generate an OCHA-style AI brief.',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
interface HumanitarianData {
  displacement: { idps: number; refugees: number; source: string } | null;
  foodSecurity: { phases: { phase: string; population: number; percentage: number }[] } | null;
  funding: { required: number; funded: number; percentage: number } | null;
  reports: { id: string; title: string; date: string; source: string; url: string }[];
  disasters: { name: string; status: string; date: string }[];
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function formatMoney(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${formatNumber(n)}`;
}

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up')   return <TrendingUp   className="h-3.5 w-3.5 text-red-500" />;
  if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />;
  return <Minus className="h-3.5 w-3.5 text-navy-400" />;
}

function StatCard({
  icon: Icon, label, value, subtitle, color,
}: {
  icon: React.ElementType; label: string; value: string; subtitle?: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-navy-400">{label}</p>
          <p className="text-xl font-bold text-navy-900">{value}</p>
          {subtitle && <p className="text-xs text-navy-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

// ── IPCStackedBar ─────────────────────────────────────────────────────────────
function IPCStackedBar({
  phases,
}: {
  phases: { phase: string; population: number; percentage: number }[];
}) {
  const [ipcOpen, setIpcOpen] = useState(false);
  const total = phases.reduce((s, p) => s + p.population, 0);

  // Build segments with colour info
  const segments = phases.map((p) => {
    const cfg = IPC_PHASES.find((c) => c.phase === p.phase) ?? IPC_PHASES[0];
    return { ...p, hex: cfg.hex, label: cfg.label, textCls: cfg.textCls };
  });

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-navy-700">IPC Food Security Classification</h2>

      {/* Stacked bar */}
      <div className="mb-3 flex h-8 w-full overflow-hidden rounded-lg">
        {segments.map((seg) => (
          <div
            key={seg.phase}
            title={`Phase ${seg.phase}: ${seg.label} — ${formatNumber(seg.population)} (${seg.percentage.toFixed(1)}%)`}
            className="relative flex items-center justify-center overflow-hidden transition-all"
            style={{ width: `${seg.percentage}%`, backgroundColor: seg.hex }}
          >
            {seg.percentage >= 8 && (
              <span className="text-[9px] font-bold text-white drop-shadow px-1 truncate">
                {seg.percentage >= 12
                  ? `${formatNumber(seg.population)}`
                  : `${seg.percentage.toFixed(0)}%`}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((seg) => (
          <div key={seg.phase} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.hex }} />
            <span className="text-[11px] text-navy-600">
              Phase {seg.phase}: <span className="font-medium">{seg.label}</span>
              <span className="ml-1 text-navy-400">({seg.percentage.toFixed(1)}%)</span>
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2 text-[10px] text-navy-400">
        Total population assessed: <span className="font-medium text-navy-600">{formatNumber(total)}</span>
        {' · '}IPC Phase 3+: <span className="font-medium text-orange-600">
          {formatNumber(phases.filter((p) => parseInt(p.phase) >= 3).reduce((s, p) => s + p.population, 0))}
        </span>
      </p>

      {/* "About IPC Phases" accordion */}
      <div className="mt-3 border-t border-[var(--color-app-border)] pt-3">
        <button
          onClick={() => setIpcOpen((v) => !v)}
          className="flex w-full items-center justify-between text-[11px] font-medium text-navy-500 hover:text-navy-700 transition-colors"
        >
          About IPC Phases
          {ipcOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {ipcOpen && (
          <div className="mt-2.5 space-y-2">
            {IPC_PHASES.map((p) => (
              <div key={p.phase} className="flex gap-2.5">
                <span
                  className="mt-0.5 h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: p.hex }}
                />
                <div>
                  <span className={cn('text-[11px] font-semibold', p.textCls)}>
                    Phase {p.phase}: {p.label}
                  </span>
                  <p className="text-[10px] text-navy-500 leading-relaxed mt-0.5">{IPC_DESCRIPTIONS[p.phase]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── DisplacementDashboard ─────────────────────────────────────────────────────
function DisplacementDashboard({
  idps, refugees, asylumSeekers, returnees,
  idpTrend, refugeeTrend,
}: {
  idps: number; refugees: number; asylumSeekers: number; returnees: number;
  idpTrend: 'up' | 'down' | 'flat'; refugeeTrend: 'up' | 'down' | 'flat';
}) {
  const metrics = [
    { icon: Users,    label: 'IDPs',            value: formatNumber(idps),           trend: idpTrend,    color: 'bg-amber-500' },
    { icon: Globe,    label: 'Refugees',         value: formatNumber(refugees),       trend: refugeeTrend, color: 'bg-blue-500' },
    { icon: FileText, label: 'Asylum Seekers',   value: formatNumber(asylumSeekers),  trend: null,        color: 'bg-purple-500' },
    { icon: Home,     label: 'Returnees',        value: formatNumber(returnees),      trend: null,        color: 'bg-emerald-500' },
  ];

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy-700">Displacement Dashboard</h2>
        <span className="text-[10px] text-navy-400">Source: UNHCR Refugee Data Finder</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt,#F8FAFC)] p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', m.color)}>
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                {m.trend && <TrendArrow trend={m.trend} />}
              </div>
              <p className="text-base font-bold text-navy-900">{m.value}</p>
              <p className="text-[10px] text-navy-500 mt-0.5">{m.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── FundingGapBar ─────────────────────────────────────────────────────────────
function FundingGapBar({
  required, funded, percentage,
  sectors,
}: {
  required: number; funded: number; percentage: number;
  sectors: { name: string; funded: number; color: string }[];
}) {
  const gap = 100 - percentage;
  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-navy-700">Humanitarian Funding (OCHA FTS)</h2>

      {/* Main bar */}
      <div className="relative h-7 w-full overflow-hidden rounded-lg bg-red-100">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-semibold text-navy-900 drop-shadow-sm">
            Funded: {formatMoney(funded)} / Required: {formatMoney(required)} — <span className="text-red-700">{gap}% gap</span>
          </span>
        </div>
      </div>

      {/* Sector grid */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {sectors.map((s) => (
          <div key={s.name} className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-medium text-navy-700">{s.name}</span>
              <span className="text-navy-500">{s.funded}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-navy-100">
              <div
                className={cn('h-full rounded-full transition-all', s.color)}
                style={{ width: `${s.funded}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AiHumanitarianBrief ───────────────────────────────────────────────────────
function AiHumanitarianBrief({ situation }: { situation: Situation }) {
  const situationName = situation.name;
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    setContent('');
    setOpen(true);

    const systemPrompt = `You are a UN OCHA Humanitarian Affairs Officer preparing an OCHA-style humanitarian situation report. Use standard UN humanitarian reporting formats. Structure the brief with: 1) Situation Overview, 2) Displacement figures, 3) Food Security (IPC phases), 4) Humanitarian access constraints, 5) Funding status, 6) Priority needs. Be concise, factual, and use IASC cluster terminology.`;
    const userMessage = `Generate a concise OCHA-style humanitarian brief for the ${situationName} situation.`;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          systemOverride: systemPrompt,
          situation,
        }),
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { accumulated += parsed; setContent(accumulated); }
        }
      }
    } catch {
      setContent('**Error**: Unable to generate brief. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [situationName]);

  const cancel = () => {
    readerRef.current?.cancel();
    setIsGenerating(false);
  };

  return (
    <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-app-border)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-diplomatic-blue" />
          <h2 className="text-sm font-semibold text-navy-900">AI Humanitarian Brief</h2>
        </div>
        <div className="flex items-center gap-2">
          {content && !isGenerating && (
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-[11px] text-navy-500 hover:text-navy-700 flex items-center gap-1"
            >
              {open ? <><ChevronUp className="h-3.5 w-3.5" /> Collapse</> : <><ChevronDown className="h-3.5 w-3.5" /> Expand</>}
            </button>
          )}
          {isGenerating && (
            <button onClick={cancel} className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700">
              <X className="h-3.5 w-3.5" /> Stop
            </button>
          )}
          <button
            onClick={generate}
            disabled={isGenerating}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              isGenerating
                ? 'bg-diplomatic-blue/40 text-white cursor-not-allowed'
                : 'bg-diplomatic-blue text-white hover:bg-diplomatic-blue/90 shadow-sm'
            )}
          >
            {isGenerating
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
              : content
                ? <><RefreshCw className="h-3.5 w-3.5" /> Regenerate</>
                : <><Sparkles className="h-3.5 w-3.5" /> Generate OCHA-Style Brief</>
            }
          </button>
        </div>
      </div>

      {/* Output */}
      {isGenerating && !content && (
        <div className="flex items-center gap-2 px-5 py-6 text-sm text-navy-500">
          <Loader2 className="h-4 w-4 animate-spin text-diplomatic-blue" />
          Generating OCHA-style humanitarian brief...
        </div>
      )}

      {content && open && (
        <div className="px-5 py-4 prose prose-sm max-w-none text-navy-700">
          <MarkdownRenderer content={content} />
          {isGenerating && <span className="inline-block h-4 w-0.5 animate-pulse bg-diplomatic-blue ml-0.5" />}
        </div>
      )}

      {!content && !isGenerating && (
        <p className="px-5 py-4 text-xs text-navy-500">
          Click "Generate OCHA-Style Brief" to produce an AI-compiled humanitarian situation report for {situationName}.
        </p>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HumanitarianPage() {
  const { showGuard, situation, isDemo } = useSituationGuard();
  const searchParams = useSearchParams();
  const isSyriaCase = isSyriaWorkspaceCase(searchParams.get('case'), isDemo);
  const effectiveSituation = situation ?? (isDemo && isSyriaCase ? SYRIA_DEMO_SITUATION : null);
  const [data, setData] = useState<HumanitarianData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!situation) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/data/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: situation.region || situation.name,
          query: situation.name,
          limit: 30,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch humanitarian data');
      const intel = await res.json();

      setData({
        displacement: intel.humanitarian?.displacement || null,
        foodSecurity: intel.humanitarian?.foodSecurity ? { phases: intel.humanitarian.foodSecurity } : null,
        funding: intel.humanitarian?.funding || null,
        reports: (intel.events || [])
          .filter((e: { source: string }) => e.source === 'reliefweb')
          .slice(0, 10)
          .map((e: { id: string; title: string; date: string; source: string; url: string }) => ({
            id: e.id, title: e.title, date: e.date, source: e.source, url: e.url,
          })),
        disasters: [],
      });
    } catch (err) {
      setError('Unable to load humanitarian data. Please check your connection.');
      console.error('[humanitarian] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [situation]);

  useEffect(() => {
    if (situation) fetchData();
    else setLoading(false);
  }, [fetchData, situation]);

  if (!effectiveSituation) return <NoSituationState />;
  if (showGuard && !isDemo) return <NoSituationState />;

  // Resolve data. Live API first; Syria demo uses post-Assad seeded figures;
  // generic demo falls back to Nordalia constants. Live mode without data
  // renders an honest degraded state instead of inventing figures.
  const demoFoodPhases   = isSyriaCase ? SYRIA_HUMANITARIAN_DEMO.foodSecurity : DEMO_FOOD_PHASES;
  const demoDisplacement = isSyriaCase ? SYRIA_HUMANITARIAN_DEMO.displacement : DEMO_DISPLACEMENT;
  const demoFunding      = isSyriaCase ? SYRIA_HUMANITARIAN_DEMO.funding      : DEMO_FUNDING;

  const displayFoodPhases =
    data?.foodSecurity?.phases && data.foodSecurity.phases.length > 0
      ? data.foodSecurity.phases
      : isDemo ? demoFoodPhases : null;

  const displayDisplacement = data?.displacement
    ? { ...demoDisplacement, idps: data.displacement.idps, refugees: data.displacement.refugees }
    : isDemo ? demoDisplacement : null;

  const displayFunding = data?.funding
    ? { ...demoFunding, required: data.funding.required, funded: data.funding.funded, percentage: data.funding.percentage }
    : isDemo ? demoFunding : null;

  const displayReports = data?.reports?.length ? data.reports
    : isSyriaCase ? SYRIA_HUMANITARIAN_DEMO.reports
    : [];

  const liveDataMissing = !isDemo && !data?.displacement && !data?.funding && !data?.foodSecurity?.phases?.length;

  const foodInsecureCount = displayFoodPhases
    ? displayFoodPhases.filter((p) => parseInt(p.phase) >= 3).reduce((s, p) => s + p.population, 0)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
            <Heart className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Humanitarian Dashboard</h1>
            <p className="text-sm text-navy-500">
              Live humanitarian data for {effectiveSituation.region || effectiveSituation.name}
            </p>
            <div className="mt-2">
              <DegradedDataChip
                degraded={liveDataMissing}
                missingFeeds={['HDX HAPI', 'ReliefWeb', 'UNHCR', 'OCHA FTS']}
                message="Live humanitarian feeds returned no data — refresh in a moment or check feed health in Settings."
              />
            </div>
          </div>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-navy-200 bg-white px-3 py-2 text-xs font-medium text-navy-600 hover:border-diplomatic-blue/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Tool Info Panel */}
      <ToolInfoPanel
        toolName="Humanitarian Dashboard"
        description="Comprehensive humanitarian monitoring dashboard aggregating displacement, food security, and funding data for the active situation."
        methodology={TOOL_METHODOLOGY}
        frameworks={TOOL_FRAMEWORKS}
        dataSources={TOOL_SOURCES}
        relatedTools={TOOL_RELATED}
        howToUse={HOW_TO_USE}
        lastGenerated={data ? new Date() : null}
        defaultOpen={false}
      />

      {/* Data sources badge */}
      <div className="flex items-center gap-2 text-xs text-navy-400">
        <Globe className="h-3.5 w-3.5" />
        Sources: HDX HAPI, ReliefWeb, UNHCR, WFP, OCHA FTS
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-diplomatic-blue" />
          <span className="ml-3 text-sm text-navy-500">Loading humanitarian data...</span>
        </div>
      ) : error && !isDemo ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-3 text-sm text-red-700">{error}</p>
          <button onClick={fetchData} className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-200">Retry</button>
        </div>
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Internally Displaced"
              value={displayDisplacement ? formatNumber(displayDisplacement.idps) : 'N/A'}
              subtitle="Source: UNHCR"
              color="bg-amber-500"
            />
            <StatCard
              icon={Users}
              label="Refugees"
              value={displayDisplacement ? formatNumber(displayDisplacement.refugees) : 'N/A'}
              subtitle="UNHCR Refugee Data Finder"
              color="bg-blue-500"
            />
            <StatCard
              icon={DollarSign}
              label="Funding Gap"
              value={displayFunding ? `${(100 - displayFunding.percentage).toFixed(0)}%` : 'N/A'}
              subtitle={displayFunding ? `${formatMoney(displayFunding.required)} required` : undefined}
              color="bg-red-500"
            />
            <StatCard
              icon={Utensils}
              label="Food Insecure"
              value={foodInsecureCount !== null ? formatNumber(foodInsecureCount) : 'N/A'}
              subtitle="IPC Phase 3+"
              color="bg-orange-500"
            />
          </div>

          {/* Displacement Dashboard */}
          {displayDisplacement && (
            <DisplacementDashboard
              idps={displayDisplacement.idps}
              refugees={displayDisplacement.refugees}
              asylumSeekers={displayDisplacement.asylumSeekers}
              returnees={displayDisplacement.returnees}
              idpTrend={displayDisplacement.idpTrend}
              refugeeTrend={displayDisplacement.refugeeTrend}
            />
          )}

          {/* IPC Food Security stacked bar */}
          {displayFoodPhases && (
            <IPCStackedBar phases={displayFoodPhases} />
          )}

          {/* Funding Gap Bar */}
          {displayFunding && (
            <FundingGapBar
              required={displayFunding.required}
              funded={displayFunding.funded}
              percentage={displayFunding.percentage}
              sectors={displayFunding.sectors}
            />
          )}

          {/* Syria PRAXIS read */}
          {isSyriaCase && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="flex items-center gap-2 text-emerald-800">
                <Sparkles className="h-4 w-4" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">PRAXIS read</h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-emerald-900">{SYRIA_HUMANITARIAN_DEMO.briefingNote}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-md bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase text-emerald-700">People in Need</p>
                  <p className="text-base font-bold text-emerald-900">{formatNumber(SYRIA_HUMANITARIAN_DEMO.peopleInNeed)}</p>
                </div>
                <div className="rounded-md bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase text-emerald-700">Population Affected</p>
                  <p className="text-base font-bold text-emerald-900">{formatNumber(SYRIA_HUMANITARIAN_DEMO.populationAffected)}</p>
                </div>
                <div className="rounded-md bg-white px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase text-emerald-700">Returnees (since Dec 2024)</p>
                  <p className="text-base font-bold text-emerald-900">{formatNumber(SYRIA_HUMANITARIAN_DEMO.displacement.returnees)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Syria hotspots */}
          {isSyriaCase && (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy-700">Geographic hotspots</h2>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {SYRIA_HUMANITARIAN_DEMO.hotspots.map((h) => (
                  <div key={h.name} className="rounded-md border border-navy-100 bg-navy-50/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-navy-900">{h.name}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        h.risk === 'Critical' ? 'bg-red-100 text-red-700' :
                        h.risk === 'High' ? 'bg-amber-100 text-amber-700' :
                        h.risk === 'Elevated' ? 'bg-orange-100 text-orange-700' :
                        'bg-emerald-100 text-emerald-700'
                      )}>{h.risk}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-navy-500">PIN {formatNumber(h.pin)} · IDPs {formatNumber(h.idp)}</p>
                    <ul className="mt-2 space-y-0.5">
                      {h.drivers.map((d) => (
                        <li key={d} className="text-[11px] text-navy-600">• {d}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cluster table */}
          {isSyriaCase && (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy-700">IASC cluster status</h2>
              <div className="overflow-hidden rounded-md border border-navy-100">
                <table className="w-full text-[12px]">
                  <thead className="bg-navy-50 text-navy-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Cluster</th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Lead</th>
                      <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">Funded</th>
                      <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Top gap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SYRIA_HUMANITARIAN_DEMO.clusters.map((c) => (
                      <tr key={c.cluster} className="border-t border-navy-100">
                        <td className="px-3 py-2 font-medium text-navy-900">{c.cluster}</td>
                        <td className="px-3 py-2 text-navy-600">{c.lead}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold',
                            c.funded >= 35 ? 'bg-emerald-100 text-emerald-700' :
                            c.funded >= 20 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          )}>{c.funded}%</span>
                        </td>
                        <td className="px-3 py-2 text-navy-600">{c.gap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Responder partners */}
          {isSyriaCase && (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy-700">Active humanitarian partners</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {SYRIA_HUMANITARIAN_DEMO.partners.map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-navy-100 bg-navy-50/40 p-3 transition hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-navy-900">{p.name}</p>
                      <ExternalLink className="h-3 w-3 shrink-0 text-navy-400" />
                    </div>
                    <p className="text-[10px] uppercase tracking-wider text-diplomatic-blue">{p.type}</p>
                    <p className="mt-1 text-[11px] leading-snug text-navy-600">{p.role}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* AI Humanitarian Brief */}
          <AiHumanitarianBrief situation={effectiveSituation} />

          {/* Reports */}
          {displayReports && displayReports.length > 0 && (
            <div className="rounded-xl border border-[var(--color-app-border)] bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-navy-700">Latest Humanitarian Reports</h2>
              <div className="space-y-2">
                {displayReports.map((report) => (
                  <a
                    key={report.id}
                    href={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-lg border border-navy-100 p-3 hover:border-diplomatic-blue/20 hover:bg-diplomatic-blue/2 transition-colors"
                  >
                    <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-navy-800 line-clamp-2">{report.title}</p>
                      <p className="mt-0.5 text-[10px] text-navy-400">{report.source} &middot; {report.date}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* No data fallback */}
          {!displayDisplacement && !displayFoodPhases && !displayFunding && (!displayReports || displayReports.length === 0) && (
            <div className="rounded-xl border border-dashed border-navy-200 p-12 text-center">
              <Heart className="mx-auto h-8 w-8 text-navy-300" />
              <p className="mt-3 text-sm font-medium text-navy-600">No humanitarian data available for this region</p>
              <p className="mt-1 text-xs text-navy-400">HDX HAPI data may not cover all countries. Try adjusting the situation region.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
