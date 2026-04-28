'use client';

/**
 * LiveEventsPanel — calls /api/ai/timeline-events and renders an
 * interactive, expandable timeline of grounded events. Filters by type,
 * severity, and actor; events expand inline to show details + sources.
 */

import { useCallback, useMemo, useState } from 'react';
import { Loader2, Sparkles, MessageSquare, ExternalLink, ChevronDown, Filter } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { cn } from '@/lib/utils/cn';
import type { Situation } from '@/types/situation';

interface EventItem {
  id: string;
  ts: string;
  title: string;
  summary: string;
  type: string;
  severity: 'critical' | 'high' | 'elevated' | 'moderate' | 'low' | 'unknown';
  actors: string[];
  location?: string;
  sources: Array<{ label: string; url?: string; type: 'document' | 'argus' | 'feed' | 'web' | 'corpus' }>;
  details?: string;
  related: string[];
  confidence: 'low' | 'medium' | 'high';
}

interface Payload {
  situationId: string;
  events: EventItem[];
  rangeStart: string;
  rangeEnd: string;
  generatedAt: string;
  notes?: string;
}

const SEV_DOT: Record<EventItem['severity'], string> = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  elevated: 'bg-yellow-500',
  moderate: 'bg-emerald-500',
  low: 'bg-emerald-400',
  unknown: 'bg-slate-300',
};

const SEV_RING: Record<EventItem['severity'], string> = {
  critical: 'ring-red-200',
  high: 'ring-amber-200',
  elevated: 'ring-yellow-200',
  moderate: 'ring-emerald-200',
  low: 'ring-emerald-100',
  unknown: 'ring-slate-200',
};

const TYPE_LABEL: Record<string, string> = {
  military: 'Military', diplomatic: 'Diplomatic', humanitarian: 'Humanitarian',
  political: 'Political', protest: 'Protest', election: 'Election',
  legal: 'Legal', economic: 'Economic', information: 'Information', other: 'Other',
};

export function LiveEventsPanel({ situation }: { situation: Situation }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [sevFilter, setSevFilter] = useState<Set<EventItem['severity']>>(new Set());
  const [windowDays, setWindowDays] = useState<30 | 90 | 180 | 365>(90);

  const run = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/ai/timeline-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, situationId: situation.id, windowDays }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const payload = (await res.json()) as Payload;
      setData(payload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Timeline generation failed');
    } finally {
      setLoading(false);
    }
  }, [situation, windowDays]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const types = useMemo(() => {
    const set = new Set<string>();
    (data?.events ?? []).forEach((e) => set.add(e.type));
    return Array.from(set).sort();
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [] as EventItem[];
    let arr = data.events.slice();
    if (typeFilter.size > 0) arr = arr.filter((e) => typeFilter.has(e.type));
    if (sevFilter.size > 0) arr = arr.filter((e) => sevFilter.has(e.severity));
    return arr.sort((a, b) => a.ts.localeCompare(b.ts));
  }, [data, typeFilter, sevFilter]);

  const toggleSet = <T,>(set: Set<T>, val: T) => {
    const next = new Set(set);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    return next;
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-navy-900">Live event timeline</h2>
          <p className="text-xs text-navy-500">
            Aggregates situation events, ARGUS alerts, document extracts, and grounded search.
            {data ? <span className="ml-2 text-navy-400">{filtered.length} of {data.events.length} events shown</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value) as 30 | 90 | 180 | 365)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-navy-800"
          >
            <option value={30}>Last 30d</option>
            <option value={90}>Last 90d</option>
            <option value={180}>Last 180d</option>
            <option value={365}>Last 1y</option>
          </select>
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-500/20 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {data ? 'Refresh' : 'Generate'}
          </button>
        </div>
      </header>

      {err ? <p className="mb-2 text-xs text-amber-700">{err}</p> : null}

      {data && data.events.length > 0 ? (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
            <Filter className="h-3 w-3 text-navy-400" />
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter((s) => toggleSet(s, t))}
                className={cn(
                  'rounded-full border px-2 py-0.5',
                  typeFilter.has(t) ? 'border-diplomatic-blue/40 bg-diplomatic-blue/10 text-diplomatic-blue' : 'border-slate-200 bg-white text-navy-600',
                )}
              >
                {TYPE_LABEL[t] ?? t}
              </button>
            ))}
            <span className="ml-2 text-navy-300">·</span>
            {(['critical', 'high', 'elevated', 'moderate', 'low'] as EventItem['severity'][]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSevFilter((cur) => toggleSet(cur, s))}
                className={cn(
                  'rounded-full border px-2 py-0.5 capitalize',
                  sevFilter.has(s) ? `border-navy-300 bg-slate-100 text-navy-800` : 'border-slate-200 bg-white text-navy-600',
                )}
              >
                <span className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full', SEV_DOT[s])} />
                {s}
              </button>
            ))}
          </div>

          <ol className="relative flex flex-col gap-2 border-l border-slate-200 pl-4">
            {filtered.map((ev) => {
              const open = expanded.has(ev.id);
              return (
                <li key={ev.id} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[18px] top-2 h-3 w-3 rounded-full ring-2 ring-white',
                      SEV_DOT[ev.severity],
                      'ring-offset-2',
                      SEV_RING[ev.severity],
                    )}
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => toggle(ev.id)}
                    className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-left hover:border-diplomatic-blue/30 hover:bg-slate-50"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">
                        {ev.ts.slice(0, 10)} · {TYPE_LABEL[ev.type] ?? ev.type}
                      </span>
                      <span className="text-[11px] text-navy-400">conf={ev.confidence}</span>
                    </div>
                    <p className="text-sm font-semibold text-navy-900">{ev.title}</p>
                    <p className="text-xs text-navy-600">{ev.summary}</p>
                    {ev.actors.length > 0 || ev.location ? (
                      <p className="mt-1 text-[11px] text-navy-500">
                        {ev.actors.slice(0, 3).join(' · ')}
                        {ev.location ? ` · ${ev.location}` : ''}
                      </p>
                    ) : null}
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-diplomatic-blue">
                      <ChevronDown className={cn('h-3 w-3 transition-transform', open ? 'rotate-180' : '')} />
                      {open ? 'Collapse' : 'Expand'}
                    </span>
                  </button>

                  {open ? (
                    <div className="ml-2 mt-2 space-y-2 border-l-2 border-diplomatic-blue/20 pl-3">
                      {ev.details ? <p className="text-xs text-navy-700">{ev.details}</p> : null}
                      {ev.sources.length > 0 ? (
                        <ul className="flex flex-wrap gap-2 text-[11px]">
                          {ev.sources.map((s, i) => (
                            <li key={i}>
                              {s.url ? (
                                <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-navy-700 hover:border-diplomatic-blue/30">
                                  <ExternalLink className="h-2.5 w-2.5" /> {s.label}
                                </a>
                              ) : (
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-navy-700">{s.label}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <PraxisLink
                        href={`/app/assistant?q=${encodeURIComponent(`Explain "${ev.title}" for ${situation.name}`)}`}
                        className="inline-flex items-center gap-1 text-[11px] text-diplomatic-blue hover:underline"
                      >
                        <MessageSquare className="h-3 w-3" /> Ask PRAXIS about this event
                      </PraxisLink>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </>
      ) : !loading && !err ? (
        <p className="text-xs text-navy-500">No events yet — click Generate to aggregate from corpus + ARGUS + grounded search.</p>
      ) : null}
    </section>
  );
}
