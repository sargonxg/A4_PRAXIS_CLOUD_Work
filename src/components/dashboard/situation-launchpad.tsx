'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Brain, Database, FileText, Gauge, Network, ShieldCheck, Users } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { getPolicyWorkflowPath } from '@/lib/constants/policy-workflow-paths';
import { getToolById } from '@/lib/constants/tool-registry';
import { getToolContextBlueprint, getToolContextReadiness } from '@/lib/tools/tool-context-blueprints';
import { computeSituationContextHealth, type ContextHealthState } from '@/lib/context/situation-context-health';
import type { GraphOpsSummary } from '@/lib/graph/graphops';
import { cn } from '@/lib/utils/cn';
import type { Situation } from '@/types/situation';

interface SituationLaunchpadProps {
  situation: Situation;
}

const TOOL_HREFS: Record<string, string> = {
  dashboard: '/dashboard',
  'actor-profiles': '/actors',
  'deep-search-agent': '/deep-search-agent',
  'brainstorming-table': '/brainstorming-table',
  'source-scout': '/source-scout',
  'treaty-analyzer': '/treaty-analyzer',
  scenario: '/scenarios',
  'red-team-review': '/brainstorming-table',
};

export function SituationLaunchpad({ situation }: SituationLaunchpadProps) {
  const path = getPolicyWorkflowPath(situation.workflowPath);
  const readiness = buildReadiness(situation);
  const nextActions = buildNextActions(situation);
  const toolIds = path?.firstToolIds ?? ['dashboard', 'source-scout', 'brainstorming-table', 'briefing', 'red-team-review'];
  const contextBackbone = buildContextBackbone(toolIds, situation);
  const contextHealth = computeSituationContextHealth({
    situation,
    expectedToolIds: toolIds,
    profileRequired: false,
  });

  return (
    <section className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Case-file launchpad</p>
            <h2 className="mt-1 text-base font-semibold text-navy-900">
              {path?.label ?? 'Situation operating sequence'}
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-navy-600">
              {path?.description ??
                'Build a defensible case file: add evidence, run source discovery, convene experts, and turn the output into a briefing.'}
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Readiness</p>
            <p className="text-lg font-semibold text-navy-900">{readiness.score}%</p>
          </div>
          <div className={cn('rounded-md border px-3 py-2 text-right', healthClass(contextHealth.state))}>
            <p className="text-[10px] font-semibold uppercase tracking-wider">Context health</p>
            <p className="text-lg font-semibold">{contextHealth.score}%</p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {readiness.items.map((item) => (
            <div key={item.label} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={item.done ? 'text-emerald-600' : 'text-amber-600'}>{item.icon}</span>
                <p className="text-xs font-semibold text-navy-800">{item.label}</p>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-navy-500">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy-400">Next best actions</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {nextActions.map((action) => (
              <PraxisLink
                key={action.href}
                href={action.href}
                className="group rounded-md border border-slate-200 px-3 py-2 text-left transition hover:border-diplomatic-blue/40 hover:bg-diplomatic-blue/5"
              >
                <span className="flex items-center justify-between gap-2 text-xs font-semibold text-navy-900 group-hover:text-diplomatic-blue">
                  {action.label}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-navy-500">{action.detail}</span>
              </PraxisLink>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm shadow-navy-950/5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">First deliverables</p>
        <div className="mt-3 space-y-2">
          {toolIds.slice(0, 5).map((toolId) => {
            const tool = getToolById(toolId);
            return (
              <PraxisLink
                key={toolId}
                href={TOOL_HREFS[toolId] ?? `/${toolId}`}
                className="block rounded-md border border-slate-200 px-3 py-2 transition hover:border-gold-500/40 hover:bg-gold-500/5"
              >
                <p className="text-xs font-semibold text-navy-900">{tool?.name ?? prettyToolName(toolId)}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-navy-500">
                  {tool?.shortDescription ?? 'Generate a situation-specific PRAXIS output.'}
                </p>
              </PraxisLink>
            );
          })}
        </div>
        {path?.deliverables?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {path.deliverables.map((deliverable) => (
              <span key={deliverable} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-navy-600">
                {deliverable}
              </span>
            ))}
          </div>
        ) : null}
        {path ? (
          <div className="mt-4 rounded-md border border-diplomatic-blue/15 bg-diplomatic-blue/5 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-diplomatic-blue">Workflow playbook</p>
            <p className="mt-1 text-xs font-semibold text-navy-900">{path.paidOutput}</p>
            <p className="mt-1 text-[11px] leading-snug text-navy-600">{path.firstRunQuestion}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {path.requiredInputs.slice(0, 5).map((input) => (
                <span key={input} className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-medium text-navy-600">
                  {input}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-4 border-t border-slate-200 pt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
              <Database className="h-3.5 w-3.5" />
              Context backbone
            </p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-navy-600">
              {contextBackbone.readyTools}/{contextBackbone.totalTools} ready
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <BackboneMetric icon={<Network className="h-3 w-3" />} label="Graph" value={String(contextBackbone.graphTools)} />
            <BackboneMetric icon={<FileText className="h-3 w-3" />} label="Docs" value={String(contextBackbone.documentTools)} />
            <BackboneMetric icon={<ShieldCheck className="h-3 w-3" />} label="Evidence" value={String(contextBackbone.provenanceTools)} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {contextBackbone.layers.slice(0, 6).map((layer) => (
              <span key={layer} className="rounded-full bg-navy-50 px-1.5 py-0.5 text-[9px] font-medium text-navy-500">
                {layer}
              </span>
            ))}
          </div>
          {contextBackbone.nextQuestion ? (
            <p className="mt-2 text-[11px] leading-snug text-amber-700">{contextBackbone.nextQuestion}</p>
          ) : (
            <p className="mt-2 text-[11px] leading-snug text-emerald-700">Core context is sufficient for the first tool sequence.</p>
          )}
          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-400">Health rollup</p>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', healthPillClass(contextHealth.state))}>
                {contextHealth.state}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {Object.entries(contextHealth.dimensions).slice(1).map(([key, dimension]) => (
                <span key={key} className={cn('rounded px-1.5 py-1 text-center text-[9px] font-semibold uppercase tracking-wide', healthPillClass(dimension.state))}>
                  {prettyDimension(key)}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-navy-500">{contextHealth.summary}</p>
            {contextHealth.findings.find((finding) => finding.state === 'red' || finding.state === 'yellow') ? (
              <p className="mt-1 text-[11px] leading-snug text-amber-700">
                {contextHealth.findings.find((finding) => finding.state === 'red' || finding.state === 'yellow')?.message}
              </p>
            ) : null}
          </div>
          <GraphOpsPanel situationId={situation.id} />
        </div>
      </div>
    </section>
  );
}

function GraphOpsPanel({ situationId }: { situationId: string }) {
  const [summary, setSummary] = useState<GraphOpsSummary | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/graph/ops?situationId=${encodeURIComponent(situationId)}`, {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`GraphOps failed: ${response.status}`);
        const payload = (await response.json()) as { summary?: GraphOpsSummary };
        if (!cancelled) {
          setSummary(payload.summary ?? null);
          setState(payload.summary ? 'ready' : 'unavailable');
        }
      } catch {
        if (!cancelled) setState('unavailable');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [situationId]);

  const firstAction = summary?.maintenanceActions[0];

  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
          <Network className="h-3.5 w-3.5" />
          GraphOps
        </p>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-navy-600">
          {summary?.backend?.replace('-', ' ') ?? state}
        </span>
      </div>
      {state === 'ready' && summary ? (
        <>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            <BackboneMetric icon={<Network className="h-3 w-3" />} label="Nodes" value={String(summary.nodeCount)} />
            <BackboneMetric icon={<ArrowRight className="h-3 w-3" />} label="Edges" value={String(summary.edgeCount)} />
            <BackboneMetric icon={<ShieldCheck className="h-3 w-3" />} label="Proof" value={`${summary.provenance.coveragePct}%`} />
            <BackboneMetric icon={<Gauge className="h-3 w-3" />} label="Time" value={`${summary.temporal.coveragePct}%`} />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-navy-500">
            {firstAction ?? 'Graph maintenance queue is clear.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(summary.nodeTypes).slice(0, 5).map(([type, count]) => (
              <span key={type} className="rounded-full bg-navy-50 px-1.5 py-0.5 text-[9px] font-medium text-navy-500">
                {type}: {count}
              </span>
            ))}
          </div>
          <PraxisLink
            href="/conflict-graph"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-diplomatic-blue hover:text-navy-900"
          >
            Open graph workspace
            <ArrowRight className="h-3 w-3" />
          </PraxisLink>
        </>
      ) : (
        <p className="mt-2 text-[11px] leading-snug text-navy-500">
          {state === 'loading'
            ? 'Checking canonical graph, pending proposals, provenance, and temporal coverage.'
            : 'GraphOps is unavailable in this session; graph-dependent tools will still use the local situation context.'}
        </p>
      )}
    </div>
  );
}

function BackboneMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
      <div className="flex items-center gap-1 text-navy-500">{icon}<span className="text-[9px] uppercase tracking-wider">{label}</span></div>
      <p className="mt-0.5 text-sm font-semibold text-navy-900">{value}</p>
    </div>
  );
}

function buildReadiness(situation: Situation) {
  const items = [
    {
      label: 'Frame',
      done: Boolean(situation.description && situation.region),
      detail: situation.description ? 'Description and region are present.' : 'Add a sharper mandate, geography, and current status.',
      icon: <Gauge className="h-3.5 w-3.5" />,
    },
    {
      label: 'Actors',
      done: (situation.actorCount || situation.actors?.length || 0) >= 3,
      detail: `${situation.actorCount || situation.actors?.length || 0} actors available for mapping.`,
      icon: <Users className="h-3.5 w-3.5" />,
    },
    {
      label: 'Evidence',
      done: (situation.documentCount || 0) > 0 || Boolean(situation.sourceUrls?.length),
      detail: situation.documentCount ? `${situation.documentCount} uploaded documents.` : 'Add documents or custom URLs to strengthen citations.',
      icon: <FileText className="h-3.5 w-3.5" />,
    },
    {
      label: 'Deliberation',
      done: Boolean(situation.domain && situation.domain !== 'generic'),
      detail: situation.domain && situation.domain !== 'generic' ? `Domain: ${situation.domain}.` : 'Pick a workflow/domain to tune expert agents.',
      icon: <Brain className="h-3.5 w-3.5" />,
    },
  ];
  const score = Math.round((items.filter((item) => item.done).length / items.length) * 100);
  return { items, score };
}

function buildNextActions(situation: Situation) {
  const actions = [];
  const hasDocuments = (situation.documentCount || 0) > 0;
  const hasSourceUrls = Boolean(situation.sourceUrls?.length);
  if (!hasDocuments && !hasSourceUrls) {
    actions.push({
      href: '/documents',
      label: 'Add evidence',
      detail: 'Upload PDFs, DOCX, TXT, or notes so tools cite your own material.',
    });
  } else if (!hasDocuments && hasSourceUrls) {
    actions.push({
      href: '/documents',
      label: 'Upload documents',
      detail: 'You have URLs queued. Add PDFs or notes for richer document-grounded analysis.',
    });
  }
  actions.push({
    href: '/source-scout',
    label: 'Scout sources',
    detail: 'Find fresh primary, policy, media, and open-data sources.',
  });
  actions.push({
    href: '/brainstorming-table',
    label: 'Convene experts',
    detail: 'Have personas debate the question, documents, and working text.',
  });
  actions.push({
    href: '/briefing',
    label: 'Draft briefing',
    detail: 'Turn the case file into a concise, citable briefing product.',
  });
  actions.push({
    href: TOOL_HREFS['red-team-review'] ?? '/brainstorming-table',
    label: 'Red-team output',
    detail: 'Challenge assumptions, source gaps, and confidence claims.',
  });
  return actions.slice(0, 3);
}

function normalizeToolId(toolId: string): string {
  if (toolId === 'scenario') return 'scenarios';
  return toolId;
}

function buildContextBackbone(toolIds: string[], situation: Situation) {
  const normalizedToolIds = toolIds.map(normalizeToolId).filter((toolId) => getToolById(toolId));
  const blueprints = normalizedToolIds.map((toolId) => getToolContextBlueprint(toolId));
  const readiness = normalizedToolIds.map((toolId) => getToolContextReadiness(toolId, situation));
  const layers = Array.from(new Set(blueprints.flatMap((blueprint) => blueprint.requiredLayers)));
  const graphTools = blueprints.filter((blueprint) => blueprint.graphBackbone.currentMode !== 'none').length;
  const documentTools = blueprints.filter((blueprint) => blueprint.documentProduction.supportsLibreOfficeExport || blueprint.requiredLayers.includes('document-corpus')).length;
  const provenanceTools = blueprints.filter((blueprint) => blueprint.evidencePolicy.mustShowProvenance).length;
  const firstGap = readiness.find((item) => !item.ready);
  return {
    totalTools: normalizedToolIds.length,
    readyTools: readiness.filter((item) => item.ready).length,
    graphTools,
    documentTools,
    provenanceTools,
    layers,
    nextQuestion: firstGap?.nextQuestion ?? null,
  };
}

function prettyToolName(id: string): string {
  return id
    .split('-')
    .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ');
}

function healthClass(state: ContextHealthState): string {
  if (state === 'green') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (state === 'yellow') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (state === 'red') return 'border-red-200 bg-red-50 text-red-800';
  return 'border-slate-200 bg-slate-50 text-navy-700';
}

function healthPillClass(state: ContextHealthState): string {
  if (state === 'green') return 'bg-emerald-100 text-emerald-700';
  if (state === 'yellow') return 'bg-amber-100 text-amber-700';
  if (state === 'red') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-navy-500';
}

function prettyDimension(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}
