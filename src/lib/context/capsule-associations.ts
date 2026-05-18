import type { PraxisCapsule } from '@/lib/context/capsule-service';

export const MAX_ASSOCIATED_REFERENCE_CAPSULES = 5;

export interface CapsuleAssociationRow {
  capsule: PraxisCapsule;
  selected: boolean;
  disabled: boolean;
  disabledReason: 'self' | 'archived' | 'limit' | null;
}

export function normalizeAssociatedCapsuleIds(
  ids: Iterable<string>,
  activeCapsuleId: string | null | undefined,
  limit = MAX_ASSOCIATED_REFERENCE_CAPSULES,
): string[] {
  const activeId = activeCapsuleId?.trim();
  const normalized: string[] = [];
  for (const id of ids) {
    const clean = id.trim();
    if (!clean || clean === activeId || normalized.includes(clean)) continue;
    normalized.push(clean);
    if (normalized.length >= limit) break;
  }
  return normalized;
}

export function buildCapsuleAssociationRows(input: {
  capsules: PraxisCapsule[];
  activeCapsuleId: string | null | undefined;
  selectedIds: Iterable<string>;
  query?: string;
  limit?: number;
}): CapsuleAssociationRow[] {
  const selectedSet = new Set(normalizeAssociatedCapsuleIds(input.selectedIds, input.activeCapsuleId, input.limit));
  const selectedCount = selectedSet.size;
  const activeId = input.activeCapsuleId ?? null;
  const term = input.query?.trim().toLowerCase() ?? '';

  return input.capsules
    .filter((capsule) => matchesCapsuleQuery(capsule, term))
    .sort((a, b) => {
      const selectedDelta = Number(selectedSet.has(b.capsuleId)) - Number(selectedSet.has(a.capsuleId));
      if (selectedDelta !== 0) return selectedDelta;
      const selfDelta = Number(a.capsuleId === activeId) - Number(b.capsuleId === activeId);
      if (selfDelta !== 0) return selfDelta;
      return a.label.localeCompare(b.label);
    })
    .slice(0, 30)
    .map((capsule) => {
      const selected = selectedSet.has(capsule.capsuleId);
      const disabledReason = capsule.capsuleId === activeId
        ? 'self'
        : capsule.archivedAt
          ? 'archived'
          : !selected && selectedCount >= (input.limit ?? MAX_ASSOCIATED_REFERENCE_CAPSULES)
            ? 'limit'
            : null;
      return {
        capsule,
        selected,
        disabled: Boolean(disabledReason),
        disabledReason,
      };
    });
}

function matchesCapsuleQuery(capsule: PraxisCapsule, term: string): boolean {
  if (!term) return true;
  return [
    capsule.label,
    capsule.capsuleId,
    capsule.scope,
    capsule.health.semaphore,
    capsule.community.tags.join(' '),
  ].some((value) => value?.toLowerCase().includes(term));
}
