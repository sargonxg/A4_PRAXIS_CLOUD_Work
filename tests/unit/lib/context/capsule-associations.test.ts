import { describe, expect, it } from 'vitest';
import {
  buildCapsuleAssociationRows,
  normalizeAssociatedCapsuleIds,
} from '@/lib/context/capsule-associations';
import type { PraxisCapsule } from '@/lib/context/capsule-service';

describe('capsule association manager helpers', () => {
  it('dedupes selected capsule ids, excludes self, and applies the reference limit', () => {
    expect(normalizeAssociatedCapsuleIds(
      ['cap-a', 'cap-main', 'cap-a', 'cap-b', 'cap-c', 'cap-d', 'cap-e', 'cap-f'],
      'cap-main',
    )).toEqual(['cap-a', 'cap-b', 'cap-c', 'cap-d', 'cap-e']);
  });

  it('shows already-associated capsules first and disables self, archived, and over-limit additions', () => {
    const rows = buildCapsuleAssociationRows({
      activeCapsuleId: 'cap-main',
      selectedIds: ['cap-b', 'cap-c', 'cap-d', 'cap-e', 'cap-f'],
      query: 'policy',
      capsules: [
        capsule('cap-a', 'Policy A'),
        capsule('cap-main', 'Policy Main'),
        capsule('cap-b', 'Policy B'),
        capsule('cap-z', 'Other Z', { community: community(['not-matching']) }),
        capsule('cap-archived', 'Policy Archived', { archivedAt: '2026-05-17T00:00:00.000Z' }),
      ],
    });

    expect(rows.map((row) => row.capsule.capsuleId)).toEqual(['cap-b', 'cap-a', 'cap-archived', 'cap-main']);
    expect(rows.find((row) => row.capsule.capsuleId === 'cap-b')?.selected).toBe(true);
    expect(rows.find((row) => row.capsule.capsuleId === 'cap-main')?.disabledReason).toBe('self');
    expect(rows.find((row) => row.capsule.capsuleId === 'cap-archived')?.disabledReason).toBe('archived');
    expect(rows.find((row) => row.capsule.capsuleId === 'cap-a')?.disabledReason).toBe('limit');
  });
});

function capsule(capsuleId: string, label: string, overrides: Partial<PraxisCapsule> = {}): PraxisCapsule {
  return {
    capsuleId,
    schemaVersion: 1,
    ownerUid: 'u1',
    label,
    scope: 'situation',
    version: 1,
    parentCapsuleId: null,
    forkedFromVersion: null,
    activeForSituationIds: [],
    associatedCapsuleIds: [],
    lockedCoreKinds: [],
    coreRefs: {
      userCoreId: null,
      teamCoreId: null,
      situationCoreId: null,
      sourceCoreIds: [],
      documentCoreIds: [],
      graphCoreId: null,
      outputCoreIds: [],
      toolCoreIds: [],
      objectiveCoreIds: [],
      productCoreIds: [],
    },
    retrievalPolicy: { layers: ['sources'], limit: 8, checkFreshness: true },
    health: { score: 80, semaphore: 'green', missingCores: [], warnings: [], blockers: [], recommendations: [], signals: [] },
    provenance: { source: 'created', createdBy: 'u1', parentCapsuleId: null, forkedFromVersion: null, notes: '' },
    access: { visibility: 'private', sharedWithUserIds: [], sharedWithOrgIds: [], allowClone: false, allowDownload: false, allowCommunityRating: false },
    community: community(['policy']),
    trust: { level: 'green', score: 80, label: 'Ready', summary: '', blockers: [], recommendations: [], checkedAt: '2026-05-17T00:00:00.000Z' },
    createdAt: '2026-05-17T00:00:00.000Z',
    updatedAt: '2026-05-17T00:00:00.000Z',
    archivedAt: null,
    ...overrides,
  };
}

function community(tags: string[]): PraxisCapsule['community'] {
  return {
    favorite: false,
    userRating: null,
    averageRating: null,
    ratingCount: 0,
    tags,
    listedInMarketplace: false,
    publishedAt: null,
    cloneCount: 0,
    downloadCount: 0,
  };
}
