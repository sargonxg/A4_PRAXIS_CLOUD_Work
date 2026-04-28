'use client';

/**
 * LiveIndicatorsPanel — calls /api/ai/risk-indicators and renders an
 * expandable, mobile-stacking grid of structured indicator cards. Each
 * card carries source badge, trend arrow, severity colour, confidence,
 * and a one-click "Ask PRAXIS about this indicator" deep-link.
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Sparkles, MessageSquare, ExternalLink, ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { PraxisLink } from '@/components/shared/praxis-link';
import { cn } from '@/lib/utils/cn';
import type { Situation } from '@/types/situation';

interface Indicator {
  id: string;
  name: string;
  framework: string;
  value: string;
  unit?: string;
  trend: 'up' | 'down' | 'flat' | 'unknown';
  severity: 'critical' | 'high' | 'elevated' | 'moderate' | 'low' | 'unknown';
  confidence: 'low' | 'medium' | 'high';
  lastUpdated: string;
  sourceUrl?: string;
  sourceLabel?: string;
  rationale: string;
}

interface Payload {
  situationId: string;
  domain: string;
  indicators: Indicator[];
  summary: string;
  generatedAt: string;
}

const SEV_BADGE: Record<Indicator['severity'], string> = {
  critical: 'bg-red-100 text-red-800 ring-red-200',
  high: 'bg-amber-100 text-amber-800 ring-amber-200',
  elevated: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  moderate: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  low: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  unknown: 'bg-slate-100 text-navy-600 ring-slate-200',
};

const TREND_GLYPH: Record<Indicator['trend'], string> = {
  up: '↑',
  down: '↓',
  flat: '→',
  unknown: '·',
};

const TREND_COLOR: Record<Indicator['trend'], string> = {
  up: 'text-red-600',
  down: 'text-emerald-600',
  flat: 'text-amber-600',
  unknown: 'text-navy-400',
};

export function LiveIndicatorsPanel({ situation }: { situation: Situation }) {
  const { user } = useAuth();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const run = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/ai/risk-indicators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, situationId: situation.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const payload = (await res.json()) as Payload;
      setData(payload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Indicator generation failed');
    } finally {
      setLoading(false);
    }
  }, [situation]);

  useEffect(() => {
    // No auto-run — user clicks Generate. Keeps free-tier credit-spend explicit.
  }, [situation.id]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-navy-900">Live indicators</h2>
          <p className="text-xs text-navy-500">
            Domain: <span className="font-medium text-navy-700">{situation.domain ?? 'generic'}</span>
            {' · '}
            Pulled from corpus, ARGUS, grounded search.
            {data ? <span className="ml-2 text-navy-400">Updated {new Date(data.generatedAt).toLocaleString()}</span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading || user?.subscription === 'free' && !!data}
          className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-500/20 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {data ? 'Refresh' : 'Generate'}
        </button>
      </header>

      {err ? <p className="text-xs text-amber-700">{err}</p> : null}

      {data?.summary ? (
        <p className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-navy-700">{data.summary}</p>
      ) : null}

      {data?.indicators?.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.indicators.map((ind) => {
            const open = expanded.has(ind.id);
            return (
              <article
                key={ind.id}
                className={cn(
                  'rounded-lg border bg-white p-3 transition-colors',
                  ind.severity === 'critical' || ind.severity === 'high'
                    ? 'border-red-200'
                    : 'border-slate-200',
                )}
              >
                <header className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold uppercase tracking-wider text-navy-500">{ind.framework}</p>
                    <h3 className="text-sm font-semibold text-navy-900">{ind.name}</h3>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset', SEV_BADGE[ind.severity])}>
                    {ind.severity}
                  </span>
                </header>

                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-semibold tabular-nums text-navy-900">{ind.value}</span>
                  <span className={cn('text-base font-semibold', TREND_COLOR[ind.trend])}>{TREND_GLYPH[ind.trend]}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-navy-500">{ind.unit ? `${ind.unit} · ` : ''}confidence={ind.confidence} · {ind.lastUpdated.slice(0, 10)}</p>

                <button
                  type="button"
                  onClick={() => toggle(ind.id)}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-diplomatic-blue hover:underline"
                >
                  <ChevronDown className={cn('h-3 w-3 transition-transform', open ? 'rotate-180' : '')} />
                  {open ? 'Collapse' : 'Why this number'}
                </button>

                {open ? (
                  <div className="mt-2 space-y-2 border-t border-slate-200 pt-2">
                    <p className="text-xs text-navy-700">{ind.rationale}</p>
                    {ind.sourceUrl ? (
                      <a
                        href={ind.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-diplomatic-blue hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> {ind.sourceLabel ?? 'Open source'}
                      </a>
                    ) : ind.sourceLabel ? (
                      <span className="text-[11px] text-navy-500">Source: {ind.sourceLabel}</span>
                    ) : null}
                    <PraxisLink
                      href={`/app/assistant?q=${encodeURIComponent(`Explain ${ind.name} for ${situation.name}`)}`}
                      className="inline-flex items-center gap-1 text-[11px] text-diplomatic-blue hover:underline"
                    >
                      <MessageSquare className="h-3 w-3" /> Ask PRAXIS about this
                    </PraxisLink>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : !loading && !err ? (
        <p className="text-xs text-navy-500">No indicators yet — click Generate to pull a calibrated set.</p>
      ) : null}
    </section>
  );
}
