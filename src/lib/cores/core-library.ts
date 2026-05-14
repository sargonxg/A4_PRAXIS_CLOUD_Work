import type { CoreSpecimenKind } from '@/components/cores/specimen-card';
import { CONSOLIDATED_TOOLS } from '@/lib/constants/consolidated-tools';
import { listExampleCases } from '@/lib/cases/registry';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';

export interface LibraryCore {
  id: string;
  kind: CoreSpecimenKind;
  name: string;
  lineage: string;
  completeness: number;
  projectedReadinessDelta: number;
  essence?: string;
  tags: string[];
  ownerScope: 'platform' | 'user' | 'team' | 'situation' | 'artifact';
  template: boolean;
  updatedAt: string;
}

export interface CoreLibraryFilters {
  kind?: CoreSpecimenKind | 'all';
  q?: string;
  limit?: number;
}

const UPDATED_AT = '2026-05-14T00:00:00.000Z';

const TEMPLATE_CORES: LibraryCore[] = [
  {
    id: 'obj-decision-options',
    kind: 'objective',
    name: 'Decision options for principals',
    lineage: 'template',
    completeness: 94,
    projectedReadinessDelta: 12,
    essence: 'Frames tradeoffs, confidence, decision asks, and second-order risks.',
    tags: ['decision', 'memo', 'principals'],
    ownerScope: 'situation',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'obj-red-team',
    kind: 'objective',
    name: 'Red-team dominant assessment',
    lineage: 'template',
    completeness: 88,
    projectedReadinessDelta: 10,
    essence: 'Forces assumptions, contrary evidence, indicators that would change the call.',
    tags: ['red-team', 'assumptions', 'risk'],
    ownerScope: 'situation',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'obj-source-repair',
    kind: 'objective',
    name: 'Source gap repair',
    lineage: 'template',
    completeness: 86,
    projectedReadinessDelta: 9,
    essence: 'Turns weak claims into collection tasks and source receipts.',
    tags: ['sources', 'evidence', 'gaps'],
    ownerScope: 'situation',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'prd-options-memo',
    kind: 'product',
    name: 'Cited options memo',
    lineage: 'template',
    completeness: 96,
    projectedReadinessDelta: 10,
    essence: 'BLUF, options, risks, evidence ledger, decision asks.',
    tags: ['memo', 'policy', 'export'],
    ownerScope: 'artifact',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'prd-negotiation-brief',
    kind: 'product',
    name: 'Negotiation brief',
    lineage: 'template',
    completeness: 91,
    projectedReadinessDelta: 8,
    essence: 'ZOPA, BATNA, red lines, leverage, confidence-building sequence.',
    tags: ['diplomacy', 'negotiation', 'talking-points'],
    ownerScope: 'artifact',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'prd-corporate-risk-note',
    kind: 'product',
    name: 'Corporate public-affairs risk note',
    lineage: 'template',
    completeness: 89,
    projectedReadinessDelta: 8,
    essence: 'Board-ready regulatory, stakeholder, and reputation posture.',
    tags: ['company', 'board', 'regulatory'],
    ownerScope: 'artifact',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'tim-72h-ops',
    kind: 'time',
    name: '72-hour watch window',
    lineage: 'preset',
    completeness: 100,
    projectedReadinessDelta: 6,
    essence: 'Tight monitoring posture for live developments and response drafting.',
    tags: ['freshness', 'ops', 'watch'],
    ownerScope: 'situation',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'tim-quarterly-policy',
    kind: 'time',
    name: 'Quarterly policy horizon',
    lineage: 'preset',
    completeness: 100,
    projectedReadinessDelta: 5,
    essence: 'Good for legislative, regulatory, and strategy cycles.',
    tags: ['policy', 'regulatory', 'planning'],
    ownerScope: 'situation',
    template: true,
    updatedAt: UPDATED_AT,
  },
  {
    id: 'mem-working-assumptions',
    kind: 'memory',
    name: 'Pinned working assumptions',
    lineage: 'live',
    completeness: 82,
    projectedReadinessDelta: 5,
    essence: 'Remember recurring caveats, adopted definitions, and analyst preferences.',
    tags: ['memory', 'assumptions', 'private'],
    ownerScope: 'user',
    template: true,
    updatedAt: UPDATED_AT,
  },
];

export function listCoreLibrary(filters: CoreLibraryFilters = {}): LibraryCore[] {
  const all = [
    ...userCores(),
    ...situationCores(),
    ...toolCores(),
    ...sourceCores(),
    ...graphCores(),
    ...outputCores(),
    ...TEMPLATE_CORES,
  ];
  const q = filters.q?.trim().toLowerCase();
  const kind = filters.kind && filters.kind !== 'all' ? filters.kind : null;
  return all
    .filter((core) => !kind || core.kind === kind)
    .filter((core) => {
      if (!q) return true;
      return [core.name, core.essence, core.kind, core.ownerScope, ...core.tags].join(' ').toLowerCase().includes(q);
    })
    .sort((a, b) => b.projectedReadinessDelta - a.projectedReadinessDelta || b.completeness - a.completeness)
    .slice(0, Math.max(1, Math.min(filters.limit ?? 80, 160)));
}

function userCores(): LibraryCore[] {
  return PUBLIC_USER_MODELS.map((model) => ({
    id: model.modelId,
    kind: 'user',
    name: model.identity,
    lineage: `v${model.version}`,
    completeness: model.workOntologyId ? 92 : 76,
    projectedReadinessDelta: model.identity.toLowerCase().includes('corporate') ? 13 : 11,
    essence: `${model.role} · ${model.communicationStyle}`,
    tags: ['user', 'persona', model.workOntologyId ?? 'analyst'],
    ownerScope: 'user',
    template: model.visibility === 'public-seed',
    updatedAt: UPDATED_AT,
  }));
}

function situationCores(): LibraryCore[] {
  return listExampleCases().map((example) => ({
    id: example.id,
    kind: 'situation',
    name: example.manifest.name,
    lineage: 'demo',
    completeness: 88,
    projectedReadinessDelta: 18,
    essence: `${example.manifest.region} · ${example.manifest.summary}`,
    tags: ['situation', 'demo', example.manifest.region, ...example.manifest.tags],
    ownerScope: 'situation',
    template: true,
    updatedAt: UPDATED_AT,
  }));
}

function toolCores(): LibraryCore[] {
  return CONSOLIDATED_TOOLS.map((tool) => ({
    id: tool.id,
    kind: 'tool',
    name: tool.label,
    lineage: tool.costPosture,
    completeness: tool.requires.includes('ai') ? 88 : 94,
    projectedReadinessDelta: tool.id === 'ask-praxis' || tool.id === 'briefing-studio' ? 16 : 9,
    essence: tool.primaryOutput,
    tags: ['tool', tool.costPosture, ...tool.requires],
    ownerScope: 'platform',
    template: true,
    updatedAt: UPDATED_AT,
  }));
}

function sourceCores(): LibraryCore[] {
  return [
    core('src-gdelt-grounded-search', 'source', 'GDELT + grounded Google Search', 'live', 90, 12, 'Live media/event triangulation with grounded search fallback.', ['source', 'gdelt', 'google']),
    core('src-reliefweb-hdx', 'source', 'ReliefWeb + HDX humanitarian receipts', 'live', 87, 10, 'Humanitarian operations, needs, access, and cluster evidence.', ['source', 'humanitarian', 'hdx']),
    core('src-ucdp-acled-events', 'source', 'UCDP / ACLED event posture', 'live', 84, 10, 'Conflict event baselines and escalation pattern support.', ['source', 'conflict', 'events']),
  ];
}

function graphCores(): LibraryCore[] {
  return [
    core('grf-actor-claim-lattice', 'graph', 'Actor-claim lattice', 'template', 78, 10, 'Actors, claims, commitments, edges, and provenance gaps.', ['graph', 'claims', 'actors']),
    core('grf-company-stakeholder-map', 'graph', 'Company stakeholder map', 'template', 74, 8, 'Regulators, investors, NGOs, employees, and affected communities.', ['graph', 'company', 'stakeholders']),
  ];
}

function outputCores(): LibraryCore[] {
  return [
    core('out-policy-memo', 'output', 'Policy memo output', 'template', 96, 8, 'Cited memo structure with assumptions and evidence gaps.', ['output', 'memo']),
    core('out-talking-points', 'output', 'Talking points output', 'template', 92, 6, 'Principal-ready speaker notes with caveats.', ['output', 'talking-points']),
  ];
}

function core(
  id: string,
  kind: CoreSpecimenKind,
  name: string,
  lineage: string,
  completeness: number,
  projectedReadinessDelta: number,
  essence: string,
  tags: string[],
): LibraryCore {
  return { id, kind, name, lineage, completeness, projectedReadinessDelta, essence, tags, ownerScope: 'situation', template: true, updatedAt: UPDATED_AT };
}
