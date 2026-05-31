import { CUSTOMIZABLE_SIDEBAR_TOOLS } from '@/lib/navigation/tool-preferences';
import { consolidatedToolForLegacyId } from '@/lib/constants/consolidated-tools';

const TOOL_HREF_OVERRIDES: Record<string, string> = {
  'actor-profiles': '/app/capsules',
  'alert-center': '/app',
  assistant: '/app?panel=ask',
  'brief-builder': '/app?panel=memo',
  'brainstorming-table': '/app?panel=advanced',
  'context-builder': '/app/capsules',
  'deep-research': '/app?panel=ask',
  compare: '/app?panel=ask',
  'info-environment': '/app?panel=ask',
  'auto-briefings': '/app?panel=memo',
  scenarios: '/app?panel=advanced',
  'media-compass': '/app?panel=ask',
  'media-roundup': '/app?panel=ask',
  team: '/app?panel=account',
  'electoral-risk': '/app',
  'peacebuilding-index': '/app',
  graphops: '/app?panel=canvas',
  'red-team-review': '/app?panel=advanced',
  'report-studio': '/app?panel=memo',
  reports: '/app?panel=memo',
  'situation-intelligence': '/app',
  'sources-library': '/app?panel=library',
  sources: '/app?panel=library',
};

const CONSOLIDATED_TOOL_TAB: Record<string, string> = {
  'situation-dashboard': 'desk',
  'context-builder': 'context',
  'ask-praxis': 'research',
  'research-sources': 'research',
  documents: 'library',
  graphops: 'graph',
  timeline: 'graph',
  'actors-stakeholders': 'context',
  'briefing-studio': 'draft',
  'advisory-council': 'tools',
};

export function hrefForTool(toolId: string): string {
  if (TOOL_HREF_OVERRIDES[toolId]) return TOOL_HREF_OVERRIDES[toolId];
  const consolidated = consolidatedToolForLegacyId(toolId);
  const tab = consolidated ? CONSOLIDATED_TOOL_TAB[consolidated.id] : null;
  if (tab === 'context') return '/app/capsules';
  if (tab === 'library') return '/app?panel=library';
  if (tab === 'graph') return '/app?panel=canvas';
  if (tab === 'draft') return '/app?panel=memo';
  if (tab === 'tools') return '/app?panel=advanced';
  if (tab) return '/app?panel=ask';
  return CUSTOMIZABLE_SIDEBAR_TOOLS.find((tool) => tool.toolId === toolId)?.href ?? '/app';
}

export function hrefForSituationSettings(situationId?: string | null): string {
  return situationId ? `/app?situationId=${encodeURIComponent(situationId)}&panel=account` : '/app?panel=builder';
}
