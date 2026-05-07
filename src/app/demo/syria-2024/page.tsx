import Link from "next/link";
import type { Metadata } from "next";
import {
  SYRIA_DEMO_CANONICAL_GRAPH,
  SYRIA_DEMO_CONFLICT_GRAPH,
  SYRIA_DEMO_SITUATION,
} from "@/lib/constants/syria-demo-case";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Syria Public Demo - PRAXIS by TACITUS",
  description:
    "A signed-out, read-only PRAXIS demo showing a source-grounded Syria transition case with graph, provenance, and memo workflow previews.",
  robots: "index, follow",
};

const TYPE_COLORS: Record<string, string> = {
  actor: "bg-diplomatic-blue text-white",
  claim: "bg-gold-500 text-navy-950",
  interest: "bg-emerald-500 text-white",
  constraint: "bg-red-500 text-white",
  commitment: "bg-purple-500 text-white",
  event: "bg-slate-700 text-white",
};

const highlightNodes = SYRIA_DEMO_CANONICAL_GRAPH.nodes.slice(0, 12);
const highlightEdges = SYRIA_DEMO_CANONICAL_GRAPH.edges.slice(0, 8);
const sourceCount = SYRIA_DEMO_SITUATION.customSources?.length ?? 0;

const workflowCards = [
  {
    label: "Situation frame",
    value: `${SYRIA_DEMO_CONFLICT_GRAPH.actors.length} actors`,
    body: "Transition, humanitarian access, northeast integration, and regional spillover are kept in one operating frame.",
  },
  {
    label: "Source receipts",
    value: `${sourceCount} public sources`,
    body: "UN, humanitarian, local media, and economic-source lanes remain visible before any generated assessment.",
  },
  {
    label: "Conflict graph",
    value: `${SYRIA_DEMO_CANONICAL_GRAPH.nodes.length} nodes`,
    body: "Actors, claims, interests, constraints, commitments, and events carry provenance and valid-time metadata.",
  },
  {
    label: "Decision product",
    value: "Read-only preview",
    body: "The public demo shows the workflow without allowing writes, mutations, or private workspace access.",
  },
];

export default function SyriaPublicDemoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center opacity-[0.055]">
        <div className="-rotate-12 border-4 border-white px-10 py-5 text-5xl font-black uppercase tracking-[0.18em] text-white">
          Demo data
        </div>
      </div>

      <section className="relative overflow-hidden border-b border-white/10">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 22%, rgba(232,185,49,0.22), transparent 28%), radial-gradient(circle at 72% 12%, rgba(75,146,219,0.18), transparent 34%), linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "auto, auto, 64px 64px, 64px 64px",
          }}
        />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="font-serif text-xl font-semibold tracking-wide text-gold-300">
            PRAXIS
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/waitlist" className="text-sm font-medium text-slate-300 hover:text-white">
              Join waitlist
            </Link>
            <Link
              href="/login?mode=demo&example=syria-2026"
              className="rounded-md border border-gold-400/40 bg-gold-400/10 px-3 py-2 text-sm font-semibold text-gold-200 hover:bg-gold-400/20"
            >
              Open in workbench
            </Link>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-8 lg:grid-cols-[0.92fr_1.08fr] lg:pb-24 lg:pt-14">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-200">
              Public read-only demo
            </div>
            <h1 className="font-serif text-5xl leading-[1.03] text-white sm:text-6xl lg:text-7xl">
              Syria transition case, source-grounded and graph-first.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              This signed-out snapshot shows how PRAXIS turns public sources into
              a structured case: actors, claims, constraints, events, confidence,
              provenance, and export-ready reasoning. It is read-only and safe to
              browse without an account.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login?mode=demo&example=syria-2026"
                className="inline-flex items-center justify-center rounded-md bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-950 transition hover:bg-gold-400"
              >
                Open in workbench
              </Link>
              <Link
                href="/waitlist"
                className="inline-flex items-center justify-center rounded-md border border-white/14 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
              >
                Join the waitlist
              </Link>
            </div>
          </div>

          <div className="relative min-h-[460px] overflow-hidden rounded-2xl border border-white/12 bg-white/[0.05] p-5 shadow-2xl shadow-black/30">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Graph snapshot</p>
                <p className="mt-1 text-sm text-slate-200">
                  {SYRIA_DEMO_CANONICAL_GRAPH.nodes.length} nodes / {SYRIA_DEMO_CANONICAL_GRAPH.edges.length} edges
                </p>
              </div>
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Read-only
              </span>
            </div>

            <div className="relative h-[390px]">
              <div className="absolute left-[8%] top-[16%] h-px w-[74%] rotate-[16deg] bg-gold-300/25" />
              <div className="absolute left-[14%] top-[58%] h-px w-[62%] -rotate-[20deg] bg-diplomatic-blue/40" />
              <div className="absolute left-[38%] top-[10%] h-px w-[34%] rotate-[72deg] bg-emerald-300/25" />
              <div className="absolute left-[26%] top-[76%] h-px w-[52%] rotate-[-4deg] bg-white/15" />

              {highlightNodes.map((node, index) => {
                const angle = (index / highlightNodes.length) * Math.PI * 2;
                const radius = index % 3 === 0 ? 38 : index % 3 === 1 ? 31 : 23;
                const left = 50 + Math.cos(angle) * radius;
                const top = 50 + Math.sin(angle) * radius;
                return (
                  <div
                    key={node.id}
                    className="absolute max-w-[138px] -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    <div className="rounded-xl border border-white/15 bg-slate-950/90 p-2 shadow-lg shadow-black/30 backdrop-blur">
                      <span
                        className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${TYPE_COLORS[node.type] ?? "bg-slate-600 text-white"}`}
                      >
                        {node.type}
                      </span>
                      <p className="line-clamp-2 text-xs font-semibold leading-4 text-white">{node.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflowCards.map((card) => (
            <article key={card.label} className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-200">{card.label}</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">{card.value}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-16 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-200">Case line</p>
          <h2 className="mt-3 font-serif text-3xl text-white">{SYRIA_DEMO_SITUATION.name}</h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">{SYRIA_DEMO_SITUATION.description}</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.045] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-200">Edges visible in the snapshot</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {highlightEdges.map((edge) => (
              <div key={edge.id} className="rounded-lg border border-white/10 bg-slate-950/70 p-3">
                <p className="text-sm font-semibold text-white">{edge.label ?? edge.type}</p>
                <p className="mt-1 font-mono text-[11px] text-slate-400">
                  {edge.source} -&gt; {edge.target}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
