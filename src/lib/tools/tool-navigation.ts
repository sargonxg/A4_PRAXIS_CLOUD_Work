import { CUSTOMIZABLE_SIDEBAR_TOOLS } from '@/lib/navigation/tool-preferences';

const TOOL_HREF_OVERRIDES: Record<string, string> = {
  assistant: '/assistant',
  boardroom: '/boardroom',
  'brainstorming-table': '/advisory',
  context: '/context',
  'context-builder': '/context-builder',
  dashboard: '/dashboard',
  desk: '/desk',
  draft: '/draft',
  'conflict-graph': '/conflict-graph',
  graph: '/graph',
  graphops: '/graphops',
  library: '/library',
  'policy-memo': '/policy-memo',
  research: '/research',
  'report-studio': '/reports',
  reports: '/reports',
  'situation-intelligence': '/dashboard',
  'sources-library': '/sources',
  sources: '/sources',
  'source-scout': '/source-scout',
  'stakeholder-map': '/stakeholder-map',
  timeline: '/timeline',
};

export function hrefForTool(toolId: string): string {
  if (TOOL_HREF_OVERRIDES[toolId]) return TOOL_HREF_OVERRIDES[toolId];
  return CUSTOMIZABLE_SIDEBAR_TOOLS.find((tool) => tool.toolId === toolId)?.href ?? `/${toolId}`;
}

export function hrefForSituationSettings(situationId?: string | null): string {
  return situationId ? `/situations/${situationId}/settings` : '/situations/new';
}
