import { describe, expect, it } from 'vitest';
import { buildCapsuleReadReceiptFromEvidencePack } from '@/lib/agent-runtime/capsule-read-receipt';
import { buildCapsuleEvidencePack, formatEvidencePackPromptBlock } from '@/lib/agent-runtime/evidence-pack';
import { buildSourceabilityLedgerFromEvidencePack } from '@/lib/agent-runtime/sourceability-ledger';
import type { PraxisCapsule } from '@/lib/context/capsule-service';

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
