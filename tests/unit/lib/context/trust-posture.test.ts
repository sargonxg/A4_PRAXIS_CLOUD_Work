import { afterEach, describe, expect, it, vi } from 'vitest';
import { computeTrustPosture } from '@/lib/context/trust-posture';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import type { Situation } from '@/types/situation';

describe('computeTrustPosture', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a ready posture with specific contributors and click targets', () => {
    vi.setSystemTime(new Date('2026-05-14T00:00:00.000Z'));

    const posture = computeTrustPosture(readyCapsule(), readySituation());

    expect(posture.band).toBe('ready');
    expect(posture.score).toBeGreaterThanOrEqual(75);
    expect(posture.contributors).toHaveLength(5);
    expect(posture.contributors.map((contributor) => contributor.signal)).toEqual([
      'evidence coverage',
      'source freshness',
      'graph readiness',
      'claim support',
      'missing gaps',
    ]);
    expect(posture.contributors.every((contributor) => contributor.clickTarget.href.length > 0)).toBe(true);
  });

  it('keeps thin capsules visibly below ready', () => {
    vi.setSystemTime(new Date('2026-05-14T00:00:00.000Z'));

    const posture = computeTrustPosture({
      ...readyCapsule(),
      coreRefs: {
        userCoreId: null,
        teamCoreId: null,
        situationCoreId: null,
        sourceCoreIds: [],
        documentCoreIds: [],
        graphCoreId: null,
        outputCoreIds: [],
      },
      health: {
        score: 20,
        signals: [],
        missingCores: ['situation-core', 'source-core'],
        warnings: ['No sources attached'],
      },
      retrievalPolicy: {
        layers: [],
        limit: 0,
        checkFreshness: true,
        freshnessWindowDays: 30,
      },
      updatedAt: '2025-01-01T00:00:00.000Z',
    }, null);

    expect(posture.band).toBe('thin');
    expect(posture.score).toBeLessThan(45);
    expect(posture.contributors.find((contributor) => contributor.id === 'missing-gaps')?.detail).toContain('missing core');
  });
});

function readyCapsule(): PraxisCapsule {
  return {
    capsuleId: 'cap-1',
    ownerUid: 'u1',
    scope: 'situation',
    parentCapsuleId: null,
    forkedFromVersion: null,
    coreRefs: {
      userCoreId: 'user-core',
      teamCoreId: null,
      situationCoreId: 'sit-1',
      sourceCoreIds: ['src-1', 'src-2', 'src-3', 'src-4', 'src-5'],
      documentCoreIds: ['doc-1', 'doc-2', 'doc-3'],
      graphCoreId: 'graph-1',
      outputCoreIds: ['memo-1'],
    },
    retrievalPolicy: {
      layers: ['documents', 'sources', 'graph'],
      limit: 12,
      checkFreshness: true,
      freshnessWindowDays: 90,
    },
    health: {
      score: 88,
      signals: [],
      missingCores: [],
      warnings: [],
    },
    activeForSituationIds: ['sit-1'],
    lockedCoreKinds: [],
    provenance: {
      source: 'created',
      createdBy: 'u1',
      parentCapsuleId: null,
      forkedFromVersion: null,
    },
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-13T00:00:00.000Z',
    schemaVersion: 1,
    version: 2,
    label: 'Ready capsule',
  };
}

function readySituation(): Partial<Situation> {
  return {
    id: 'sit-1',
    name: 'Ready situation',
    sourceUrls: ['https://example.com/a', 'https://example.com/b'],
    documentCount: 3,
    graphEntities: 30,
    latestEventDate: '2026-05-12T00:00:00.000Z',
    updatedAt: '2026-05-13T00:00:00.000Z',
    dataCompleteness: 90,
    semanticaContextGraph: {
      schemaVersion: 'praxis-semantica-context-core.v1',
      adapterVersion: 'praxis-semantica-adapter.2026-05-11',
      targetSemanticaVersion: '0.5.x',
      generatedBy: 'praxis-context-create',
      contextCoreId: 'sit-1',
      entities: [],
      relationships: [],
      quality: {
        nodeCount: 30,
        edgeCount: 45,
        hasContextRoot: true,
        hasDomainOntology: true,
        hasWorkOntology: true,
        hasFrame: true,
        semanticaReady: true,
      },
      intendedSemanticaCapabilities: ['context_graph', 'provenance'],
    },
  };
}
