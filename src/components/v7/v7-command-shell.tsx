import Link from 'next/link';
import { ArrowRight, Bot, CheckCircle2, Layers3, Route, Sparkles } from 'lucide-react';

import { AGENTIC_WORKFLOWS } from '@/lib/agentic-workflows/registry';
import { PRODUCT_EXPERIENCE_AREAS, getWorkflowCountForArea } from '@/lib/product/experience-map';

interface V7CommandShellProps {
  activeCaseId: string;
  activeCaseName: string;
}

const primaryWorkflows = AGENTIC_WORKFLOWS.filter((workflow) => workflow.mobilePriority === 'primary');

export function V7CommandShell({ activeCaseId, activeCaseName }: V7CommandShellProps) {
  return (
    <section
      className="overflow-hidden rounded-lg border border-navy-200 bg-white shadow-sm shadow-navy-950/5"
      data-testid="v7-command-shell"
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,0.98fr)_minmax(380px,0.72fr)]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-semibold uppercase text-gold-800">
                <Sparkles className="h-3.5 w-3.5" />
                v7 command layer
              </p>
              <h1 className="mt-4 text-2xl font-semibold text-navy-950 sm:text-3xl">
                Select a workspace, ask PRAXIS, and let the system stage the right context.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                The powerful parts stay behind the scenes: Context Cores, sources, graph, episodes, skills, and outputs. The analyst starts with one active Situation and one guided command plane.
              </p>
            </div>
            <Link
              href={activeCaseId ? `/app/workbench/${activeCaseId}` : '/app/workbench'}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Open Situation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-700">Active workspace</p>
                <p className="mt-1 text-lg font-semibold text-navy-950">{activeCaseName}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-praxis-chat'));
                }}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-gold-300 bg-white px-4 py-2 text-sm font-semibold text-gold-800 hover:border-gold-400 hover:bg-gold-50"
              >
                <Bot className="h-4 w-4" />
                Ask PRAXIS
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PRODUCT_EXPERIENCE_AREAS.map((area) => (
              <Link
                key={area.id}
                href={area.defaultHref}
                className="group rounded-lg border border-slate-200 bg-white p-4 transition hover:border-navy-300 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-navy-950">{area.label}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-700">
                    {getWorkflowCountForArea(area.id)} flows
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-700">{area.summary}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-navy-200 bg-navy-950 p-5 text-white lg:border-l lg:border-t-0 sm:p-6">
          <div className="flex items-center gap-2">
            <Layers3 className="h-5 w-5 text-gold-300" />
            <h2 className="text-lg font-semibold">Guided workflows</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-navy-200">
            These are the first workflows the app should make obvious on desktop and mobile.
          </p>
          <div className="mt-5 space-y-3">
            {primaryWorkflows.map((workflow) => (
              <Link
                key={workflow.id}
                href={workflowHref(workflow.routes, activeCaseId)}
                className="block rounded-lg border border-white/10 bg-white/[0.08] p-4 transition hover:border-gold-300/50 hover:bg-white/[0.12]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{workflow.label}</p>
                    <p className="mt-1 text-xs leading-5 text-navy-200">{workflow.intent}</p>
                  </div>
                  <Route className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill>{workflow.outputKind.replaceAll('_', ' ')}</Pill>
                  <Pill>{workflow.tier}</Pill>
                  {workflow.confirmationRequired ? <Pill>review first</Pill> : <Pill>instant</Pill>}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
              <p className="text-xs leading-5 text-emerald-50">
                This preview is flag-gated. It uses existing PRAXIS surfaces and does not retire the current workbench.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase text-navy-100">
      {children}
    </span>
  );
}

function workflowHref(routes: string[], activeCaseId: string): string {
  const route = routes.find((item) => item.startsWith('/app')) ?? '/app/dashboard';
  return route.includes('[caseId]') && !activeCaseId
    ? '/app/workbench'
    : route.replaceAll('[caseId]', activeCaseId).replaceAll('syria-2026', activeCaseId || 'syria-2026');
}
