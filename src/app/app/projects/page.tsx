'use client';

/**
 * PRAXIS Projects board.
 *
 * Generic by design: each card represents a policy file and uses the same
 * 7-category template. Syria is the populated, "open" example. Sudan,
 * Haiti, Myanmar, Lebanon, Sahel are stubs that show the platform is not
 * Syria-specific — the same cockpit pattern repeats per project.
 */

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, Brain, Compass, Database, FileText, FolderKanban, Globe2,
  Layers, Network, Sparkles, Users, Workflow as WorkflowIcon,
} from 'lucide-react';
import { SyriaWalkthroughNav } from '@/components/syria/walkthrough-nav';
import { cn } from '@/lib/utils/cn';

interface Project {
  id: string;
  name: string;
  region: string;
  domain: string;
  persona: string;
  status: 'open' | 'monitoring' | 'archived' | 'stub';
  risk: number;
  sources: number;
  briefingFreq: string;
  hero: string;
  href: string;
  tags: string[];
}

const PROJECTS: Project[] = [
  {
    id: 'syria',
    name: 'Syria · post-Assad transition',
    region: 'Middle East',
    domain: 'Armed conflict + governance',
    persona: 'UN-NY analyst',
    status: 'open',
    risk: 78,
    sources: 72,
    briefingFreq: 'Daily',
    hero: 'The integration agreement is centre of gravity — minorities, sanctions, and regional spillover are the live triggers.',
    href: '/app/syria-case',
    tags: ['integration', 'minority-protection', 'sanctions', 'returns', 'regional-spillover'],
  },
  {
    id: 'sudan',
    name: 'Sudan · RSF-SAF civil war',
    region: 'East Africa',
    domain: 'Armed conflict + humanitarian',
    persona: 'Humanitarian lead',
    status: 'monitoring',
    risk: 82,
    sources: 41,
    briefingFreq: 'Daily',
    hero: 'Famine declared in Zamzam · cross-border aid disputes · regional spoiler dynamics across UAE, Egypt, Chad.',
    href: '/app/cockpit',
    tags: ['famine', 'cross-border', 'spoilers', 'displacement', 'darfur'],
  },
  {
    id: 'haiti',
    name: 'Haiti · MSS mission and gangs',
    region: 'Caribbean',
    domain: 'Stabilisation + sanctions',
    persona: 'Mission planner',
    status: 'monitoring',
    risk: 71,
    sources: 28,
    briefingFreq: 'Bi-weekly',
    hero: 'MSS deployment patchy · Kenya rotation gap · transitional council legitimacy under pressure.',
    href: '/app/cockpit',
    tags: ['MSS', 'transitional-council', 'sanctions', 'gangs', 'reconstruction'],
  },
  {
    id: 'myanmar',
    name: 'Myanmar · post-coup civil resistance',
    region: 'Southeast Asia',
    domain: 'Rights + sanctions',
    persona: 'Rights observer',
    status: 'monitoring',
    risk: 64,
    sources: 35,
    briefingFreq: 'Weekly',
    hero: 'Operation 1027 momentum · NUG diplomacy · ASEAN consensus erosion.',
    href: '/app/cockpit',
    tags: ['NUG', 'ASEAN', 'sanctions', 'rights', 'minority-protection'],
  },
  {
    id: 'lebanon',
    name: 'Lebanon · post-war recovery',
    region: 'Middle East',
    domain: 'Reconstruction + governance',
    persona: 'Recovery lead',
    status: 'stub',
    risk: 58,
    sources: 22,
    briefingFreq: 'Weekly',
    hero: 'Cessation framework holding fragile · IMF programme negotiation · Hezbollah disarmament debate.',
    href: '/app/cockpit',
    tags: ['IMF', 'reconstruction', 'cessation', 'disarmament'],
  },
  {
    id: 'sahel',
    name: 'Sahel · juntas and counter-terrorism',
    region: 'West Africa',
    domain: 'Sanctions + security',
    persona: 'Counter-terror analyst',
    status: 'stub',
    risk: 69,
    sources: 19,
    briefingFreq: 'Weekly',
    hero: 'AES alliance solidifying · ECOWAS withdrawal · Russia-replacing-France pattern under pressure.',
    href: '/app/cockpit',
    tags: ['AES', 'ECOWAS', 'JNIM', 'wagner', 'sanctions'],
  },
];

const CATEGORIES = [
  { id: 'desk',      icon: Compass,        label: 'The desk' },
  { id: 'context',   icon: Brain,          label: 'Context' },
  { id: 'truth',     icon: Layers,         label: 'Truth' },
  { id: 'graph',     icon: Network,        label: 'Graph' },
  { id: 'reasoning', icon: Sparkles,       label: 'Reasoning' },
  { id: 'workflow',  icon: WorkflowIcon,   label: 'Workflow' },
  { id: 'product',   icon: FileText,       label: 'Product' },
];

const STATUS_TONE: Record<Project['status'], { chip: string; label: string }> = {
  open:       { chip: 'bg-emerald-100 text-emerald-800', label: 'Open' },
  monitoring: { chip: 'bg-blue-100 text-blue-800',       label: 'Monitoring' },
  archived:   { chip: 'bg-slate-100 text-slate-700',     label: 'Archived' },
  stub:       { chip: 'bg-amber-100 text-amber-800',     label: 'Stub' },
};

export default function ProjectsPage() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="min-h-screen bg-slate-50">
      <SyriaWalkthroughNav />

      <header className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Projects board
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
              <Globe2 className="mr-1 inline-block h-3 w-3 align-text-bottom" />
              6 active files · same 7 categories per project
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl lg:text-[34px]">
            One template · every policy file · this cockpit scales
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Syria is the seed example with the deep walkthrough. Every other project follows the same seven categories,
            so the platform supports armed conflict, diplomacy, sanctions, mediation, climate-security, info-cyber, and
            humanitarian files without re-tooling.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 sm:px-6 lg:px-8">
        {/* Categories ribbon */}
        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <FolderKanban className="h-3.5 w-3.5 text-navy-700" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-700">Generic categories applied per project</p>
            <div className="ml-auto flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                return (
                  <span key={c.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    <Icon className="h-3 w-3 text-slate-500" />
                    {c.label}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        {/* Project grid */}
        <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {PROJECTS.map((p, idx) => {
            const tone = STATUS_TONE[p.status];
            const isOpen = p.status === 'open';
            return (
              <motion.article
                key={p.id}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                className={cn(
                  'rounded-lg border bg-white p-4 shadow-sm transition',
                  isOpen ? 'border-navy-400 ring-1 ring-navy-200' : 'border-slate-200',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider', tone.chip)}>
                    {tone.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{p.region}</span>
                </div>
                <h2 className="mt-2 text-sm font-semibold text-navy-950">{p.name}</h2>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  <Users className="mr-0.5 inline-block h-3 w-3 align-text-bottom" />
                  {p.persona} · {p.domain}
                </p>
                <p className="mt-2 text-[11px] leading-4 text-slate-700">{p.hero}</p>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded bg-rose-50 p-1.5">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-rose-700">Risk</p>
                    <p className="font-mono text-base font-semibold text-rose-700">{p.risk}</p>
                  </div>
                  <div className="rounded bg-emerald-50 p-1.5">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700">Sources</p>
                    <p className="font-mono text-base font-semibold text-emerald-700">{p.sources}</p>
                  </div>
                  <div className="rounded bg-blue-50 p-1.5">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-700">Brief</p>
                    <p className="text-[10px] font-semibold text-blue-700">{p.briefingFreq}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-600">
                      #{t}
                    </span>
                  ))}
                </div>

                {isOpen ? (
                  <Link
                    href={p.href}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-md bg-navy-950 px-3 py-2 text-[11px] font-semibold text-white hover:bg-navy-800"
                  >
                    Open the deep walkthrough
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : (
                  <Link
                    href={p.href}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-[11px] font-semibold text-navy-700 hover:bg-slate-50"
                  >
                    Same template applies
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </motion.article>
            );
          })}
        </section>

        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-700" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Why one template scales</p>
                <h3 className="text-sm font-semibold text-emerald-950">
                  ACO ontology + DIALECTICA reasoning are domain-agnostic
                </h3>
              </div>
            </div>
            <Link href="/app/syria-case" className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-800">
              See full Syria walkthrough
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
