import { describe, expect, it } from 'vitest';

import {
  CAPSULE_V3_AGENT_ROLES,
  CONTEXT_CAPSULE_V3_SECTION_IDS,
  buildCapsuleV3AgentReviewCards,
  buildCogneeAdvisoryReviewCard,
  canPublishCapsuleV3,
  claimsValidAt,
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
    expect(capsule.contextCaptureProfile.ontologyBinding).toMatchObject({
      unknownTypePolicy: 'candidate-extension-review-card',
      promotionGate: 'ADMIN_ALLOWLIST',
      canonicalStore: 'Firestore ContextCapsules',
    });
    expect(capsule.contextCaptureProfile.ontologyBinding.entitySubtypes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subtypeId: 'institution',
        primitive: 'Actor',
        source: 'global',
      }),
    ]));
    expect(capsule.contextCaptureProfile.ontologyBinding.relationshipSubtypes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subtypeId: 'has_mandate',
        source: 'global',
      }),
    ]));
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

  it('does not re-stale an already-normalized v2 capsule when v3 conversion is called without a new clock', () => {
    const readyV2 = makeCapsule();
    const readyV3 = normalizeContextCapsuleV3(readyV2);

    expect(readyV3.governance.humanGateStatus).toBe('approved');
    expect(canPublishCapsuleV3(readyV3, { actor: 'human', now: '2026-05-14T00:00:00.000Z' })).toMatchObject({
      allowed: true,
      status: 'human_gated',
    });
  });

  it('carries capsule-local ontology extensions into the binding contract', () => {
    const starter = CAPSULE_STARTER_DEFINITIONS[0];
    const capsule = normalizeContextCapsuleV3(makeCapsule({
      starterSnapshot: {
        ...starter,
        catalogVersion: CAPSULE_STARTER_CATALOG_VERSION,
        contextCaptureProfile: {
          ...starter.contextCaptureProfile,
          ontologyBinding: {
            ...starter.contextCaptureProfile.ontologyBinding,
            localExtensions: [{
              extensionId: 'field-mandate-risk',
              kind: 'entity',
              subtypeId: 'field_mandate_risk',
              label: 'Field Mandate Risk',
              primitive: 'Constraint',
              description: 'A capsule-local risk subtype used by field mandate analysts.',
              status: 'approved-local',
              evidenceIds: ['src-1'],
              createdAt: '2026-05-14T00:00:00.000Z',
            }],
          },
        },
      },
    }));

    expect(capsule.contextCaptureProfile.ontologyBinding.localExtensions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        extensionId: 'field-mandate-risk',
        subtypeId: 'field_mandate_risk',
        status: 'approved-local',
      }),
    ]));
    expect(capsule.contextCaptureProfile.ontologyBinding.entitySubtypes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subtypeId: 'field_mandate_risk',
        primitive: 'Constraint',
        source: 'capsule-local',
      }),
    ]));
  });

  it('persists explicit temporal, causal, ontology, and GraphLite grounding from capsule creation', () => {
    const capsule = normalizeContextCapsuleV3({
      ...makeCapsule(),
      grounding: {
        temporality: {
          timelineAnchors: [{
            id: 'anchor-review',
            label: 'Review window',
            date: '2026-06-15',
            kind: 'review',
            sourceRefs: ['src-1'],
          }],
        },
        causality: {
          causalLinks: [{
            id: 'causal-risk',
            cause: 'Legal review is incomplete',
            effect: 'Procurement recommendation remains blocked',
            relation: 'blocks',
            evidenceRefs: ['src-1'],
            confidence: 0.72,
          }],
        },
        ontologyBinding: {
          domainId: 'governance-rule-of-law',
          taxonomyPath: ['generic', 'governance-rule-of-law'],
          ontologyIds: ['governance', 'legal'],
          acoPrimitives: ['Actor', 'Claim', 'Constraint'],
          bindingRationale: 'Procurement governance needs actor, claim, and constraint extraction.',
        },
        embeddedGraph: {
          provider: 'graphlite',
          projectionId: 'ai-governance-procurement-graphlite-builder-projection',
          status: 'compiled-advisory',
          namedGraph: 'capsule_ai_governance_procurement',
          nodeCount: 2,
          edgeCount: 1,
          advisoryOnly: true,
          canonicalStore: 'Firestore ContextCapsules',
          promotionGate: 'Human review-card approval required before canonical graph promotion.',
          nodes: [
            { id: 'capsule:ai-governance-procurement', label: 'AI governance procurement', entityType: 'Policy', reviewState: 'advisory' },
            { id: 'domain:governance-rule-of-law', label: 'Governance & Rule of Law', entityType: 'Ontology', reviewState: 'advisory' },
          ],
          edges: [
            {
              id: 'capsule-domain-binding',
              source: 'capsule:ai-governance-procurement',
              target: 'domain:governance-rule-of-law',
              label: 'bound to domain',
              relationshipType: 'bound_to_domain',
              reviewState: 'advisory',
            },
          ],
        },
      },
    });

    expect(capsule.grounding.temporality.timelineAnchors[0]).toMatchObject({
      id: 'anchor-review',
      date: '2026-06-15',
    });
    expect(capsule.grounding.causality.causalLinks[0]).toMatchObject({
      cause: 'Legal review is incomplete',
      effect: 'Procurement recommendation remains blocked',
      relation: 'blocks',
    });
    expect(capsule.grounding.ontologyBinding).toMatchObject({
      domainId: 'governance-rule-of-law',
      ontologyIds: ['governance', 'legal'],
      acoPrimitives: ['Actor', 'Claim', 'Constraint'],
    });
    expect(capsule.grounding.embeddedGraph).toMatchObject({
      provider: 'graphlite',
      advisoryOnly: true,
      canonicalStore: 'Firestore ContextCapsules',
      nodeCount: 2,
      edgeCount: 1,
    });
    expect(capsule.grounding.embeddedGraph.nodes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'domain:governance-rule-of-law',
        entityType: 'Ontology',
        reviewState: 'advisory',
      }),
    ]));
    expect(capsule.grounding.embeddedGraph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'capsule-domain-binding',
        relationshipType: 'bound_to_domain',
      }),
    ]));
  });

  it('preserves enriched bi-temporal rationale fields on GraphLite grounding elements', () => {
    const capsule = normalizeContextCapsuleV3({
      ...makeCapsule(),
      grounding: {
        embeddedGraph: {
          provider: 'graphlite',
          projectionId: 'enriched-graphlite-projection',
          status: 'reviewed',
          namedGraph: 'capsule_enriched',
          advisoryOnly: true,
          canonicalStore: 'Firestore ContextCapsules',
          promotionGate: 'Human review-card approval required before canonical graph promotion.',
          nodes: [{
            id: 'claim-1',
            label: 'Claim one',
            entityType: 'Claim',
            reviewState: 'reviewed',
            confidence: 0.72,
            confidenceKind: 'INFERRED',
            recordedAt: '2026-06-12T12:00:00.000Z',
            rationale: 'The claim was extracted from a dated source receipt.',
            derivedFrom: ['source-claim-1'],
            generatedBy: {
              actorType: 'model',
              actorId: 'model-matrix:test',
              at: '2026-06-12T12:00:00.000Z',
              activity: 'extraction',
            },
          }],
          edges: [{
            id: 'edge-contradicts',
            source: 'claim-1',
            target: 'claim-2',
            label: 'contradicts',
            relationshipType: 'CONTRADICTS',
            reviewState: 'reviewed',
            confidence: 0.77,
            confidenceKind: 'ASSESSED',
            judgeRationale: 'The claims make mutually exclusive assertions.',
            recordedAt: '2026-06-12T12:05:00.000Z',
            invalidatedAt: '2026-06-13T12:05:00.000Z',
            invalidationReason: 'CONTRADICTED',
            supersededBy: 'edge-replacement',
            rationale: 'A contradiction judge compared the two claims.',
            derivedFrom: ['claim-1', 'claim-2'],
          }],
        },
      },
    });

    expect(capsule.grounding.embeddedGraph.nodes[0]).toMatchObject({
      id: 'claim-1',
      confidenceKind: 'INFERRED',
      recordedAt: '2026-06-12T12:00:00.000Z',
      derivedFrom: ['source-claim-1'],
      generatedBy: {
        actorType: 'model',
        activity: 'extraction',
      },
    });
    expect(capsule.grounding.embeddedGraph.edges[0]).toMatchObject({
      id: 'edge-contradicts',
      relationshipType: 'CONTRADICTS',
      confidenceKind: 'ASSESSED',
      invalidationReason: 'CONTRADICTED',
      supersededBy: 'edge-replacement',
      judgeRationale: 'The claims make mutually exclusive assertions.',
    });
  });

  it('computes claim support from receipts, preserves validity, and marks contradicting receipts disputed', () => {
    const capsule = normalizeContextCapsuleV3(makeCapsule({
      claimLedger: [{
        claimId: 'c-disputed',
        text: 'The procurement can proceed without legal review.',
        support: 'supported',
        sourceRefIds: ['src-1', 'src-2'],
        validFrom: '2026-05-01',
        validUntil: '2026-06-30',
        asOf: '2026-05-15',
        causalLinks: {
          blocks: ['claim-review-ready'],
          escalates: ['claim-procurement-risk'],
        },
        receipts: [
          {
            sourceId: 'src-1',
            url: 'https://example.test/rule',
            publisher: 'Official source',
            date: '2026-05-01',
            reliabilityTier: 1,
            snippet: 'Procurement recommendations require legal review.',
            page: 3,
            confidence: 0.91,
            stance: 'contradicts',
          },
          {
            sourceId: 'src-2',
            url: 'https://example.test/guidance',
            publisher: 'Regulator',
            date: '2026-04-20',
            reliabilityTier: 1,
            snippet: 'Operational readiness can be prepared before final review.',
            charOffset: { start: 120, end: 188 },
            embedding: [0.12, 0.34],
            confidence: 0.73,
            stance: 'supports',
          },
        ],
      }],
    }));

    const claim = capsule.claimLedger.allClaims[0];
    expect(claim.support).toBe('disputed');
    expect(claim.receipts).toHaveLength(2);
    expect(claim.validFrom).toBe('2026-05-01');
    expect(claim.validUntil).toBe('2026-06-30');
    expect(claim.asOf).toBe('2026-05-15');
    expect(claim.causalLinks.blocks).toContain('claim-review-ready');
    expect(claim.causalLinks.escalates).toContain('claim-procurement-risk');
    expect(capsule.claimLedger.disputedClaims.map((item) => item.claimId)).toContain('c-disputed');
    expect(capsule.claimLedger.supportedClaims.map((item) => item.claimId)).not.toContain('c-disputed');
  });

  it('filters claim ledger reads by as-of date', () => {
    const capsule = normalizeContextCapsuleV3(makeCapsule({
      claimLedger: [
        { claimId: 'current', text: 'Current rule applies.', support: 'supported', sourceRefIds: ['src-1'], validFrom: '2026-05-01', validUntil: '2026-06-30' },
        { claimId: 'expired', text: 'Old rule applies.', support: 'supported', sourceRefIds: ['src-1'], validFrom: '2026-01-01', validUntil: '2026-04-30' },
        { claimId: 'future', text: 'Future rule applies.', support: 'supported', sourceRefIds: ['src-1'], validFrom: '2026-07-01', validUntil: '2026-12-31' },
      ],
    }));

    expect(claimsValidAt(capsule, '2026-05-15').map((claim) => claim.claimId)).toEqual(['current']);
    expect(claimsValidAt(capsule, '2026-07-15').map((claim) => claim.claimId)).toEqual(['future']);
  });

  it('surfaces cross-claim contradictions into disputed claims and a review-gated evaluation scorecard', () => {
    const capsule = normalizeContextCapsuleV3(makeCapsule({
      claimLedger: [
        {
          claimId: 'corridor-open',
          text: 'The procurement corridor is open for accelerated award.',
          support: 'supported',
          sourceRefIds: ['src-1'],
          validFrom: '2026-05-01',
          validUntil: '2026-06-30',
          receipts: [{
            sourceId: 'src-1',
            url: 'https://example.test/rule',
            publisher: 'Official source',
            date: '2026-05-12',
            reliabilityTier: 1,
            snippet: 'The procurement corridor is open for accelerated award.',
            confidence: 0.9,
            stance: 'supports',
          }],
        },
        {
          claimId: 'corridor-not-open',
          text: 'The procurement corridor is not open for accelerated award.',
          support: 'supported',
          sourceRefIds: ['src-2'],
          validFrom: '2026-05-01',
          validUntil: '2026-06-30',
          receipts: [{
            sourceId: 'src-2',
            url: 'https://example.test/guidance',
            publisher: 'Regulator',
            date: '2026-05-13',
            reliabilityTier: 1,
            snippet: 'The procurement corridor is not open for accelerated award.',
            confidence: 0.88,
            stance: 'supports',
          }],
        },
      ],
    }));

    expect(capsule.claimLedger.crossClaimContradictions).toEqual([
      expect.objectContaining({
        claimIds: ['corridor-open', 'corridor-not-open'],
        reviewRequired: true,
      }),
    ]);
    expect(capsule.claimLedger.disputedClaims.map((claim) => claim.claimId)).toEqual(expect.arrayContaining([
      'corridor-open',
      'corridor-not-open',
    ]));
    expect(capsule.reviewCards).toEqual(expect.arrayContaining([
      expect.objectContaining({
        target: 'claimLedger',
        title: 'Review cross-claim contradiction',
        requiresHumanReview: true,
        mutatesCanonicalState: false,
        proposedPatch: expect.objectContaining({
          disputedClaimIds: ['corridor-open', 'corridor-not-open'],
        }),
      }),
    ]));
    expect(capsule.evaluation).toMatchObject({
      receiptDepth: 100,
      temporalityCoverage: 100,
      causalityCoverage: expect.any(Number),
      ontologyBindingCoverage: 100,
    });
    expect(capsule.evaluation.contradictionRate).toBeGreaterThan(0);
    expect(capsule.evaluation.groundedAnswerRate).toBeGreaterThan(0);
    expect(capsule.evaluation.sourceIndependence).toBeGreaterThan(0);
    expect(capsule.evaluation.capsuleVsGenericDelta).toBeGreaterThan(0);
    expect(capsule.evaluation.goldenQuestionEvals[0]).toMatchObject({
      baselineLabel: 'Generic prompt-only LLM',
      delta: expect.any(Number),
    });
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
