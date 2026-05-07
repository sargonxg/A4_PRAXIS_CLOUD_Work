import { CUSTOMIZABLE_SIDEBAR_TOOLS } from '@/lib/navigation/tool-preferences';
import { consolidatedToolForLegacyId } from '@/lib/constants/consolidated-tools';

const TOOL_HREF_OVERRIDES: Record<string, string> = {
  'actor-profiles': '/workbench?tab=context',
  'alert-center': '/workbench#desk',
  assistant: '/workbench#research',
  'brief-builder': '/workbench#draft',
  'brainstorming-table': '/workbench#boardroom',
  'context-builder': '/workbench?tab=context',
  'deep-research': '/workbench#research',
  compare: '/workbench#research',
  'info-environment': '/workbench#research',
  'auto-briefings': '/workbench#draft',
  scenarios: '/workbench#boardroom',
  'media-compass': '/workbench#research',
  'media-roundup': '/workbench#research',
  team: '/settings',
  'electoral-risk': '/workbench#desk',
  'peacebuilding-index': '/workbench#desk',
  graphops: '/workbench?tab=graph',
  'red-team-review': '/workbench#boardroom',
  'report-studio': '/workbench#draft',
  reports: '/workbench#draft',
  'situation-intelligence': '/workbench#desk',
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
  if (tab === 'context' || tab === 'library' || tab === 'graph') return `/workbench?tab=${tab}`;
  if (tab) return `/workbench#${tab}`;
  return CUSTOMIZABLE_SIDEBAR_TOOLS.find((tool) => tool.toolId === toolId)?.href ?? `/${toolId}`;
}

export function hrefForSituationSettings(situationId?: string | null): string {
  return situationId ? `/situations/${situationId}/settings` : '/situations/new';
}
