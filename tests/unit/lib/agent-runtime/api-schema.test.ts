import { describe, expect, it } from 'vitest';
import { buildMemoOutputReview } from '@/lib/memo/output-review';
import {
  AgentRunOutputSchema,
  CreateManualAgentRunRequestSchema,
  GetAgentRunParamsSchema,
  ListAgentRunsQuerySchema,
  toAgentRunOutput,
} from '@/lib/agent-runtime/schema';

describe('agent run API validation schema', () => {
  it('accepts a minimal queued manual run request', () => {
    const parsed = CreateManualAgentRunRequestSchema.safeParse({
      objective: 'Prepare a sourceability pass for the active capsule.',
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.triggerType).toBe('manual');
    }
  });

  it('rejects missing objective and oversized runtime bounds', () => {
    expect(CreateManualAgentRunRequestSchema.safeParse({}).success).toBe(false);
    expect(CreateManualAgentRunRequestSchema.safeParse({
      objective: 'Run',
      maxStep: 101,
    }).success).toBe(false);
    expect(CreateManualAgentRunRequestSchema.safeParse({
      objective: 'Run',
      maxSessionMinutes: 24 * 60 + 1,
    }).success).toBe(false);
  });

  it('accepts selected capsule core pointers without requiring model/tool execution fields', () => {
    const parsed = CreateManualAgentRunRequestSchema.safeParse({
      capsuleId: 'cap-1',
      contextPackageId: 'pack-1',
      policyAgentId: 'research-memo',
      outputDestination: 'memo_studio',
      objective: 'Queue only.',
      selectedCoreIds: {
        situationCoreId: 'sit-1',
        sourceCoreIds: ['source-1'],
        toolCoreIds: ['policy-memo'],
      },
    });

    expect(parsed.success).toBe(true);
  });

  it('validates route params and list query values', () => {
    expect(GetAgentRunParamsSchema.parse({ runId: ' run-1 ' })).toEqual({ runId: 'run-1' });
    expect(ListAgentRunsQuerySchema.parse({ capsuleId: 'cap-1', limit: '10' })).toEqual({ capsuleId: 'cap-1', limit: 10 });
    expect(ListAgentRunsQuerySchema.safeParse({ limit: '10' }).success).toBe(false);
  });

  it('builds a normal UI-safe run output DTO', () => {
    const dto = toAgentRunOutput({
      id: 'run-1',
      status: 'queued',
      capsuleId: 'cap-1',
      createdAt: '2026-05-15T12:00:00.000Z',
      updatedAt: '2026-05-15T12:00:00.000Z',
      objective: 'Prepare memo',
      internalEstimatedCostCents: 25,
      internalSpendCents: 10,
    } as never);

    expect(dto).toEqual({
      runId: 'run-1',
      status: 'queued',
      capsuleId: 'cap-1',
      createdAt: '2026-05-15T12:00:00.000Z',
      updatedAt: '2026-05-15T12:00:00.000Z',
      objective: 'Prepare memo',
      policyAgentId: null,
      policyAgentLabel: null,
      outputDestination: null,
      outputHref: null,
      readiness: null,
      riskLevel: null,
      contextReceipt: {
        activeCapsuleOrChain: 'cap-1',
        selectedTools: [],
        outputDestination: null,
        sourcePosture: null,
        sourceCount: 0,
        approvalGateCount: 0,
        groundingPosture: 'No grounding metadata',
        degradedReason: null,
      },
      selectedTools: [],
      searchPlan: null,
      sourceReceiptIds: [],
      sourcePosture: 'No grounding metadata',
      sourceCount: 0,
      groundingPlan: null,
      groundingPosture: 'No grounding metadata',
      degradedReason: null,
      approvalGateCount: 0,
      outputTargetLabel: null,
      artifactIds: [],
      latestMirroredEvent: null,
      failureSummary: null,
    });
    expect(AgentRunOutputSchema.safeParse(dto).success).toBe(true);
    expect('internalSpendCents' in dto).toBe(false);
  });

  it('exposes a sanitized context receipt for agent workspaces', () => {
    const dto = toAgentRunOutput({
      id: 'run-1',
      status: 'queued',
      capsuleId: 'cap-1',
      createdAt: '2026-05-19T12:00:00.000Z',
      updatedAt: '2026-05-19T12:00:00.000Z',
      objective: 'Prepare memo',
      metadata: {
        policyAgentId: 'research-memo',
        outputDestination: 'memo_studio',
        appliedCapsules: [
          { id: 'starter-user-generic-analyst', label: 'Generic analyst', role: 'user' },
          { id: 'situation-cap', label: 'Situation core', role: 'situation' },
        ],
        selectedTools: ['sourceability-check'],
        sourcePosture: 'Grounded',
        sourceCount: 3,
        approvalGateCount: 1,
        groundingPosture: 'Google grounding requested',
      },
    } as never);

    expect(dto.contextReceipt).toEqual({
      activeCapsuleOrChain: 'Generic analyst + Situation core',
      selectedTools: ['sourceability-check'],
      outputDestination: 'memo_studio',
      sourcePosture: 'Grounded',
      sourceCount: 3,
      approvalGateCount: 1,
      groundingPosture: 'Google grounding requested',
      degradedReason: null,
    });
    expect(dto).toMatchObject({
      selectedTools: ['sourceability-check'],
      sourcePosture: 'Grounded',
      sourceCount: 3,
      approvalGateCount: 1,
      outputTargetLabel: 'Work',
    });
  });

  it('exposes safe search and grounding proof fields without internal spend', () => {
    const dto = toAgentRunOutput({
      id: 'run-search-1',
      status: 'queued',
      capsuleId: 'cap-1',
      createdAt: '2026-05-20T12:00:00.000Z',
      updatedAt: '2026-05-20T12:00:00.000Z',
      objective: 'Do a current multi-source search.',
      metadata: {
        selectedToolIds: ['context-resolve', 'grounded-search', 'deep-search-agent'],
        searchPlan: {
          queries: ['latest access restrictions'],
          sourceClasses: ['public_web', 'attached_sources'],
          freshnessNeed: 'current',
          timeframe: 'last 30 days',
        },
        sourceReceiptIds: ['src-1', 'src-2'],
        groundingPlan: {
          modes: ['internal_capsule_corpus'],
          deferredModes: ['google_search'],
          requiresSearchSuggestionsDisplay: false,
          receiptPosture: 'praxis_canonical',
        },
        sourcePosture: 'Source receipts saved',
        groundingPosture: 'Grounding unavailable',
        degradedReason: 'Google Search grounding is not configured.',
        internalSpendCents: 2500,
      },
    } as never);

    expect(dto).toMatchObject({
      selectedTools: ['context-resolve', 'grounded-search', 'deep-search-agent'],
      sourceReceiptIds: ['src-1', 'src-2'],
      sourceCount: 2,
      sourcePosture: 'Source receipts saved',
      groundingPosture: 'Grounding unavailable',
      degradedReason: 'Google Search grounding is not configured.',
      searchPlan: {
        queries: ['latest access restrictions'],
        sourceClasses: ['public_web', 'attached_sources'],
        freshnessNeed: 'current',
        timeframe: 'last 30 days',
      },
    });
    expect(dto.contextReceipt).toMatchObject({
      groundingPosture: 'Grounding unavailable',
      degradedReason: 'Google Search grounding is not configured.',
    });
    expect(JSON.stringify(dto)).not.toContain('internalSpendCents');
    expect(JSON.stringify(dto)).not.toContain('2500');
  });

  it('preserves user-facing proof fields while dropping raw provider errors and secrets', () => {
    const dto = toAgentRunOutput({
      id: 'run-proof-1',
      status: 'running',
      capsuleId: 'cap-1',
      createdAt: '2026-05-22T12:00:00.000Z',
      updatedAt: '2026-05-22T12:01:00.000Z',
      objective: 'Review claims.',
      metadata: {
        policyAgentId: 'sourceability-reviewer',
        selectedToolIds: ['context-resolve', 'sourceability-reviewer'],
        sourceCount: 4,
        approvalGateCount: 1,
        sourcePosture: 'Source receipts saved',
        groundingPosture: 'Source review requested',
        sourceabilityLedgerSummary: {
          totalClaims: 6,
          supportedClaims: 2,
          weakClaims: 1,
          unsupportedClaims: 1,
          contradictedClaims: 0,
          modelPriorClaims: 1,
          assumptionClaims: 1,
        },
        rawProviderError: 'GOOGLE_API_KEY=secret stack trace',
        serviceAccountEmail: 'praxis@appspot.gserviceaccount.com',
        internalEstimatedCostCents: 9999,
      },
    } as never);

    expect(dto).toMatchObject({
      policyAgentLabel: 'Sourceability Reviewer',
      selectedTools: ['context-resolve', 'sourceability-reviewer'],
      sourceabilityLedgerSummary: {
        totalClaims: 6,
        unsupportedClaims: 1,
        modelPriorClaims: 1,
      },
      contextReceipt: {
        sourceCount: 4,
        approvalGateCount: 1,
        groundingPosture: 'Source review requested',
      },
    });
    const serialized = JSON.stringify(dto);
    expect(serialized).not.toContain('GOOGLE_API_KEY');
    expect(serialized).not.toContain('stack trace');
    expect(serialized).not.toContain('gserviceaccount.com');
    expect(serialized).not.toContain('9999');
  });

  it('exposes artifact ids and latest mirrored event as safe process-rail fields', () => {
    const dto = toAgentRunOutput({
      id: 'run-artifacts-1',
      status: 'succeeded',
      capsuleId: 'cap-1',
      createdAt: '2026-05-24T12:00:00.000Z',
      updatedAt: '2026-05-24T12:05:00.000Z',
      objective: 'Create a handover package.',
      metadata: {
        policyAgentId: 'handover-builder',
        outputDestination: 'handover',
        artifactIds: ['memo-1', 'out-1'],
        memoId: 'memo-1',
        outputCapsuleId: 'out-1',
        handoverPackageId: 'handover-1',
        latestMirroredEvent: {
          eventType: 'praxis.output_created',
          message: 'Handover output persisted.',
          createdAt: '2026-05-24T12:04:59.000Z',
          rawProviderPayload: 'secret provider payload',
        },
      },
    } as never);

    expect(dto).toMatchObject({
      policyAgentLabel: 'Handover Builder',
      outputDestination: 'handover',
      outputTargetLabel: 'Handover',
      artifactIds: ['memo-1', 'out-1', 'handover-1'],
      latestMirroredEvent: {
        eventType: 'praxis.output_created',
        message: 'Handover output persisted.',
        createdAt: '2026-05-24T12:04:59.000Z',
      },
    });
    expect(JSON.stringify(dto)).not.toContain('rawProviderPayload');
    expect(JSON.stringify(dto)).not.toContain('secret provider payload');
  });

  it('exposes sanitized failure forensics without raw stack, URLs, or secrets', () => {
    const dto = toAgentRunOutput({
      id: 'run-failed-1',
      status: 'failed',
      capsuleId: 'cap-1',
      createdAt: '2026-06-11T12:00:00.000Z',
      updatedAt: '2026-06-11T12:01:00.000Z',
      objective: 'Prepare memo',
      metadata: {
        policyAgentId: 'research-memo',
        failureSummary: {
          schemaVersion: 1,
          category: 'evidence_pack_failed',
          failedPhase: 'evidence-pack',
          executionMode: 'research-memo',
          policyAgentId: 'research-memo',
          errorName: 'Error',
          sanitizedError: 'Provider failed at https://internal.example/run token=secret',
          retryGuidance: 'Refresh the capsule context and source attachments, then retry the run.',
          lastEventBeforeFailure: {
            eventId: 'event-1',
            eventType: 'praxis.context_resolved',
            message: 'Context resolved.',
            phase: 'context_resolved',
            createdAt: '2026-06-11T12:00:30.000Z',
          },
          failingToolCall: {
            toolCallId: null,
            toolId: 'capsule-evidence-pack',
            status: 'failed',
            risk: null,
            error: 'Provider failed at https://internal.example/run token=secret',
            startedAt: null,
            completedAt: null,
          },
          createdAt: '2026-06-11T12:01:00.000Z',
        },
      },
    } as never);

    expect(dto.failureSummary).toMatchObject({
      category: 'evidence_pack_failed',
      failedPhase: 'evidence-pack',
      executionMode: 'research-memo',
      sanitizedError: 'Provider failed at [redacted-url] token=[REDACTED]',
      lastEventBeforeFailure: {
        eventType: 'praxis.context_resolved',
        phase: 'context_resolved',
      },
      failingToolCall: {
        toolId: 'capsule-evidence-pack',
        status: 'failed',
        error: 'Provider failed at [redacted-url] token=[REDACTED]',
      },
    });
    expect(JSON.stringify(dto)).not.toContain('internal.example');
    expect(JSON.stringify(dto)).not.toContain('token=secret');
    expect(AgentRunOutputSchema.safeParse(dto).success).toBe(true);
  });

  it('includes compact UI-safe proof metadata for Boardroom artifacts', () => {
    const dto = toAgentRunOutput({
      id: 'run-boardroom-1',
      status: 'succeeded',
      capsuleId: 'cap-1',
      createdAt: '2026-05-25T12:00:00.000Z',
      updatedAt: '2026-05-25T12:05:00.000Z',
      objective: 'Run a boardroom discussion.',
      metadata: {
        policyAgentId: 'boardroom-discussion',
        outputDestination: 'library',
        memoId: 'memo-boardroom-1',
        outputCapsuleId: 'output-boardroom-1',
        outputHref: '/app/boardroom?runId=run-boardroom-1&memoId=memo-boardroom-1&outputCapsuleId=output-boardroom-1',
        modelPolicy: 'praxis_frontier_deep_model_policy',
        boardroomOutput: {
          evidenceStats: {
            sourceCount: 2,
            documentCount: 1,
            sourcedParagraphCount: 4,
            unsupportedClaimCount: 1,
          },
          confidenceDistribution: { high: 1, medium: 2, low: 1 },
          openQuestions: ['Which source should be added?'],
        },
        sourceabilityLedgerSummary: {
          totalClaims: 4,
          supportedClaims: 1,
          weakClaims: 1,
          unsupportedClaims: 1,
          contradictedClaims: 0,
          modelPriorClaims: 1,
          assumptionClaims: 0,
        },
      },
    } as never);

    expect(dto).toMatchObject({
      memoId: 'memo-boardroom-1',
      outputCapsuleId: 'output-boardroom-1',
      proofSummary: {
        sourceCount: 2,
        documentCount: 1,
        unsupportedClaimCount: 1,
        memoId: 'memo-boardroom-1',
        outputCapsuleId: 'output-boardroom-1',
        outputHref: '/app/boardroom?runId=run-boardroom-1&memoId=memo-boardroom-1&outputCapsuleId=output-boardroom-1',
        modelPolicyLabel: 'deep policy reasoning',
        confidenceDistribution: { high: 1, medium: 2, low: 1 },
        exportBlocked: true,
      },
    });
    expect(JSON.stringify(dto.proofSummary)).not.toMatch(/gemini|vertex|google|gpt|claude/i);
  });

  it.each(['checked', 'disabled'] as const)('round-trips generated-body review and input ledger scope through the actual API serializer: %s', async (verifierStatus) => {
    const body = 'The budget doubled to 50 million.';
    const outputReview = await buildMemoOutputReview({ body, verifierStatus, report: verifierStatus === 'checked' ? {
      groundedClaims: [], ungroundedSpans: [{ text: body, start: 0, end: body.length, reason: 'no_packet_binding',
        claimCardIds: [], sourceReceiptIds: [], graphPathIds: [] }], contradictedSpans: [], coverageScore: 0, notes: [],
    } : null });
    const dto = toAgentRunOutput({ id: 'run-review', status: 'succeeded', capsuleId: 'cap-1',
      createdAt: '2026-09-29T12:00:00.000Z', updatedAt: '2026-09-29T12:05:00.000Z', objective: 'Draft a memo.',
      metadata: { policyAgentId: 'research-memo', memoId: 'memo-1', outputReview,
        sourceabilityLedgerSummary: { totalClaims: 3, supportedClaims: 3, unsupportedClaims: 0 } },
    } as never);
    const parsed = AgentRunOutputSchema.parse(JSON.parse(JSON.stringify(dto)));
    expect(parsed.proofSummary).toMatchObject({ outputReview, sourceabilityScope: 'input_evidence',
      unsupportedClaimCount: 0, exportBlocked: true });
    expect(parsed.proofSummary?.degradedStates).toContain('generated memo review required');
  });

  it('exposes legacy generated memo review as unknown without silently approving it', () => {
    const dto = toAgentRunOutput({ id: 'run-legacy', status: 'succeeded', capsuleId: 'cap-1',
      createdAt: '2026-09-29T12:00:00.000Z', updatedAt: '2026-09-29T12:05:00.000Z', objective: 'Draft a memo.',
      metadata: { policyAgentId: 'research-memo', memoId: 'memo-old' },
    } as never);
    expect(AgentRunOutputSchema.parse(JSON.parse(JSON.stringify(dto))).proofSummary)
      .toMatchObject({ outputReview: null, sourceabilityScope: 'input_evidence', exportBlocked: true });
  });

  it('exposes grounding verifier proof metadata from run metadata', () => {
    const dto = toAgentRunOutput({
      id: 'run-grounding-1',
      status: 'succeeded',
      capsuleId: 'cap-1',
      createdAt: '2026-06-24T12:00:00.000Z',
      updatedAt: '2026-06-24T12:05:00.000Z',
      objective: 'Draft grounded output.',
      metadata: {
        groundingVerification: {
          groundedClaims: [{
            text: 'Supported claim.',
            start: 0,
            end: 16,
            claimCardIds: ['CL-1'],
            sourceReceiptIds: ['SR-1'],
            graphPathIds: [],
            matchReasons: ['claim_text_overlap'],
          }],
          ungroundedSpans: [{
            text: 'Unsupported claim.',
            start: 17,
            end: 35,
            reason: 'no_packet_binding',
            claimCardIds: [],
            sourceReceiptIds: [],
            graphPathIds: [],
          }],
          contradictedSpans: [],
          coverageScore: 0.5,
          notes: ['1 of 2 decision-relevant claim spans grounded.'],
        },
      },
    } as never);

    expect(dto.proofSummary?.groundingVerification).toMatchObject({
      coverageScore: 0.5,
      groundedClaimCount: 1,
      totalClaimCount: 2,
      flaggedSpans: [{ text: 'Unsupported claim.', reason: 'no_packet_binding' }],
    });
    expect(AgentRunOutputSchema.safeParse(dto).success).toBe(true);
  });
});
