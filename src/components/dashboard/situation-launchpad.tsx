'use client';

import { ArrowRight, Brain, FileText, Gauge, Search, ShieldCheck, Users } from 'lucide-react';
import { PraxisLink } from '@/components/shared/praxis-link';
import { getPolicyWorkflowPath } from '@/lib/constants/policy-workflow-paths';
import { getToolById } from '@/lib/constants/tool-registry';
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
      </div>
    </section>
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
  if (!situation.documentCount) {
    actions.push({
      href: '/documents',
      label: 'Add evidence',
      detail: 'Upload PDFs, DOCX, TXT, or notes so tools cite your own material.',
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
    href: '/red-team-review',
    label: 'Red-team output',
    detail: 'Challenge assumptions, source gaps, and confidence claims.',
  });
  return actions.slice(0, 3);
}

function prettyToolName(id: string): string {
  return id
    .split('-')
    .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ');
}
