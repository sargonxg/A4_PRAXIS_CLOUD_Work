import { CUSTOMIZABLE_SIDEBAR_TOOLS } from '@/lib/navigation/tool-preferences';

const TOOL_HREF_OVERRIDES: Record<string, string> = {
  assistant: '/assistant',
  graphops: '/graphops',
  'report-studio': '/reports',
  reports: '/reports',
  'situation-intelligence': '/dashboard',
  'sources-library': '/sources',
  sources: '/sources',
};

export function hrefForTool(toolId: string): string {
  if (TOOL_HREF_OVERRIDES[toolId]) return TOOL_HREF_OVERRIDES[toolId];
  return CUSTOMIZABLE_SIDEBAR_TOOLS.find((tool) => tool.toolId === toolId)?.href ?? `/${toolId}`;
}

export function hrefForSituationSettings(situationId?: string | null): string {
  return situationId ? `/situations/${situationId}/settings` : '/situations/new';
}
