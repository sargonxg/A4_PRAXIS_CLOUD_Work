import Link from 'next/link';
import type { Metadata } from 'next';
import { PublicPageShell } from '@/components/ui/instrument';
import { WorkedPolicyExample } from '@/components/marketing/worked-policy-example';

const description = 'Ask PRAXIS, attach saved context, check sources and save your work.';
export const metadata: Metadata = {
  title: 'Guide', description,
  alternates: { canonical: '/guide' },
  openGraph: { title: 'PRAXIS Guide', description, url: '/guide', images: ['/opengraph-image'] },
  twitter: { card: 'summary_large_image', title: 'PRAXIS Guide', description, images: ['/opengraph-image'] },
};

const steps = [
  {
    title: 'Ask a question',
    body: 'Sign in and open Chat. Name the decision, audience and output you need. Conversations are saved.',
    detail: 'A capsule is optional. Use follow-ups to narrow the question or change the audience and length. The Guide assistant answers product questions; Ask PRAXIS generates the work.',
  },
  {
    title: 'Attach saved context',
    body: 'Choose Attach context, or select Use in chat in Capsules. Check the attached name and version.',
    detail: 'Context details contains optional roles and settings. Ask to use only the attached material when you want to exclude wider research; otherwise PRAXIS may use workspace or web sources.',
  },
  {
    title: 'Check the evidence',
    body: 'Read the answer’s sources and claim checks. Open the original passage for important claims.',
    detail: 'Check the publisher and date. A generated web summary is not an original quotation. Missing evidence remains unknown; it does not show that nothing happened.',
  },
  {
    title: 'Create reusable context',
    body: 'Choose New capsule: Purpose, Material, Review and save. Add notes or documents, then review the proposed facts.',
    detail: 'TXT, text-based PDF and Word files are supported. Apply or reject proposals with a reason. Save and use in chat attaches the saved version. The inspector offers Overview, Evidence, Timeline and Review, with technical details below.',
  },
  {
    title: 'Save and hand over',
    body: 'Open an answer in the editor, correct it and save. Preview the handover package before downloading.',
    detail: 'Unapplied feedback has not changed the draft. Human review applies to the exact saved body and version; later edits make it outdated. The package includes saved work and context references. Recipients may still need access to original sources. A temporary download link does not delete the stored package when it expires.',
  },
];

const requestExamples = [
  { title: 'Decision brief', body: 'Ask for options, tradeoffs, legal authority, resources and the decision required. Separate commitments from evidence of implementation.' },
  { title: 'Assessment', body: 'Compare supporting and conflicting passages. Separate facts, actor claims and analyst inference. State what evidence would change the assessment.' },
  { title: 'Narrative analysis', body: 'Preserve wording, speaker, date and source. Separate observed framing from inferred intent. Note translation limits and missing voices; a small document set does not measure public opinion.' },
];

export default function GuidePage() {
  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <section className="py-10 sm:py-14">
        <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight text-[var(--color-deep-ink)] sm:text-5xl">Ask the question. Check the evidence. Save the work.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-[var(--color-graphite)]">Start in Chat. Add a capsule when you want to reuse sources and background.</p>
        <Link href="/login?mode=signup&redirect=%2Fapp" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-[var(--color-praxis-emerald-700)] px-5 text-sm font-semibold text-white">Open PRAXIS</Link>
      </section>

      <ol className="divide-y divide-[var(--color-mineral)] border-y border-[var(--color-mineral)]">
        {steps.map((step, index) => (
          <li key={step.title} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 py-5 sm:gap-5">
            <span className="pt-1 font-mono text-sm text-[var(--color-praxis-emerald-700)]">{index + 1}</span>
            <div>
              <h2 className="font-serif text-2xl text-[var(--color-deep-ink)]">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-graphite)]">{step.body}</p>
              <details className="mt-1 text-sm leading-6 text-[var(--color-graphite)]">
                <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold underline underline-offset-4">Details</summary>
                <p className="pb-2">{step.detail}</p>
              </details>
            </div>
          </li>
        ))}
      </ol>

      <nav aria-label="Capsule tools" className="my-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-[var(--color-praxis-emerald-700)]">
        <Link href="/app/capsules?lane=repository" className="inline-flex min-h-11 items-center underline underline-offset-4">Browse capsules</Link>
        <Link href="/app/capsules/builder" className="inline-flex min-h-11 items-center underline underline-offset-4">Create a capsule</Link>
        <Link href="/learn" className="inline-flex min-h-11 items-center underline underline-offset-4">How saved context works</Link>
      </nav>

      <WorkedPolicyExample compact />

      <details className="mt-8 border-y border-[var(--color-mineral)] py-2">
        <summary className="flex min-h-11 cursor-pointer items-center font-serif text-2xl text-[var(--color-deep-ink)]">What to ask for</summary>
        <dl className="divide-y divide-[var(--color-mineral)]">
          {requestExamples.map((example) => <div key={example.title} className="grid gap-2 py-4 sm:grid-cols-[10rem_minmax(0,1fr)]"><dt className="text-sm font-semibold">{example.title}</dt><dd className="text-sm leading-6 text-[var(--color-graphite)]">{example.body}</dd></div>)}
        </dl>
      </details>

      <details className="border-b border-[var(--color-mineral)] py-2">
        <summary className="flex min-h-11 cursor-pointer items-center font-serif text-2xl text-[var(--color-deep-ink)]">Upload or save failed?</summary>
        <p className="py-3 text-sm leading-6 text-[var(--color-graphite)]">If a file has no readable text, try a text-based PDF or TXT copy. Scanned PDFs and long documents have separate limits. Check what saved before retrying. Report the action and time to <a href="mailto:hello@tacitus.me" className="underline underline-offset-4">hello@tacitus.me</a>; leave confidential material out.</p>
      </details>
      <p className="mt-6 text-xs leading-5 text-[var(--color-graphite)]">PRAXIS is experimental. Saved context and human review do not independently verify a claim.</p>
    </PublicPageShell>
  );
}
