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
  { section: 'Core', label: 'Dashboard', href: '/dashboard', toolId: 'dashboard' },
  { section: 'Core', label: 'Context Builder', href: '/context-builder', toolId: 'context-builder' },
  { section: 'Core', label: 'Executive Intelligence', href: '/dashboard#executive-intelligence', toolId: 'situation-intelligence' },
  { section: 'Evidence', label: 'Research & Sources', href: '/source-scout', toolId: 'source-scout' },
  { section: 'Graph', label: 'Conflict Graph', href: '/conflict-graph', toolId: 'conflict-graph' },
  { section: 'Graph', label: 'GraphOps', href: '/graphops', toolId: 'graphops' },
  { section: 'Analysis', label: 'Advisor Table', href: '/brainstorming-table', toolId: 'brainstorming-table' },
  { section: 'Analysis', label: 'Briefing Studio', href: '/briefing', toolId: 'briefing' },
  { section: 'Analysis', label: 'Policy Memo', href: '/policy-memo', toolId: 'policy-memo' },
  { section: 'Diplomacy', label: 'Scenarios', href: '/scenarios', toolId: 'scenarios' },
  { section: 'Diplomacy', label: 'Negotiation Prep', href: '/negotiation-prep', toolId: 'negotiation-prep' },
  { section: 'Diplomacy', label: 'Treaty Analyzer', href: '/treaty-analyzer', toolId: 'treaty-analyzer' },
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
  const orderIndex = new Map<string, number>();

  for (const id of preferences.toolOrder) {
    const normalized = normalizeToolPreferenceId(id);
    if (!orderIndex.has(normalized)) {
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
