export interface ConsolidatedToolDefinition {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  purpose: string;
  primaryOutput: string;
  anchorToolId?: string;
  absorbs: string[];
  requires: Array<'situation' | 'sources' | 'documents' | 'graph' | 'timeline' | 'ai'>;
  costPosture: 'free' | 'low' | 'standard' | 'premium-on-demand';
}

export const CONSOLIDATED_TOOLS: ConsolidatedToolDefinition[] = [
  {
    id: 'situation-dashboard',
    label: 'Situation Dashboard',
    shortLabel: 'Dashboard',
    href: '/dashboard',
    anchorToolId: 'dashboard',
    purpose: 'One operating picture for context health, risk, graph, sources, recent outputs, and next actions.',
    primaryOutput: 'Current situation readout with readiness, risk, and next action.',
    absorbs: ['dashboard', 'situation-intelligence', 'risk-monitor', 'early-warning', 'humanitarian', 'economic-impact'],
    requires: ['situation', 'sources', 'graph'],
    costPosture: 'low',
  },
  {
    id: 'context-builder',
    label: 'Context Builder',
    shortLabel: 'Context',
    href: '/context-builder',
    purpose: 'Guided intake and missing-context repair before expensive AI or graph work runs.',
    primaryOutput: 'A stronger situation file with sources, actors, goals, assumptions, and gaps.',
    absorbs: ['context-builder', 'situations', 'profile', 'requirements'],
    requires: ['situation'],
    costPosture: 'free',
  },
  {
    id: 'ask-praxis',
    label: 'Ask PRAXIS',
    shortLabel: 'Ask',
    href: '/assistant',
    anchorToolId: 'assistant',
    purpose: 'Chat over the current situation, saved tool outputs, documents, and graph context.',
    primaryOutput: 'Context-aware answer or proposed workspace update.',
    absorbs: ['assistant', 'chat', 'advisory'],
    requires: ['situation', 'ai'],
    costPosture: 'standard',
  },
  {
    id: 'research-sources',
    label: 'Research & Sources',
    shortLabel: 'Research',
    href: '/source-scout',
    anchorToolId: 'source-scout',
    purpose: 'Search planning, source discovery, source receipts, and credibility-weighted live research.',
    primaryOutput: 'Source pack with receipts, provider coverage, gaps, and confidence.',
    absorbs: ['source-scout', 'sources-library', 'deep-search-agent', 'argus', 'source-monitor', 'global-search'],
    requires: ['situation', 'sources', 'ai'],
    costPosture: 'premium-on-demand',
  },
  {
    id: 'documents',
    label: 'Documents',
    shortLabel: 'Docs',
    href: '/documents',
    anchorToolId: 'documents',
    purpose: 'Upload, extract, and reuse source material in graph, research, briefing, and Ask PRAXIS.',
    primaryOutput: 'Parsed document corpus with extracted entities and fragments.',
    absorbs: ['documents', 'docs', 'cases'],
    requires: ['situation', 'documents'],
    costPosture: 'low',
  },
  {
    id: 'graphops',
    label: 'GraphOps',
    shortLabel: 'GraphOps',
    href: '/graphops',
    anchorToolId: 'graphops',
    purpose: 'Maintain the canonical Firestore graph before graph-dependent analysis uses it.',
    primaryOutput: 'Graph health, proposals, provenance coverage, and repair actions.',
    absorbs: ['graphops', 'dialectica'],
    requires: ['situation', 'graph'],
    costPosture: 'free',
  },
  {
    id: 'conflict-graph',
    label: 'Conflict Graph',
    shortLabel: 'Graph',
    href: '/conflict-graph',
    anchorToolId: 'conflict-graph',
    purpose: 'Visualize actors, claims, interests, constraints, events, narratives, and relationships.',
    primaryOutput: 'Interactive conflict-grammar graph for exploration and explanation.',
    absorbs: ['conflict-graph', 'power-map', 'external-actors'],
    requires: ['situation', 'graph'],
    costPosture: 'low',
  },
  {
    id: 'timeline',
    label: 'Timeline & Signals',
    shortLabel: 'Timeline',
    href: '/timeline',
    anchorToolId: 'timeline',
    purpose: 'Track events, indicators, warnings, and what changed since the last session.',
    primaryOutput: 'Chronological event view with escalation and freshness cues.',
    absorbs: ['timeline', 'early-warning', 'calendar', 'alerts', 'geospatial-monitor'],
    requires: ['situation', 'timeline', 'sources'],
    costPosture: 'standard',
  },
  {
    id: 'actors-stakeholders',
    label: 'Actors & Stakeholders',
    shortLabel: 'Actors',
    href: '/stakeholder-map',
    anchorToolId: 'stakeholder-map',
    purpose: 'Map actor positions, interests, leverage, constraints, salience, and negotiation posture.',
    primaryOutput: 'Actor and stakeholder map for analysis, mediation, and briefing.',
    absorbs: ['stakeholder-map', 'actor-profiles', 'negotiation-prep', 'mediation-design', 'commitments'],
    requires: ['situation', 'graph', 'ai'],
    costPosture: 'standard',
  },
  {
    id: 'briefing-studio',
    label: 'Briefing Studio',
    shortLabel: 'Briefing',
    href: '/briefing',
    anchorToolId: 'briefing',
    purpose: 'Turn context, sources, documents, and graph state into decision-ready artifacts.',
    primaryOutput: 'Briefing, memo, talking points, dossier, report, or export-ready package.',
    absorbs: ['briefing', 'policy-memo', 'talking-points', 'dossier', 'report-studio', 'export-center', 'brainstorming-table', 'un-toolkit', 'legal-tracker', 'sanctions', 'treaty-analyzer', 'human-rights'],
    requires: ['situation', 'sources', 'documents', 'graph', 'ai'],
    costPosture: 'standard',
  },
] as const;

export const CONSOLIDATED_TOOL_IDS = CONSOLIDATED_TOOLS.map((tool) => tool.id);
export const CONSOLIDATED_ANCHOR_TOOL_IDS = CONSOLIDATED_TOOLS
  .map((tool) => tool.anchorToolId)
  .filter(Boolean) as string[];

const LEGACY_TO_CONSOLIDATED = new Map<string, ConsolidatedToolDefinition>();
for (const tool of CONSOLIDATED_TOOLS) {
  LEGACY_TO_CONSOLIDATED.set(tool.id, tool);
  if (tool.anchorToolId) LEGACY_TO_CONSOLIDATED.set(tool.anchorToolId, tool);
  for (const legacyId of tool.absorbs) LEGACY_TO_CONSOLIDATED.set(legacyId, tool);
}

export function getConsolidatedTool(id?: string | null): ConsolidatedToolDefinition | null {
  if (!id) return null;
  return CONSOLIDATED_TOOLS.find((tool) => tool.id === id) ?? null;
}

export function consolidatedToolForLegacyId(toolId?: string | null): ConsolidatedToolDefinition | null {
  if (!toolId) return null;
  return LEGACY_TO_CONSOLIDATED.get(toolId) ?? null;
}

export function isConsolidatedAnchorTool(toolId: string): boolean {
  return CONSOLIDATED_ANCHOR_TOOL_IDS.includes(toolId);
}
