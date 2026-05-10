'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Clock3,
  FileText,
  Gauge,
  GitBranch,
  Layers3,
  MessageSquareText,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wrench,
} from 'lucide-react';
import {
  CONSOLIDATED_TOOLS,
  SPECIALIZED_TOOL_DEVELOPMENT_GROUPS,
  type ConsolidatedToolDefinition,
} from '@/lib/constants/consolidated-tools';
import { cn } from '@/lib/utils/cn';

const TOOL_ICON: Record<string, typeof Gauge> = {
  'situation-dashboard': Gauge,
  'context-builder': Target,
  'ask-praxis': MessageSquareText,
  'research-sources': Search,
  documents: FileText,
  graphops: Wrench,
  'conflict-graph': Network,
  timeline: Clock3,
  'actors-stakeholders': Users,
  'briefing-studio': Sparkles,
};

const DEMO_EVENTS = [
  { label: 'Context score raised', detail: 'Missing actors and mandate gaps flagged before model spend.', tone: 'emerald' },
  { label: 'Local media mapped', detail: 'Enab Baladi, Syria Direct, North Press, SANA, SOHR, and Syria Report separated by posture.', tone: 'blue' },
  { label: 'Graph proposal staged', detail: 'Agreement, rights, aid strain, returns, spillover, and media frames are ready for review.', tone: 'gold' },
  { label: 'Briefing generated', detail: 'Decision brief inherits citations, narrative lanes, graph signals, and drafting constraints.', tone: 'red' },
];

export function LivePlatformPreview() {
  const shouldReduceMotion = useReducedMotion() ?? false;
  const primary = CONSOLIDATED_TOOLS;

  return (
    <section id="tools" className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-600">Live Case Flow</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-navy-950 sm:text-5xl">
              Eight surfaces that feel like one operating room.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-navy-600">
              PRAXIS now opens on Desk, Context, Library, Research, Graph, Boardroom, Draft, and Tools. Every surface reads the same situation file, source receipts, document corpus, graph, and saved outputs, so the demo can move from login to cited brief without tool sprawl.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Metric value="8" label="product surfaces" />
              <Metric value="8" label="Syria media sources" />
              <Metric value="30" label="graph entities" />
              <Metric value="0" label="cloud calls to render demo" />
            </div>

            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/login?mode=demo&redirect=/app/syria-case%3Frecording%3D1%26case%3Dsyria"
                className="group inline-flex items-center justify-center gap-2 rounded-md bg-navy-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-navy-950/10 transition hover:bg-navy-800"
              >
                Open the Syria case
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md border border-navy-200 bg-white px-5 py-3 text-sm font-semibold text-navy-700 transition hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
              >
                Start private workspace
              </Link>
            </div>
          </div>

          <div className="relative">
            <motion.div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle_at_20%_20%,rgba(232,185,49,0.22),transparent_32%),radial-gradient(circle_at_80%_70%,rgba(75,146,219,0.22),transparent_34%)] blur-2xl"
              animate={shouldReduceMotion ? undefined : { opacity: [0.55, 0.9, 0.55] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative overflow-hidden rounded-2xl border border-navy-200 bg-white shadow-2xl shadow-navy-950/10">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-gold-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-2 font-mono text-[10px] text-navy-500">app/syria-case - consolidated workspace</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  Wired
                </span>
              </div>

              <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Core app runway</p>
                    <span className="rounded-full bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold text-gold-700">
                      8/8
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {primary.map((tool, index) => (
                      <ToolChip key={tool.id} tool={tool} index={index} shouldReduceMotion={shouldReduceMotion} />
                    ))}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Live AI chain</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-diplomatic-blue/8 px-2 py-0.5 text-[10px] font-semibold text-diplomatic-blue">
                      <Bot className="h-3 w-3" />
                      Demo ready
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="relative mx-auto h-48 max-w-[340px]">
                      <GraphNode className="left-[42%] top-[5%]" label="Situation" icon={Target} tone="blue" />
                      <GraphNode className="left-[8%] top-[38%]" label="Sources" icon={Search} tone="gold" />
                      <GraphNode className="left-[42%] top-[40%]" label="Graph" icon={GitBranch} tone="emerald" />
                      <GraphNode className="right-[8%] top-[38%]" label="Actors" icon={Users} tone="red" />
                      <GraphNode className="left-[42%] bottom-[4%]" label="Brief" icon={FileText} tone="navy" />
                      <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
                        <line x1="50%" y1="20%" x2="18%" y2="49%" className="stroke-diplomatic-blue/30" strokeWidth="2" />
                        <line x1="50%" y1="20%" x2="50%" y2="50%" className="stroke-diplomatic-blue/30" strokeWidth="2" />
                        <line x1="50%" y1="20%" x2="82%" y2="49%" className="stroke-diplomatic-blue/30" strokeWidth="2" />
                        <line x1="18%" y1="49%" x2="50%" y2="78%" className="stroke-gold-500/35" strokeWidth="2" />
                        <line x1="50%" y1="50%" x2="50%" y2="78%" className="stroke-emerald-500/35" strokeWidth="2" />
                        <line x1="82%" y1="49%" x2="50%" y2="78%" className="stroke-red-500/25" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {DEMO_EVENTS.map((event, index) => (
                      <motion.div
                        key={event.label}
                        initial={shouldReduceMotion ? false : { opacity: 0, x: 12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.12, duration: 0.35 }}
                        className="flex gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"
                      >
                        <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', eventTone(event.tone))} />
                        <span>
                          <span className="block text-xs font-semibold text-navy-900">{event.label}</span>
                          <span className="block text-[11px] leading-snug text-navy-500">{event.detail}</span>
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-5">
          {SPECIALIZED_TOOL_DEVELOPMENT_GROUPS.map((group) => (
            <div key={group.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-navy-950/5">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-diplomatic-blue" />
                <h3 className="text-xs font-semibold text-navy-900">{group.label}</h3>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-navy-500">{group.nextLiveAiUpgrade}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolChip({
  tool,
  index,
  shouldReduceMotion,
}: {
  tool: ConsolidatedToolDefinition;
  index: number;
  shouldReduceMotion: boolean;
}) {
  const Icon = TOOL_ICON[tool.id] ?? Sparkles;
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="group rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition hover:border-diplomatic-blue/30 hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-diplomatic-blue/8 text-diplomatic-blue">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[11px] font-semibold text-navy-900">{tool.shortLabel}</span>
          <span className="block truncate text-[10px] text-navy-500">{tool.primaryOutput}</span>
        </span>
      </div>
    </motion.div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-navy-200 bg-white p-3 shadow-sm shadow-navy-950/5">
      <p className="font-mono text-2xl font-bold text-diplomatic-blue">{value}</p>
      <p className="mt-1 text-xs text-navy-500">{label}</p>
    </div>
  );
}

function GraphNode({
  className,
  label,
  icon: Icon,
  tone,
}: {
  className: string;
  label: string;
  icon: typeof Gauge;
  tone: 'blue' | 'gold' | 'emerald' | 'red' | 'navy';
}) {
  return (
    <div className={cn('absolute z-10 flex -translate-x-1/2 flex-col items-center gap-1', className)}>
      <span className={cn('flex h-12 w-12 items-center justify-center rounded-full border bg-white shadow-lg', nodeTone(tone))}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-navy-700 shadow-sm">
        {label}
      </span>
    </div>
  );
}

function nodeTone(tone: 'blue' | 'gold' | 'emerald' | 'red' | 'navy'): string {
  if (tone === 'gold') return 'border-gold-500/30 text-gold-700';
  if (tone === 'emerald') return 'border-emerald-500/30 text-emerald-700';
  if (tone === 'red') return 'border-red-500/25 text-red-700';
  if (tone === 'navy') return 'border-navy-500/20 text-navy-800';
  return 'border-diplomatic-blue/30 text-diplomatic-blue';
}

function eventTone(tone: string): string {
  if (tone === 'gold') return 'bg-gold-500';
  if (tone === 'emerald') return 'bg-emerald-500';
  if (tone === 'red') return 'bg-red-500';
  return 'bg-diplomatic-blue';
}
