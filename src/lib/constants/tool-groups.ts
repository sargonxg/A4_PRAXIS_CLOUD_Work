export interface ToolGroupDefinition {
  id: string;
  label: string;
  description: string;
  toolIds: string[];
}

export const CORE_MVP_TOOL_IDS = [
  'dashboard',
  'early-warning',
  'risk-monitor',
  'actor-profiles',
  'stakeholder-map',
  'briefing',
  'talking-points',
  'negotiation-prep',
  'commitments',
  'sanctions',
] as const;

export const TOOL_GROUPS: ToolGroupDefinition[] = [
  {
    id: 'core',
    label: 'Core situation workspace',
    description: 'The first ten tools every PRAXIS situation should make usable: orient, assess, map actors, produce briefs, and track commitments.',
    toolIds: [...CORE_MVP_TOOL_IDS],
  },
  {
    id: 'policy-legal',
    label: 'Policy, legal, and compliance',
    description: 'Specialized policy tools for options, treaty obligations, human rights, sanctions, legal milestones, and external influence.',
    toolIds: ['policy-memo', 'treaty-analyzer', 'human-rights', 'legal-tracker', 'external-actors', 'economic-impact'],
  },
  {
    id: 'mediation-simulation',
    label: 'Mediation and scenario design',
    description: 'Tools for negotiation space, scenario stress testing, game theory, and process architecture.',
    toolIds: ['mediation-design', 'scenarios', 'game-theory', 'power-map', 'compare'],
  },
  {
    id: 'research-feeds',
    label: 'Research and live feeds',
    description: 'Research agents and source-monitoring tools that expand the evidence base behind every output.',
    toolIds: ['argus', 'deep-search-agent', 'sources-library', 'media-compass', 'info-environment', 'geospatial-monitor'],
  },
];

export const CORE_MVP_TOOL_SET = new Set<string>(CORE_MVP_TOOL_IDS);
