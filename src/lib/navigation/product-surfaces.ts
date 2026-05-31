export type ProductSurfaceId =
  | 'desk'
  | 'context'
  | 'library'
  | 'research'
  | 'graph'
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
    label: 'Home',
    href: '/app',
    toolId: 'dashboard',
    icon: 'LayoutDashboard',
    summary: 'Compact launchpad for Ask PRAXIS, active capsules, recent work, and next actions.',
  },
  {
    id: 'context',
    label: 'Capsules',
    href: '/app/capsules',
    toolId: 'context-builder',
    icon: 'Target',
    summary: 'ContextCapsule library, capsule builder, context health, and capsule repair.',
  },
  {
    id: 'library',
    label: 'Sources',
    href: '/app?panel=library',
    toolId: 'library',
    icon: 'Library',
    summary: 'Source packets, uploaded documents, work products, and evidence receipts.',
  },
  {
    id: 'research',
    label: 'Ask PRAXIS',
    href: '/app?panel=ask',
    toolId: 'source-scout',
    icon: 'Telescope',
    summary: 'Capsule-bound questions, grounded research, and durable agent handoff.',
  },
  {
    id: 'graph',
    label: 'Proof',
    href: '/app?panel=canvas',
    toolId: 'graphops',
    icon: 'GitBranch',
    summary: 'Receipts, source posture, graph proposals, and proof-oriented inspection.',
  },
  {
    id: 'draft',
    label: 'Memo',
    href: '/app?panel=memo',
    toolId: 'policy-memo',
    icon: 'PenSquare',
    summary: 'Memo Studio drafting, provenance chips, sourceability checks, and exports.',
  },
  {
    id: 'tools',
    label: 'Advanced',
    href: '/app?panel=advanced',
    toolId: 'tools',
    icon: 'PanelsTopLeft',
    summary: 'Specialist tools and archived capability entry points inside the cockpit.',
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
