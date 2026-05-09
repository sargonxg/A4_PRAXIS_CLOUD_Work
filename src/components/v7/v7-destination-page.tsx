'use client';

import Link from 'next/link';
import { ArrowRight, Bot, CheckCircle2, Lock, Sparkles } from 'lucide-react';

import type { ProductExperienceAreaId } from '@/lib/product/experience-map';
import { PRODUCT_EXPERIENCE_AREAS, getProductExperienceArea } from '@/lib/product/experience-map';
import { AGENTIC_WORKFLOWS } from '@/lib/agentic-workflows/registry';
import { useFeatureFlags } from '@/lib/features/client';
import { useSituationStore } from '@/stores/situation-store';

interface V7DestinationPageProps {
  areaId: ProductExperienceAreaId;
}

const areaFallbacks: Record<ProductExperienceAreaId, string> = {
  home: '/app/dashboard',
  ask: '/app/dashboard#ask-praxis',
  cores: '/app/workbench',
  outputs: '/app/workbench/syria-2026?openChapter=draft',
};

export function V7DestinationPage({ areaId }: V7DestinationPageProps) {
  const features = useFeatureFlags();
  const situations = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const activeCaseId = activeSituation?.id ?? situations[0]?.id;
  const activeCaseName = activeSituation?.name ?? situations[0]?.name ?? 'No active Situation';
  const area = getProductExperienceArea(areaId);
  const workflows = AGENTIC_WORKFLOWS.filter((workflow) => workflow.primaryArea === areaId);
  const siblingAreas = PRODUCT_EXPERIENCE_AREAS.filter((item) => item.id !== areaId);
  const currentSurfaceHref = activeCaseId
    ? areaFallbacks[areaId].replaceAll('syria-2026', activeCaseId)
    : '/app/workbench';

  return (
    <div className="space-y-5" data-testid={`v7-destination-${areaId}`}>
      <section className="rounded-lg border border-navy-200 bg-white p-5 shadow-sm shadow-navy-950/5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50 px-3 py-1 text-xs font-semibold uppercase text-gold-800">
              {features.praxisV7.enabled ? <Sparkles className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {features.praxisV7.enabled ? 'v7 preview enabled' : 'v7 preview route'}
            </p>
            <h1 className="mt-4 text-2xl font-semibold text-navy-950 sm:text-3xl">{area.label}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">{area.summary}</p>
            <p className="mt-2 text-xs font-semibold uppercase text-slate-700">Active: {activeCaseName}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={currentSurfaceHref}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Open current surface
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-praxis-chat'))}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gold-300 bg-white px-4 py-2 text-sm font-semibold text-gold-800 hover:bg-gold-50"
            >
              <Bot className="h-4 w-4" />
              Ask PRAXIS
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.55fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gold-700">Guided work</p>
              <h2 className="mt-1 text-lg font-semibold text-navy-950">What PRAXIS should help with here.</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {workflows.length} workflows
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(workflows.length ? workflows : AGENTIC_WORKFLOWS.slice(0, 3)).map((workflow) => (
              <Link
                key={workflow.id}
                href={workflowHref(workflow.routes, activeCaseId)}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-navy-300 hover:bg-white"
              >
                <p className="text-sm font-semibold text-navy-950">{workflow.label}</p>
                <p className="mt-2 text-xs leading-5 text-slate-700">{workflow.intent}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill>{workflow.outputKind.replaceAll('_', ' ')}</Pill>
                  <Pill>{workflow.tier}</Pill>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
          <p className="text-xs font-semibold uppercase text-gold-700">Navigation</p>
          <h2 className="mt-1 text-lg font-semibold text-navy-950">Four simple places.</h2>
          <div className="mt-4 space-y-2">
            {siblingAreas.map((item) => (
              <Link
                key={item.id}
                href={`/app/${item.id === 'home' ? 'home' : item.id}`}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-navy-300 hover:bg-white"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                <span>
                  <span className="block text-sm font-semibold text-navy-950">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-700">{item.summary}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function workflowHref(routes: string[], activeCaseId: string | undefined): string {
  const route = routes.find((item) => item.startsWith('/app')) ?? areaFallbacks.home;
  const caseId = activeCaseId ?? '';
  return route.includes('[caseId]') && !caseId
    ? '/app/workbench'
    : route.replaceAll('[caseId]', caseId).replaceAll('syria-2026', caseId || 'syria-2026');
}

function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase text-slate-700">
      {children}
    </span>
  );
}
