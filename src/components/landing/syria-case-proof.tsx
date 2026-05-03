'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, FileText, GitBranch, Gauge, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { SYRIA_DEMO_SITUATION, SYRIA_RECORDING_SCENES } from '@/lib/constants/syria-demo-case';
import { cn } from '@/lib/utils/cn';

const CASE_URL = '/login?mode=demo&redirect=/app/syria-case%3Frecording%3D1%26case%3Dsyria';

const PROOF_POINTS = [
  { label: 'Risk frame', value: '78/100', icon: Gauge, tone: 'text-red-700', detail: 'Volatile, trigger-based transition risk' },
  { label: 'Receipts', value: '5', icon: Search, tone: 'text-emerald-700', detail: 'UN and humanitarian public sources' },
  { label: 'Graph', value: `${SYRIA_DEMO_SITUATION.graphEntities}`, icon: GitBranch, tone: 'text-diplomatic-blue', detail: 'Typed actors, claims, events, constraints' },
  { label: 'Brief', value: '7 slides', icon: FileText, tone: 'text-gold-700', detail: 'Decision product with source basis' },
];

export function SyriaCaseProof() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-navy-950 py-16 text-white">
      <div className="absolute inset-0 opacity-[0.08]" aria-hidden="true">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-200">
            <Sparkles className="h-3.5 w-3.5" />
            Record this in 45 seconds
          </div>
          <h2 className="mt-5 max-w-3xl font-serif text-3xl font-semibold leading-tight sm:text-5xl">
            One Syria case file shows the full PRAXIS operating loop.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100/75">
            Open a populated public-source Syria transition workspace, then move through the real app:
            context discipline, source receipts, Firestore graph health, interactive conflict graph,
            expert disagreement, and a briefable decision product.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href={CASE_URL}
              className="group inline-flex items-center justify-center gap-2 rounded-md bg-gold-500 px-5 py-3 text-sm font-semibold text-navy-950 transition hover:bg-gold-400"
            >
              Open Syria case file
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Start private workspace
            </Link>
          </div>
        </div>

        <div>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROOF_POINTS.map((point, index) => {
              const Icon = point.icon;
              return (
                <motion.div
                  key={point.label}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06, duration: 0.28 }}
                  className="rounded-lg border border-white/10 bg-white/[0.06] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/55">{point.label}</span>
                    <Icon className={cn('h-4 w-4', point.tone)} />
                  </div>
                  <p className="mt-2 font-mono text-2xl font-bold text-white">{point.value}</p>
                  <p className="mt-1 text-xs leading-snug text-blue-100/65">{point.detail}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/55">Recording sequence</p>
            </div>
            <div className="mt-3 grid gap-2">
              {SYRIA_RECORDING_SCENES.map((scene) => (
                <div key={scene.id} className="grid grid-cols-[54px_minmax(0,1fr)] gap-3 rounded-md border border-white/10 bg-navy-900/60 px-3 py-2">
                  <span className="font-mono text-[11px] font-semibold text-gold-200">{scene.seconds}</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-white">{scene.title}</span>
                    <span className="block truncate text-[11px] text-blue-100/60">{scene.voiceover}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
