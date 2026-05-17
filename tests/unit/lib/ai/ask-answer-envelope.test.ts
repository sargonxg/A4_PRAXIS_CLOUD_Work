import { describe, expect, it } from 'vitest';
import {
  buildAskAnswerEnvelope,
  buildConversationDocumentPack,
  buildSourcePreviewCards,
  conversationDocumentPackToMemoBlocks,
} from '@/lib/ai/ask-answer-envelope';
import type { CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';

describe('ask answer envelope', () => {
  it('normalizes evidence-pack paragraphs into always-visible source cards', () => {
    const cards = buildSourcePreviewCards({
      evidencePack: evidencePack(),
    });

    expect(cards).toEqual([
      expect.objectContaining({
        id: 'doc-1:chunk-1',
        title: 'Uploaded document doc-1',
        sourceType: 'uploaded-document',
        label: 'Uploaded Document',
        quotePreview: 'The ceasefire monitoring cell reported two access restrictions near the crossing.',
        documentId: 'doc-1',
        chunkId: 'chunk-1',
        pageRef: 'p.4',
        confidence: 0.82,
      }),
    ]);
  });

  it('builds a conversational envelope with source-backed claims and follow-ups', () => {
    const sourceCards = buildSourcePreviewCards({ evidencePack: evidencePack() });
    const envelope = buildAskAnswerEnvelope({
      prompt: 'What matters now?',
      answer: 'Access restrictions are the immediate operational issue. The monitoring cell should verify whether these restrictions are temporary or becoming routine.',
      intent: 'normal_answer',
      sourceCards,
      gaps: ['No current field confirmation.'],
      provenance: {
        capsuleId: 'cap-1',
        capsuleVersion: 2,
        threadId: 'ask-cap-1',
        model: 'vertex-test',
      },
    });

    expect(envelope.style.mode).toBe('claude_like_dialogue');
    expect(envelope.sourceCards).toHaveLength(1);
    expect(envelope.claimGrounding[0]).toMatchObject({
      grounding: 'source-backed',
      sourceCardIds: ['doc-1:chunk-1'],
    });
    expect(envelope.followUps).toContain('Check the weakest claim against attached sources.');
    expect(envelope.documentPackCandidate.provenance.capsuleId).toBe('cap-1');
  });

  it('converts a conversation document pack into citation-preserving memo blocks', () => {
    const sourceCards = buildSourcePreviewCards({ evidencePack: evidencePack() });
    const pack = buildConversationDocumentPack({
      title: 'Ask PRAXIS document pack',
      prompt: 'Prepare a pack',
      answer: 'Access restrictions are the immediate operational issue.',
      sourceCards,
      gaps: ['No current field confirmation.'],
      provenance: {
        capsuleId: 'cap-1',
        capsuleVersion: 2,
        threadId: 'ask-cap-1',
        model: 'vertex-test',
      },
    });

    const blocks = conversationDocumentPackToMemoBlocks(pack);

    expect(blocks.map((block) => block.id)).toEqual([
      'pack-heading',
      'pack-answer',
      'pack-sources',
      'pack-gaps',
      'pack-provenance',
    ]);
    expect(blocks[1].citations[0].sourceReceiptIds).toEqual(['receipt-1']);
    expect(blocks[2].items?.[0]).toContain('p.4');
  });
});

function evidencePack(): CapsuleEvidencePack {
  return {
    packId: 'pack-1',
    ownerUid: 'user-1',
    capsuleId: 'cap-1',
    objective: 'What matters now?',
    builtAt: '2026-05-17T12:00:00.000Z',
    activeCapsule: {
      capsuleId: 'cap-1',
      ownerUid: 'user-1',
      label: 'Test capsule',
      summary: '',
      coreRefs: {
        userCoreId: 'user-core',
        teamCoreId: null,
        situationCoreId: 'sit-1',
        sourceCoreIds: ['receipt-1'],
        documentCoreIds: ['doc-1'],
        graphCoreId: null,
        timeCoreId: null,
        toolCoreIds: [],
        objectiveCoreIds: [],
        productCoreIds: [],
        outputCoreIds: [],
        memoryCoreId: null,
      },
      activeForSituationIds: ['sit-1'],
      status: 'active',
      version: 2,
      lineage: { parentCapsuleId: null, forkedFromVersion: null, combinedFromCapsuleIds: [] },
      locks: {},
      health: { score: 70, missingCores: [], warnings: [], signals: [] },
      createdAt: '2026-05-17T12:00:00.000Z',
      updatedAt: '2026-05-17T12:00:00.000Z',
      archivedAt: null,
    },
    knowledgeDocuments: [],
    sourceReceiptIds: ['receipt-1'],
    sourcedParagraphs: [
      {
        id: 'para-1',
        documentId: 'doc-1',
        chunkId: 'chunk-1',
        sourceReceiptId: 'receipt-1',
        pageRef: 'p.4',
        paragraphRef: 'para-8',
        charStart: 10,
        charEnd: 92,
        excerpt: 'The ceasefire monitoring cell reported two access restrictions near the crossing.',
        score: 0.82,
        confidence: 0.82,
        citationLabel: '[D1:p.4]',
      },
    ],
    documentDigests: [],
    outputHistory: [],
    memories: [],
    openGaps: ['No current field confirmation.'],
    receipts: {
      sourcesUsed: 1,
      paragraphsUsed: 1,
      unsupportedGaps: ['No current field confirmation.'],
      outputHistoryCount: 0,
      memoryCount: 0,
    },
  } as unknown as CapsuleEvidencePack;
}
