'use client';

/**
 * Three real-user PRAXIS workflows.
 *
 * Built from observed UN-NY analyst rhythms: the morning brief (proactive,
 * cyclic), the reactive incident response (event-driven), and the strategic
 * memo (long-form, deliberate). Each workflow shows the named PRAXIS stops
 * a real analyst would hit, so a viewer sees the platform as a daily tool.
 */

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Building, FileSignature, FlaskConical, GitMerge, ListChecks, Newspaper, Search, ShieldAlert, Siren, Sparkles, Sunrise, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface WorkflowStep {
  label: string;
  detail: string;
  icon: typeof Newspaper;
}

interface WorkflowDef {
  id: string;
  name: string;
  pace: string;
  outcome: string;
  steps: WorkflowStep[];
  badge: string;
  badgeIcon: typeof Sunrise;
}

const WORKFLOWS: WorkflowDef[] = [
  {
    id: 'morning-brief',
    name: 'Morning brief loop',
    pace: 'Daily · 06:30 → 09:00 EDT',
    outcome: 'One-page principal briefing on the desk before the first informal',
    badge: 'Proactive · cyclic',
    badgeIcon: Sunrise,
    steps: [
      { label: 'Watched feeds intake', detail: 'OCHA · UN Geneva · ECFR · Reuters · North Press · IPI', icon: Newspaper },
      { label: 'Trust triage',          detail: 'Tier-rank + provenance pin · disputed downgrades flagged',  icon: ShieldAlert },
      { label: 'Graph patches',         detail: 'Approve / dispute proposals into graph_updates queue',     icon: GitMerge },
      { label: 'Recipe refresh',        detail: 'COMMITMENT-CHECK runs over the new edges',                  icon: FlaskConical },
      { label: 'Brief regeneration',    detail: 'Word-style brief streams new BLUF + risk board',            icon: FileSignature },
    ],
  },
  {
    id: 'incident-response',
    name: 'Reactive incident workflow',
    pace: 'Event-driven · sub-hour',
    outcome: 'Defendable Q&A and revised line within minutes of the incident',
    badge: 'Reactive · adversarial',
    badgeIcon: Siren,
    steps: [
      { label: 'Alert detection',       detail: 'Threshold trigger (4 clashes / 7d) crossed in source feeds', icon: Siren },
      { label: 'Source triage',         detail: 'Cross-reference local + UN tier; quarantine state messaging', icon: Search },
      { label: 'Graph delta',           detail: 'Affected nodes highlighted with counterfactual edges',         icon: GitMerge },
      { label: 'Red-team review',       detail: 'Surfaces 3 falsification paths with named signals',            icon: ShieldAlert },
      { label: 'Talking points pivot',  detail: 'Public-safe language + dissent box generated',                 icon: Sparkles },
    ],
  },
  {
    id: 'strategic-memo',
    name: 'Strategic memo workflow',
    pace: 'Multi-day · 2-5 sessions',
    outcome: 'Thirty-page memo with provenance per claim, dissent annexed, ready for review board',
    badge: 'Long-form · deliberate',
    badgeIcon: Building,
    steps: [
      { label: 'Question scoping',       detail: 'Brainstorming table generates research-grade question with chips', icon: ListChecks },
      { label: 'Corpus expansion',       detail: 'Source Scout adds anchors across UN, academic, data, testimony',     icon: Search },
      { label: 'Recipes over the graph', detail: 'LEVERAGE-TRACE + INTEREST-vs-POSITION + PATH-SEARCH chained',         icon: FlaskConical },
      { label: 'Comparator overlay',     detail: 'Tunisia 2013 + Bosnia Dayton scored against the active graph',         icon: Workflow },
      { label: 'Memo composition',       detail: 'TipTap editor preserves blocks; dissent + provenance per section',     icon: FileSignature },
    ],
  },
];

const TONE = {
  'morning-brief':    { ring: 'ring-emerald-300/40', accent: 'text-emerald-700', bg: 'bg-emerald-50' },
  'incident-response':{ ring: 'ring-rose-300/40',     accent: 'text-rose-700',     bg: 'bg-rose-50' },
  'strategic-memo':   { ring: 'ring-blue-300/40',     accent: 'text-blue-700',     bg: 'bg-blue-50' },
};

export function SyriaWorkflowsBoard({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string>(WORKFLOWS[0]!.id);
  const [stepIdx, setStepIdx] = useState(0);
  const active = WORKFLOWS.find((w) => w.id === activeId)!;

  useEffect(() => {
    if (reduceMotion) return undefined;
    const t = window.setInterval(() => {
      setStepIdx((idx) => (idx + 1) % active.steps.length);
    }, 1300);
    return () => window.clearInterval(t);
  }, [active.steps.length, reduceMotion]);

  useEffect(() => {
    setStepIdx(0);
  }, [activeId]);

  const tone = TONE[active.id as keyof typeof TONE];
  const BadgeIcon = active.badgeIcon;

  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-950 text-white">
            <Workflow className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-700">Real workflows</p>
            <h3 className="text-sm font-semibold text-navy-950">
              Three rhythms of the desk: morning brief · reactive incident · strategic memo
            </h3>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {WORKFLOWS.map((wf) => {
            const Icon = wf.badgeIcon;
            const isActive = wf.id === activeId;
            return (
              <button
                key={wf.id}
                type="button"
                onClick={() => setActiveId(wf.id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition',
                  isActive ? 'border-navy-400 bg-navy-950 text-white' : 'border-slate-200 text-navy-700 hover:bg-slate-50',
                )}
              >
                <Icon className="h-3 w-3" />
                {wf.name}
              </button>
            );
          })}
        </div>
      </header>

      <motion.div
        key={active.id}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className={cn('mt-4 rounded-md border bg-gradient-to-br p-4 ring-2', tone.ring, tone.bg, 'border-slate-200')}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BadgeIcon className={cn('h-4 w-4', tone.accent)} />
            <div>
              <p className={cn('text-[10px] font-semibold uppercase tracking-wider', tone.accent)}>{active.badge}</p>
              <h4 className="text-sm font-semibold text-navy-950">{active.name}</h4>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{active.pace}</p>
            <p className="mt-0.5 text-[11px] font-medium text-navy-700">{active.outcome}</p>
          </div>
        </div>

        <div className="mt-3 grid gap-2 lg:grid-cols-5">
          {active.steps.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = stepIdx === idx;
            const isDone = stepIdx > idx;
            return (
              <motion.div
                key={`${active.id}-${step.label}`}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.28 }}
                className={cn(
                  'rounded-md border p-2 transition',
                  isCurrent ? 'border-navy-400 bg-white shadow ring-1 ring-navy-200' :
                  isDone ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-200 bg-white',
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={cn('h-3 w-3', isCurrent ? 'text-navy-800' : isDone ? 'text-emerald-700' : 'text-slate-400')} />
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Step {idx + 1}</span>
                </div>
                <p className="mt-1 text-[11px] font-semibold text-navy-950">{step.label}</p>
                <p className="mt-0.5 text-[10px] leading-4 text-slate-600">{step.detail}</p>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-navy-700">
          <ArrowRight className="h-3 w-3" />
          {active.id === 'morning-brief'
            ? 'Daily, your brief lands at 09:00 with three named triggers and a one-line ask.'
            : active.id === 'incident-response'
              ? 'Within the hour, your talking points carry a dissent box and named signal-watches.'
              : 'Across sessions, the memo accretes provenance until it is review-ready.'}
        </p>
      </motion.div>
    </section>
  );
}
