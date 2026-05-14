"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  LibraryBig,
  MessageSquareText,
  Network,
  ShieldCheck,
} from "lucide-react";
import { CoreCapsuleHero } from "./core-capsule-hero";
import { PolicyTicker } from "./policy-ticker";
import { RotatingHeadline } from "./rotating-headline";
import { SpecimenCard, SpecimenGrid, type CoreSpecimenKind } from "@/components/cores/specimen-card";

const SPECIMENS: ReadonlyArray<{
  kind: CoreSpecimenKind;
  serial: string;
  title: string;
  essence: string;
}> = [
  { kind: 'user', serial: 'PRX-CORE-USR-202604', title: 'Senior policy analyst', essence: 'Indo-Pacific desk · mandates: deterrence, alliance posture · red lines: cite-or-cut.' },
  { kind: 'situation', serial: 'PRX-CORE-SIT-202604', title: 'Indo-Pacific 2026', essence: 'Eight state actors · four non-state · two open ceasefires · domain locked.' },
  { kind: 'source', serial: 'PRX-CORE-SRC-202604', title: '42 receipts attached', essence: 'ICG, UCDP, GDELT, FCDO briefings · page-spans verified · 2 gaps flagged.' },
  { kind: 'graph', serial: 'PRX-CORE-GRF-202604', title: 'Actor–claim lattice v3', essence: '128 nodes · 311 edges · two patches proposed by agent, pending review.' },
  { kind: 'time', serial: 'PRX-CORE-TIM-202604', title: 'Horizon: 2026-2028', essence: 'Valid-time window set · bitemporal posture · freshness gate active.' },
  { kind: 'output', serial: 'PRX-CORE-OUT-202604', title: 'Cited options memo', essence: 'Audience: principals · tone: cautious · footnoted receipts · DOCX/PDF ready.' },
];

const workflow = [
  ["Capture the context", "Build the User, Situation, Source, Graph, Time, and Output cores once. PRAXIS stores them as a reusable capsule, not a prompt."],
  ["See reality through expert eyes", "Temporal, causal, actor, source, and domain checks layer expert structure over every claim before reasoning runs."],
  ["Ground every answer", "Receipts, page-spans, time horizons, and graph proposals stay in view while PRAXIS drafts or stress-tests."],
  ["Hand over the capsule", "Ship the memo and its context together. A teammate or an agent inherits the same posture, not a screenshot."],
] as const;

const proofPanels = [
  {
    label: "Library",
    href: "/app/workbench/indo-pacific-2026?tab=library",
    icon: LibraryBig,
    title: "Capture sources, documents, tacit notes.",
    detail: "Upload PDFs, DOCX, cables, briefings, or voice notes. PRAXIS extracts claims, actors, dates, and page-span receipts so tacit institutional memory becomes structured context.",
  },
  {
    label: "Situation Intelligence",
    href: "/app/workbench/indo-pacific-2026?tab=graph",
    icon: Network,
    title: "Layer expert structure over reality.",
    detail: "Temporal, causal, domain, actor, and graph readiness checks expose unsupported reasoning before PRAXIS recommends tools or drafts. The substrate stays inspectable.",
  },
  {
    label: "Memo Studio",
    href: "/app/write",
    icon: FileText,
    title: "Draft grounded, ship the capsule.",
    detail: "Unsupported and date-check claims sit beside the memo with Find source, Rewrite cautiously, and Save gap actions. Ship the memo and the capsule together.",
  },
] as const;

const trustItems = [
  ["Inheritable cores", "User, Situation, Source/Document, Graph, Time, and Output posture travel across questions, tools, drafts, and handovers."],
  ["Temporal readiness", "Date-sensitive claims and scenario work stay gated by explicit time posture instead of hidden assumptions."],
  ["Source receipts", "PRAXIS keeps source posture and open gaps visible instead of hiding them inside a chat answer."],
  ["Human review", "Drafts, graph proposals, and handover notes remain working products for analysts to accept, revise, or reject."],
] as const;

export function Phase8WowLanding() {
  return (
    <main className="bg-[#F6F8FB] text-[#111827]">
      <section id="core-stack" className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,185,49,0.07),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(15,23,42,0.04),transparent_55%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(440px,1.05fr)] lg:px-8">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#8A5A00]">
              <span className="font-mono text-[10px] tracking-[0.2em] text-slate-400">vol. VI · No. 1</span>
              <span aria-hidden className="h-px w-6 bg-slate-300" />
              <span>PRAXIS by TACITUS</span>
            </p>
            <RotatingHeadline className="mt-4" />
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              Six structured cores — User, Situation, Source, Graph, Time, Output — package the tacit knowledge that makes your judgement work. Hand them to a teammate, an agent, or your future self.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Built from practitioner experience in multilateral diplomacy: hybrid teams need shared posture, not shared prompts. PRAXIS keeps the substrate visible — source receipts, temporal readiness, graph proposals, and analyst handover all stay reviewable.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/app/assistant"
                className="inline-flex items-center gap-2 rounded-md bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#243244]"
              >
                Open Ask workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-500"
              >
                Compare plans
              </Link>
            </div>
            <dl className="mt-9 grid max-w-xl grid-cols-3 gap-4 border-t border-slate-200 pt-6 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <div>
                <dt className="font-semibold text-[#8A5A00]">Six cores</dt>
                <dd className="mt-1 normal-case tracking-normal text-slate-700">One capsule, ready to ship.</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#8A5A00]">Hybrid teams</dt>
                <dd className="mt-1 normal-case tracking-normal text-slate-700">Humans and agents subscribed.</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#8A5A00]">Trust strata</dt>
                <dd className="mt-1 normal-case tracking-normal text-slate-700">Receipts, time, graph in view.</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <CoreCapsuleHero />
            <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Live composite — context capsule for <span className="font-semibold text-slate-700">Indo-Pacific 2026</span>, shared across a hybrid team.
            </p>
          </div>
        </div>
      </section>

      <section id="methods" className="border-b border-slate-200 bg-[#F6F8FB] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">How PRAXIS builds policy knowledge</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Capture, structure, ground, hand over. Layer by layer.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Policy teams do not need another chatbot. They need to build inheritable knowledge — context that travels with the work, structure that reflects expert judgement, and receipts that survive the next reviewer.
            </p>
          </div>
          <div className="mt-7 grid gap-4 lg:grid-cols-4">
            {workflow.map(([label, detail]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="mt-3 text-sm font-semibold text-slate-950">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PolicyTicker />

      <section id="specimens" className="border-b border-slate-200 bg-[#FAF8F2] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">Six cores, packaged as one capsule</p>
            <h2 className="mt-2 font-serif text-3xl tracking-tight text-slate-950 sm:text-4xl">Specimens from a working capsule.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              A capsule is the durable artefact PRAXIS hands between desks. Each core inside it is inspectable: a serial number, a posture, and the receipts it carries. This is what a senior analyst's working capsule looks like on a live Indo-Pacific desk.
            </p>
          </div>
          <SpecimenGrid className="mt-8 sm:grid-cols-2 lg:grid-cols-3">
            {SPECIMENS.map((s) => (
              <SpecimenCard key={s.kind} kind={s.kind} serial={s.serial} title={s.title} essence={s.essence} />
            ))}
          </SpecimenGrid>
        </div>
      </section>

      <section id="drafting" className="border-b border-slate-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          {proofPanels.map((panel) => (
            <Link key={panel.label} href={panel.href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#8A5A00]/40 hover:shadow-md">
              <panel.icon className="h-5 w-5 text-[#0B3B4A]" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{panel.label}</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">{panel.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{panel.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="real-app" className="border-b border-slate-200 bg-[#101827] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <ShieldCheck className="h-6 w-6 text-[#E8B931]" />
            <h2 className="mt-3 text-2xl font-semibold">Trust is visible before PRAXIS reasons.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              PRAXIS does not present generic certainty. It keeps inherited cores, temporal readiness, source receipts, graph proposals, and analyst review explicit.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustItems.map(([label, detail]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-lg border border-slate-200 bg-[#F9FBFC] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A5A00]">Start with context</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Open Ask PRAXIS and work from the active core stack.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/app/assistant" className="inline-flex items-center gap-2 rounded-md bg-[#111827] px-5 py-3 text-sm font-semibold text-white">
              Open Ask workspace
              <MessageSquareText className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900">
              Compare plans
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

