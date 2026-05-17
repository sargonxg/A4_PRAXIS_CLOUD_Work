export type ProductExperienceAreaId = 'home' | 'ask' | 'situation' | 'sources' | 'outputs' | 'advanced';

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
    defaultHref: '/app',
  },
  {
    id: 'ask',
    label: 'Ask PRAXIS',
    shortLabel: 'Ask',
    summary: 'Ask from the active User, Situation, Source, Graph, Memory, and Output cores.',
    mobilePriority: 'primary',
    defaultHref: '/app?panel=ask',
  },
  {
    id: 'situation',
    label: 'Canvas',
    shortLabel: 'Canvas',
    summary: 'Inspect or arrange context when the working stack needs a spatial view.',
    mobilePriority: 'primary',
    defaultHref: '/app?panel=canvas',
  },
  {
    id: 'sources',
    label: 'Library',
    shortLabel: 'Library',
    summary: 'Upload documents and sources into knowledge cores.',
    mobilePriority: 'primary',
    defaultHref: '/app?panel=library',
  },
  {
    id: 'outputs',
    label: 'Memo Studio',
    shortLabel: 'Memo',
    summary: 'Write briefs, memos, and handovers from the active context.',
    mobilePriority: 'primary',
    defaultHref: '/app?panel=memo',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    shortLabel: 'More',
    summary: 'Deep controls, tools, graph operations, admin, and settings.',
    mobilePriority: 'advanced',
    defaultHref: '/app?panel=advanced',
  },
];

export const PRODUCT_EXPERIENCE_ROUTES: ProductExperienceRoute[] = [
  { pattern: '/app', area: 'home', label: 'Unified PRAXIS cockpit', mobilePriority: 'primary' },
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
  return PRODUCT_EXPERIENCE_ROUTES.filter((route) => route.area === area).length;
}
