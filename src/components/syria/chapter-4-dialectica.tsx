'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { BrainCircuit, CheckCircle2, GitPullRequest, Layers, Route, Scale, SearchX } from 'lucide-react';
import { SYRIA_DEMO_CONFLICT_GRAPH } from '@/lib/constants/syria-demo-case';
import {
  SYRIA_COMMITMENT_MONITOR_DEMO,
  SYRIA_DISCREPANCY_WORKFLOWS,
  SYRIA_GRAPH_GROUNDING_PIPELINE,
  SYRIA_NEUROSYMBOLIC_POLICY_PAYOFFS,
  SYRIA_ONTOLOGY_REASONING_TRACKS,
} from '@/lib/constants/syria-demo-workspace';
import { SYRIA_CACHED_RECIPE_RESULTS } from '@/lib/syria/cached-recipe-results';
import { SYRIA_COMPARISON_CASES } from '@/lib/syria/comparison-cases';
import { SYRIA_AGENT_PRESETS } from '@/lib/syria/agent-presets';
import { SyriaAgentConsole } from '@/components/syria/agent-console';
import { SyriaAdvisoryDebate } from '@/components/syria/advisory-debate';
import { SyriaSanctionsBoard } from '@/components/syria/sanctions-board';
import { SyriaRecipeCard } from './recipe-card';

const RECIPES = [
  {
    code: 'LEVERAGE-TRACE',
    title: 'Find the real leverage path',
    icon: GitPullRequest,
    input: SYRIA_DEMO_CONFLICT_GRAPH.leverage[0]?.title ?? 'Institutional leverage',
    output: 'Who can move the SDF integration track, what it costs, and which source proves it.',
  },
  {
    code: 'COMMITMENT-CHECK',
    title: 'Turn agreements into compliance tests',
    icon: CheckCircle2,
    input: SYRIA_COMMITMENT_MONITOR_DEMO[0]?.commitment ?? 'January integration commitment',
    output: 'Parties, obligations, evidence needed, blockers, and next monitoring search.',
  },
  {
    code: 'INTEREST-vs-POSITION',
    title: 'Separate stated claims from durable interests',
    icon: Scale,
    input: SYRIA_DEMO_CONFLICT_GRAPH.interests[1]?.title ?? 'Actor interest',
    output: 'Negotiable language, red lines, and risks that do not appear in public statements.',
  },
  {
    code: 'COUNTER-NARRATIVE',
    title: 'Compare official, local, and humanitarian frames',
    icon: SearchX,
    input: SYRIA_DISCREPANCY_WORKFLOWS[1]?.question ?? 'Statement discrepancy',
    output: 'Exact wording differences and a diplomatic formulation that does not overclaim.',
  },
  {
    code: 'PATH-SEARCH',
    title: 'Search only the missing graph edges',
    icon: Route,
    input: 'Graph path: commitment -> rights -> returns -> access -> regional spillover',
    output: 'Targeted live searches that refresh gaps without reprocessing the full corpus.',
  },
];

type ComparatorRole = 'pattern' | 'monitoring' | 'positive' | 'cautionary';

const COMPARATOR_PICKS: { id: string; role: ComparatorRole; tagline: string }[] = [
  {
    id: 'lebanon-taif-1989',
    role: 'pattern',
    tagline: 'National compact + militia integration + external guarantor',
  },
  {
    id: 'bosnia-dayton-1995',
    role: 'monitoring',
    tagline: 'Return provisions + supervised institutions + verification logic',
  },
  {
    id: 'tunisia-national-dialogue-2013',
    role: 'positive',
    tagline: 'Civil-society standing in constitutional drafting',
  },
  {
    id: 'iraq-de-baathification-2003',
    role: 'cautionary',
    tagline: 'Inverse: army dissolved without absorption -> insurgency cycle',
  },
];

const ROLE_TONE: Record<ComparatorRole, { badge: string; border: string; label: string }> = {
  pattern:    { label: 'Pattern match',    badge: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-200' },
  monitoring: { label: 'Monitoring logic', badge: 'bg-blue-100 text-blue-800',       border: 'border-blue-200' },
  positive:   { label: 'Positive analog',  badge: 'bg-teal-100 text-teal-800',       border: 'border-teal-200' },
  cautionary: { label: 'Cautionary',       badge: 'bg-rose-100 text-rose-800',       border: 'border-rose-200' },
};

export function SyriaChapterDialectica() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-3 md:grid-cols-2">
          {RECIPES.map((recipe) => {
            const Icon = recipe.icon;
            const cached = SYRIA_CACHED_RECIPE_RESULTS.find((item) => item.code === recipe.code);
            return cached ? <SyriaRecipeCard key={recipe.code} recipe={cached} icon={Icon} /> : null;
          })}
        </div>

        <aside className="grid gap-3">
          <div className="rounded-lg border border-navy-200 bg-navy-950 p-4 text-white">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-gold-200" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/55">DIALECTICA backbone</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-blue-100/80">
              LLMs read messy sources. The graph keeps durable actors, claims, dates, commitments, and contradictions. DIALECTICA
              binds them together so every answer can expose evidence, missing edges, and reasoning steps.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ontology tracks</p>
            <div className="mt-3 space-y-2">
              {SYRIA_ONTOLOGY_REASONING_TRACKS.map((track) => (
                <div key={track.track} className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-navy-950">{track.track}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-600">{track.policyQuestion}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gold-200 bg-gold-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-800">Graph-grounded execution</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SYRIA_GRAPH_GROUNDING_PIPELINE.map((step) => (
                <span key={step.step} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-navy-800">
                  {step.step}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-gold-900">
              {SYRIA_NEUROSYMBOLIC_POLICY_PAYOFFS[0]?.capability}
            </p>
          </div>
        </aside>
      </div>

      <div id="syria-red-team" className="scroll-mt-24">
        <SyriaAgentConsole
          persona={SYRIA_AGENT_PRESETS['red-team-review']!.persona}
          toolId={SYRIA_AGENT_PRESETS['red-team-review']!.toolId}
          question={SYRIA_AGENT_PRESETS['red-team-review']!.question}
          trace={SYRIA_AGENT_PRESETS['red-team-review']!.trace}
          answer={SYRIA_AGENT_PRESETS['red-team-review']!.answer}
        />
      </div>

      <section id="syria-comparator-strip" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-diplomatic-blue">
              <Layers className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Case archive · structured analogs</p>
            </div>
            <h3 className="mt-1 text-lg font-semibold text-navy-950">
              Four named comparators: Lebanon, Bosnia, Tunisia, Iraq 2003
            </h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-600">
              Each one is treated as a graph, not a metaphor. PRAXIS labels the role each plays for the Syria file —
              pattern match, monitoring logic, positive analog, or cautionary inverse — and keeps the reasoning auditable.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            {SYRIA_COMPARISON_CASES.length} indexed
          </span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {COMPARATOR_PICKS.map((pick, index) => {
            const detail = SYRIA_COMPARISON_CASES.find((item) => item.id === pick.id);
            if (!detail) return null;
            const tone = ROLE_TONE[pick.role];
            return (
              <motion.article
                key={pick.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.32, delay: index * 0.06, ease: 'easeOut' }}
                className={`rounded-lg border ${tone.border} bg-white p-3 shadow-sm`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.badge}`}>
                    {tone.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{detail.era}</span>
                </div>
                <h4 className="mt-2 text-sm font-semibold text-navy-950">{detail.name}</h4>
                <p className="mt-1 text-[11px] font-medium text-slate-500">{detail.geography}</p>
                <p className="mt-2 text-[11px] leading-4 text-slate-700">{pick.tagline}</p>
                <ol className="mt-3 list-decimal space-y-1 pl-4 text-[11px] leading-4 text-slate-700">
                  {detail.lessonsForSyria.slice(0, 2).map((lesson) => (
                    <li key={lesson}>{lesson}</li>
                  ))}
                </ol>
                <p className="mt-3 rounded-md bg-amber-50 p-2 text-[10px] leading-4 text-amber-900">
                  Caution: {detail.limitations}
                </p>
              </motion.article>
            );
          })}
        </div>
      </section>

      <div id="syria-advisory-debate" className="scroll-mt-24"><SyriaAdvisoryDebate /></div>
      <div id="syria-sanctions" className="scroll-mt-24"><SyriaSanctionsBoard /></div>
    </div>
  );
}
