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
    summary: 'Choose workspace, choose Situation, resume recent work, and start with Ask PRAXIS.',
    mobilePriority: 'primary',
    defaultHref: '/app/home',
  },
  {
    id: 'ask',
    label: 'Ask PRAXIS',
    shortLabel: 'Ask',
    summary: 'Explain, diagnose, plan, act, review, and produce from one command plane.',
    mobilePriority: 'primary',
    defaultHref: '/app/ask',
  },
  {
    id: 'cores',
    label: 'Cores Library',
    shortLabel: 'Cores',
    summary: 'User, Situation, Source, Document, Graph, and Output Cores that can be attached, reused, forked, and inherited.',
    mobilePriority: 'primary',
    defaultHref: '/app/cores',
  },
  {
    id: 'outputs',
    label: 'Outputs',
    shortLabel: 'Outputs',
    summary: 'Handovers, briefs, memos, drafts, and export-ready packages.',
    mobilePriority: 'primary',
    defaultHref: '/app/outputs',
  },
];

export const PRODUCT_EXPERIENCE_ROUTES: ProductExperienceRoute[] = [
  { pattern: '/app', area: 'home', label: 'App redirect', mobilePriority: 'primary' },
  { pattern: '/app/home', area: 'home', label: 'Home', mobilePriority: 'primary' },
  { pattern: '/app/ask', area: 'ask', label: 'Ask PRAXIS', mobilePriority: 'primary' },
  { pattern: '/app/ask/[threadId]', area: 'ask', label: 'Ask PRAXIS thread', mobilePriority: 'primary' },
  { pattern: '/app/cores', area: 'cores', label: 'Cores Library', mobilePriority: 'primary' },
  { pattern: '/app/cores/me', area: 'cores', label: 'My Core', mobilePriority: 'primary' },
  { pattern: '/app/situation', area: 'cores', label: 'Situation Core compatibility route', mobilePriority: 'secondary' },
  { pattern: '/app/sources', area: 'cores', label: 'Sources compatibility route', mobilePriority: 'secondary' },
  { pattern: '/app/outputs', area: 'outputs', label: 'Outputs', mobilePriority: 'primary' },
  { pattern: '/app/advanced', area: 'cores', label: 'Advanced compatibility route', mobilePriority: 'advanced' },
  { pattern: '/app/dashboard', area: 'home', label: 'Home dashboard', mobilePriority: 'primary' },
  { pattern: '/app/cases', area: 'home', label: 'Case library', mobilePriority: 'secondary' },
  { pattern: '/app/situations', area: 'home', label: 'Situations', mobilePriority: 'secondary' },
  { pattern: '/app/situations/new', area: 'home', label: 'New Situation', mobilePriority: 'secondary' },
  { pattern: '/app/syria-case', area: 'cores', label: 'Example case compatibility route', mobilePriority: 'secondary' },
  { pattern: '/app/workbench', area: 'cores', label: 'Situation picker', mobilePriority: 'primary' },
  { pattern: '/app/workbench/[caseId]', area: 'cores', label: 'Situation Core', mobilePriority: 'primary' },
  { pattern: '/app/workbench/[caseId]/ach', area: 'cores', label: 'ACH', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/ach/[achId]', area: 'cores', label: 'ACH matrix', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/boardroom', area: 'cores', label: 'Boardroom', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/boardroom/new', area: 'cores', label: 'New Boardroom', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/boardroom/[deliberationId]', area: 'cores', label: 'Boardroom room', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/boardroom/[deliberationId]/synthesis', area: 'outputs', label: 'Boardroom synthesis', mobilePriority: 'secondary' },
  { pattern: '/app/tools', area: 'cores', label: 'Analyst Skills compatibility route', mobilePriority: 'advanced' },
  { pattern: '/app/tools/archive', area: 'cores', label: 'Skill archive', mobilePriority: 'advanced' },
  { pattern: '/app/profile', area: 'cores', label: 'Working profile', mobilePriority: 'advanced' },
  { pattern: '/app/settings', area: 'cores', label: 'Settings', mobilePriority: 'advanced' },
  { pattern: '/app/settings/api-keys', area: 'cores', label: 'API keys', mobilePriority: 'advanced' },
  { pattern: '/app/settings/graph-backend', area: 'cores', label: 'Graph backend settings', mobilePriority: 'advanced' },
  { pattern: '/app/settings/model-preferences', area: 'cores', label: 'Model preferences', mobilePriority: 'advanced' },
  { pattern: '/app/settings/notifications', area: 'cores', label: 'Notifications', mobilePriority: 'advanced' },
  { pattern: '/app/settings/personas', area: 'cores', label: 'Personas', mobilePriority: 'advanced' },
  { pattern: '/app/settings/personas/new', area: 'cores', label: 'New persona', mobilePriority: 'advanced' },
  { pattern: '/app/settings/personas/[personaId]', area: 'cores', label: 'Persona settings', mobilePriority: 'advanced' },
  { pattern: '/app/settings/preferences', area: 'cores', label: 'Preferences', mobilePriority: 'advanced' },
  { pattern: '/app/settings/profile', area: 'cores', label: 'Profile settings', mobilePriority: 'advanced' },
  { pattern: '/app/settings/system-health', area: 'cores', label: 'System health', mobilePriority: 'advanced' },
  { pattern: '/app/admin', area: 'cores', label: 'Admin', mobilePriority: 'advanced' },
  { pattern: '/app/admin/advisor-feed', area: 'cores', label: 'Advisor feed admin', mobilePriority: 'advanced' },
  { pattern: '/app/admin/advisors', area: 'cores', label: 'Advisors admin', mobilePriority: 'advanced' },
  { pattern: '/app/admin/diagnostics', area: 'cores', label: 'Diagnostics', mobilePriority: 'advanced' },
  { pattern: '/app/admin/domains', area: 'cores', label: 'Domains admin', mobilePriority: 'advanced' },
  { pattern: '/app/admin/operator-console', area: 'cores', label: 'Operator console', mobilePriority: 'advanced' },
  { pattern: '/app/admin/users', area: 'cores', label: 'Users admin', mobilePriority: 'advanced' },
];

export const WORKBENCH_TAB_EXPERIENCE: Record<string, ProductExperienceAreaId> = {
  context: 'cores',
  library: 'cores',
  ontology: 'cores',
  graph: 'cores',
  desk: 'home',
  research: 'cores',
  memos: 'outputs',
  draft: 'outputs',
  ach: 'cores',
  tools: 'cores',
  boardroom: 'cores',
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
