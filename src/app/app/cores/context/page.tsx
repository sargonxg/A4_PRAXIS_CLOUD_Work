import Link from 'next/link';
import { ArrowRight, CheckCircle2, FilePlus2, FolderKanban, Layers3, Plus } from 'lucide-react';
import { AdvancedExplanationPanel } from '@/components/app/advanced-explanation-panel';

const domains = [
  'Policy',
  'Conflict',
  'Diplomacy',
  'Humanitarian',
  'Legal',
  'Corporate/public affairs',
  'Custom',
];

const coreRows = [
  { label: 'Situation Core', value: 'Frame, actors, question', status: 'ready' },
  { label: 'Source/Document Core', value: 'Receipts and uploads', status: 'thin' },
  { label: 'Graph Core', value: 'Actor and claim proposals', status: 'needs review' },
  { label: 'Output Core', value: 'Memo target', status: 'ready' },
];

function hrefForDomain(domain: string) {
  return `/app/situations/new?domain=${encodeURIComponent(domain.toLowerCase().replaceAll('/', '-'))}`;
}

export default function ContextCorePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 pb-16">
      <section className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Context Core</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-navy-950">
              Create a specific context, attach sources, then ask.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Choose the knowledge cores PRAXIS should use. Start with a domain and keep the deeper graph and version controls in Advanced.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/situations/new" className="inline-flex items-center gap-2 rounded-md bg-navy-950 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-800">
              <Plus className="h-4 w-4" />
              Create context
            </Link>
            <Link href="/app/contexts" className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-900 hover:bg-slate-50">
              <FilePlus2 className="h-4 w-4" />
              Attach sources
            </Link>
            <Link href="/app/assistant" className="inline-flex items-center gap-2 rounded-md border border-gold-200 bg-gold-50 px-3 py-2 text-sm font-semibold text-gold-900 hover:bg-gold-100">
              Open Ask
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-sm shadow-navy-950/5">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-5 w-5 text-diplomatic-blue" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">Create specific context</p>
              <h2 className="text-lg font-semibold text-navy-950">Pick the closest working domain</h2>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {domains.map((domain) => (
              <Link
                key={domain}
                href={hrefForDomain(domain)}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-navy-900 hover:border-diplomatic-blue/30 hover:bg-white"
              >
                {domain}
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-gold-200 bg-gold-50 p-5 shadow-sm shadow-navy-950/5">
          <Layers3 className="h-5 w-5 text-gold-900" />
          <h2 className="mt-3 text-lg font-semibold text-navy-950">Active stack readiness</h2>
          <div className="mt-4 space-y-2">
            {coreRows.map((row) => (
              <div key={row.label} className="rounded-lg border border-gold-200/70 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-navy-950">{row.label}</p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <p className="mt-1 text-xs text-slate-600">{row.value}</p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-800">{row.status}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <AdvancedExplanationPanel
        items={[
          {
            title: 'Domain presets',
            body: 'Policy, conflict, diplomacy, humanitarian, legal, and public-affairs presets attach different starting cores without changing the main navigation.',
          },
          {
            title: 'Graph proposals',
            body: 'Documents and searches can create graph deltas for review, but they are not promoted into canonical graph facts automatically.',
          },
          {
            title: 'Capsule behavior',
            body: 'Capsules can be locked, forked, renamed, archived, and shared from the Core Library manage controls.',
          },
          {
            title: 'Advanced workspace',
            body: 'ACH, Boardroom, graph backend settings, diagnostics, and source audits remain available from Advanced.',
          },
        ]}
        actionHref="/app/tools"
      />
    </main>
  );
}
