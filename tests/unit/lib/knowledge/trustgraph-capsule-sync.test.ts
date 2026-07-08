import { describe, expect, it } from 'vitest';

import { buildTrustGraphCapsuleSyncRequest } from '@/lib/knowledge/trustgraph-capsule-sync';

describe('TrustGraph capsule sync compiler', () => {
  it('compiles a rich ContextCapsule into advisory-only sync segments', () => {
    const payload = buildTrustGraphCapsuleSyncRequest({
      uid: 'u1',
      workspaceMode: 'owner-capsule',
      collectionPrefix: 'praxis',
      capsule: {
        schemaVersion: 2,
        capsuleId: 'cap-sync',
        ownerUid: 'u1',
        label: 'Context sync capsule',
        summary: 'A capsule that carries situation, source, ontology, tool, output, and memory context.',
        createdAt: '2026-05-30T00:00:00.000Z',
        updatedAt: '2026-05-30T00:00:00.000Z',
        version: 5,
        scope: 'team',
        coreRefs: {
          userCoreId: 'user-core-1',
          teamCoreId: 'team-core-1',
          situationCoreId: 'sit-1',
          pathCoreId: 'diplomacy',
          sourceCoreIds: ['src-1'],
          documentCoreIds: ['doc-1'],
          graphCoreId: 'graph-1',
          timeCoreId: 'time-1',
          toolCoreIds: ['sourceability'],
          objectiveCoreIds: ['obj-1'],
          productCoreIds: ['principals-memo'],
          outputCoreIds: ['memo'],
          memoryCoreId: 'mem-1',
        },
        capsuleClass: 'human_gated',
        capsuleMode: 'human_gated',
        domainTags: ['diplomacy', 'humanitarian-access'],
        audience: ['policy lead', 'field analyst'],
        useCase: 'Decide which access constraints need escalation.',
        purpose: 'Build a source-backed operating picture.',
        bestNextAction: 'Run sourceability before drafting.',
        decisionHorizon: '72 hours',
        updateCadence: 'daily',
        sourcePosture: {
          posture: 'source_backed',
          requiredSourceTypes: ['official', 'multilateral'],
          freshnessWindowDays: 7,
        },
        evidenceRequirements: ['Every operational claim needs a source receipt.'],
        sourceRefs: [{
          sourceId: 'src-1',
          label: 'Official access update',
          publisher: 'UN',
          url: 'https://example.test/update',
          date: '2026-05-28T00:00:00.000Z',
          reliabilityTier: 1,
        }],
        claimLedger: [{
          claimId: 'claim-1',
          text: 'Access constraints are rising.',
          support: 'supported',
          sourceRefIds: ['src-1'],
        }],
        reasoningScaffold: {
          publicMethod: ['Separate access facts, assumptions, and escalation choices.'],
          caveats: ['Do not imply implementation status without a current receipt.'],
          privateNotes: ['Keep analyst preference private.'],
          hiddenChainOfThought: 'Never serialize this.',
        },
        outputContracts: [{
          outputId: 'memo',
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
          reviewedAt: '2026-05-30T00:00:00.000Z',
          approvalId: 'approval-1',
        },
        provenance: {
          createdBy: 'analyst-1',
          humanAuthorId: 'analyst-1',
          humanAuthoredAt: '2026-05-30T00:00:00.000Z',
          authoredSubstantiveBody: true,
        },
        humanGate: {
          required: true,
          gateStatus: 'approved',
          authorId: 'analyst-1',
          reviewerId: 'reviewer-1',
          reviewedAt: '2026-05-30T00:00:00.000Z',
          expiresAt: '2036-06-30T00:00:00.000Z',
        },
        visibility: 'private',
        forkability: 'review_required',
        reuseTerms: 'Private team capsule.',
        memoryPosture: {
          canonicalCapsuleFacts: ['Reviewer prefers caveats before escalation claims.'],
          advisoryCogneeRecall: ['Prior access memo emphasized source dates.'],
          graphProposals: ['graph-candidate-1'],
          sessionMemory: ['User asked for daily review.'],
          rejectedInferences: ['No access corridor should be marked open without receipt.'],
          cogneeDatasetId: 'owner:u1/capsule:cap-sync/v5',
        },
      },
    });

    expect(payload).toMatchObject({
      uid: 'u1',
      capsuleId: 'cap-sync',
      workspaceId: 'owner_u1__capsule_cap-sync',
      collectionId: 'praxis__u1__cap-sync',
      capsuleVersion: 5,
      advisoryOnly: true,
      sourceRefs: ['src-1'],
      documentRefs: ['doc-1'],
      graphRefs: ['graph-1', 'graph-candidate-1'],
      toolRefs: ['sourceability'],
      outputRefs: ['memo', 'principals-memo'],
      memoryRefs: ['mem-1', 'owner:u1/capsule:cap-sync/v5'],
    });

    expect(payload.segments.every((segment) => segment.advisoryOnly)).toBe(true);
    expect(payload.segments.every((segment) => segment.reviewRequired || segment.coreKind === 'identity')).toBe(true);
    expect(payload.segments.map((segment) => segment.coreKind)).toEqual(expect.arrayContaining([
      'identity',
      'user',
      'situation',
      'path',
      'source',
      'document',
      'graph',
      'time',
      'tool',
      'objective',
      'product',
      'output',
      'memory',
      'ontology',
      'governance',
      'review',
    ]));

    const joinedText = payload.segments.map((segment) => segment.text).join('\n');
    expect(joinedText).toContain('Access constraints are rising.');
    expect(joinedText).toContain('Official access update');
    expect(joinedText).toContain('Reviewer prefers caveats');
    expect(joinedText).toContain('Forbidden action: publish');
    expect(joinedText).toContain('Human gate: approved');
  });
});
