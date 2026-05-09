'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowRight,
  ClipboardList,
  Download,
  FileCheck2,
  FileText,
  MessageSquareText,
  PenLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { AGENTIC_WORKFLOWS } from '@/lib/agentic-workflows/registry';
import { useSituationStore } from '@/stores/situation-store';

const templates = [
  {
    label: 'Handover',
    description: 'Successor brief with episodes, open threads, source caveats, and standing counsel.',
    icon: ClipboardList,
    href: '/app/ask?mode=brief&template=handover',
  },
  {
    label: 'Decision brief',
    description: 'Leadership-ready options, tradeoffs, confidence, dissent, and recommended next step.',
    icon: FileCheck2,
    href: '/app/ask?mode=brief&template=decision-brief',
  },
  {
    label: 'Policy memo',
    description: 'Structured memo with claims, citations, uncertainty notes, and action implications.',
    icon: FileText,
    href: '/app/ask?mode=memo&template=policy-memo',
  },
  {
    label: 'Talking points',
    description: 'Concise lines for a meeting, with caveats and likely follow-up questions.',
    icon: MessageSquareText,
    href: '/app/ask?mode=talking_points&template=talking-points',
  },
];

const outputTypes = ['Memos', 'Briefs', 'Drafts', 'Talking points', 'Board packs', 'Exports'];

export function V7OutputsSurface() {
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const active = activeSituation ?? situations[0] ?? null;
  const activeCaseId = active?.id;
  const activeCaseName = active?.name ?? 'No active Situation';
  const activeHref = activeCaseId ? `/app/workbench/${activeCaseId}` : '/app/workbench';
  const outputWorkflows = AGENTIC_WORKFLOWS.filter((workflow) => workflow.primaryArea === 'outputs');

  return (
    <div className="space-y-5" data-testid="v7-outputs-surface">
      <section className="overflow-hidden rounded-lg border border-navy-200 bg-white shadow-sm shadow-navy-950/5">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.42fr)]">
          <div className="p-5 sm:p-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-semibold uppercase text-gold-800">
              <FileText className="h-3.5 w-3.5" />
              Outputs
            </p>
            <h1 className="mt-4 max-w-3xl text-2xl font-semibold leading-tight text-navy-950 sm:text-4xl">
              Produce the memo, brief, handover, or talking points from the context you trust.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
              Outputs is the clean writing and export surface. Ask PRAXIS drafts from the active Situation Core, then every claim is reviewed for citation coverage before it becomes final.
            </p>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-700">Drafting from</p>
                  <p className="mt-1 text-lg font-semibold text-navy-950">{activeCaseName}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-700">Situation Core, Sources, Graph, User Core, and prior Outputs attach by default.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <LinkButton href="/app/ask?mode=brief" icon={Sparkles} label="Draft with Ask" primary />
                  <LinkButton href={`${activeHref}?openChapter=draft`} icon={PenLine} label="Open editor" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-navy-200 bg-navy-950 p-5 text-white xl:border-l xl:border-t-0 sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gold-300" />
              <h2 className="text-lg font-semibold">Provenance before polish</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-navy-200">
              An output is ready only when its claims have citations or explicit uncertainty notes. This keeps the investor demo honest and the analyst workflow usable.
            </p>
            <div className="mt-5 grid gap-3">
              <TrustMetric label="Claim coverage" value="Required" />
              <TrustMetric label="Citation resolution" value="Checked" />
              <TrustMetric label="Export posture" value="MD / DOCX / PDF" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.66fr)_minmax(320px,0.34fr)]">
        <Panel title="New output" eyebrow="Templates" icon={Sparkles}>
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((template) => (
              <ActionCard key={template.label} {...template} />
            ))}
          </div>
        </Panel>

        <Panel title="My outputs" eyebrow="Library" icon={FileText}>
          <div className="space-y-3">
            {outputTypes.map((type) => (
              <Link
                key={type}
                href={activeHref}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-navy-950 transition hover:border-navy-300 hover:bg-white"
              >
                <span>{type}</span>
                <ArrowRight className="h-4 w-4 text-slate-500" />
              </Link>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.55fr)_minmax(320px,0.45fr)]">
        <Panel title="Ask-ready production workflows" eyebrow="Guided output" icon={ClipboardList}>
          <div className="grid gap-3 md:grid-cols-2">
            {outputWorkflows.map((workflow) => (
              <button
                key={workflow.id}
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('open-praxis-chat'))}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-navy-300 hover:bg-white"
              >
                <span className="block text-sm font-semibold text-navy-950">{workflow.label}</span>
                <span className="mt-2 block text-xs leading-5 text-slate-700">{workflow.intent}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Export path" eyebrow="Ship" icon={Download}>
          <div className="grid gap-3 sm:grid-cols-3">
            {['Markdown', 'DOCX', 'PDF'].map((format) => (
              <div key={format} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-navy-950">{format}</p>
                <p className="mt-2 text-xs leading-5 text-slate-700">Uses the existing export stack until the v7 Output Core writer lands.</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  icon: Icon,
  children,
}: {
  title: string;
  eyebrow: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gold-50 text-gold-700 ring-1 ring-gold-200">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase text-gold-700">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold text-navy-950">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function ActionCard({
  label,
  description,
  href,
  icon: Icon,
}: {
  label: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <Link href={href} className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-navy-300 hover:bg-white">
      <Icon className="h-5 w-5 text-gold-700" />
      <p className="mt-3 text-sm font-semibold text-navy-950">{label}</p>
      <p className="mt-2 text-xs leading-5 text-slate-700">{description}</p>
    </Link>
  );
}

function LinkButton({
  href,
  icon: Icon,
  label,
  primary = false,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold ${
        primary
          ? 'bg-navy-950 text-white hover:bg-navy-800'
          : 'border border-slate-200 bg-white text-navy-800 hover:border-navy-300 hover:bg-white'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function TrustMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
      <p className="text-xs font-semibold uppercase text-navy-200">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
