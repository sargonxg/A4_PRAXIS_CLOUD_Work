'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  Circle,
  Gauge,
  GitBranch,
  Layers3,
  Loader2,
  MessagesSquare,
  PackageOpen,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  TriangleAlert,
  Wrench,
} from 'lucide-react';
import { OnboardingRequiredState } from '@/components/praxis/onboarding-required-state';
import { PraxisLink } from '@/components/shared/praxis-link';
import {
  CONSOLIDATED_TOOLS,
  getSpecializedToolDevelopmentGroups,
  type SpecializedToolDevelopmentGroup,
  type SpecializedToolDevelopmentStatus,
} from '@/lib/constants/consolidated-tools';
import { getToolById, HERO_TOOLS, TOOL_REGISTRY } from '@/lib/constants/tool-registry';
import { useSituationGuard } from '@/hooks/use-situation-guard';
import { useAllToolStatuses, type ToolStatusInfo } from '@/hooks/use-tool-status';
import { getToolContextReadiness } from '@/lib/tools/tool-context-blueprints';
import { getToolPackageActions, type ToolPackageAction } from '@/lib/tools/tool-package-actions';
import { hrefForTool } from '@/lib/tools/tool-navigation';
import {
  getDashboardToolPackageSummaries,
  getToolIdsForPath,
  getToolPathMembership,
  type PraxisToolPathId,
  type ToolPathPackageSummary,
  type ToolPathStage,
  type ToolPathToolTier,
} from '@/lib/tools/tool-path-taxonomy';
import { computeToolPackageReadiness, type ToolPackageReadiness } from '@/lib/tools/tool-package-readiness';
import { cn } from '@/lib/utils/cn';
import type { Situation, ToolDefinition } from '@/types/situation';

type StageFilter = 'all' | ToolPathStage;
type HealthFilter = 'all' | 'ready' | 'needs-output' | 'needs-context' | 'unwired' | 'stale';

interface WorkspaceToolRow {
  tool: ToolDefinition;
  packageIds: PraxisToolPathId[];
  tier: ToolPathToolTier | 'unmapped';
  status?: ToolStatusInfo;
  contextReady: boolean;
  missingFields: string[];
  isWired: boolean;
  href: string;
}

const STAGE_CLASS: Record<ToolPathStage, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  next: 'border-gold-500/30 bg-gold-500/10 text-gold-700',
  future: 'border-slate-200 bg-slate-50 text-navy-500',
};

const TIER_LABEL: Record<WorkspaceToolRow['tier'], string> = {
  core: 'Core',
  primary: 'Primary',
  secondary: 'Secondary',
  specialized: 'Specialist',
  'premium-future': 'Future',
  'hidden-default': 'Hidden',
  unmapped: 'Other',
};

export default function ToolsWorkspacePage() {
  const { needsOnboarding, loading, situation } = useSituationGuard();

  if (needsOnboarding) return <OnboardingRequiredState />;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return <ToolsWorkspace situation={situation ?? null} />;
}

function ToolsWorkspace({ situation }: { situation: Situation | null }) {
  const searchParams = useSearchParams();
  const statuses = useAllToolStatuses(situation?.id ?? null);
  const packages = getDashboardToolPackageSummaries(situation?.workflowPath ?? 'political-officer');
  const showArchive = searchParams.get('show_archive') === '1';
  const registrySurface = showArchive ? TOOL_REGISTRY : HERO_TOOLS;
  const [packageFilter, setPackageFilter] = useState<PraxisToolPathId | 'all' | 'active'>('all');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [query, setQuery] = useState('');

  const readinessByPackage = useMemo(
    () => new Map(packages.map((pkg) => [pkg.id, computeToolPackageReadiness(pkg, situation, statuses)])),
    [packages, situation, statuses],
  );
  const actionsByPackage = useMemo(
    () => new Map(
      packages.map((pkg) => {
        const readiness = readinessByPackage.get(pkg.id);
        return [pkg.id, readiness ? getToolPackageActions(pkg, readiness, situation, statuses) : []];
      }),
    ),
    [packages, readinessByPackage, situation, statuses],
  );

  const activePackageIds = useMemo(
    () => new Set(packages.filter((pkg) => pkg.stage === 'active').map((pkg) => pkg.id)),
    [packages],
  );

  const packageToolIds = useMemo(() => {
    if (packageFilter === 'all') return new Set(registrySurface.map((tool) => tool.id));
    if (packageFilter === 'active') {
      return new Set(
        packages
          .filter((pkg) => pkg.stage === 'active')
          .flatMap((pkg) => getToolIdsForPath(pkg.id)),
      );
    }
    return new Set(getToolIdsForPath(packageFilter, ['core', 'primary', 'secondary', 'specialized', 'premium-future', 'hidden-default']));
  }, [packageFilter, packages, registrySurface]);

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return registrySurface.map((tool) => buildWorkspaceRow(tool, packages, statuses[tool.id], situation))
      .filter((row) => packageToolIds.has(row.tool.id))
      .filter((row) => stageFilter === 'all' || row.packageIds.some((id) => packages.find((pkg) => pkg.id === id)?.stage === stageFilter))
      .filter((row) => matchesHealthFilter(row, healthFilter))
      .filter((row) => {
        if (!normalizedQuery) return true;
        const haystack = [
          row.tool.name,
          row.tool.id,
          row.tool.category,
          row.tool.shortDescription,
          row.tool.description,
          row.tool.frameworks.join(' '),
          row.packageIds.join(' '),
        ].join(' ').toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const aActive = a.packageIds.some((id) => activePackageIds.has(id));
        const bActive = b.packageIds.some((id) => activePackageIds.has(id));
        if (aActive !== bActive) return aActive ? -1 : 1;
        const tierDelta = tierRank(a.tier) - tierRank(b.tier);
        if (tierDelta !== 0) return tierDelta;
        return a.tool.name.localeCompare(b.tool.name);
      });
  }, [activePackageIds, healthFilter, packageToolIds, packages, query, registrySurface, situation, stageFilter, statuses]);

  const activePackages = packages.filter((pkg) => pkg.stage === 'active');
  const visiblePackages = packages.filter((pkg) => stageFilter === 'all' || pkg.stage === stageFilter);
  const readyCount = rows.filter((row) => row.status?.health === 'green').length;
  const specializedDevelopmentGroups = getSpecializedToolDevelopmentGroups();

  return (
    <div className="flex flex-col gap-5 p-6">
      <header className="flex flex-col gap-3 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-navy-500">Workspace</p>
            <h1 className="text-2xl font-semibold text-navy-900">Tools</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-navy-600">
              Package readiness, per-tool health, required context, and route wiring for the active PRAXIS workflow.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-right">
            <Metric label="Visible" value={rows.length.toString()} />
            <Metric label="Ready" value={readyCount.toString()} />
            <Metric label={showArchive ? 'Archive' : 'Surface'} value={showArchive ? '55 tools' : '12 hero'} />
          </div>
        </div>
        {!showArchive ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-navy-600">
            Showing the opinionated 12-tool PRAXIS surface. Archived specialist tools stay routable and can be reviewed with{' '}
            <PraxisLink href="/tools?show_archive=1" className="font-semibold text-diplomatic-blue hover:underline">
              show_archive=1
            </PraxisLink>
            .
          </div>
        ) : (
          <div className="rounded-md border border-gold-200 bg-gold-50 px-3 py-2 text-xs text-gold-800">
            Archive view enabled. These tools are preserved for specialist development and route compatibility, but hidden from default navigation.
          </div>
        )}
      </header>

      <DemoRunway rows={rows} />

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {activePackages.map((pkg) => (
          <PackageOverview
            key={pkg.id}
            pkg={pkg}
            readiness={readinessByPackage.get(pkg.id)}
            actions={actionsByPackage.get(pkg.id) ?? []}
          />
        ))}
      </section>

      <SpecializedDevelopmentSection groups={specializedDevelopmentGroups} />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-diplomatic-blue" />
            <h2 className="text-sm font-semibold text-navy-900">Package filters</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(220px,1fr)_160px_180px] lg:w-[720px]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-navy-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools, frameworks, outputs"
                aria-label="Search tools"
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm text-navy-900 outline-none focus:border-diplomatic-blue"
              />
            </label>
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value as StageFilter)}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-navy-700 outline-none focus:border-diplomatic-blue"
              aria-label="Filter by package stage"
            >
              <option value="all">All stages</option>
              <option value="active">Active</option>
              <option value="next">Next</option>
              <option value="future">Future</option>
            </select>
            <select
              value={healthFilter}
              onChange={(event) => setHealthFilter(event.target.value as HealthFilter)}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-navy-700 outline-none focus:border-diplomatic-blue"
              aria-label="Filter by tool health"
            >
              <option value="all">All health</option>
              <option value="ready">Ready</option>
              <option value="needs-output">Needs output</option>
              <option value="needs-context">Needs context</option>
              <option value="unwired">Unwired</option>
              <option value="stale">Stale</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <FilterButton active={packageFilter === 'active'} onClick={() => setPackageFilter('active')}>
            Active packages
          </FilterButton>
          <FilterButton active={packageFilter === 'all'} onClick={() => setPackageFilter('all')}>
            All tools
          </FilterButton>
          {packages.map((pkg) => (
            <FilterButton key={pkg.id} active={packageFilter === pkg.id} onClick={() => setPackageFilter(pkg.id)}>
              {pkg.shortLabel}
            </FilterButton>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-[330px_minmax(0,1fr)]">
        <div className="space-y-3">
          {visiblePackages.map((pkg) => (
            <PackageListItem
              key={pkg.id}
              pkg={pkg}
              readiness={readinessByPackage.get(pkg.id)}
              actions={actionsByPackage.get(pkg.id) ?? []}
              selected={packageFilter === pkg.id}
              onSelect={() => setPackageFilter(pkg.id)}
            />
          ))}
        </div>

        <div className="space-y-2">
          {rows.map((row) => (
            <ToolRow key={row.tool.id} row={row} packages={packages} />
          ))}
          {!rows.length ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <PackageOpen className="mx-auto h-6 w-6 text-navy-400" />
              <p className="mt-2 text-sm font-semibold text-navy-900">No tools match these filters</p>
              <p className="mt-1 text-xs text-navy-500">Clear search or broaden the package and health filters.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DemoRunway({ rows }: { rows: WorkspaceToolRow[] }) {
  const rowById = new Map(rows.map((row) => [row.tool.id, row]));
  const anchors = HERO_TOOLS.map((tool) => {
    const row = rowById.get(tool.id);
    return { tool, row };
  });
  const wiredCount = anchors.filter((item) => item.row?.isWired).length;
  const contextReadyCount = anchors.filter((item) => item.row?.contextReady).length;
  const total = anchors.length;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-diplomatic-blue/5 shadow-sm shadow-navy-950/5">
      <div className="grid gap-0 xl:grid-cols-[0.84fr_1.16fr]">
        <div className="border-b border-slate-200 p-4 xl:border-b-0 xl:border-r">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold-600" />
                <h2 className="text-sm font-semibold text-navy-900">Live demo runway</h2>
              </div>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-navy-600">
                Open the 12-hero operating loop in order: build context, collect evidence, maintain the graph, summon the boardroom, and generate decision-ready policy products.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {wiredCount}/{total} wired
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <RunwayMetric label="Context-ready" value={`${contextReadyCount}/${total}`} />
            <RunwayMetric label="AI/data routes" value={`${wiredCount}/${total}`} />
            <RunwayMetric label="Specialist labs" value={getSpecializedToolDevelopmentGroups().length.toString()} />
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white/80 p-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-diplomatic-blue" />
              <p className="text-xs font-semibold text-navy-900">Demo story to narrate live</p>
            </div>
            <ol className="mt-2 space-y-1.5 text-[11px] leading-snug text-navy-600">
              <li>1. Context Builder repairs the situation file before spend.</li>
              <li>2. Research, Executive Intelligence, and Graph tools expose source-grounded structure.</li>
              <li>3. Boardroom, Scenarios, Negotiation, and Treaty tools challenge the policy path.</li>
              <li>4. Briefing and Policy Memo turn that context into cited output.</li>
            </ol>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
            {anchors.map(({ tool, row }, index) => (
              <PraxisLink
                key={tool.id}
                href={hrefForTool(tool.id)}
                className="group flex min-h-[142px] flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-diplomatic-blue/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-diplomatic-blue/8 text-diplomatic-blue">
                      {runwayIcon(tool.id)}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-navy-500">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-2 text-xs font-semibold text-navy-900 group-hover:text-diplomatic-blue">{tool.name}</h3>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-navy-500">{tool.shortDescription}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                    {row?.isWired ? <CheckCircle2 className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
                    {row?.isWired ? 'Wired' : 'Check'}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-navy-400 transition group-hover:translate-x-0.5 group-hover:text-diplomatic-blue" />
                </div>
              </PraxisLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecializedDevelopmentSection({ groups }: { groups: SpecializedToolDevelopmentGroup[] }) {
  const consolidatedLabels = new Map(CONSOLIDATED_TOOLS.map((tool) => [tool.id, tool.label]));

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-diplomatic-blue" />
            <h2 className="text-sm font-semibold text-navy-900">Specialized tools in development</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-navy-600">
            These specialist pages stay available, but they sit behind the 12 hero tools so users start from a reliable workflow and graduate into narrower capabilities when the case calls for it.
          </p>
        </div>
        <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-1 text-[11px] font-semibold text-gold-700">
          Marked outside the 12 heroes
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-5">
        {groups.map((group) => {
          const toolNames = group.toolIds.map((toolId) => getToolById(toolId)?.name ?? prettyToolName(toolId));
          return (
            <article key={group.id} className="rounded-md border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-navy-900">{group.label}</h3>
                  <p className="mt-0.5 text-[11px] text-navy-500">
                    Feeds {consolidatedLabels.get(group.consolidatedToolId) ?? prettyToolName(group.consolidatedToolId)}
                  </p>
                </div>
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', developmentStatusClass(group.status))}>
                  {developmentStatusLabel(group.status)}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-[11px] leading-snug text-navy-600">{group.nextLiveAiUpgrade}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {group.userCases.map((userCase) => (
                  <span key={userCase} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-navy-500">
                    {userCase}
                  </span>
                ))}
              </div>
              <p className="mt-3 line-clamp-2 text-[11px] text-navy-500">{toolNames.slice(0, 5).join(' + ')}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RunwayMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white/80 px-3 py-2">
      <p className="font-mono text-lg font-semibold text-navy-900">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-navy-500">{label}</p>
    </div>
  );
}

function runwayIcon(surfaceId: string): ReactNode {
  const className = 'h-4 w-4';
  if (surfaceId === 'dashboard') return <Gauge className={className} />;
  if (surfaceId === 'context-builder') return <Target className={className} />;
  if (surfaceId === 'situation-intelligence') return <Sparkles className={className} />;
  if (surfaceId === 'source-scout') return <Search className={className} />;
  if (surfaceId === 'graphops') return <Wrench className={className} />;
  if (surfaceId === 'conflict-graph') return <Layers3 className={className} />;
  if (surfaceId === 'brainstorming-table') return <Bot className={className} />;
  if (surfaceId === 'briefing') return <BookOpen className={className} />;
  if (surfaceId === 'policy-memo') return <PackageOpen className={className} />;
  if (surfaceId === 'scenarios') return <GitBranch className={className} />;
  if (surfaceId === 'negotiation-prep') return <MessagesSquare className={className} />;
  return <ArrowRight className={className} />;
}

function PackageOverview({
  pkg,
  readiness,
  actions,
}: {
  pkg: ToolPathPackageSummary;
  readiness?: ToolPackageReadiness;
  actions: ToolPackageAction[];
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-diplomatic-blue" />
            <h2 className="text-sm font-semibold text-navy-900">{pkg.label}</h2>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-navy-600">{pkg.productPromise}</p>
        </div>
        <StageBadge stage={pkg.stage} label={pkg.statusLabel} />
      </div>
      {readiness ? <ReadinessSummary readiness={readiness} /> : null}
      <PackageActions actions={actions} />
    </article>
  );
}

function PackageListItem({
  pkg,
  readiness,
  actions,
  selected,
  onSelect,
}: {
  pkg: ToolPathPackageSummary;
  readiness?: ToolPackageReadiness;
  actions: ToolPackageAction[];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg border bg-white p-3 text-left shadow-sm shadow-navy-950/5 transition-colors hover:border-diplomatic-blue/40',
        selected ? 'border-diplomatic-blue/50 bg-diplomatic-blue/5' : 'border-slate-200',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-navy-900">{pkg.shortLabel}</h3>
          <p className="mt-0.5 text-[11px] text-navy-500">{pkg.toolCount} mapped tools</p>
        </div>
        <StageBadge stage={pkg.stage} label={pkg.statusLabel} />
      </div>
      {readiness ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-navy-500">
            <span>{readiness.counts.generated}/{readiness.assessedToolIds.length} saved</span>
            <span className={cn('rounded-full px-2 py-0.5 font-semibold', readinessClass(readiness.state))}>
              {readiness.score}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={cn('h-full rounded-full', readinessBarClass(readiness.state))} style={{ width: `${readiness.score}%` }} />
          </div>
        </div>
      ) : null}
      {actions[0] ? (
        <div className="mt-2 rounded-md bg-white/70 px-2 py-1.5 text-[11px] text-navy-600">
          Next: <span className="font-semibold text-navy-900">{actions[0].label}</span>
        </div>
      ) : null}
    </button>
  );
}

function ToolRow({ row, packages }: { row: WorkspaceToolRow; packages: ToolPathPackageSummary[] }) {
  const stageLabels = row.packageIds
    .map((id) => packages.find((pkg) => pkg.id === id))
    .filter(Boolean) as ToolPathPackageSummary[];
  const status = row.status;
  const health = status?.health ?? 'red';
  const needsAttention = !row.contextReady || !row.isWired || health !== 'green' || Boolean(status?.isStale);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-navy-950/5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <HealthDot health={health} stale={status?.isStale} />
            <h3 className="text-sm font-semibold text-navy-900">{row.tool.name}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy-500">
              {TIER_LABEL[row.tier]}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-navy-500">
              {row.tool.category}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 max-w-3xl text-xs leading-relaxed text-navy-600">
            {row.tool.shortDescription ?? row.tool.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {stageLabels.slice(0, 3).map((pkg) => (
              <span key={pkg.id} className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', STAGE_CLASS[pkg.stage])}>
                {pkg.shortLabel}
              </span>
            ))}
            {stageLabels.length > 3 ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-navy-500">
                +{stageLabels.length - 3}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid min-w-[260px] grid-cols-2 gap-2 text-[11px] text-navy-600">
          <StatusPill ok={row.contextReady} label={row.contextReady ? 'Context ready' : 'Needs context'} />
          <StatusPill ok={row.isWired} label={row.isWired ? 'Route wired' : 'No route'} />
          <StatusPill ok={Boolean(status?.generatedAt)} label={status?.generatedAt ? 'Saved output' : 'No output'} />
          <StatusPill ok={!status?.isStale} label={status?.isStale ? 'Stale' : 'Freshness ok'} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="min-w-0 text-[11px] text-navy-500">
          {needsAttention ? (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <TriangleAlert className="h-3.5 w-3.5" />
              {attentionText(row)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ready for the active workflow.
            </span>
          )}
        </div>
        <PraxisLink
          href={row.href}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-navy-700 hover:bg-slate-50"
        >
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </PraxisLink>
      </div>
    </article>
  );
}

function ReadinessSummary({ readiness }: { readiness: ToolPackageReadiness }) {
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Gauge className="h-3.5 w-3.5 text-diplomatic-blue" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-500">Readiness</p>
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
        <span>{readiness.counts.contextReady}/{readiness.counts.contextTotal} context</span>
        <span>{readiness.counts.aiWired}/{readiness.counts.aiTotal} wired</span>
        <span>{readiness.counts.stale} stale</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-amber-700">{readiness.nextAction}</p>
      {readiness.warnings.length ? (
        <div className="mt-2 flex flex-col gap-1">
          {readiness.warnings.slice(0, 2).map((warning) => (
            <p key={`${warning.type}:${warning.message}`} className={cn('text-[11px] leading-snug', warning.severity === 'critical' ? 'text-red-700' : 'text-amber-700')}>
              {warning.message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PackageActions({ actions }: { actions: ToolPackageAction[] }) {
  if (!actions.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
      {actions.slice(0, 3).map((action, index) => (
        <PraxisLink
          key={action.id}
          href={action.href}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium',
            index === 0
              ? 'border border-diplomatic-blue bg-diplomatic-blue text-white hover:bg-diplomatic-blue/90'
              : 'border border-slate-200 text-navy-700 hover:bg-slate-50',
          )}
          title={action.description}
        >
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </PraxisLink>
      ))}
    </div>
  );
}

function developmentStatusLabel(status: SpecializedToolDevelopmentStatus): string {
  if (status === 'active-support') return 'Support';
  if (status === 'in-development') return 'Dev';
  return 'Future';
}

function developmentStatusClass(status: SpecializedToolDevelopmentStatus): string {
  if (status === 'active-support') return 'bg-emerald-100 text-emerald-700';
  if (status === 'in-development') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-navy-500';
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-navy-900">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-navy-500">{label}</p>
    </div>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-diplomatic-blue bg-diplomatic-blue text-white'
          : 'border-slate-200 bg-white text-navy-600 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  );
}

function StageBadge({ stage, label }: { stage: ToolPathStage; label: string }) {
  return (
    <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold', STAGE_CLASS[stage])}>
      {label}
    </span>
  );
}

function HealthDot({ health, stale }: { health: ToolStatusInfo['health']; stale?: boolean }) {
  if (stale) return <Circle className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />;
  if (health === 'green') return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />;
  if (health === 'yellow') return <Circle className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />;
  return <Circle className="h-3.5 w-3.5 shrink-0 fill-slate-300 text-slate-300" />;
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-1', ok ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
      {label}
    </span>
  );
}

function buildWorkspaceRow(
  tool: ToolDefinition,
  packages: ToolPathPackageSummary[],
  status: ToolStatusInfo | undefined,
  situation: Situation | null,
): WorkspaceToolRow {
  const memberships = getToolPathMembership(tool.id);
  const packageIds = memberships.map((membership) => membership.pathId);
  const tier = preferredTier(memberships.map((membership) => membership.tier));
  const context = getToolContextReadiness(tool.id, situation);

  return {
    tool,
    packageIds: packageIds.length ? packageIds : packages.filter((pkg) => pkg.coreToolIds.includes(tool.id)).map((pkg) => pkg.id),
    tier,
    status,
    contextReady: context.ready,
    missingFields: context.missingSituationFields,
    isWired: Boolean(tool.aiRoute),
    href: hrefForTool(tool.id),
  };
}

function preferredTier(tiers: ToolPathToolTier[]): WorkspaceToolRow['tier'] {
  const ordered: ToolPathToolTier[] = ['core', 'primary', 'secondary', 'specialized', 'premium-future', 'hidden-default'];
  return ordered.find((tier) => tiers.includes(tier)) ?? 'unmapped';
}

function matchesHealthFilter(row: WorkspaceToolRow, filter: HealthFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'ready') return row.status?.health === 'green' && row.contextReady && row.isWired && !row.status?.isStale;
  if (filter === 'needs-output') return !row.status?.generatedAt;
  if (filter === 'needs-context') return !row.contextReady;
  if (filter === 'unwired') return !row.isWired;
  if (filter === 'stale') return Boolean(row.status?.isStale);
  return true;
}

function tierRank(tier: WorkspaceToolRow['tier']): number {
  const order: WorkspaceToolRow['tier'][] = ['core', 'primary', 'secondary', 'specialized', 'premium-future', 'hidden-default', 'unmapped'];
  return order.indexOf(tier);
}

function attentionText(row: WorkspaceToolRow): string {
  if (!row.isWired) return `Wire an AI or data route for ${row.tool.name}.`;
  if (!row.contextReady) {
    const field = row.missingFields[0];
    return field ? `Add ${field} before relying on ${row.tool.name}.` : `Add required context for ${row.tool.name}.`;
  }
  if (!row.status?.generatedAt) return `Run ${row.tool.name} to create a saved output.`;
  if (row.status?.isStale) return `Refresh ${row.tool.name}; saved output is stale.`;
  if (row.status?.health !== 'green') return `Review ${row.tool.name} before using it in this workflow.`;
  return `Review ${row.tool.name}.`;
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

function prettyToolName(id: string): string {
  return id
    .split('-')
    .map((word) => (word[0]?.toUpperCase() ?? '') + word.slice(1))
    .join(' ');
}
