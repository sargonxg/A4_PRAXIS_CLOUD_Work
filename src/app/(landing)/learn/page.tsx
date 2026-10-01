import type { Metadata } from "next";
import Link from "next/link";
import { PublicPageShell } from "@/components/ui/instrument";

const description = "How PRAXIS uses saved context, sources and human review.";
export const metadata: Metadata = {
  title: "How PRAXIS works", description,
  alternates: { canonical: "/learn" },
  openGraph: { title: "How PRAXIS works", description, url: "/learn", images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image", title: "How PRAXIS works", description, images: ["/opengraph-image"] },
};

const currentCapabilityAnchors = [
  { id: "sourceability", title: "Sourceability", body: "Check which claims have support and which still need evidence." },
  { id: "claim-source-alignment", title: "Claim-source alignment", body: "Read claims alongside source previews and recorded gaps." },
  { id: "role-capsules", title: "Role-aware context", body: "Save a role, audience, constraints and analytical approach for reuse." },
  { id: "output-quality", title: "Output quality", body: "Edit and review saved work before sharing. Structure checks do not measure factual accuracy." },
  { id: "thinking-devices", title: "Thinking devices", body: "Choose a method when useful: compare hypotheses, build a timeline or challenge assumptions." },
];

const capsuleParts = [
  { title: "Purpose", body: "The question, audience and output you need." },
  { title: "Evidence", body: "Source references, claims and supporting excerpts." },
  { title: "Connections", body: "Recorded actors, relationships and events." },
  { title: "Review", body: "Decisions, assumptions and unresolved gaps." },
];

export default function LearnPage() {
  return (
    <PublicPageShell maxWidth="max-w-4xl">
      <section className="py-10 sm:py-14">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--color-deep-ink)] sm:text-5xl">How PRAXIS works</h1>
        <p className="mt-4 max-w-2xl text-lg leading-7 text-[var(--color-graphite)]">Ask a policy question, inspect its evidence, then save the background you want to reuse.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/login?mode=signup&redirect=%2Fapp" className="inline-flex min-h-11 items-center rounded-md bg-[var(--color-praxis-emerald-700)] px-5 text-sm font-semibold text-white">Ask PRAXIS</Link>
          <Link href="/guide" className="inline-flex min-h-11 items-center px-4 text-sm font-semibold text-[var(--color-praxis-emerald-700)] underline underline-offset-4">Follow the quick start</Link>
        </div>
      </section>

      <section aria-labelledby="learn-capsules" className="border-y border-[var(--color-mineral)] py-6">
        <h2 id="learn-capsules" className="font-serif text-3xl text-[var(--color-deep-ink)]">What is a Context Capsule?</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--color-graphite)]">A capsule is saved context you can attach to chat. It holds background, sources and review notes, so you can reuse them without explaining everything again. You can also ask without one.</p>
        <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {capsuleParts.map((part) => <div key={part.title}><dt className="text-sm font-semibold text-[var(--color-deep-ink)]">{part.title}</dt><dd className="mt-1 text-sm leading-6 text-[var(--color-graphite)]">{part.body}</dd></div>)}
        </dl>
        <p className="mt-6 text-sm leading-6 text-[var(--color-graphite)]">Start from notes, a template or TXT, text-based PDF and Word files. Review the proposed facts, save the capsule, then choose Use in chat.</p>
        <Link href="/app/capsules/builder" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-praxis-emerald-700)] underline underline-offset-4">Create a capsule</Link>
      </section>

      <section className="py-8">
        <h2 className="font-serif text-3xl text-[var(--color-deep-ink)]">One workspace for the question, context and evidence.</h2>
        <p className="mt-3 text-sm leading-6 text-[var(--color-graphite)]">Use it today: Chat, Capsules and saved work. Sources can be incomplete or wrong; check important claims against the original material.</p>
        <dl className="mt-5 divide-y divide-[var(--color-mineral)]">
          {currentCapabilityAnchors.map((item) => <div id={item.id} key={item.id} className="grid scroll-mt-24 gap-2 py-4 sm:grid-cols-[12rem_minmax(0,1fr)]"><dt className="text-sm font-semibold">{item.title}</dt><dd className="text-sm leading-6 text-[var(--color-graphite)]">{item.body}</dd></div>)}
        </dl>
      </section>

      <details className="border-y border-[var(--color-mineral)] py-2">
        <summary className="flex min-h-11 cursor-pointer items-center font-serif text-2xl text-[var(--color-deep-ink)]">Inside a capsule: technical background and roadmap</summary>
        <div className="space-y-7 py-5 text-sm leading-6 text-[var(--color-graphite)]">
          <section>
            <h2 className="font-serif text-2xl text-[var(--color-deep-ink)]">What saved context carries</h2>
            <p className="mt-3">ContextCapsules are reusable context objects, not prompts. They can hold sources, assumptions, tacit knowledge, reasoning devices, review gates, and allowed agent behavior.</p>
            <p className="mt-3">Claims, sources, memories and limitations carry labels. These support review; they do not guarantee correctness or enforce every recorded preference.</p>
            <p className="mt-3">AI can propose improvements and draft review cards. Human review decides which proposals enter the saved capsule. Review decisions do not independently verify a claim.</p>
          </section>
          <section id="praxis-augmented-generation" className="scroll-mt-24">
            <h2 className="font-serif text-2xl text-[var(--color-deep-ink)]">What reaches the model</h2>
            <p className="mt-3">An attachment records the capsule’s saved version. Sending a question resolves that version and its source references into context. Missing or archived versions require a new selection. Source document bodies and optional workspace or web research are separate dependencies, not immutable historical snapshots.</p>
            <p className="mt-3">Context details offers optional User, Situation, Tool and Output roles. Ask to use only attached material when you want to limit research. Deep research adds a multi-step task with a run history to inspect.</p>
            <p className="mt-3">A handover includes saved work, a bounded context projection and references. It does not transfer original-source permissions or guarantee that another tool can import it. Package hashes check integrity, not analytical validity.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-[var(--color-deep-ink)]">Optional research</h2>
            <p className="mt-3">Premium web is not enabled by default. Source discovery depends on configured providers and the selected workflow. GDELT and Wikidata research signals are advisory; candidates need review before entering the saved capsule.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-[var(--color-deep-ink)]">Related projects and roadmap</h2>
            <p className="mt-3"><a href="https://tacitus.me" className="underline underline-offset-4">TACITUS</a> is an independent experimental project by Giulio Catanzariti, not an incorporated legal entity. PRAXIS is its visible workbench. DIALECTICA develops the ingestion and context layer; AGON and KAIROS are upstream research references.</p>
            <p className="mt-3">Shared community capsules and collaborative review are roadmap goals. Capsules should be forkable and inspectable, with provenance and review state visible. Upstream tools remain integration layers or roadmap lanes when they are not the visible production surface.</p>
          </section>
        </div>
      </details>
      <p className="mt-6 text-xs leading-5 text-[var(--color-graphite)]">Independent experimental software. Use public or synthetic material while evaluating it. <Link href="/legal/privacy" className="underline underline-offset-4">Read the privacy notice.</Link></p>
    </PublicPageShell>
  );
}
