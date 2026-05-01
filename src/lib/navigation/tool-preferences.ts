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
  { section: 'Core', label: 'Ask PRAXIS', href: '/assistant', toolId: 'assistant' },
  { section: 'Core', label: 'Tools Workspace', href: '/tools', toolId: 'tools-workspace' },
  { section: 'Evidence', label: 'Research & Sources', href: '/source-scout', toolId: 'source-scout' },
  { section: 'Evidence', label: 'Sources Library', href: '/sources', toolId: 'sources-library' },
  { section: 'Evidence', label: 'Documents', href: '/documents', toolId: 'documents' },
  { section: 'Graph', label: 'GraphOps', href: '/graphops', toolId: 'graphops' },
  { section: 'Graph', label: 'Conflict Graph', href: '/conflict-graph', toolId: 'conflict-graph' },
  { section: 'Graph', label: 'Timeline', href: '/timeline', toolId: 'timeline' },
  { section: 'Analysis', label: 'Actors & Stakeholders', href: '/stakeholder-map', toolId: 'stakeholder-map' },
  { section: 'Analysis', label: 'Briefing Studio', href: '/briefing', toolId: 'briefing' },
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
