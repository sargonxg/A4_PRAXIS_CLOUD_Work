import type { CapsuleCoreRefs, PraxisCapsule } from '@/lib/context/capsule-service';
import { PRAXIS_CANONICAL_TOOLS } from '@/lib/tools/canonical';
import type { CoreKind } from '@/lib/tools/contract';

/**
 * Core kinds the FixThisFirstPanel knows how to render.
 * Keep this in sync with `RequiredCoreKind` in
 * src/components/praxis/fix-this-first-panel.tsx.
 */
export type GateCoreKind = 'user' | 'situation' | 'source' | 'graph' | 'time' | 'output';

export interface CapsuleGateResult {
  missingCores: GateCoreKind[];
  staleCores: GateCoreKind[];
}

/**
 * Maps a tool's declared `requires: CoreKind[]` against the cores present
 * in the active capsule's coreRefs. A tool requires cores; if any are
 * missing from the capsule, the run cannot be trusted and the route
 * should return 412 with the missing list so the UI can show
 * FixThisFirstPanel.
 *
 * Staleness is currently not tracked on PraxisCapsule.coreRefs, so the
 * returned `staleCores` is always empty — the field is reserved for when
 * we add per-core lastUsedAt or freshnessExpiresAt timestamps.
 */
export function checkCapsuleAgainstRequiredCores(
  coreRefs: CapsuleCoreRefs | null | undefined,
  requires: readonly CoreKind[],
): CapsuleGateResult {
  if (!coreRefs) {
    return {
      missingCores: requires.map(mapToGateKind).filter((k): k is GateCoreKind => k !== null),
      staleCores: [],
    };
  }

  const missingCores: GateCoreKind[] = [];
  for (const kind of requires) {
    const gateKind = mapToGateKind(kind);
    if (!gateKind) continue;
    if (!isCorePresent(coreRefs, gateKind)) missingCores.push(gateKind);
  }
  return { missingCores: dedupe(missingCores), staleCores: [] };
}

/**
 * Looks up the canonical tool definition for `toolId` and returns the
 * gate result. Tools not in PRAXIS_CANONICAL_TOOLS have no declared core
 * requirements, so the gate returns an empty result (passes).
 */
export function checkCapsuleForTool(
  capsule: PraxisCapsule | null | undefined,
  toolId: string,
): CapsuleGateResult {
  const canonical = PRAXIS_CANONICAL_TOOLS.find((tool) => tool.id === toolId);
  if (!canonical) return { missingCores: [], staleCores: [] };
  return checkCapsuleAgainstRequiredCores(capsule?.coreRefs, canonical.requires);
}

function isCorePresent(refs: CapsuleCoreRefs, kind: GateCoreKind): boolean {
  switch (kind) {
    case 'user':
      return Boolean(refs.userCoreId);
    case 'situation':
      return Boolean(refs.situationCoreId);
    case 'source':
      return refs.sourceCoreIds.length > 0 || refs.documentCoreIds.length > 0;
    case 'graph':
      return Boolean(refs.graphCoreId);
    case 'output':
      return refs.outputCoreIds.length > 0;
    case 'time':
      // PraxisCapsule does not currently track a Time Core. Treat as present
      // so we never block on a slot the capsule schema cannot satisfy.
      return true;
  }
}

function mapToGateKind(kind: CoreKind): GateCoreKind | null {
  switch (kind) {
    case 'user':
    case 'situation':
    case 'source':
    case 'output':
    case 'time':
      return kind;
    case 'office':
      // Office Core is currently represented as teamCoreId on the capsule
      // but FixThisFirstPanel has no 'office' affordance yet. Skip the
      // check rather than render a missing slot the user cannot repair.
      return null;
  }
}

function dedupe<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}
