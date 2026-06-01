import { describe, expect, it } from 'vitest';
import {
  buildDocumentLearningReviewCardInputs,
  buildUsageLearningReviewCardInput,
  buildUserFeedbackLearningReviewCardInput,
  validateCapsuleLearningWorkerAuth,
} from '@/lib/context/capsule-closed-loop-learning';
import type { PraxisCapsule } from '@/lib/context/capsule-service';

describe('capsule closed-loop learning', () => {
  it('turns thumbs-down corrections into human-gated tacit and claim ledger patches', () => {
    const card = buildUserFeedbackLearningReviewCardInput(baseCapsule(), {
      situationId: 'sit-1',
      toolId: 'ask-praxis',
      answerId: 'answer-1',
      confidence: 1,
      issues: ['inaccurate'],
      suggestion: 'The access corridor is not open; mark the corridor claim disputed until UN access reporting confirms it.',
      createdAt: '2026-06-01T10:00:00.000Z',
      sourceabilityVerdicts: [{
        claimId: 'claim-corridor',
        claim: 'The access corridor is open.',
        verdict: 'contradicted',
        supportLabel: 'contradicted',
        sourceIds: ['src-un-access'],
        confidence: 0.84,
      }],
    });

    expect(card).toMatchObject({
      sourceType: 'user',
      target: 'claimLedger',
      state: 'owner_review',
      title: expect.stringMatching(/feedback correction/i),
    });
    expect(card.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'feedback:ask-praxis:answer-1',
        advisory: true,
        sourceType: 'user-feedback',
      }),
      expect.objectContaining({
        id: 'claim-corridor',
        sourceType: 'sourceability-verdict',
      }),
    ]));
    expect(card.proposedEnvelopePatch?.latestGateState).toBe('owner_review');
    expect(card.proposedEnvelopePatch?.humanTacitKnowledge).toMatchObject({
      promptlessKnowledge: expect.arrayContaining([
        expect.stringMatching(/access corridor is not open/i),
      ]),
    });
    expect(card.proposedEnvelopePatch?.memoryPosture).toMatchObject({
      disputedClaims: expect.arrayContaining([
        expect.stringMatching(/access corridor is not open/i),
      ]),
      rejectedInferences: expect.arrayContaining([
        expect.stringMatching(/ask-praxis/i),
      ]),
    });
    expect(card.proposedEnvelopePatch?.claimLedger).toEqual(expect.arrayContaining([
      expect.objectContaining({
        claimId: 'claim-corridor',
        support: 'disputed',
        caveat: expect.stringMatching(/user correction/i),
      }),
    ]));
  });

  it('keeps document extraction as review-gated claim/source/graph proposals', () => {
    const cards = buildDocumentLearningReviewCardInputs(baseCapsule(), {
      documentId: 'doc-1',
      title: 'UN access bulletin',
      createdAt: '2026-06-01T11:00:00.000Z',
      sources: [{
        sourceId: 'src-un-access-2026',
        label: 'UN access bulletin',
        url: 'https://example.test/un-access',
        publisher: 'UN',
        date: '2026-06-01',
        reliabilityTier: 1,
      }],
      claims: [{
        text: 'UN reporting says the access corridor remains closed.',
        sourceId: 'src-un-access-2026',
        snippet: 'The access corridor remains closed pending verification.',
        confidence: 0.86,
      }],
      graphProposals: ['Actor -> Constraint: corridor closure blocks relief access'],
    });

    expect(cards).toHaveLength(2);
    expect(cards.every((card) => card.state === 'owner_review')).toBe(true);
    expect(cards.map((card) => card.target)).toEqual(['claimLedger', 'graphProposal']);
    expect(cards[0]?.proposedEnvelopePatch?.sourceRefs).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceId: 'src-un-access-2026' }),
    ]));
    expect(cards[0]?.proposedEnvelopePatch?.claimLedger).toEqual(expect.arrayContaining([
      expect.objectContaining({
        support: 'supported',
        receipts: [expect.objectContaining({
          sourceId: 'src-un-access-2026',
          stance: 'supports',
        })],
      }),
    ]));
    expect(cards[1]?.proposedEnvelopePatch?.memoryPosture).toMatchObject({
      graphProposals: expect.arrayContaining([
        expect.stringMatching(/corridor closure blocks relief access/i),
      ]),
    });
  });

  it('uses sourceability usage to propose disputed claims and next-source gaps', () => {
    const card = buildUsageLearningReviewCardInput(baseCapsule(), {
      answerId: 'answer-2',
      usedAt: '2026-06-01T12:00:00.000Z',
      claimUsages: [{
        claimId: 'claim-corridor',
        claim: 'The access corridor is open.',
        verdict: 'contradicted',
        sourceIds: [],
      }],
    });

    expect(card).not.toBeNull();
    expect(card?.target).toBe('claimLedger');
    expect(card?.proposedEnvelopePatch?.claimLedger).toEqual(expect.arrayContaining([
      expect.objectContaining({
        claimId: 'claim-corridor',
        support: 'disputed',
      }),
    ]));
    expect(card?.proposedEnvelopePatch?.sourcePosture).toMatchObject({
      sourceGaps: expect.arrayContaining([
        expect.stringMatching(/corroborating source/i),
      ]),
    });
  });

  it('requires cron-secret or verified OIDC worker auth', () => {
    expect(validateCapsuleLearningWorkerAuth({})).toMatchObject({
      ok: false,
      mode: null,
    });
    expect(validateCapsuleLearningWorkerAuth({
      authorizationHeader: 'Bearer secret-1234567890',
      cronSecret: 'secret-1234567890',
    })).toMatchObject({
      ok: true,
      mode: 'cron-secret',
    });
    expect(validateCapsuleLearningWorkerAuth({
      oidcVerified: true,
      oidcAudience: 'https://praxis.tacitus.me/api/internal/capsule-learning',
      expectedOidcAudience: 'https://praxis.tacitus.me/api/internal/capsule-learning',
      oidcSubject: 'capsule-learning-worker@praxisbytacitus.iam.gserviceaccount.com',
    })).toMatchObject({
      ok: true,
      mode: 'oidc',
    });
  });
});

function baseCapsule(): PraxisCapsule {
  return {
    capsuleId: 'cap-learning',
    ownerUid: 'u1',
    version: 3,
    label: 'Access capsule',
    claimLedger: [{
      claimId: 'claim-corridor',
      text: 'The access corridor is open.',
      support: 'supported',
      sourceRefIds: ['src-old'],
    }],
    sourceRefs: [{
      sourceId: 'src-old',
      label: 'Old access report',
      publisher: 'Field team',
      date: '2026-05-01',
      reliabilityTier: 2,
    }],
    humanTacitKnowledge: {
      workingAssumptions: [],
      hiddenConstraints: [],
      redLines: [],
      institutionalHabits: [],
      approvalPolitics: [],
      practicalHeuristics: [],
      stakeholderSensitivities: [],
      caveats: [],
      recurringDecisions: [],
      promptlessKnowledge: ['Treat corridor status as date-bound.'],
    },
    memoryPosture: {
      canonicalCapsuleFacts: [],
      advisoryCogneeRecall: [],
      sessionMemory: [],
      graphProposals: [],
      staleAssumptions: [],
      disputedClaims: [],
      rejectedInferences: [],
      cogneeDatasetId: 'cap-learning',
      cogneeMode: 'advisory-only',
      cogneeOperations: ['remember', 'recall', 'improve', 'forget'],
    },
    sourcePosture: {
      posture: 'source_backed',
      requiredSourceTypes: ['UN access reporting'],
      freshnessWindowDays: 30,
      sourceGaps: [],
    },
  } as unknown as PraxisCapsule;
}
