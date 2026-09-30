import Link from 'next/link';
import type { Metadata } from 'next';
import { PraxisGlyphChip } from '@/components/brand/praxis-mark';
import { LivingContextRail, PublicPageShell } from '@/components/ui/instrument';
import { WorkedPolicyExample } from '@/components/marketing/worked-policy-example';

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
    body: 'Create an account or sign in, then open Chat. Type your question in Ask PRAXIS and send it. You can start without a capsule. Your signed-in conversations are saved so you can return to them.',
  },
  {
    title: 'Add sources or saved context',
    body: 'Choose Attach context beside the composer, or open Capsules to find saved context and starter methods. Use in chat attaches your selection. Check its name and saved version; Context details holds the optional roles and settings. Say whether to use only that material or collect outside sources.',
  },
  {
    title: 'Check the evidence',
    body: 'Open the answer’s sources and claim checks. Inspect the original supporting passage, publisher and date for important claims. A generated web summary is not an original quotation; missing evidence stays unknown rather than proving nothing happened.',
  },
  {
    title: 'Create context worth reusing',
    body: 'Choose New capsule and follow Purpose → Material → Review and save. Add notes or TXT, text-based PDF and Word files, then inspect the proposed claims. Apply or reject them with a reason. Save and use in chat attaches the saved version. Inspect any capsule through Overview, Evidence, Timeline and Review; technical details expand when needed.',
  },
  {
    title: 'Save the output',
    body: 'Open a useful answer in the editor, correct its text, save and reopen it. Unapplied feedback has not changed the draft. Human review belongs to the exact saved version; editing makes earlier approval outdated. Preview a handover package before creating its temporary download. It includes the saved work and context references; recipients may still need access to original sources.',
  },
];

const guideCards = [
  {
    label: 'Guide assistant',
    body: 'Use this for product help, where-to-click guidance, context explanations, and source-gap interpretation. It is separate from the main Ask PRAXIS workflow.',
  },
  {
    label: 'Ask PRAXIS',
    body: 'Use this for analysis and writing, saved conversations, attached sources, research and memos. Ask focused follow-ups or request a different audience and length while retaining the evidence.',
  },
  {
    label: 'Two ways to build a capsule',
    body: 'Build context starts with a short description or template. The document builder starts with your files and proposes facts for review. Both create reusable context; uploading a file alone does not approve its claims.',
  },
  {
    label: 'When something needs attention',
    body: 'If a file has no readable text, use a text-based PDF or a TXT copy. Scanned PDF and long-document handling have separate limits. If an upload or save fails, check what persisted before retrying. Report the time and action without including confidential material implicitly.',
  },
];

export default function GuidePage() {
  const guideRailCells = [
    { id: 'profile', label: 'Profile', value: 'Policy team', detail: 'Role-aware guidance', state: 'ready' as const },
    { id: 'context', label: 'Context', value: 'Optional', detail: 'Attach when useful', state: 'active' as const },
    { id: 'source', label: 'Sources', value: 'Gaps visible', detail: 'Receipts first', state: 'ready' as const },
    { id: 'output', label: 'Output', value: 'Memo or handover', detail: 'Reviewable work', state: 'quiet' as const },
    { id: 'readiness', label: 'Review', value: 'Your judgment', detail: 'Check before use', state: 'active' as const },
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
          Ask the question, attach sources or saved context when useful, check the evidence, and revise the written product. You can build reusable context separately from asking a question.
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
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">A Context Capsule saves the sources, assumptions and analytical approach you want PRAXIS to reuse. Sign in, choose or build one, review its contents, then attach it to a question. Saving context does not independently verify it.</p>
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
            State the audience, decision and as-of date. Saved context carries the working material you want to reuse; check its sources and assumptions again when the situation changes. Model choice does not remove the need for evidence or human review.
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

      <div className="pb-14">
        <WorkedPolicyExample />
      </div>

      <section aria-labelledby="guide-policy-jobs" className="pb-14">
        <h2 id="guide-policy-jobs" className="font-serif text-3xl font-semibold text-[color:var(--color-diplomatic-blue)]">Make the request fit your job</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white/75 p-5">
            <h3 className="text-base font-semibold text-slate-950">For a decision brief</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">Ask for options, tradeoffs, legal authority, resources, political constraints and the decision required. Keep a commitment separate from evidence of implementation.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white/75 p-5">
            <h3 className="text-base font-semibold text-slate-950">For an assessment</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">Compare supporting and conflicting passages. Separate facts, actor claims and analyst inference; state what evidence would change the assessment.</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white/75 p-5">
            <h3 className="text-base font-semibold text-slate-950">For narrative analysis</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">Preserve exact wording, speaker, date and source. Distinguish observed framing from inferred intent, acknowledge translation and missing voices, and avoid treating a small document set as public opinion.</p>
          </article>
        </div>
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
