import type { Metadata } from "next";
import Link from "next/link";
import { PraxisGlyphChip } from "@/components/brand/praxis-mark";
import { PraxisThinking } from "@/components/brand/praxis-thinking";
import { LivingContextRail, PublicPageShell } from "@/components/ui/instrument";

export const metadata: Metadata = {
  title: "Learn how PRAXIS works | PRAXIS by TACITUS",
  description:
    "A public explainer for PRAXIS, the TACITUS policy workbench for questions, sources, ContextCapsules, policy tools, memos, and provenance.",
  alternates: {
    canonical: "/learn",
  },
  openGraph: {
    title: "How PRAXIS works",
    description:
      "Learn how PRAXIS lets you compose reasoning and policy products from expert ContextCapsules and upstream TACITUS systems.",
    url: "/learn",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "How PRAXIS works" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How PRAXIS works",
    description:
      "The public guide to PRAXIS, ContextCapsules, TACITUS, DIALECTICA, AGON, and KAIROS.",
    images: ["/opengraph-image"],
  },
};

const flowSteps = [
  "Prompt or document",
  "ContextCapsule",
  "Source, document, graph, and time cores",
  "Ask PRAXIS, tools, and agents",
  "Memo, brief, or handover",
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
    { id: "context", label: "Context", value: "ContextCapsule", detail: "Reusable cores", state: "active" as const },
    { id: "source", label: "Sources", value: "Receipts", detail: "Documents and provenance", state: "ready" as const },
    { id: "output", label: "Output", value: "Memo or handover", detail: "Reviewable work", state: "quiet" as const },
    { id: "readiness", label: "Readiness", value: "Visible gates", detail: "Source, time, graph", state: "active" as const },
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
            PRAXIS is the visible workbench where users ask questions, attach sources, build ContextCapsules, run policy tools, draft memos, and preserve provenance. The surface stays simple: one place to turn a situation, document, or policy question into reviewable work.
          </p>
          <LivingContextRail cells={learnRailCells} compact className="mt-7" />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login?mode=signup"
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white"
            >
              Start a capsule
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
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Context flow</span>
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
            From loose question to reusable policy context
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-700">
            A user can begin with a prompt, a source packet, a draft question, or a document. PRAXIS wraps the work in a ContextCapsule, routes it through source, document, graph, and time cores, then uses Ask PRAXIS, tools, and agent workflows to produce a memo, brief, source review, or handover that still carries its evidence trail.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Premium web</span>
            <h2 className="mt-3 font-serif text-2xl font-medium text-slate-950">Exa finds high-quality open-web sources when a turn needs paid discovery.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Premium web is the source-discovery lane for current, source-linked open-web research. It is separate from the free Research graph extra and remains available only when the user enables it for a paid turn.
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
                  className="font-serif text-xl font-medium text-white underline decoration-amber-300/50 underline-offset-4 hover:decoration-amber-200"
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
