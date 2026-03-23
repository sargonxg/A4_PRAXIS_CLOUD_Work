'use client';

import { useSituationGuard } from '@/hooks/use-situation-guard';
import { RealToolView } from '@/components/praxis/real-tool-view';
import { AiPopulate } from '@/components/praxis/ai-populate';
import { NoSituationState } from '@/components/praxis/no-situation-state';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { PoweredByTacitus } from '@/components/shared/powered-by-tacitus';
import {
  MONITORED_REGIONS,
  RISK_TIMELINE_DATA,
  type MonitoredRegion,
  type RiskLevel,
  type TrendDirection,
} from '@/lib/constants/risk-monitor-data';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const RISK_LEVEL_STYLES: Record<RiskLevel, { cell: string; badge: string; label: string }> = {
  critical: {
    cell: 'bg-red-500/15 border-red-500/30',
    badge: 'bg-red-500/20 text-red-700 border-red-500/30',
    label: 'Critical',
  },
  high: {
    cell: 'bg-amber-500/15 border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-700 border-amber-500/30',
    label: 'High',
  },
  elevated: {
    cell: 'bg-yellow-500/15 border-yellow-500/30',
    badge: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    label: 'Elevated',
  },
  moderate: {
    cell: 'bg-green-500/15 border-green-500/30',
    badge: 'bg-green-500/20 text-green-700 border-green-500/30',
    label: 'Moderate',
  },
  low: {
    cell: 'bg-emerald-500/15 border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
    label: 'Low',
  },
};

const TREND_META: Record<string, { icon: typeof TrendingUp; label: string; color: string }> = {
  escalating: { icon: TrendingUp, label: 'Escalating', color: 'text-red-600' },
  stable: { icon: Minus, label: 'Stable', color: 'text-amber-600' },
  'de-escalating': { icon: TrendingDown, label: 'De-escalating', color: 'text-green-600' },
};

function TrendIcon({ trend, size = 14 }: { trend: TrendDirection; size?: number }) {
  if (trend === 'up') return <TrendingUp size={size} className="text-red-500" />;
  if (trend === 'down') return <TrendingDown size={size} className="text-green-500" />;
  return <Minus size={size} className="text-navy-400" />;
}

/** Glasl stage bar color: stages 1-3 green, 4-6 amber, 7-9 red */
function glaslBarColor(stageIndex: number): string {
  if (stageIndex <= 3) return 'bg-green-500';
  if (stageIndex <= 6) return 'bg-amber-500';
  return 'bg-red-500';
}

/** Map risk score to SVG gauge arc path */
function gaugeArc(score: number): string {
  const radius = 80;
  const cx = 100;
  const cy = 100;
  const startAngle = Math.PI;
  const endAngle = Math.PI + (score / 100) * Math.PI;
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  const largeArc = score > 50 ? 1 : 0;
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/** Gauge arc stroke color based on score */
function gaugeColor(score: number): string {
  if (score >= 75) return '#ef4444';
  if (score >= 55) return '#f59e0b';
  if (score >= 35) return '#eab308';
  return '#22c55e';
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Risk Trajectory Chart
// ─────────────────────────────────────────────────────────────────────────────

const CHART_W = 500;
const CHART_H = 250;
const CHART_PAD = { top: 15, right: 15, bottom: 30, left: 40 };
const PLOT_W = CHART_W - CHART_PAD.left - CHART_PAD.right;
const PLOT_H = CHART_H - CHART_PAD.top - CHART_PAD.bottom;

function scaleX(day: number): number {
  return CHART_PAD.left + ((day - 1) / 119) * PLOT_W;
}
function scaleY(val: number): number {
  return CHART_PAD.top + PLOT_H - (val / 100) * PLOT_H;
}

function RiskTrajectoryChart() {
  const historicalPoints = RISK_TIMELINE_DATA.filter((d) => d.actual !== undefined);
  const forecastPoints = RISK_TIMELINE_DATA.filter((d) => d.forecast !== undefined);
  const eventPoints = RISK_TIMELINE_DATA.filter((d) => d.event);

  const historicalLine = historicalPoints
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.day)} ${scaleY(d.actual!)}`)
    .join(' ');

  // Connect forecast to last historical point
  const lastHistorical = historicalPoints[historicalPoints.length - 1];
  const forecastLine =
    `M ${scaleX(lastHistorical.day)} ${scaleY(lastHistorical.actual!)} ` +
    forecastPoints
      .map((d) => `L ${scaleX(d.day)} ${scaleY(d.forecast!)}`)
      .join(' ');

  // Confidence interval polygon
  const confidencePolygon =
    forecastPoints.map((d) => `${scaleX(d.day)},${scaleY(d.confidenceHigh!)}`).join(' ') +
    ' ' +
    [...forecastPoints].reverse().map((d) => `${scaleX(d.day)},${scaleY(d.confidenceLow!)}`).join(' ');

  // Grid lines
  const yGridValues = [0, 25, 50, 75, 100];
  const xGridDays = [1, 30, 60, 90, 120];

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full h-auto" aria-label="Risk trajectory chart">
      {/* Grid lines */}
      {yGridValues.map((v) => (
        <g key={`y-${v}`}>
          <line
            x1={CHART_PAD.left}
            y1={scaleY(v)}
            x2={CHART_W - CHART_PAD.right}
            y2={scaleY(v)}
            stroke="#e2e8f0"
            strokeWidth={0.5}
          />
          <text x={CHART_PAD.left - 6} y={scaleY(v) + 3} textAnchor="end" fontSize={9} fill="#94a3b8">
            {v}
          </text>
        </g>
      ))}
      {xGridDays.map((d) => (
        <g key={`x-${d}`}>
          <line
            x1={scaleX(d)}
            y1={CHART_PAD.top}
            x2={scaleX(d)}
            y2={CHART_H - CHART_PAD.bottom}
            stroke="#e2e8f0"
            strokeWidth={0.5}
          />
          <text x={scaleX(d)} y={CHART_H - CHART_PAD.bottom + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">
            Day {d}
          </text>
        </g>
      ))}

      {/* Forecast divider */}
      <line
        x1={scaleX(90)}
        y1={CHART_PAD.top}
        x2={scaleX(90)}
        y2={CHART_H - CHART_PAD.bottom}
        stroke="#94a3b8"
        strokeWidth={0.8}
        strokeDasharray="4 3"
      />
      <text x={scaleX(90) + 4} y={CHART_PAD.top + 10} fontSize={8} fill="#94a3b8">
        Forecast
      </text>

      {/* Confidence interval */}
      <polygon points={confidencePolygon} fill="#3b82f6" opacity={0.12} />

      {/* Historical line */}
      <path d={historicalLine} fill="none" stroke="#3b82f6" strokeWidth={1.8} />

      {/* Forecast line */}
      <path d={forecastLine} fill="none" stroke="#3b82f6" strokeWidth={1.8} strokeDasharray="6 4" />

      {/* Event markers */}
      {eventPoints.map((d) => {
        const cx = scaleX(d.day);
        const cy = scaleY(d.actual ?? d.forecast ?? 0);
        return (
          <g key={d.day}>
            <circle cx={cx} cy={cy} r={4} fill="#f59e0b" stroke="#fff" strokeWidth={1.2} />
            <title>{`Day ${d.day}: ${d.event}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-score bar
// ─────────────────────────────────────────────────────────────────────────────

function SubScoreBar({ label, value }: { label: string; value: number }) {
  const barColor =
    value >= 75 ? 'bg-red-500' : value >= 55 ? 'bg-amber-500' : value >= 35 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-navy-500 capitalize shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-navy-100 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-xs text-navy-600 text-right font-medium">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

function DemoRiskMonitorPage({ situationName }: { situationName?: string }) {

  const [selectedRegion, setSelectedRegion] = useState<MonitoredRegion | null>(null);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20">
          <BarChart3 size={20} className="text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-serif font-semibold text-navy-900">Risk Heatmap &amp; Conflict Forecasting</h1>
          <p className="text-sm text-navy-500">
            Monitoring 8 conflict-affected regions with AI-assisted risk scoring and 30-day forecasts
          </p>
        </div>
      </div>

      {/* ─── Heatmap Grid ─── */}
      <section>
        <div className="grid grid-cols-4 gap-3">
          {MONITORED_REGIONS.map((region) => {
            const style = RISK_LEVEL_STYLES[region.riskLevel];
            const trendMeta = TREND_META[region.escalationTrend];
            const TrendIc = trendMeta.icon;
            const isSelected = selectedRegion?.id === region.id;

            return (
              <button
                key={region.id}
                onClick={() => setSelectedRegion(region)}
                className={cn(
                  'relative rounded-xl border p-4 text-left transition-all',
                  style.cell,
                  isSelected
                    ? 'ring-2 ring-navy-500 ring-offset-1 shadow-md'
                    : 'hover:shadow-sm hover:brightness-95',
                )}
              >
                {/* Pulse overlay for critical */}
                {region.riskLevel === 'critical' && (
                  <div className="absolute inset-0 rounded-xl bg-red-500/5 animate-pulse pointer-events-none" />
                )}

                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-navy-800">{region.name}</span>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                        style.badge,
                      )}
                    >
                      {style.label}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold text-navy-900 tabular-nums">{region.riskScore}</span>
                    <div className={cn('flex items-center gap-1 text-xs font-medium', trendMeta.color)}>
                      <TrendIc size={14} />
                      <span>{trendMeta.label}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-navy-500">
                    Glasl Stage {region.glaslStage}/9
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 py-2">
          {(['critical', 'high', 'elevated', 'moderate', 'low'] as RiskLevel[]).map((level) => (
            <div key={level} className="flex items-center gap-1.5">
              <div
                className={cn('w-3 h-3 rounded-sm border', RISK_LEVEL_STYLES[level].cell)}
              />
              <span className="text-[10px] text-navy-500 capitalize">{level}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Region Detail ─── */}
      <section
        className={cn(
          'rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] overflow-hidden transition-all',
          !selectedRegion && 'py-12',
        )}
      >
        {!selectedRegion ? (
          <div className="flex flex-col items-center justify-center gap-2 text-navy-400">
            <BarChart3 size={28} />
            <p className="text-sm">Select a region above to view detailed risk assessment</p>
          </div>
        ) : (
          <RegionDetail region={selectedRegion} situationName={situationName} />
        )}
      </section>
      <PoweredByTacitus />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Region Detail Panel
// ─────────────────────────────────────────────────────────────────────────────

function RegionDetail({ region, situationName }: { region: MonitoredRegion; situationName?: string }) {
  const style = RISK_LEVEL_STYLES[region.riskLevel];
  const trendMeta = TREND_META[region.escalationTrend];
  const TrendIc = trendMeta.icon;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* ─── Left Column ─── */}
      <div className="flex flex-col gap-5">
        {/* Region name + badges */}
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-serif font-semibold text-navy-900">{region.name}</h2>
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase',
              style.badge,
            )}
          >
            {style.label}
          </span>
          <span className={cn('flex items-center gap-1 text-xs font-medium', trendMeta.color)}>
            <TrendIc size={14} />
            {trendMeta.label}
          </span>
        </div>

        {/* Glasl Stage Meter */}
        <div>
          <div className="text-xs text-navy-500 mb-1.5">
            Glasl Escalation Model — Stage {region.glaslStage} of 9
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 9 }, (_, i) => {
              const stageNum = i + 1;
              const filled = stageNum <= region.glaslStage;
              return (
                <div
                  key={stageNum}
                  className={cn(
                    'flex-1 h-3 rounded-sm transition-colors',
                    filled ? glaslBarColor(stageNum) : 'bg-navy-100',
                  )}
                  title={`Stage ${stageNum}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-[9px] text-green-600">Win-Win</span>
            <span className="text-[9px] text-amber-600">Win-Lose</span>
            <span className="text-[9px] text-red-600">Lose-Lose</span>
          </div>
        </div>

        {/* Semicircular Gauge */}
        <div className="flex justify-center">
          <svg viewBox="0 0 200 120" className="w-56 h-auto">
            {/* Background arc */}
            <path
              d={gaugeArc(100)}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={14}
              strokeLinecap="round"
            />
            {/* Value arc */}
            <path
              d={gaugeArc(region.riskScore)}
              fill="none"
              stroke={gaugeColor(region.riskScore)}
              strokeWidth={14}
              strokeLinecap="round"
            />
            {/* Score text */}
            <text x={100} y={95} textAnchor="middle" fontSize={28} fontWeight="bold" fill="#0f172a">
              {region.riskScore}
            </text>
            <text x={100} y={112} textAnchor="middle" fontSize={10} fill="#64748b">
              Risk Score
            </text>
          </svg>
        </div>

        {/* Sub-scores */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-medium text-navy-600 uppercase tracking-wide">Sub-Scores</div>
          {(Object.entries(region.subScores) as [string, number][]).map(([key, value]) => (
            <SubScoreBar key={key} label={key} value={value} />
          ))}
        </div>

        {/* Key Indicators */}
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-medium text-navy-600 uppercase tracking-wide">Key Indicators</div>
          {region.keyIndicators.map((ind, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-white/60 border border-[var(--color-app-border-light)]"
            >
              <span className="text-xs text-navy-600">{ind.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-navy-800">{ind.value}</span>
                <TrendIcon trend={ind.trend} size={12} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right Column ─── */}
      <div className="flex flex-col gap-5">
        {/* 30-day Forecast */}
        <div>
          <div className="text-xs font-medium text-navy-600 uppercase tracking-wide mb-1.5">
            30-Day Forecast
          </div>
          <p className="text-sm text-navy-700 leading-relaxed">{region.forecast30Day}</p>
        </div>

        {/* Risk Trajectory Chart */}
        <div>
          <div className="text-xs font-medium text-navy-600 uppercase tracking-wide mb-2">
            Risk Trajectory ({situationName ?? 'Nordalia'} Benchmark)
          </div>
          <div className="rounded-lg border border-[var(--color-app-border)] bg-white p-3">
            <RiskTrajectoryChart />
            {/* Chart legend */}
            <div className="flex items-center justify-center gap-5 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 bg-blue-500 rounded-full" />
                <span className="text-[10px] text-navy-500">Historical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-0.5 bg-blue-500 rounded-full border-dashed" style={{ borderTop: '2px dashed #3b82f6', height: 0 }} />
                <span className="text-[10px] text-navy-500">Forecast</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-blue-500/15" />
                <span className="text-[10px] text-navy-500">Confidence Interval</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[10px] text-navy-500">Event</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Real mode wrapper — separates demo data from situation-specific data
// ============================================================================

export default function RiskMonitorPage() {
  const { isDemo, showGuard, situation } = useSituationGuard();
  
  // Demo mode — render with hardcoded demo data
  if (isDemo) return <DemoRiskMonitorPage />;

  // No situation selected
  if (showGuard || !situation) return <NoSituationState />;

  // Real mode — AI populate prompt, then show tool
  return (
    <AiPopulate
      toolId="risk-monitor"
      toolName="Risk Monitor"
      apiEndpoint="/api/ai/risk-assessment"
      creditCost={3}
      hasExistingData={false}
      onDataGenerated={() => {}}
    >
      <DemoRiskMonitorPage situationName={situation.name} />
    </AiPopulate>
  );
}
