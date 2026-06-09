import Link from 'next/link';
import type { Metadata } from 'next';
import { PraxisGlyphChip } from '@/components/brand/praxis-mark';
import { LivingContextRail, PublicPageShell } from '@/components/ui/instrument';

export const metadata: Metadata = {
  title: 'Guide',
  description: 'A practical guide to asking PRAXIS, adding sources or saved context, checking evidence, and saving reviewable policy work.',
  alternates: {
    canonical: '/guide',
  },
  openGraph: {
    title: 'PRAXIS Guide',
    description: 'How to use PRAXIS for sourced policy questions, reviewable answers, briefs, and handovers.',
    url: '/guide',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'PRAXIS guide' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRAXIS Guide',
    description: 'A practical guide for using PRAXIS with sources, saved context, and reviewable policy outputs.',
    images: ['/opengraph-image'],
  },
};

const steps = [
  {
    title: 'Start with a policy question',
    body: 'Use the home cockpit or Ask PRAXIS to state the decision, briefing, research, or handover you need.',
  },
  {
    title: 'Add sources or saved context',
    body: 'Attach sources, a saved context pack, or a verified starter when the answer needs actors, assumptions, output goals, and review gates.',
  },
  {
    title: 'Check sourceability',
    body: 'Review source receipts, weak claims, stale assumptions, and evidence gaps before treating an answer as a work product.',
  },
  {
    title: 'Run the right workflow',
    body: 'Ask PRAXIS can answer directly or route durable work to research memo, sourceability review, red-team, boardroom, formatter, or handover workflows.',
  },
  {
    title: 'Save the output',
    body: 'Move useful results into Memo Studio, a saved output, a source gap, a graph proposal, or a handover package with receipts intact.',
  },
];

const guideCards = [
  {
    label: 'Guide assistant',
    body: 'Use this for product help, where-to-click guidance, context explanations, and source-gap interpretation. It is separate from the main Ask PRAXIS workflow.',
  },
  {
    label: 'Ask PRAXIS',
    body: 'Use this for actual analysis, generation, saved conversations, source operations, memos, and durable runtime receipts.',
  },
  {
    label: 'Saved context',
    body: 'Use this for reusable policy context: source packs, document links, thinking devices, output contracts, review cards, and locked cores.',
  },
  {
    label: 'Proof',
    body: 'Use runtime receipts, source previews, claim ledgers, and health checks to see what PRAXIS used and what still needs review.',
  },
];

export default function GuidePage() {
  const guideRailCells = [
    { id: 'profile', label: 'Profile', value: 'Policy team', detail: 'Role-aware guidance', state: 'ready' as const },
    { id: 'context', label: 'Context', value: 'Saved work attached', detail: 'Generation starts here', state: 'active' as const },
    { id: 'source', label: 'Sources', value: 'Gaps visible', detail: 'Receipts first', state: 'ready' as const },
    { id: 'output', label: 'Output', value: 'Memo or handover', detail: 'Reviewable work', state: 'quiet' as const },
    { id: 'readiness', label: 'Readiness', value: 'Proof rail', detail: 'No hidden claims', state: 'active' as const },
  ];

  return (
    <PublicPageShell maxWidth="max-w-6xl">
      <section className="py-12 sm:py-16">
        <div className="inline-flex items-center gap-3">
          <PraxisGlyphChip size={30} />
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">PRAXIS Guide</span>
        </div>
        <h1 className="mt-5 max-w-4xl font-serif text-4xl font-semibold leading-tight text-[color:var(--color-diplomatic-blue)] sm:text-6xl">
          Ask the question. Check the evidence. Save the work.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--color-ink)]/70">
          PRAXIS is simplest when you treat it as one cockpit: ask the question, attach sources or saved context when needed, inspect the evidence, and save the work with receipts.
        </p>
        <LivingContextRail cells={guideRailCells} compact className="mt-8" />
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login?mode=signup&redirect=%2Fapp" className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white">
            Open PRAXIS
          </Link>
          <Link href="/learn" className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900">
            Learn the system
          </Link>
        </div>
      </section>

      <section className="grid gap-4 pb-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-gold-700)]">How work moves</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-[color:var(--color-diplomatic-blue)]">
            From prompt to policy product
          </h2>
          <p className="mt-4 text-sm leading-6 text-[color:var(--color-ink)]/70">
            Saved context does not replace judgment. It gives the model the right working memory, source posture, constraints, and output contract so each generation starts from the team&apos;s reviewed context instead of a blank prompt.
          </p>
        </div>
        <ol className="grid gap-3">
          {steps.map((step, index) => (
            <li key={step.title} className="grid gap-3 rounded-xl border border-[color:var(--color-rose-gold)]/25 bg-white/75 p-4 sm:grid-cols-[2.75rem_1fr]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-gold-500)]/15 font-mono text-sm font-semibold text-[color:var(--color-gold-700)]">
                {index + 1}
              </span>
              <span>
                <strong className="block text-sm font-semibold text-slate-950">{step.title}</strong>
                <span className="mt-1 block text-sm leading-6 text-slate-600">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 pb-16 md:grid-cols-2">
        {guideCards.map((card) => (
          <article key={card.label} className="rounded-xl border border-[color:var(--color-rose-gold)]/25 bg-white/75 p-5">
            <h2 className="font-serif text-2xl font-semibold text-[color:var(--color-diplomatic-blue)]">{card.label}</h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--color-ink)]/70">{card.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Current boundary</p>
        <h2 className="mt-3 font-serif text-2xl font-semibold text-slate-950">
          The Guide assistant explains the app. Ask PRAXIS does the work.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-800">
          The in-app Guide assistant can answer product and context-use questions without creating runs or mutating data. For real generation, source attachment, memos, and durable artifacts, use Ask PRAXIS with selected context.
        </p>
      </section>
    </PublicPageShell>
  );
}
