import { CONSOLIDATED_ANCHOR_TOOL_IDS } from '@/lib/constants/consolidated-tools';

export interface ToolGroupDefinition {
  id: string;
  label: string;
  description: string;
  toolIds: string[];
}

export const CORE_MVP_TOOL_IDS = [...CONSOLIDATED_ANCHOR_TOOL_IDS] as const;

export const TOOL_GROUPS: ToolGroupDefinition[] = [
  {
    id: 'core',
    label: 'Consolidated situation workspace',
    description: 'The ten primary PRAXIS surfaces: orient, build context, research, manage documents, maintain graph, visualize, map actors, ask questions, and produce briefs.',
    toolIds: [...CORE_MVP_TOOL_IDS],
  },
  {
    id: 'policy-legal',
    label: 'Policy, legal, and compliance',
    description: 'Specialized pages now feed the Briefing Studio so legal, sanctions, treaty, and policy work shares one output path.',
    toolIds: ['briefing', 'policy-memo', 'treaty-analyzer', 'human-rights', 'legal-tracker', 'sanctions'],
  },
  {
    id: 'mediation-simulation',
    label: 'Mediation and scenario design',
    description: 'Specialized pages now feed Actors & Stakeholders and Briefing Studio instead of competing for primary navigation.',
    toolIds: ['stakeholder-map', 'negotiation-prep', 'mediation-design', 'commitments', 'brainstorming-table'],
  },
  {
    id: 'research-feeds',
    label: 'Research and live feeds',
    description: 'Research agents and source-monitoring tools are consolidated behind Research & Sources, with premium providers used only on demand.',
    toolIds: ['source-scout', 'sources-library', 'argus', 'deep-search-agent', 'media-compass', 'info-environment'],
  },
];

export const CORE_MVP_TOOL_SET = new Set<string>(CORE_MVP_TOOL_IDS);
