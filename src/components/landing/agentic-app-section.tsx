import { ArrowRight, CheckCircle2, FileText, Home, Layers3, Library, MessageSquareText, MoreHorizontal, ShieldCheck, Users } from 'lucide-react';
import { AGENTIC_WORKFLOWS, PRIMARY_MOBILE_WORKFLOWS } from '@/lib/agentic-workflows/registry';
import { PRODUCT_EXPERIENCE_AREAS } from '@/lib/product/experience-map';

const visibleAreas = PRODUCT_EXPERIENCE_AREAS.filter((area) =>
  ['home', 'ask', 'situation', 'sources', 'outputs'].includes(area.id),
);

const landingWorkflows = AGENTIC_WORKFLOWS.filter((workflow) =>
  ['understand-situation', 'improve-context', 'generate-handover', 'update-brief'].includes(workflow.id),
);

const mobileNav = [
  { label: 'Home', icon: Home },
  { label: 'Ask', icon: MessageSquareText },
  { label: 'Sources', icon: Library },
  { label: 'Outputs', icon: FileText },
  { label: 'More', icon: MoreHorizontal },
];

const publicContextCores = [
  { label: 'General PRAXIS', detail: 'Ask across the platform model, tool logic, workflows, and examples.' },
  { label: 'User core', detail: 'Keep preferences, saved situations, and personal working context together.' },
  { label: 'Team core', detail: 'Support shared workspaces where multiple authorized users inherit the same context.' },
  { label: 'Situation core', detail: 'Bind sources, documents, actors, graph facts, and outputs to the active case.' },
];

export function AgenticAppSection() {
  return (
    <section id="agentic-app" className="relative overflow-hidden border-y border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(232,185,49,0.09),transparent_34%),radial-gradient(circle_at_86%_56%,rgba(74,144,164,0.08),transparent_32%)]" />
      <div className="relative mx-auto max-w-[1520px]">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <span className="mb-5 block h-px w-16 bg-gradient-to-r from-gold-600 to-transparent" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Design-led agentic app</p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-semibold leading-tight text-navy-950 sm:text-5xl">
              The real app now starts with the job, not the tool map.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-navy-600 sm:text-lg">
              PRAXIS is organized around a simple operating loop: choose a workspace, open a Situation, ask PRAXIS, review the trust posture, and produce a handover or brief.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700">
              The same system can answer generally as PRAXIS, or bind its tools to a user, team, Situation, evidence set, graph, and output package.
            </p>

            <div className="mt-7 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-500">Mobile-first by default</p>
              <div className="mt-4 grid grid-cols-5 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                {mobileNav.map(({ label, icon: Icon }) => (
                  <div key={label} className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-center text-[11px] font-semibold text-navy-700">
                    <Icon className="h-4 w-4 text-diplomatic-blue" aria-hidden="true" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-diplomatic-blue" aria-hidden="true" />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy-500">Context cores</p>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {publicContextCores.map((core) => (
                  <div key={core.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-gold-700" aria-hidden="true" />
                      <h3 className="text-xs font-semibold text-navy-950">{core.label}</h3>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-700">{core.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-5">
              {visibleAreas.map((area) => (
                <div key={area.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-700">{area.shortLabel}</p>
                  <h3 className="mt-2 text-sm font-semibold text-navy-950">{area.label}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-700">{area.summary}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-navy-200 bg-navy-950 p-5 text-white shadow-xl shadow-navy-950/15">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">Ask PRAXIS command plane</p>
                  <h3 className="mt-2 text-2xl font-semibold">Four workflows are one tap away.</h3>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-navy-100">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                  Review-gated
                </span>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {landingWorkflows.map((workflow) => (
                  <div key={workflow.id} className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold text-white">{workflow.label}</h4>
                      <ArrowRight className="h-4 w-4 shrink-0 text-gold-300" aria-hidden="true" />
                    </div>
                    <p className="mt-2 text-xs leading-5 text-navy-200">{workflow.intent}</p>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                      Saves to {workflow.saveLocation}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {PRIMARY_MOBILE_WORKFLOWS.map((workflow) => (
                  <span key={workflow.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-navy-100">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                    {workflow.shortLabel}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
