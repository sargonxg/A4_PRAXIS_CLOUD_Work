import { describe, it, expect } from 'vitest';
import {
  checkCapsuleAgainstRequiredCores,
  checkCapsuleForTool,
} from '@/lib/api/capsule-gate';
import type { CapsuleCoreRefs, PraxisCapsule } from '@/lib/context/capsule-service';

const emptyRefs: CapsuleCoreRefs = {
  userCoreId: null,
  teamCoreId: null,
  situationCoreId: null,
  sourceCoreIds: [],
  documentCoreIds: [],
  graphCoreId: null,
  outputCoreIds: [],
};

function fullRefs(): CapsuleCoreRefs {
  return {
    userCoreId: 'u',
    teamCoreId: 't',
    situationCoreId: 's',
    sourceCoreIds: ['src1'],
    documentCoreIds: [],
    graphCoreId: 'g',
    outputCoreIds: ['o1'],
  };
}

function fakeCapsule(refs: CapsuleCoreRefs): PraxisCapsule {
  return {
    capsuleId: 'cap-1',
    ownerUid: 'u',
    scope: 'situation',
    parentCapsuleId: null,
    forkedFromVersion: null,
    associatedCapsuleIds: [],
    coreRefs: refs,
    retrievalPolicy: { layers: [], limit: 10, checkFreshness: false, freshnessWindowDays: 90 },
    health: { score: 80, label: 'ready', dimensions: [] } as unknown as PraxisCapsule['health'],
    activeForSituationIds: ['s1'],
    lockedCoreKinds: [],
    provenance: {
      source: 'created',
      createdBy: 'u',
      parentCapsuleId: null,
      forkedFromVersion: null,
    },
    access: {
      visibility: 'private',
      sharedWithUserIds: [],
      sharedWithOrgIds: [],
      allowClone: true,
      allowDownload: true,
      allowCommunityRating: false,
    },
    community: {
      favorite: false,
      userRating: null,
      averageRating: null,
      ratingCount: 0,
      tags: [],
      listedInMarketplace: false,
      publishedAt: null,
      cloneCount: 0,
      downloadCount: 0,
    },
    trust: {
      level: 'green',
      score: 80,
      label: 'Ready',
      summary: 'Test capsule.',
      blockers: [],
      recommendations: [],
      checkedAt: '2026-01-01T00:00:00.000Z',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
    version: 1,
    label: 'test',
  };
}

describe('checkCapsuleAgainstRequiredCores', () => {
  it('returns every required core as missing when refs are null', () => {
    const { missingCores, staleCores } = checkCapsuleAgainstRequiredCores(null, ['user', 'situation', 'source']);
    expect(missingCores).toEqual(['user', 'situation', 'source']);
    expect(staleCores).toEqual([]);
  });

  it('returns no missing cores when capsule is fully populated', () => {
    const { missingCores } = checkCapsuleAgainstRequiredCores(fullRefs(), ['user', 'situation', 'source', 'output']);
    expect(missingCores).toEqual([]);
  });

  it('flags missing situation core', () => {
    const refs = { ...fullRefs(), situationCoreId: null };
    const { missingCores } = checkCapsuleAgainstRequiredCores(refs, ['user', 'situation']);
    expect(missingCores).toEqual(['situation']);
  });

  it('treats documentCoreIds as satisfying a source requirement', () => {
    const refs: CapsuleCoreRefs = { ...emptyRefs, userCoreId: 'u', situationCoreId: 's', documentCoreIds: ['doc1'] };
    const { missingCores } = checkCapsuleAgainstRequiredCores(refs, ['source']);
    expect(missingCores).toEqual([]);
  });

  it('flags source when both sourceCoreIds and documentCoreIds are empty', () => {
    const refs: CapsuleCoreRefs = { ...emptyRefs, userCoreId: 'u', situationCoreId: 's' };
    const { missingCores } = checkCapsuleAgainstRequiredCores(refs, ['source']);
    expect(missingCores).toEqual(['source']);
  });

  it('flags stale source cores when freshness metadata has expired', () => {
    const refs: CapsuleCoreRefs = {
      ...fullRefs(),
      sourceCoreIds: ['src-stale'],
      coreFreshness: {
        'src-stale': {
          lastRefreshedAt: '2026-04-01T00:00:00.000Z',
          freshnessExpiresAt: '2026-05-01T00:00:00.000Z',
        },
      },
    };
    const { missingCores, staleCores } = checkCapsuleAgainstRequiredCores(refs, ['source'], {
      now: '2026-05-28T00:00:00.000Z',
    });

    expect(missingCores).toEqual([]);
    expect(staleCores).toEqual(['source']);
  });

  it('skips expanded non-hard-gate slots', () => {
    const refs: CapsuleCoreRefs = { ...emptyRefs };
    const { missingCores } = checkCapsuleAgainstRequiredCores(refs, ['path', 'document', 'tool', 'objective', 'product', 'memory']);
    expect(missingCores).toEqual([]);
  });

  it('flags missing time core when required', () => {
    const { missingCores } = checkCapsuleAgainstRequiredCores(emptyRefs, ['time']);
    expect(missingCores).toEqual(['time']);
  });
});

describe('checkCapsuleForTool', () => {
  it('returns empty when the toolId is not in PRAXIS_CANONICAL_TOOLS', () => {
    const { missingCores } = checkCapsuleForTool(fakeCapsule(emptyRefs), 'unknown-tool');
    expect(missingCores).toEqual([]);
  });

  it('flags missing user core for ask-praxis on an empty capsule', () => {
    const { missingCores } = checkCapsuleForTool(fakeCapsule(emptyRefs), 'ask-praxis');
    expect(missingCores).toContain('user');
    expect(missingCores).toContain('situation');
  });

  it('passes ask-praxis when user + situation cores are set', () => {
    const refs: CapsuleCoreRefs = { ...emptyRefs, userCoreId: 'u', situationCoreId: 's' };
    const { missingCores } = checkCapsuleForTool(fakeCapsule(refs), 'ask-praxis');
    expect(missingCores).toEqual([]);
  });

  it('requires source evidence before running sourceability', () => {
    const refs: CapsuleCoreRefs = { ...emptyRefs, userCoreId: 'u', situationCoreId: 's' };
    expect(checkCapsuleForTool(fakeCapsule(refs), 'sourceability').missingCores).toEqual(['source']);
    expect(checkCapsuleForTool(fakeCapsule({ ...refs, sourceCoreIds: ['src1'] }), 'sourceability').missingCores).toEqual([]);
  });

  it('returns missing cores for null capsule', () => {
    const { missingCores } = checkCapsuleForTool(null, 'ask-praxis');
    expect(missingCores.length).toBeGreaterThan(0);
  });
});
