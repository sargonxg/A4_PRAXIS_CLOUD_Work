import type { Metadata } from "next";
import Link from "next/link";
import { PraxisGlyphChip } from "@/components/brand/praxis-mark";
import { PraxisThinking } from "@/components/brand/praxis-thinking";
import { LivingContextRail, PublicPageShell } from "@/components/ui/instrument";

export const metadata: Metadata = {
  title: "Learn how PRAXIS works",
  description:
    "A plain-language guide to how PRAXIS turns policy questions, sources, saved context, and review into useful work.",
  alternates: {
    canonical: "/learn",
  },
  openGraph: {
    title: "How PRAXIS works",
    description:
      "Learn how PRAXIS helps policy teams ask better questions, check sources, save context, and draft reviewable work.",
    url: "/learn",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "How PRAXIS works" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How PRAXIS works",
    description:
      "The public guide to asking, sourcing, saving, and reviewing policy work in PRAXIS.",
    images: ["/opengraph-image"],
  },
};

const flowSteps = [
  "Ask the question",
  "Add sources or saved context",
  "Check what supports the answer",
  "Draft the brief",
  "Save the work",
];

const currentCapabilityAnchors = [
  {
    id: "sourceability",
    title: "Sourceability",
    body: "Use PRAXIS to see which important claims have sources, which look weak, and which still need evidence before a brief is ready to share.",
  },
  {
    id: "claim-source-alignment",
    title: "Claim-source alignment",
    body: "PRAXIS keeps source previews, gaps, and claim posture close to the answer so teams can separate cited facts from model judgment or user assumptions.",
  },
  {
    id: "role-capsules",
    title: "Role-aware context",
    body: "Saved context can carry role, institution, lens, constraints, and output goals so PRAXIS answers for a real policy job instead of a generic chat.",
  },
  {
    id: "output-quality",
    title: "Output quality",
    body: "Brief, memo, source review, and handover workflows keep caveats, receipts, and next actions attached to the work product.",
  },
  {
    id: "thinking-devices",
    title: "Thinking devices",
    body: "ACH, timeline, causal, human-friction, red-team, boardroom, and sourceability devices can sit behind the simple Ask surface when the work needs them.",
  },
];

const capsuleCores = [
  {
    name: "User",
    body: "The analyst posture, preferences, role, institution, and working assumptions that shape the answer.",
  },
  {
    name: "Situation",
    body: "The live policy problem, actors, geography, constraints, stakes, and decision context.",
  },
  {
    name: "Source",
    body: "The evidence posture: what is cited, what is missing, what looks weak, and what needs review.",
  },
  {
    name: "Document",
    body: "Uploaded files, notes, excerpts, and source packets that should travel with the work.",
  },
  {
    name: "Graph",
    body: "Actors, claims, relationships, contradictions, commitments, and typed links that make the work reusable.",
  },
  {
    name: "Time",
    body: "Sequence, deadlines, windows, episodes, commitments, and signals that change the answer over time.",
  },
  {
    name: "Tool",
    body: "The policy tools, checks, drafts, and specialist routines that can run against the capsule.",
  },
  {
    name: "Objective",
    body: "The job to be done: explain, compare, decide, prepare, brief, challenge, or hand over.",
  },
  {
    name: "Output",
    body: "The memo, brief, talking points, scenario table, source review, or handover artifact the user needs.",
  },
  {
    name: "Memory",
    body: "The durable parts that should survive beyond one chat: decisions, gaps, corrections, and team context.",
  },
];

const ecosystemLinks = [
  {
    name: "TACITUS",
    href: "https://www.tacitus.me/",
    body: "The broader conflict-intelligence company and ontology stack behind PRAXIS.",
  },
  {
    name: "PRAXIS",
    href: "https://www.tacitus.me/product/praxis",
    body: "The visible policy workbench that turns structured context into questions, tools, memos, and handovers.",
  },
  {
    name: "DIALECTICA",
    href: "https://www.tacitus.me/product/dialectica",
    body: "The ontology-augmented generation layer for ingestion, typed graphs, provenance, and deterministic reasoning.",
    secondaryLinks: [
      { label: "App", href: "https://dialectica.tacitus.me/" },
      { label: "GitHub", href: "https://github.com/sargonxg/A2_DIALECTICAbyTACITUS" },
    ],
  },
  {
    name: "AGON",
    href: "https://github.com/sargonxg/AGON",
    body: "An upstream perception and evidence engine, under development, for actors, claims, contradictions, commitments, friction, and quality gates.",
  },
  {
    name: "KAIROS",
    href: "https://github.com/sargonxg/KAIROS-temporal-vision-TACITUS",
    body: "An upstream temporal engine, under development, for event sequence, Allen-style relations, commitments, episodes, and time-aware signals.",
  },
  {
    name: "TACITUS Ontology",
    href: "https://github.com/sargonxg/tacitus-ontology",
    body: "The shared ontology work that helps keep products and research systems aligned around typed concepts.",
  },
];

const contributionPaths = [
  "Upload documents and source packets that make a situation easier to verify.",
  "Correct missing capsule fields, weak source claims, or stale assumptions.",
  "Review graph and source claims before they become reusable team context.",
  "Create reusable capsules for recurring regions, actors, disputes, or institutional workflows.",
  "Share product feedback from real policy, diplomacy, research, or briefing work.",
  "Open issues or pull requests in the linked GitHub repositories when the contribution belongs upstream.",
];

export default function LearnPage() {
  const learnRailCells = [
    { id: "profile", label: "Profile", value: "Policy user", detail: "Role-aware answers", state: "ready" as const },
    { id: "context", label: "Context", value: "Saved work", detail: "Reusable when needed", state: "active" as const },
    { id: "source", label: "Sources", value: "Receipts", detail: "Documents and proof", state: "ready" as const },
    { id: "output", label: "Output", value: "Brief or handover", detail: "Reviewable work", state: "quiet" as const },
    { id: "readiness", label: "Readiness", value: "Visible checks", detail: "Sources and gaps", state: "active" as const },
  ];

  return (
    <PublicPageShell>
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-3">
            <PraxisGlyphChip size={30} />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">PRAXIS by TACITUS</span>
          </div>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl font-medium leading-tight text-slate-950 sm:text-6xl">
            How PRAXIS works
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
            PRAXIS is the visible workspace where users ask policy questions, attach sources, save context, draft briefs, and keep the evidence trail visible. The surface stays simple: one place to turn a situation, document, or hard question into reviewable work.
          </p>
          <LivingContextRail cells={learnRailCells} compact className="mt-7" />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login?mode=signup"
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white"
            >
              Start work
            </Link>
            <a
              href="https://www.tacitus.me/product/praxis"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900"
            >
              PRAXIS product page
            </a>
          </div>
        </div>

        <aside className="rounded-[24px] border border-slate-200 bg-white/85 p-5 shadow-[0_22px_70px_rgba(15,23,42,0.10)] sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Work flow</span>
            <PraxisThinking compact size={18} className="text-amber-600" />
          </div>
          <ol className="mt-5 grid gap-3">
            {flowSteps.map((step, index) => (
              <li key={step} className="grid grid-cols-[2.5rem_1fr] items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-amber-50 font-mono text-xs font-semibold text-amber-800">
                  {index + 1}
                </span>
                <span className="rounded-2xl border border-slate-200 bg-[color:var(--color-cream-50)] px-4 py-3 text-sm font-medium text-slate-800">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
        <div className="max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">The app first</span>
          <h2 className="mt-3 font-serif text-3xl font-medium text-slate-950 sm:text-4xl">
            From loose question to reviewable work
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-700">
            A user can begin with a prompt, a source packet, a draft question, or a document. PRAXIS keeps the sources, assumptions, gaps, and next actions near the answer, then produces a memo, brief, source review, or handover that still carries its evidence trail.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Use it today</span>
            <h2 className="mt-3 font-serif text-3xl font-medium text-slate-950 sm:text-4xl">
              Current PRAXIS stays simple: one cockpit, context attached, evidence visible.
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
              The current app centers on Home, saved context, Ask PRAXIS, sources, memos, and receipts. Upstream TACITUS systems and deeper graph or temporal engines are described as integration layers or roadmap lanes when they are not the visible production surface.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {currentCapabilityAnchors.map((item) => (
              <article id={item.id} key={item.id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/85 p-5">
                <h3 className="font-serif text-xl font-medium text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-5 px-5 pb-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">For technical readers</span>
          <h2 className="mt-3 font-serif text-3xl font-medium text-slate-950 sm:text-4xl">
            A Wikipedia for Agentic Context
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
            ContextCapsules are reusable context objects, not prompts. They preserve the parts of policy work that a capable analyst would normally carry in their head: sources, assumptions, tacit knowledge, reasoning devices, review gates, and allowed agent behavior.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
            Agents can inherit a capsule safely because claims, sources, memories, and limitations are labeled. The capsule says what is known, what is only remembered, what is stale, what is disputed, and what an agent must stop and hand back for review.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5">
            <h3 className="font-serif text-xl font-medium text-slate-950">Human review makes truth canonical</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              AI and Cognee can suggest improvements, recall advisory memory, find source gaps, or draft review cards, but human review decides what becomes canonical in the capsule.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5">
            <h3 className="font-serif text-xl font-medium text-slate-950">Community capsules stay inspectable</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Marketplace and community capsules should be forkable and inspectable, with provenance and review state visible before a team relies on them.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 sm:col-span-2">
            <h3 className="font-serif text-xl font-medium text-slate-950">What the capsule carries</h3>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              The capsule carries source spines, claim ledgers, tacit constraints, output contracts, allowed tools, forbidden actions, review checkpoints, memory receipts, and stale or rejected inferences as labeled context.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Premium web</span>
            <h2 className="mt-3 font-serif text-2xl font-medium text-slate-950">Premium web is not enabled by default.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              PRAXIS can expose a paid source-discovery lane only when the deployment has a configured provider and the user explicitly starts that paid workflow. Until then, public claims stay limited to the wired source receipts, uploaded documents, grounded-search routes, and review gates available in the app.
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Research graph</span>
            <h2 className="mt-3 font-serif text-2xl font-medium text-slate-950">GDELT + Wikidata add advisory entity and media signals.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Research graph is free in v1 for signed-in users. It grounds entities with Wikidata labels, aliases, identifiers, and official links, then checks GDELT DOC/API for media pulse and relationship hints. It never mutates the canonical PRAXIS graph automatically; candidates stay review-gated.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {capsuleCores.map((core) => (
            <article key={core.name} className="rounded-2xl border border-slate-200 bg-white/85 p-5">
              <h2 className="font-serif text-2xl font-medium text-slate-950">{core.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">{core.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 px-5 py-16 text-white sm:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">TACITUS ecosystem</span>
            <h2 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">
              PRAXIS is the workbench. The deeper systems organize what the workbench can use.
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              DIALECTICA, AGON, and KAIROS should be understood as upstream or intended integration layers where appropriate. PRAXIS is the public policy workspace that turns their structure into user-facing analysis and artifacts.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {ecosystemLinks.map((item) => (
              <article key={item.name} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="praxis-link font-serif text-xl font-medium text-white underline-offset-4 hover:decoration-amber-200"
                >
                  {item.name}
                </a>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.body}</p>
                {item.secondaryLinks ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.secondaryLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-slate-100 hover:border-amber-200/60"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Community</span>
          <h2 className="mt-3 font-serif text-3xl font-medium text-slate-950">How users can contribute</h2>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            The useful unit of contribution is not only code. Better sources, clearer capsule gaps, reviewed graph claims, and repeatable team context all make PRAXIS more useful.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {contributionPaths.map((path) => (
            <div key={path} className="rounded-2xl border border-slate-200 bg-white/85 p-4 text-sm leading-6 text-slate-700">
              {path}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
        <div className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-5 sm:p-7">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Aspirational</span>
          <h2 className="mt-3 font-serif text-3xl font-medium text-slate-950">
            What I&apos;d like PRAXIS to support next
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-800 sm:text-base sm:leading-7">
            The next version should make source-to-capsule saving one click, let teams share and fork capsules, review DIALECTICA graph deltas inside PRAXIS, show AGON and KAIROS evidence cards inside Ask answers, score capsule health, and support collaborative memo review. These are product goals, not a claim that every integration is already fully wired in production.
          </p>
        </div>
      </section>
    </PublicPageShell>
  );
}
