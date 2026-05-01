'use client';

import { ArrowRight, CheckCircle2, Gauge, Layers3, PackageOpen } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { useAllToolStatuses } from '@/hooks/use-tool-status';
import { getToolById } from '@/lib/constants/tool-registry';
import { CUSTOMIZABLE_SIDEBAR_TOOLS } from '@/lib/navigation/tool-preferences';
import { computeToolPackageReadiness, type ToolPackageReadiness } from '@/lib/tools/tool-package-readiness';
import {
  getDashboardToolPackageSummaries,
  type ToolPathPackageSummary,
  type ToolPathStage,
} from '@/lib/tools/tool-path-taxonomy';
import { cn } from '@/lib/utils/cn';
import type { Situation } from '@/types/situation';

interface ToolPackagesPanelProps {
  situation: Situation;
}

const TOOL_HREF_OVERRIDES: Record<string, string> = {
  assistant: '/assistant',
  graphops: '/graphops',
  'report-studio': '/reports',
  'situation-intelligence': '/dashboard',
  'sources-library': '/sources',
};

const STAGE_CLASS: Record<ToolPathStage, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  next: 'border-gold-500/30 bg-gold-500/10 text-gold-700',
  future: 'border-slate-200 bg-slate-50 text-navy-500',
};

export function ToolPackagesPanel({ situation }: ToolPackagesPanelProps) {
  const statuses = useAllToolStatuses(situation.id);
  const packages = getDashboardToolPackageSummaries(situation.workflowPath);
  const corePackage = packages.find((pkg) => pkg.id === 'generic-core');
  const activeSpecialist =
    packages.find((pkg) => pkg.id === situation.workflowPath && pkg.id !== 'generic-core') ??
    packages.find((pkg) => pkg.id === 'political-officer');
  const visiblePackages = packages.filter((pkg) => pkg.id !== corePackage?.id && pkg.id !== activeSpecialist?.id);
  const readinessByPackage = new Map(
    packages.map((pkg) => [pkg.id, computeToolPackageReadiness(pkg, situation, statuses)]),
  );

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-diplomatic-blue" />
            <h2 className="text-sm font-semibold text-navy-900">Tool packages</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-navy-600">
            PRAXIS runs a generic context workspace for every situation, then layers specialist packages on top. This situation is currently optimized for {activeSpecialist?.shortLabel ?? 'conflict analysis'}.
          </p>
        </div>
        <PraxisLink
          href="/settings/preferences"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50"
        >
          Manage tools
          <ArrowRight className="h-3.5 w-3.5" />
        </PraxisLink>
      </header>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {corePackage ? (
          <PackageCard pkg={corePackage} emphasis="Core workspace" readiness={readinessByPackage.get(corePackage.id)} />
        ) : null}
        {activeSpecialist ? (
          <PackageCard pkg={activeSpecialist} emphasis="Active specialist path" readiness={readinessByPackage.get(activeSpecialist.id)} />
        ) : null}
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-500">Additional packages</h3>
          <span className="text-[11px] text-navy-500">Can be activated as product paths mature</span>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {visiblePackages.slice(0, 9).map((pkg) => (
            <CompactPackage key={pkg.id} pkg={pkg} readiness={readinessByPackage.get(pkg.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PackageCard({ pkg, emphasis, readiness }: { pkg: ToolPathPackageSummary; emphasis: string; readiness?: ToolPackageReadiness }) {
  const primaryTools = pkg.primaryToolIds.slice(0, 6);

  return (
    <article className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">{emphasis}</p>
          <h3 className="mt-1 text-sm font-semibold text-navy-900">{pkg.label}</h3>
        </div>
        <StageBadge stage={pkg.stage} label={pkg.statusLabel} />
      </div>
      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-navy-600">{pkg.productPromise}</p>

      {readiness ? <ReadinessStrip readiness={readiness} /> : null}

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_190px]">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-navy-500">Primary tools</p>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {primaryTools.map((toolId) => (
              <ToolLink key={toolId} toolId={toolId} />
            ))}
          </div>
        </div>

        <div className="rounded border border-slate-200 bg-white p-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Outputs</p>
          <ul className="mt-1 space-y-1">
            {pkg.deliverables.slice(0, 4).map((deliverable) => (
              <li key={deliverable} className="flex gap-1.5 text-[11px] leading-snug text-navy-600">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                <span>{deliverable}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function CompactPackage({ pkg, readiness }: { pkg: ToolPathPackageSummary; readiness?: ToolPackageReadiness }) {
  const tools = pkg.primaryToolIds.slice(0, 3).map((toolId) => getToolById(toolId)?.name ?? prettyToolName(toolId));

  return (
    <article className="rounded-md border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="truncate text-xs font-semibold text-navy-900">{pkg.shortLabel}</h4>
          <p className="mt-0.5 text-[11px] text-navy-500">{pkg.toolCount} tools mapped</p>
        </div>
        <StageBadge stage={pkg.stage} label={pkg.statusLabel} />
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-navy-600">{pkg.purpose}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="truncate text-[11px] text-navy-500">{tools.join(' + ')}</p>
        {readiness ? (
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', readinessClass(readiness.state))}>
            {readiness.score}%
          </span>
        ) : null}
      </div>
    </article>
  );
}

function ReadinessStrip({ readiness }: { readiness: ToolPackageReadiness }) {
  return (
    <div className="mt-3 rounded border border-slate-200 bg-white p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-diplomatic-blue" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Package readiness</p>
        </div>
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', readinessClass(readiness.state))}>
          {readiness.score}%
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full', readinessBarClass(readiness.state))} style={{ width: `${readiness.score}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] text-navy-500 sm:grid-cols-4">
        <span>{readiness.counts.generated}/{readiness.assessedToolIds.length} saved</span>
        <span>{readiness.counts.contextReady}/{readiness.counts.contextTotal} context-ready</span>
        <span>{readiness.counts.aiWired}/{readiness.counts.aiTotal} wired</span>
        <span>{readiness.counts.stale} stale</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-amber-700">{readiness.nextAction}</p>
    </div>
  );
}

function ToolLink({ toolId }: { toolId: string }) {
  const tool = getToolById(toolId);

  return (
    <PraxisLink
      href={hrefForTool(toolId)}
      className="group flex min-w-0 items-start gap-2 rounded bg-white px-2 py-1.5 text-xs hover:bg-slate-100"
    >
      <PackageOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-diplomatic-blue/80" />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-navy-900 group-hover:text-diplomatic-blue">
          {tool?.name ?? prettyToolName(toolId)}
        </span>
        <span className="line-clamp-1 text-[11px] text-navy-500">
          {tool?.shortDescription ?? 'Situation-specific context tool'}
        </span>
      </span>
    </PraxisLink>
  );
}

function StageBadge({ stage, label }: { stage: ToolPathStage; label: string }) {
  return (
    <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold', STAGE_CLASS[stage])}>
      {label}
    </span>
  );
}

function readinessClass(state: ToolPackageReadiness['state']): string {
  if (state === 'green') return 'bg-emerald-100 text-emerald-700';
  if (state === 'yellow') return 'bg-amber-100 text-amber-700';
  if (state === 'red') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-navy-500';
}

function readinessBarClass(state: ToolPackageReadiness['state']): string {
  if (state === 'green') return 'bg-emerald-500';
  if (state === 'yellow') return 'bg-amber-500';
  if (state === 'red') return 'bg-red-500';
  return 'bg-slate-400';
}

function hrefForTool(toolId: string): string {
  if (TOOL_HREF_OVERRIDES[toolId]) return TOOL_HREF_OVERRIDES[toolId];
  return CUSTOMIZABLE_SIDEBAR_TOOLS.find((tool) => tool.toolId === toolId)?.href ?? `/${toolId}`;
}

function prettyToolName(id: string): string {
  return id
    .split('-')
    .map((word) => (word[0]?.toUpperCase() ?? '') + word.slice(1))
    .join(' ');
}
