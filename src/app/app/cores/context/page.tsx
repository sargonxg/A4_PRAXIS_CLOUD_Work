import Link from 'next/link';
import type { ElementType } from 'react';
import { ArrowRight, FileText, GitBranch, Layers3, Plus, Target } from 'lucide-react';
import { listExampleCases } from '@/lib/cases/registry';

export const metadata = {
  title: 'Context Core | PRAXIS',
  description: 'Build and maintain the situation model PRAXIS uses for policy analysis.',
};

export default function ContextCorePage() {
  const examples = listExampleCases().slice(0, 3);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 pb-16">
      <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-navy-950/5 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Context Core</p>
        <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <h1 className="text-3xl font-semibold text-navy-950 sm:text-4xl">The policy situation PRAXIS reasons from.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              Context Core is the maintained case model: frame, actors, claims, sources, documents, graph, open questions, and output history. Build it once, then let Ask PRAXIS and tools reuse it.
            </p>
          </div>
          <Link
            href="/app/situations/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-navy-950/15 hover:bg-navy-800"
          >
            Build Context Core
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <CoreAction icon={Target} label="Frame" href="/app/situations/new" detail="Define the situation, purpose, scope, assumptions, and analytic red lines." />
        <CoreAction icon={Layers3} label="Sources" href="/app/workbench/syria-2026?tab=library" detail="Attach receipts, documents, source gaps, and credibility posture." />
        <CoreAction icon={GitBranch} label="Graph" href="/app/workbench/syria-2026?tab=graph" detail="Inspect actors, claims, events, relations, and provenance before tools run." />
      </section>

      <section className="rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm shadow-navy-950/5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-700">Example context cores</p>
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
      </section>
    </main>
  );
}

function CoreAction({
  icon: Icon,
  label,
  href,
  detail,
}: {
  icon: ElementType;
  label: string;
  href: string;
  detail: string;
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
        Open
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
