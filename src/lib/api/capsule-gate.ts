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
 * Staleness is tracked per core id through `coreRefs.coreFreshness`. When
 * a required gate kind is present but all candidate ids for that kind are
 * expired, the route can return 412 with `staleCores` so the UI can ask the
 * user to refresh that source/time/output context before running the tool.
 */
export function checkCapsuleAgainstRequiredCores(
  coreRefs: CapsuleCoreRefs | null | undefined,
  requires: readonly CoreKind[],
  options: { now?: string | Date } = {},
): CapsuleGateResult {
  if (!coreRefs) {
    return {
      missingCores: requires.map(mapToGateKind).filter((k): k is GateCoreKind => k !== null),
      staleCores: [],
    };
  }

  const missingCores: GateCoreKind[] = [];
  const staleCores: GateCoreKind[] = [];
  for (const kind of requires) {
    const gateKind = mapToGateKind(kind);
    if (!gateKind) continue;
    if (!isCorePresent(coreRefs, gateKind)) missingCores.push(gateKind);
    else if (isCoreStale(coreRefs, gateKind, options.now)) staleCores.push(gateKind);
  }
  return { missingCores: dedupe(missingCores), staleCores: dedupe(staleCores) };
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
      return Boolean(refs.timeCoreId);
  }
}

function isCoreStale(refs: CapsuleCoreRefs, kind: GateCoreKind, now?: string | Date): boolean {
  const freshness = refs.coreFreshness ?? {};
  const ids = coreIdsForKind(refs, kind);
  if (!ids.length) return false;
  const freshnessRows = ids
    .map((id) => freshness[id])
    .filter((row): row is NonNullable<CapsuleCoreRefs['coreFreshness']>[string] => Boolean(row?.freshnessExpiresAt));
  if (!freshnessRows.length) return false;
  const compare = now instanceof Date ? now.getTime() : now ? Date.parse(now) : Date.now();
  if (Number.isNaN(compare)) return false;
  return freshnessRows.every((row) => {
    const expiresAt = row.freshnessExpiresAt ? Date.parse(row.freshnessExpiresAt) : Number.NaN;
    return !Number.isNaN(expiresAt) && expiresAt < compare;
  });
}

function coreIdsForKind(refs: CapsuleCoreRefs, kind: GateCoreKind): string[] {
  switch (kind) {
    case 'user':
      return refs.userCoreId ? [refs.userCoreId] : [];
    case 'situation':
      return refs.situationCoreId ? [refs.situationCoreId] : [];
    case 'source':
      return [...refs.sourceCoreIds, ...refs.documentCoreIds];
    case 'graph':
      return refs.graphCoreId ? [refs.graphCoreId] : [];
    case 'output':
      return refs.outputCoreIds;
    case 'time':
      return refs.timeCoreId ? [refs.timeCoreId] : [];
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
    case 'path':
    case 'document':
    case 'tool':
    case 'objective':
    case 'product':
    case 'memory':
      // These expanded capsule slots are visible in the capsule manager, but
      // FixThisFirstPanel still renders the smaller hard-gate set.
      return null;
  }
  return null;
}

function dedupe<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}
