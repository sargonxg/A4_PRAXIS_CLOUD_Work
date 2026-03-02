'use client';

import { AlertTriangle, TrendingUp, TrendingDown, Minus, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { monitoredSituations } from '@/lib/constants/early-warning-data';
import { Badge } from '@/components/ui/badge';

const trendConfig = {
  escalating: { label: 'Escalating', icon: TrendingUp, color: 'text-crimson', bg: 'bg-crimson/10', border: 'border-crimson/20' },
  stable: { label: 'Stable', icon: Minus, color: 'text-gold-400', bg: 'bg-gold-500/10', border: 'border-gold-500/20' },
  'de-escalating': { label: 'De-escalating', icon: TrendingDown, color: 'text-sage', bg: 'bg-sage/10', border: 'border-sage/20' },
};

function RiskBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = value >= 8 ? '#A63D40' : value >= 6 ? '#E8B931' : '#5B8C5A';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-navy-700/50">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono tabular-nums" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  );
}

function SparklineChart({ data }: { data: number[] }) {
  const min = Math.min(...data) - 0.5;
  const max = Math.max(...data) + 0.5;
  const w = 100;
  const h = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');

  const lastVal = data[data.length - 1];
  const color = lastVal >= 8 ? '#A63D40' : lastVal >= 6 ? '#E8B931' : '#5B8C5A';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-6 w-20">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - ((lastVal - min) / (max - min)) * h} r="2" fill={color} />
    </svg>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    critical: { bg: 'bg-crimson/15', text: 'text-crimson' },
    high: { bg: 'bg-terracotta/15', text: 'text-terracotta' },
    medium: { bg: 'bg-gold-500/15', text: 'text-gold-400' },
    low: { bg: 'bg-sage/15', text: 'text-sage' },
  };
  const c = config[severity] || config.medium;
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', c.bg, c.text)}>
      {severity}
    </span>
  );
}

export default function EarlyWarningPage() {
  const sorted = [...monitoredSituations].sort((a, b) => b.riskScore - a.riskScore);
  const critical = sorted.filter((s) => s.riskScore >= 8);
  const elevated = sorted.filter((s) => s.riskScore >= 6 && s.riskScore < 8);
  const moderate = sorted.filter((s) => s.riskScore < 6);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-crimson" />
            <h1 className="text-2xl font-semibold text-navy-50">Early Warning Dashboard</h1>
          </div>
          <p className="mt-1 text-sm text-navy-400">
            Risk scoring across {monitoredSituations.length} monitored situations with predictive indicators
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-crimson/20 bg-crimson/5 p-4">
          <div className="text-2xl font-semibold text-crimson">{critical.length}</div>
          <p className="text-xs text-navy-400">Critical Risk (8+)</p>
        </div>
        <div className="rounded-lg border border-gold-500/20 bg-gold-500/5 p-4">
          <div className="text-2xl font-semibold text-gold-400">{elevated.length}</div>
          <p className="text-xs text-navy-400">Elevated Risk (6-8)</p>
        </div>
        <div className="rounded-lg border border-sage/20 bg-sage/5 p-4">
          <div className="text-2xl font-semibold text-sage">{moderate.length}</div>
          <p className="text-xs text-navy-400">Moderate Risk (&lt;6)</p>
        </div>
      </div>

      {/* Situations table */}
      <div className="rounded-lg border border-navy-700/50 bg-navy-800">
        <div className="border-b border-navy-700/50 px-6 py-4">
          <h2 className="text-base font-semibold text-navy-50">Monitored Situations</h2>
        </div>
        <div className="divide-y divide-navy-700/30">
          {sorted.map((situation) => {
            const trend = trendConfig[situation.trend];
            const TrendIcon = trend.icon;
            return (
              <div key={situation.id} className="px-6 py-4 hover:bg-navy-700/10 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-navy-100">{situation.name}</h3>
                      <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', trend.bg, trend.color)}>
                        <TrendIcon className="h-3 w-3" />
                        {trend.label}
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-navy-500">
                        <MapPin className="h-3 w-3" />
                        {situation.region}
                      </span>
                    </div>

                    {/* Risk factors */}
                    <div className="grid grid-cols-5 gap-3 text-[10px]">
                      {(Object.entries(situation.factors) as [string, number][]).map(([key, val]) => (
                        <div key={key}>
                          <span className="text-navy-500 capitalize">{key}</span>
                          <RiskBar value={val} />
                        </div>
                      ))}
                    </div>

                    {/* Recent trigger */}
                    <div className="mt-3 flex items-start gap-2">
                      <SeverityBadge severity={situation.triggerSeverity} />
                      <p className="text-xs text-navy-400">{situation.recentTrigger}</p>
                      <span className="shrink-0 text-[10px] text-navy-500">{situation.triggerDate}</span>
                    </div>
                  </div>

                  {/* Risk score + sparkline */}
                  <div className="shrink-0 text-right">
                    <div className="text-2xl font-semibold tabular-nums" style={{
                      color: situation.riskScore >= 8 ? '#A63D40' : situation.riskScore >= 6 ? '#E8B931' : '#5B8C5A'
                    }}>
                      {situation.riskScore.toFixed(1)}
                    </div>
                    <p className="text-[10px] text-navy-500 mb-1">Risk Score</p>
                    <SparklineChart data={situation.riskHistory} />
                    <p className="text-[10px] text-navy-600 mt-1">90-day trend</p>
                    <button className="mt-2 flex items-center gap-1 text-[10px] font-medium text-gold-400 hover:text-gold-300">
                      <Sparkles className="h-3 w-3" />
                      Generate Brief
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
