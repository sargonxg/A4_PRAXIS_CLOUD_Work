import { CUSTOMIZABLE_SIDEBAR_TOOLS } from '@/lib/navigation/tool-preferences';
import { consolidatedToolForLegacyId } from '@/lib/constants/consolidated-tools';

const TOOL_HREF_OVERRIDES: Record<string, string> = {
  'actor-profiles': '/workbench?tab=context',
  'alert-center': '/workbench?tab=desk',
  assistant: '/workbench?tab=research',
  'brief-builder': '/workbench?tab=draft',
  'brainstorming-table': '/workbench?tab=boardroom',
  'context-builder': '/workbench?tab=context',
  'deep-research': '/workbench?tab=research',
  compare: '/workbench?tab=research',
  'info-environment': '/workbench?tab=research',
  'auto-briefings': '/workbench?tab=draft',
  scenarios: '/workbench?tab=boardroom',
  'media-compass': '/workbench?tab=research',
  'media-roundup': '/workbench?tab=research',
  team: '/settings',
  'electoral-risk': '/workbench?tab=desk',
  'peacebuilding-index': '/workbench?tab=desk',
  graphops: '/workbench?tab=graph',
  'red-team-review': '/workbench?tab=boardroom',
  'report-studio': '/workbench?tab=draft',
  reports: '/workbench?tab=draft',
  'situation-intelligence': '/workbench?tab=desk',
  'sources-library': '/workbench?tab=library',
  sources: '/workbench?tab=library',
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
  'advisory-council': 'boardroom',
};

export function hrefForTool(toolId: string): string {
  if (TOOL_HREF_OVERRIDES[toolId]) return TOOL_HREF_OVERRIDES[toolId];
  const consolidated = consolidatedToolForLegacyId(toolId);
  const tab = consolidated ? CONSOLIDATED_TOOL_TAB[consolidated.id] : null;
  if (tab) return `/workbench?tab=${tab}`;
  return CUSTOMIZABLE_SIDEBAR_TOOLS.find((tool) => tool.toolId === toolId)?.href ?? `/${toolId}`;
}

export function hrefForSituationSettings(situationId?: string | null): string {
  return situationId ? `/situations/${situationId}/settings` : '/situations/new';
}
