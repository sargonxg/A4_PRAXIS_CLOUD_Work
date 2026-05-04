'use client';

/**
 * Cinematic Syria timeline.
 *
 * Renders SYRIA_TIMELINE_EVENTS as a horizontal time axis with category-colored
 * dots, animated reveal, click-to-expand details, and synced auto-cycle that
 * walks an analyst through the case-defining events.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarClock, ChevronRight, Pause, Play, Sparkles } from 'lucide-react';
import { SYRIA_TIMELINE_EVENTS, type SyriaTimelineEvent } from '@/lib/constants/syria-tool-demos';
import { cn } from '@/lib/utils/cn';

const CATEGORY_TONE: Record<SyriaTimelineEvent['category'], { dot: string; bg: string; label: string }> = {
  Military:     { dot: '#ef4444', bg: 'bg-red-100 text-red-800',          label: 'Military'     },
  Political:    { dot: '#3b82f6', bg: 'bg-blue-100 text-blue-800',        label: 'Political'    },
  Diplomatic:   { dot: '#10b981', bg: 'bg-emerald-100 text-emerald-800', label: 'Diplomatic'   },
  Humanitarian: { dot: '#f59e0b', bg: 'bg-amber-100 text-amber-800',     label: 'Humanitarian' },
  Economic:     { dot: '#8b5cf6', bg: 'bg-purple-100 text-purple-800',   label: 'Economic'     },
};

const SIGNIFICANCE_HEIGHT: Record<SyriaTimelineEvent['significance'], number> = {
  critical: 64,
  high:     48,
  medium:   34,
  low:      24,
};

export function SyriaCinematicTimeline({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [autoplay, setAutoplay] = useState(true);
  const [autoIndex, setAutoIndex] = useState(0);

  const events = useMemo(
    () => [...SYRIA_TIMELINE_EVENTS].sort((a, b) => a.date.localeCompare(b.date)),
    [],
  );

  const { minMs, maxMs } = useMemo(() => {
    const stamps = events.map((e) => Date.parse(e.date));
    return { minMs: Math.min(...stamps), maxMs: Math.max(...stamps) };
  }, [events]);

  useEffect(() => {
    if (!autoplay || reduceMotion) return undefined;
    const timer = window.setInterval(() => {
      setAutoIndex((idx) => (idx + 1) % events.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [autoplay, events.length, reduceMotion]);

  const focused = activeId
    ? events.find((e) => e.id === activeId)
    : events[autoIndex] ?? null;

  function dateToPct(date: string): number {
    const t = Date.parse(date);
    if (maxMs === minMs) return 50;
    return ((t - minMs) / (maxMs - minMs)) * 100;
  }

  const monthMarkers = useMemo(() => {
    const out: { label: string; pct: number }[] = [];
    for (let m = 0; m < 18; m += 3) {
      const date = new Date(minMs);
      date.setMonth(date.getMonth() + m);
      if (date.getTime() > maxMs + 30 * 86_400_000) break;
      out.push({
        label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        pct: ((date.getTime() - minMs) / (maxMs - minMs)) * 100,
      });
    }
    return out;
  }, [maxMs, minMs]);

  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-diplomatic-blue/10 text-diplomatic-blue">
            <CalendarClock className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">Cinematic timeline</p>
            <h3 className="text-sm font-semibold text-navy-950">17 case-defining events · Dec 2024 → May 2026</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAutoplay((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-navy-800 transition hover:bg-slate-50"
        >
          {autoplay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {autoplay ? 'Pause cycle' : 'Resume cycle'}
        </button>
      </header>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="relative rounded-md border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
          {/* Axis */}
          <div className="relative h-[180px]">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-300" />
            {monthMarkers.map((mark) => (
              <div key={mark.label} className="absolute -top-1 flex flex-col items-center" style={{ left: `${mark.pct}%`, transform: 'translateX(-50%)' }}>
                <span className="h-2 w-px bg-slate-300" />
                <span className="mt-1 text-[9px] font-mono uppercase text-slate-400">{mark.label}</span>
              </div>
            ))}

            {events.map((event, idx) => {
              const x = dateToPct(event.date);
              const tone = CATEGORY_TONE[event.category];
              const above = idx % 2 === 0;
              const isFocused = focused?.id === event.id;
              const height = SIGNIFICANCE_HEIGHT[event.significance];
              return (
                <motion.button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    setActiveId(event.id);
                    setAutoplay(false);
                  }}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.04, type: 'spring', stiffness: 240, damping: 20 }}
                  className="absolute"
                  style={{ left: `${x}%`, top: '50%', transform: 'translateX(-50%)' }}
                  aria-label={`${event.date} — ${event.title}`}
                >
                  {/* Pulse ring on focus */}
                  {isFocused && !reduceMotion ? (
                    <span
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                      style={{
                        background: `radial-gradient(${tone.dot} 0%, transparent 70%)`,
                        width: '40px',
                        height: '40px',
                        animation: 'syriaTimelinePulse 1.4s ease-out infinite',
                        opacity: 0.7,
                      }}
                    />
                  ) : null}
                  {/* Connector line */}
                  <span
                    className={cn('absolute left-1/2 -translate-x-1/2 w-px transition-colors')}
                    style={{
                      background: tone.dot,
                      height: `${height}px`,
                      top: above ? `-${height}px` : 0,
                      opacity: isFocused ? 1 : 0.5,
                    }}
                  />
                  <span
                    className={cn('block rounded-full border-2 border-white shadow', isFocused ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5')}
                    style={{ background: tone.dot, transition: 'all 0.2s ease' }}
                  />
                </motion.button>
              );
            })}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(CATEGORY_TONE).map(([key, tone]) => (
              <span key={key} className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', tone.bg)}>
                <span className="h-2 w-2 rounded-full" style={{ background: tone.dot }} />
                {tone.label}
              </span>
            ))}
          </div>
        </div>

        <aside className="rounded-md border border-slate-200 bg-slate-50 p-4">
          {focused ? (
            <motion.div
              key={focused.id}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', CATEGORY_TONE[focused.category].bg)}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_TONE[focused.category].dot }} />
                  {focused.category}
                </span>
                <span className="text-[10px] font-mono text-slate-500">{focused.date}</span>
              </div>
              <h4 className="mt-2 text-sm font-semibold text-navy-950">{focused.title}</h4>
              <p className="mt-1 text-[11px] leading-4 text-slate-600">{focused.description}</p>
              {focused.location ? (
                <p className="mt-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-navy-700">Location:</span> {focused.location}
                </p>
              ) : null}
              {focused.actors?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {focused.actors.map((a) => (
                    <span key={a} className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                      {a}
                    </span>
                  ))}
                </div>
              ) : null}
              {focused.sources?.length ? (
                <div className="mt-3 border-t border-slate-200 pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sources</p>
                  <ul className="mt-1 space-y-0.5">
                    {focused.sources.map((src) => (
                      <li key={src} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                        <ChevronRight className="h-3 w-3 text-slate-400" />
                        {src}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {typeof focused.glaslStage === 'number' ? (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                  <Sparkles className="h-3 w-3" />
                  Glasl stage {focused.glaslStage}
                </div>
              ) : null}
            </motion.div>
          ) : (
            <p className="text-[11px] leading-5 text-slate-500">Hover the timeline or let the cycle walk through the events.</p>
          )}
        </aside>
      </div>

      <style>{`
        @keyframes syriaTimelinePulse {
          0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0;   }
        }
      `}</style>
    </section>
  );
}
