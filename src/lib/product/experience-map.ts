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
    defaultHref: '/app/dashboard',
  },
  {
    id: 'ask',
    label: 'Ask PRAXIS',
    shortLabel: 'Ask',
    summary: 'Explain, diagnose, plan, act, review, and produce from one command plane.',
    mobilePriority: 'primary',
    defaultHref: '/app/dashboard#ask-praxis',
  },
  {
    id: 'situation',
    label: 'Situation Model',
    shortLabel: 'Situation',
    summary: 'The TACITUS model of stakeholders, stakes, episodes, hypotheses, open threads, and counsel.',
    mobilePriority: 'advanced',
    defaultHref: '/app/workbench',
  },
  {
    id: 'sources',
    label: 'Sources',
    shortLabel: 'Sources',
    summary: 'Evidence intake, source receipts, context coverage, and claim review.',
    mobilePriority: 'primary',
    defaultHref: '/app/workbench/syria-2026?tab=library',
  },
  {
    id: 'outputs',
    label: 'Outputs',
    shortLabel: 'Outputs',
    summary: 'Handovers, briefs, memos, drafts, and export-ready packages.',
    mobilePriority: 'primary',
    defaultHref: '/app/workbench/syria-2026?openChapter=draft',
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
  { pattern: '/app/cases', area: 'home', label: 'Case library', mobilePriority: 'secondary' },
  { pattern: '/app/situations', area: 'home', label: 'Situations', mobilePriority: 'secondary' },
  { pattern: '/app/situations/new', area: 'home', label: 'New Situation', mobilePriority: 'secondary' },
  { pattern: '/app/syria-case', area: 'situation', label: 'Syria showcase', mobilePriority: 'secondary' },
  { pattern: '/app/workbench', area: 'situation', label: 'Situation picker', mobilePriority: 'primary' },
  { pattern: '/app/workbench/[caseId]', area: 'situation', label: 'Situation Model', mobilePriority: 'primary' },
  { pattern: '/app/workbench/[caseId]/ach', area: 'advanced', label: 'ACH', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/ach/[achId]', area: 'advanced', label: 'ACH matrix', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/boardroom', area: 'advanced', label: 'Boardroom', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/boardroom/new', area: 'advanced', label: 'New Boardroom', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/boardroom/[deliberationId]', area: 'advanced', label: 'Boardroom room', mobilePriority: 'advanced' },
  { pattern: '/app/workbench/[caseId]/boardroom/[deliberationId]/synthesis', area: 'outputs', label: 'Boardroom synthesis', mobilePriority: 'secondary' },
  { pattern: '/app/tools', area: 'advanced', label: 'Advanced tools', mobilePriority: 'advanced' },
  { pattern: '/app/tools/archive', area: 'advanced', label: 'Tool archive', mobilePriority: 'advanced' },
  { pattern: '/app/profile', area: 'advanced', label: 'Working profile', mobilePriority: 'advanced' },
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
