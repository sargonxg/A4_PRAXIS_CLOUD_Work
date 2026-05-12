import Link from 'next/link';
import type { ElementType } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Database,
  FileText,
  GitBranch,
  Layers3,
  Network,
  Plus,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { listExampleCases } from '@/lib/cases/registry';

export const metadata = {
  title: 'Situation Core | PRAXIS',
  description: 'Build and maintain the situation model PRAXIS uses for policy analysis.',
};

const readiness = [
  { label: 'Frame', state: 'ready', detail: 'Purpose, geography, timeframe, actors, and decision moment.' },
  { label: 'Sources', state: 'partial', detail: 'Receipts, documents, search results, and reliability posture.' },
  { label: 'Graph', state: 'partial', detail: 'Claims, actors, events, commitments, risks, and provenance.' },
  { label: 'Ontology', state: 'ready', detail: 'Domain and work ontology used to guide extraction and drafting.' },
] as const;

const builderSteps = [
  {
    icon: Target,
    label: 'Frame the situation',
    href: '/app/situations/new',
    detail: 'Define the situation, purpose, scope, assumptions, and analytic red lines.',
    cta: 'Build Context Core',
  },
  {
    icon: Layers3,
    label: 'Attach sources',
    href: '/app/workbench/syria-2026?tab=library',
    detail: 'Collect receipts, documents, source gaps, and credibility posture.',
    cta: 'Open library',
  },
  {
    icon: GitBranch,
    label: 'Inspect graph',
    href: '/app/workbench/syria-2026?tab=graph',
    detail: 'Review actors, claims, events, relations, and provenance before tools run.',
    cta: 'Open graph',
  },
  {
    icon: Network,
    label: 'Compile semantic seed',
    href: '/app/situations/new',
    detail: 'Turn the first frame into a portable graph PRAXIS can enrich and reuse.',
    cta: 'Semantic Seed',
  },
] as const;

const toolPath = [
  { label: 'Context Builder', detail: 'Repair missing frame, actors, source posture, and ontology.' },
  { label: 'Source Scout', detail: 'Find the next evidence layer and unresolved source gaps.' },
  { label: 'Graph Review', detail: 'Check relationships and provenance before conclusions harden.' },
  { label: 'Memo Drafter', detail: 'Create a reviewable output only after context is visible.' },
] as const;

export default function ContextCorePage() {
  const examples = listExampleCases().slice(0, 3);
  const readyCount = readiness.filter((item) => item.state === 'ready').length;
  const readinessScore = Math.round((readyCount / readiness.length) * 100);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 pb-16">
      <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-xl shadow-navy-950/5 backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Situation Core Builder</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-semibold text-navy-950 sm:text-4xl">
              Build the policy situation PRAXIS reasons from.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              Situation Core is the maintained case model: frame, actors, claims, sources, documents, graph, open questions, ontology, and output history. Build it once, then Ask PRAXIS and tools reuse it.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              New contexts now start as a semantic graph seed, so the first frame can become actor links, source gaps, provenance checks, and suggested workbench actions.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/app/situations/new"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-navy-950/15 hover:bg-navy-800"
              >
                Build Context Core
                <Plus className="h-4 w-4" />
              </Link>
              <Link
                href="/app/dashboard#ask-praxis"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-diplomatic-blue/30 bg-white px-5 py-3 text-sm font-semibold text-diplomatic-blue hover:bg-diplomatic-blue/5"
              >
                Attach to Ask PRAXIS
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/app/write"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gold-200 bg-white px-5 py-3 text-sm font-semibold text-gold-800 hover:bg-gold-50"
              >
                Attach to Write
                <FileText className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <aside className="border-t border-navy-100 bg-navy-950 p-6 text-white lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Context readiness</p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-semibold">{readinessScore}</span>
              <span className="pb-2 text-sm text-navy-200">/ 100</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-navy-100">
              Good enough to start. Source depth and graph review should improve before high-stakes drafting.
            </p>
            <div className="mt-5 space-y-2">
              {readiness.map((item) => (
                <div key={item.label} className="rounded-lg border border-white/10 bg-white/8 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <span className={item.state === 'ready' ? 'text-xs font-semibold text-gold-300' : 'text-xs font-semibold text-amber-200'}>
                      {item.state}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-navy-200">{item.detail}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {builderSteps.map((step) => (
          <CoreAction key={step.label} {...step} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)]">
        <div className="rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">Example situation cores</p>
              <h2 className="mt-1 text-xl font-semibold text-navy-950">Open a maintained context</h2>
            </div>
            <Link href="/app/workbench" className="inline-flex items-center gap-2 text-sm font-semibold text-diplomatic-blue">
              All contexts
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {examples.map((example) => (
              <Link
                key={example.id}
                href={`/app/workbench/${example.id}`}
                className="rounded-xl border border-slate-200 bg-white/80 p-4 transition hover:border-navy-300 hover:bg-white"
              >
                <FileText className="h-5 w-5 text-gold-700" />
                <h3 className="mt-3 text-sm font-semibold text-navy-950">{example.manifest.name}</h3>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-700">{example.manifest.summary}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-5 shadow-sm shadow-navy-950/5">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-gold-800" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-800">Tool sequence</p>
              <h2 className="text-lg font-semibold text-navy-950">Suggested after attachment</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {toolPath.map((tool, index) => (
              <div key={tool.label} className="flex gap-3 rounded-xl border border-gold-200 bg-white/70 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-950 text-xs font-bold text-white">{index + 1}</span>
                <span>
                  <span className="block text-sm font-semibold text-navy-950">{tool.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-700">{tool.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-diplomatic-blue" />
          <h2 className="text-lg font-semibold text-navy-950">Semantica-ready structure</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ['Semantic Seed', 'A first graph shape can be validated before enrichment.'],
            ['Source posture', 'Claims stay tied to receipts, gaps, and provenance.'],
            ['Review gate', 'Drafting starts after the context and graph are inspectable.'],
          ].map(([label, detail]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <BadgeCheck className="h-4 w-4 text-diplomatic-blue" />
              <p className="mt-3 text-sm font-semibold text-navy-950">{label}</p>
              <p className="mt-2 text-xs leading-5 text-slate-700">{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function CoreAction({
  icon: Icon,
  label,
  href,
  detail,
  cta,
}: {
  icon: ElementType;
  label: string;
  href: string;
  detail: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm shadow-navy-950/5 backdrop-blur transition hover:-translate-y-0.5 hover:border-navy-200 hover:bg-white"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-950 text-white">
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-navy-950">{label}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{detail}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-diplomatic-blue">
        {cta}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
