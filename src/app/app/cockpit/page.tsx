'use client';

/**
 * PRAXIS Cockpit — mission control for the policy desk.
 *
 * The first stop of the walkthrough. Generic by design: works for any policy
 * domain (conflict, diplomacy, sanctions, mediation, climate-security, info-cyber).
 * Syria is the seed example, populated with live numbers, but the layout
 * frames the platform as a multi-project cockpit.
 */

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity, AlertTriangle, ArrowRight, BellRing, Brain, Compass, Database,
  FileText, Globe, Layers, MapPin, Network, Sparkles, Target, Workflow as WorkflowIcon,
} from 'lucide-react';
import { SyriaWalkthroughNav } from '@/components/syria/walkthrough-nav';
import { cn } from '@/lib/utils/cn';

const CATEGORIES = [
  { id: 'desk',       title: 'The desk',        blurb: 'Calibration · profile · audience',          icon: Compass,    tone: 'text-blue-700'    },
  { id: 'context',    title: 'Context',         blurb: 'Geographic · temporal · stakeholders',     icon: Brain,      tone: 'text-purple-700'  },
  { id: 'truth',      title: 'Truth layer',     blurb: 'Sources · trust scoring · agents',         icon: Layers,     tone: 'text-emerald-700' },
  { id: 'graph',      title: 'Conflict graph',  blurb: 'ACO ontology · counterfactuals',           icon: Network,    tone: 'text-amber-700'   },
  { id: 'reasoning',  title: 'Reasoning',       blurb: 'Recipes · advisors · sanctions · debate',  icon: Sparkles,   tone: 'text-rose-700'    },
  { id: 'workflows',  title: 'Workflows',       blurb: 'Morning · incident · strategic memo',      icon: WorkflowIcon, tone: 'text-teal-700'  },
  { id: 'product',    title: 'Decision product', blurb: 'Ask · brief · library · export',          icon: FileText,   tone: 'text-indigo-700'  },
];

const TODAY_ALERTS = [
  { time: '07:42', source: 'UN Special Envoy', headline: 'Detention-facility access talks paused 48h', tier: 'Tier A', tone: 'rose' as const },
  { time: '08:14', source: 'North Press Agency', headline: 'Two clashes reported in rural Deir-ez-Zor', tier: 'Tier B', tone: 'amber' as const },
  { time: '08:56', source: 'EU Delegation press wire', headline: 'EU Delegation echoes Damascus statement on coastal probe', tier: 'Tier D', tone: 'slate' as const },
];

const ACTIVE_PROJECTS = [
  { id: 'syria',    name: 'Syria · post-Assad transition',           status: 'Active',        risk: 78, sources: 72, persona: 'UN-NY analyst',     domain: 'Armed conflict + governance' },
  { id: 'sudan',    name: 'Sudan · RSF-SAF civil war',               status: 'Active',        risk: 82, sources: 41, persona: 'Humanitarian lead',  domain: 'Armed conflict + humanitarian' },
  { id: 'haiti',    name: 'Haiti · MSS mission and gangs',           status: 'Active',        risk: 71, sources: 28, persona: 'Mission planner',    domain: 'Stabilisation + sanctions' },
  { id: 'myanmar',  name: 'Myanmar · post-coup civil resistance',    status: 'Monitoring',    risk: 64, sources: 35, persona: 'Rights observer',    domain: 'Rights + sanctions' },
];

const QUICK_LINKS = [
  { href: '/app/projects',                    label: 'Open projects board' },
  { href: '/app/syria-case',                  label: 'Open Syria case file' },
  { href: '/app/workflows',                   label: 'Browse workflows' },
];

export default function CockpitPage() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="min-h-screen bg-slate-50">
      <SyriaWalkthroughNav />

      <header className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              Mission control
            </span>
            <span className="rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy-700">
              Generic policy cockpit · works for any domain
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl lg:text-[34px]">
            The cockpit for policy analysis
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            Five active policy projects on the desk this morning. Three new alerts triaged before 09:00. The same seven
            categories work for every file: conflict, diplomacy, sanctions, mediation, humanitarian, rights, info-cyber.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
        <div className="space-y-5">
          {/* Categories grid */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-navy-700" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-700">Seven generic categories · one per policy domain</p>
            </div>
            <h2 className="mt-1 text-base font-semibold text-navy-950">
              These categories repeat for every project on the cockpit
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {CATEGORIES.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <motion.div
                    key={cat.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.04, duration: 0.28 }}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn('h-3.5 w-3.5', cat.tone)} />
                      <p className="text-[11px] font-semibold text-navy-950">{cat.title}</p>
                    </div>
                    <p className="mt-1 text-[10px] leading-4 text-slate-600">{cat.blurb}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Today's alerts */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-rose-700" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Today · 04 May 2026 · pre-09:00 EDT</p>
              </div>
              <Link href="/app/syria-case#syria-daily-media" className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800">
                See full intake workflow →
              </Link>
            </div>
            <h2 className="mt-1 text-base font-semibold text-navy-950">3 incoming items, triaged through the truth layer</h2>
            <ul className="mt-3 space-y-1.5">
              {TODAY_ALERTS.map((alert) => {
                const toneClass =
                  alert.tone === 'rose' ? 'border-rose-300 bg-rose-50' :
                  alert.tone === 'amber' ? 'border-amber-300 bg-amber-50' :
                  'border-slate-300 bg-slate-50';
                return (
                  <li key={alert.headline} className={cn('rounded-md border-l-4 px-3 py-2', toneClass)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-600">{alert.time}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{alert.source}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-navy-800">{alert.tier}</span>
                    </div>
                    <p className="mt-1 text-[12px] font-medium text-navy-950">{alert.headline}</p>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Active projects */}
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-navy-700" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-700">Active projects on the desk</p>
              </div>
              <Link href="/app/projects" className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800">
                Open full projects board →
              </Link>
            </div>
            <ul className="mt-3 grid gap-2 lg:grid-cols-2">
              {ACTIVE_PROJECTS.map((p, idx) => (
                <motion.li
                  key={p.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.28 }}
                  className={cn(
                    'rounded-md border p-3 transition',
                    p.id === 'syria' ? 'border-navy-400 bg-navy-50' : 'border-slate-200 bg-white',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold leading-tight text-navy-950">{p.name}</p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                        p.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700',
                      )}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500">{p.persona} · {p.domain}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded bg-rose-50 p-1">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-rose-700">Risk</p>
                      <p className="font-mono text-sm font-semibold text-rose-700">{p.risk}</p>
                    </div>
                    <div className="rounded bg-emerald-50 p-1">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700">Sources</p>
                      <p className="font-mono text-sm font-semibold text-emerald-700">{p.sources}</p>
                    </div>
                    <div className="rounded bg-blue-50 p-1">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-700">Domain</p>
                      <Database className="mx-auto mt-0.5 h-3.5 w-3.5 text-blue-700" />
                    </div>
                  </div>
                  {p.id === 'syria' ? (
                    <Link
                      href="/app/syria-case"
                      className="mt-2 inline-flex items-center gap-1 rounded-md bg-navy-950 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-navy-800"
                    >
                      Open Syria case file
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                      Stub case · same 7 categories
                    </span>
                  )}
                </motion.li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right rail */}
        <aside className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-700" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Today's plan</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-navy-950">Morning brief loop · 06:30 → 09:00</p>
            <ol className="mt-3 list-decimal space-y-0.5 pl-4 text-[11px] leading-4 text-slate-700">
              <li>Watched feeds intake (4 done)</li>
              <li>Trust triage (3 alerts cleared)</li>
              <li>Graph patches (2 approved · 1 disputed)</li>
              <li>Recipe refresh (commitment-check)</li>
              <li>Brief regeneration (in progress)</li>
            </ol>
            <Link href="/app/workflows" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800">
              All three workflows →
            </Link>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Trigger watch</p>
            </div>
            <ul className="mt-2 space-y-1 text-[11px] leading-4 text-amber-900">
              <li>· 4-clashes-in-7d threshold reached (2/4)</li>
              <li>· Israeli ops cadence in Sweida — 1 today</li>
              <li>· EU benchmark review · 2026-08-25</li>
            </ul>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <MapPin className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Quick links</p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {QUICK_LINKS.map((q) => (
                <li key={q.href}>
                  <Link
                    href={q.href}
                    className="inline-flex w-full items-center justify-between gap-2 rounded-md bg-white/80 px-2 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-white"
                  >
                    {q.label}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
