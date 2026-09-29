import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDbOrThrow: vi.fn(() => ({
    collection: vi.fn(),
    batch: vi.fn(),
  })),
}));

vi.mock('@/lib/firebase/documents-service', () => ({
  chunkAndSaveDocument: vi.fn(),
  getDocumentById: vi.fn(),
  listDocuments: vi.fn(),
  updateDocumentStatus: vi.fn(),
}));

vi.mock('@/lib/firebase/situations', () => ({
  getSituationById: vi.fn(),
  getConflictGraphAdmin: vi.fn(),
}));

vi.mock('@/lib/intelligence/corpus-search', () => ({
  searchSituationCorpus: vi.fn(),
}));

import { listDocuments } from '@/lib/firebase/documents-service';
import { getConflictGraphAdmin, getSituationById } from '@/lib/firebase/situations';
import { searchSituationCorpus } from '@/lib/intelligence/corpus-search';
import { createContextPackage, localKnowledgeAdapter } from '@/lib/knowledge/context-engine';

const mockedSearch = vi.mocked(searchSituationCorpus);
const mockedSituation = vi.mocked(getSituationById);
const mockedDocuments = vi.mocked(listDocuments);
const mockedGraph = vi.mocked(getConflictGraphAdmin);

describe('Context Engine local adapter', () => {
  it('persists a quick context package when optional user, team and graph references are absent', async () => {
    const set = vi.fn(async (value: unknown) => {
      // Firestore rejects undefined even in nested core references.
      expect(value).toStrictEqual(JSON.parse(JSON.stringify(value)));
    });
    const query = { where: vi.fn(), limit: vi.fn(), get: vi.fn(async () => ({ docs: [] })) };
    query.where.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    const doc = vi.fn(() => ({ collection, id: 'package-1', set }));
    const collection = vi.fn(() => ({ ...query, doc }));
    const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
    vi.mocked(getAdminDbOrThrow).mockReturnValue({ collection } as never);
    const pack = await createContextPackage('u1', { active: true, coreRefs: { situationCoreId: 'sit-1' } });
    expect(pack.active).toBe(true);
    expect(pack.coreRefs).toEqual({ situationCoreId: 'sit-1', sourceCoreIds: [], documentCoreIds: [], outputCoreIds: [] });
    expect(set).toHaveBeenCalledOnce();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSituation.mockResolvedValue({
      id: 'sit-1',
      name: 'Mediation case',
      actors: [],
      sourceUrls: ['https://example.org/source'],
      customSources: [],
    } as never);
    mockedDocuments.mockResolvedValue([{ id: 'doc-1', title: 'Source pack' }] as never);
    mockedGraph.mockResolvedValue({ nodes: [{ id: 'a1', type: 'actor', label: 'Actor' }], edges: [] } as never);
  });

  it('builds an ephemeral ContextPackage with health signals and a prompt pack', async () => {
    mockedSearch.mockResolvedValue({
      items: [
        {
          sourceType: 'documents',
          sourceId: 'doc-1#chunk-1',
          title: 'Source pack',
          excerpt: 'The ceasefire monitoring cell remains active.',
          citation: 'users/u/situations/sit-1/documents/doc-1/chunks/chunk-1',
          confidence: 'high',
          freshness: '2026-05-13T00:00:00.000Z',
          reason: 'Top-K hybrid match',
        },
      ],
      trace: {
        query: 'monitoring',
        layersSearched: ['documents'],
        ranking: 'test',
        layerCounts: { documents: 1 },
        totalCandidates: 1,
        durationMs: 1,
      },
    });

    const pack = await localKnowledgeAdapter.buildContextPack({
      uid: 'u1',
      situationId: 'sit-1',
      query: 'monitoring',
    });

    expect(pack.package.coreRefs.situationCoreId).toBe('sit-1');
    expect(pack.package.health.score).toBeGreaterThan(40);
    expect(pack.promptBlock).toContain('PRAXIS Runtime Context Package');
    expect(pack.promptBlock).toContain('[#1] Source pack');
  });

  it('returns insufficient evidence when a claim has no cited support', async () => {
    mockedSearch.mockResolvedValue({
      items: [],
      trace: {
        query: 'unsupported claim',
        layersSearched: ['documents'],
        ranking: 'test',
        layerCounts: { documents: 0 },
        totalCandidates: 0,
        durationMs: 1,
      },
    });

    const result = await localKnowledgeAdapter.checkClaim({
      uid: 'u1',
      situationId: 'sit-1',
      claim: 'The agreement has a monitoring cell.',
    });

    expect(result.verdict).toBe('insufficient_evidence');
    expect(result.gaps.join(' ')).toContain('No strong local evidence');
  });

  it('keeps graph deltas review-only with capped confidence', async () => {
    const writes: unknown[] = [];
    const batch = {
      set: vi.fn((...args: unknown[]) => writes.push(args)),
      commit: vi.fn(),
    };
    const doc = vi.fn(() => ({ collection, id: 'doc' }));
    const collection = vi.fn(() => ({ doc }));
    const { getAdminDbOrThrow } = await import('@/lib/firebase/admin');
    vi.mocked(getAdminDbOrThrow).mockReturnValue({ collection, batch: () => batch } as never);

    const deltas = await localKnowledgeAdapter.proposeGraphDelta({
      uid: 'u1',
      situationId: 'sit-1',
      documentId: 'doc-1',
      evidence: [
        {
          sourceType: 'documents',
          sourceId: 'doc-1#candidate-1',
          title: 'Source pack',
          excerpt: 'Actor A committed to a ceasefire.',
          citation: 'doc',
          confidence: 'high',
          freshness: '',
          reason: 'Structured extraction candidate: commitment',
        },
      ],
    });

    expect(deltas[0].status).toBe('review');
    expect(deltas[0].confidence).toBeLessThanOrEqual(0.72);
    expect(writes.length).toBe(1);
    expect(batch.commit).toHaveBeenCalled();
  });
});
