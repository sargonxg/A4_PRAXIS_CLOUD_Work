'use client';

/**
 * PRAXIS Workflows page.
 *
 * Standalone page that explains the three rhythms of the policy desk —
 * morning brief, reactive incident, strategic memo — and links each one
 * back into the live Syria case file. Workflows are described as a generic
 * pattern that any policy domain reuses.
 */

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, Building, Clock, FileSignature, FlaskConical, GitMerge, ListChecks,
  Newspaper, Search, ShieldAlert, Siren, Sparkles, Sunrise, Workflow as WorkflowIcon,
} from 'lucide-react';
import { SyriaWalkthroughNav } from '@/components/syria/walkthrough-nav';
import { cn } from '@/lib/utils/cn';

interface WorkflowDef {
  id: string;
  name: string;
  pace: string;
  outcome: string;
  badge: string;
  badgeIcon: typeof Sunrise;
  tone: { ring: string; bg: string; accent: string };
  steps: { label: string; detail: string; icon: typeof Newspaper }[];
  exampleCase: { name: string; trigger: string; output: string };
}

const WORKFLOWS: WorkflowDef[] = [
  {
    id: 'morning-brief',
    name: 'Morning brief loop',
    pace: 'Daily · 06:30 → 09:00 EDT',
    outcome: 'One-page principal briefing on the desk before the first informal',
    badge: 'Proactive · cyclic',
    badgeIcon: Sunrise,
    tone: { ring: 'ring-emerald-300/40', bg: 'bg-emerald-50', accent: 'text-emerald-700' },
    steps: [
      { label: 'Watched feeds intake', detail: 'OCHA · UN Geneva · ECFR · Reuters · North Press · IPI', icon: Newspaper },
      { label: 'Trust triage',          detail: 'Tier-rank + provenance pin · disputed downgrades flagged',  icon: ShieldAlert },
      { label: 'Graph patches',         detail: 'Approve / dispute proposals into graph_updates queue',     icon: GitMerge },
      { label: 'Recipe refresh',        detail: 'COMMITMENT-CHECK runs over the new edges',                  icon: FlaskConical },
      { label: 'Brief regeneration',    detail: 'Word-style brief streams new BLUF + risk board',            icon: FileSignature },
    ],
    exampleCase: {
      name: 'Syria · 04 May 2026',
      trigger: '3 alerts received pre-09:00 (UN Envoy, North Press, EU wire)',
      output: 'Brief BLUF updated with detention-access pause; sanctions section unchanged',
    },
  },
  {
    id: 'incident-response',
    name: 'Reactive incident workflow',
    pace: 'Event-driven · sub-hour',
    outcome: 'Defendable Q&A and revised line within minutes of the incident',
    badge: 'Reactive · adversarial',
    badgeIcon: Siren,
    tone: { ring: 'ring-rose-300/40', bg: 'bg-rose-50', accent: 'text-rose-700' },
    steps: [
      { label: 'Alert detection',       detail: 'Threshold trigger (4 clashes / 7d) crossed in source feeds', icon: Siren },
      { label: 'Source triage',         detail: 'Cross-reference local + UN tier; quarantine state messaging', icon: Search },
      { label: 'Graph delta',           detail: 'Affected nodes highlighted with counterfactual edges',         icon: GitMerge },
      { label: 'Red-team review',       detail: 'Surfaces 3 falsification paths with named signals',            icon: ShieldAlert },
      { label: 'Talking points pivot',  detail: 'Public-safe language + dissent box generated',                 icon: Sparkles },
    ],
    exampleCase: {
      name: 'Syria · 30 March 2025 coastal violence',
      trigger: '800+ civilian casualty reports along Latakia-Tartus coast within 5 days',
      output: 'Talking points + minority-protection memo regenerated within 48 minutes',
    },
  },
  {
    id: 'strategic-memo',
    name: 'Strategic memo workflow',
    pace: 'Multi-day · 2-5 sessions',
    outcome: '30-page memo with provenance per claim, dissent annexed, ready for review board',
    badge: 'Long-form · deliberate',
    badgeIcon: Building,
    tone: { ring: 'ring-blue-300/40', bg: 'bg-blue-50', accent: 'text-blue-700' },
    steps: [
      { label: 'Question scoping',       detail: 'Brainstorming table generates research-grade question with chips', icon: ListChecks },
      { label: 'Corpus expansion',       detail: 'Source Scout adds anchors across UN, academic, data, testimony',     icon: Search },
      { label: 'Recipes over the graph', detail: 'LEVERAGE-TRACE + INTEREST-vs-POSITION + PATH-SEARCH chained',         icon: FlaskConical },
      { label: 'Comparator overlay',     detail: 'Tunisia 2013 + Bosnia Dayton scored against the active graph',         icon: WorkflowIcon },
      { label: 'Memo composition',       detail: 'TipTap editor preserves blocks; dissent + provenance per section',     icon: FileSignature },
    ],
    exampleCase: {
      name: 'Syria · sanctions sequencing memo (Apr-May 2026)',
      trigger: 'Director request: brief on conditional EU delisting paths',
      output: '24-page memo with comparator overlay, advisor split documented, dissent annex',
    },
  },
];

const STATS = [
  { label: 'Workflows', value: '3', icon: WorkflowIcon },
  { label: 'Domain-agnostic',  value: 'Yes', icon: Sparkles },
  { label: 'Avg time saved',  value: '~70%',  icon: Clock },
];

export default function WorkflowsPage() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="min-h-screen bg-slate-50">
      <SyriaWalkthroughNav />

      <header className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Workflows
            </span>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-800">
              Three rhythms · same backbone
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl lg:text-[34px]">
            Three rhythms of the policy desk
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Each workflow is a named pipeline with five PRAXIS stops. The same context block, source layer, graph
            backbone, and reasoning recipes power all three — only the cadence and outcome differ.
          </p>
          <div className="mt-4 grid max-w-md grid-cols-3 gap-2">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-md border border-slate-200 bg-white p-2 text-center">
                  <Icon className="mx-auto h-3.5 w-3.5 text-navy-500" />
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
                  <p className="mt-0.5 font-mono text-base font-semibold text-navy-950">{s.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
        {WORKFLOWS.map((wf, idx) => {
          const BadgeIcon = wf.badgeIcon;
          return (
            <motion.section
              key={wf.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm ring-2', wf.tone.ring)}
            >
              <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-md', wf.tone.bg, wf.tone.accent)}>
                    <BadgeIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className={cn('text-[10px] font-semibold uppercase tracking-wider', wf.tone.accent)}>{wf.badge}</p>
                    <h2 className="text-sm font-semibold text-navy-950">{wf.name}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{wf.pace}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-navy-700">{wf.outcome}</p>
                </div>
              </header>

              <div className="mt-3 grid gap-2 lg:grid-cols-5">
                {wf.steps.map((step, sIdx) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-slate-500" />
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Step {sIdx + 1}</span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-navy-950">{step.label}</p>
                      <p className="mt-0.5 text-[10px] leading-4 text-slate-600">{step.detail}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Example case</p>
                  <p className="mt-1 text-[11px] font-semibold text-navy-950">{wf.exampleCase.name}</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Trigger</p>
                  <p className="mt-1 text-[11px] leading-4 text-navy-900">{wf.exampleCase.trigger}</p>
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">Output</p>
                  <p className="mt-1 text-[11px] leading-4 text-emerald-900">{wf.exampleCase.output}</p>
                </div>
              </div>

              <div className="mt-3">
                <Link
                  href="/app/syria-case#syria-workflows"
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-semibold transition',
                    wf.tone.bg, wf.tone.accent, 'hover:opacity-80',
                  )}
                >
                  See it run on Syria
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </motion.section>
          );
        })}

        <section className="rounded-lg border border-navy-200 bg-gradient-to-br from-navy-950 to-slate-900 p-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-300">DIALECTICA backbone</p>
              <h3 className="mt-1 text-base font-semibold">Same recipes, every workflow</h3>
              <p className="mt-1 max-w-2xl text-[12px] leading-5 text-blue-100/85">
                Morning brief and reactive incident lean on COMMITMENT-CHECK and PATH-SEARCH for fresh evidence; the
                strategic memo chains LEVERAGE-TRACE + INTEREST-vs-POSITION over the same graph. The reasoning is
                portable across policy domains.
              </p>
            </div>
            <Link href="/app/projects" className="inline-flex items-center gap-1 rounded-md bg-gold-500 px-3 py-2 text-[11px] font-semibold text-navy-950 hover:bg-gold-400">
              Try on another project
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
