'use client';

import { useState, useCallback } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, MapPin, Sparkles, FileText, ChevronDown, ChevronUp, Lightbulb, ArrowRight, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { monitoredSituations } from '@/lib/constants/early-warning-data';
import { MarkdownRenderer } from '@/components/shared/markdown-renderer';
import Link from 'next/link';
import { parseDataStreamChunk } from '@/lib/utils/stream';

const trendConfig = {
  escalating: { label: 'Escalating', icon: TrendingUp, color: 'text-crimson', bg: 'bg-crimson/8' },
  stable: { label: 'Stable', icon: Minus, color: 'text-gold-600', bg: 'bg-gold-500/8' },
  'de-escalating': { label: 'De-escalating', icon: TrendingDown, color: 'text-sage', bg: 'bg-sage/8' },
};

const factorLabels: Record<string, string> = {
  political: 'Political',
  armed: 'Armed Violence',
  humanitarian: 'Humanitarian',
  economic: 'Economic',
  social: 'Social Cohesion',
};

function RiskBar({ value, max = 10, label }: { value: number; max?: number; label?: string }) {
  const pct = (value / max) * 100;
  const color = value >= 8 ? '#A63D40' : value >= 6 ? '#C8961E' : '#5B8C5A';
  return (
    <div>
      {label && <span className="text-[10px] text-navy-500">{label}</span>}
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 rounded-full bg-navy-100">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="text-xs font-mono tabular-nums font-medium" style={{ color }}>{value.toFixed(1)}</span>
      </div>
    </div>
  );
}

function SparklineChart({ data }: { data: number[] }) {
  const min = Math.min(...data) - 0.5;
  const max = Math.max(...data) + 0.5;
  const w = 120;
  const h = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(' ');

  const fillPoints = `0,${h} ${points} ${w},${h}`;
  const lastVal = data[data.length - 1];
  const color = lastVal >= 8 ? '#A63D40' : lastVal >= 6 ? '#C8961E' : '#5B8C5A';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-28">
      <polygon points={fillPoints} fill={color} fillOpacity={0.08} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - ((lastVal - min) / (max - min)) * h} r="2.5" fill={color} />
    </svg>
  );
}

export default function EarlyWarningPage() {
  const sorted = [...monitoredSituations].sort((a, b) => b.riskScore - a.riskScore);
  const critical = sorted.filter((s) => s.riskScore >= 8);
  const elevated = sorted.filter((s) => s.riskScore >= 6 && s.riskScore < 8);
  const moderate = sorted.filter((s) => s.riskScore < 6);
  const [expandedId, setExpandedId] = useState<string | null>(sorted[0]?.id ?? null);
  const [assessments, setAssessments] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const runAssessment = useCallback(async (situation: typeof sorted[0]) => {
    if (loadingId) return;
    setLoadingId(situation.id);
    setAssessments((prev) => ({ ...prev, [situation.id]: '' }));

    const factorSummary = Object.entries(situation.factors)
      .map(([k, v]) => `${k}: ${v}/10`)
      .join(', ');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `You are an early-warning analyst. Provide a concise risk assessment (3-4 paragraphs) for the following conflict situation:\n\nSituation: ${situation.name} (${situation.region})\nRisk Score: ${situation.riskScore}/10\nTrend: ${situation.trend}\nRisk Factors: ${factorSummary}\nRecent Trigger (${situation.triggerSeverity}): ${situation.recentTrigger}\n\nProvide: 1) Current risk assessment, 2) Key escalation drivers, 3) Recommended immediate actions for diplomatic staff.`,
          }],
        }),
      });

      if (!response.ok) throw new Error('AI assessment failed');

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += parseDataStreamChunk(decoder.decode(value, { stream: true }));
        setAssessments((prev) => ({ ...prev, [situation.id]: accumulated }));
      }
    } catch {
      setAssessments((prev) => ({ ...prev, [situation.id]: '_Assessment unavailable. Check AI service configuration._' }));
    } finally {
      setLoadingId(null);
    }
  }, [loadingId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crimson/8">
            <AlertTriangle className="h-5 w-5 text-crimson" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-navy-900">Early Warning Dashboard</h1>
            <p className="text-sm text-navy-500">
              Real-time risk scoring across {monitoredSituations.length} monitored situations with predictive indicators
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-navy-400">
          <Clock className="h-3 w-3" />
          Last updated: 5 min ago
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-crimson/15 bg-crimson/4 p-5">
          <div className="text-3xl font-semibold text-crimson">{critical.length}</div>
          <p className="text-sm text-navy-700 font-medium">Critical Risk (8+)</p>
          <p className="mt-1 text-xs text-navy-500">Requires immediate attention and briefing</p>
        </div>
        <div className="rounded-xl border border-gold-500/15 bg-gold-500/4 p-5">
          <div className="text-3xl font-semibold text-gold-600">{elevated.length}</div>
          <p className="text-sm text-navy-700 font-medium">Elevated Risk (6-8)</p>
          <p className="mt-1 text-xs text-navy-500">Active monitoring and reporting required</p>
        </div>
        <div className="rounded-xl border border-sage/15 bg-sage/4 p-5">
          <div className="text-3xl font-semibold text-sage">{moderate.length}</div>
          <p className="text-sm text-navy-700 font-medium">Moderate Risk (&lt;6)</p>
          <p className="mt-1 text-xs text-navy-500">Routine watch list monitoring</p>
        </div>
      </div>

      {/* Situations */}
      <div className="rounded-xl border border-[var(--color-app-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-app-border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-navy-900">Monitored Situations</h2>
          <span className="text-[10px] text-navy-400">Click a situation to expand details and AI recommendations</span>
        </div>
        <div className="divide-y divide-[var(--color-app-border-light)]">
          {sorted.map((situation) => {
            const trend = trendConfig[situation.trend];
            const TrendIcon = trend.icon;
            const isExpanded = expandedId === situation.id;
            const assessment = assessments[situation.id];
            const isLoading = loadingId === situation.id;

            return (
              <div key={situation.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : situation.id)}
                  className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--color-app-surface-alt)]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-sm font-semibold text-navy-900">{situation.name}</h3>
                      <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', trend.bg, trend.color)}>
                        <TrendIcon className="h-3 w-3" />
                        {trend.label}
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-navy-400">
                        <MapPin className="h-3 w-3" />
                        {situation.region}
                      </span>
                    </div>

                    {/* Risk factors */}
                    <div className="grid grid-cols-5 gap-3 text-[10px]">
                      {(Object.entries(situation.factors) as [string, number][]).map(([key, val]) => (
                        <RiskBar key={key} value={val} label={factorLabels[key] || key} />
                      ))}
                    </div>

                    {/* Recent trigger */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                        situation.triggerSeverity === 'critical' ? 'bg-crimson/10 text-crimson' :
                        situation.triggerSeverity === 'high' ? 'bg-terracotta/10 text-terracotta' :
                        'bg-gold-500/10 text-gold-600'
                      )}>
                        {situation.triggerSeverity}
                      </span>
                      <p className="text-xs text-navy-600">{situation.recentTrigger}</p>
                      <span className="shrink-0 text-[10px] text-navy-400">{situation.triggerDate}</span>
                    </div>
                  </div>

                  {/* Risk score + sparkline */}
                  <div className="shrink-0 text-right">
                    <div className="text-2xl font-semibold tabular-nums" style={{
                      color: situation.riskScore >= 8 ? '#A63D40' : situation.riskScore >= 6 ? '#C8961E' : '#5B8C5A'
                    }}>
                      {situation.riskScore.toFixed(1)}
                    </div>
                    <p className="text-[10px] text-navy-400 mb-1">Risk Score</p>
                    <SparklineChart data={situation.riskHistory} />
                    <p className="text-[10px] text-navy-400 mt-1">90-day trend</p>
                    {isExpanded ? (
                      <ChevronUp className="ml-auto mt-2 h-4 w-4 text-navy-400" />
                    ) : (
                      <ChevronDown className="ml-auto mt-2 h-4 w-4 text-navy-400" />
                    )}
                  </div>
                </button>

                {/* Expanded section */}
                {isExpanded && (
                  <div className="px-5 pb-5">
                    <div className="rounded-xl border border-[var(--color-app-border)] bg-[var(--color-app-surface-alt)] p-4 space-y-4">
                      {/* AI Assessment */}
                      {assessment ? (
                        <div className="rounded-lg border border-gold-500/15 bg-white p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold-500/10">
                              <Sparkles className="h-4 w-4 text-gold-600" />
                            </div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-600">AI Risk Assessment</p>
                            <button
                              onClick={() => runAssessment(situation)}
                              disabled={isLoading}
                              className="ml-auto text-[10px] text-navy-400 hover:text-diplomatic-blue transition-colors"
                            >
                              Regenerate
                            </button>
                          </div>
                          <MarkdownRenderer content={assessment} className="text-sm" />
                          {isLoading && (
                            <span className="inline-block w-0.5 h-4 bg-gold-400 animate-pulse ml-0.5 align-text-bottom" />
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => runAssessment(situation)}
                          disabled={isLoading}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gold-500/20 bg-gold-500/5 px-4 py-3 text-sm font-medium text-gold-700 transition-colors hover:bg-gold-500/10 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Analyzing situation...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Generate AI Risk Assessment
                            </>
                          )}
                        </button>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Link href="/reports/new" className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors">
                          <FileText className="h-3.5 w-3.5" />
                          Generate Situation Report
                        </Link>
                        <Link href="/talking-points" className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors">
                          <Lightbulb className="h-3.5 w-3.5" />
                          Generate Talking Points
                        </Link>
                        <Link href="/stakeholder-map" className="flex items-center gap-1.5 rounded-lg border border-[var(--color-app-border)] bg-white px-3 py-2 text-xs font-medium text-navy-700 hover:border-diplomatic-blue/30 hover:text-diplomatic-blue transition-colors">
                          <ArrowRight className="h-3.5 w-3.5" />
                          View Stakeholder Map
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
