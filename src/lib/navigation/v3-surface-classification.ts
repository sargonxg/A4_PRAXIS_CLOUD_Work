import type { ConsolidatedToolDefinition } from '@/lib/constants/consolidated-tools';
import type { PrimaryNavItem } from './primary-nav';
import type { ProductSurfaceId } from './product-surfaces';

export type V3SurfaceClassification = 'LOOP' | 'TOOL_CAPSULE' | 'FOLD_IN' | 'LABS' | 'DELETE';
export type V3NavLabel = 'Ask' | 'Library' | 'Studio' | 'Runs' | 'Labs';

export interface V3NavMapping {
  label: V3NavLabel;
  route: string;
  classification: Exclude<V3SurfaceClassification, 'DELETE' | 'TOOL_CAPSULE'>;
  currentNavIds: readonly string[];
  productSurfaceIds: readonly ProductSurfaceId[];
  note: string;
}

export interface V3PrimaryRouteClassification {
  currentNavId: PrimaryNavItem['id'];
  currentLabel: string;
  currentHref: string;
  classification: V3SurfaceClassification;
  targetLabel?: V3NavLabel;
  note: string;
}

export interface V3ProductSurfaceClassification {
  surfaceId: ProductSurfaceId;
  currentLabel: string;
  classification: V3SurfaceClassification;
  targetLabel: V3NavLabel;
  note: string;
}

export interface V3ToolClassification {
  toolId: ConsolidatedToolDefinition['id'];
  currentLabel: string;
  classification: V3SurfaceClassification;
  targetLabel: V3NavLabel;
  includeInV1Gallery: boolean;
  note: string;
}

export const V3_NAV_MAPPINGS: readonly V3NavMapping[] = [
  {
    label: 'Ask',
    route: '/app',
    classification: 'LOOP',
    currentNavIds: ['home'],
    productSurfaceIds: ['desk', 'research'],
    note: 'Current Home and Ask PRAXIS panels become the definitive Attach -> Ask cockpit.',
  },
  {
    label: 'Library',
    route: '/app/capsules',
    classification: 'LOOP',
    currentNavIds: ['capsules', 'marketplace'],
    productSurfaceIds: ['context', 'library', 'graph'],
    note: 'Capsules, source repository material, proof, and curated marketplace entries stay inside the capsule manager.',
  },
  {
    label: 'Studio',
    route: '/app/capsules/builder',
    classification: 'FOLD_IN',
    currentNavIds: [],
    productSurfaceIds: ['context', 'draft'],
    note: 'Studio starts as the existing builder/workbench flow, not a separate app shell.',
  },
  {
    label: 'Runs',
    route: '/agents/[runId]',
    classification: 'FOLD_IN',
    currentNavIds: ['recent-work'],
    productSurfaceIds: ['tools'],
    note: 'AgentRun detail links remain compatibility deep links until a list is folded into the Ask/Library cockpit.',
  },
  {
    label: 'Labs',
    route: '/app/boardroom',
    classification: 'LABS',
    currentNavIds: ['boardroom'],
    productSurfaceIds: ['tools'],
    note: 'Boardroom and specialist experiments remain flagged Labs surfaces behind the existing app shell.',
  },
] as const;

export const V3_PRIMARY_ROUTE_CLASSIFICATIONS: readonly V3PrimaryRouteClassification[] = [
  {
    currentNavId: 'home',
    currentLabel: 'Home',
    currentHref: '/app',
    classification: 'LOOP',
    targetLabel: 'Ask',
    note: 'Rename/reframe the existing launchpad around the Ask composer and active Capsule Dock.',
  },
  {
    currentNavId: 'capsules',
    currentLabel: 'Capsules',
    currentHref: '/app/capsules',
    classification: 'LOOP',
    targetLabel: 'Library',
    note: 'Library is the existing capsule manager plus sources, proof, digest, version, and visibility state.',
  },
  {
    currentNavId: 'boardroom',
    currentLabel: 'Boardroom',
    currentHref: '/app/boardroom',
    classification: 'LABS',
    targetLabel: 'Labs',
    note: 'Boardroom is useful runtime proof, but should not compete with the core Ask/Library loop.',
  },
  {
    currentNavId: 'signal',
    currentLabel: 'SIGNAL',
    currentHref: '/signal',
    classification: 'LABS',
    targetLabel: 'Labs',
    note: 'The authenticated text pilot connects source review, native capsule context and approved briefs under More.',
  },
  {
    currentNavId: 'recent-work',
    currentLabel: 'Recent work',
    currentHref: '/app/recent-work',
    classification: 'FOLD_IN',
    targetLabel: 'Runs',
    note: 'Generated work and AgentRun history should be reachable from Ask receipts, Library items, and run deep links.',
  },
  {
    currentNavId: 'marketplace',
    currentLabel: 'Marketplace',
    currentHref: '/app/capsules?lane=marketplace',
    classification: 'TOOL_CAPSULE',
    targetLabel: 'Library',
    note: 'The marketplace becomes a curated Exchange/gallery lane in Library, seeded from attachable Tool capsules.',
  },
  {
    currentNavId: 'settings',
    currentLabel: 'Settings',
    currentHref: '/app/settings',
    classification: 'FOLD_IN',
    note: 'Settings remains an account/system support surface, not a v3 product loop.',
  },
] as const;

export const V3_PRODUCT_SURFACE_CLASSIFICATIONS: readonly V3ProductSurfaceClassification[] = [
  {
    surfaceId: 'desk',
    currentLabel: 'Home',
    classification: 'LOOP',
    targetLabel: 'Ask',
    note: 'The compact launchpad becomes Ask-first rather than a separate dashboard concept.',
  },
  {
    surfaceId: 'context',
    currentLabel: 'Capsules',
    classification: 'LOOP',
    targetLabel: 'Library',
    note: 'Capsule search, create, improve, inspect, and archive are the core Library loop.',
  },
  {
    surfaceId: 'library',
    currentLabel: 'Sources',
    classification: 'FOLD_IN',
    targetLabel: 'Library',
    note: 'Sources remain repository material attached to capsules rather than a separate top-level product surface.',
  },
  {
    surfaceId: 'research',
    currentLabel: 'Ask PRAXIS',
    classification: 'LOOP',
    targetLabel: 'Ask',
    note: 'Research starts from the Ask composer and active Capsule Dock.',
  },
  {
    surfaceId: 'graph',
    currentLabel: 'Proof',
    classification: 'FOLD_IN',
    targetLabel: 'Library',
    note: 'Proof, graph proposals, and receipts become Library/Inspector affordances.',
  },
  {
    surfaceId: 'draft',
    currentLabel: 'Memo',
    classification: 'FOLD_IN',
    targetLabel: 'Studio',
    note: 'Output drafting belongs in Studio flows and Ask receipts until export validation matures.',
  },
  {
    surfaceId: 'tools',
    currentLabel: 'Advanced',
    classification: 'LABS',
    targetLabel: 'Labs',
    note: 'Specialist and archived capability entry points stay behind a flagged Labs posture.',
  },
] as const;

export const V3_TOOL_CLASSIFICATIONS: readonly V3ToolClassification[] = [
  {
    toolId: 'situation-dashboard',
    currentLabel: 'Situation Dashboard',
    classification: 'LOOP',
    targetLabel: 'Ask',
    includeInV1Gallery: false,
    note: 'Readiness and next-action summaries should sit in the Ask cockpit instead of becoming an attachable Tool capsule.',
  },
  {
    toolId: 'context-builder',
    currentLabel: 'Context Builder',
    classification: 'TOOL_CAPSULE',
    targetLabel: 'Studio',
    includeInV1Gallery: true,
    note: 'Guided intake is the first Studio-backed Tool capsule for building or repairing context.',
  },
  {
    toolId: 'ask-praxis',
    currentLabel: 'Ask PRAXIS',
    classification: 'LOOP',
    targetLabel: 'Ask',
    includeInV1Gallery: false,
    note: 'Ask is the operating loop; do not bury it as one gallery tool among many.',
  },
  {
    toolId: 'research-sources',
    currentLabel: 'Research & Sources',
    classification: 'TOOL_CAPSULE',
    targetLabel: 'Library',
    includeInV1Gallery: true,
    note: 'Source discovery and receipts are attachable capabilities backed by Library evidence state.',
  },
  {
    toolId: 'documents',
    currentLabel: 'Documents',
    classification: 'TOOL_CAPSULE',
    targetLabel: 'Library',
    includeInV1Gallery: true,
    note: 'Document ingestion is an attachable evidence-building capability for Library capsules.',
  },
  {
    toolId: 'graphops',
    currentLabel: 'GraphOps',
    classification: 'TOOL_CAPSULE',
    targetLabel: 'Library',
    includeInV1Gallery: true,
    note: 'Graph maintenance is a governed Tool capsule with proof and proposal review boundaries.',
  },
  {
    toolId: 'timeline',
    currentLabel: 'Timeline & Signals',
    classification: 'TOOL_CAPSULE',
    targetLabel: 'Labs',
    includeInV1Gallery: true,
    note: 'Temporal monitoring is useful as an attachable Tool capsule while richer trigger behavior stays gated.',
  },
  {
    toolId: 'actors-stakeholders',
    currentLabel: 'Actors & Stakeholders',
    classification: 'TOOL_CAPSULE',
    targetLabel: 'Labs',
    includeInV1Gallery: true,
    note: 'Actor and negotiation lenses are attachable Tool capsules for specialist analysis.',
  },
  {
    toolId: 'briefing-studio',
    currentLabel: 'Briefing Studio',
    classification: 'TOOL_CAPSULE',
    targetLabel: 'Studio',
    includeInV1Gallery: true,
    note: 'Briefing and memo generation becomes an Output-oriented Studio Tool capsule with export validation later.',
  },
] as const;

export const V3_TOOL_CAPSULE_GALLERY_IDS = V3_TOOL_CLASSIFICATIONS
  .filter((tool) => tool.includeInV1Gallery)
  .map((tool) => tool.toolId);

export const V3_DEMO_ROUTE_DECISION = {
  route: '/demo',
  existsInRouteTree: false,
  classification: 'DELETE',
  note: 'No src/app/demo route tree exists in this checkout; keep any simulated-demo state as explicit banners or fixture labels.',
} as const satisfies {
  route: string;
  existsInRouteTree: boolean;
  classification: V3SurfaceClassification;
  note: string;
};

export function v3PrimaryRouteClassificationFor(navId: string): V3PrimaryRouteClassification | null {
  return V3_PRIMARY_ROUTE_CLASSIFICATIONS.find((item) => item.currentNavId === navId) ?? null;
}

export function v3ToolClassificationFor(toolId: string): V3ToolClassification | null {
  return V3_TOOL_CLASSIFICATIONS.find((item) => item.toolId === toolId) ?? null;
}
