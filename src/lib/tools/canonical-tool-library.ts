import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';
import type { CoreKind } from '@/lib/tools/contract';

export type CanonicalToolLibraryEntry = {
  id: string;
  name: string;
  shortLabel: string;
  surface: 'hero' | 'archive';
  route: string;
  uiTarget: 'inline' | 'workbench' | 'writer';
  credits: number;
  modelTier: 'flash' | 'pro' | 'deep';
  requires: CoreKind[];
  produces: string;
  methodology: string;
  frameworks: string[];
  limits: string;
};

export function getCanonicalToolLibrary(): CanonicalToolLibraryEntry[] {
  return PRAXIS_CANONICAL_TOOLS.map((tool) => ({
    id: tool.id,
    name: tool.name,
    shortLabel: tool.shortLabel,
    surface: tool.surface,
    route: tool.route,
    uiTarget: tool.uiTarget,
    credits: tool.credits,
    modelTier: tool.modelTier,
    requires: tool.requires,
    produces: tool.produces,
    methodology: tool.methodology,
    frameworks: tool.frameworks,
    limits: tool.limits,
  }));
}

export function getCanonicalToolLibrarySummary() {
  const entries = getCanonicalToolLibrary();
  return {
    totalTools: entries.length,
    visibleTools: entries.filter((entry) => entry.surface === 'hero').length,
    archiveTools: entries.filter((entry) => entry.surface === 'archive').length,
    routedTools: entries.filter((entry) => entry.route).length,
    generatedFrom: ['src/lib/tools/contract.ts', 'src/lib/tools/canonical.ts'],
  };
}
