import { describe, expect, it } from 'vitest';

import {
  CAPSULE_V3_AGENT_ROLES,
  CONTEXT_CAPSULE_V3_SECTION_IDS,
  buildCapsuleV3AgentReviewCards,
  buildCogneeAdvisoryReviewCard,
  canPublishCapsuleV3,
  deriveCapsuleV3QualityAudit,
  normalizeContextCapsuleV3,
  type CogneeAdvisoryReceipt,
} from '@/lib/context/capsule-v3';
import { normalizeContextCapsuleV2, type ContextCapsuleV2 } from '@/lib/context/capsule-v2';
import { CAPSULE_STARTER_CATALOG_VERSION, CAPSULE_STARTER_DEFINITIONS } from '@/lib/product/context-capsules';

describe('ContextCapsule v3 contract', () => {
  it('normalizes v2 capsules into the full human-gated v3 section contract', () => {
    const capsule = normalizeContextCapsuleV3(makeCapsule());

    expect(capsule.schemaVersion).toBe(3);
    expect(capsule.baseSchemaVersion).toBe(2);
    expect(capsule.sectionIds).toEqual(CONTEXT_CAPSULE_V3_SECTION_IDS);
    expect(capsule.identity).toMatchObject({
      capsuleId: 'ai-governance-procurement',
      canonicalStore: 'Firestore ContextCapsules',
      capsuleVersion: 4,
    });
    expect(capsule.businessUseCase.bestNextAction).toBe('Run sourceability before drafting.');
    expect(capsule.humanTacitKnowledge.redLines).toContain('No procurement recommendation without legal review.');
    expect(capsule.sourceSpine.score).toBeGreaterThanOrEqual(80);
    expect(capsule.contextCaptureProfile.profileId).toBe('starter-situation-us-federal-ai-governance-baseline-context-capture-v1');
    expect(capsule.contextCaptureProfile.sourceBindings.length).toBeGreaterThanOrEqual(2);
    expect(capsule.contextCaptureProfile.usageInference.activationSignals.length).toBeGreaterThanOrEqual(3);
    expect(capsule.contextCaptureProfile.embeddedGraph.reviewState).toBe('proposed');
    expect(capsule.contextCaptureProfile.generationImpact.suppresses.join(' ')).toMatch(/unsupported|stale|Cognee|canonical/i);
    expect(capsule.claimLedger.supportedClaims).toHaveLength(1);
    expect(capsule.reasoningScaffold.publicMethod).toContain('Separate obligations, assumptions, and procurement choices.');
    expect(capsule.agentOperatingContract.allowedActions).toEqual(expect.arrayContaining([
      'suggest',
      'source',
      'fork',
      'draft',
    ]));
    expect(capsule.memoryPosture.canonicalCapsuleFacts).toContain('ai-governance-procurement@v4');
    expect(capsule.memoryPosture.cogneeMode).toBe('advisory-only');
    expect(capsule.governance.agentsMayMutateCanonical).toBe(false);
    expect(capsule.marketplaceProfile.requiredBeforePublish).toContain('No unsupported final claims');
    expect(capsule.outputContracts).toHaveLength(1);
  });

  it('keeps Cognee recall advisory by converting receipts into review cards only', () => {
    const capsule = normalizeContextCapsuleV3(makeCapsule());
    const receipt: CogneeAdvisoryReceipt = {
      datasetId: 'owner:u1/capsule:ai-governance-procurement/v4',
      sourceCapsuleId: capsule.identity.capsuleId,
      sourceCapsuleVersion: capsule.identity.capsuleVersion,
      memoryItemId: 'mem-1',
      confidence: 0.58,
      sourceIds: ['src-1'],
      canonicality: 'advisory',
      operation: 'recall',
    };

    const card = buildCogneeAdvisoryReviewCard(capsule, receipt, {
      target: 'advisoryMemory',
      title: 'Recall prior procurement caveat',
      rationale: 'The memory hit may improve the advisory memory section after review.',
    });

    expect(card).toMatchObject({
      capsuleId: capsule.identity.capsuleId,
      capsuleVersion: 4,
      target: 'advisoryMemory',
      sourceType: 'cognee',
      state: 'proposed',
      requiresHumanReview: true,
      mutatesCanonicalState: false,
    });
    expect(card.evidenceReceipts[0]).toMatchObject({
      datasetId: 'owner:u1/capsule:ai-governance-procurement/v4',
      memoryItemId: 'mem-1',
      canonicality: 'advisory',
    });
  });

  it('blocks marketplace publishing until human review, source support, output, reuse, and moderation gates pass', () => {
    const ready = normalizeContextCapsuleV3(makeCapsule());
    expect(canPublishCapsuleV3(ready, { actor: 'human', now: '2026-05-14T00:00:00.000Z' })).toMatchObject({
      allowed: true,
      status: 'human_gated',
    });

    const weak = normalizeContextCapsuleV3(makeCapsule({
      claimLedger: [
        { claimId: 'c1', text: 'Unsupported compliance conclusion.', support: 'unsupported', sourceRefIds: [] },
      ],
      sourceRefs: [],
      outputContracts: [],
      reuseTerms: '',
      humanGate: {
        required: true,
        gateStatus: 'approved',
        authorId: 'analyst-1',
        authoredAt: '2026-05-10T00:00:00.000Z',
        reviewerId: 'reviewer-1',
        reviewedAt: '2026-01-10T00:00:00.000Z',
        expiresAt: '2026-02-01T00:00:00.000Z',
      },
    }));

    const result = canPublishCapsuleV3(weak, { actor: 'human', now: '2026-05-14T00:00:00.000Z' });
    expect(result.allowed).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'unsupported_final_claims',
      'source_spine_below_threshold',
      'missing_output_contract',
      'missing_reuse_terms',
      'stale_human_gate',
    ]));
  });

  it('scores v3 quality across tacit knowledge, source spine, agent operability, Cognee posture, and marketplace readiness', () => {
    const audit = deriveCapsuleV3QualityAudit(normalizeContextCapsuleV3(makeCapsule()));

    expect(audit.score).toBeGreaterThanOrEqual(85);
    expect(audit.breakdown.map((item) => item.id)).toEqual([
      'tacit_knowledge',
      'source_spine',
      'agent_operability',
      'cognee_posture',
      'human_review',
      'marketplace_readiness',
      'source_freshness',
    ]);
    expect(audit.reviewCardTargets).toEqual(expect.arrayContaining([
      'advisoryMemory',
      'sourceGap',
      'graphProposal',
      'claimLedger',
      'agentInstructions',
    ]));
  });

  it('maps specialized capsule agents to reviewable proposals and never canonical writes', () => {
    const capsule = normalizeContextCapsuleV3(makeCapsule());

    expect(CAPSULE_V3_AGENT_ROLES.map((agent) => agent.id)).toEqual([
      'capsule-editor-agent',
      'tacit-knowledge-interviewer',
      'source-spine-agent',
      'claim-ledger-agent',
      'cognee-memory-agent',
      'agent-operability-agent',
      'marketplace-curator-agent',
      'human-review-agent',
    ]);

    for (const role of CAPSULE_V3_AGENT_ROLES) {
      const cards = buildCapsuleV3AgentReviewCards(capsule, role.id);
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.every((card) => card.state === 'proposed')).toBe(true);
      expect(cards.every((card) => card.requiresHumanReview)).toBe(true);
      expect(cards.every((card) => card.mutatesCanonicalState === false)).toBe(true);
    }

    const humanReviewAgent = CAPSULE_V3_AGENT_ROLES.find((role) => role.id === 'human-review-agent');
    expect(humanReviewAgent?.canApproveOwnWork).toBe(false);
    expect(humanReviewAgent?.forbiddenActions).toContain('approve_own_work');
  });
});

function makeCapsule(overrides: Partial<ContextCapsuleV2> = {}): ContextCapsuleV2 {
  const starter = CAPSULE_STARTER_DEFINITIONS.find((item) => item.starterId === 'starter-situation-us-federal-ai-governance-baseline');
  if (!starter) throw new Error('Missing v3 starter fixture');
  return normalizeContextCapsuleV2({
    capsuleId: 'ai-governance-procurement',
    ownerUid: 'u1',
    label: 'AI governance procurement',
    summary: 'A source-backed AI procurement governance capsule.',
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-05-12T00:00:00.000Z',
    version: 4,
    scope: 'team',
    coreRefs: {
      userCoreId: 'policy-team',
      situationCoreId: 'ai-procurement',
      sourceCoreIds: ['src-1', 'src-2'],
      documentCoreIds: ['doc-1'],
      graphCoreId: null,
      toolCoreIds: ['sourceability-reviewer'],
      outputCoreIds: ['decision-memo'],
      objectiveCoreIds: ['procurement-decision'],
      productCoreIds: [],
      memoryCoreId: 'memory-1',
    },
    starterSnapshot: {
      ...starter,
      catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
    },
    capsuleClass: 'human_gated',
    capsuleMode: 'human_gated',
    domainTags: ['ai-governance', 'procurement'],
    audience: ['procurement counsel', 'policy lead'],
    useCase: 'Decide whether the procurement brief is ready for a human legal and governance review.',
    purpose: 'Prepare a reviewable AI procurement governance decision frame.',
    bestNextAction: 'Run sourceability before drafting.',
    decisionHorizon: '30 days',
    updateCadence: 'weekly while procurement is active',
    expiry: '2026-06-30T00:00:00.000Z',
    sourcePosture: {
      posture: 'source_backed',
      requiredSourceTypes: ['official', 'regulator'],
      freshnessWindowDays: 90,
    },
    evidenceRequirements: ['Every compliance or procurement claim needs source and counsel review.'],
    claimLedger: [
      { claimId: 'c1', text: 'The procurement requires source-backed role classification.', support: 'supported', sourceRefIds: ['src-1'] },
      { claimId: 'c2', text: 'Operational readiness remains a reviewed assumption.', support: 'partially_supported', sourceRefIds: ['src-2'], caveat: 'Needs final owner review.' },
    ],
    sourceRefs: [
      { sourceId: 'src-1', label: 'Official procurement rule', publisher: 'Official source', url: 'https://example.test/rule', date: '2026-05-01T00:00:00.000Z', reliabilityTier: 1 },
      { sourceId: 'src-2', label: 'Regulator guidance', publisher: 'Regulator', url: 'https://example.test/guidance', date: '2026-04-20T00:00:00.000Z', reliabilityTier: 1 },
    ],
    reasoningScaffold: {
      publicMethod: ['Separate obligations, assumptions, and procurement choices.'],
      caveats: ['No procurement recommendation without legal review.'],
      privateNotes: ['Do not expose the private counsel preference.'],
      hiddenChainOfThought: 'Private deliberation must not be serialized.',
    },
    outputContracts: [{
      outputId: 'decision-memo',
      label: 'Decision memo',
      artifactType: 'memo',
      citationRequired: true,
      reviewRequired: true,
    }],
    agentPermissions: {
      canSuggest: true,
      canSource: true,
      canFork: true,
      canDraft: true,
      canPublish: false,
    },
    reviewState: {
      status: 'approved',
      reviewerId: 'reviewer-1',
      reviewerName: 'Reviewer One',
      reviewedAt: '2026-05-12T00:00:00.000Z',
      approvalId: 'approval-1',
    },
    provenance: {
      createdBy: 'analyst-1',
      humanAuthorId: 'analyst-1',
      humanAuthorName: 'Analyst One',
      humanAuthoredAt: '2026-05-10T00:00:00.000Z',
      authoredSubstantiveBody: true,
    },
    humanGate: {
      required: true,
      gateStatus: 'approved',
      authorId: 'analyst-1',
      authorName: 'Analyst One',
      authoredAt: '2026-05-10T00:00:00.000Z',
      reviewerId: 'reviewer-1',
      reviewerName: 'Reviewer One',
      reviewedAt: '2026-05-12T00:00:00.000Z',
      expiresAt: '2026-06-30T00:00:00.000Z',
    },
    editorialLog: [],
    visibility: 'public',
    forkability: 'allowed',
    reuseTerms: 'Fork with source, author, and reviewer attribution.',
    ...overrides,
  }, { now: '2026-05-14T00:00:00.000Z' });
}
