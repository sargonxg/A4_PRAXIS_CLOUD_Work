'use client';

/**
 * Advisory Council debate panel for the Syria case.
 *
 * Presents a hyper-specific live policy question and walks through advisor
 * positions with explicit signals to track and red lines. The component
 * renders even when the upstream advisory council page is empty — it is
 * self-contained and uses the SYRIA_ADVISORY_COUNCIL constant as the
 * source of truth.
 *
 * Format inspired by the IPI / Crisis Group practitioner roundtable layout.
 */

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, MessageCircle, Quote, ScanEye, ShieldOff, Users } from 'lucide-react';
import { SYRIA_ADVISORY_COUNCIL, type SyriaAdvisor } from '@/lib/constants/syria-tool-demos';
import { cn } from '@/lib/utils/cn';

const POLICY_QUESTION = {
  question:
    'Should the EU bundle remaining sanctions delisting with the constitutional drafting committee\'s civil-society participation benchmarks, or sequence them separately from the political track?',
  context:
    'EU lifted core sanctions on transitional state institutions on 25 February 2026. Residual targeted measures remain. Civil-society networks are pushing for transparent participation criteria in the 60-day consultative round. Damascus-SDF implementation is partial, and Israeli operations continue in the south. The EU is weighing a benchmark review for August 2026.',
  stakes: [
    'Bundling rewards reform but risks giving Damascus unilateral leverage if civil society is gamed',
    'Sequencing keeps sanctions legitimacy intact but may slow the EU\'s ability to incentivise inclusive drafting',
    'Either path needs verifiable evidence — symbolic openings are not enough',
  ],
};

interface AdvisorPosition {
  advisorId: string;
  stance: 'bundle' | 'sequence' | 'mixed';
  position: string;
  signal: string;
  redLine: string;
}

const POSITIONS: AdvisorPosition[] = [
  {
    advisorId: 'adv-khatib',
    stance: 'mixed',
    position:
      'Bundle the next tranche only with technical, named benchmarks (drafting-committee composition + civil-society observers + minutes publication). Refuse symbolic openings.',
    signal: 'Drafting committee participation list published with named civil-society networks.',
    redLine: 'No sanctions tranche before benchmark publication.',
  },
  {
    advisorId: 'adv-yahya',
    stance: 'bundle',
    position:
      'Tie the next sanctions step to HLP, banking, and procurement reform — recovery economics is the binding constraint. Reward institutional reform, not ceremony.',
    signal: 'HLP registry pilot in two governorates and correspondent-banking access progress.',
    redLine: 'Reconstruction-finance flows unconditioned by HLP safeguards.',
  },
  {
    advisorId: 'adv-heller',
    stance: 'sequence',
    position:
      'Keep sanctions on a technical, monitorable cadence separate from the political track. Bundling weakens delisting credibility and confuses signal with leverage.',
    signal: 'Targeted designation reviews tied to ICRC detention access and counter-terrorism designations.',
    redLine: 'Sanctions relief in a single bundle without milestones.',
  },
  {
    advisorId: 'adv-khalifa',
    stance: 'bundle',
    position:
      'Bundle if and only if local mediation channels have procedural standing. Otherwise sequencing rewards capital-only diplomacy.',
    signal: 'Local mediation committees in Sweida + Latakia + northeast functional under public reporting.',
    redLine: 'Centralising mediation in capitals without local grievance channels.',
  },
  {
    advisorId: 'adv-lund',
    stance: 'sequence',
    position:
      'Sanctions sequencing should follow command-and-control sequencing in the integration agreement, not constitutional theatre. The technical annexes determine what is real.',
    signal: 'SDF-to-army integration order of battle published with verifiable timelines.',
    redLine: 'Equating ceasefire announcement with implementation when annexes are absent.',
  },
];

const STANCE_TONE: Record<AdvisorPosition['stance'], { label: string; badge: string; bar: string }> = {
  bundle:   { label: 'Bundle',   badge: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-500' },
  sequence: { label: 'Sequence', badge: 'bg-rose-100 text-rose-800',       bar: 'bg-rose-500'    },
  mixed:    { label: 'Mixed',    badge: 'bg-amber-100 text-amber-800',     bar: 'bg-amber-500'   },
};

export function SyriaAdvisoryDebate({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(POSITIONS[0]!.advisorId);
  const active = POSITIONS.find((p) => p.advisorId === activeId)!;
  const advisor = SYRIA_ADVISORY_COUNCIL.find((a: SyriaAdvisor) => a.id === active.advisorId);

  const tally = POSITIONS.reduce(
    (acc, p) => {
      acc[p.stance] += 1;
      return acc;
    },
    { bundle: 0, sequence: 0, mixed: 0 } as Record<AdvisorPosition['stance'], number>,
  );

  return (
    <section className={cn('rounded-lg border border-navy-200 bg-white p-4 shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gold-500/15 text-gold-600">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">Advisory council debate</p>
            <h3 className="text-sm font-semibold text-navy-950">{POLICY_QUESTION.question}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['bundle', 'mixed', 'sequence'] as const).map((stance) => (
            <span key={stance} className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider', STANCE_TONE[stance].badge)}>
              {STANCE_TONE[stance].label} · {tally[stance]}
            </span>
          ))}
        </div>
      </header>

      <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-navy-500">Context</span>{' '}
        {POLICY_QUESTION.context}
      </p>

      <ul className="mt-3 grid gap-1 text-[11px] leading-4 text-slate-700 lg:grid-cols-3">
        {POLICY_QUESTION.stakes.map((stake) => (
          <li key={stake} className="rounded-md bg-amber-50 p-2">
            <ScanEye className="mr-1 inline-block h-3 w-3 align-text-bottom text-amber-700" />
            {stake}
          </li>
        ))}
      </ul>

      <div className="mt-4 grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ol className="space-y-1.5">
          {POSITIONS.map((pos, idx) => {
            const adv = SYRIA_ADVISORY_COUNCIL.find((a: SyriaAdvisor) => a.id === pos.advisorId);
            if (!adv) return null;
            const isActive = pos.advisorId === activeId;
            const tone = STANCE_TONE[pos.stance];
            return (
              <motion.li
                key={pos.advisorId}
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.28 }}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(pos.advisorId)}
                  className={cn(
                    'w-full rounded-md border p-2 text-left transition',
                    isActive ? 'border-navy-400 bg-navy-950 text-white' : 'border-slate-200 bg-white text-navy-900 hover:border-navy-200',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold leading-4">{adv.name}</p>
                    <span className={cn('rounded-full px-1.5 py-0 text-[9px] font-semibold uppercase', tone.badge)}>{tone.label}</span>
                  </div>
                  <p className={cn('mt-1 text-[10px] leading-4', isActive ? 'text-blue-100/70' : 'text-slate-500')}>
                    {adv.affiliation}
                  </p>
                </button>
              </motion.li>
            );
          })}
        </ol>

        <motion.div
          key={activeId}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.26 }}
          className="rounded-md border border-slate-200 bg-slate-50 p-4"
        >
          {advisor ? (
            <>
              <div className="flex items-center gap-2">
                <Quote className="h-4 w-4 text-gold-600" />
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', STANCE_TONE[active.stance].badge)}>
                  {STANCE_TONE[active.stance].label}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{advisor.lens}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-navy-950">{advisor.name}</p>
              <p className="text-[11px] text-slate-500">{advisor.affiliation}</p>
              <p className="mt-3 rounded-md bg-white p-3 text-sm leading-6 text-slate-800">
                &ldquo;{active.position}&rdquo;
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-center gap-1.5 text-blue-800">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider">Signal to track</p>
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-blue-950">{active.signal}</p>
                </div>
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
                  <div className="flex items-center gap-1.5 text-rose-800">
                    <ShieldOff className="h-3.5 w-3.5" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider">Red line</p>
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-rose-950">{active.redLine}</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-slate-500">
                <ArrowRight className="inline-block h-3 w-3 align-text-bottom" />
                Each position is logged into the situation graph as a counterfactual edge so the analyst can
                draft a memo that names the trade-off, not just the conclusion.
              </p>
            </>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
