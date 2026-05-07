'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileText,
  GitBranch,
  LayoutDashboard,
  Network,
  Plus,
  Scale,
  Settings,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSituationStore } from '@/stores/situation-store';
import type { Situation } from '@/types/situation';

interface DashboardExampleCase {
  id: string;
  name: string;
  region: string;
  summary: string;
  risk: number;
  glaslStage: number;
  tags: string[];
}

interface DashboardCommandCenterProps {
  exampleCases: DashboardExampleCase[];
  marketplaceToolCount: number;
}

const surfaceLinks = [
  { label: 'Workbench', tab: 'chapters', icon: LayoutDashboard, detail: 'Open the case operating room.' },
  { label: 'Graph', tab: 'graph', icon: GitBranch, detail: 'Inspect actors, claims, and provenance.' },
  { label: 'Tools', tab: 'tools', icon: Store, detail: 'Run ontology-aware analysis.' },
  { label: 'Memo Studio', tab: 'memos', icon: FileText, detail: 'Draft and export work products.' },
  { label: 'Boardroom', path: 'boardroom', icon: Users, detail: 'Launch advisor deliberation.' },
  { label: 'ACH', path: 'ach', icon: Scale, detail: 'Stress-test hypotheses.' },
];

const workQueue = [
  {
    label: 'Context before tools',
    detail: 'Open the case frame and resolve missing actors, sources, or graph claims before expensive runs.',
    hrefTab: 'context',
    icon: ShieldCheck,
  },
  {
    label: 'Run a specialist sequence',
    detail: 'Use the marketplace from the active case so context, graph, and user preferences travel together.',
    hrefTab: 'tools',
    icon: BrainCircuit,
  },
  {
    label: 'Turn findings into a memo',
    detail: 'Move synthesized outputs into Memo Studio, keep provenance visible, then export.',
    hrefTab: 'memos',
    icon: FileText,
  },
];

export function DashboardCommandCenter({ exampleCases, marketplaceToolCount }: DashboardCommandCenterProps) {
  const userCases = useSituationStore((state) => state.situations);
  const activeSituation = useSituationStore((state) => state.activeSituation);
  const activeCase = activeSituation ?? userCases[0] ?? exampleCases[0];
  const activeCaseId = activeCase?.id ?? 'syria-2026';
  const activeCaseName = activeCase ? activeCase.name : 'No case selected';
  const activeRegion = activeCase ? activeCase.region : 'Example';
  const riskScore = getRiskScore(activeCase);
  const glaslStage = getGlaslStage(activeCase);
  const totalCases = userCases.length + exampleCases.length;
  const graphEntities = getGraphEntities(activeCase);

  return (
    <div className="space-y-6" data-testid="praxis-dashboard-command-center">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="rounded-lg border border-[var(--color-app-border)] bg-white p-5 shadow-sm shadow-navy-950/5 sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase text-gold-700">PRAXIS Dashboard</p>
              <h1 className="mt-2 text-2xl font-semibold text-navy-950 sm:text-3xl">
                Start from the case, then move through context, graph, tools, and memo.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-650">
                This is the real app entry point for analysts, mediators, and policy teams. It keeps the current case visible
                while routing every action through the workbench contract.
              </p>
            </div>
            <Link
              href="/app/situations/new"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
            >
              <Plus className="h-4 w-4" />
              New case
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Active case" value={activeCaseName} detail={activeRegion} tone="navy" />
            <Metric label="Marketplace" value={String(marketplaceToolCount)} detail="registered v2 tools" tone="teal" />
            <Metric label="Graph signal" value={String(graphEntities)} detail="entities in focus" tone="gold" />
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {surfaceLinks.map((surface) => {
              const href = surface.path
                ? `/app/workbench/${activeCaseId}/${surface.path}`
                : `/app/workbench/${activeCaseId}?tab=${surface.tab}`;
              const Icon = surface.icon;
              return (
                <Link
                  key={surface.label}
                  href={href}
                  className="group flex min-h-[104px] items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-navy-300 hover:bg-white"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-navy-700 ring-1 ring-slate-200 group-hover:text-diplomatic-blue">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold text-navy-950">
                      {surface.label}
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-navy-700" />
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">{surface.detail}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <DashboardGraphOrbit
          activeCaseName={activeCaseName}
          riskScore={riskScore}
          glaslStage={glaslStage}
          graphEntities={graphEntities}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(380px,0.8fr)]">
        <div className="rounded-lg border border-[var(--color-app-border)] bg-white p-5 shadow-sm shadow-navy-950/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gold-700">Next best work</p>
              <h2 className="mt-1 text-lg font-semibold text-navy-950">Keep the workflow inside the workbench.</h2>
            </div>
            <span className="rounded-full border border-sage/25 bg-sage/10 px-3 py-1 text-xs font-semibold text-sage">
              {totalCases} cases available
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {workQueue.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={`/app/workbench/${activeCaseId}?tab=${item.hrefTab}`}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-navy-300 hover:bg-white"
                >
                  <Icon className="h-5 w-5 text-diplomatic-blue" />
                  <h3 className="mt-3 text-sm font-semibold text-navy-950">{item.label}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{item.detail}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--color-app-border)] bg-white p-5 shadow-sm shadow-navy-950/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gold-700">Operating posture</p>
              <h2 className="mt-1 text-lg font-semibold text-navy-950">What is live in the app.</h2>
            </div>
            <Link
              href="/app/settings/personas"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-700 hover:border-navy-300 hover:bg-slate-50"
            >
              <Settings className="h-4 w-4" />
              Personas
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {[
              'Workbench tabs separate context, graph, tools, memos, ACH, and boardroom.',
              'Marketplace contracts allow raw text, context dumps, and structured output persistence.',
              'Soft firewall advisories do not block rough context ingestion or user writing.',
              'Boardroom synthesis is review-gated before graph promotion.',
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
                <p className="text-xs leading-5 text-slate-650">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: 'navy' | 'teal' | 'gold';
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-2 truncate text-2xl font-semibold',
          tone === 'navy' && 'text-navy-950',
          tone === 'teal' && 'text-teal',
          tone === 'gold' && 'text-gold-700',
        )}
        title={value}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function DashboardGraphOrbit({
  activeCaseName,
  riskScore,
  glaslStage,
  graphEntities,
}: {
  activeCaseName: string;
  riskScore: number;
  glaslStage: number;
  graphEntities: number;
}) {
  const nodes = [
    { label: 'Context', x: 152, y: 58, color: '#4A90A4' },
    { label: 'Graph', x: 258, y: 91, color: '#E8B931' },
    { label: 'Tools', x: 284, y: 190, color: '#5B8C5A' },
    { label: 'Memo', x: 196, y: 262, color: '#C75B39' },
    { label: 'Board', x: 82, y: 218, color: '#7B6D8D' },
    { label: 'ACH', x: 60, y: 108, color: '#3D5A80' },
  ];

  return (
    <div className="relative overflow-hidden rounded-lg border border-navy-900 bg-navy-950 p-5 text-white shadow-sm shadow-navy-950/10">
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-gold-400">Live workbench map</p>
          <h2 className="mt-1 text-xl font-semibold">{activeCaseName}</h2>
        </div>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-navy-100">
          Demo-safe
        </span>
      </div>

      <div className="relative z-10 mt-4 aspect-[4/3] min-h-[320px] sm:min-h-[380px]" data-testid="dashboard-graph-orbit">
        <svg viewBox="0 0 340 320" role="img" aria-label="Animated PRAXIS case graph showing context, graph, tools, memo, boardroom, and ACH surfaces" className="h-full w-full">
          <defs>
            <radialGradient id="dashboardCore" cx="50%" cy="48%" r="50%">
              <stop offset="0%" stopColor="#F0CA4D" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#4A90A4" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#050A18" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="340" height="320" rx="22" fill="#050A18" />
          <circle cx="170" cy="160" r="142" fill="url(#dashboardCore)" className="motion-safe:animate-pulse" />
          <circle cx="170" cy="160" r="92" fill="none" stroke="#94A3B8" strokeOpacity="0.18" strokeWidth="1" />
          <circle cx="170" cy="160" r="132" fill="none" stroke="#94A3B8" strokeOpacity="0.14" strokeWidth="1" strokeDasharray="6 8" />
          {nodes.map((node) => (
            <line key={`${node.label}-edge`} x1="170" y1="160" x2={node.x} y2={node.y} stroke={node.color} strokeOpacity="0.52" strokeWidth="1.6" />
          ))}
          {nodes.map((source, index) => {
            const target = nodes[(index + 1) % nodes.length];
            return (
              <line
                key={`${source.label}-${target.label}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="#CBD5E1"
                strokeOpacity="0.2"
                strokeWidth="1"
              />
            );
          })}
          <circle cx="170" cy="160" r="42" fill="#0B1120" stroke="#F0CA4D" strokeOpacity="0.75" strokeWidth="1.5" />
          <Network x="152" y="135" width="36" height="36" color="#F0CA4D" strokeWidth="1.8" />
          <text x="170" y="187" fill="#F8FAFC" fontSize="11" textAnchor="middle" fontWeight="600">Case graph</text>
          {nodes.map((node) => (
            <g key={node.label}>
              <circle cx={node.x} cy={node.y} r="23" fill="#0F172A" stroke={node.color} strokeWidth="2" />
              <circle cx={node.x} cy={node.y} r="7" fill={node.color} className="motion-safe:animate-pulse" />
              <text x={node.x} y={node.y + 39} fill="#E2E8F0" fontSize="10" textAnchor="middle" fontWeight="600">
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="relative z-10 mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <GraphStat label="Risk" value={String(riskScore)} />
        <GraphStat label="Glasl" value={glaslStage ? String(glaslStage) : '-'} />
        <GraphStat label="Nodes" value={String(graphEntities)} />
      </div>
    </div>
  );
}

function GraphStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 px-3 py-2">
      <p className="text-navy-300">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function getRiskScore(activeCase: Situation | DashboardExampleCase | undefined): number {
  if (!activeCase) return 0;
  if ('riskScore' in activeCase) return Math.round(activeCase.riskScore * 10);
  return activeCase.risk;
}

function getGlaslStage(activeCase: Situation | DashboardExampleCase | undefined): number {
  if (!activeCase) return 0;
  return activeCase.glaslStage ?? 0;
}

function getGraphEntities(activeCase: Situation | DashboardExampleCase | undefined): number {
  if (!activeCase) return 0;
  if ('graphEntities' in activeCase) return activeCase.graphEntities || activeCase.actorCount || 0;
  return Math.max(8, activeCase.tags.length + 6);
}
