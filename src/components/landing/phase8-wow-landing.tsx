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

const workflow = [
  ["Inherit the cores", "Select the User, Situation, Source/Document, Graph, Time, and Output posture that should travel with the work."],
  ["Ask PRAXIS", "Ask one grounded question with the active core stack already attached."],
  ["Review structure", "Check temporal, causal, actor, source, and domain gaps before they become memo language."],
  ["Hand over output", "Revise the answer into a reviewable memo with receipts, gaps, and analyst handover state visible."],
] as const;

const proofPanels = [
  {
    label: "Library",
    href: "/app/workbench/indo-pacific-2026?tab=library",
    icon: LibraryBig,
    title: "Attach and structure sources.",
    detail: "Upload PDFs, DOCX, notes, or source files. PRAXIS extracts claims, actors, dates, and source-span provenance where available.",
  },
  {
    label: "Situation Intelligence",
    href: "/app/workbench/indo-pacific-2026?tab=graph",
    icon: Network,
    title: "Make reasoning structure visible.",
    detail: "Temporal, causal, domain, actor, and graph posture checks reduce unsupported reasoning before PRAXIS recommends tools or drafts.",
  },
  {
    label: "Memo Studio",
    href: "/app/write",
    icon: FileText,
    title: "Revise with gaps in view.",
    detail: "Unsupported and date-check claims sit beside the memo with Find source, Rewrite cautiously, and Save gap actions.",
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
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A5A00]">PRAXIS by TACITUS</p>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl font-semibold leading-[1.03] text-[#111827] sm:text-6xl lg:text-7xl">
              PRAXIS builds inheritable policy cores.
            </h1>
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">One simple loop</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Inherit context, ask, review structure, hand over the memo.</h2>
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

