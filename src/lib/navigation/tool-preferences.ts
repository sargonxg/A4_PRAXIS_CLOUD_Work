import type { UserPreferences } from '@/types/preferences';

export interface CustomizableToolItem {
  section: string;
  label: string;
  href: string;
  toolId: string;
}

const LEGACY_TOOL_ID_ALIASES: Record<string, string> = {
  sources: 'sources-library',
};

export const CUSTOMIZABLE_SIDEBAR_TOOLS: CustomizableToolItem[] = [
  { section: 'Situation', label: 'Dashboard', href: '/dashboard', toolId: 'dashboard' },
  { section: 'Situation', label: 'Conflict Graph', href: '/conflict-graph', toolId: 'conflict-graph' },
  { section: 'Situation', label: 'Timeline', href: '/timeline', toolId: 'timeline' },
  { section: 'Intelligence', label: 'Stakeholder Map', href: '/stakeholder-map', toolId: 'stakeholder-map' },
  { section: 'Intelligence', label: 'Escalation Monitor', href: '/early-warning', toolId: 'early-warning' },
  { section: 'Intelligence', label: 'Intelligence Requirements', href: '/requirements', toolId: 'pir' },
  { section: 'Intelligence', label: 'Commitment Tracker', href: '/commitments', toolId: 'commitments' },
  { section: 'Intelligence', label: 'Info Environment', href: '/info-environment', toolId: 'info-environment' },
  { section: 'Intelligence', label: 'Geospatial Monitor', href: '/geospatial-monitor', toolId: 'geospatial-monitor' },
  { section: 'Analysis', label: 'Scenario Planner', href: '/scenarios', toolId: 'scenarios' },
  { section: 'Analysis', label: 'Risk Assessment', href: '/risk-monitor', toolId: 'risk-monitor' },
  { section: 'Analysis', label: 'Negotiation Prep', href: '/negotiation-prep', toolId: 'negotiation-prep' },
  { section: 'Analysis', label: 'Media & Narrative', href: '/media-compass', toolId: 'media-compass' },
  { section: 'Analysis', label: 'Sanctions & Compliance', href: '/sanctions', toolId: 'sanctions' },
  { section: 'Analysis', label: 'Treaty Analysis', href: '/treaty-analyzer', toolId: 'treaty-analyzer' },
  { section: 'Analysis', label: 'Human Rights Monitor', href: '/human-rights', toolId: 'human-rights' },
  { section: 'Analysis', label: 'Electoral Violence Risk', href: '/electoral-risk', toolId: 'electoral-risk' },
  { section: 'Analysis', label: 'Peacebuilding Index', href: '/peacebuilding-index', toolId: 'peacebuilding-index' },
  { section: 'Analysis', label: 'Economic Impact', href: '/economic-impact', toolId: 'economic-impact' },
  { section: 'Analysis', label: 'Historical Parallels', href: '/compare', toolId: 'compare' },
  { section: 'Analysis', label: 'Game Theory', href: '/game-theory', toolId: 'game-theory' },
  { section: 'Analysis', label: 'Power Map', href: '/power-map', toolId: 'power-map' },
  { section: 'Production', label: 'Intelligence Briefing', href: '/briefing', toolId: 'briefing' },
  { section: 'Production', label: 'Diplomatic Dossier', href: '/dossier', toolId: 'dossier' },
  { section: 'Production', label: 'Talking Points', href: '/talking-points', toolId: 'talking-points' },
  { section: 'Production', label: 'Policy Memo', href: '/policy-memo', toolId: 'policy-memo' },
  { section: 'Production', label: 'Mediation Design', href: '/mediation-design', toolId: 'mediation-design' },
  { section: 'Production', label: 'UN Toolkit', href: '/un-toolkit', toolId: 'un-toolkit' },
  { section: 'Production', label: 'Daily Brief', href: '/auto-briefings', toolId: 'auto-briefing' },
  { section: 'Research', label: 'Deep Research Agent', href: '/deep-search-agent', toolId: 'deep-search-agent' },
  { section: 'Research', label: 'ARGUS', href: '/argus', toolId: 'argus' },
  { section: 'Research', label: 'Sources Library', href: '/sources', toolId: 'sources-library' },
  { section: 'Research', label: 'Actor Enrichment', href: '/actors', toolId: 'actor-profiles' },
  { section: 'Research', label: 'External Actor Monitor', href: '/external-actors', toolId: 'external-actors' },
  { section: 'Research', label: 'Legal & Resolution Tracker', href: '/legal-tracker', toolId: 'legal-tracker' },
  { section: 'Workspace', label: 'Ask PRAXIS', href: '/assistant', toolId: 'assistant' },
  { section: 'Workspace', label: 'Documents', href: '/documents', toolId: 'documents' },
  { section: 'Workspace', label: 'Report Studio', href: '/reports', toolId: 'report-studio' },
  { section: 'Workspace', label: 'Export Center', href: '/export-center', toolId: 'export-center' },
  { section: 'Workspace', label: 'Case Library', href: '/cases', toolId: 'cases' },
  { section: 'Workspace', label: 'Team Hub', href: '/team', toolId: 'team' },
  { section: 'Workspace', label: 'Humanitarian', href: '/humanitarian', toolId: 'humanitarian' },
];

export function normalizeToolPreferenceId(toolId: string): string {
  return LEGACY_TOOL_ID_ALIASES[toolId] ?? toolId;
}

export function orderedToolIds(preferences: Pick<UserPreferences, 'toolOrder'>): string[] {
  const known = CUSTOMIZABLE_SIDEBAR_TOOLS.map((tool) => tool.toolId);
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const id of preferences.toolOrder) {
    const normalized = normalizeToolPreferenceId(id);
    if (known.includes(normalized) && !seen.has(normalized)) {
      seen.add(normalized);
      ordered.push(normalized);
    }
  }

  for (const id of known) {
    if (!seen.has(id)) ordered.push(id);
  }

  return ordered;
}

export function hiddenToolSet(preferences: Pick<UserPreferences, 'hiddenToolIds'>): Set<string> {
  return new Set(preferences.hiddenToolIds.map(normalizeToolPreferenceId));
}

export function isToolHiddenByPreference(
  preferences: Pick<UserPreferences, 'hiddenToolIds'>,
  toolId: string,
): boolean {
  return hiddenToolSet(preferences).has(normalizeToolPreferenceId(toolId));
}

export function applyToolPreferences<T extends { toolId: string }>(
  items: T[],
  preferences: Pick<UserPreferences, 'hiddenToolIds' | 'toolOrder'>,
): T[] {
  const hidden = hiddenToolSet(preferences);
  const known = new Set(CUSTOMIZABLE_SIDEBAR_TOOLS.map((tool) => tool.toolId));
  const orderIndex = new Map<string, number>();

  for (const id of preferences.toolOrder) {
    const normalized = normalizeToolPreferenceId(id);
    if (known.has(normalized) && !orderIndex.has(normalized)) {
      orderIndex.set(normalized, orderIndex.size);
    }
  }

  return items
    .filter((item) => !hidden.has(normalizeToolPreferenceId(item.toolId)))
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aIndex = orderIndex.get(normalizeToolPreferenceId(a.item.toolId)) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = orderIndex.get(normalizeToolPreferenceId(b.item.toolId)) ?? Number.MAX_SAFE_INTEGER;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}
