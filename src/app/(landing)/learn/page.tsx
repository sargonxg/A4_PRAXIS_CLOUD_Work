import type { Metadata } from "next";
import Link from "next/link";
import { PraxisGlyphChip } from "@/components/brand/praxis-mark";
import { PraxisThinking } from "@/components/brand/praxis-thinking";

export const metadata: Metadata = {
  title: "Learn | PRAXIS by TACITUS",
  description:
    "Learn how PRAXIS uses ContextCapsules, grounded sources, and policy agents to structure statecraft work.",
};

const capsuleSteps = [
  {
    label: "Capture",
    body: "Start with one situation, document, or policy question. PRAXIS turns it into a typed ContextCapsule instead of a loose chat thread.",
  },
  {
    label: "Structure",
    body: "The capsule separates source posture, temporal signals, causal claims, human friction, objectives, and outputs.",
  },
  {
    label: "Work",
    body: "Ask PRAXIS, source-check, draft a memo, or hand the capsule to another policy teammate without losing the reasoning trail.",
  },
];

const reasoningCapsules = [
  "Temporal and causal map",
  "Human friction map",
  "Decision clock",
  "Sourceability check",
  "Director handover",
  "Crisis brief",
];

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ec] text-slate-950">
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-3">
            <PraxisGlyphChip size={30} />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">PRAXIS by TACITUS</span>
          </div>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl font-medium leading-tight text-slate-950 sm:text-6xl">
            One page for policy work. ContextCapsules underneath.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
            PRAXIS keeps the visible product simple: one cockpit, one capsule bar, one place to ask. The depth lives in structured capsules that help policy teams track evidence, time, causality, friction, and decisions.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white"
            >
              Open cockpit
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900"
            >
              View pricing
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.10)] sm:p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">ContextCapsule</span>
              <PraxisThinking compact size={18} className="text-amber-200" />
            </div>
            <h2 className="mt-6 font-serif text-3xl font-medium">Policy team memory, structured for action.</h2>
            <div className="mt-6 grid gap-3">
              {reasoningCapsules.map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {capsuleSteps.map((step) => (
            <article key={step.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-serif text-2xl font-medium text-slate-950">{step.label}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">{step.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
