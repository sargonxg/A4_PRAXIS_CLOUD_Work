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
    body: 'Create an account or sign in, then open Home. Type the decision or question in Ask PRAXIS and send it. You can start without a capsule. Your signed-in conversations are saved so you can return to them.',
  },
  {
    title: 'Add sources or saved context',
    body: 'Open the Context Capsules library to choose a saved capsule or a starter method, then use its attach action to return to chat. Check the attached context beside the composer before asking your next question.',
  },
  {
    title: 'Check sourceability',
    body: 'Open the answer’s sources and claim checks. Compare important claims with the cited material, and keep unsupported claims, stale assumptions and missing evidence visible.',
  },
  {
    title: 'Create context worth reusing',
    body: 'Use Build context for a quick capsule, or open the document builder from the library. Upload TXT, text-based PDF or Word files, select Build evidence proposals, and inspect the proposals. Approve or reject each one before reusing it as reviewed context.',
  },
  {
    title: 'Save the output',
    body: 'Use the answer’s editor action to refine a useful draft. Return to your saved conversation for follow-up questions. Check the final wording, citations and caveats before exporting or sharing.',
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
    label: 'Two ways to build a capsule',
    body: 'Build context starts with a short description or template. The document builder starts with your files and proposes facts for review. Both create reusable context; uploading a file alone does not approve its claims.',
  },
  {
    label: 'When something needs attention',
    body: 'If a file has no readable text, try a text-based PDF or paste its text into a TXT file; scanned PDFs may need OCR first. If an answer fails, retry and check your attached context. Report recurring problems with the time and action, without sharing confidential source material.',
  },
];

export default function GuidePage() {
  const guideRailCells = [
    { id: 'profile', label: 'Profile', value: 'Policy team', detail: 'Role-aware guidance', state: 'ready' as const },
    { id: 'context', label: 'Context', value: 'Optional', detail: 'Attach when useful', state: 'active' as const },
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
          PRAXIS is simplest when you treat it as one cockpit: ask the question, attach sources or capsules when needed, inspect the evidence, and save the work with receipts.
        </p>
        <LivingContextRail cells={guideRailCells} compact className="mt-8" />
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login?mode=signup&redirect=%2Fapp" className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white">
            Open PRAXIS
          </Link>
          <Link href="/learn" className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900">
            Understand saved context
          </Link>
        </div>
      </section>

      <section aria-labelledby="guide-capsules" className="mb-12 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
        <h2 id="guide-capsules" className="font-serif text-2xl text-slate-950">Ready to try it with your own material?</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">Sign in, choose a method or build a private capsule, review what it contains, then attach it to a question. The attached capsule supplies context; it does not make every answer verified.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/app/capsules?lane=repository" className="inline-flex min-h-11 items-center rounded-full border border-emerald-300 bg-white px-5 text-sm font-semibold text-emerald-900">Browse capsules and methods</Link>
          <Link href="/app/capsules/builder" className="inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white">Build from documents</Link>
        </div>
      </section>

      <section className="grid gap-4 pb-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">How work moves</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-[color:var(--color-diplomatic-blue)]">
            From prompt to policy product
          </h2>
          <p className="mt-4 text-sm leading-6 text-[color:var(--color-ink)]/70">
            Context Capsules do not replace judgment. They give the model the right working memory, source posture, constraints, and output contract so each generation starts from the team&apos;s reviewed context instead of a blank prompt.
          </p>
        </div>
        <ol className="grid gap-3">
          {steps.map((step, index) => (
            <li key={step.title} className="grid gap-3 rounded-xl border border-[color:var(--color-rose-gold)]/25 bg-white/75 p-4 sm:grid-cols-[2.75rem_1fr]">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 font-mono text-sm font-semibold text-emerald-700">
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
