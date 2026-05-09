import { TOOL_REGISTRY } from '@/lib/constants/tool-registry';
import type { ToolCategory, ToolDefinition } from '@/types/situation';

export type V7SkillCategory = 'structure' | 'research' | 'analysis' | 'production' | 'operations';

export type V7OntologyCompat =
  | 'conflict'
  | 'mediation'
  | 'governance'
  | 'narrative'
  | 'humanitarian'
  | 'legal'
  | 'economic'
  | 'security'
  | 'generic';

export interface V7SkillManifestEntry {
  toolId: string;
  skillCategory: V7SkillCategory;
  ontologyCompat: V7OntologyCompat[];
  structural: boolean;
  visibleInV7: boolean;
}

const CATEGORY_MAP: Record<ToolCategory, V7SkillCategory> = {
  context: 'structure',
  intelligence: 'research',
  analysis: 'analysis',
  simulation: 'analysis',
  drafting: 'production',
  workspace: 'operations',
};

const ALL_ONTOLOGIES: V7OntologyCompat[] = [
  'conflict',
  'mediation',
  'governance',
  'narrative',
  'humanitarian',
  'legal',
  'economic',
  'security',
];

export function getV7SkillManifestEntry(tool: ToolDefinition): V7SkillManifestEntry {
  return {
    toolId: tool.id,
    skillCategory: CATEGORY_MAP[tool.category],
    ontologyCompat: inferOntologyCompat(tool),
    structural: tool.tier === 'deterministic-structural',
    visibleInV7: tool.surface === 'hero' && tool.visible,
  };
}

export function getV7SkillManifest(): V7SkillManifestEntry[] {
  return TOOL_REGISTRY.map(getV7SkillManifestEntry);
}

function inferOntologyCompat(tool: ToolDefinition): V7OntologyCompat[] {
  const haystack = [
    tool.id,
    tool.name,
    tool.category,
    tool.description,
    tool.shortDescription,
    tool.dataSchema,
    ...tool.frameworks,
    ...tool.relatedTools,
  ].join(' ').toLowerCase();

  const matches = new Set<V7OntologyCompat>();

  if (containsAny(haystack, ['mediation', 'negotiation', 'zopa', 'settlement'])) matches.add('mediation');
  if (containsAny(haystack, ['governance', 'electoral', 'institution', 'policy', 'coalition'])) matches.add('governance');
  if (containsAny(haystack, ['narrative', 'media', 'information', 'messaging', 'talking points'])) matches.add('narrative');
  if (containsAny(haystack, ['humanitarian', 'displacement', 'ocha', 'food security', 'protection'])) matches.add('humanitarian');
  if (containsAny(haystack, ['legal', 'treaty', 'ihl', 'human rights', 'sanctions', 'resolution'])) matches.add('legal');
  if (containsAny(haystack, ['economic', 'finance', 'sanctions', 'gdp', 'trade'])) matches.add('economic');
  if (containsAny(haystack, ['security', 'risk', 'warning', 'military', 'escalation'])) matches.add('security');
  if (containsAny(haystack, ['conflict', 'actor', 'claim', 'interest', 'constraint', 'graph', 'aco'])) matches.add('conflict');

  if (tool.category === 'workspace') return ['generic'];
  if (matches.size === 0 && tool.category === 'context') return ['conflict', 'generic'];
  if (matches.size === 0 && tool.category === 'drafting') return ALL_ONTOLOGIES;
  if (matches.size === 0) return ['conflict'];

  return Array.from(matches);
}

function containsAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}
