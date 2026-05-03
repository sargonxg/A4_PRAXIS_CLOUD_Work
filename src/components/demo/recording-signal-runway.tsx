'use client';

import { useMemo } from 'react';
import type React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  FileText,
  GitBranch,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import {
  SYRIA_DEMO_SITUATION,
  SYRIA_DEMO_SOURCE_SCOUT_OUTPUT,
  SYRIA_RECORDING_STORY,
} from '@/lib/constants/syria-demo-case';
import { cn } from '@/lib/utils/cn';

type RunwayDensity = 'full' | 'compact' | 'brief';
type RunwayFocus = 'overview' | 'sources' | 'graph' | 'advisors' | 'briefing';

interface SignalStep {
  label: string;
  detail: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

interface Metric {
  label: string;
  value: string;
  detail: string;
}

interface RecordingSignalRunwayProps {
  title: string;
  subtitle: string;
  steps: SignalStep[];
  metrics: Metric[];
  beats: string[];
  density?: RunwayDensity;
  focus?: RunwayFocus;
  className?: string;
}

const FOCUS_COPY: Record<RunwayFocus, string> = {
  overview: 'Case file is primed for a 45-second recording path.',
  sources: 'Source receipts are checkable before the graph or AI output is trusted.',
  graph: 'Graph primitives are ready for visual exploration and downstream AI context.',
  advisors: 'Advisor disagreement is preserved for the principal instead of flattened.',
  briefing: 'The decision product separates facts, assessment, triggers, and gaps.',
};

export function RecordingSignalRunway({
  title,
  subtitle,
  steps,
  metrics,
  beats,
  density = 'full',
  focus = 'overview',
  className,
}: RecordingSignalRunwayProps) {
  const reduceMotion = useReducedMotion();
  const visibleSteps = density === 'brief' ? steps.slice(-2) : density === 'compact' ? steps.slice(0, 4) : steps;
  const visibleMetrics = density === 'brief' ? metrics.slice(0, 2) : metrics;
  const visibleBeats = density === 'full' ? beats.slice(0, 4) : beats.slice(0, 2);

  return (
    <section className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm shadow-navy-950/5', className)}>
      <div className="relative border-b border-slate-200 bg-[linear-gradient(120deg,#f8fafc,#ffffff_45%,#fff7e6)] px-4 py-4">
        <div className="absolute inset-0 opacity-70">
          <motion.div
            aria-hidden
            className="absolute left-0 top-0 h-px w-2/3 bg-gradient-to-r from-transparent via-gold-500 to-transparent"
            animate={reduceMotion ? undefined : { x: ['-60%', '160%'] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            aria-hidden
            className="absolute bottom-0 right-0 h-px w-1/2 bg-gradient-to-r from-transparent via-diplomatic-blue to-transparent"
            animate={reduceMotion ? undefined : { x: ['80%', '-160%'] }}
            transition={{ duration: 5.6, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-navy-900 text-white">
                <Radio className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Recording signal runway</p>
                <h2 className="text-base font-semibold text-navy-950">{title}</h2>
              </div>
            </div>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-navy-600">{subtitle}</p>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-right">
            <div className="flex items-center justify-end gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Case-ready
            </div>
            <p className="mt-1 max-w-[220px] text-[11px] leading-snug text-emerald-900">{FOCUS_COPY[focus]}</p>
          </div>
        </div>
      </div>

      <div className={cn('grid gap-4 p-4', density === 'full' ? 'xl:grid-cols-[minmax(0,1.25fr)_360px]' : 'lg:grid-cols-[minmax(0,1fr)_300px]')}>
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {visibleMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">{metric.label}</p>
                <p className="mt-1 text-lg font-semibold text-navy-950">{metric.value}</p>
                <p className="mt-1 text-[11px] leading-snug text-navy-500">{metric.detail}</p>
              </motion.div>
            ))}
          </div>

          <div className="relative rounded-lg border border-slate-200 bg-white p-3">
            <div className="absolute left-7 top-8 hidden h-[calc(100%-4rem)] w-px bg-slate-200 md:block" />
            <div className="grid gap-2">
              {visibleSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <PraxisLink
                    key={step.href}
                    href={step.href}
                    className="group relative grid gap-2 rounded-md border border-slate-200 bg-white px-3 py-3 transition hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5 md:grid-cols-[44px_minmax(0,1fr)_24px]"
                  >
                    <motion.span
                      className={cn('z-10 flex h-9 w-9 items-center justify-center rounded-md text-white', step.tone)}
                      animate={reduceMotion ? undefined : { scale: [1, 1.05, 1] }}
                      transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.2 }}
                    >
                      <Icon className="h-4 w-4" />
                    </motion.span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-navy-900">{step.label}</span>
                      <span className="mt-1 block text-[11px] leading-snug text-navy-500">{step.detail}</span>
                    </span>
                    <ArrowRight className="hidden h-4 w-4 self-center text-navy-300 transition group-hover:text-diplomatic-blue md:block" />
                  </PraxisLink>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-navy-950 p-4 text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-400" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-300">Recording narration</p>
            </div>
            <div className="mt-3 space-y-2">
              {visibleBeats.map((beat, index) => (
                <motion.p
                  key={beat}
                  initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                  animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + index * 0.08 }}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-snug text-blue-50/85"
                >
                  {beat}
                </motion.p>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Signal chain</p>
            <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-navy-700">
              <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">Receipts</span>
              <ArrowRight className="h-3.5 w-3.5 text-navy-300" />
              <span className="rounded bg-diplomatic-blue/10 px-2 py-1 text-diplomatic-blue">Graph</span>
              <ArrowRight className="h-3.5 w-3.5 text-navy-300" />
              <span className="rounded bg-gold-500/15 px-2 py-1 text-gold-700">Brief</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-diplomatic-blue to-gold-500"
                animate={reduceMotion ? undefined : { width: ['30%', '78%', '100%'] }}
                transition={{ duration: 3.2, repeat: Infinity, repeatType: 'reverse' }}
                style={{ width: '78%' }}
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function SyriaRecordingRunway({
  density = 'full',
  focus = 'overview',
  className,
}: {
  density?: RunwayDensity;
  focus?: RunwayFocus;
  className?: string;
}) {
  const riskDisplay = SYRIA_DEMO_SITUATION.riskScore <= 10
    ? Math.round(SYRIA_DEMO_SITUATION.riskScore * 10)
    : Math.round(SYRIA_DEMO_SITUATION.riskScore);
  const metrics = useMemo<Metric[]>(
    () => [
      {
        label: 'Case risk',
        value: `${riskDisplay}/100`,
        detail: 'Volatile transition risk with explicit triggers.',
      },
      {
        label: 'Graph',
        value: `${SYRIA_DEMO_SITUATION.graphEntities}`,
        detail: 'Actors, claims, events, constraints, and commitments.',
      },
      {
        label: 'Receipts',
        value: `${SYRIA_DEMO_SOURCE_SCOUT_OUTPUT.sourceAudit?.sourceCount ?? 5}`,
        detail: 'High-reliability public-source receipts.',
      },
      {
        label: 'Output',
        value: '7 slides',
        detail: 'Decision brief, risk board, actions, and gaps.',
      },
    ],
    [riskDisplay],
  );

  const steps = useMemo<SignalStep[]>(
    () => [
      {
        label: 'Source receipts',
        detail: 'UN, OCHA, UNFPA, UNHCR, and CCA sources are visible before AI output.',
        href: '/source-scout?recording=1&case=syria',
        icon: Search,
        tone: 'bg-emerald-600',
      },
      {
        label: 'Graph backbone',
        detail: 'Firestore graph health exposes provenance, temporal anchors, and repair cues.',
        href: '/graphops?recording=1&case=syria',
        icon: GitBranch,
        tone: 'bg-diplomatic-blue',
      },
      {
        label: 'Expert disagreement',
        detail: 'Mediator, humanitarian, legal, security, media, and red-team views stay separate.',
        href: '/brainstorming-table?recording=1&case=syria',
        icon: Brain,
        tone: 'bg-navy-800',
      },
      {
        label: 'Decision brief',
        detail: 'The recording ends on a briefable product with triggers and source basis.',
        href: '/briefing?recording=1&case=syria',
        icon: FileText,
        tone: 'bg-gold-600',
      },
    ],
    [],
  );

  return (
    <RecordingSignalRunway
      title="Syria transition case spine"
      subtitle="A reusable PRAXIS pattern for real workspaces: source receipts become graph primitives, graph context feeds expert disagreement, and the final brief shows uncertainty and next actions."
      steps={steps}
      metrics={metrics}
      beats={SYRIA_RECORDING_STORY}
      density={density}
      focus={focus}
      className={className}
    />
  );
}

export function SyriaMiniSignalStrip({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-3', className)}>
      {[
        { label: 'Public receipts verified', icon: ShieldCheck, tone: 'text-emerald-600' },
        { label: 'Graph links active', icon: GitBranch, tone: 'text-diplomatic-blue' },
        { label: 'Brief ready to record', icon: Activity, tone: 'text-gold-700' },
      ].map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2">
            <Icon className={cn('h-4 w-4', item.tone)} />
            <span className="text-[11px] font-semibold text-navy-700">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
