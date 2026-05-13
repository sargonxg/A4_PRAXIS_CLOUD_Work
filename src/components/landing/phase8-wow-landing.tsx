"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  GitBranch,
  LibraryBig,
  MessageSquareText,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

const workflow = [
  ["Attach context", "Select the User Core, Situation Core, and source receipts that should travel with the work."],
  ["Ask PRAXIS", "Ask one grounded question with the active context already attached."],
  ["Review evidence gaps", "See unsupported, weak, and date-sensitive claims before they become memo language."],
  ["Draft memo", "Revise the answer into a reviewable memo with sources and handoff state visible."],
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
    label: "Memo Studio",
    href: "/app/write",
    icon: FileText,
    title: "Revise with gaps in view.",
    detail: "Unsupported and date-check claims sit beside the memo with Find source, Rewrite cautiously, and Save gap actions.",
  },
  {
    label: "Canvas",
    href: "/app/canvas",
    icon: GitBranch,
    title: "Review the structure of the case.",
    detail: "User Core, Situation Core, sources, actors, claims, timeline, draft, and saved gaps stay visible for handoff.",
  },
] as const;

const trustItems = [
  ["Source receipts", "PRAXIS keeps source posture and open gaps visible instead of hiding them inside a chat answer."],
  ["Human review", "Drafts are working products for analysts to accept, revise, reject, and hand over."],
  ["Cognee honesty", "The memory layer stays disabled in normal copy unless it is configured for the environment."],
  ["Cloud stack", "The production path is Google Cloud, Firebase, Firestore, Cloud SQL Postgres, and Secret Manager."],
] as const;

export function Phase8WowLanding() {
  return (
    <main className="bg-[#F6F8FB] text-[#111827]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A5A00]">PRAXIS by TACITUS</p>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl font-semibold leading-[1.03] text-[#111827] sm:text-6xl lg:text-7xl">
              Policy AI that starts with the right context.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg">
              Attach a User Core, a Situation Core, and the sources your team trusts. PRAXIS turns that context into grounded answers, visible evidence gaps, and memos ready for review.
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
          </div>

          <div className="rounded-lg border border-slate-200 bg-[#F9FBFC] p-4 shadow-xl shadow-slate-950/10">
            <div className="grid gap-3 sm:grid-cols-2">
              <ContextCard icon={Users} label="User Core" value="Foreign policy analyst" />
              <ContextCard icon={Target} label="Situation Core" value="Indo-Pacific 2026" />
              <ContextCard icon={BookOpenCheck} label="Sources" value="Receipts, uploads, notes" />
              <ContextCard icon={FileText} label="Memo output" value="Cited draft + handoff" />
            </div>
            <div className="mt-4 rounded-md border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">First workflow</p>
              <div className="mt-3 space-y-3">
                {workflow.map(([label, detail], index) => (
                  <div key={label} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#111827] text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-950">{label}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-600">{detail}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#F6F8FB] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A5A00]">One simple loop</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Attach context, ask, review gaps, draft the memo.</h2>
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

      <section className="border-b border-slate-200 bg-white px-4 py-14 sm:px-6 lg:px-8">
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

      <section className="border-b border-slate-200 bg-[#101827] px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <ShieldCheck className="h-6 w-6 text-[#E8B931]" />
            <h2 className="mt-3 text-2xl font-semibold">Trust is visible in the workflow.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              PRAXIS does not present generic certainty. It keeps source receipts, human review, disabled-memory honesty, and the deployed cloud stack explicit.
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

      <section className="bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-lg border border-slate-200 bg-[#F9FBFC] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A5A00]">Start with context</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Open Ask PRAXIS and attach the right core.</h2>
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

function ContextCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        <Icon className="h-4 w-4 text-[#0B3B4A]" />
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}
