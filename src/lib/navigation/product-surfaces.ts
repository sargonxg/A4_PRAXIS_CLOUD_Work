export type ProductSurfaceId =
  | 'desk'
  | 'context'
  | 'library'
  | 'research'
  | 'graph'
  | 'boardroom'
  | 'draft'
  | 'tools';

export interface ProductSurface {
  id: ProductSurfaceId;
  label: string;
  href: string;
  toolId: string;
  icon: string;
  summary: string;
}

export const PRODUCT_SURFACES: ProductSurface[] = [
  {
    id: 'desk',
    label: 'Desk',
    href: '/desk',
    toolId: 'dashboard',
    icon: 'LayoutDashboard',
    summary: 'Situation overview, what-changed feed, cost posture, and next actions.',
  },
  {
    id: 'context',
    label: 'Context',
    href: '/context',
    toolId: 'context-builder',
    icon: 'Target',
    summary: 'Intake, context health, source coverage, and workspace repair.',
  },
  {
    id: 'library',
    label: 'Library',
    href: '/library',
    toolId: 'library',
    icon: 'Library',
    summary: 'Sources and work products split into a single evidence library.',
  },
  {
    id: 'research',
    label: 'Research',
    href: '/research',
    toolId: 'source-scout',
    icon: 'Telescope',
    summary: 'Source Scout, deep research, and staged graph proposals.',
  },
  {
    id: 'graph',
    label: 'Graph',
    href: '/graph',
    toolId: 'graphops',
    icon: 'GitBranch',
    summary: 'GraphOps, read-only Cypher, and graph maintenance signals.',
  },
  {
    id: 'boardroom',
    label: 'Boardroom',
    href: '/boardroom',
    toolId: 'brainstorming-table',
    icon: 'MessagesSquare',
    summary: 'Five-advisor deliberation room with synthesis and Draft handoff.',
  },
  {
    id: 'draft',
    label: 'Draft',
    href: '/draft',
    toolId: 'policy-memo',
    icon: 'PenSquare',
    summary: 'Work-product editor with provenance chips and export manifest.',
  },
  {
    id: 'tools',
    label: 'Tools',
    href: '/tools',
    toolId: 'tools',
    icon: 'PanelsTopLeft',
    summary: 'Archive entry point for specialist and legacy routes.',
  },
];

export const PRODUCT_SURFACE_IDS = PRODUCT_SURFACES.map((surface) => surface.id);
export const PRODUCT_SURFACE_TOOL_IDS = PRODUCT_SURFACES.map((surface) => surface.toolId);

export function productSurfaceById(id: ProductSurfaceId): ProductSurface {
  const surface = PRODUCT_SURFACES.find((item) => item.id === id);
  if (!surface) {
    throw new Error(`Unknown PRAXIS product surface: ${id}`);
  }
  return surface;
}
