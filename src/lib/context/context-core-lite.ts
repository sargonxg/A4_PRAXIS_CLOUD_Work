export type ContextCreationMode = 'praxis_lite' | 'dialectica_future';

export type ContextCoreLiteStatus = 'draft' | 'review_ready' | 'locked';

export interface LightweightContextCoreLite {
  id: string;
  mode: 'praxis_lite';
  title: string;
  domain: string;
  situationCoreId: string;
  userCoreId?: string | null;
  capsuleId: string;
  capsuleVersion: number;
  contextPackageId: string;
  sourceRefs: string[];
  documentRefs: string[];
  healthScore: number;
  missingCores: string[];
  assumptions: string[];
  gaps: string[];
  status: ContextCoreLiteStatus;
  createdAt: string;
  askResolvable: boolean;
}

export interface ContextCreationModeDefinition {
  id: ContextCreationMode;
  label: string;
  statusLabel: string;
  available: boolean;
  summary: string;
}

export const CONTEXT_CREATION_MODES: ContextCreationModeDefinition[] = [
  {
    id: 'praxis_lite',
    label: 'Context Core Lite',
    statusLabel: 'Available now',
    available: true,
    summary: 'Fast PRAXIS MVP context from Situation Core, User Core, capsule, sources, documents, and Context Package.',
  },
  {
    id: 'dialectica_future',
    label: 'DIALECTICA Core Builder',
    statusLabel: 'Coming soon',
    available: false,
    summary: 'Future full context creation by DIALECTICA by TACITUS for extraction, graph, provenance, versioning, and advanced packages.',
  },
];

export function getContextCreationModeDefinition(mode: ContextCreationMode): ContextCreationModeDefinition {
  return CONTEXT_CREATION_MODES.find((item) => item.id === mode) ?? CONTEXT_CREATION_MODES[0];
}

export function canCreateWithMode(mode: ContextCreationMode): boolean {
  return getContextCreationModeDefinition(mode).available;
}

export function createLightweightContextCoreLite(input: Omit<LightweightContextCoreLite, 'mode' | 'createdAt'> & {
  createdAt?: string;
}): LightweightContextCoreLite {
  return {
    ...input,
    mode: 'praxis_lite',
    sourceRefs: unique(input.sourceRefs),
    documentRefs: unique(input.documentRefs),
    missingCores: unique(input.missingCores).slice(0, 8),
    assumptions: cleanList(input.assumptions).slice(0, 8),
    gaps: cleanList(input.gaps).slice(0, 8),
    healthScore: clampScore(input.healthScore),
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

function unique(items: string[]): string[] {
  return Array.from(new Set(cleanList(items)));
}

function cleanList(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}
