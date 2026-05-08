'use client';

import { Clock3, Database, GitBranch, Globe2, Route, ShieldCheck, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CaseModule } from '@/types/case-module';
import type { Situation } from '@/types/situation';
import type { WorkbenchGraph } from '@/lib/graph/workbench-case-graph';
import { toMapPoints } from '@/lib/graph/map-adapter';
import { toTimelineItems } from '@/lib/graph/timeline-adapter';
import { useFeatureFlags } from '@/lib/features/client';

interface GraphIntelligencePanelsProps {
  caseModule: CaseModule;
  graph: WorkbenchGraph;
}

interface StakeholderProfile {
  name: string;
  role: string;
  lane: 'party' | 'institution' | 'mediator' | 'external' | 'public' | 'unknown';
  influence: 'high' | 'medium' | 'emerging';
}

export function GraphIntelligencePanels({ caseModule, graph }: GraphIntelligencePanelsProps) {
  const features = useFeatureFlags();
  const cogneeEnabled = features.cognee.enabled;
  const situation = caseModule.situation;
  const timelineItems = toTimelineItems(graph);
  const mapPoints = toMapPoints(graph);
  const stakeholders = situation.actors.map(profileStakeholder);
  const domain = domainLabel(caseModule);

  return (
    <div data-testid="workbench-graph-intelligence" className="space-y-4">
      <section className="rounded-lg border border-navy-200 bg-white p-5 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-navy-950">
              <GitBranch className="h-5 w-5 text-gold-700" />
              <h2 className="text-lg font-semibold">Situation Intelligence</h2>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              The graph tab explains the case as an operating picture: map, timeline, stakeholder roles, policy/conflict anatomy, and review-gated context handoff.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
            <ShieldCheck className="h-4 w-4" />
            {domain}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <InsightMetric label="Mapped nodes" value={String(mapPoints.length)} detail={`${derivedCount(mapPoints)} derived regional anchors`} />
          <InsightMetric label="Timeline events" value={String(timelineItems.length)} detail={timelineRange(timelineItems)} />
          <InsightMetric label="Stakeholders" value={String(stakeholders.length)} detail={stakeholderLaneSummary(stakeholders)} />
          <InsightMetric
            label={cogneeEnabled ? 'Memory path' : 'Context path'}
            value="Review-gated"
            detail={cogneeEnabled ? 'Postgres canonical graph; Cognee candidates stay advisory.' : 'Postgres canonical graph; generated candidates stay advisory.'}
          />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <CaseAnatomyPanel caseModule={caseModule} />
        <SituationMapPanel situation={situation} graph={graph} cogneeEnabled={cogneeEnabled} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <TimelinePanel situation={situation} graph={graph} />
        <StakeholderPanel stakeholders={stakeholders} />
      </div>

      {cogneeEnabled ? <MemoryMarketplacePanel caseModule={caseModule} /> : null}
    </div>
  );
}

function CaseAnatomyPanel({ caseModule }: { caseModule: CaseModule }) {
  const situation = caseModule.situation;
  const domain = domainLabel(caseModule);
  const primaryOntology = situation.primaryOntologyId ?? situation.ontologyId ?? caseModule.manifest.domain;
  const structure = [
    { label: 'Case type', value: caseTypeLabel(situation), detail: 'Used to tune the workbench between policy file, conflict arena, mediation matter, and research brief.' },
    { label: 'Decision question', value: situation.workflowPathLabel ?? situation.userRole, detail: situation.description },
    { label: 'Ontology lens', value: String(primaryOntology), detail: situation.ontologyRationale ?? 'Derived from the case domain and user-adjustable in Ontology.' },
    { label: 'Risk posture', value: `${Math.round(situation.riskScore * 10)}/10`, detail: `Trend: ${situation.escalationTrend}; Glasl: ${situation.glaslStage ?? 'not set'}` },
  ];

  return (
    <SurfacePanel icon={Route} title="Policy / Conflict Anatomy" eyebrow={domain}>
      <div className="space-y-3">
        {structure.map((item) => (
          <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">{item.label}</p>
              <p className="text-sm font-semibold text-navy-950">{item.value}</p>
            </div>
            <p className="mt-2 text-sm leading-5 text-slate-700">{item.detail}</p>
          </div>
        ))}
      </div>
    </SurfacePanel>
  );
}

function SituationMapPanel({ situation, graph, cogneeEnabled }: { situation: Situation; graph: WorkbenchGraph; cogneeEnabled: boolean }) {
  const points = toMapPoints(graph);
  const derived = derivedCount(points);
  const bounds = situation.geoBoundingBox;

  return (
    <SurfacePanel icon={Globe2} title="How The Map Should Work" eyebrow={situation.region}>
      <div className="space-y-3 text-sm leading-5 text-slate-700">
        <p>
          The map is an explanatory projection, not a claim that every actor has verified coordinates. Nodes with coordinates are shown directly; otherwise PRAXIS uses regional schematic anchors so the user can understand the situation geography without inventing evidence.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniStat label="Projected nodes" value={String(points.length)} />
          <MiniStat label="Schematic anchors" value={String(derived)} />
          <MiniStat label="Region" value={situation.region} />
          <MiniStat label="Bounds" value={bounds ? `${bounds.south}/${bounds.west} to ${bounds.north}/${bounds.east}` : 'not specified'} />
        </div>
        <p>
          {cogneeEnabled
            ? 'The next coding target is ingestion of source-level coordinates from receipts and Cognee candidates, with promotion into canonical graph nodes only after review.'
            : 'The next coding target is ingestion of source-level coordinates from receipts and extracted candidates, with promotion into canonical graph nodes only after review.'}
        </p>
      </div>
    </SurfacePanel>
  );
}

function TimelinePanel({ situation, graph }: { situation: Situation; graph: WorkbenchGraph }) {
  const items = toTimelineItems(graph);
  const keyDates = situation.keyDates?.slice(0, 5) ?? [];

  return (
    <SurfacePanel icon={Clock3} title="How The Timeline Should Work" eyebrow={timelineRange(items)}>
      <div className="space-y-3">
        <p className="text-sm leading-5 text-slate-700">
          The timeline merges dated graph nodes, source receipts, truth-layer updates, and case key dates. It should answer what changed, when the assessment changed, and which source or actor created the shift.
        </p>
        <div className="space-y-2">
          {(keyDates.length ? keyDates : items.slice(0, 5).map((item) => ({ date: item.start, label: item.content, significance: 'medium' as const }))).map((item) => (
            <div key={`${item.date}-${item.label}`} className="grid gap-1 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-[110px_minmax(0,1fr)_auto]">
              <p className="font-mono text-xs font-semibold text-navy-900">{formatDate(item.date)}</p>
              <p className="text-sm font-semibold text-navy-950">{item.label}</p>
              <span className="w-fit rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-700">
                {item.significance}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SurfacePanel>
  );
}

function StakeholderPanel({ stakeholders }: { stakeholders: StakeholderProfile[] }) {
  const lanes = laneCounts(stakeholders);

  return (
    <SurfacePanel icon={UsersRound} title="Stakeholder Analysis" eyebrow={stakeholderLaneSummary(stakeholders)}>
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <MiniStat label="Primary parties" value={String(lanes.party ?? 0)} />
          <MiniStat label="Institutions" value={String(lanes.institution ?? 0)} />
          <MiniStat label="External / public" value={String((lanes.external ?? 0) + (lanes.public ?? 0))} />
        </div>
        <div className="grid gap-2">
          {stakeholders.length ? stakeholders.slice(0, 8).map((stakeholder) => (
            <div key={stakeholder.name} className="grid gap-2 rounded-md border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_130px_100px]">
              <div>
                <p className="text-sm font-semibold text-navy-950">{stakeholder.name}</p>
                <p className="text-xs leading-4 text-slate-700">{stakeholder.role}</p>
              </div>
              <span className="w-fit rounded-full bg-navy-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-navy-800">
                {stakeholder.lane}
              </span>
              <span className="w-fit rounded-full bg-gold-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-900">
                {stakeholder.influence}
              </span>
            </div>
          )) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-950">
              No stakeholders have been framed yet. Add actors in Context Studio before running marketplace stakeholder tools.
            </div>
          )}
        </div>
      </div>
    </SurfacePanel>
  );
}

function MemoryMarketplacePanel({ caseModule }: { caseModule: CaseModule }) {
  const claimCoverage = Math.round(caseModule.truthLayers.claim.provenanceCoverage * 100);
  const evidenceCoverage = Math.round(caseModule.truthLayers.evidence.provenanceCoverage * 100);

  return (
    <SurfacePanel icon={Database} title="Cognee, GraphRAG, And Marketplace Handoff" eyebrow="architecture preserved">
      <div className="grid gap-3 md:grid-cols-3">
        <HandoffStep
          title="1. Canonical graph"
          detail={`Postgres remains the source of truth. Claim provenance is ${claimCoverage}% and evidence provenance is ${evidenceCoverage}%.`}
        />
        <HandoffStep
          title="2. Cognee memory"
          detail="Cognee recall and cognify are allowed to create candidates and context, but canonical writes stay review-gated."
        />
        <HandoffStep
          title="3. Tools marketplace"
          detail="Marketplace tools consume the situation frame, graph projection, source receipts, and conversation focus without silently rewriting the case."
        />
      </div>
    </SurfacePanel>
  );
}

function SurfacePanel({
  icon: Icon,
  title,
  eyebrow,
  children,
}: {
  icon: typeof Route;
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-navy-950/5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-800">{eyebrow}</p>
        <div className="mt-1 flex items-center gap-2 text-navy-950">
          <Icon className="h-5 w-5 text-gold-700" />
          <h3 className="text-base font-semibold">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function InsightMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">{label}</p>
      <p className="mt-1 text-xl font-semibold text-navy-950">{value}</p>
      <p className="mt-1 text-sm leading-5 text-slate-700">{detail}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">{label}</p>
      <p className="mt-1 text-sm font-semibold text-navy-950">{value}</p>
    </div>
  );
}

function HandoffStep({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-navy-950">{title}</p>
      <p className="mt-2 text-sm leading-5 text-slate-700">{detail}</p>
    </div>
  );
}

function profileStakeholder(name: string): StakeholderProfile {
  const lower = name.toLowerCase();
  const lane = lower.includes('mediator') || lower.includes('un envoy') || lower.includes('ombuds')
    ? 'mediator'
    : lower.includes('government') || lower.includes('ministry') || lower.includes('un ') || lower.includes('council') || lower.includes('authority')
      ? 'institution'
      : lower.includes('external') || lower.includes('regional') || lower.includes('russia') || lower.includes('turkey') || lower.includes('iran') || lower.includes('us ')
        ? 'external'
        : lower.includes('civil') || lower.includes('community') || lower.includes('public') || lower.includes('media')
          ? 'public'
          : lower.includes('party') || lower.includes('opposition') || lower.includes('coalition') || lower.includes('actor')
            ? 'party'
            : 'unknown';

  const influence = lane === 'institution' || lane === 'party' ? 'high' : lane === 'unknown' ? 'emerging' : 'medium';
  return {
    name,
    lane,
    influence,
    role: roleLabel(lane),
  };
}

function roleLabel(lane: StakeholderProfile['lane']) {
  switch (lane) {
    case 'party':
      return 'Primary party or organized actor in the case frame.';
    case 'institution':
      return 'Institutional stakeholder with mandate, authority, or governance leverage.';
    case 'mediator':
      return 'Facilitation or convening role; should be treated separately from parties.';
    case 'external':
      return 'External or regional stakeholder that may shape incentives or constraints.';
    case 'public':
      return 'Affected community, public narrative, or social constituency.';
    default:
      return 'Actor in scope; refine role, interests, and leverage in Context Studio.';
  }
}

function laneCounts(stakeholders: StakeholderProfile[]) {
  return stakeholders.reduce<Partial<Record<StakeholderProfile['lane'], number>>>((counts, stakeholder) => {
    counts[stakeholder.lane] = (counts[stakeholder.lane] ?? 0) + 1;
    return counts;
  }, {});
}

function stakeholderLaneSummary(stakeholders: StakeholderProfile[]) {
  if (!stakeholders.length) return 'needs actors';
  const counts = laneCounts(stakeholders);
  return `${counts.party ?? 0} parties, ${counts.institution ?? 0} institutions, ${counts.external ?? 0} external`;
}

function caseTypeLabel(situation: Situation) {
  if (situation.workflowPathLabel) return situation.workflowPathLabel;
  if (situation.type === 'political' || situation.domain === 'governance') return 'Policy file';
  if (situation.type === 'civil' || situation.type === 'international') return 'Conflict arena';
  if (situation.userRole === 'mediator' || situation.domain === 'mediation') return 'Mediation matter';
  return 'Structured situation';
}

function domainLabel(caseModule: CaseModule) {
  const situation = caseModule.situation;
  return String(situation.primaryOntologyId ?? situation.ontologyId ?? situation.domain ?? caseModule.manifest.domain ?? 'general');
}

function derivedCount(points: ReturnType<typeof toMapPoints>) {
  return points.filter((point) => point.derived).length;
}

function timelineRange(items: ReturnType<typeof toTimelineItems>) {
  if (!items.length) return 'needs dates';
  const first = items[0];
  const last = items[items.length - 1];
  if (first.start === last.start) return formatDate(first.start);
  return `${formatDate(first.start)} to ${formatDate(last.start)}`;
}

function formatDate(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return 'Not dated';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(parsed));
}
