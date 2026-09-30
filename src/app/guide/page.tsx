import Link from 'next/link';
import type { Metadata } from 'next';
import { PublicPageShell } from '@/components/ui/instrument';
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
    body: 'Sign in, open Chat and send your question. A capsule is optional. Your conversations are saved so you can return to them.',
  },
  {
    title: 'Add sources or saved context',
    body: 'Choose Attach context or find a capsule in Capsules and select Use in chat. Check its name and saved version. Ask for supplied evidence only if you want to exclude outside sources.',
  },
  {
    title: 'Check the evidence',
    body: 'Open sources and claim checks. Check original passages, publishers and dates. Web summaries are not quotations; missing evidence is not proof that nothing happened.',
  },
  {
    title: 'Create context worth reusing',
    body: 'Choose New capsule. Add notes or TXT, text-based PDF or Word files. Review proposed claims, then choose Save and use in chat. Saving context does not approve its claims. Open Overview, Evidence, Timeline or Review to inspect it.',
  },
  {
    title: 'Save the output',
    body: 'Open an answer in the editor, revise it and save. Feedback changes the draft only after you apply it. Review applies to the saved version; edits make earlier approval outdated. Preview a handover before downloading. Recipients may need access to its original sources.',
  },
];

export default function GuidePage() {
  return (
    <PublicPageShell maxWidth="max-w-6xl">
      <section className="py-12 sm:py-16">
        <p className="text-sm font-semibold text-slate-600">PRAXIS quick start</p>
        <h1 className="mt-3 max-w-4xl font-serif text-4xl font-semibold leading-tight text-[color:var(--color-diplomatic-blue)] sm:text-5xl">
          Ask the question. Check the evidence. Save the work.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--color-ink)]/70">
          Start without a capsule, or build reusable context from your own material.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login?mode=signup&redirect=%2Fapp" className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white">
            Open PRAXIS
          </Link>
          <Link href="/app/capsules/builder" className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900">
            Build from documents
          </Link>
        </div>
      </section>

      <section aria-labelledby="guide-workflow" className="pb-12">
        <h2 id="guide-workflow" className="font-serif text-2xl text-slate-950">From question to written work</h2>
        <ol className="mt-5 divide-y divide-slate-200">
          {steps.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[1.5rem_1fr] gap-3 py-4 sm:gap-5">
              <span className="pt-0.5 font-mono text-sm font-semibold text-emerald-800" aria-hidden="true">
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
        <WorkedPolicyExample compact />
      </div>

      <section aria-labelledby="guide-policy-jobs" className="pb-14">
        <h2 id="guide-policy-jobs" className="font-serif text-3xl font-semibold text-[color:var(--color-diplomatic-blue)]">Make the request fit your job</h2>
        <div className="mt-5 divide-y divide-slate-200">
          <article className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
            <h3 className="text-base font-semibold text-slate-950">For a decision brief</h3>
            <p className="text-sm leading-6 text-slate-700">Name the audience, decision and date. Compare options, authority, resources and constraints. A commitment is not evidence of implementation.</p>
          </article>
          <article className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
            <h3 className="text-base font-semibold text-slate-950">For an assessment</h3>
            <p className="text-sm leading-6 text-slate-700">Compare supporting and conflicting passages. Separate facts, actor claims and inference. State what evidence could change your assessment.</p>
          </article>
          <article className="grid gap-2 py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
            <h3 className="text-base font-semibold text-slate-950">For narrative analysis</h3>
            <p className="text-sm leading-6 text-slate-700">Keep exact wording, speaker, date and source. Separate framing from inferred intent. Flag translation and missing voices; a small document set is not public opinion.</p>
          </article>
        </div>
      </section>

      <details className="border-t border-slate-200 py-5 text-sm leading-6 text-slate-700">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-slate-950">Help with uploads and product questions</summary>
        <p className="mt-3">For an unreadable file, try a text-based PDF or TXT copy. Scanned PDFs and long documents have separate limits. After a failed upload or save, check what persisted before retrying.</p>
        <p className="mt-3">The Guide assistant explains the app. Use Ask PRAXIS for analysis and writing. Report problems with the time and action; leave confidential material out of the report.</p>
        <Link href="/app/capsules?lane=repository" className="mt-3 inline-flex min-h-11 items-center font-semibold text-emerald-800 underline underline-offset-4">Browse capsules and methods</Link>
      </details>
    </PublicPageShell>
  );
}
