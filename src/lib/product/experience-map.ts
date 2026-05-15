import { AGENTIC_WORKFLOWS, type AgenticWorkflowArea } from '@/lib/agentic-workflows/registry';

export type ProductExperienceAreaId = AgenticWorkflowArea;

export interface ProductExperienceArea {
  id: ProductExperienceAreaId;
  label: string;
  shortLabel: string;
  summary: string;
  mobilePriority: 'primary' | 'secondary' | 'advanced';
  defaultHref: string;
}

export interface ProductExperienceRoute {
  pattern: string;
  area: ProductExperienceAreaId;
  label: string;
  mobilePriority: 'primary' | 'secondary' | 'advanced';
}

export const PRODUCT_EXPERIENCE_AREAS: ProductExperienceArea[] = [
  {
    id: 'home',
    label: 'Home',
    shortLabel: 'Home',
    summary: 'Choose or create context, then ask PRAXIS from that active stack.',
    mobilePriority: 'primary',
    defaultHref: '/app/dashboard',
  },
  {
    id: 'ask',
    label: 'Ask PRAXIS',
    shortLabel: 'Ask',
    summary: 'Ask from the active User, Situation, Source, Graph, Memory, and Output cores.',
    mobilePriority: 'primary',
    defaultHref: '/app/assistant',
  },
  {
    id: 'situation',
    label: 'Canvas',
    shortLabel: 'Canvas',
    summary: 'Inspect or arrange context when the working stack needs a spatial view.',
    mobilePriority: 'primary',
    defaultHref: '/app/canvas',
  },
  {
    id: 'sources',
    label: 'Library',
    shortLabel: 'Library',
    summary: 'Upload documents and sources into knowledge cores.',
    mobilePriority: 'primary',
    defaultHref: '/app/workbench',
  },
  {
    id: 'outputs',
    label: 'Memo Studio',
    shortLabel: 'Memo',
    summary: 'Write briefs, memos, and handovers from the active context.',
    mobilePriority: 'primary',
    defaultHref: '/app/write',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    shortLabel: 'More',
    summary: 'Deep controls, tools, ACH, Boardroom, graph operations, admin, and settings.',
    mobilePriority: 'advanced',
    defaultHref: '/app/tools',
  },
];

export const PRODUCT_EXPERIENCE_ROUTES: ProductExperienceRoute[] = [
  { pattern: '/app', area: 'home', label: 'App redirect', mobilePriority: 'primary' },
  { pattern: '/app/dashboard', area: 'home', label: 'Home dashboard', mobilePriority: 'primary' },
  { pattern: '/app/assistant', area: 'ask', label: 'Ask PRAXIS workspace', mobilePriority: 'primary' },
  // /app/cases is folded into /app/workbench via server redirect.
  { pattern: '/app/cases', area: 'home', label: 'Workbench (legacy redirect)', mobilePriority: 'secondary' },
  { pattern: '/app/contexts', area: 'sources', label: 'Core Library', mobilePriority: 'secondary' },
  // /app/situations folds into /app/contexts; /app/situations/new stays live during v6 transition.
  { pattern: '/app/situations', area: 'home', label: 'Cores (legacy redirect)', mobilePriority: 'secondary' },
  { pattern: '/app/situations/new', area: 'home', label: 'New Situation wizard', mobilePriority: 'secondary' },
  { pattern: '/app/cores/context', area: 'advanced', label: 'Context Core', mobilePriority: 'advanced' },
  { pattern: '/app/cores/user', area: 'advanced', label: 'User Core', mobilePriority: 'advanced' },
  { pattern: '/app/syria-case', area: 'situation', label: 'Syria showcase', mobilePriority: 'secondary' },
  { pattern: '/app/workbench', area: 'sources', label: 'Library', mobilePriority: 'primary' },
  { pattern: '/app/workbench/[caseId]', area: 'sources', label: 'Library case', mobilePriority: 'primary' },
  { pattern: '/app/workbench/[caseId]/ach', area: 'advanced', label: 'ACH', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/ach/[achId]', area: 'advanced', label: 'ACH matrix', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/boardroom', area: 'advanced', label: 'Boardroom', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/boardroom/new', area: 'advanced', label: 'New Boardroom', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/boardroom/[deliberationId]', area: 'advanced', label: 'Boardroom room', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/boardroom/[deliberationId]/synthesis', area: 'outputs', label: 'Boardroom synthesis', mobilePriority: 'secondary' },
  { pattern: '/app/write', area: 'outputs', label: 'Write with PRAXIS', mobilePriority: 'primary' },
  { pattern: '/app/canvas', area: 'situation', label: 'Canvas', mobilePriority: 'primary' },
  { pattern: '/app/tools', area: 'advanced', label: 'Advanced tools', mobilePriority: 'advanced' },
  { pattern: '/app/tools/archive', area: 'advanced', label: 'Tool archive', mobilePriority: 'advanced' },
  // /app/profile is folded into /app/settings/profile via server redirect.
  { pattern: '/app/profile', area: 'advanced', label: 'Settings · profile (legacy redirect)', mobilePriority: 'advanced' },
  { pattern: '/app/settings', area: 'advanced', label: 'Settings', mobilePriority: 'advanced' },
  { pattern: '/app/settings/api-keys', area: 'advanced', label: 'API keys', mobilePriority: 'advanced' },
  { pattern: '/app/settings/graph-backend', area: 'advanced', label: 'Graph backend settings', mobilePriority: 'advanced' },
  { pattern: '/app/settings/model-preferences', area: 'advanced', label: 'Model preferences', mobilePriority: 'advanced' },
  { pattern: '/app/settings/notifications', area: 'advanced', label: 'Notifications', mobilePriority: 'advanced' },
  { pattern: '/app/settings/personas', area: 'advanced', label: 'Personas', mobilePriority: 'advanced' },
  { pattern: '/app/settings/personas/new', area: 'advanced', label: 'New persona', mobilePriority: 'advanced' },
  { pattern: '/app/settings/personas/[personaId]', area: 'advanced', label: 'Persona settings', mobilePriority: 'advanced' },
  { pattern: '/app/settings/preferences', area: 'advanced', label: 'Preferences', mobilePriority: 'advanced' },
  { pattern: '/app/settings/profile', area: 'advanced', label: 'Profile settings', mobilePriority: 'advanced' },
  { pattern: '/app/settings/system-health', area: 'advanced', label: 'System health', mobilePriority: 'advanced' },
  { pattern: '/app/admin', area: 'advanced', label: 'Admin', mobilePriority: 'advanced' },
  { pattern: '/app/admin/advisor-feed', area: 'advanced', label: 'Advisor feed admin', mobilePriority: 'advanced' },
  { pattern: '/app/admin/advisors', area: 'advanced', label: 'Advisors admin', mobilePriority: 'advanced' },
  { pattern: '/app/admin/diagnostics', area: 'advanced', label: 'Diagnostics', mobilePriority: 'advanced' },
  { pattern: '/app/admin/domains', area: 'advanced', label: 'Domains admin', mobilePriority: 'advanced' },
  { pattern: '/app/admin/operator-console', area: 'advanced', label: 'Operator console', mobilePriority: 'advanced' },
  { pattern: '/app/admin/users', area: 'advanced', label: 'Users admin', mobilePriority: 'advanced' },
];

export const WORKBENCH_TAB_EXPERIENCE: Record<string, ProductExperienceAreaId> = {
  context: 'sources',
  library: 'sources',
  ontology: 'situation',
  graph: 'situation',
  desk: 'home',
  research: 'sources',
  memos: 'outputs',
  draft: 'outputs',
  ach: 'advanced',
  tools: 'advanced',
  boardroom: 'advanced',
};

export const MOBILE_PRIMARY_EXPERIENCE = PRODUCT_EXPERIENCE_AREAS.filter(
  (area) => area.mobilePriority === 'primary',
);

export function getProductExperienceArea(id: ProductExperienceAreaId): ProductExperienceArea {
  const area = PRODUCT_EXPERIENCE_AREAS.find((item) => item.id === id);
  if (!area) throw new Error(`Unknown PRAXIS experience area: ${id}`);
  return area;
}

export function routeMatchesExperiencePattern(route: string, pattern: string): boolean {
  const routeParts = route.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);
  if (routeParts.length !== patternParts.length) return false;

  return patternParts.every((part, index) => part.startsWith('[') || part === routeParts[index]);
}

export function mapRouteToExperienceArea(route: string): ProductExperienceAreaId | null {
  return PRODUCT_EXPERIENCE_ROUTES.find((entry) => routeMatchesExperiencePattern(route, entry.pattern))?.area ?? null;
}

export function getWorkflowCountForArea(area: ProductExperienceAreaId): number {
  return AGENTIC_WORKFLOWS.filter((workflow) => workflow.primaryArea === area).length;
}
