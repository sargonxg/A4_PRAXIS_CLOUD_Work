'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Activity, AlertTriangle, CalendarClock, Gauge, Network, UsersRound } from 'lucide-react';
import { SYRIA_DEMO_CONFLICT_GRAPH, SYRIA_DEMO_SITUATION } from '@/lib/constants/syria-demo-case';
import {
  SYRIA_DEMO_ANALYST_PROFILE,
  SYRIA_MEDIA_VISUAL_METRICS,
  SYRIA_SITUATION_CONTEXT_CARDS,
} from '@/lib/constants/syria-demo-workspace';
import { SyriaGeographicMap } from '@/components/syria/geographic-map';
import { SyriaCinematicTimeline } from '@/components/syria/cinematic-timeline';
import { SyriaNYCStakeholderMap } from '@/components/syria/nyc-stakeholder-map';

const SITUATION_METRICS = [
  { label: 'Escalation stage', value: 'Glasl 5', detail: 'Polarization with reversible de-escalation space.', icon: Activity },
  { label: 'Actor set', value: `${SYRIA_DEMO_CONFLICT_GRAPH.actors.length}`, detail: 'State, UN, humanitarian, local, and regional actors.', icon: UsersRound },
  { label: 'Source coverage', value: `${SYRIA_MEDIA_VISUAL_METRICS[1]?.score ?? 88}%`, detail: 'UN, local, economic, rights, and monitoring lanes.', icon: Network },
  { label: 'Freshness', value: 'May 2026', detail: 'Seeded public-source case refreshed for the current demo cycle.', icon: CalendarClock },
];

const RISK_TARGET = 78;

function useCountUp(target: number, durationMs: number, run: boolean) {
  const [value, setValue] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, run]);
  return value;
}

export function SyriaChapterSituationFrame() {
  const reduceMotion = useReducedMotion();
  const risk = useCountUp(RISK_TARGET, 900, !reduceMotion);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Analyst line</p>
            <h3 className="mt-1 text-xl font-semibold text-navy-950">{SYRIA_DEMO_SITUATION.name}</h3>
          </div>
          <motion.div
            initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
            whileInView={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-right"
          >
            <div className="flex items-center gap-2 text-red-700">
              <Gauge className="h-4 w-4" />
              <span className="font-mono text-xl font-bold tabular-nums">{risk}/100</span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-700/70">Volatile</p>
          </motion.div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          The January Damascus-SDF integration track is the stabilizing center of gravity. PRAXIS keeps it in the
          same frame as humanitarian access, Kurdish rights implementation, southern flashpoints, HLP risk, and
          regional spillover so a leadership line can change when evidence changes.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SITUATION_METRICS.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.32, delay: index * 0.06, ease: 'easeOut' }}
                className="rounded-lg border border-white bg-white p-3 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{metric.label}</p>
                  <Icon className="h-4 w-4 text-diplomatic-blue" />
                </div>
                <p className="mt-2 font-mono text-xl font-semibold text-navy-950">{metric.value}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{metric.detail}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-[10px] font-semibold uppercase tracking-wider">Breakpoints to monitor</p>
          </div>
          <div className="mt-3 grid gap-2">
            {SYRIA_SITUATION_CONTEXT_CARDS.map((card, index) => (
              <motion.div
                key={card.label}
                initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
                className="rounded-md bg-white/70 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-navy-900">{card.label}</span>
                  <span className="text-xs font-semibold text-amber-800">{card.value}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-700">{card.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Profile calibration</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Default lens: {SYRIA_DEMO_ANALYST_PROFILE.perspective.lenses.join(', ')}. The workspace keeps sources,
            uncertainty, and red lines visible before drafting.
          </p>
        </div>
      </div>

      <div className="xl:col-span-2 grid gap-4">
        <SyriaGeographicMap />
        <SyriaCinematicTimeline />
        <SyriaNYCStakeholderMap />
      </div>
    </div>
  );
}
