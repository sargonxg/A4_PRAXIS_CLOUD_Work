'use client';

/**
 * PRAXIS Cockpit — the cross-workspace home page.
 *
 * The cockpit is generic by design: it works for any policy domain, any
 * audience persona, and any situation. The Syria, Pakistan, and US-Housing
 * demo templates are showcased here as first-class entry points so a
 * recording walkthrough can pivot between an international conflict desk, a
 * sovereign / political risk desk, and a domestic policy desk without
 * rebuilding the workspace.
 *
 * Information architecture follows docs/PRAXIS_PRODUCT_SIMPLIFICATION_2026-05-03.md:
 * the dashboard answers four questions — what am I working on, what changed,
 * where did this come from, what should I brief — and the cockpit is a single
 * surface that exposes those answers plus deep links into every tool section.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Activity, AlertTriangle, ArrowRight, BellRing, BookOpen, Briefcase, Compass,
  FileText, GitBranch, Layers, MessagesSquare, Network, Newspaper, PanelsTopLeft,
  PenSquare, Search, Sparkles, Target, Telescope, Users, Wrench,
} from 'lucide-react';
import { DEMO_TEMPLATES, getDemoTemplate } from '@/lib/constants/demo-templates';
import { usePraxisRoute } from '@/lib/utils/routes';
import { cn } from '@/lib/utils/cn';

interface ToolLink { label: string; href: string; description?: string }
interface CockpitSection { id: string; label: string; icon: React.ComponentType<{ className?: string }>; tone: string; tools: ToolLink[] }

const SECTIONS: CockpitSection[] = [
  {
    id: 'context', label: 'Context', icon: Target, tone: 'text-navy-700',
    tools: [
      { label: 'Context Builder', href: '/context-builder', description: 'Score situation health, fill gaps before generation.' },
      { label: 'Documents', href: '/documents', description: 'Upload, extract entities, link to graph.' },
      { label: 'Timeline', href: '/timeline', description: 'Chronology of significant events.' },
    ],
  },
  {
    id: 'library', label: 'Library', icon: Layers, tone: 'text-emerald-700',
    tools: [
      { label: 'Document Library', href: '/library', description: 'Sources, briefs, and work products in one place.' },
      { label: 'Sources Library', href: '/sources', description: 'Trusted-source registry with reliability scoring.' },
      { label: 'Methodology', href: '/methodology', description: '15 frameworks with academic citations.' },
    ],
  },
  {
    id: 'research', label: 'Research', icon: Telescope, tone: 'text-amber-700',
    tools: [
      { label: 'Source Scout', href: '/source-scout', description: 'Live grounded search with provenance.' },
      { label: 'Deep Research Agent', href: '/deep-search-agent', description: 'Multi-step ADK agent.' },
      { label: 'Media Compass', href: '/media-compass', description: 'Outlet positioning and narrative drift.' },
    ],
  },
  {
    id: 'graph', label: 'Graph', icon: Network, tone: 'text-purple-700',
    tools: [
      { label: 'Conflict Graph', href: '/conflict-graph', description: 'ACO ontology graph for the active case.' },
      { label: 'GraphOps', href: '/graphops', description: 'Approve, edit, and version graph proposals.' },
      { label: 'Stakeholder Map', href: '/stakeholder-map', description: 'Power · Legitimacy · Urgency salience.' },
    ],
  },
  {
    id: 'boardroom', label: 'Boardroom', icon: MessagesSquare, tone: 'text-rose-700',
    tools: [
      { label: 'Advisory Council', href: '/advisory', description: 'Multi-advisor synthesis on the case file.' },
      { label: 'Brainstorming Table', href: '/brainstorming-table', description: 'Hypothesis matrix and counter-claims.' },
      { label: 'Ask PRAXIS', href: '/assistant', description: 'Conversational entry into the workspace.' },
    ],
  },
  {
    id: 'draft', label: 'Draft', icon: PenSquare, tone: 'text-blue-700',
    tools: [
      { label: 'Editor', href: '/editor', description: 'Drafting workspace with case-aware Library.' },
      { label: 'Briefing Studio', href: '/briefing', description: 'Slide-ready briefings with provenance.' },
      { label: 'Policy Memo', href: '/policy-memo', description: 'Memo template with graph-grounded claims.' },
    ],
  },
  {
    id: 'specialist', label: 'Specialist', icon: Wrench, tone: 'text-slate-700',
    tools: [
      { label: 'Humanitarian', href: '/humanitarian', description: 'OCHA-style cluster and access overview.' },
      { label: 'Sanctions Monitor', href: '/sanctions-explorer', description: 'Designation lookup and exposure.' },
      { label: 'Policy Desks', href: '/desks/political-risk', description: 'Pre-built political-risk and domestic desks.' },
      { label: 'All tools', href: '/tools', description: 'Full catalogue with search.' },
    ],
  },
];

const ANALYST_PATHS = [
  {
    id: 'un-ny',
    label: 'UN-NY desk · peace and security',
    color: 'rose',
    sequence: ['Cockpit', 'Stakeholder map', 'Conflict graph', 'Advisory council', 'Briefing studio'],
    suggested: '/cockpit?case=syria',
    suggestedLabel: 'Open Syria template',
  },
  {
    id: 'sovereign',
    label: 'Sovereign / political risk analyst',
    color: 'navy',
    sequence: ['Cockpit', 'Stakeholder map', 'Media compass', 'Risk monitor', 'Editor'],
    suggested: '/desks/political-risk?case=pakistan-political-risk',
    suggestedLabel: 'Open Pakistan template',
  },
  {
    id: 'domestic',
    label: 'Domestic policy analyst',
    color: 'emerald',
    sequence: ['Cockpit', 'Library', 'Stakeholder map', 'Editor', 'Briefing studio'],
    suggested: '/desks/us-housing?case=us-housing',
    suggestedLabel: 'Open US-Housing template',
  },
];

const QUESTIONS = [
  { id: 'working', icon: Activity, tone: 'text-emerald-700', q: 'What am I working on?', a: 'Active workspace, last activity, open drafts.', href: '/dashboard' },
  { id: 'changed', icon: BellRing, tone: 'text-rose-700', q: 'What changed?', a: 'New events, source updates, graph proposals since your last session.', href: '/timeline' },
  { id: 'source', icon: BookOpen, tone: 'text-amber-700', q: 'Where did this come from?', a: 'Provenance map, source receipts, document evidence.', href: '/library' },
  { id: 'brief', icon: FileText, tone: 'text-blue-700', q: 'What should I brief?', a: 'Suggested deliverables, draft prompts, audience-tuned outputs.', href: '/editor' },
];

function CockpitPage() {
  const reduceMotion = useReducedMotion();
  const route = usePraxisRoute();
  const searchParams = useSearchParams();
  const activeCaseParam = searchParams.get('case');
  const activeTemplate = getDemoTemplate(activeCaseParam);

  // Pre-compute hrefs with case sticky.
  const withCase = useMemo(() => {
    return (path: string) => {
      const sep = path.includes('?') ? '&' : '?';
      return `${route(path)}${activeCaseParam ? `${sep}case=${activeCaseParam}` : ''}`;
    };
  }, [route, activeCaseParam]);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              <Compass className="mr-1 inline h-3 w-3" />
              Cockpit
            </span>
            <span className="rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy-700">
              Generic for any policy domain
            </span>
            {activeTemplate && (
              <span className="rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-700">
                {activeTemplate.flag} {activeTemplate.name}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-navy-950 sm:text-3xl lg:text-[34px]">
            The cockpit for policy analysis
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-650">
            One workspace for international conflict, sovereign and political risk, and domestic policy.
            The same eight tool sections work for every desk; pick a template below to see the platform fully populated.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Templates row */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold-600" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700">Open a populated workspace</p>
          </div>
          <h2 className="mt-1 text-base font-semibold text-navy-950">Three demo templates · same toolset · different lens</h2>
          <p className="mt-1 text-[12px] text-slate-600">
            Each template has stakeholders, documents, sources, media outlets, timeline, and pre-saved tool outputs. Switch lens with one click.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {DEMO_TEMPLATES.map((tpl, idx) => {
              const isActive = activeTemplate?.id === tpl.id;
              return (
                <motion.div
                  key={tpl.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.28 }}
                  className={cn(
                    'rounded-lg border p-4 transition',
                    isActive
                      ? 'border-gold-300 bg-gold-50/60 ring-1 ring-gold-200'
                      : 'border-slate-200 bg-slate-50 hover:border-navy-300 hover:bg-white'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-2xl leading-none" aria-hidden>{tpl.flag}</span>
                      <div>
                        <p className="text-[13px] font-semibold leading-tight text-navy-950">{tpl.name}</p>
                        <p className="mt-0.5 text-[11px] text-slate-600">{tpl.persona}</p>
                      </div>
                    </div>
                    {tpl.badge && (
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider',
                        tpl.badge.tone === 'rose' && 'bg-rose-100 text-rose-700',
                        tpl.badge.tone === 'navy' && 'bg-navy-100 text-navy-700',
                        tpl.badge.tone === 'emerald' && 'bg-emerald-100 text-emerald-700',
                        tpl.badge.tone === 'amber' && 'bg-amber-100 text-amber-800',
                      )}>
                        {tpl.badge.label}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-[11px] leading-4 text-slate-650">{tpl.tagline}</p>
                  <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                    <div className="rounded bg-white px-1 py-1.5">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Risk</p>
                      <p className="font-mono text-xs font-semibold text-rose-700">{tpl.meta.riskScore}</p>
                    </div>
                    <div className="rounded bg-white px-1 py-1.5">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Actors</p>
                      <p className="font-mono text-xs font-semibold text-navy-700">{tpl.meta.actorCount}</p>
                    </div>
                    <div className="rounded bg-white px-1 py-1.5">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Docs</p>
                      <p className="font-mono text-xs font-semibold text-emerald-700">{tpl.meta.documentCount}</p>
                    </div>
                    <div className="rounded bg-white px-1 py-1.5">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Sources</p>
                      <p className="font-mono text-xs font-semibold text-amber-700">{tpl.meta.sourceCount}</p>
                    </div>
                  </div>
                  <Link
                    href={`${route(tpl.defaultRoute.split('?')[0])}?case=${tpl.id}`}
                    className={cn(
                      'mt-3 inline-flex w-full items-center justify-between gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
                      isActive
                        ? 'bg-gold-600 text-white hover:bg-gold-700'
                        : 'bg-navy-950 text-white hover:bg-navy-800'
                    )}
                  >
                    Open template
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 4 product questions */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-700" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Today on the desk</p>
          </div>
          <h2 className="mt-1 text-base font-semibold text-navy-950">The four questions every analyst answers</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUESTIONS.map((q) => {
              const Icon = q.icon;
              return (
                <Link
                  key={q.id}
                  href={withCase(q.href)}
                  className="group rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-navy-300 hover:bg-white"
                >
                  <Icon className={cn('h-4 w-4', q.tone)} />
                  <p className="mt-2 text-[12px] font-semibold text-navy-950">{q.q}</p>
                  <p className="mt-1 text-[11px] leading-4 text-slate-600">{q.a}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-navy-700 group-hover:text-emerald-700">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Analyst paths */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-navy-700" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-700">Paths by analyst type</p>
          </div>
          <h2 className="mt-1 text-base font-semibold text-navy-950">Pick a desk · we will line up the workflow</h2>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {ANALYST_PATHS.map((p) => (
              <div key={p.id} className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className={cn(
                  'text-[10px] font-semibold uppercase tracking-wider',
                  p.color === 'rose' && 'text-rose-700',
                  p.color === 'navy' && 'text-navy-700',
                  p.color === 'emerald' && 'text-emerald-700',
                )}>{p.label}</p>
                <ol className="mt-3 list-decimal space-y-0.5 pl-4 text-[11px] leading-4 text-slate-700">
                  {p.sequence.map((step) => <li key={step}>{step}</li>)}
                </ol>
                <Link
                  href={`${route(p.suggested.split('?')[0])}?${p.suggested.split('?')[1] ?? ''}`}
                  className="mt-3 inline-flex items-center gap-1 rounded-md bg-navy-950 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-navy-800"
                >
                  {p.suggestedLabel}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Tool sections grid */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PanelsTopLeft className="h-4 w-4 text-navy-700" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-700">All tool sections</p>
            </div>
            <Link
              href={withCase('/tools')}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Full catalogue →
            </Link>
          </div>
          <h2 className="mt-1 text-base font-semibold text-navy-950">Every tool, grouped the way the sidebar groups them</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              return (
                <div key={sec.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', sec.tone)} />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-950">{sec.label}</p>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {sec.tools.map((t) => (
                      <li key={t.href}>
                        <Link
                          href={withCase(t.href)}
                          className="block rounded px-2 py-1 text-[11px] text-slate-700 hover:bg-white hover:text-navy-900"
                        >
                          <span className="font-semibold">{t.label}</span>
                          {t.description && (
                            <span className="block text-[10px] text-slate-500">{t.description}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trigger watch — kept compact */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Trigger watch · cross-desk</p>
            </div>
            <ul className="mt-2 space-y-1 text-[11px] leading-4 text-amber-900">
              <li>· Syria · 4-clashes-in-7d threshold reached (2/4)</li>
              <li>· Pakistan · IMF first review &lt; 14 days</li>
              <li>· US Housing · 3 NIMBY suits filed in CA · 7d</li>
            </ul>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <Search className="h-4 w-4" />
              <p className="text-[10px] font-semibold uppercase tracking-wider">Quick research</p>
            </div>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link href={withCase('/source-scout')} className="inline-flex w-full items-center justify-between gap-2 rounded-md bg-white/80 px-2 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-white">
                  Source Scout · live grounded search
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link href={withCase('/deep-search-agent')} className="inline-flex w-full items-center justify-between gap-2 rounded-md bg-white/80 px-2 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-white">
                  Deep Research Agent · multi-step ADK
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
              <li>
                <Link href={withCase('/media-compass')} className="inline-flex w-full items-center justify-between gap-2 rounded-md bg-white/80 px-2 py-1.5 text-[11px] font-semibold text-emerald-800 hover:bg-white">
                  Media Compass · outlet positioning
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

export default CockpitPage;
