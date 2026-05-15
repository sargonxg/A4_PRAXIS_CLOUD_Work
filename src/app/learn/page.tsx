import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, GitBranch, LibraryBig, Network, ShieldCheck, Sparkles } from 'lucide-react';

const steps = [
  {
    title: 'Describe the work',
    detail: 'Start with the issue, decision, briefing need, or handover problem. PRAXIS turns the prompt into a ContextCapsule draft.',
    icon: Sparkles,
  },
  {
    title: 'Attach context cores',
    detail: 'Bind the User Core, Situation Core, sources, documents, time horizon, graph/power map, tools, output target, and handover notes.',
    icon: GitBranch,
  },
  {
    title: 'Run capsule-aware tools',
    detail: 'Use sourceability, grounded research, timeline, power map, ACH/scenario review, memo drafting, and red-team review from the same capsule.',
    icon: Network,
  },
  {
    title: 'Ship the work product',
    detail: 'Move answers into Memo Studio, Canvas, Library, or a handover packet with sources, gaps, approvals, and review receipts still visible.',
    icon: FileText,
  },
];

const surfaces = [
  ['Home', 'Current capsule, recent runs, scheduled briefs, and next useful work.'],
  ['Ask PRAXIS', 'Prompt-first work against the active capsule, not a blank model.'],
  ['Library', 'Sources, documents, receipts, and source gaps attached to capsules.'],
  ['Memo Studio', 'Draft memos, briefs, talking points, and handover packs from context.'],
  ['Canvas', 'Timeline, graph, actors, source gaps, and review-gated changes.'],
  ['Advanced', 'Tools, run logs, triggers, diagnostics, providers, and audits.'],
] as const;

export const metadata = {
  title: 'Learn PRAXIS',
  description: 'How PRAXIS uses ContextCapsules for policy, conflict, and statecraft work.',
};

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <PublicHeader />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Learn PRAXIS</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-tight">
              A policy agent workspace built around inheritable context.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700">
              PRAXIS follows the Tasklet-style pattern of prompt-first work and persistent runs, but it is specialized for policy, conflict analysis, statecraft, sourceable writing, and handover. The central object is the ContextCapsule.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gold-700" />
              <p className="text-sm font-semibold text-slate-950">What PRAXIS will not fake</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Browser automation, external sending, broad SaaS connectors, graph promotion, and sensitive exports stay approval-gated and are labeled planned until their runtime path is live.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <Icon className="h-5 w-5 text-gold-700" />
                <h2 className="mt-4 text-lg font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.detail}</p>
              </article>
            );
          })}
        </div>

        <section className="mt-14 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gold-700" />
            <h2 className="text-xl font-semibold">The six surfaces</h2>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {surfaces.map(([name, detail]) => (
              <div key={name} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">{name}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/app/assistant" className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            Open Ask PRAXIS
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
            See pricing
          </Link>
        </div>
      </section>
    </main>
  );
}

function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-serif text-2xl font-semibold text-diplomatic-blue">PRAXIS</Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
          <Link href="/learn">Learn</Link>
          <Link href="/tacitus">TACITUS</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/release-notes">Release notes</Link>
        </nav>
        <Link href="/login" className="text-sm font-semibold text-gold-700">Sign in</Link>
      </div>
    </header>
  );
}

