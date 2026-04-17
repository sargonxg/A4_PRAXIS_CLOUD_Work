'use client';

/**
 * Early Warning demo / real-mode content component.
 * Extracted from page.tsx to keep the page file under 300 LOC.
 *
 * Receives:
 *   - situation: null in demo mode, Situation in real mode
 *   - aiRiskData: regions returned by /api/ai/risk-assessment (real mode only)
 */

import { useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  CheckCircle,
  Radio,
  Shield,
  Zap,
  Globe,
  TrendingUp,
  Bell,
  BellOff,
  Target,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useConflictStore } from '@/stores/conflict-store';
import { cn } from '@/lib/utils/cn';
import { parseDataStreamChunk } from '@/lib/utils/stream';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import { Badge } from '@/components/ui/badge';
import { EscalationLadder } from '@/components/visualizations/escalation-ladder';
import { TimeSeriesChart } from '@/components/visualizations/time-series-chart';
import { HeatmapGrid } from '@/components/visualizations/heatmap-grid';
import type { Situation } from '@/types/situation';

// ─────────────────────────────────────────────────────────────────────────────
// Exported types
// ─────────────────────────────────────────────────────────────────────────────

export interface RiskRegionData {
  name: string;
  riskScore: number;
  dimensions: { political: number; security: number; humanitarian: number; economic: number; social: number };
  glaslStage: number;
  trend: string;
  forecast: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Glasl 9-Stage Escalation Model Data
// ─────────────────────────────────────────────────────────────────────────────

interface GlaslStage {
  stage: number;
  name: string;
  description: string;
  zone: 'green' | 'amber' | 'red';
}

const GLASL_STAGES: GlaslStage[] = [
  { stage: 9, name: 'Together into the Abyss', description: 'Total destruction acceptable; mutual annihilation', zone: 'red' },
  { stage: 8, name: 'Fragmentation', description: "Systematically destroying opponent's structures and capacity", zone: 'red' },
  { stage: 7, name: 'Limited Destructive Blows', description: 'Opponent dehumanised; treated as object to be eliminated', zone: 'red' },
  { stage: 6, name: 'Strategies of Threats', description: 'Ultimatums and deterrence; coercive demands', zone: 'amber' },
  { stage: 5, name: 'Loss of Face', description: 'Public attacks on identity and legitimacy of opponent', zone: 'amber' },
  { stage: 4, name: 'Images & Coalitions', description: 'Stereotyping hardens; allies recruited; propaganda escalates', zone: 'amber' },
  { stage: 3, name: 'Actions, Not Words', description: 'Fait accompli tactics; communication breaks down', zone: 'green' },
  { stage: 2, name: 'Debates & Polemics', description: 'Verbal confrontation; positions harden into arguments', zone: 'green' },
  { stage: 1, name: 'Hardening', description: 'Positions fix; occasional clashes but dialogue continues', zone: 'green' },
];

const STAGE_ZONE_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  green: { bg: 'bg-sage/10', border: 'border-sage/30', text: 'text-sage', dot: 'bg-sage' },
  amber: { bg: 'bg-gold-500/10', border: 'border-gold-500/30', text: 'text-gold-400', dot: 'bg-gold-500' },
  red: { bg: 'bg-crimson/10', border: 'border-crimson/30', text: 'text-crimson', dot: 'bg-crimson' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Radar chart hardcoded data
// ─────────────────────────────────────────────────────────────────────────────

const RADAR_DIMS = ['Political\nStability', 'Armed\nViolence', 'Humanitarian\nSeverity', 'Economic\nDisruption', 'Social\nCohesion'];
const NORDALIA_RADAR = [7, 8, 6, 5, 4];

const CONFLICT_STAGES: Record<string, number> = {
  'nordalia-crisis': 4,
  'sahel-corridor': 3,
  'south-china-sea': 2,
  'ukraine-russia': 7,
  'sudan-crisis': 8,
};

const MOCK_EVENTS: Record<string, { title: string; date: string }[]> = {
  'nordalia-crisis': [
    { title: 'DRM offensive resumed near Kessara', date: 'Mar 10' },
    { title: 'ICRC access negotiations stalled', date: 'Mar 8' },
    { title: 'Karovia resupply convoy detected', date: 'Mar 6' },
  ],
  'sahel-corridor': [
    { title: 'New arms route identified via Sertania', date: 'Mar 9' },
    { title: 'AU PSC emergency session convened', date: 'Mar 7' },
    { title: 'ECOWAS mediation meeting — Niger', date: 'Mar 5' },
  ],
  'south-china-sea': [
    { title: 'Naval standoff at contested shoal', date: 'Mar 11' },
    { title: 'ASEAN ministerial statement issued', date: 'Mar 8' },
    { title: 'US Freedom of Navigation Operation', date: 'Mar 5' },
  ],
  'ukraine-russia': [
    { title: 'Frontline shifts reported in Zaporizhzhia sector', date: 'Mar 12' },
    { title: 'IAEA Director General visits Zaporizhzhia NPP', date: 'Mar 9' },
    { title: 'New sanctions package adopted by EU', date: 'Mar 7' },
  ],
  'sudan-crisis': [
    { title: 'RSF advances in Gezira state', date: 'Mar 11' },
    { title: 'IPC Phase 5 declared in North Darfur', date: 'Mar 8' },
    { title: 'Jeddah talks suspended indefinitely', date: 'Mar 5' },
  ],
};

const TRIGGERS = [
  { event: 'UNMIN mandate renewal vote', deadline: '47 days', likelihood: 'High', conflict: 'Nordalia', likelihoodColor: 'text-gold-400' },
  { event: 'DRM offensive deadline (March 15)', deadline: '3 days', likelihood: 'Critical', conflict: 'Nordalia', likelihoodColor: 'text-crimson' },
  { event: 'Karovia elections', deadline: '22 days', likelihood: 'Medium', conflict: 'Nordalia', likelihoodColor: 'text-gold-400' },
  { event: 'Sahel peacekeeping rotation', deadline: '14 days', likelihood: 'Medium', conflict: 'Sahel', likelihoodColor: 'text-gold-400' },
  { event: 'SCS patrol incident risk', deadline: 'Ongoing', likelihood: 'Elevated', conflict: 'SCS', likelihoodColor: 'text-crimson' },
  { event: 'Ukraine spring offensive assessment window', deadline: '30 days', likelihood: 'High', conflict: 'Ukraine', likelihoodColor: 'text-crimson' },
  { event: 'Sudan ceasefire review deadline', deadline: '12 days', likelihood: 'Critical', conflict: 'Sudan', likelihoodColor: 'text-crimson' },
  { event: 'UNSC Sudan mandate discussion', deadline: '45 days', likelihood: 'Medium', conflict: 'Sudan', likelihoodColor: 'text-gold-400' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateTrendData(shifted: boolean = false): { date: Date; value: number }[] {
  const today = new Date();
  const points: { date: Date; value: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i * 2);
    const base = shifted ? 45 : 55;
    const noise = Math.sin(i * 0.4 + (shifted ? 1.2 : 0)) * 12 + Math.cos(i * 0.7) * 8;
    const trend = shifted ? (i / 29) * 15 : -(i / 29) * 10;
    points.push({ date, value: Math.max(10, Math.min(95, base + noise + trend)) });
  }
  return points;
}

function generateHeatmapData(): number[][] {
  return [
    [65, 72, 68, 75, 80, 78, 82, 85],
    [45, 52, 58, 62, 70, 75, 72, 78],
    [30, 35, 40, 38, 45, 50, 55, 60],
    [55, 60, 65, 70, 68, 72, 75, 80],
    [20, 25, 28, 32, 38, 42, 45, 50],
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Radar Chart (pure SVG)
// ─────────────────────────────────────────────────────────────────────────────

function RadarChart({ values, labels, maxVal = 10 }: { values: number[]; labels: string[]; maxVal?: number }) {
  const cx = 110, cy = 110, r = 80, n = values.length;
  const axisPoint = (i: number, fraction: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * fraction * Math.cos(angle), y: cy + r * fraction * Math.sin(angle) };
  };
  const dataPoints = values.map((v, i) => { const pt = axisPoint(i, v / maxVal); return `${pt.x},${pt.y}`; }).join(' ');
  const gridRings = [0.25, 0.5, 0.75, 1.0];
  const labelPositions = labels.map((_, i) => axisPoint(i, 1.28));

  return (
    <svg viewBox="0 0 220 220" className="w-full max-w-[220px]">
      {gridRings.map((frac) => {
        const pts = Array.from({ length: n }, (_, i) => { const p = axisPoint(i, frac); return `${p.x},${p.y}`; }).join(' ');
        return <polygon key={frac} points={pts} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />;
      })}
      {Array.from({ length: n }, (_, i) => { const outer = axisPoint(i, 1.0); return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />; })}
      <polygon points={dataPoints} fill="rgba(30,100,200,0.25)" stroke="#1B5299" strokeWidth="1.5" strokeLinejoin="round" />
      {values.map((v, i) => { const pt = axisPoint(i, v / maxVal); return <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#4A90D9" />; })}
      {labels.map((label, i) => {
        const pos = labelPositions[i];
        const lines = label.split('\n');
        return (
          <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fontSize="7.5" fill="#64748B">
            {lines.map((line, li) => <tspan key={li} x={pos.x} dy={li === 0 ? (lines.length > 1 ? '-0.5em' : '0') : '1.1em'}>{line}</tspan>)}
          </text>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Alert Panel
// ─────────────────────────────────────────────────────────────────────────────

function AlertPanel() {
  const alerts = useConflictStore((s) => s.alerts);
  const acknowledgeAlert = useConflictStore((s) => s.acknowledgeAlert);
  const active = alerts.filter((a) => !a.acknowledgedAt);

  if (active.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-sage/30 bg-sage/8 px-5 py-3">
        <CheckCircle className="h-5 w-5 text-sage shrink-0" />
        <div>
          <p className="text-sm font-semibold text-sage">All Clear</p>
          <p className="text-xs text-navy-500">No active alerts requiring acknowledgement.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-crimson/20 bg-crimson/5 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--color-app-border)] px-5 py-3">
        <div className="relative flex h-3 w-3 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-crimson opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-crimson" />
        </div>
        <h2 className="text-sm font-semibold text-crimson">Active Alerts</h2>
        <Badge variant="crimson" className="ml-auto text-[10px]">{active.length} unacknowledged</Badge>
      </div>
      <div className="divide-y divide-[var(--color-app-border-light)]">
        {active.map((alert) => {
          const isHigh = alert.severity === 'high';
          const isMed = alert.severity === 'medium';
          return (
            <div key={alert.id} className={cn('flex items-start gap-3 px-5 py-3', isHigh && 'bg-crimson/5', isMed && 'bg-gold-500/5', !isHigh && !isMed && 'bg-sage/5')}>
              <div className="mt-1 shrink-0">
                {isHigh ? (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-crimson opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-crimson" />
                  </span>
                ) : isMed ? (
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-gold-500" />
                ) : (
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-sage" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-navy-900">{alert.title}</span>
                  <Badge variant={isHigh ? 'crimson' : isMed ? 'gold' : 'sage'} className="text-[9px] uppercase">{alert.severity}</Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-navy-500 line-clamp-2">{alert.description}</p>
                <p className="mt-1 text-[10px] text-navy-500">2h ago</p>
              </div>
              <button onClick={() => acknowledgeAlert(alert.id)} className="shrink-0 flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-2.5 py-1.5 text-[10px] font-medium text-navy-600 transition-colors hover:border-sage/30 hover:text-sage">
                <BellOff className="h-3 w-3" />
                Acknowledge
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Situation Card
// ─────────────────────────────────────────────────────────────────────────────

function SituationCard({ conflict }: { conflict: ReturnType<typeof useConflictStore.getState>['conflicts'][number] }) {
  const [expanded, setExpanded] = useState(false);
  const [assessment, setAssessment] = useState('');
  const [loading, setLoading] = useState(false);
  const alerts = useConflictStore((s) => s.alerts);

  const activeAlerts = alerts.filter((a) => a.conflictId === conflict.id && !a.acknowledgedAt);
  const stage = CONFLICT_STAGES[conflict.id] ?? 2;
  const stageData = GLASL_STAGES.find((s) => s.stage === stage);
  const stageZone = stageData?.zone ?? 'green';
  const stageStyles = STAGE_ZONE_STYLES[stageZone];
  const events = MOCK_EVENTS[conflict.id] ?? [];

  const riskColor = conflict.riskScore > 7 ? 'bg-crimson' : conflict.riskScore > 5 ? 'bg-gold-500' : 'bg-sage';
  const riskTextColor = conflict.riskScore > 7 ? 'text-crimson' : conflict.riskScore > 5 ? 'text-gold-400' : 'text-sage';

  const runAssessment = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setAssessment('');
    const prompt = `You are an early-warning analyst for PRAXIS conflict intelligence. Provide a concise 2-paragraph risk assessment for: ${conflict.name} (${conflict.region}). Risk score: ${conflict.riskScore}/10. Status: ${conflict.status}. Context: ${conflict.description}. Assess current risk level and recommended diplomatic actions.`;
    try {
      const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }) });
      if (!response.ok) throw new Error('Failed');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { text += parsed; setAssessment(text); }
        }
      }
    } catch {
      setAssessment('_Assessment unavailable. Check AI service configuration._');
    } finally {
      setLoading(false);
    }
  }, [conflict, loading]);

  return (
    <div className="w-72 shrink-0 rounded-xl border border-[var(--color-app-border)] bg-white flex flex-col">
      <div className="px-4 pt-4 pb-3 border-b border-[var(--color-app-border-light)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-navy-900 leading-tight">{conflict.name}</h3>
            <p className="mt-0.5 text-[10px] text-navy-500">{conflict.region}</p>
          </div>
          {activeAlerts.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-crimson/15 px-1.5 py-0.5 text-[9px] font-bold text-crimson shrink-0">
              <Bell className="h-2.5 w-2.5" />{activeAlerts.length}
            </span>
          )}
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-navy-500">Risk Score</span>
            <span className={cn('text-sm font-bold tabular-nums', riskTextColor)}>{conflict.riskScore.toFixed(1)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-navy-200">
            <div className={cn('h-full rounded-full transition-all duration-500', riskColor)} style={{ width: `${(conflict.riskScore / 10) * 100}%` }} />
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] text-navy-500">Glasl Stage:</span>
          <span className={cn('rounded-full border px-1.5 py-0.5 text-[9px] font-semibold', stageStyles.bg, stageStyles.border, stageStyles.text)}>
            S{stage} — {stageData?.name}
          </span>
        </div>
      </div>
      <div className="px-4 py-3 flex-1">
        <p className="text-[10px] text-navy-500 font-semibold uppercase tracking-wider mb-2">Recent Events</p>
        <div className="space-y-1.5">
          {events.map((ev, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-navy-400 shrink-0" />
              <p className="flex-1 min-w-0 text-[10px] text-navy-600 leading-tight line-clamp-1">{ev.title}</p>
              <span className="shrink-0 text-[9px] text-navy-500">{ev.date}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 pb-4">
        <button onClick={() => { setExpanded(!expanded); if (!expanded && !assessment) runAssessment(); }} className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold-500/20 bg-gold-500/8 px-3 py-2 text-[10px] font-semibold text-gold-400 transition-colors hover:bg-gold-500/15">
          {loading ? <><Loader2 className="h-3 w-3 animate-spin" />Analyzing...</> : <><Sparkles className="h-3 w-3" />AI Assessment {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}</>}
        </button>
        {expanded && assessment && (
          <div className="mt-2 rounded-lg border border-gold-500/15 bg-[var(--color-app-surface-alt)] p-3">
            <MarkdownRenderer content={assessment} className="text-[11px]" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DemoEarlyWarningPage (exported — used by page.tsx)
// ─────────────────────────────────────────────────────────────────────────────

export function DemoEarlyWarningPage({ situation, aiRiskData }: { situation?: Situation | null; aiRiskData?: RiskRegionData[] }) {
  const conflicts = useConflictStore((s) => s.conflicts);
  const isReal = !!situation;

  const situationName = situation?.name ?? 'Active Situation';
  const situationRegion = situation?.region ?? '';
  const situationActors = situation?.actors ?? [];
  const situationGlaslStage = aiRiskData?.[0]?.glaslStage ?? situation?.glaslStage ?? 4;
  const situationRiskScore = aiRiskData?.[0]?.riskScore != null ? aiRiskData[0].riskScore / 10 : (situation?.riskScore ?? 7.8);

  const [activeStage, setActiveStage] = useState(situationGlaslStage);
  const [isAssessingStage, setIsAssessingStage] = useState(false);
  const [stageAssessment, setStageAssessment] = useState('');
  const [horizonOutput, setHorizonOutput] = useState('');
  const [horizonLoading, setHorizonLoading] = useState(false);
  const [radarConflictId, setRadarConflictId] = useState(isReal ? '__real__' : 'nordalia-crisis');

  const aiDims = aiRiskData?.[0]?.dimensions;
  const radarValues = isReal && aiDims
    ? [aiDims.political / 10, aiDims.security / 10, aiDims.humanitarian / 10, aiDims.economic / 10, aiDims.social / 10]
    : isReal ? [0, 0, 0, 0, 0]
    : (radarConflictId === 'nordalia-crisis' ? NORDALIA_RADAR : [5, 5, 5, 5, 5]);
  const compositeScore = isReal ? situationRiskScore : (radarValues.reduce((a, b) => a + b, 0) / radarValues.length);

  const indicatorTrendSeries = [
    { label: 'Incident Frequency', data: generateTrendData(false), color: '#EF4444' as const },
    { label: 'Intensity Score', data: generateTrendData(true), color: '#F59E0B' as const },
  ];
  const heatmapData = generateHeatmapData();

  const handleAIAssessStage = useCallback(async () => {
    if (isAssessingStage) return;
    setIsAssessingStage(true);
    setStageAssessment('');
    const conflictName = isReal ? situationName : (conflicts.find((c) => c.id === 'nordalia-crisis')?.name ?? 'Nordalia Crisis');
    const conflictRisk = isReal ? situationRiskScore : (conflicts.find((c) => c.id === 'nordalia-crisis')?.riskScore ?? 7.8);
    const conflictStatus = isReal ? situation?.status ?? 'active' : (conflicts.find((c) => c.id === 'nordalia-crisis')?.status ?? 'active');
    const prompt = `You are a conflict analyst using the Glasl escalation model. The current assessed stage for the ${conflictName} is Stage ${activeStage}. Based on the following context: Risk score ${conflictRisk}/10, status: ${conflictStatus}. In ONE sentence, confirm or suggest a different stage (1-9) and briefly explain. End with: "Recommended stage: [number]"`;
    try {
      const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }) });
      if (!response.ok) throw new Error('Failed');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { text += parsed; setStageAssessment(text); }
        }
      }
      const match = text.match(/Recommended stage:\s*(\d)/i);
      if (match) {
        const suggested = parseInt(match[1]);
        if (suggested >= 1 && suggested <= 9) setActiveStage(suggested);
      }
    } catch {
      setStageAssessment('_Stage assessment unavailable._');
    } finally {
      setIsAssessingStage(false);
    }
  }, [isAssessingStage, activeStage, conflicts, isReal, situationName, situationRiskScore, situation?.status]);

  const handleHorizonScan = useCallback(async () => {
    if (horizonLoading) return;
    setHorizonLoading(true);
    setHorizonOutput('');
    const conflictSummary = isReal
      ? `${situationName} (${situationRegion}) — risk score ${situationRiskScore}/10, status: ${situation?.status ?? 'active'}, actors: ${situationActors.join(', ') || 'not specified'}`
      : conflicts.map((c) => `${c.name} (${c.region}) — risk score ${c.riskScore}/10, status: ${c.status}`).join('; ');
    const prompt = `Generate a 30-day horizon scan for ${isReal ? 'this situation' : 'these monitored conflicts'}: ${conflictSummary}. Format with sections: ## Top 3 Risks in Next 30 Days, ## Escalation Triggers to Watch, ## Diplomatic Opportunities. Be specific and analytical.`;
    try {
      const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }) });
      if (!response.ok) throw new Error('Failed');
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          const parsed = parseDataStreamChunk(line);
          if (parsed) { text += parsed; setHorizonOutput(text); }
        }
      }
    } catch {
      setHorizonOutput('_Horizon scan unavailable. Check AI service configuration._');
    } finally {
      setHorizonLoading(false);
    }
  }, [horizonLoading, conflicts, isReal, situationName, situationRegion, situationRiskScore, situation?.status, situationActors]);

  const activeStageData = GLASL_STAGES.find((s) => s.stage === activeStage);
  const activeZoneStyles = activeStageData ? STAGE_ZONE_STYLES[activeStageData.zone] : STAGE_ZONE_STYLES['amber'];

  return (
    <div className="space-y-5 pb-8">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-crimson/10 border border-crimson/20">
            <Shield className="h-5 w-5 text-crimson" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">Early Warning Dashboard</h1>
            <p className="text-xs text-navy-500">Glasl Escalation Model · Risk Radar · AI Horizon Scan</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isReal && (
            <div className="rounded-lg border border-gold-500/20 bg-gold-500/8 px-3 py-1.5 text-[10px] text-gold-400 font-medium">
              DEMO MODE — Nordalia scenario active
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-navy-500">
            <Clock className="h-3 w-3" />
            Updated 5 min ago
          </div>
        </div>
      </div>

      {/* ── Alerts Panel ── */}
      <AlertPanel />

      {/* ── Main 3-Column Layout ── */}
      <div className="grid grid-cols-12 gap-4">

        {/* LEFT: Glasl Escalation Ladder (40%) */}
        <div className="col-span-12 lg:col-span-5 rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
          <div className="border-b border-[var(--color-app-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-crimson shrink-0" />
              <h2 className="text-sm font-bold text-navy-900">Glasl 9-Stage Escalation Model</h2>
            </div>
            <p className="mt-0.5 text-[10px] text-navy-500">Active conflict: {situationName}</p>
            <div className={cn('mt-3 flex items-center gap-2 rounded-lg border px-3 py-2', activeZoneStyles.bg, activeZoneStyles.border)}>
              <span className={cn('h-2 w-2 rounded-full animate-pulse shrink-0', activeZoneStyles.dot)} />
              <span className={cn('text-xs font-semibold', activeZoneStyles.text)}>Stage {activeStage}: {activeStageData?.name}</span>
              <span className="ml-auto text-[10px] text-navy-500">{activeStageData?.description}</span>
            </div>
          </div>
          <div className="p-4">
            <EscalationLadder currentStage={activeStage} interactive={true} onStageClick={(stage: number) => setActiveStage(stage)} />
            <button onClick={handleAIAssessStage} disabled={isAssessingStage} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-diplomatic-blue/30 bg-diplomatic-blue/10 px-4 py-2.5 text-xs font-semibold text-diplomatic-blue transition-colors hover:bg-diplomatic-blue/20 disabled:opacity-50">
              {isAssessingStage ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Assessing stage...</> : <><Sparkles className="h-3.5 w-3.5" />AI Assess Stage</>}
            </button>
            {stageAssessment && (
              <div className="mt-3 rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/5 p-3">
                <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-diplomatic-blue">AI Stage Assessment</p>
                <MarkdownRenderer content={stageAssessment} className="text-[11px]" />
              </div>
            )}
          </div>
        </div>

        {/* CENTER: Risk Radar (35%) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden flex-1">
            <div className="border-b border-[var(--color-app-border)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-diplomatic-blue shrink-0" />
                <h2 className="text-sm font-bold text-navy-900">Risk Indicator Radar</h2>
              </div>
              <div className="mt-2 flex gap-1 flex-wrap">
                {isReal ? (
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-medium border border-diplomatic-blue/50 bg-diplomatic-blue/15 text-diplomatic-blue">{situationName}</span>
                ) : conflicts.map((c) => (
                  <button key={c.id} onClick={() => setRadarConflictId(c.id)} className={cn('rounded-full px-2 py-0.5 text-[9px] font-medium border transition-colors', radarConflictId === c.id ? 'border-diplomatic-blue/50 bg-diplomatic-blue/15 text-diplomatic-blue' : 'border-[var(--color-app-border)] text-navy-500 hover:text-navy-800')}>
                    {c.name.split(' ')[1] ?? c.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center px-4 py-4 gap-4">
              <RadarChart values={radarValues} labels={RADAR_DIMS} />
              <div className="w-full space-y-2">
                {RADAR_DIMS.map((dim, i) => {
                  const val = radarValues[i];
                  const barColor = val >= 8 ? 'bg-crimson' : val >= 6 ? 'bg-gold-500' : 'bg-sage';
                  return (
                    <div key={dim} className="flex items-center gap-2">
                      <span className="w-28 text-[10px] text-navy-500 leading-tight">{dim.replace('\n', ' ')}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-navy-200">
                        <div className={cn('h-full rounded-full', barColor)} style={{ width: `${(val / 10) * 100}%` }} />
                      </div>
                      <span className="w-5 text-right text-[10px] font-mono text-navy-600">{val}</span>
                    </div>
                  );
                })}
              </div>
              <div className="w-full rounded-lg border border-diplomatic-blue/20 bg-diplomatic-blue/8 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-navy-500 font-semibold uppercase tracking-wider">Composite Risk Score</span>
                  <span className="text-lg font-bold text-diplomatic-blue tabular-nums">{compositeScore.toFixed(1)}</span>
                </div>
                <p className="text-[10px] text-navy-500 mt-0.5">Average across all 5 risk dimensions</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Trigger Watchlist (25%) */}
        <div className="col-span-12 lg:col-span-3 rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
          <div className="border-b border-[var(--color-app-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gold-400 shrink-0" />
              <h2 className="text-sm font-bold text-navy-900">Trigger Watchlist</h2>
            </div>
            <p className="mt-0.5 text-[10px] text-navy-500">Events requiring monitoring</p>
          </div>
          <div className="divide-y divide-[var(--color-app-border-light)]">
            {isReal && aiRiskData && aiRiskData.length > 0 ? (
              aiRiskData.map((region, i) => (
                <div key={i} className="px-4 py-3 hover:bg-[var(--color-app-surface-alt)] transition-colors">
                  <p className="text-[11px] font-medium text-navy-700 leading-tight">{region.name}</p>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[9px] text-navy-500"><Target className="h-2.5 w-2.5" />Risk: {region.riskScore}/100</span>
                    <span className={cn('text-[9px] font-bold uppercase', region.trend === 'escalating' ? 'text-crimson' : region.trend === 'de-escalating' ? 'text-sage' : 'text-gold-400')}>{region.trend}</span>
                    <span className="ml-auto text-[9px] text-navy-500 italic">Glasl S{region.glaslStage}</span>
                  </div>
                </div>
              ))
            ) : isReal ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-xs text-navy-500">Trigger events for <span className="font-semibold text-navy-700">{situationName}</span> will appear after AI generation.</p>
              </div>
            ) : TRIGGERS.map((trigger, i) => (
              <div key={i} className="px-4 py-3 hover:bg-[var(--color-app-surface-alt)] transition-colors">
                <p className="text-[11px] font-medium text-navy-700 leading-tight">{trigger.event}</p>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[9px] text-navy-500"><Calendar className="h-2.5 w-2.5" />{trigger.deadline}</span>
                  <span className={cn('text-[9px] font-bold uppercase', trigger.likelihoodColor)}>{trigger.likelihood}</span>
                  <span className="ml-auto text-[9px] text-navy-500 italic">{trigger.conflict}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Indicator Trend Chart ── */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
        <div className="border-b border-[var(--color-app-border)] px-5 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-crimson shrink-0" />
            <h2 className="text-sm font-bold text-navy-900">Warning Indicator Trends (60 days)</h2>
          </div>
          <p className="mt-0.5 text-[10px] text-navy-500">Incident frequency and intensity score over time</p>
        </div>
        <div className="px-5 py-4">
          <TimeSeriesChart series={indicatorTrendSeries} title="" height={180} />
        </div>
      </div>

      {/* ── Indicator Matrix Heatmap ── */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
        <div className="border-b border-[var(--color-app-border)] px-5 py-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-diplomatic-blue shrink-0" />
            <h2 className="text-sm font-bold text-navy-900">Risk Indicator Matrix</h2>
          </div>
          <p className="mt-0.5 text-[10px] text-navy-500">Indicator intensity by category across 8 weeks</p>
        </div>
        <div className="px-5 py-4">
          <HeatmapGrid rows={['Political', 'Military', 'Economic', 'Social', 'Information']} cols={['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8']} data={heatmapData} title="" colorScale="risk" />
        </div>
      </div>

      {/* ── Situation Cards (demo only) ── */}
      {!isReal && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-teal shrink-0" />
            <h2 className="text-sm font-bold text-navy-900">Monitored Situations</h2>
            <span className="text-[10px] text-navy-500">{conflicts.length} active</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {conflicts.map((conflict) => <SituationCard key={conflict.id} conflict={conflict} />)}
          </div>
        </div>
      )}

      {/* ── Horizon Scan ── */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white overflow-hidden">
        <div className="border-b border-[var(--color-app-border)] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-gold-400 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-navy-900">AI Horizon Scan — 30-Day Outlook</h2>
                <p className="text-[10px] text-navy-500">AI-generated forecast across all monitored conflicts</p>
              </div>
            </div>
            <button onClick={handleHorizonScan} disabled={horizonLoading} className="flex shrink-0 items-center gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-2 text-xs font-semibold text-gold-400 transition-colors hover:bg-gold-500/20 disabled:opacity-50">
              {horizonLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Scanning...</> : <><Sparkles className="h-3.5 w-3.5" />Generate Horizon Scan</>}
            </button>
          </div>
        </div>
        <div className="px-5 py-4">
          {!horizonOutput && !horizonLoading && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-gold-500/20 bg-gold-500/8">
                <Sparkles className="h-6 w-6 text-gold-400/60" />
              </div>
              <p className="text-sm text-navy-500">Click &quot;Generate Horizon Scan&quot; to get an AI-powered 30-day outlook</p>
              <p className="mt-1 text-[10px] text-navy-600">
                {isReal ? `Analyzes ${situationName} for risks, triggers, and opportunities` : `Analyzes all ${conflicts.length} monitored conflicts for risks, triggers, and opportunities`}
              </p>
            </div>
          )}
          {horizonLoading && !horizonOutput && (
            <div className="flex items-center justify-center py-10 gap-3 text-gold-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Generating 30-day horizon scan...</span>
            </div>
          )}
          {horizonOutput && (
            <div className="prose max-w-none">
              <MarkdownRenderer content={horizonOutput} className="text-sm" />
              {horizonLoading && <span className="inline-block h-4 w-0.5 animate-pulse bg-gold-400 align-text-bottom ml-0.5" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
