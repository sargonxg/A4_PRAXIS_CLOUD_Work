import { describe, expect, it, vi } from 'vitest';
import { buildCapsuleReadReceiptFromEvidencePack } from '@/lib/agent-runtime/capsule-read-receipt';
import { buildCapsuleEvidencePack, formatEvidencePackPromptBlock } from '@/lib/agent-runtime/evidence-pack';
import { buildSourceabilityLedgerFromEvidencePack } from '@/lib/agent-runtime/sourceability-ledger';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import type { KnowledgeDocument } from '@/lib/knowledge/library-service';

const capsule = {
  capsuleId: 'cap-1',
  ownerUid: 'user-1',
  archivedAt: null,
  version: 3,
  label: 'Active capsule',
  activeForSituationIds: [],
  coreRefs: {
    userCoreId: 'user-core',
    teamCoreId: null,
    situationCoreId: 'sit-1',
    pathCoreId: null,
    sourceCoreIds: ['src-1'],
    documentCoreIds: ['doc-1'],
    graphCoreId: null,
    timeCoreId: null,
    outputCoreIds: ['options-memo'],
    toolCoreIds: [],
    objectiveCoreIds: [],
    productCoreIds: [],
    memoryCoreId: null,
  },
} as unknown as PraxisCapsule;

describe('capsule evidence pack', () => {
  it('builds sourced paragraph records from capsule refs, knowledge docs, chunks, memories, and output history', async () => {
    const pack = await buildCapsuleEvidencePack({
      ownerUid: 'user-1',
      capsuleId: 'cap-1',
      objective: 'Draft an options memo',
    }, {
      now: () => new Date('2026-05-16T12:00:00.000Z'),
      getCapsule: async () => capsule,
      listKnowledgeDocuments: async () => [{
        id: 'doc-1',
        ownerUid: 'user-1',
        documentId: 'doc-1',
        situationId: 'sit-1',
        title: 'UN report',
        fileType: 'pdf',
        size: 100,
        bucketUri: null,
        repositoryIds: ['default'],
        capsuleIds: ['cap-1'],
        categoryId: 'policy',
        policyDomain: 'policy',
        tags: [],
        sourceType: 'document',
        sourceNote: '',
        extractionStatus: 'extracted',
        summaryStatus: 'ready',
        retrievalStatus: 'indexed',
        chunkCount: 1,
        entityCount: 0,
        digest: {
          shortSummary: 'Short digest.',
          analystSummary: 'Long digest.',
          keyClaims: ['Claim one'],
          actors: [],
          institutions: [],
          dates: [],
          causalLinks: [],
          humanFrictionSignals: [],
          policyRelevance: [],
          sourceabilityWarnings: ['Needs corroboration'],
          suggestedCapsuleIds: [],
          suggestedTags: [],
          followUpQuestions: [],
          generatedAt: '2026-05-16T12:00:00.000Z',
          model: 'test',
        },
        createdAt: '2026-05-16T12:00:00.000Z',
        updatedAt: '2026-05-16T12:00:00.000Z',
        schemaVersion: 1,
      }],
      retrieveRelevantChunks: async () => [{
        id: 'chunk-1',
        documentId: 'doc-1',
        documentTitle: 'UN report',
        text: 'Paragraph with evidence.',
        index: 0,
        charStart: 10,
        charEnd: 34,
        score: 0.8,
      }],
      listOutputCapsules: async () => [{
        id: 'out-1',
        templateId: 'options-memo',
        status: 'draft',
        quality: { blockers: [], sourceabilityStatus: 'weak' },
        createdAt: '2026-05-16T12:00:00.000Z',
      } as never],
      listCapsuleMemories: async () => [{
        id: 'mem-1',
        summary: 'Preserve caveat.',
      } as never],
    });

    expect(pack.packId).toMatch(/^evidence:/);
    expect(pack.activeCapsule.capsuleId).toBe('cap-1');
    expect(pack.sourcedParagraphs[0]).toMatchObject({
      documentId: 'doc-1',
      chunkId: 'chunk-1',
      sourceReceiptId: 'document:doc-1',
      paragraphRef: 'para-1',
      charStart: 10,
      charEnd: 34,
      excerpt: 'Paragraph with evidence.',
    });
    expect(pack.documentDigests[0]?.keyClaims).toEqual(['Claim one']);
    expect(pack.outputHistory[0]?.outputCapsuleId).toBe('out-1');
    expect(pack.memories).toHaveLength(1);
    expect(pack.openGaps).toContain('Graph Core is thin; graph mutation must stay approval-gated.');
    expect(formatEvidencePackPromptBlock(pack)).toContain('[D1:para-1]');
  });

  it('builds canonical capsule read receipts and sourceability ledgers from an evidence pack', async () => {
    const pack = await buildCapsuleEvidencePack({
      ownerUid: 'user-1',
      capsuleId: 'cap-1',
      objective: 'Draft an options memo',
    }, {
      now: () => new Date('2026-05-16T12:00:00.000Z'),
      getCapsule: async () => capsule,
      listKnowledgeDocuments: async () => [],
      retrieveRelevantChunks: async () => [],
      getDocumentById: async () => null,
      listOutputCapsules: async () => [],
      listCapsuleMemories: async () => [],
    });

    const readReceipt = buildCapsuleReadReceiptFromEvidencePack(pack, {
      selectedTools: ['context-resolve', 'capsule-evidence-pack', 'sourceability-reviewer'],
      outputTarget: 'memo_studio',
      groundingPosture: 'Source review requested',
      constraints: ['Do not mutate graph state without approval.'],
    });
    expect(readReceipt).toMatchObject({
      capsuleId: 'cap-1',
      capsuleVersion: 3,
      outputTarget: 'memo_studio',
      selectedTools: ['context-resolve', 'capsule-evidence-pack', 'sourceability-reviewer'],
      groundingPosture: 'Source review requested',
      sourceCount: 1,
      documentCount: 0,
    });
    expect(readReceipt.contextGaps).toEqual(expect.arrayContaining([
      'No Knowledge Library documents are attached.',
      'No retrievable paragraph chunks matched the objective.',
    ]));

    const ledger = buildSourceabilityLedgerFromEvidencePack(pack, {
      outputTarget: 'memo_studio',
      generatedAt: '2026-05-16T12:00:00.000Z',
    });
    expect(ledger.summary.totalClaims).toBeGreaterThan(0);
    expect(ledger.summary.unsupportedClaims).toBe(0);
    expect(ledger.claims.some((claim) => claim.supportLabel === 'unsupported')).toBe(false);
    expect(ledger.contextGaps).toEqual(pack.openGaps);
    expect(ledger.claims.some((claim) => pack.openGaps.includes(claim.claim))).toBe(false);
    expect(ledger.outputReadiness.generatedAt).toBe('2026-05-16T12:00:00.000Z');
  });
});

it('reads explicitly attached unindexed documents without assigning unrelated source receipts', async () => {
  const pack = await buildCapsuleEvidencePack({ ownerUid: 'user-1', capsuleId: 'cap-1', objective: 'Draft' }, {
    getCapsule: async () => capsule,
    listKnowledgeDocuments: async () => [], retrieveRelevantChunks: async () => [],
    listOutputCapsules: async () => [], listCapsuleMemories: async () => [],
    getDocumentById: async (owner, situation, id) => {
      expect([owner, situation, id]).toEqual(['user-1', 'sit-1', 'doc-1']);
      return { id, ownerUid: owner, title: 'Working notes', text: 'Synthetic project review deadline: 2026-11-12.',
        fileType: 'txt', size: 100, status: 'uploaded', uploadedAt: '2026-09-29', entityCount: 0 };
    },
  });
  expect(pack.sourcedParagraphs).toEqual([expect.objectContaining({
    documentId: 'doc-1', sourceReceiptId: 'document:doc-1', excerpt: 'Synthetic project review deadline: 2026-11-12.',
  })]);
  expect(pack.sourceReceiptIds).toContain('document:doc-1');
  expect(formatEvidencePackPromptBlock(pack)).toContain('not independent verification');
});

it('rejects evidence capsules belonging to a different owner', async () => {
  await expect(buildCapsuleEvidencePack({ ownerUid: 'other', capsuleId: 'cap-1', objective: 'Draft' }, {
    getCapsule: async () => capsule,
  })).rejects.toThrow('Active ContextCapsule not found');
});

it('passes capsule document selection into retrieval before ranking', async () => {
  const pack = await buildCapsuleEvidencePack({ ownerUid: 'user-1', capsuleId: 'cap-1', objective: 'Deadline' }, {
    getCapsule: async () => capsule,
    listKnowledgeDocuments: async () => [], listOutputCapsules: async () => [], listCapsuleMemories: async () => [],
    getDocumentById: async () => null,
    retrieveRelevantChunks: async (_owner, _situation, _query, options) => {
      expect(options).toMatchObject({ documentIds: ['doc-1'], maxChunks: 8 });
      return [{ id: 'late', documentId: 'doc-1', documentTitle: 'Selected', text: 'Deadline evidence',
        index: 40, charStart: 40000, charEnd: 40017 }];
    },
  });
  expect(pack.sourcedParagraphs[0]).toMatchObject({ documentId: 'doc-1', chunkId: 'late', charStart: 40000 });
});

describe('version-scoped supplemental capsule evidence', () => {
  const pinned = { ...capsule, version: 2, label: 'Historical capsule v2',
    coreRefs: { ...capsule.coreRefs, situationCoreId: 'historical-situation', documentCoreIds: ['document-A'], sourceCoreIds: ['source-A'] } };
  const latest = { ...capsule, version: 3, label: 'Current capsule v3',
    coreRefs: { ...capsule.coreRefs, situationCoreId: 'current-situation', documentCoreIds: ['document-B'], sourceCoreIds: ['source-B'] } };
  const chunk = (documentId: string) => ({ id: `${documentId}:chunk`, documentId, documentTitle: documentId,
    text: `Evidence from ${documentId}.`, index: 0, charStart: 0, charEnd: 30 });
  const knowledge = (documentId: string, ownerUid = 'user-1') => ({ id: documentId, documentId, ownerUid,
    title: documentId, digest: { keyClaims: ['CURRENT-ONLY-DIGEST'], suggestedTags: ['receipt:source-B'] } }) as KnowledgeDocument;
  function scopedDeps() {
    return { getCapsule: vi.fn(async () => latest), getCapsuleAtVersion: vi.fn(async () => pinned),
      listKnowledgeDocuments: vi.fn(async () => [knowledge('document-A'), knowledge('document-B'), knowledge('document-A', 'other-owner')]),
      retrieveRelevantChunks: vi.fn(async () => [chunk('document-A'), chunk('document-B')]),
      getDocumentById: vi.fn(async () => null),
      listOutputCapsules: vi.fn(async () => [{ id: 'CURRENT-ONLY-OUTPUT', templateId: 'options-memo', status: 'draft',
        quality: { blockers: [], sourceabilityStatus: 'weak' }, createdAt: '2026-09-30' } as never]),
      listCapsuleMemories: vi.fn(async () => [{ id: 'CURRENT-ONLY-MEMORY', summary: 'Current-only source-B' } as never]),
      now: () => new Date('2026-09-30T13:30:00.000Z') };
  }

  it('keeps attached v2 evidence A out of current v3 evidence B, receipt tags, generated digests, history and memory', async () => {
    const deps = scopedDeps();
    const pack = await buildCapsuleEvidencePack({ ownerUid: 'user-1', capsuleId: 'cap-1', capsuleVersion: 2,
      resolvedCapsule: pinned, objective: 'Use attached evidence only.' }, deps);
    expect(deps.getCapsule).not.toHaveBeenCalled(); expect(deps.getCapsuleAtVersion).not.toHaveBeenCalled();
    expect(deps.retrieveRelevantChunks).toHaveBeenCalledWith('user-1', 'historical-situation', 'Use attached evidence only.',
      { maxChunks: 8, documentIds: ['document-A'] });
    expect(pack.activeCapsule).toBe(pinned);
    expect(pack.knowledgeDocuments.map((doc) => [doc.ownerUid, doc.documentId])).toEqual([['user-1', 'document-A']]);
    expect(pack.sourcedParagraphs.map((paragraph) => paragraph.documentId)).toEqual(['document-A']);
    expect(pack.sourceReceiptIds).toEqual(['source-A', 'document:document-A']);
    expect(pack.documentDigests).toEqual([]); expect(pack.outputHistory).toEqual([]); expect(pack.memories).toEqual([]);
    expect(deps.listOutputCapsules).not.toHaveBeenCalled(); expect(deps.listCapsuleMemories).not.toHaveBeenCalled();
    const serialized = JSON.stringify(pack);
    for (const token of ['document-B', 'source-B', 'CURRENT-ONLY-DIGEST', 'CURRENT-ONLY-OUTPUT', 'CURRENT-ONLY-MEMORY']) {
      expect(serialized).not.toContain(token); expect(formatEvidencePackPromptBlock(pack)).not.toContain(token);
    }
    expect(formatEvidencePackPromptBlock(pack)).toContain('not immutable source snapshots');
    expect(buildCapsuleReadReceiptFromEvidencePack(pack)).toMatchObject({ capsuleVersion: 2, documentCount: 1,
      selectedCoreRefs: { sourceCoreIds: ['source-A'], documentCoreIds: ['document-A'] }, outputHistoryCount: 0, memoryCount: 0 });
    expect(JSON.stringify(buildSourceabilityLedgerFromEvidencePack(pack))).not.toContain('CURRENT-ONLY-DIGEST');
  });

  it('does not widen an empty saved document selection into situation retrieval or a live library query', async () => {
    const deps = scopedDeps();
    const empty = { ...pinned, coreRefs: { ...pinned.coreRefs, documentCoreIds: [] } };
    const pack = await buildCapsuleEvidencePack({ ownerUid: 'user-1', capsuleId: 'cap-1', capsuleVersion: 2,
      resolvedCapsule: empty, objective: 'Summarize the attached capsule.' }, deps);
    expect(pack.sourcedParagraphs).toEqual([]); expect(pack.knowledgeDocuments).toEqual([]);
    expect(pack.sourceReceiptIds).toEqual(['source-A']);
    for (const read of [deps.getCapsule, deps.listKnowledgeDocuments, deps.retrieveRelevantChunks,
      deps.getDocumentById, deps.listOutputCapsules, deps.listCapsuleMemories]) expect(read).not.toHaveBeenCalled();
  });

  it('reads only the pinned unindexed document A from its original situation without reading current document B', async () => {
    const deps = scopedDeps(); deps.retrieveRelevantChunks.mockResolvedValue([]);
    const getDocumentById = vi.fn(async (ownerUid: string, _situationId: string, id: string) => ({ id, ownerUid,
      title: id, text: `Uploaded evidence from ${id}.`, fileType: 'txt', size: 31,
      status: 'uploaded' as const, uploadedAt: '2026-09-30', entityCount: 0 }));
    const pack = await buildCapsuleEvidencePack({ ownerUid: 'user-1', capsuleId: 'cap-1', capsuleVersion: 2,
      resolvedCapsule: pinned, objective: 'Draft from attached material.' }, { ...deps, getDocumentById });
    expect(getDocumentById).toHaveBeenCalledExactlyOnceWith('user-1', 'historical-situation', 'document-A');
    expect(pack.sourcedParagraphs[0]).toMatchObject({ documentId: 'document-A', sourceReceiptId: 'document:document-A' });
    expect(JSON.stringify(pack)).not.toContain('document-B');
  });

  it('resolves an explicit version through the exact resolver when no resolved snapshot is supplied', async () => {
    const deps = scopedDeps();
    const pack = await buildCapsuleEvidencePack({ ownerUid: 'user-1', capsuleId: 'cap-1', capsuleVersion: 2,
      objective: 'Draft from the pinned version.' }, deps);
    expect(deps.getCapsuleAtVersion).toHaveBeenCalledExactlyOnceWith('user-1', 'cap-1', 2);
    expect(deps.getCapsule).not.toHaveBeenCalled();
    expect(pack.activeCapsule.version).toBe(2); expect(pack.sourceReceiptIds).not.toContain('source-B');
  });

  it.each([{ ownerUid: 'other' }, { capsuleId: 'other' }, { version: 3 }, { version: undefined }, { archivedAt: '2026-09-30' }])(
    'rejects a mismatched supplied snapshot before enrichment: %j', async (mismatch) => {
      const deps = scopedDeps();
      await expect(buildCapsuleEvidencePack({ ownerUid: 'user-1', capsuleId: 'cap-1', capsuleVersion: 2,
        resolvedCapsule: { ...pinned, ...mismatch } as PraxisCapsule, objective: 'Draft.' }, deps))
        .rejects.toMatchObject({ code: 'capsule_version_unavailable', requestedVersion: 2 });
      for (const read of [deps.getCapsule, deps.getCapsuleAtVersion, deps.listKnowledgeDocuments,
        deps.retrieveRelevantChunks, deps.listOutputCapsules, deps.listCapsuleMemories]) expect(read).not.toHaveBeenCalled();
    });

  it.each([0, -1, 1.5, NaN, Infinity])('rejects malformed numeric pin %s without resolving or retrieving evidence', async (capsuleVersion) => {
    const deps = scopedDeps();
    await expect(buildCapsuleEvidencePack({ ownerUid: 'user-1', capsuleId: 'cap-1', capsuleVersion, objective: 'Draft.' }, deps))
      .rejects.toMatchObject({ code: 'capsule_version_unavailable' });
    expect(deps.getCapsule).not.toHaveBeenCalled(); expect(deps.getCapsuleAtVersion).not.toHaveBeenCalled();
    expect(deps.retrieveRelevantChunks).not.toHaveBeenCalled();
  });

  it.each(['missing', 'unreadable', 'wrong-version'])('does not substitute latest when the requested version is %s', async (failure) => {
    const deps = scopedDeps();
    const getCapsuleAtVersion = vi.fn(async () => {
      if (failure === 'unreadable') throw new Error('Snapshot read unavailable');
      return failure === 'missing' ? null : latest;
    });
    await expect(buildCapsuleEvidencePack({ ownerUid: 'user-1', capsuleId: 'cap-1', capsuleVersion: 2,
      objective: 'Draft.' }, { ...deps, getCapsuleAtVersion })).rejects.toMatchObject({ code: 'capsule_version_unavailable' });
    expect(deps.getCapsule).not.toHaveBeenCalled(); expect(deps.listKnowledgeDocuments).not.toHaveBeenCalled();
    expect(deps.retrieveRelevantChunks).not.toHaveBeenCalled();
  });

  it('retains enrichment and situation retrieval for generic unpinned callers', async () => {
    const deps = scopedDeps(); deps.getCapsule.mockResolvedValue({ ...latest, coreRefs: { ...latest.coreRefs, documentCoreIds: [] } });
    const pack = await buildCapsuleEvidencePack({ ownerUid: 'user-1', capsuleId: 'cap-1', objective: 'Research the workspace.' }, deps);
    expect(deps.getCapsule).toHaveBeenCalledExactlyOnceWith('user-1', 'cap-1');
    expect(deps.getCapsuleAtVersion).not.toHaveBeenCalled();
    expect(deps.retrieveRelevantChunks).toHaveBeenCalledWith('user-1', 'current-situation', 'Research the workspace.', { maxChunks: 8 });
    expect(deps.listOutputCapsules).toHaveBeenCalledOnce(); expect(deps.listCapsuleMemories).toHaveBeenCalledOnce();
    expect(pack.documentDigests).toHaveLength(3); expect(pack.sourcedParagraphs).toHaveLength(2);
    expect(pack.referenceScope).toBeUndefined(); expect(pack.activeCapsule.version).toBe(3);
  });
});
