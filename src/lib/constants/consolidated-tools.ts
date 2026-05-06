export interface ConsolidatedToolDefinition {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  purpose: string;
  primaryOutput: string;
  anchorToolId?: string;
  liveAiCapability: string;
  absorbs: string[];
  requires: Array<'situation' | 'sources' | 'documents' | 'graph' | 'timeline' | 'ai'>;
  costPosture: 'free' | 'low' | 'standard' | 'premium-on-demand';
}

export type SpecializedToolDevelopmentStatus = 'active-support' | 'in-development' | 'premium-future';

export interface SpecializedToolDevelopmentGroup {
  id: string;
  label: string;
  consolidatedToolId: string;
  status: SpecializedToolDevelopmentStatus;
  userCases: string[];
  toolIds: string[];
  nextLiveAiUpgrade: string;
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
    liveAiCapability: 'AI summary and package-readiness actions over the active situation, saved outputs, and graph/source health.',
    absorbs: ['dashboard', 'situation-intelligence', 'risk-monitor', 'early-warning', 'humanitarian', 'human-rights', 'economic-impact'],
    requires: ['situation', 'sources', 'graph'],
    costPosture: 'low',
  },
  {
    id: 'context-builder',
    label: 'Context Builder',
    shortLabel: 'Context',
    href: '/context-builder',
    anchorToolId: 'context-builder',
    purpose: 'Guided intake and missing-context repair before expensive AI or graph work runs.',
    primaryOutput: 'A stronger situation file with sources, actors, goals, assumptions, and gaps.',
    liveAiCapability: 'Domain classification, context-health scoring, mission routing, and low-cost next-action sequencing.',
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
    liveAiCapability: 'Situation-aware chat with tool routing, citations, context injection, and proposed workspace updates.',
    absorbs: ['assistant', 'chat', 'advisory', 'concordia'],
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
    liveAiCapability: 'Cost-gated live web research with source receipts, credibility audit, provider coverage, and follow-up collection tasks.',
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
    liveAiCapability: 'Document ingestion and entity extraction that feeds graph proposals, Ask PRAXIS, and briefing artifacts.',
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
    liveAiCapability: 'Live Firestore graph health, proposal review, evidence coverage, temporal assertions, and repair guidance.',
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
    liveAiCapability: 'AI extraction into conflict-grammar graph nodes and edges with interactive visual exploration.',
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
    liveAiCapability: 'Risk-assessment backed event sequencing, escalation cues, and freshness signals from saved/live context.',
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
    liveAiCapability: 'AI stakeholder mapping over actors, power, interests, constraints, leverage, salience, and negotiation posture.',
    absorbs: ['stakeholder-map', 'actor-profiles', 'negotiation-prep', 'mediation-design', 'commitments', 'game-theory'],
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
    liveAiCapability: 'Grounded briefing generation from context, source receipts, documents, graph signals, and drafting constraints.',
    absorbs: ['briefing', 'policy-memo', 'talking-points', 'dossier', 'report-studio', 'export-center', 'brainstorming-table', 'un-toolkit', 'legal-tracker', 'sanctions', 'treaty-analyzer'],
    requires: ['situation', 'sources', 'documents', 'graph', 'ai'],
    costPosture: 'standard',
  },
] as const;

export const SPECIALIZED_TOOL_DEVELOPMENT_GROUPS: SpecializedToolDevelopmentGroup[] = [
  {
    id: 'research-lab',
    label: 'Research Lab',
    consolidatedToolId: 'research-sources',
    status: 'active-support',
    userCases: ['OSINT analysts', 'policy researchers', 'watch officers'],
    toolIds: ['sources-library', 'deep-search-agent', 'argus', 'deep-research', 'source-monitor', 'media-roundup', 'info-environment'],
    nextLiveAiUpgrade: 'Turn ad hoc searches into saved collection plans with source receipts, watchlists, and explicit premium-provider spend controls.',
  },
  {
    id: 'graph-ontology-lab',
    label: 'Graph & Ontology Lab',
    consolidatedToolId: 'graphops',
    status: 'premium-future',
    userCases: ['graph analysts', 'senior analytic cells', 'enterprise knowledge teams'],
    toolIds: ['power-map', 'external-actors', 'compare', 'conflict-graph', 'graphops'],
    nextLiveAiUpgrade: 'Expose analyst-approved graph mutations and future Dialectica-style ontology packs without making them default-cost features.',
  },
  {
    id: 'mediation-lab',
    label: 'Mediation & Negotiation Lab',
    consolidatedToolId: 'actors-stakeholders',
    status: 'in-development',
    userCases: ['mediators', 'envoys', 'Track II teams'],
    toolIds: ['actor-profiles', 'negotiation-prep', 'mediation-design', 'commitments', 'brainstorming-table', 'concordia', 'game-theory'],
    nextLiveAiUpgrade: 'Generate option sets, concession maps, commitments, and advisor critiques from the shared actor and graph backbone.',
  },
  {
    id: 'signals-lab',
    label: 'Signals & Early Warning Lab',
    consolidatedToolId: 'timeline',
    status: 'in-development',
    userCases: ['risk teams', 'humanitarian access teams', 'country desks'],
    toolIds: ['early-warning', 'risk-monitor', 'alert-center', 'calendar', 'geospatial-monitor', 'humanitarian', 'electoral-risk', 'peacebuilding-index', 'economic-impact'],
    nextLiveAiUpgrade: 'Combine saved alerts, event timelines, geospatial cues, and risk deltas into live warning narratives with refresh budgets.',
  },
  {
    id: 'briefing-legal-lab',
    label: 'Briefing, Legal & Export Lab',
    consolidatedToolId: 'briefing-studio',
    status: 'active-support',
    userCases: ['policy officers', 'legal/sanctions teams', 'executive briefers'],
    toolIds: ['policy-memo', 'talking-points', 'dossier', 'report-studio', 'un-toolkit', 'legal-tracker', 'sanctions', 'treaty-analyzer', 'human-rights'],
    nextLiveAiUpgrade: 'Make every specialist draft inherit the same citations, source receipts, graph provenance, and export-ready artifact structure.',
  },
];

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

export function getSpecializedToolDevelopmentGroups(
  consolidatedToolId?: string | null,
): SpecializedToolDevelopmentGroup[] {
  if (!consolidatedToolId) return SPECIALIZED_TOOL_DEVELOPMENT_GROUPS;
  return SPECIALIZED_TOOL_DEVELOPMENT_GROUPS.filter((group) => group.consolidatedToolId === consolidatedToolId);
}
