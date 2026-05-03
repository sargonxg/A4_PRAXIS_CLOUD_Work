import Link from 'next/link';
import { GitCompareArrows, Landmark, Network, ShieldCheck, Sparkles } from 'lucide-react';
import {
  SYRIA_COMMITMENT_MONITOR_DEMO,
  SYRIA_CURRENT_RESEARCH_SOURCES,
  SYRIA_DISCREPANCY_WORKFLOWS,
  SYRIA_NEUROSYMBOLIC_POLICY_PAYOFFS,
  SYRIA_NEUROSYMBOLIC_RESEARCH_BASE,
  SYRIA_ONTOLOGY_REASONING_TRACKS,
} from '@/lib/constants/syria-demo-workspace';

export function GroundingBackbone() {
  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-navy-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-200">
              <Sparkles className="h-3.5 w-3.5" />
              Dialectica backbone
            </div>
            <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight sm:text-5xl">
              PRAXIS is built for discrepancies, not summaries.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100/75">
              The Syria case shows how a real analyst workflow can capture UN documents,
              think-tank production, local media, official statements, and humanitarian
              updates, then compare exact wording, timing, claims, omissions, and graph
              consequences before drafting.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/login?mode=demo&redirect=/app/syria-case%3Frecording%3D1%26case%3Dsyria"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gold-500 px-5 py-3 text-sm font-semibold text-navy-950 transition hover:bg-gold-400"
              >
                Open Syria workspace
              </Link>
              <Link
                href="/login?mode=demo&redirect=/app/media-roundup%3Frecording%3D1%26case%3Dsyria"
                className="inline-flex items-center justify-center rounded-md border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See discrepancy board
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: 'Grounded search', value: SYRIA_CURRENT_RESEARCH_SOURCES.length, icon: Landmark, detail: 'UN, Council, think-tank, rights, humanitarian, and local sources.' },
                { label: 'Discrepancy workflows', value: SYRIA_DISCREPANCY_WORKFLOWS.length, icon: GitCompareArrows, detail: 'Compare exact claims, wording, omissions, temporal lag, and confidence.' },
                { label: 'Ontology tracks', value: SYRIA_ONTOLOGY_REASONING_TRACKS.length, icon: Network, detail: 'Purpose-built graph filters for integration, access, recovery, and statements.' },
                { label: 'Commitments', value: SYRIA_COMMITMENT_MONITOR_DEMO.length, icon: ShieldCheck, detail: 'Turn agreements, communiqués, and plans into compliance evidence.' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/55">{item.label}</p>
                      <Icon className="h-4 w-4 text-gold-200" />
                    </div>
                    <p className="mt-2 font-mono text-3xl font-bold text-white">{item.value}</p>
                    <p className="mt-1 text-xs leading-snug text-blue-100/65">{item.detail}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/55">What this unlocks</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {SYRIA_DISCREPANCY_WORKFLOWS.map((workflow) => (
                  <div key={workflow.question} className="rounded-md border border-white/10 bg-navy-900/70 px-3 py-2">
                    <p className="text-xs font-semibold text-white">{workflow.question}</p>
                    <p className="mt-1 text-[11px] leading-snug text-blue-100/65">{workflow.output}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100/55">Neuro-symbolic moat</p>
                <h3 className="mt-1 text-lg font-semibold text-white">LLMs draft. The graph remembers and checks.</h3>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {SYRIA_NEUROSYMBOLIC_POLICY_PAYOFFS.slice(0, 4).map((payoff) => (
                    <div key={payoff.label} className="rounded-md border border-white/10 bg-navy-900/70 px-3 py-2">
                      <p className="text-xs font-semibold text-white">{payoff.label}</p>
                      <p className="mt-1 text-[11px] leading-snug text-blue-100/65">{payoff.capability}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gold-300/20 bg-gold-300/10 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-100">Research base</p>
                <p className="mt-2 font-mono text-3xl font-bold text-white">{SYRIA_NEUROSYMBOLIC_RESEARCH_BASE.length}</p>
                <p className="mt-1 text-xs leading-snug text-gold-50/75">
                  GraphRAG, LLM/KG, ontology explanation, and neuro-symbolic reasoning papers are wired into the product story.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
