import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {},
}));

vi.mock('@/lib/ai/providers', () => ({
  getEmbeddingModel: () => ({ provider: 'test-embedding-model' }),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    vector: (value: number[]) => ({ toArray: () => value }),
  },
}));

import {
  buildCapsuleEmbeddingInputs,
  embedCapsuleSemanticLayer,
  findCrossCapsuleSimilarities,
} from '@/lib/knowledge/vector-layer';
import { EMBEDDING_DIMENSION, EMBEDDING_MODEL } from '@/lib/knowledge/embedding-config';

describe('capsule semantic vector layer', () => {
  it('builds embedding inputs for every v3 section plus claim and source snippets', async () => {
    const capsule = makeCapsule('cap-a', 'Procurement review', 'Legal review is required.');
    const inputs = buildCapsuleEmbeddingInputs(capsule);

    expect(inputs.filter((input) => input.kind === 'section').map((input) => input.sectionId)).toEqual(capsule.sectionIds);
    expect(inputs).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'claim', claimId: 'claim-cap-a' }),
      expect.objectContaining({ kind: 'source', sourceId: 'src-cap-a' }),
    ]));

    const records = await embedCapsuleSemanticLayer(capsule, {
      embedTexts: async (texts) => texts.map((_, index) => vector(index === 0 ? 1 : 0.8)),
      now: () => '2026-05-14T00:00:00.000Z',
    });

    expect(records).toHaveLength(inputs.length);
    expect(records[0]).toMatchObject({
      capsuleId: 'cap-a',
      embeddingDimension: EMBEDDING_DIMENSION,
      embeddingModel: EMBEDDING_MODEL,
      createdAt: '2026-05-14T00:00:00.000Z',
    });
    expect(records.every((record) => record.embedding.length === EMBEDDING_DIMENSION)).toBe(true);
  });

  it('returns cross-capsule neighbors by cosine similarity', () => {
    const records = [
      record('cap-a', 'a-claim', vector(1, 0)),
      record('cap-b', 'b-claim', vector(0.92, 0.08)),
      record('cap-c', 'c-claim', vector(0.05, 0.95)),
    ];

    const neighbors = findCrossCapsuleSimilarities(records, 'cap-a', 2);

    expect(neighbors.map((neighbor) => neighbor.capsuleId)).toEqual(['cap-b', 'cap-c']);
    expect(neighbors[0].score).toBeGreaterThan(neighbors[1].score);
    expect(neighbors[0].matchedRecordIds).toEqual(['a-claim', 'b-claim']);
  });
});

function record(capsuleId: string, recordId: string, embedding: number[]) {
  return {
    recordId,
    capsuleId,
    kind: 'claim' as const,
    text: `${capsuleId} text`,
    embedding,
    embeddingDimension: EMBEDDING_DIMENSION,
    embeddingModel: EMBEDDING_MODEL,
    createdAt: '2026-05-14T00:00:00.000Z',
  };
}

function vector(first: number, second = 0): number[] {
  return [first, second, ...Array.from({ length: EMBEDDING_DIMENSION - 2 }, () => 0)];
}

function makeCapsule(capsuleId: string, label: string, claimText: string) {
  return {
    schemaVersion: 3 as const,
    baseSchemaVersion: 2 as const,
    sectionIds: [
      'identity',
      'businessUseCase',
      'humanTacitKnowledge',
      'sourceSpine',
      'contextCaptureProfile',
      'grounding',
      'claimLedger',
      'reasoningScaffold',
      'agentOperatingContract',
      'memoryPosture',
      'governance',
      'marketplaceProfile',
      'outputContracts',
      'evaluation',
    ] as const,
    identity: {
      capsuleId,
      ownerUid: 'u1',
      label,
      summary: `${label} summary`,
      scope: 'team',
      capsuleVersion: 1,
      capsuleClass: 'human_gated',
      capsuleMode: 'human_gated',
      visibility: 'private',
      forkability: 'review_required',
      createdAt: '2026-05-14T00:00:00.000Z',
      updatedAt: '2026-05-14T00:00:00.000Z',
      archivedAt: null,
      canonicalStore: 'Firestore ContextCapsules',
    },
    businessUseCase: { purpose: 'Purpose', useCase: 'Use case', audience: ['policy'], domainTags: ['governance'], decisionHorizon: null, updateCadence: null, bestNextAction: 'Review claim.' },
    humanTacitKnowledge: { workingAssumptions: [], hiddenConstraints: [], redLines: [], institutionalHabits: [], approvalPolitics: [], practicalHeuristics: [], stakeholderSensitivities: [], caveats: [], recurringDecisions: [], promptlessKnowledge: [] },
    sourceSpine: {
      sourceRefs: [{ sourceId: `src-${capsuleId}`, label: 'Official source', url: 'https://example.test/source', publisher: 'Official', date: '2026-05-01', reliabilityTier: 1 }],
      sourceIds: [`src-${capsuleId}`],
      requiredSourceTypes: [],
      sourceGaps: [],
      staleSourceIds: [],
      unsupportedClaimIds: [],
      independenceScore: 100,
      freshnessWindowDays: 90,
      score: 100,
    },
    contextCaptureProfile: {},
    grounding: {},
    claimLedger: {
      allClaims: [{
        claimId: `claim-${capsuleId}`,
        text: claimText,
        support: 'supported',
        sourceRefIds: [`src-${capsuleId}`],
        receipts: [{
          sourceId: `src-${capsuleId}`,
          snippet: claimText,
          reliabilityTier: 1,
          confidence: 0.9,
          stance: 'supports',
        }],
        validFrom: '2026-05-01',
        validUntil: null,
        asOf: '2026-05-14',
        causalLinks: { causes: [], causedBy: [], enables: [], blocks: [], escalates: [], deEscalates: [] },
      }],
      supportedClaims: [],
      weakClaims: [],
      unsupportedClaims: [],
      disputedClaims: [],
      staleClaims: [],
      inferredClaims: [],
      forbiddenClaims: [],
    },
    reasoningScaffold: { publicMethod: [], caveats: [], privateNotesRedacted: true, hiddenChainOfThoughtRedacted: true },
    agentOperatingContract: { allowedActions: [], forbiddenActions: [], sourceRequirements: [], reviewCheckpoints: [], toolRecommendations: [], bestNextAction: '', handoffInstructions: [], stopConditions: [] },
    memoryPosture: { canonicalCapsuleFacts: [], advisoryCogneeRecall: [], sessionMemory: [], graphProposals: [], staleAssumptions: [], disputedClaims: [], rejectedInferences: [], cogneeDatasetId: 'dataset', cogneeMode: 'advisory-only', cogneeOperations: [] },
    governance: { canonicalStore: 'Firestore ContextCapsules', humanGateRequired: true, humanGateStatus: 'approved', authorId: 'u1', reviewerId: 'u1', reviewedAt: '2026-05-14T00:00:00.000Z', approvalId: 'approval', agentsMayMutateCanonical: false, reviewCardsRequiredForTargets: [] },
    marketplaceProfile: { publicCandidate: false, forkable: false, reuseTerms: '', moderationSummary: '', shelves: [], trustBadges: [], requiredBeforePublish: [] },
    outputContracts: [],
    evaluation: { qualityScore: 100, tacitKnowledgeScore: 100, sourceSpineScore: 100, agentOperabilityScore: 100, marketplaceReadinessScore: 100, openGaps: [] },
    reviewCards: [],
  };
}
