import { POLICY_WORKFLOW_PATHS, type PolicyWorkflowPathId } from '@/lib/constants/policy-workflow-paths';

export type PraxisToolPathId = 'generic-core' | PolicyWorkflowPathId;
export type ToolPathStage = 'active' | 'next' | 'future';
export type ToolPathToolTier = 'core' | 'primary' | 'secondary' | 'specialized' | 'premium-future' | 'hidden-default';

export interface ToolPathDefinition {
  id: PraxisToolPathId;
  label: string;
  shortLabel: string;
  stage: ToolPathStage;
  description: string;
  primaryUser: string;
  productPromise: string;
  coreToolIds: string[];
  primaryToolIds: string[];
  secondaryToolIds: string[];
  specializedToolIds: string[];
  premiumFutureToolIds: string[];
  hiddenByDefaultToolIds: string[];
  deliverables: string[];
}

export interface ToolPathMembership {
  pathId: PraxisToolPathId;
  tier: ToolPathToolTier;
  label: string;
  stage: ToolPathStage;
}

const GENERIC_CORE_TOOL_IDS = [
  'dashboard',
  'situation-intelligence',
  'assistant',
  'sources-library',
  'documents',
  'graphops',
  'conflict-graph',
  'timeline',
  'briefing',
  'report-studio',
  'deep-search-agent',
] as const;

const DIALECTICA_PREMIUM_FUTURE = [
  'argus',
  'conflict-graph',
  'brainstorming-table',
  'deep-search-agent',
] as const;

const PATH_OVERRIDES: Record<PolicyWorkflowPathId, Partial<ToolPathDefinition>> = {
  'political-officer': {
    label: 'Conflict / Political Analyst',
    shortLabel: 'Conflict analyst',
    stage: 'active',
    primaryUser: 'Political affairs officer, conflict analyst, country analyst, OSINT analyst, or policy advisor.',
    productPromise: 'Turn open sources, documents, media, and situation context into a live political operating picture: actors, risks, timelines, narratives, policy options, briefings, and checkable provenance.',
    primaryToolIds: [
      'early-warning',
      'risk-monitor',
      'actor-profiles',
      'stakeholder-map',
      'geospatial-monitor',
      'commitments',
      'info-environment',
      'media-roundup',
      'argus',
      'deep-search-agent',
      'policy-memo',
      'talking-points',
      'dossier',
    ],
    secondaryToolIds: [
      'scenarios',
      'compare',
      'game-theory',
      'power-map',
      'external-actors',
      'legal-tracker',
      'human-rights',
      'sanctions',
      'treaty-analyzer',
      'un-toolkit',
      'mediation-design',
      'negotiation-prep',
      'economic-impact',
    ],
    specializedToolIds: ['electoral-risk', 'peacebuilding-index', 'humanitarian', 'concordia'],
    hiddenByDefaultToolIds: ['settings', 'team', 'advisory', 'source-monitor', 'alert-center'],
    deliverables: [
      'Daily political read',
      'Actor and stakeholder map',
      'Risk and escalation watch',
      'Media/narrative assessment',
      'Policy memo and talking points',
      'Source-grounded research packet',
    ],
  },
  'country-desk': {
    stage: 'next',
    primaryToolIds: ['briefing', 'talking-points', 'policy-memo', 'actor-profiles', 'sanctions', 'external-actors'],
    secondaryToolIds: ['risk-monitor', 'media-roundup', 'legal-tracker', 'economic-impact', 'dossier'],
  },
  'mediator-envoy': {
    stage: 'next',
    primaryToolIds: ['stakeholder-map', 'negotiation-prep', 'mediation-design', 'brainstorming-table', 'talking-points', 'commitments'],
    secondaryToolIds: ['actor-profiles', 'concordia', 'game-theory', 'power-map', 'policy-memo'],
  },
  'humanitarian-access': {
    stage: 'future',
    primaryToolIds: ['humanitarian', 'risk-monitor', 'early-warning', 'actor-profiles', 'briefing', 'geospatial-monitor'],
    secondaryToolIds: ['human-rights', 'commitments', 'sources-library', 'media-roundup'],
  },
  'legal-sanctions': {
    stage: 'future',
    primaryToolIds: ['legal-tracker', 'sanctions', 'human-rights', 'treaty-analyzer', 'briefing', 'policy-memo'],
    secondaryToolIds: ['commitments', 'documents', 'source-scout', 'deep-search-agent', 'un-toolkit'],
  },
  'political-risk': {
    stage: 'future',
    primaryToolIds: ['risk-monitor', 'economic-impact', 'scenarios', 'briefing', 'source-scout', 'sanctions'],
    secondaryToolIds: ['early-warning', 'geospatial-monitor', 'media-roundup', 'external-actors'],
  },
  'policy-research': {
    stage: 'future',
    primaryToolIds: ['source-scout', 'deep-search-agent', 'argus', 'policy-memo', 'brainstorming-table', 'briefing'],
    secondaryToolIds: ['sources-library', 'documents', 'compare', 'dossier'],
  },
  'media-disinformation': {
    stage: 'future',
    primaryToolIds: ['media-roundup', 'info-environment', 'media-compass', 'source-scout', 'red-team-review', 'argus'],
    secondaryToolIds: ['sources-library', 'actor-profiles', 'external-actors', 'briefing'],
  },
  stabilization: {
    stage: 'future',
    primaryToolIds: ['peacebuilding-index', 'stakeholder-map', 'risk-monitor', 'commitments', 'briefing'],
    secondaryToolIds: ['humanitarian', 'economic-impact', 'mediation-design', 'policy-memo'],
  },
  'election-governance': {
    stage: 'future',
    primaryToolIds: ['electoral-risk', 'early-warning', 'actor-profiles', 'briefing', 'talking-points'],
    secondaryToolIds: ['media-roundup', 'info-environment', 'legal-tracker', 'policy-memo'],
  },
};

const GENERIC_CORE_PATH: ToolPathDefinition = {
  id: 'generic-core',
  label: 'Generic PRAXIS Core',
  shortLabel: 'Generic core',
  stage: 'active',
  description: 'The baseline workspace every serious PRAXIS user needs before specialized analysis: situation context, sources, documents, graph, timeline, assistant, briefing, reports, and research.',
  primaryUser: 'Any policy, intelligence, legal, diplomatic, humanitarian, media, or research user starting a situation.',
  productPromise: 'Create a common operating picture that every specialized path can reuse: source intake, document analysis, graph structure, timeline, Ask PRAXIS, and exportable briefing/report outputs.',
  coreToolIds: [...GENERIC_CORE_TOOL_IDS],
  primaryToolIds: ['dashboard', 'situation-intelligence', 'assistant', 'sources-library', 'documents'],
  secondaryToolIds: ['conflict-graph', 'timeline', 'briefing', 'report-studio', 'deep-search-agent'],
  specializedToolIds: ['source-scout', 'argus', 'export-center'],
  premiumFutureToolIds: [...DIALECTICA_PREMIUM_FUTURE],
  hiddenByDefaultToolIds: ['settings', 'team', 'advisory', 'alert-center', 'source-monitor'],
  deliverables: ['Situation file', 'Source library', 'Document-derived graph', 'Timeline', 'Briefing', 'Exportable report'],
};

function unique(ids: readonly string[]): string[] {
  return Array.from(new Set(ids));
}

function buildPathFromPolicy(baseId: PolicyWorkflowPathId): ToolPathDefinition {
  const policy = POLICY_WORKFLOW_PATHS.find((path) => path.id === baseId);
  const override = PATH_OVERRIDES[baseId] ?? {};
  return {
    id: baseId,
    label: override.label ?? policy?.label ?? baseId,
    shortLabel: override.shortLabel ?? policy?.shortLabel ?? baseId,
    stage: override.stage ?? 'future',
    description: override.description ?? policy?.description ?? '',
    primaryUser: override.primaryUser ?? policy?.label ?? 'Specialized PRAXIS user',
    productPromise: override.productPromise ?? `Configure PRAXIS around the ${policy?.shortLabel ?? baseId} workflow while keeping the same generic situation backbone.`,
    coreToolIds: override.coreToolIds ?? [...GENERIC_CORE_TOOL_IDS],
    primaryToolIds: unique([...(override.primaryToolIds ?? []), ...(policy?.firstToolIds ?? [])]),
    secondaryToolIds: override.secondaryToolIds ?? [],
    specializedToolIds: override.specializedToolIds ?? [],
    premiumFutureToolIds: override.premiumFutureToolIds ?? [...DIALECTICA_PREMIUM_FUTURE],
    hiddenByDefaultToolIds: override.hiddenByDefaultToolIds ?? ['settings', 'team', 'advisory'],
    deliverables: override.deliverables ?? policy?.deliverables ?? [],
  };
}

export const TOOL_PATHS: ToolPathDefinition[] = [
  GENERIC_CORE_PATH,
  ...POLICY_WORKFLOW_PATHS.map((path) => buildPathFromPolicy(path.id)),
];

export const ACTIVE_TOOL_PATH_IDS: PraxisToolPathId[] = ['generic-core', 'political-officer'];

export function getToolPath(pathId?: string | null): ToolPathDefinition | null {
  if (!pathId) return null;
  return TOOL_PATHS.find((path) => path.id === pathId) ?? null;
}

export function getActiveToolPaths(): ToolPathDefinition[] {
  return ACTIVE_TOOL_PATH_IDS.map((id) => getToolPath(id)).filter(Boolean) as ToolPathDefinition[];
}

export function getToolIdsForPath(pathId: PraxisToolPathId, tiers: ToolPathToolTier[] = ['core', 'primary', 'secondary', 'specialized']): string[] {
  const path = getToolPath(pathId);
  if (!path) return [];
  const ids: string[] = [];
  for (const tier of tiers) {
    if (tier === 'core') ids.push(...path.coreToolIds);
    if (tier === 'primary') ids.push(...path.primaryToolIds);
    if (tier === 'secondary') ids.push(...path.secondaryToolIds);
    if (tier === 'specialized') ids.push(...path.specializedToolIds);
    if (tier === 'premium-future') ids.push(...path.premiumFutureToolIds);
    if (tier === 'hidden-default') ids.push(...path.hiddenByDefaultToolIds);
  }
  return unique(ids);
}

export function getToolPathMembership(toolId: string): ToolPathMembership[] {
  const memberships: ToolPathMembership[] = [];
  for (const path of TOOL_PATHS) {
    const tiers: Array<[ToolPathToolTier, string[]]> = [
      ['core', path.coreToolIds],
      ['primary', path.primaryToolIds],
      ['secondary', path.secondaryToolIds],
      ['specialized', path.specializedToolIds],
      ['premium-future', path.premiumFutureToolIds],
      ['hidden-default', path.hiddenByDefaultToolIds],
    ];
    for (const [tier, ids] of tiers) {
      if (ids.includes(toolId)) {
        memberships.push({ pathId: path.id, tier, label: path.shortLabel, stage: path.stage });
      }
    }
  }
  return memberships;
}

export function isToolInActiveGenericOrPoliticalPath(toolId: string): boolean {
  return ACTIVE_TOOL_PATH_IDS.some((pathId) => getToolIdsForPath(pathId, ['core', 'primary', 'secondary', 'specialized']).includes(toolId));
}

export function getRecommendedToolIdsForWorkflowPath(pathId?: string | null, limit = 8): string[] {
  const path = getToolPath(pathId) ?? getToolPath('political-officer') ?? GENERIC_CORE_PATH;
  return getToolIdsForPath(path.id, ['primary', 'core', 'secondary']).slice(0, limit);
}

export interface ToolPathPackageSummary {
  id: PraxisToolPathId;
  label: string;
  shortLabel: string;
  stage: ToolPathStage;
  statusLabel: string;
  purpose: string;
  primaryUser: string;
  productPromise: string;
  primaryToolIds: string[];
  coreToolIds: string[];
  secondaryToolIds: string[];
  specialistToolIds: string[];
  hiddenByDefaultToolIds: string[];
  deliverables: string[];
  toolCount: number;
}

export function summarizeToolPathPackage(path: ToolPathDefinition): ToolPathPackageSummary {
  const specialistToolIds = unique([...path.specializedToolIds, ...path.premiumFutureToolIds]);
  return {
    id: path.id,
    label: path.label,
    shortLabel: path.shortLabel,
    stage: path.stage,
    statusLabel: stageStatusLabel(path.stage),
    purpose: path.description,
    primaryUser: path.primaryUser,
    productPromise: path.productPromise,
    primaryToolIds: path.primaryToolIds,
    coreToolIds: path.coreToolIds,
    secondaryToolIds: path.secondaryToolIds,
    specialistToolIds,
    hiddenByDefaultToolIds: path.hiddenByDefaultToolIds,
    deliverables: path.deliverables,
    toolCount: getToolIdsForPath(path.id, ['core', 'primary', 'secondary', 'specialized']).length,
  };
}

export function getToolPathPackageSummary(pathId: PraxisToolPathId): ToolPathPackageSummary | null {
  const path = getToolPath(pathId);
  return path ? summarizeToolPathPackage(path) : null;
}

export function getDashboardToolPackageSummaries(selectedPathId?: string | null): ToolPathPackageSummary[] {
  const selectedPath = getToolPath(selectedPathId);
  const ordered = unique([
    'generic-core',
    selectedPath?.id ?? 'political-officer',
    ...ACTIVE_TOOL_PATH_IDS,
    ...TOOL_PATHS.filter((path) => path.stage === 'next').map((path) => path.id),
    ...TOOL_PATHS.filter((path) => path.stage === 'future').map((path) => path.id),
  ]);

  return ordered
    .map((id) => getToolPathPackageSummary(id as PraxisToolPathId))
    .filter(Boolean) as ToolPathPackageSummary[];
}

function stageStatusLabel(stage: ToolPathStage): string {
  if (stage === 'active') return 'Active now';
  if (stage === 'next') return 'Next package';
  return 'Future package';
}
