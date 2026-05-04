'use client';

/**
 * PolicyDeskTemplate — generic desk page renderer.
 *
 * Used by domain-specific desks (political risk, economic research, US
 * housing policy, etc.). Each desk is a populated instance of the same
 * 7-category PRAXIS pattern: who is at the desk, what they track, which
 * tools they reach for, what their daily workflow looks like, and what
 * a sample analysis output looks like.
 */

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity, ArrowRight, BellRing, BookOpen, Briefcase, Building2,
  CalendarClock, ClipboardList, Compass, Database, FileSignature,
  Flag, Globe2, Library, MapPin, Network, Sparkles, Target, TrendingUp, Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface DeskKpi {
  label: string;
  value: string;
  tone: 'navy' | 'rose' | 'emerald' | 'amber' | 'blue' | 'purple';
}

export interface DeskTool {
  name: string;
  detail: string;
  example: string;
  icon: LucideIcon;
}

export interface DeskTimelineItem {
  date: string;
  label: string;
  category: string;
}

export interface DeskWorkflowStep {
  label: string;
  detail: string;
}

export interface DeskAnalysisLine {
  heading: string;
  body: string;
  tone?: 'neutral' | 'rose' | 'emerald' | 'amber';
}

export interface DeskActor {
  name: string;
  role: string;
  stance: 'aligned' | 'opposed' | 'mixed' | 'neutral';
}

export interface PolicyDesk {
  id: string;
  domain: 'foreign' | 'domestic' | 'economic';
  flag: string;
  hero: {
    persona: string;
    mandate: string;
    title: string;
    subtitle: string;
    pills: { label: string; tone: 'emerald' | 'amber' | 'navy' | 'rose' | 'blue' | 'purple' }[];
  };
  kpis: DeskKpi[];
  trackedActors: DeskActor[];
  trackedQuestions: string[];
  tools: DeskTool[];
  workflow: { name: string; pace: string; steps: DeskWorkflowStep[] };
  timeline: DeskTimelineItem[];
  analysis: { question: string; bullets: DeskAnalysisLine[]; sources: string[]; confidence: number };
  alerts: { time: string; tier: 'A' | 'B' | 'C' | 'D'; source: string; headline: string }[];
}

const KPI_TONE = {
  navy:    'border-slate-200 bg-white text-navy-950',
  rose:    'border-rose-200 bg-rose-50 text-rose-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber:   'border-amber-200 bg-amber-50 text-amber-800',
  blue:    'border-blue-200 bg-blue-50 text-blue-700',
  purple:  'border-purple-200 bg-purple-50 text-purple-700',
} as const;

const PILL_TONE = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber:   'border-amber-200 bg-amber-50 text-amber-800',
  navy:    'border-navy-200 bg-navy-50 text-navy-700',
  rose:    'border-rose-200 bg-rose-50 text-rose-700',
  blue:    'border-blue-200 bg-blue-50 text-blue-700',
  purple:  'border-purple-200 bg-purple-50 text-purple-700',
} as const;

const STANCE_TONE = {
  aligned: 'bg-emerald-100 text-emerald-800',
  opposed: 'bg-rose-100 text-rose-800',
  mixed:   'bg-amber-100 text-amber-800',
  neutral: 'bg-slate-100 text-slate-700',
};

const ALERT_TONE = {
  A: 'border-emerald-300 bg-emerald-50',
  B: 'border-blue-300 bg-blue-50',
  C: 'border-amber-300 bg-amber-50',
  D: 'border-rose-300 bg-rose-50',
} as const;

const ANALYSIS_LINE_TONE = {
  neutral: 'border-slate-200 bg-slate-50',
  rose:    'border-rose-200 bg-rose-50',
  emerald: 'border-emerald-200 bg-emerald-50',
  amber:   'border-amber-200 bg-amber-50',
};

export function PolicyDeskTemplate({ desk }: { desk: PolicyDesk }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-5">
      {/* HERO */}
      <header className="rounded-lg border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-3xl leading-none">{desk.flag}</span>
          {desk.hero.pills.map((p) => (
            <span key={p.label} className={cn('rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider', PILL_TONE[p.tone])}>
              {p.label}
            </span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
            <Briefcase className="h-3 w-3" />
            {desk.domain === 'foreign' ? 'Foreign policy' : desk.domain === 'domestic' ? 'Domestic policy' : 'Economic research'}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl lg:text-[34px]">
          {desk.hero.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">{desk.hero.subtitle}</p>
        <p className="mt-2 text-[12px] leading-5 text-slate-500">
          <span className="font-semibold text-navy-700">Persona:</span> {desk.hero.persona} <span className="text-slate-300">·</span>{' '}
          <span className="font-semibold text-navy-700">Mandate:</span> {desk.hero.mandate}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {desk.kpis.map((k) => (
            <div key={k.label} className={cn('rounded-md border p-2 text-center', KPI_TONE[k.tone])}>
              <p className="text-[9px] font-semibold uppercase tracking-wider opacity-80">{k.label}</p>
              <p className="mt-0.5 font-mono text-base font-semibold">{k.value}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Tracked actors + questions */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-amber-700" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700">Tracked actors</p>
          </div>
          <h2 className="mt-1 text-sm font-semibold text-navy-950">Who shapes the file</h2>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {desk.trackedActors.map((a, idx) => (
              <motion.li
                key={a.name}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04, duration: 0.24 }}
                className="rounded-md border border-slate-200 bg-slate-50 p-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-navy-950">{a.name}</span>
                  <span className={cn('rounded-full px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider', STANCE_TONE[a.stance])}>
                    {a.stance}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-600">{a.role}</p>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-rose-700" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Live research questions</p>
          </div>
          <h2 className="mt-1 text-sm font-semibold text-navy-950">What the desk is asking right now</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-[12px] leading-5 text-slate-700">
            {desk.trackedQuestions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </div>
      </section>

      {/* Tools strip */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-navy-700" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-700">Tools the desk reaches for</p>
        </div>
        <h2 className="mt-1 text-sm font-semibold text-navy-950">Concrete tools · concrete examples</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          {desk.tools.map((t, idx) => {
            const Icon = t.icon;
            return (
              <motion.div
                key={t.name}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04, duration: 0.26 }}
                className="rounded-md border border-slate-200 bg-slate-50 p-3"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-diplomatic-blue" />
                  <p className="text-[11px] font-semibold text-navy-950">{t.name}</p>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-slate-600">{t.detail}</p>
                <p className="mt-2 rounded bg-white p-2 text-[10px] leading-4 text-emerald-900">
                  <span className="font-semibold text-emerald-800">Example:</span> {t.example}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Daily workflow */}
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-700" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">{desk.workflow.pace}</p>
          </div>
          <h2 className="text-sm font-semibold text-navy-950">{desk.workflow.name}</h2>
        </div>
        <div className="mt-3 grid gap-2 lg:grid-cols-5">
          {desk.workflow.steps.map((step, idx) => (
            <motion.div
              key={step.label}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.26 }}
              className="rounded-md border border-emerald-200 bg-emerald-50 p-2"
            >
              <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700">Step {idx + 1}</p>
              <p className="mt-1 text-[11px] font-semibold text-navy-950">{step.label}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-600">{step.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Timeline + Alerts */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-purple-700" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-700">Timeline · case-defining moments</p>
          </div>
          <ul className="mt-3 space-y-1">
            {desk.timeline.map((t, idx) => (
              <motion.li
                key={`${t.date}-${t.label}`}
                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.03, duration: 0.24 }}
                className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-2"
              >
                <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] text-slate-600">{t.date}</span>
                <span className="text-[11px] font-semibold text-navy-950">{t.label}</span>
                <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-purple-700">
                  {t.category}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 text-rose-800">
            <BellRing className="h-4 w-4" />
            <p className="text-[10px] font-semibold uppercase tracking-wider">Today's alerts</p>
          </div>
          <ul className="mt-2 space-y-1.5">
            {desk.alerts.map((a) => (
              <li key={`${a.time}-${a.headline}`} className={cn('rounded-md border-l-4 px-2 py-1.5', ALERT_TONE[a.tier])}>
                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                  <span className="font-mono text-slate-600">{a.time}</span>
                  <span className="rounded bg-white px-1.5 py-0.5 font-semibold uppercase tracking-wider text-navy-700">Tier {a.tier}</span>
                  <span className="font-semibold uppercase tracking-wider text-slate-600">{a.source}</span>
                </div>
                <p className="mt-0.5 text-[11px] font-medium text-navy-950">{a.headline}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Sample analysis output */}
      <section className="rounded-lg border border-navy-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <FileSignature className="h-4 w-4 text-navy-700" />
          <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-700">Sample analysis · what PRAXIS produced this morning</p>
        </div>
        <h2 className="mt-1 text-sm font-semibold text-navy-950">{desk.analysis.question}</h2>
        <ul className="mt-3 space-y-2">
          {desk.analysis.bullets.map((b) => (
            <li key={b.heading} className={cn('rounded-md border p-3', ANALYSIS_LINE_TONE[b.tone ?? 'neutral'])}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-700">{b.heading}</p>
              <p className="mt-1 text-[12px] leading-5 text-navy-900">{b.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
          <BookOpen className="h-3 w-3" />
          <span className="font-semibold uppercase tracking-wider">Sources:</span>
          {desk.analysis.sources.map((s) => (
            <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">{s}</span>
          ))}
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">
            Confidence {Math.round(desk.analysis.confidence * 100)}%
          </span>
        </div>
      </section>

      {/* Closing */}
      <section className="rounded-lg border border-slate-200 bg-gradient-to-br from-navy-950 to-slate-900 p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-gold-300" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-300">Same backbone · different desk</p>
              <p className="mt-0.5 text-[12px] leading-5 text-blue-100/85">
                This page uses the same 7-category template, the same conflict-graph backbone, the same DIALECTICA recipes. Only the seed data changes.
              </p>
            </div>
          </div>
          <Link
            href="/app/projects"
            className="inline-flex items-center gap-1 rounded-md bg-gold-500 px-3 py-2 text-[11px] font-semibold text-navy-950 hover:bg-gold-400"
          >
            Other desks
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>
    </div>
  );
}

// Re-export common icons so desk pages can populate tools without importing lucide directly.
export const DESK_ICONS = {
  Activity, BookOpen, Building2, Compass, Database, FileSignature, Flag,
  Globe2, Library, MapPin, Network, Sparkles, Target, TrendingUp, Wrench,
};
