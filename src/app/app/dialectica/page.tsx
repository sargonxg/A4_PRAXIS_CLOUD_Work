'use client';

import {
  CheckCircle2,
  Database,
  FileCheck2,
  GitBranch,
  Layers3,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import {
  DIALECTICA_CAPABILITIES,
  DIALECTICA_DEMO_SCENARIO,
  DIALECTICA_NAMED_GRAPHS,
  DIALECTICA_PRIMITIVES,
  dialecticaCoveragePercent,
  type DialecticaReadiness,
} from '@/lib/constants/dialectica-backbone';
import { cn } from '@/lib/utils/cn';

const READINESS_STYLES: Record<DialecticaReadiness, string> = {
  available: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  standard: 'border-blue-200 bg-blue-50 text-blue-800',
  premium: 'border-gold-500/30 bg-gold-500/10 text-gold-800',
  planned: 'border-slate-200 bg-slate-50 text-slate-700',
};

const READINESS_LABEL: Record<DialecticaReadiness, string> = {
  available: 'Live now',
  standard: 'Standard layer',
  premium: 'Premium target',
  planned: 'Roadmap',
};

export default function DialecticaBackbonePage() {
  const primitiveTotal = DIALECTICA_PRIMITIVES.reduce((sum, primitive) => sum + primitive.demoCount, 0);

  return (
    <div className="flex flex-col gap-5 p-6">
      <header className="border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Dialectica backbone preview</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-950">Premium graph reasoning, staged honestly</h1>
            <p className="mt-2 text-sm leading-6 text-navy-600">
              PRAXIS already captures situations as typed actors, claims, interests, constraints, leverage,
              commitments, events, and narratives. Dialectica is the premium backend target that can turn those
              primitives into Datalog reasoning, named provenance graphs, contradiction detection, and scenario forks.
            </p>
          </div>
          <div className="rounded-lg border border-gold-500/30 bg-gold-500/10 px-4 py-3 text-sm text-navy-800 shadow-sm">
            <div className="flex items-center gap-2 font-semibold">
              <LockKeyhole className="h-4 w-4 text-gold-700" />
              Adapter target, not active migration
            </div>
            <p className="mt-1 max-w-xs text-xs leading-snug text-navy-600">
              Firestore remains canonical today. This page shows the exact premium contract PRAXIS is preparing for.
            </p>
          </div>
        </div>
      </header>

      <section data-tour="dialectica-metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Network} label="Conflict primitives" value={String(DIALECTICA_PRIMITIVES.length)} />
        <MetricCard icon={Database} label="Demo graph items" value={String(primitiveTotal)} />
        <MetricCard icon={ShieldCheck} label="Primitive coverage" value={`${dialecticaCoveragePercent()}%`} />
        <MetricCard icon={Layers3} label="Named graph layers" value={String(DIALECTICA_NAMED_GRAPHS.length)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div data-tour="dialectica-primitives" className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Core grammar</p>
              <h2 className="text-base font-semibold text-navy-900">Eight primitives that survive backend changes</h2>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              Firestore today · Dialectica tomorrow
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {DIALECTICA_PRIMITIVES.map((primitive) => (
              <div key={primitive.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-navy-900">{primitive.label}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-navy-500">
                    {primitive.demoCount} demo
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-navy-600">{primitive.description}</p>
              </div>
            ))}
          </div>
        </div>

        <aside data-tour="dialectica-reasoning" className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Demo reasoning question</p>
            <p className="mt-2 text-sm font-medium leading-6 text-navy-900">{DIALECTICA_DEMO_SCENARIO.question}</p>
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-950 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-100">
              {DIALECTICA_DEMO_SCENARIO.datalogRule}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Analyst gate</p>
            <p className="mt-2 text-sm leading-6 text-navy-700">{DIALECTICA_DEMO_SCENARIO.analystGate}</p>
          </div>

          <div className="grid gap-2">
            <PraxisLink
              href="/graphops"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-diplomatic-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-diplomatic-blue/90"
            >
              <GitBranch className="h-4 w-4" />
              Open GraphOps
            </PraxisLink>
            <PraxisLink
              href="/settings/graph-backend"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy-700 transition hover:bg-slate-50"
            >
              <Database className="h-4 w-4" />
              View backend settings
            </PraxisLink>
          </div>
        </aside>
      </section>

      <section data-tour="dialectica-named-graphs" className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
          <div className="mb-3 flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-diplomatic-blue" />
            <h2 className="text-base font-semibold text-navy-900">Named graph layers</h2>
          </div>
          <div className="space-y-2">
            {DIALECTICA_NAMED_GRAPHS.map((graph) => (
              <div key={graph.id} className="rounded-md border border-slate-200 px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-navy-900">{graph.label}</h3>
                  <ReadinessBadge readiness={graph.readiness} />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-navy-600">{graph.purpose}</p>
                <p className="mt-2 text-[11px] leading-snug text-navy-500">{graph.currentState}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
          <div className="mb-3 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-diplomatic-blue" />
            <h2 className="text-base font-semibold text-navy-900">Capability staging</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-navy-400">
                  <th className="py-2 pr-3">Capability</th>
                  <th className="py-2 pr-3">Current PRAXIS</th>
                  <th className="py-2 pr-3">Dialectica target</th>
                  <th className="py-2">Stage</th>
                </tr>
              </thead>
              <tbody>
                {DIALECTICA_CAPABILITIES.map((capability) => (
                  <tr key={capability.label} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-3 font-medium text-navy-900">{capability.label}</td>
                    <td className="py-3 pr-3 text-xs leading-relaxed text-navy-600">{capability.firestore}</td>
                    <td className="py-3 pr-3 text-xs leading-relaxed text-navy-600">{capability.dialectica}</td>
                    <td className="py-3"><ReadinessBadge readiness={capability.readiness} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-gold-600" />
          <h2 className="text-base font-semibold text-navy-900">What the demo can say now</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {DIALECTICA_DEMO_SCENARIO.expectedOutput.map((output) => (
            <div key={output} className="flex gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <p className="text-xs leading-relaxed text-navy-700">{output}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <div className="flex items-center gap-2 text-navy-500">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-navy-900">{value}</p>
    </div>
  );
}

function ReadinessBadge({ readiness }: { readiness: DialecticaReadiness }) {
  return (
    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold', READINESS_STYLES[readiness])}>
      {READINESS_LABEL[readiness]}
    </span>
  );
}
