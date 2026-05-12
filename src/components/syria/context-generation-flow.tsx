'use client';

/**
 * Context generation flow.
 *
 * Five-stage pipeline that turns "who is asking" + "what is happening" into
 * a calibrated, provenance-pinned answer. Each stage has an animated reveal,
 * an iconography, and a count of inputs feeding the next stage. Recording-
 * friendly: it tells a single image story in <8 seconds.
 */

import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Brain, Database, FileSignature, Layers, Network, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FlowStage {
  id: string;
  label: string;
  icon: typeof Brain;
  caption: string;
  count: string;
  tint: string;
  border: string;
  iconTone: string;
}

const STAGES: FlowStage[] = [
  {
    id: 'profile',
    label: 'User Core',
    icon: Brain,
    caption: 'Role · seniority · mandate · lenses · red lines · audience',
    count: 'You',
    tint: 'bg-blue-50',
    border: 'border-blue-200',
    iconTone: 'text-blue-700',
  },
  {
    id: 'situation',
    label: 'Situation graph',
    icon: Network,
    caption: 'ACO v2 ontology — actors, claims, interests, constraints, leverage, commitments, events, narratives',
    count: '8 primitives · 72 relations',
    tint: 'bg-purple-50',
    border: 'border-purple-200',
    iconTone: 'text-purple-700',
  },
  {
    id: 'sources',
    label: 'Source layer',
    icon: Database,
    caption: 'Tier 1-4 receipts + 33 grounded anchors + live data feeds',
    count: '39 + 33 + feeds',
    tint: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconTone: 'text-emerald-700',
  },
  {
    id: 'recipes',
    label: 'Dialectica recipes',
    icon: Layers,
    caption: 'Leverage trace · commitment check · interest vs position · counter narrative · path search',
    count: '5 recipes',
    tint: 'bg-amber-50',
    border: 'border-amber-200',
    iconTone: 'text-amber-700',
  },
  {
    id: 'product',
    label: 'Decision product',
    icon: FileSignature,
    caption: 'BLUF + risk board + commitment table + footnotes — every claim graph-grounded',
    count: '1 brief, defended',
    tint: 'bg-rose-50',
    border: 'border-rose-200',
    iconTone: 'text-rose-700',
  },
];

export function SyriaContextGenerationFlow({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-diplomatic-blue/10 text-diplomatic-blue">
            <Layers className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">Context generation flow</p>
            <h3 className="text-sm font-semibold text-navy-950">Five stages from analyst at desk to defended brief</h3>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
          <ShieldCheck className="h-3 w-3" />
          Provenance preserved across all stages
        </span>
      </header>

      <div className="mt-4 grid gap-3 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-stretch">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <motion.div
              key={stage.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.32 }}
              className={cn('relative rounded-md border p-3', stage.border, stage.tint)}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', stage.iconTone)} />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-700">{stage.label}</p>
              </div>
              <p className="mt-2 font-mono text-[11px] font-semibold text-navy-950">{stage.count}</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-700">{stage.caption}</p>
              {idx < STAGES.length - 1 ? (
                <motion.div
                  className="absolute right-[-14px] top-1/2 hidden -translate-y-1/2 text-slate-400 lg:block"
                  initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 + 0.2, duration: 0.24 }}
                >
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
              ) : null}
            </motion.div>
          );
        })}
      </div>

      <p className="mt-3 rounded-md bg-slate-50 p-3 text-[11px] leading-4 text-slate-600">
        <span className="font-semibold text-navy-700">Reading guide:</span> the same context block is built once and
        reused across every AI route — Source Scout, Dialectica recipes, Red Team review, Brief Builder, Ask PRAXIS.
        That is why every output cites the same provenance trail and respects the same red-line phrases.
      </p>
    </section>
  );
}
