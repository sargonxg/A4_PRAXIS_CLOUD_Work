import { describe, expect, it } from 'vitest';

import { sanitizeCapsule } from '@/lib/context/capsule-service';
import {
  buildCapsuleAgentPayload,
  buildCapsuleImproveProposals,
  normalizeContextCapsuleV2,
  type ContextCapsuleV2,
} from '@/lib/context/capsule-v2';
import { deriveCapsuleQuality } from '@/lib/context/capsule-quality';
import {
  canPublishCapsule,
  canShowHumanReviewed,
  canShowHumanWritten,
  deriveHumanGateBadges,
  deriveHumanGateStatus,
} from '@/lib/context/human-gate';
import { deriveContextChainHealth } from '@/lib/context/context-chain-health';

describe('ContextCapsule v2 contract', () => {
  it('normalizes legacy Praxis capsules into a governed v2 envelope', () => {
    const legacy = sanitizeCapsule({
      schemaVersion: 1,
      capsuleId: 'legacy-policy-frame',
      ownerUid: 'u1',
      label: 'Legacy policy frame',
      summary: 'A legacy source-backed situation frame.',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
      coreRefs: {
        situationCoreId: 'sit-1',
        sourceCoreIds: ['src-1'],
        outputCoreIds: ['memo'],
      },
    });

    const capsule = normalizeContextCapsuleV2(legacy, { now: '2026-05-14T00:00:00.000Z' });

    expect(capsule.capsuleId).toBe('legacy-policy-frame');
    expect(capsule.schemaVersion).toBe(2);
    expect(capsule.capsuleClass).toBe('situation');
    expect(capsule.capsuleMode).toBe('team_private');
    expect(capsule.sourceRefs.map((source) => source.sourceId)).toEqual(['src-1']);
    expect(capsule.outputContracts.map((contract) => contract.outputId)).toEqual(['memo']);
    expect(capsule.reviewState.status).toBe('draft');
    expect(capsule.agentPermissions.canPublish).toBe(false);
  });

  it('prevents misleading human-written and human-reviewed labels', () => {
    const draft = makeCapsule({
      humanGate: {
        required: true,
        gateStatus: 'needs_review',
        authorId: 'analyst-1',
        authorName: 'Analyst One',
        authoredAt: '2026-05-10T00:00:00.000Z',
      },
      provenance: {
        createdBy: 'analyst-1',
        humanAuthorId: 'analyst-1',
        humanAuthorName: 'Analyst One',
        humanAuthoredAt: '2026-05-10T00:00:00.000Z',
        authoredSubstantiveBody: false,
      },
    });

    const reviewed = makeCapsule({
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
        expiresAt: '2026-06-12T00:00:00.000Z',
      },
      reviewState: {
        status: 'approved',
        reviewerId: 'reviewer-1',
        reviewedAt: '2026-05-12T00:00:00.000Z',
        approvalId: 'approval-1',
      },
    });

    expect(canShowHumanWritten(draft)).toBe(false);
    expect(canShowHumanReviewed(draft)).toBe(false);
    expect(deriveHumanGateStatus(draft, { now: '2026-05-14T00:00:00.000Z' })).toBe('needs_review');
    expect(canShowHumanWritten(reviewed)).toBe(true);
    expect(canShowHumanReviewed(reviewed)).toBe(true);
    expect(deriveHumanGateBadges(reviewed, { now: '2026-05-14T00:00:00.000Z' }).map((badge) => badge.id)).toEqual(expect.arrayContaining([
      'human-written',
      'human-reviewed',
      'human-gated',
    ]));
  });

  it('blocks publication when author, reviewer, approval, or freshness gates are missing', () => {
    const missingReviewer = makeCapsule({
      humanGate: {
        required: true,
        gateStatus: 'approved',
        authorId: 'analyst-1',
        authorName: 'Analyst One',
        authoredAt: '2026-05-10T00:00:00.000Z',
      },
      reviewState: { status: 'approved', approvalId: 'approval-1' },
    });
    const stale = makeCapsule({
      humanGate: {
        required: true,
        gateStatus: 'approved',
        authorId: 'analyst-1',
        authorName: 'Analyst One',
        authoredAt: '2026-01-01T00:00:00.000Z',
        reviewerId: 'reviewer-1',
        reviewerName: 'Reviewer One',
        reviewedAt: '2026-01-02T00:00:00.000Z',
        expiresAt: '2026-03-01T00:00:00.000Z',
      },
      reviewState: {
        status: 'approved',
        reviewerId: 'reviewer-1',
        reviewedAt: '2026-01-02T00:00:00.000Z',
        approvalId: 'approval-1',
      },
    });
    const ready = makeCapsule({
      humanGate: {
        required: true,
        gateStatus: 'approved',
        authorId: 'analyst-1',
        authorName: 'Analyst One',
        authoredAt: '2026-05-10T00:00:00.000Z',
        reviewerId: 'reviewer-1',
        reviewerName: 'Reviewer One',
        reviewedAt: '2026-05-12T00:00:00.000Z',
        expiresAt: '2026-06-12T00:00:00.000Z',
      },
      reviewState: {
        status: 'approved',
        reviewerId: 'reviewer-1',
        reviewedAt: '2026-05-12T00:00:00.000Z',
        approvalId: 'approval-1',
      },
    });

    expect(canPublishCapsule(missingReviewer, { now: '2026-05-14T00:00:00.000Z' }).allowed).toBe(false);
    expect(canPublishCapsule(stale, { now: '2026-05-14T00:00:00.000Z' })).toMatchObject({
      allowed: false,
      status: 'stale',
    });
    expect(canPublishCapsule(ready, { actor: 'agent', now: '2026-05-14T00:00:00.000Z' }).allowed).toBe(false);
    expect(canPublishCapsule(ready, { actor: 'human', now: '2026-05-14T00:00:00.000Z' }).allowed).toBe(true);
  });

  it('derives a deterministic sourceability-first quality breakdown', () => {
    const capsule = {
      ...makeCapsule({
        claimLedger: [
          {
            claimId: 'claim-1',
            text: 'Access constraints are worsening.',
            support: 'supported',
            sourceRefIds: ['src-1'],
            validFrom: '2026-05-01',
            asOf: '2026-05-12',
            causalLinks: { escalates: ['claim-2'] },
            receipts: [{
              sourceId: 'src-1',
              publisher: 'Official source',
              date: '2026-05-12T00:00:00.000Z',
              reliabilityTier: 1,
              snippet: 'Access constraints are worsening.',
              confidence: 0.91,
              stance: 'supports',
            }],
          },
          {
            claimId: 'claim-2',
            text: 'Negotiation window is narrow.',
            support: 'supported',
            sourceRefIds: ['src-2'],
            validFrom: '2026-05-01',
            asOf: '2026-05-11',
            causalLinks: { causedBy: ['claim-1'] },
            receipts: [{
              sourceId: 'src-2',
              publisher: 'UN',
              date: '2026-05-11T00:00:00.000Z',
              reliabilityTier: 1,
              snippet: 'Negotiation window is narrow.',
              confidence: 0.88,
              stance: 'supports',
            }],
          },
        ],
      }),
      v3: {
        grounding: {
          temporality: {
            timelineAnchors: [
              { id: 'anchor-1', label: 'Access update', date: '2026-05-12', kind: 'event', sourceRefs: ['src-1'] },
            ],
          },
          causality: {
            causalLinks: [
              { id: 'cause-1', cause: 'claim-1', effect: 'claim-2', relation: 'escalates', evidenceRefs: ['src-1'] },
            ],
          },
          ontologyBinding: {
            domainId: 'diplomacy',
            ontologyIds: ['governance'],
            acoPrimitives: ['Situation', 'Actor'],
          },
        },
      },
    };
    const quality = deriveCapsuleQuality(capsule, { now: '2026-05-14T00:00:00.000Z' });

    expect(quality.score).toBe(100);
    expect(quality.breakdown.map((item) => [item.id, item.maxScore])).toEqual([
      ['completeness', 15],
      ['source_support', 15],
      ['freshness', 10],
      ['human_review_provenance', 10],
      ['output_readiness', 10],
      ['agent_operability', 10],
      ['temporality_coverage', 7],
      ['causality_coverage', 7],
      ['ontology_binding_coverage', 6],
      ['receipt_depth', 8],
      ['contradiction_rate', 2],
    ]);

    const weak = deriveCapsuleQuality(makeCapsule({
      purpose: '',
      audience: [],
      sourcePosture: null,
      decisionHorizon: null,
      outputContracts: [],
      claimLedger: [{ claimId: 'c1', text: 'Unsupported claim.', support: 'unsupported', sourceRefIds: [] }],
      sourceRefs: [],
      humanGate: { required: true, gateStatus: 'needs_review' },
      agentPermissions: { canSuggest: true, canSource: true, canFork: true, canDraft: true, canPublish: false },
      bestNextAction: '',
    }), { now: '2026-05-14T00:00:00.000Z' });

    expect(weak.score).toBeLessThan(60);
    expect(weak.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'missing_purpose' }),
      expect.objectContaining({ code: 'missing_audience' }),
      expect.objectContaining({ code: 'no_source_posture' }),
      expect.objectContaining({ code: 'unsupported_claims' }),
      expect.objectContaining({ code: 'missing_output_contract' }),
      expect.objectContaining({ code: 'human_gated_missing_author_reviewer' }),
      expect.objectContaining({ code: 'agent_operable_missing_best_next_action_or_permissions' }),
      expect.objectContaining({ code: 'missing_temporality' }),
      expect.objectContaining({ code: 'missing_causality' }),
      expect.objectContaining({ code: 'missing_ontology_binding' }),
      expect.objectContaining({ code: 'low_receipt_depth' }),
    ]));
  });

  it('scores ContextChain health across strong, weak, stale, and unsupported chains', () => {
    const strong = deriveContextChainHealth({
      activeCapsule: makeCapsule({ capsuleClass: 'situation' }),
      referenceCapsules: [
        makeCapsule({ capsuleId: 'source-pack', capsuleClass: 'source_pack' }),
        makeCapsule({ capsuleId: 'thinking-device', capsuleClass: 'thinking_device' }),
        makeCapsule({ capsuleId: 'artifact', capsuleClass: 'artifact' }),
      ],
      now: '2026-05-14T00:00:00.000Z',
    });
    const weak = deriveContextChainHealth({
      activeCapsule: makeCapsule({ sourceRefs: [], claimLedger: [] }),
      referenceCapsules: [],
      now: '2026-05-14T00:00:00.000Z',
    });
    const unsupported = deriveContextChainHealth({
      activeCapsule: makeCapsule({
        claimLedger: [{ claimId: 'c1', text: 'Unsupported.', support: 'unsupported', sourceRefIds: [] }],
      }),
      referenceCapsules: [],
      now: '2026-05-14T00:00:00.000Z',
    });
    const stale = deriveContextChainHealth({
      activeCapsule: makeCapsule({
        humanGate: {
          required: true,
          gateStatus: 'approved',
          authorId: 'analyst-1',
          reviewerId: 'reviewer-1',
          reviewedAt: '2026-01-02T00:00:00.000Z',
          expiresAt: '2026-03-01T00:00:00.000Z',
        },
      }),
      referenceCapsules: [],
      now: '2026-05-14T00:00:00.000Z',
    });

    expect(strong).toMatchObject({ chainStrength: 'strong', safeUseLabel: 'final_memo_ready' });
    expect(weak).toMatchObject({ chainStrength: 'weak', safeUseLabel: 'exploratory_only' });
    expect(unsupported).toMatchObject({ chainStrength: 'blocked', safeUseLabel: 'review_required' });
    expect(stale).toMatchObject({ chainStrength: 'blocked', safeUseLabel: 'review_required' });
  });

  it('builds an agent payload without hidden reasoning or private editorial notes', () => {
    const payload = buildCapsuleAgentPayload(makeCapsule({
      reasoningScaffold: {
        publicMethod: ['Separate facts, inferences, recommendations, and open questions.'],
        caveats: ['Do not treat single-source claims as settled.'],
        privateNotes: ['Private reviewer concern.'],
        hiddenChainOfThought: 'Never expose this.',
      },
      editorialLog: [{
        logId: 'private-note',
        message: 'Internal editorial discussion.',
        visibility: 'private',
        createdAt: '2026-05-12T00:00:00.000Z',
      }],
    }), { now: '2026-05-14T00:00:00.000Z' });

    expect(JSON.stringify(payload)).toContain('Separate facts');
    expect(JSON.stringify(payload)).toContain('Do not treat single-source claims');
    expect(JSON.stringify(payload)).not.toContain('Private reviewer concern');
    expect(JSON.stringify(payload)).not.toContain('Never expose this');
    expect(JSON.stringify(payload)).not.toContain('Internal editorial discussion');
    expect(payload.forbiddenActions).toContain('publish_human_gated_capsule');
  });

  it('keeps Improve proposals review-gated for human-gated capsules', () => {
    const proposals = buildCapsuleImproveProposals(makeCapsule({
      claimLedger: [{ claimId: 'c1', text: 'Weak claim.', support: 'unsupported', sourceRefIds: [] }],
      sourceRefs: [],
      audience: [],
    }), { now: '2026-05-14T00:00:00.000Z' });

    expect(proposals.map((proposal) => proposal.action)).toEqual(expect.arrayContaining([
      'add_missing_source',
      'clarify_audience',
      'convert_weak_claim_into_sourced_claim',
      'request_human_review',
      'attach_to_current_context_chain',
    ]));
    expect(proposals.every((proposal) => proposal.reviewStatus === 'proposed')).toBe(true);
    expect(proposals.every((proposal) => proposal.requiresHumanReview)).toBe(true);
    expect(proposals.every((proposal) => proposal.mutatesApprovedBody === false)).toBe(true);
  });
});

function makeCapsule(overrides: Partial<ContextCapsuleV2> = {}): ContextCapsuleV2 {
  return normalizeContextCapsuleV2({
    capsuleId: overrides.capsuleId ?? 'crisis-strategy-room',
    ownerUid: 'u1',
    label: 'Crisis Strategy Room',
    summary: 'A source-backed policy judgment frame.',
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-05-12T00:00:00.000Z',
    version: 1,
    coreRefs: {
      situationCoreId: 'sit-crisis',
      sourceCoreIds: ['src-1', 'src-2'],
      toolCoreIds: ['sourceability', 'ach'],
      outputCoreIds: ['principals-decision-memo'],
    },
    capsuleClass: 'situation',
    capsuleMode: 'human_gated',
    domainTags: ['crisis', 'diplomacy'],
    audience: ['principals'],
    useCase: 'Sourceable policy judgment before a principals memo.',
    purpose: 'Prepare a reviewable decision frame.',
    bestNextAction: 'Run sourceability before drafting.',
    decisionHorizon: '72 hours',
    updateCadence: 'daily',
    expiry: '2026-06-12T00:00:00.000Z',
    sourcePosture: {
      posture: 'source_backed',
      requiredSourceTypes: ['official', 'multilateral'],
      freshnessWindowDays: 30,
    },
    evidenceRequirements: ['Every factual claim needs at least one source ref.'],
    claimLedger: [
      { claimId: 'claim-1', text: 'Access constraints are worsening.', support: 'supported', sourceRefIds: ['src-1'] },
      { claimId: 'claim-2', text: 'Negotiation window is narrow.', support: 'supported', sourceRefIds: ['src-2'] },
    ],
    sourceRefs: [
      { sourceId: 'src-1', label: 'Official update', publisher: 'Official source', url: 'https://example.test/src-1', date: '2026-05-12T00:00:00.000Z', reliabilityTier: 1 },
      { sourceId: 'src-2', label: 'Multilateral update', publisher: 'UN', url: 'https://example.test/src-2', date: '2026-05-11T00:00:00.000Z', reliabilityTier: 1 },
    ],
    reasoningScaffold: {
      publicMethod: ['Separate facts, inferences, options, caveats, and recommended checks.'],
      caveats: ['Keep confidence bounded by source freshness.'],
    },
    outputContracts: [{
      outputId: 'principals-decision-memo',
      label: 'Principals decision memo',
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
      expiresAt: '2026-06-12T00:00:00.000Z',
    },
    editorialLog: [],
    visibility: 'team',
    forkability: 'review_required',
    reuseTerms: 'Fork with source and review attribution.',
    ...overrides,
  }, { now: '2026-05-14T00:00:00.000Z' });
}
