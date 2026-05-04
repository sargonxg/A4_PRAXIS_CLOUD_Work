'use client';

/**
 * Daily media intake workflow.
 *
 * Simulates the moment a UN-NY analyst sees a new piece of information come
 * in: PRAXIS triages it through the layer of truth, proposes a graph patch,
 * surfaces a draft language pivot for the morning brief, and offers the
 * analyst a one-click accept/dispute path.
 *
 * The component cycles through three live incidents on a 6-second drum so
 * it reads as "always-on intelligence" during recording.
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BellRing, GitMerge, Newspaper, ShieldAlert, ShieldCheck, ShieldQuestion, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type Trust = 'tier_a' | 'tier_b' | 'tier_c' | 'tier_d';

interface Incident {
  id: string;
  receivedAt: string;
  source: string;
  trust: Trust;
  headline: string;
  summary: string;
  proposedPatch: string;
  briefPivot: string;
}

const INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    receivedAt: '07:42 EDT',
    source: 'UN Special Envoy briefing transcript',
    trust: 'tier_a',
    headline: 'Special Envoy says detention-facility access talks paused 48h',
    summary:
      'UN Special Envoy notes the Damascus-SDF technical annex on detention security has not opened access for ICRC. Talks paused for 48 hours.',
    proposedPatch:
      'commitment c1 → status: partial → 48 → blocking · evidence:envoyBriefing20260504',
    briefPivot:
      'Update BLUF to flag detention-access pause as the next 48-hour decision trigger; queue Heller signal-watch.',
  },
  {
    id: 'inc-2',
    receivedAt: '08:14 EDT',
    source: 'North Press Agency dispatch',
    trust: 'tier_b',
    headline: 'Two clashes reported in rural Deir-ez-Zor before dawn',
    summary:
      'Local stringers report two fresh clashes in rural Deir-ez-Zor villages. No casualty figures yet. Cross-line corridor remains open.',
    proposedPatch:
      'event ev-deir-clash-2026-05-04 → links: actor-sdf, actor-syrian-government → confidence: 0.62',
    briefPivot:
      'Add to "Trigger watch": 2 of 4-clashes-in-7d threshold reached. Escalate Lund signal-watch.',
  },
  {
    id: 'inc-3',
    receivedAt: '08:56 EDT',
    source: 'EU Delegation press wire (state messaging)',
    trust: 'tier_d',
    headline: 'EU Delegation echoes Damascus statement on coastal probe',
    summary:
      'Press wire repeats Damascus statement that the coastal accountability commission has begun new evidence collection. No independent confirmation.',
    proposedPatch:
      'narrative n-coastal-probe → stance: official → confidence: 0.34 → mark_unverified',
    briefPivot:
      'Hold the line. Do not lift coastal accountability score; flag as unverified state messaging until IIIM independent corroboration.',
  },
];

const TRUST_TONE: Record<Trust, { label: string; chip: string; icon: typeof ShieldCheck; iconTone: string; ring: string }> = {
  tier_a: { label: 'Tier A',  chip: 'bg-emerald-100 text-emerald-800', icon: ShieldCheck,    iconTone: 'text-emerald-700', ring: 'ring-emerald-400' },
  tier_b: { label: 'Tier B',  chip: 'bg-blue-100 text-blue-800',       icon: ShieldCheck,    iconTone: 'text-blue-700',    ring: 'ring-blue-300' },
  tier_c: { label: 'Tier C',  chip: 'bg-amber-100 text-amber-800',     icon: ShieldQuestion, iconTone: 'text-amber-700',   ring: 'ring-amber-300' },
  tier_d: { label: 'Tier D',  chip: 'bg-rose-100 text-rose-800',       icon: ShieldAlert,    iconTone: 'text-rose-700',    ring: 'ring-rose-300' },
};

const STAGE_LABELS = ['Incoming', 'Trust check', 'Graph patch', 'Brief pivot'];

export function SyriaDailyMediaWorkflow({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);

  const incident = INCIDENTS[activeIdx]!;
  const trust = TRUST_TONE[incident.trust];

  useEffect(() => {
    if (reduceMotion) return undefined;
    const t = window.setInterval(() => {
      setStageIdx((idx) => {
        if (idx + 1 >= STAGE_LABELS.length) {
          setActiveIdx((p) => (p + 1) % INCIDENTS.length);
          return 0;
        }
        return idx + 1;
      });
    }, 1800);
    return () => window.clearInterval(t);
  }, [reduceMotion]);

  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-500/15 text-rose-700">
            <Newspaper className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Daily media intake</p>
            <h3 className="text-sm font-semibold text-navy-950">
              New information arrives → trust check → graph patch → brief pivot
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {INCIDENTS.map((inc, idx) => (
            <button
              key={inc.id}
              type="button"
              onClick={() => { setActiveIdx(idx); setStageIdx(0); }}
              className={cn(
                'h-1.5 rounded-full transition-all',
                idx === activeIdx ? 'w-8 bg-diplomatic-blue' : 'w-3 bg-slate-200 hover:bg-slate-300',
              )}
              aria-label={`Show incident ${idx + 1}`}
            />
          ))}
        </div>
      </header>

      <div className="mt-4 grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <motion.div
          key={incident.id}
          initial={reduceMotion ? false : { opacity: 0, x: -10 }}
          animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: 0.32 }}
          className={cn('rounded-md border-2 p-3', trust.chip.includes('emerald') ? 'border-emerald-300 bg-emerald-50' : trust.chip.includes('blue') ? 'border-blue-300 bg-blue-50' : trust.chip.includes('amber') ? 'border-amber-300 bg-amber-50' : 'border-rose-300 bg-rose-50')}
        >
          <div className="flex items-center gap-2">
            <BellRing className="h-3.5 w-3.5 text-rose-700" />
            <span className="text-[10px] font-mono text-slate-600">{incident.receivedAt}</span>
          </div>
          <p className="mt-1 text-[11px] font-semibold text-navy-900">{incident.source}</p>
          <span className={cn('mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', trust.chip)}>
            <trust.icon className="h-3 w-3" />
            {trust.label}
          </span>
          <h4 className="mt-2 text-[12px] font-semibold leading-tight text-navy-950">{incident.headline}</h4>
          <p className="mt-1 text-[11px] leading-4 text-slate-700">{incident.summary}</p>
        </motion.div>

        <div className="grid gap-2">
          <div className="grid grid-cols-4 gap-1">
            {STAGE_LABELS.map((label, idx) => (
              <div
                key={label}
                className={cn(
                  'rounded-md border p-2 text-center transition',
                  idx <= stageIdx ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white',
                )}
              >
                <p className={cn('text-[10px] font-semibold uppercase tracking-wider', idx <= stageIdx ? 'text-emerald-700' : 'text-slate-400')}>
                  Step {idx + 1}
                </p>
                <p className={cn('mt-0.5 text-[10px] font-semibold', idx <= stageIdx ? 'text-navy-950' : 'text-slate-500')}>{label}</p>
              </div>
            ))}
          </div>

          <motion.div
            key={`${incident.id}-${stageIdx}`}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="rounded-md border border-slate-200 bg-slate-50 p-3"
          >
            {stageIdx === 0 ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Incoming</p>
                <p className="mt-1 text-[12px] leading-5 text-navy-900">
                  PRAXIS receives the dispatch via your watched feeds. The clock starts before any analyst opens it.
                </p>
              </>
            ) : null}
            {stageIdx === 1 ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trust check</p>
                <p className="mt-1 text-[12px] leading-5 text-navy-900">
                  Source assigned <strong>{trust.label}</strong>. Reliability range and provenance pin are attached. If the source had been
                  flagged as <em>disputed</em> in your library, every downstream output would inherit a confidence drop.
                </p>
              </>
            ) : null}
            {stageIdx === 2 ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Graph patch proposal</p>
                <pre className="mt-1 overflow-x-auto rounded-md bg-navy-950 p-2 font-mono text-[11px] leading-4 text-emerald-300">
                  {incident.proposedPatch}
                </pre>
                <p className="mt-1 text-[11px] leading-4 text-slate-600">
                  PRAXIS proposes the patch into <code>graph_updates</code>. Canonical graph state is never mutated by an
                  agent — your accept/dispute decides.
                </p>
              </>
            ) : null}
            {stageIdx === 3 ? (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Brief pivot</p>
                <p className="mt-1 text-[12px] leading-5 text-navy-900">
                  <Sparkles className="mr-1 inline-block h-3 w-3 text-gold-600 align-text-bottom" />
                  {incident.briefPivot}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-800">
                    <ShieldCheck className="h-3 w-3" />
                    Accept patch
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-1 text-[10px] font-semibold text-rose-800">
                    <ShieldAlert className="h-3 w-3" />
                    Dispute
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
                    <GitMerge className="h-3 w-3" />
                    Send to morning brief
                  </span>
                </div>
              </>
            ) : null}
          </motion.div>

          <p className="text-[10px] leading-4 text-slate-500">
            <ArrowRight className="mr-0.5 inline-block h-3 w-3 align-text-bottom" />
            The whole loop runs while you finish coffee. By 9 AM the brief is ready to defend.
          </p>
        </div>
      </div>
    </section>
  );
}
