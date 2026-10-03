import { describe, expect, it, vi } from 'vitest';
import { memoOutputBodyHash, normalizeMemoOutputReview, type MemoOutputReviewReceipt } from '@/lib/memo/output-review';
import { recordMemoContextSnapshot } from '@/lib/memo/context-snapshot';
import { AgentExecutionLeaseError } from '@/lib/agent-runtime/execution-lease';
import type { SaveMemoDraftInput } from '@/lib/firebase/memo-service';
import type { PraxisCapsule } from '@/lib/context/capsule-service';
import type { Firestore } from 'firebase-admin/firestore';
import { savedConversationTurnsToMessages } from '@/components/praxis/tasklet-workbench-conversation';
import {
  AgentWorkerError,
  executeAgentRun,
  executeNoopAgentRun,
  postAgentRunThreadReturn,
  persistAgentRunConversationReturn,
  type ExecuteAgentRunPayload,
} from '@/lib/agent-runtime/worker';
import type { AgentApproval, AgentRun, AgentRunEvent, AgentToolCall } from '@/lib/agent-runtime/types';

// Mode tests inject persistence; execution ownership is exercised separately.
vi.mock('@/lib/agent-runtime/owner-state', () => ({ assertAgentOwnerWritable: async () => undefined }));
vi.mock('@/lib/context/capsule-version-resolution', () => ({
  getCapsuleAtVersion: async (ownerUid: string, capsuleId: string, version: number | null) => (
    makeSavedCapsule({ ownerUid, capsuleId, version: version ?? 1 })
  ),
}));
vi.mock('@/lib/agent-runtime/execution-lease', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/agent-runtime/execution-lease')>();
  return { ...actual, withAgentRunExecutionLease: async (_input: unknown, work: (assertOwned: () => Promise<void>, token: string) => Promise<unknown>) => work(async () => undefined, 'test-lease') };
});

const payload: ExecuteAgentRunPayload = {
  runId: 'run-1',
  ownerUid: 'user-1',
  capsuleId: 'cap-1',
  traceId: 'trace-1',
  dispatchId: 'dispatch-1',
  attempt: 1,
  requestedAt: '2026-05-15T12:00:00.000Z',
};

function makeSavedCapsule(overrides: Partial<PraxisCapsule> = {}): PraxisCapsule {
  return {
    capsuleId: payload.capsuleId,
    ownerUid: payload.ownerUid,
    scope: 'situation',
    parentCapsuleId: null,
    forkedFromVersion: null,
    associatedCapsuleIds: [],
    coreRefs: {
      userCoreId: null, teamCoreId: null, situationCoreId: 'sit-1',
      sourceCoreIds: [], documentCoreIds: [], graphCoreId: null, outputCoreIds: [],
    },
    retrievalPolicy: { layers: [], limit: 10, checkFreshness: true },
    health: { score: 0, signals: [], missingCores: [], warnings: [] },
    activeForSituationIds: ['sit-1'],
    lockedCoreKinds: [],
    provenance: { source: 'created', createdBy: payload.ownerUid, parentCapsuleId: null, forkedFromVersion: null },
    access: {
      visibility: 'private', sharedWithUserIds: [], sharedWithOrgIds: [],
      allowClone: false, allowDownload: false, allowCommunityRating: false,
    },
    community: {
      favorite: false, userRating: null, averageRating: null, ratingCount: 0, tags: [],
      listedInMarketplace: false, publishedAt: null, cloneCount: 0, downloadCount: 0,
    },
    trust: {
      level: 'grey', score: 0, label: 'Awaiting review', summary: 'Test capsule requires review.',
      blockers: [], recommendations: [], checkedAt: '2026-05-15T12:00:00.000Z',
    },
    createdAt: '2026-05-15T12:00:00.000Z',
    updatedAt: '2026-05-15T12:00:00.000Z',
    schemaVersion: 2,
    version: 1,
    label: 'Saved test capsule',
    ...overrides,
  };
}

function makeRun(status: AgentRun['status'], metadata: Record<string, unknown> = {}): AgentRun {
  const contract = typeof metadata.agentOperatingContract === 'object' && metadata.agentOperatingContract !== null && !Array.isArray(metadata.agentOperatingContract)
    ? metadata.agentOperatingContract as Record<string, unknown>
    : {};
  return {
    id: payload.runId,
    agentSpecId: null,
    ownerUid: payload.ownerUid,
    capsuleId: payload.capsuleId,
    contextStackId: 'default',
    contextPackageId: null,
    selectedCoreIds: {
      userCoreId: null,
      teamCoreId: null,
      situationCoreId: 'sit-1',
      pathCoreId: null,
      sourceCoreIds: [],
      documentCoreIds: [],
      graphCoreId: null,
      timeCoreId: null,
      outputCoreIds: [],
      toolCoreIds: [],
      objectiveCoreIds: [],
      productCoreIds: [],
      memoryCoreId: null,
    },
    status,
    triggerType: 'manual',
    objective: 'No-op run',
    traceId: payload.traceId,
    parentRunId: null,
    idempotencyKey: 'idem-1',
    maxStep: 20,
    maxSessionMinutes: 30,
    internalEstimatedCostCents: null,
    internalSpendCents: 0,
    metadata: {
      capsuleAgentExecutionContext: { version: 1, capsuleId: payload.capsuleId, capsuleVersion: 1 },
      ...metadata,
      agentOperatingContract: {
        approvalThreshold: 'high',
        ...contract,
      },
    },
    createdAt: '2026-05-15T12:00:00.000Z',
    updatedAt: '2026-05-15T12:00:00.000Z',
    queuedAt: '2026-05-15T12:00:00.000Z',
    startedAt: null,
    completedAt: null,
    expiresAt: null,
  };
}

function makeEvidencePack(overrides: Record<string, unknown> = {}) {
  return {
    packId: 'evidence-1',
    ownerUid: 'user-1',
    capsuleId: 'cap-1',
    objective: 'No-op run',
    builtAt: '2026-05-15T12:00:00.000Z',
    activeCapsule: { capsuleId: 'cap-1', version: 1 } as never,
    knowledgeDocuments: [{ documentId: 'doc-1', title: 'Doc' } as never],
    sourceReceiptIds: ['src-1'],
    sourcedParagraphs: [{
      id: 'para-1',
      documentId: 'doc-1',
      chunkId: 'chunk-1',
      sourceReceiptId: 'src-1',
      pageRef: 'p.1',
      paragraphRef: 'para-1',
      charStart: 0,
      charEnd: 20,
      excerpt: 'Evidence paragraph.',
      score: 0.8,
      confidence: 0.8,
      citationLabel: '[D1:p.1]',
    }],
    documentDigests: [],
    outputHistory: [],
    memories: [],
    openGaps: [],
    receipts: {
      sourcesUsed: 1,
      paragraphsUsed: 1,
      unsupportedGaps: [],
      outputHistoryCount: 0,
      memoryCount: 0,
    },
    ...overrides,
  };
}

function makeQualityCapsule(overrides: Record<string, unknown> = {}) {
  return {
    capsuleId: payload.capsuleId,
    ownerUid: payload.ownerUid,
    schemaVersion: 2,
    version: 3,
    label: 'Quality review capsule',
    summary: 'A capsule for quality review tests.',
    purpose: 'Assess access constraints.',
    audience: ['Policy team'],
    sourcePosture: {
      posture: 'needs_sources',
      requiredSourceTypes: ['official'],
      freshnessWindowDays: 30,
    },
    decisionHorizon: 'Next 30 days',
    sourceRefs: [{
      sourceId: 'src-stale',
      label: 'Old source',
      date: '2025-01-01',
      stale: true,
    }],
    claimLedger: [{
      claimId: 'claim-1',
      text: 'Access restrictions remain unresolved.',
      support: 'needs_source',
      sourceRefIds: [],
    }],
    humanGate: {
      required: true,
      gateStatus: 'needs_review',
    },
    outputContracts: [],
    agentPermissions: {
      canSuggest: true,
      canSource: true,
      canFork: false,
      canDraft: true,
      canPublish: false,
    },
    bestNextAction: '',
    ...overrides,
  };
}

describe('agent runtime no-op worker', () => {
  it('keeps manual capsule research local despite selected search tool cores and a persisted search plan', async () => {
    const metadata = {
      policyAgentId: 'research-memo',
      selectedToolIds: ['grounded-search', 'policy-memo'],
      askExecutionPreference: { allowExternalSources: false },
      searchPlan: { queries: ['must not execute'], sourceClasses: ['public_web'], freshnessNeed: 'current' },
    };
    function localRun(status: AgentRun['status']) {
      const run = makeRun(status, metadata);
      return { ...run, objective: 'Research the attached capsule. Do not browse.', selectedCoreIds: { ...run.selectedCoreIds, toolCoreIds: ['grounded-search', 'deep-search-agent'] } };
    }
    const search = vi.fn(async () => ({ query: 'must not execute', sourceReceipts: [], degradedReason: null }));
    const events: AgentRunEvent[] = [];
    const result = await executeAgentRun(payload, {
      getRun: async () => localRun('queued'),
      updateStatus: async (input) => localRun(input.toStatus),
      appendToolCall: async (call) => call,
      appendApproval: async (approval) => approval,
      appendEvent: async (event) => { events.push(event); return event; },
      runGroundedSearch: search,
      buildEvidencePack: async () => makeEvidencePack(),
      generateText: async () => ({ text: 'Evidence paragraph [D1:p.1].' }),
      saveMemoDraft: async () => ({ memo: { id: 'local-research-memo' } } as never),
      saveOutputCapsule: async () => ({ id: 'local-output-capsule' }),
    });
    expect(result.status).toBe('succeeded');
    expect(search).not.toHaveBeenCalled();
    expect(events.some((event) => event.data.phase === 'grounding.live_retrieval_started')).toBe(false);
  });

  it('posts a succeeded run result to the originating Ask thread with a deterministic turn id', async () => {
    const turns = new Map<string, { prompt: string; output: string; runtime?: Record<string, unknown> }>();
    const events: AgentRunEvent[] = [];
    const run = makeRun('succeeded', {
      policyAgentId: 'research-memo',
      askThreadRef: { threadId: 'ask-thread-1', capsuleId: 'cap-1', originTurnId: 'turn-origin-1' },
    });

    const deps = {
      persistAskConversationReturn: async () => undefined,
      persistAskThreadTurn: async (input: { turnId?: string | null; prompt: string; output: string; runtime?: Record<string, unknown> }) => {
        turns.set(String(input.turnId), input);
        return null;
      },
      persistAskThreadTurnSql: async (input: { turnId?: string | null; prompt: string; output: string; runtime?: Record<string, unknown> }) => {
        turns.set(String(input.turnId), input);
        return null;
      },
      isAskThreadSqlConfigured: () => true,
      appendEvent: async (event: AgentRunEvent) => {
        events.push(event);
        return event;
      },
    };

    await postAgentRunThreadReturn({
      run,
      payload,
      status: 'succeeded',
      outputHref: '/app?panel=memo&memoId=memo-1',
      deps,
    });
    await postAgentRunThreadReturn({
      run,
      payload,
      status: 'succeeded',
      outputHref: '/app?panel=memo&memoId=memo-1',
      deps,
    });

    expect([...turns.keys()]).toEqual(['agent-result-run-1']);
    expect(turns.get('agent-result-run-1')).toMatchObject({
      prompt: '[agent-run-result]',
      runtime: {
        source: 'agent_run',
        runId: 'run-1',
        policyAgentId: 'research-memo',
        outputHref: '/app?panel=memo&memoId=memo-1',
      },
    });
    expect(turns.get('agent-result-run-1')?.output).toContain('No-op run');
    expect(turns.get('agent-result-run-1')?.output).toContain('/app?panel=memo&memoId=memo-1');
    expect(events.map((event) => event.eventType)).toContain('thread_return_posted');
  });

  it('posts a failed run result without stack traces', async () => {
    const turns = new Map<string, { output: string; runtime?: Record<string, unknown> }>();
    const events: AgentRunEvent[] = [];
    const run = makeRun('failed', {
      policyAgentId: 'research-memo',
      askThreadRef: { threadId: 'ask-thread-1', capsuleId: 'cap-1' },
    });

    await postAgentRunThreadReturn({
      run,
      payload,
      status: 'failed',
      failureMessage: 'Error: detailed stack\n    at secret frame',
      deps: {
        persistAskConversationReturn: async () => undefined,
        persistAskThreadTurn: async (input: { turnId?: string | null; output: string; runtime?: Record<string, unknown> }) => {
          turns.set(String(input.turnId), input);
          return null;
        },
        isAskThreadSqlConfigured: () => false,
        appendEvent: async (event: AgentRunEvent) => {
          events.push(event);
          return event;
        },
      },
    });

    expect(turns.get('agent-result-run-1')?.output).toContain('Agent run failed');
    expect(turns.get('agent-result-run-1')?.output).not.toContain('secret frame');
    expect(turns.get('agent-result-run-1')?.runtime).toMatchObject({
      source: 'agent_run',
      runId: 'run-1',
      policyAgentId: 'research-memo',
      outputHref: null,
    });
    expect(events.map((event) => event.eventType)).toContain('thread_return_posted');
  });

  it('skips cancelled runs and runs without Ask thread refs', async () => {
    const persistAskThreadTurn = async () => {
      throw new Error('should not persist');
    };

    await expect(postAgentRunThreadReturn({
      run: makeRun('cancelled', {
        askThreadRef: { threadId: 'ask-thread-1', capsuleId: 'cap-1' },
      }),
      payload,
      status: 'cancelled',
      deps: { persistAskThreadTurn },
    })).resolves.toBeUndefined();

    await expect(postAgentRunThreadReturn({
      run: makeRun('succeeded'),
      payload,
      status: 'succeeded',
      outputHref: '/app?panel=memo',
      deps: { persistAskThreadTurn },
    })).resolves.toBeUndefined();
  });

  it('keeps the terminal run result unchanged when thread return persistence fails', async () => {
    const events: AgentRunEvent[] = [];
    const run = makeRun('succeeded', {
      policyAgentId: 'research-memo',
      askThreadRef: { threadId: 'deleted-thread', capsuleId: 'cap-1' },
    });

    await expect(postAgentRunThreadReturn({
      run,
      payload,
      status: 'succeeded',
      outputHref: '/app?panel=memo',
      deps: {
        persistAskConversationReturn: async () => undefined,
        persistAskThreadTurn: async () => {
          throw new Error('thread deleted');
        },
        appendEvent: async (event: AgentRunEvent) => {
          events.push(event);
          return event;
        },
      },
    })).resolves.toBeUndefined();

    expect(run.status).toBe('succeeded');
    expect(events.map((event) => event.eventType)).toContain('thread_return_failed');
  });

  it('runs queued dispatch through running and succeeded', async () => {
    const transitions: AgentRun['status'][] = [];
    const result = await executeNoopAgentRun(payload, {
      getRun: async () => makeRun('queued'),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus);
      },
      appendEvent: async (event) => event,
    });

    expect(transitions).toEqual(['running', 'succeeded']);
    expect(result).toMatchObject({ runId: 'run-1', status: 'succeeded', executionMode: 'noop' });
  });

  it('treats repeated terminal execution as idempotent', async () => {
    const transitions: AgentRun['status'][] = [];
    const result = await executeNoopAgentRun(payload, {
      getRun: async () => makeRun('succeeded'),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus);
      },
      appendEvent: async (event) => event,
    });

    expect(transitions).toEqual([]);
    expect(result).toMatchObject({ status: 'succeeded', idempotent: true });
  });

  it('marks a running worker failure as failed', async () => {
    const transitions: AgentRun['status'][] = [];

    await expect(executeNoopAgentRun(payload, {
      getRun: async () => makeRun('queued'),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus);
      },
      appendEvent: async (event) => event,
      runNoopStep: async () => {
        throw new Error('synthetic worker failure');
      },
    })).rejects.toThrow('Agent run execution failed');

    expect(transitions).toEqual(['running', 'failed']);
  });

  it('preserves structured diagnostics on internal worker failures', async () => {
    const statusEvents: Array<{ status: AgentRun['status']; data: Record<string, unknown> | undefined }> = [];

    try {
      await executeAgentRun(payload, {
        getRun: async () => makeRun('queued', { policyAgentId: 'research-memo' }),
        updateStatus: async (input) => {
          statusEvents.push({ status: input.toStatus, data: input.data });
          return makeRun(input.toStatus, { policyAgentId: 'research-memo' });
        },
        appendEvent: async (event) => event,
        appendToolCall: async (toolCall) => toolCall,
        appendApproval: async (approval) => approval,
        buildEvidencePack: async () => {
          throw new Error('synthetic evidence pack failure with token=secret');
        },
      });
      throw new Error('expected executeAgentRun to fail');
    } catch (err) {
      expect(err).toBeInstanceOf(AgentWorkerError);
      expect((err as AgentWorkerError).diagnostic).toMatchObject({
        category: 'evidence_pack_failed',
        runId: 'run-1',
        policyAgentId: 'research-memo',
        executionMode: 'research-memo',
        failedPhase: 'evidence-pack',
        dispatchId: 'dispatch-1',
        attempt: 1,
        traceId: 'trace-1',
      });
    }

    const failed = statusEvents.find((event) => event.status === 'failed');
    expect(failed?.data?.failure).toMatchObject({
      category: 'evidence_pack_failed',
      runId: 'run-1',
      policyAgentId: 'research-memo',
      executionMode: 'research-memo',
      failedPhase: 'evidence-pack',
    });
    expect(failed?.data?.failureSummary).toMatchObject({
      category: 'evidence_pack_failed',
      policyAgentId: 'research-memo',
      executionMode: 'research-memo',
      failedPhase: 'evidence-pack',
      sanitizedError: 'synthetic evidence pack failure with token=[REDACTED]',
      lastEventBeforeFailure: expect.objectContaining({
        eventType: expect.any(String),
        phase: expect.any(String),
      }),
      failingToolCall: expect.objectContaining({
        toolId: 'capsule-evidence-pack',
        status: 'failed',
        error: 'synthetic evidence pack failure with token=[REDACTED]',
      }),
    });
    expect(failed?.data?.metadata).toBeUndefined();
    expect(JSON.stringify(failed?.data)).not.toContain('token=secret');
  });

  it('pauses medium-risk tool work until a persisted approval is approved, then resumes', async () => {
    const approvals: AgentApproval[] = [];
    const toolCalls: AgentToolCall[] = [];
    const events: AgentRunEvent[] = [];
    const metadata = {
      policyAgentId: 'research-memo',
      selectedToolIds: ['policy-memo'],
      agentOperatingContract: { approvalThreshold: 'medium' },
    };
    let run = makeRun('queued', metadata);
    let memoSaved = 0;

    const deps = {
      getRun: async () => run,
      updateStatus: async (input: { toStatus: AgentRun['status'] }) => {
        run = makeRun(input.toStatus, metadata);
        return run;
      },
      appendEvent: async (event: AgentRunEvent) => {
        events.push(event);
        return event;
      },
      appendToolCall: async (toolCall: AgentToolCall) => {
        toolCalls.push(toolCall);
        return toolCall;
      },
      appendApproval: async (approval: AgentApproval) => {
        approvals.push(approval);
        return approval;
      },
      listApprovals: async () => approvals,
      buildEvidencePack: async () => makeEvidencePack(),
      saveMemoDraft: async () => {
        memoSaved += 1;
        return { memo: { id: 'memo-approved-1' } };
      },
      saveOutputCapsule: async () => ({ id: 'output-approved-1' }),
    };

    const paused = await executeAgentRun(payload, deps);

    expect(paused).toMatchObject({ status: 'waiting_approval', executionMode: 'research-memo' });
    expect(approvals).toHaveLength(1);
    expect(approvals[0]).toMatchObject({ status: 'pending', risk: 'medium' });
    expect(toolCalls.some((call) => call.status === 'waiting_approval' && call.toolId === 'policy-memo')).toBe(true);
    expect(events.map((event) => event.eventType)).toContain('praxis.approval.required');
    expect(memoSaved).toBe(0);

    approvals[0] = {
      ...approvals[0],
      status: 'approved',
      decidedAt: '2026-05-15T12:01:00.000Z',
      decidedByUid: 'user-1',
    };
    run = makeRun('running', metadata);

    const resumed = await executeAgentRun(payload, deps);

    expect(resumed).toMatchObject({
      status: 'succeeded',
      executionMode: 'research-memo',
      memoId: 'memo-approved-1',
    });
    expect(memoSaved).toBe(1);
    expect(events.map((event) => event.eventType)).toContain('praxis.approval.granted');
  });

  it('runs multi-agent review as research to draft to red-team to revise with consumed outputs', async () => {
    const mirrored: Array<{ phase: string; data: Record<string, unknown> }> = [];
    const savedBlocks: string[] = [];

    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', {
        policyAgentId: 'red-team-analyst',
        workflowPlan: { workflowKind: 'multi_agent_review' },
        selectedToolIds: ['grounded-search', 'sourceability-reviewer', 'policy-memo', 'red-team-review'],
        searchPlan: { queries: ['current treaty evidence'], sourceClasses: ['public_web'], freshnessNeed: 'current' },
        agentOperatingContract: { approvalThreshold: 'high' },
      }),
      updateStatus: async (input) => makeRun(input.toStatus, {
        policyAgentId: 'red-team-analyst',
        workflowPlan: { workflowKind: 'multi_agent_review' },
        selectedToolIds: ['grounded-search', 'sourceability-reviewer', 'policy-memo', 'red-team-review'],
        agentOperatingContract: { approvalThreshold: 'high' },
      }),
      appendToolCall: async (toolCall) => toolCall,
      appendApproval: async (approval) => approval,
      appendEvent: async (event) => {
        mirrored.push({ phase: String(event.data.phase ?? event.eventType), data: event.data });
        return event;
      },
      runGroundedSearch: async ({ query }) => ({
        query,
        sourceReceipts: [{
          sourceReceiptId: 'web-supervisor-1',
          title: 'Supervisor source',
          url: 'https://example.test/supervisor',
          snippet: 'Current treaty evidence supports the draft.',
          provider: 'unit-search',
          confidence: 0.82,
        }],
        degradedReason: null,
      }),
      generateText: async ({ generationPhase }) => {
        if (generationPhase === 'memo-red-team') return { text: '- Clarify unsupported implementation dependency.\n- Preserve source caveat in the recommendation.' };
        if (generationPhase === 'memo-revision') return { text: 'Revised memo with source caveat and explicit implementation dependency.' };
        if (generationPhase === 'memo-self-critique') return { text: 'Self-critique: caveat retained.' };
        return { text: 'Draft memo with inline receipt [web-supervisor-1].' };
      },
      buildEvidencePack: async () => makeEvidencePack({ sourceReceiptIds: ['source-receipt-1'],
        activeCapsule: { ownerUid: payload.ownerUid, capsuleId: payload.capsuleId, version: 1 } as never }),
      saveMemoDraft: async (_uid, input) => {
        savedBlocks.push(...input.blocks.map((block) => `${block.id}:${block.content ?? ''}`));
        expect(input.blocks.find((block) => block.id === 'multi-agent-final')).toMatchObject({
          content: 'Revised memo with source caveat and explicit implementation dependency.',
          metadata: { revisionOutcome: { execution: 'generated', generationReceipt: { execution: 'injected-unverified' }, degradedReason: null } },
        });
        expect(input.blocks.find((block) => block.id === 'red-team-findings')).toMatchObject({
          title: 'Red-team findings for review',
          items: ['Clarify unsupported implementation dependency.', 'Preserve source caveat in the recommendation.'],
        });
        return { memo: { id: 'memo-supervisor-1' } };
      },
      saveOutputCapsule: async () => ({ id: 'output-supervisor-1' }),
    });

    expect(result).toMatchObject({
      status: 'succeeded',
      executionMode: 'multi-agent-supervisor',
      memoId: 'memo-supervisor-1',
    });
    expect(mirrored.map((event) => event.phase)).toEqual(expect.arrayContaining([
      'supervisor.graph.created',
      'supervisor.agent.research.succeeded',
      'supervisor.agent.drafting.succeeded',
      'supervisor.agent.red_team.succeeded',
      'supervisor.agent.revise.succeeded',
      'supervisor.graph.updated',
    ]));
    expect(mirrored.find((event) => event.phase === 'supervisor.agent.red_team.succeeded')?.data).toMatchObject({
      consumes: ['draftMemo', 'claimLedger'],
      produces: ['redTeamFindings'],
    });
    expect(savedBlocks.join('\n')).not.toContain('Addressed:');
    expect(mirrored.find((event) => event.phase === 'supervisor.agent.revise.succeeded')?.data).toMatchObject({
      revisionOutcome: { execution: 'generated' },
      reviewFindings: ['Clarify unsupported implementation dependency.', 'Preserve source caveat in the recommendation.'],
    });
  });

  it.each(['enabled', 'disabled'] as const)('persists one exact-body review receipt before all research-memo artifacts with verifier %s', async (verifier) => {
    vi.stubEnv('PRAXIS_GROUNDING_VERIFIER', verifier === 'enabled' ? 'true' : 'false');
    const body = 'The budget doubled to 50 million in 2028.';
    const critique = 'No export blockers remain.';
    let generated = 0;
    let savedReview: MemoOutputReviewReceipt | null = null;
    let completion: Record<string, unknown> | undefined;
    try {
      const result = await executeAgentRun(payload, {
        getRun: async () => makeRun('queued', { policyAgentId: 'research-memo' }),
        updateStatus: async (input) => {
          if (input.toStatus === 'succeeded') completion = input.metadata;
          return makeRun(input.toStatus, { policyAgentId: 'research-memo', ...input.metadata });
        },
        appendToolCall: async (call) => call,
        appendApproval: async (approval) => approval,
        appendEvent: async (event) => event,
        buildEvidencePack: async () => makeEvidencePack(),
        generateText: async () => ({ text: ++generated === 1 ? body : critique }),
        saveMemoDraft: async (_uid, input) => {
          savedReview = normalizeMemoOutputReview(input.outputReview);
          expect(savedReview).toMatchObject({ bodyHash: await memoOutputBodyHash(body), exportReady: false,
            reviewRequired: true, critiqueApplied: false, verifierStatus: verifier === 'enabled' ? 'checked' : 'disabled' });
          expect(input.status).toBe('review');
          expect(input.blocks.find((block) => block.id === 'live-memo-draft')).toMatchObject({
            content: body, metadata: { outputReview: savedReview, sourceabilityScope: 'input_evidence' },
          });
          expect(input.blocks.find((block) => block.id === 'live-memo-critique')).toMatchObject({
            content: critique, metadata: { critiqueApplied: false },
          });
          expect(input.blocks.find((block) => block.id === 'claim-ledger-summary')?.items?.[0]).toContain('input evidence');
          return { memo: { id: 'memo-review-1' } };
        },
        saveOutputCapsule: async (_uid, input) => {
          expect(savedReview).not.toBeNull();
          expect(input.payload).toMatchObject({ outputReview: savedReview, sourceabilityScope: 'input_evidence' });
          expect(input.gaps?.some((gap) => gap.id === 'generated-memo-review')).toBe(true);
          expect(JSON.stringify(input.payload)).not.toContain('No blocking gaps detected.');
          return { id: 'output-review-1' };
        },
      });
      expect(result.status).toBe('succeeded');
      expect(completion).toMatchObject({ outputReview: savedReview, sourceabilityScope: 'input_evidence' });
      if (verifier === 'enabled') {
        expect(normalizeMemoOutputReview(completion?.outputReview)?.findingCount).toBeGreaterThan(0);
        expect(completion?.groundingVerification).toMatchObject({ ungroundedSpans: expect.arrayContaining([
          expect.objectContaining({ text: body }),
        ]) });
      } else {
        expect(completion?.groundingVerification).toBeNull();
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('routes research-memo runs into memo and output capsule receipts', async () => {
    const transitions: AgentRun['status'][] = [];
    const mirrored: AgentRunEvent[] = [];
    const toolCalls: string[] = [];
    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', { policyAgentId: 'research-memo' }),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus, { policyAgentId: 'research-memo', capsuleVersion: 99,
          capsuleAgentExecutionContext: { version: 1, capsuleId: payload.capsuleId, capsuleVersion: 99 } });
      },
      appendToolCall: async (toolCall) => {
        toolCalls.push(`${toolCall.toolId}:${toolCall.status}`);
        return toolCall;
      },
      appendApproval: async (approval) => approval,
      buildEvidencePack: async (input) => ({
        packId: 'evidence-1',
        ownerUid: 'user-1',
        capsuleId: 'cap-1',
        objective: 'No-op run',
        builtAt: '2026-05-15T12:00:00.000Z',
        activeCapsule: { ownerUid: 'user-1', capsuleId: 'cap-1', version: input.capsuleVersion ?? 2 } as never,
        knowledgeDocuments: [{ documentId: 'doc-1', title: 'Doc' } as never],
        sourceReceiptIds: ['src-1'],
        sourcedParagraphs: [{
          id: 'para-1',
          documentId: 'doc-1',
          chunkId: 'chunk-1',
          sourceReceiptId: 'src-1',
          pageRef: 'p.1',
          paragraphRef: 'para-1',
          charStart: 0,
          charEnd: 20,
          excerpt: 'Evidence paragraph.',
          score: 0.8,
          confidence: 0.8,
          citationLabel: '[D1:p.1]',
        }],
        documentDigests: [],
        outputHistory: [],
        memories: [],
        openGaps: ['Time Core is unset; freshness assumptions need review.'],
        receipts: {
          sourcesUsed: 1,
          paragraphsUsed: 1,
          unsupportedGaps: ['Time Core is unset; freshness assumptions need review.'],
          outputHistoryCount: 0,
          memoryCount: 0,
        },
      }),
      appendEvent: async (event) => {
        if (event.data.phase === 'capsule.read_receipt_created') expect(event.data.capsuleReadReceipt).toMatchObject({ capsuleVersion: 1 });
        mirrored.push(event);
        return event;
      },
      generateText: async () => {
        throw new Error('live model disabled for ADK dry-run test');
      },
      saveMemoDraft: async (_uid, input) => {
        expect(input.capsuleVersion).toBe(1);
        expect(input.templateId).toBe('policy-memo');
        expect(input.blocks.some((block) => block.id === 'source-receipt')).toBe(true);
        expect(input.blocks.some((block) => block.id === 'sourced-paragraphs')).toBe(true);
        expect(input.blocks.some((block) => block.id === 'gap-receipt')).toBe(true);
        expect(input.blocks.find((block) => block.id === 'live-memo-draft')).toMatchObject({
          metadata: {
            modelPosture: 'fallback',
            degradedReason: 'live model disabled for ADK dry-run test',
          },
          content: expect.stringContaining('Task: No-op run'),
        });
        return { memo: { id: 'memo-1' } };
      },
      saveOutputCapsule: async (_uid, input) => {
        expect(input.templateId).toBe('options-memo');
        expect(input.citations).toHaveLength(1);
        expect(input.gaps).toHaveLength(2);
        expect(input.gaps?.[1]?.id).toBe('generated-memo-review');
        return { id: 'output-1' };
      },
    });

    expect(transitions).toEqual(['running', 'succeeded']);
    expect(result).toMatchObject({
      status: 'succeeded',
      executionMode: 'research-memo',
      memoId: 'memo-1',
      outputCapsuleId: 'output-1',
      outputHref: '/app?panel=memo&memoId=memo-1&outputCapsuleId=output-1',
    });
    expect(toolCalls).toContain('capsule-evidence-pack:succeeded');
    expect(toolCalls).toContain('policy-memo:succeeded');
    expect(toolCalls).toContain('output-capsule-save:succeeded');
    expect(toolCalls).toContain('sourceability-reviewer:succeeded');
    const mirroredPhases = mirrored.map((event) => String(event.data.phase ?? event.eventType));
    expect(mirroredPhases).toContain('context_resolved');
    expect(mirroredPhases).toContain('capsule.read_receipt_created');
    expect(mirroredPhases).toContain('workflow.plan_created');
    expect(mirroredPhases).toContain('sourceability.ledger_created');
    expect(mirroredPhases).toContain('reasoning.plan');
    expect(mirroredPhases).toContain('reasoning.act');
    expect(mirroredPhases).toContain('reasoning.reflect');
    expect(mirroredPhases).toContain('reasoning.complete');
    expect(mirroredPhases).toContain('memo_output_created');
    expect(mirrored.map((event) => event.eventType)).toEqual(expect.arrayContaining([
      'adk.research_memo.status',
      'adk.research_memo.tool_call',
      'adk.research_memo.text',
      'adk.research_memo.done',
    ]));
    expect(mirrored.find((event) => event.eventType === 'adk.research_memo.status')?.data).toMatchObject({
      substrate: 'adk',
      agentKind: 'research_memo',
      phase: 'bridge_dry_run_started',
      raw: expect.objectContaining({
        dryRun: true,
        bridge: 'praxis-adk-bridge',
        liveExecution: 'disabled',
      }),
    });
  });

  it('runs research memo as live plan, retrieval, source-check, draft, critique, and finalize phases', async () => {
    const mirrored: Array<{ phase: string; data: Record<string, unknown> }> = [];
    const toolCalls: Array<{ toolId: string; status: string; output: Record<string, unknown> | null }> = [];
    const generatedPrompts: string[] = [];
    let completionMetadata: Record<string, unknown> | undefined;
    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', {
        policyAgentId: 'research-memo',
        selectedToolIds: ['context-resolve', 'grounded-search', 'sourceability-reviewer', 'policy-memo'],
        searchPlan: {
          queries: ['treaty analysis memo current sources'],
          sourceClasses: ['public_web'],
          freshnessNeed: 'current',
        },
        sourceReceiptIds: [],
        agentOperatingContract: {
          allowedActions: ['search_grounded', 'draft_policy_memo', 'check_sourceability'],
          forbiddenActions: ['export_unsupported_policy_memo'],
          stopConditions: ['Stop before external export.'],
        },
      }),
      updateStatus: async (input) => {
        if (input.toStatus === 'succeeded') completionMetadata = input.metadata;
        return makeRun(input.toStatus, {
          policyAgentId: 'research-memo',
          selectedToolIds: ['context-resolve', 'grounded-search', 'sourceability-reviewer', 'policy-memo'],
          ...input.metadata,
        });
      },
      appendToolCall: async (toolCall) => {
        toolCalls.push({ toolId: toolCall.toolId, status: toolCall.status, output: toolCall.output });
        return toolCall;
      },
      appendApproval: async (approval) => approval,
      appendEvent: async (event) => {
        mirrored.push({ phase: String(event.data.phase ?? event.eventType), data: event.data });
        return event;
      },
      runGroundedSearch: async ({ query }) => ({
        query,
        sourceReceipts: [
          {
            sourceReceiptId: 'web-live-1',
            title: 'Treaty source',
            url: 'https://example.test/treaty',
            snippet: 'Treaty analysis memo current sources confirm the access clause.',
            provider: 'unit-search',
            confidence: 0.82,
          },
        ],
        degradedReason: null,
      }),
      generateText: async (input) => {
        generatedPrompts.push(input.prompt);
        return generatedPrompts.length === 1
          ? { text: 'Draft memo paragraph [web-live-1]. The access clause is supported by current sources.' }
          : { text: 'Self-critique: citation coverage is acceptable; keep export blocked if unsupported claims remain.' };
      },
      buildEvidencePack: async () => ({
        packId: 'evidence-live-1',
        ownerUid: 'user-1',
        capsuleId: 'cap-1',
        objective: 'No-op run',
        builtAt: '2026-05-15T12:00:00.000Z',
        activeCapsule: { ownerUid: 'user-1', capsuleId: 'cap-1', version: 1 } as never,
        knowledgeDocuments: [],
        sourceReceiptIds: [],
        sourcedParagraphs: [{
          id: 'para-1',
          documentId: 'doc-1',
          chunkId: 'chunk-1',
          sourceReceiptId: 'doc-src-1',
          pageRef: 'p.1',
          paragraphRef: 'para-1',
          charStart: 0,
          charEnd: 20,
          excerpt: 'The access clause is supported by current sources.',
          score: 0.8,
          confidence: 0.8,
          citationLabel: '[D1:p.1]',
        }],
        documentDigests: [],
        outputHistory: [],
        memories: [],
        openGaps: ['A disputed implementation detail still needs field confirmation.'],
        receipts: {
          sourcesUsed: 0,
          paragraphsUsed: 1,
          unsupportedGaps: ['A disputed implementation detail still needs field confirmation.'],
          outputHistoryCount: 0,
          memoryCount: 0,
        },
      }),
      saveMemoDraft: async (_uid, input) => {
        expect(input.runId).toBe('run-1');
        expect(input.capsuleId).toBe('cap-1');
        expect(input.outputTarget).toBe('policy-memo');
        expect(input.sourceReceiptIds).toEqual(expect.arrayContaining(['doc-src-1', 'web-live-1']));
        expect(input.unsupportedClaims).not.toContain('A disputed implementation detail still needs field confirmation.');
        expect(JSON.stringify(input.blocks)).toContain('A disputed implementation detail still needs field confirmation.');
        expect(input.claimChecks).toEqual(expect.arrayContaining([
          expect.objectContaining({
            status: 'supported',
            sourceReceiptIds: expect.arrayContaining(['doc-src-1', 'web-live-1']),
          }),
        ]));
        expect(input.blocks.some((block) => block.id === 'live-memo-draft')).toBe(true);
        expect(input.blocks.find((block) => block.id === 'live-memo-draft')?.metadata).toMatchObject({
          weakSourceHighlight: false,
        });
        return { memo: { id: 'memo-live-1' } };
      },
      saveOutputCapsule: async () => ({ id: 'output-live-1' }),
    });

    expect(result).toMatchObject({
      status: 'succeeded',
      executionMode: 'research-memo',
      memoId: 'memo-live-1',
    });
    expect(generatedPrompts.join('\n')).toContain('Capsule Evidence Pack');
    expect(generatedPrompts[0]).toContain('Current date (UTC):');
    expect(generatedPrompts[1]).toContain('Treaty analysis memo current sources confirm the access clause.');
    expect(completionMetadata).toMatchObject({
      sourceCount: 2,
      sourceReceiptIds: expect.arrayContaining(['doc-src-1', 'web-live-1']),
      memoId: 'memo-live-1',
      capsuleReadReceipt: expect.objectContaining({ sourceCount: 2 }),
      agentContextPacket: expect.objectContaining({ selected: expect.objectContaining({
        sources: expect.arrayContaining([expect.objectContaining({ id: 'web-live-1' }), expect.objectContaining({ id: 'doc-src-1' })]),
      }) }),
    });
    expect(toolCalls).toEqual(expect.arrayContaining([
      expect.objectContaining({ toolId: 'grounded-search', status: 'succeeded' }),
      expect.objectContaining({ toolId: 'sourceability-reviewer', status: 'succeeded' }),
      expect.objectContaining({ toolId: 'policy-memo', status: 'succeeded' }),
    ]));
    expect(toolCalls.find((call) => call.toolId === 'sourceability-reviewer' && call.output)?.output).toMatchObject({
      unsupportedClaimCount: 0,
      checkedClaimCount: 1,
      liveSourceReceiptCount: 1,
    });
    expect(mirrored.map((event) => event.phase)).toEqual(expect.arrayContaining([
      'research.plan_created',
      'grounding.live_retrieval_started',
      'grounding.live_retrieval_succeeded',
      'sourceability.source_checker.started',
      'sourceability.source_checker.completed',
      'sourceability.claims_verified',
      'memo.draft_created',
      'memo.self_critique_completed',
      'artifact.finalized',
    ]));
    const phases = mirrored.map((event) => event.phase);
    expect(phases.indexOf('sourceability.source_checker.completed')).toBeGreaterThan(-1);
    expect(phases.indexOf('sourceability.source_checker.completed')).toBeLessThan(phases.indexOf('memo.draft_created'));
    expect(mirrored.find((event) => event.phase === 'sourceability.source_checker.completed')?.data).toMatchObject({
      agentId: 'source-checker',
      lane: 'sourceability',
      toolId: 'sourceability-reviewer',
      checkedClaimCount: 1,
      unsupportedClaimCount: 0,
      sourceabilityVerdicts: expect.arrayContaining([
        expect.objectContaining({
          verdict: 'supported',
          sourceIds: expect.arrayContaining(['doc-src-1', 'web-live-1']),
        }),
      ]),
    });
    expect(mirrored.find((event) => event.phase === 'sourceability.claims_verified')?.data).toMatchObject({
      unsupportedClaimCount: 0,
      liveSourceReceiptCount: 1,
    });
  });

  it('blocks deep research synthesis with no live evidence even when context gaps are not claims', async () => {
    const approvals: AgentApproval[] = [];
    const mirrored: string[] = [];
    let memoSaved = 0;

    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', {
        policyAgentId: 'research-memo',
        selectedToolIds: ['context-resolve', 'grounded-search', 'deep-search-agent', 'sourceability-reviewer', 'policy-memo'],
        minSourcesPerClaim: 2,
        synthesisGate: 'block_on_unsupported_claims',
      }),
      updateStatus: async (input) => makeRun(input.toStatus, {
        policyAgentId: 'research-memo',
        selectedToolIds: ['context-resolve', 'grounded-search', 'deep-search-agent', 'sourceability-reviewer', 'policy-memo'],
        minSourcesPerClaim: 2,
        synthesisGate: 'block_on_unsupported_claims',
      }),
      appendEvent: async (event) => {
        mirrored.push(String(event.data.phase ?? event.eventType));
        return event;
      },
      appendToolCall: async (toolCall) => toolCall,
      appendApproval: async (approval) => {
        approvals.push(approval);
        return approval;
      },
      listApprovals: async () => approvals,
      buildEvidencePack: async () => makeEvidencePack({
        sourceReceiptIds: [],
        sourcedParagraphs: [],
        openGaps: ['Official implementation source is missing.'],
        receipts: {
          sourcesUsed: 0,
          paragraphsUsed: 0,
          unsupportedGaps: ['Official implementation source is missing.'],
          outputHistoryCount: 0,
          memoryCount: 0,
        },
      }),
      runGroundedSearch: async ({ query }) => ({
        query,
        sourceReceipts: [],
        degradedReason: 'No current receipts returned.',
      }),
      saveMemoDraft: async () => {
        memoSaved += 1;
        return { memo: { id: 'memo-should-not-save' } };
      },
      saveOutputCapsule: async () => ({ id: 'output-should-not-save' }),
    });

    expect(result).toMatchObject({ status: 'waiting_approval', executionMode: 'research-memo' });
    expect(memoSaved).toBe(0);
    expect(approvals).toHaveLength(1);
    expect(approvals[0]).toMatchObject({ status: 'pending', risk: 'medium' });
    expect(mirrored).toContain('research.synthesis_blocked');
    expect(mirrored).not.toContain('memo.draft_created');
  });

  it.each([
    { label: 'empty retrieval with old attached receipts', live: false, unsupported: false, emptySnippet: false, expected: 'waiting_approval' },
    { label: 'real sources with context gaps only', live: true, unsupported: false, emptySnippet: false, expected: 'succeeded' },
    { label: 'real sources with an unsupported factual paragraph', live: true, unsupported: true, emptySnippet: false, expected: 'waiting_approval' },
    { label: 'citation title without supported source text', live: true, unsupported: false, emptySnippet: true, expected: 'waiting_approval' },
  ])('reports honest evidence and preserves the gate: $label', async ({ live, unsupported, emptySnippet, expected }) => {
    const approvals: AgentApproval[] = [];
    const calls: AgentToolCall[] = [];
    const metadata = {
      policyAgentId: 'research-memo',
      selectedToolIds: ['grounded-search', 'sourceability-reviewer', 'policy-memo'],
      sourceReceiptIds: ['source-core:old-upload'],
      groundingPlan: { modes: ['google_search'] },
      minSourcesPerClaim: 2,
      synthesisGate: 'block_on_unsupported_claims',
    };
    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', metadata),
      updateStatus: async (input) => makeRun(input.toStatus, metadata),
      appendEvent: async (event) => event,
      appendToolCall: async (call) => { calls.push(call); return call; },
      appendApproval: async (approval) => { approvals.push(approval); return approval; },
      listApprovals: async () => approvals,
      buildEvidencePack: async () => makeEvidencePack({
        sourceReceiptIds: [],
        sourcedParagraphs: emptySnippet ? [{ ...makeEvidencePack().sourcedParagraphs[0], confidence: 0.5 }] : unsupported ? [{
          ...makeEvidencePack().sourcedParagraphs[0],
          sourceReceiptId: null,
          excerpt: 'Implementation is complete across all jurisdictions.',
        }] : [],
        openGaps: ['Time Core is unset.'],
      }),
      runGroundedSearch: async ({ query }) => ({
        query,
        sourceReceipts: live ? [1, 2].map((index) => ({
          sourceReceiptId: `web:new-${index}`, title: emptySnippet ? 'Evidence paragraph.' : `Public institutional source ${index}`,
          url: `https://institution${index}.example.org/methods`, snippet: emptySnippet ? '' : 'Methods for evaluating policy commitments.',
          confidence: 0.8, provider: 'test-provider',
        })) : [],
        degradedReason: null,
      }),
      generateText: async () => ({ text: 'Methods brief with uncertainty [web:new-1] [web:new-2].' }),
      saveMemoDraft: async (_uid, input) => {
        expect(input.sourceReceiptIds).toContain('source-core:old-upload');
        expect(JSON.stringify(input.blocks)).toContain('Time Core is unset.');
        return { memo: { id: 'memo-proof' } };
      },
      saveOutputCapsule: async () => ({ id: 'output-proof' }),
    });
    expect(result.status).toBe(expected);
    const search = calls.find((call) => call.toolId === 'grounded-search');
    expect(search?.status).toBe(live ? 'succeeded' : 'failed');
    expect(search?.output?.sourceReceiptCount).toBe(live ? 2 : 0);
    expect(search?.output?.sourceReceiptIds).not.toContain('source-core:old-upload');
    if (!live) {
      expect(search?.output?.groundingPosture).toBe('Grounding unavailable');
      expect(search?.output?.degradedReason).toContain('no live source receipts');
      expect(calls.find((call) => call.status === 'waiting_approval')?.input.proposedAction).toMatchObject({ missingEvidence: true, unsupportedClaimCount: 0 });
    }
    if (emptySnippet) {
      expect(calls.find((call) => call.status === 'waiting_approval')?.input.proposedAction).toMatchObject({ missingEvidence: true });
      expect(calls.find((call) => call.toolId === 'sourceability-reviewer' && call.output?.summary)?.output?.summary).toMatchObject({ supportedClaims: 0, weakClaims: 1 });
    }
    if (unsupported) {
      expect(calls.find((call) => call.status === 'waiting_approval')?.input.proposedAction).toMatchObject({ missingEvidence: false, unsupportedClaimCount: 1 });
    }
    if (expected === 'succeeded') expect(approvals).toHaveLength(0);
  });

  it('routes source-gap scout runs into review-gated source-pack cards', async () => {
    const reviewCards: Array<{ title: string; target: string; sourceType: string; evidence: unknown[]; patch: Record<string, unknown> | undefined }> = [];
    const toolCalls: Array<{ toolId: string; status: string; output: Record<string, unknown> | null }> = [];
    const mirrored: string[] = [];

    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', {
        policyAgentId: 'source-gap-scout',
        selectedToolIds: ['context-resolve', 'grounded-search'],
        unsupportedClaims: ['The access clause is current but lacks an official receipt.'],
        searchPlan: {
          queries: ['official access clause current receipt'],
          sourceClasses: ['public_web'],
          freshnessNeed: 'current',
        },
      }),
      updateStatus: async (input) => makeRun(input.toStatus, {
        policyAgentId: 'source-gap-scout',
        selectedToolIds: ['context-resolve', 'grounded-search'],
      }),
      appendToolCall: async (toolCall) => {
        toolCalls.push({ toolId: toolCall.toolId, status: toolCall.status, output: toolCall.output });
        return toolCall;
      },
      appendEvent: async (event) => {
        mirrored.push(String(event.data.phase ?? event.eventType));
        return event;
      },
      buildEvidencePack: async () => makeEvidencePack({
        sourceReceiptIds: [],
        sourcedParagraphs: [],
        openGaps: ['Access clause needs an official current source.'],
        receipts: {
          sourcesUsed: 0,
          paragraphsUsed: 0,
          unsupportedGaps: ['Access clause needs an official current source.'],
          outputHistoryCount: 0,
          memoryCount: 0,
        },
      }),
      runGroundedSearch: async ({ query }) => ({
        query,
        sourceReceipts: [{
          sourceReceiptId: 'web-gap-1',
          title: 'Official access clause notice',
          url: 'https://example.test/access-clause',
          snippet: 'Official access clause current receipt with implementation date.',
          provider: 'unit-search',
          publishedDate: '2026-06-01',
          confidence: 0.84,
        }],
        degradedReason: null,
      }),
      createReviewCard: async (_uid, _capsuleId, input) => {
        reviewCards.push({
          title: input.title,
          target: input.target,
          sourceType: input.sourceType,
          evidence: input.evidence ?? [],
          patch: input.proposedEnvelopePatch,
        });
        return { reviewCardId: `source-gap-card-${reviewCards.length}` } as never;
      },
    });

    expect(result).toMatchObject({
      status: 'succeeded',
      executionMode: 'source-gap-scout',
      outputHref: '/app/capsules?capsuleId=cap-1&review=source-gaps',
    });
    expect(reviewCards).toHaveLength(2);
    expect(reviewCards.every((card) => card.target === 'sourceGap' && card.sourceType === 'agent')).toBe(true);
    expect(reviewCards[0]?.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'web-gap-1',
        url: 'https://example.test/access-clause',
      }),
    ]));
    expect(reviewCards[0]?.patch).toMatchObject({
      sourceRefs: expect.arrayContaining([
        expect.objectContaining({
          sourceId: 'web-gap-1',
          url: 'https://example.test/access-clause',
          snippet: 'Official access clause current receipt with implementation date.',
          date: '2026-06-01',
          reviewState: 'proposed',
        }),
      ]),
      claimLedger: expect.arrayContaining([
        expect.objectContaining({
          support: 'needs_source',
          receipts: expect.arrayContaining([
            expect.objectContaining({
              sourceId: 'web-gap-1',
              snippet: 'Official access clause current receipt with implementation date.',
              date: '2026-06-01',
            }),
          ]),
        }),
      ]),
    });
    expect(toolCalls).toEqual(expect.arrayContaining([
      expect.objectContaining({ toolId: 'grounded-search', status: 'succeeded' }),
      expect.objectContaining({
        toolId: 'source-gap-scout',
        status: 'succeeded',
        output: expect.objectContaining({
          reviewCardCount: 2,
          candidateReceiptCount: 1,
        }),
      }),
    ]));
    expect(mirrored).toEqual(expect.arrayContaining([
      'source_gap_scout.plan_created',
      'grounding.live_retrieval_started',
      'source_gap_scout.review_cards_created',
    ]));
  });

  it('routes capsule quality review runs into review-gated improvement cards and returns to the Ask thread', async () => {
    const reviewCards: Array<{ title: string; target: string; sourceType: string; evidence: unknown[]; patch: Record<string, unknown> | undefined }> = [];
    const toolCalls: Array<{ toolId: string; status: string; output: Record<string, unknown> | null }> = [];
    const mirrored: string[] = [];
    const transitions: Array<{ toStatus: AgentRun['status']; data?: Record<string, unknown>; metadata?: Record<string, unknown> }> = [];
    const turns = new Map<string, { runtime?: Record<string, unknown>; output: string }>();
    let generateCalls = 0;

    const llmProposal = (index: number) => ({
      kind: ['sourcing', 'temporal', 'causal', 'ontology', 'guardrail', 'output', 'sourcing', 'temporal'][index % 8],
      title: `Review improvement ${index + 1}`,
      rationale: 'The capsule has a quality deficit that should remain review-gated.',
      suggestedChange: `Create review-only improvement ${index + 1}.`,
      confidence: index % 2 === 0 ? 'high' : 'medium',
    });

    const result = await executeAgentRun({
      ...payload,
      askThreadRef: { threadId: 'ask-thread-1', capsuleId: 'cap-1', originTurnId: 'turn-1' },
    }, {
      getRun: async () => makeRun('queued', {
        policyAgentId: 'capsule-quality-review',
        outputDestination: 'library',
        selectedToolIds: ['context-resolve', 'capsule-quality-review'],
      }),
      updateStatus: async (input) => {
        transitions.push({
          toStatus: input.toStatus,
          data: input.data,
          metadata: input.metadata,
        });
        return makeRun(input.toStatus, {
          policyAgentId: 'capsule-quality-review',
          outputDestination: 'library',
          ...(input.metadata ?? {}),
        });
      },
      getCapsule: async () => makeQualityCapsule() as never,
      generateText: async () => {
        generateCalls += 1;
        return {
          text: JSON.stringify(Array.from({ length: generateCalls === 1 ? 9 : 8 }, (_, index) => llmProposal(index))),
        };
      },
      appendToolCall: async (toolCall) => {
        toolCalls.push({ toolId: toolCall.toolId, status: toolCall.status, output: toolCall.output });
        return toolCall;
      },
      appendEvent: async (event) => {
        mirrored.push(String(event.data.phase ?? event.eventType));
        return event;
      },
      createReviewCard: async (_uid, _capsuleId, input) => {
        reviewCards.push({
          title: input.title,
          target: input.target,
          sourceType: input.sourceType,
          evidence: input.evidence ?? [],
          patch: input.proposedEnvelopePatch,
        });
        return { reviewCardId: input.reviewCardId ?? `quality-card-${reviewCards.length}` } as never;
      },
      persistAskConversationReturn: async () => undefined,
      persistAskThreadTurn: async (input: { turnId?: string | null; runtime?: Record<string, unknown>; output: string }) => {
        turns.set(String(input.turnId), input);
        return null;
      },
      isAskThreadSqlConfigured: () => false,
    });

    expect(generateCalls).toBe(2);
    expect(result).toMatchObject({
      status: 'succeeded',
      executionMode: 'capsule-quality-review',
      outputHref: '/app/capsules?capsuleId=cap-1#capsule-review-queue',
    });
    expect(reviewCards).toHaveLength(8);
    expect(reviewCards.every((card) => card.sourceType === 'quality-audit')).toBe(true);
    expect(reviewCards.every((card) => card.patch?.latestGateState === 'proposed')).toBe(true);
    expect(reviewCards[0]?.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sourceType: 'capsule-quality-review-agent',
        advisory: true,
      }),
    ]));
    expect(toolCalls).toEqual(expect.arrayContaining([
      expect.objectContaining({
        toolId: 'capsule-quality-review',
        status: 'succeeded',
        output: expect.objectContaining({
          proposalsCreated: 8,
          llmUsed: true,
        }),
      }),
    ]));
    expect(transitions.at(-1)).toMatchObject({
      toStatus: 'succeeded',
      data: expect.objectContaining({
        summary: expect.stringContaining('Readiness before'),
        proposalsCreated: 8,
      }),
      metadata: expect.objectContaining({
        proposalsCreated: 8,
      }),
    });
    expect(turns.get('agent-result-run-1')?.runtime).toMatchObject({
      source: 'agent_run',
      runId: 'run-1',
      policyAgentId: 'capsule-quality-review',
      outputHref: '/app/capsules?capsuleId=cap-1#capsule-review-queue',
    });
    expect(mirrored).toEqual(expect.arrayContaining([
      'capsule_quality_review.deficits_created',
      'capsule_quality_review.review_cards_created',
    ]));
  });

  it('falls back to deterministic capsule quality proposals when the model output is invalid', async () => {
    const reviewCards: Array<{ title: string; target: string; sourceType: string; patch: Record<string, unknown> | undefined }> = [];
    let generateCalls = 0;

    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', {
        policyAgentId: 'capsule-quality-review',
        outputDestination: 'library',
      }),
      updateStatus: async (input) => makeRun(input.toStatus, {
        policyAgentId: 'capsule-quality-review',
        outputDestination: 'library',
        ...(input.metadata ?? {}),
      }),
      getCapsule: async () => makeQualityCapsule({
        sourceRefs: [],
        claimLedger: [],
        sourcePosture: null,
        decisionHorizon: null,
        purpose: '',
        audience: [],
      }) as never,
      generateText: async () => {
        generateCalls += 1;
        return { text: '{"not":"an array"}' };
      },
      appendToolCall: async (toolCall) => toolCall,
      appendEvent: async (event) => event,
      createReviewCard: async (_uid, _capsuleId, input) => {
        reviewCards.push({
          title: input.title,
          target: input.target,
          sourceType: input.sourceType,
          patch: input.proposedEnvelopePatch,
        });
        return { reviewCardId: input.reviewCardId ?? `quality-card-${reviewCards.length}` } as never;
      },
    });

    expect(generateCalls).toBe(2);
    expect(result).toMatchObject({ status: 'succeeded', executionMode: 'capsule-quality-review' });
    expect(reviewCards.length).toBeGreaterThan(0);
    expect(reviewCards.length).toBeLessThanOrEqual(8);
    expect(reviewCards).toEqual(expect.arrayContaining([
      expect.objectContaining({
        sourceType: 'quality-audit',
        target: 'sourceGap',
        title: expect.stringMatching(/source/i),
      }),
    ]));
    expect(reviewCards.every((card) => card.patch?.latestGateState === 'proposed')).toBe(true);
  });

  it('routes scheduled daily brief runs into review-gated memo drafts and notifications', async () => {
    const transitions: AgentRun['status'][] = [];
    const toolCalls: Array<{ toolId: string; status: string; output: Record<string, unknown> | null }> = [];
    const mirrored: string[] = [];
    const notifications: Array<{ title: string; actionUrl?: string }> = [];

    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', {
        policyAgentId: 'daily-brief',
        outputDestination: 'memo_studio',
        selectedToolIds: ['context-resolve', 'grounded-search', 'daily-brief', 'policy-memo'],
        scheduledFor: '2026-06-11T09:00:00.000Z',
        searchPlan: {
          queries: ['capsule daily brief latest official update'],
          sourceClasses: ['official_sources'],
          freshnessNeed: 'latest',
        },
      }),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus, {
          policyAgentId: 'daily-brief',
          outputDestination: 'memo_studio',
          selectedToolIds: ['context-resolve', 'grounded-search', 'daily-brief', 'policy-memo'],
          scheduledFor: '2026-06-11T09:00:00.000Z',
        });
      },
      appendToolCall: async (toolCall) => {
        toolCalls.push({ toolId: toolCall.toolId, status: toolCall.status, output: toolCall.output });
        return toolCall;
      },
      appendEvent: async (event) => {
        mirrored.push(String(event.data.phase ?? event.eventType));
        return event;
      },
      buildEvidencePack: async () => makeEvidencePack({
        outputHistory: [{
          outputCapsuleId: 'output-prev-1',
          templateId: 'situation-brief',
          status: 'draft',
          qualityStatus: 'review',
          createdAt: '2026-06-11T08:00:00.000Z',
        }],
        openGaps: ['Need current official confirmation of the access window.'],
        receipts: {
          sourcesUsed: 1,
          paragraphsUsed: 1,
          unsupportedGaps: ['Need current official confirmation of the access window.'],
          outputHistoryCount: 1,
          memoryCount: 0,
        },
      }),
      runGroundedSearch: async ({ query }) => ({
        query,
        sourceReceipts: [{
          sourceReceiptId: 'web-brief-1',
          title: 'Official daily update',
          url: 'https://example.test/daily-update',
          snippet: 'Official update confirms the access window remains under review.',
          provider: 'unit-search',
          publishedDate: '2026-06-11',
          confidence: 0.86,
        }],
        degradedReason: null,
      }),
      saveMemoDraft: async (_uid, input) => {
        expect(input.templateId).toBe('policy-memo');
        expect(input.outputTarget).toBe('daily-brief');
        expect(input.status).toBe('draft');
        expect(input.sourceReceiptIds).toEqual(expect.arrayContaining(['src-1', 'web-brief-1']));
        expect(input.blocks.map((block) => block.id)).toEqual(expect.arrayContaining([
          'daily-brief-title',
          'daily-brief-fresh-sources',
          'daily-brief-capsule-deltas',
          'daily-brief-sourceability',
        ]));
        return { memo: { id: 'memo-daily-1' } };
      },
      saveOutputCapsule: async (_uid, input) => {
        expect(input.templateId).toBe('situation-brief');
        expect(input.payload).toMatchObject({ reviewOnly: true });
        return { id: 'output-daily-1' };
      },
      emitNotification: async (input) => {
        notifications.push({ title: input.title, actionUrl: input.actionUrl });
        return 'notification-daily-1';
      },
    });

    expect(transitions).toEqual(['running', 'succeeded']);
    expect(result).toMatchObject({
      status: 'succeeded',
      executionMode: 'daily-brief',
      memoId: 'memo-daily-1',
      outputCapsuleId: 'output-daily-1',
      outputHref: '/app?panel=memo&memoId=memo-daily-1&outputCapsuleId=output-daily-1',
    });
    expect(notifications).toEqual([expect.objectContaining({
      title: 'Daily Brief draft ready',
      actionUrl: '/app?panel=memo&memoId=memo-daily-1&outputCapsuleId=output-daily-1',
    })]);
    expect(toolCalls).toEqual(expect.arrayContaining([
      expect.objectContaining({ toolId: 'grounded-search', status: 'succeeded' }),
      expect.objectContaining({
        toolId: 'daily-brief',
        status: 'succeeded',
        output: expect.objectContaining({
          memoId: 'memo-daily-1',
          notificationId: 'notification-daily-1',
          reviewOnly: true,
        }),
      }),
    ]));
    expect(mirrored).toEqual(expect.arrayContaining([
      'context_resolved',
      'capsule.read_receipt_created',
      'workflow.plan_created',
      'sourceability.ledger_created',
      'daily_brief.draft_created',
    ]));
  });

  it('creates review cards instead of mutating the capsule when capsule factory proposes improvements', async () => {
    const reviewCards: Array<{ title: string; target: string; patch: Record<string, unknown> | undefined }> = [];

    await executeAgentRun(payload, {
      buildEvidencePack: async () => makeEvidencePack(),
      getRun: async () => makeRun('queued', { policyAgentId: 'capsule-factory' }),
      updateStatus: async (input) => makeRun(input.toStatus, { policyAgentId: 'capsule-factory' }),
      appendEvent: async (event) => event,
      runIntakeFlow: (async () => ({
        draftCores: [{ kind: 'source', label: 'Treaty source pack', summary: 'Attach treaty source pack.' }],
        sourceGaps: ['Need official treaty text.'],
        intakeQuestions: [],
        factoryTelemetry: { path: 'unit' },
      })) as never,
      runResearchPlanFlow: (async () => ({
        sourceGaps: ['Need official treaty text.'],
        readOnlyTools: [{ toolId: 'grounded-search', reason: 'Find official treaty text.' }],
        factoryTelemetry: { path: 'unit' },
      })) as never,
      runSynthesisFlow: (async () => ({
        contextCapsuleDraft: {
          label: 'Treaty analysis capsule',
          summary: 'Review-gated treaty analysis capsule.',
        },
        proposedCores: [{ kind: 'claim', label: 'Access clause', summary: 'Clause needs claim ledger entry.' }],
        openQuestions: ['Which official text is current?'],
        applyActions: ['Create source-gap review card'],
        factoryTelemetry: { path: 'unit' },
      })) as never,
      runWritingProfileFlow: (async () => ({
        defaultFormat: 'policy-memo',
        exportGates: ['sourceability'],
        factoryTelemetry: { path: 'unit' },
      })) as never,
      createReviewCard: async (_uid, _capsuleId, input) => {
        reviewCards.push({
          title: input.title,
          target: input.target,
          patch: input.proposedEnvelopePatch,
        });
        return { reviewCardId: `card-${reviewCards.length}` } as never;
      },
    });

    expect(reviewCards.length).toBeGreaterThanOrEqual(3);
    expect(reviewCards).toEqual(expect.arrayContaining([
      expect.objectContaining({ target: 'sourceGap' }),
      expect.objectContaining({ target: 'claimLedger' }),
      expect.objectContaining({ target: 'agentInstructions' }),
    ]));
    expect(reviewCards.map((card) => card.patch)).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceRefs: expect.any(Array) }),
      expect.objectContaining({ claimLedger: expect.any(Array) }),
      expect.objectContaining({ memoryPosture: expect.any(Object) }),
    ]));
  });

  it('persists degraded search evidence receipts before memo output when search tools are selected', async () => {
    const toolCalls: Array<{ toolId: string; output: Record<string, unknown> | null }> = [];
    const mirrored: string[] = [];

    await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', {
        policyAgentId: 'research-memo',
        selectedToolIds: ['context-resolve', 'grounded-search', 'deep-search-agent', 'policy-memo'],
        searchPlan: {
          queries: ['current border access restrictions'],
          sourceClasses: ['public_web'],
          freshnessNeed: 'current',
        },
        sourceReceiptIds: [],
        groundingPlan: {
          modes: ['internal_capsule_corpus'],
          deferredModes: ['google_search'],
          requiresSearchSuggestionsDisplay: false,
          receiptPosture: 'praxis_canonical',
        },
      }),
      updateStatus: async (input) => makeRun(input.toStatus, {
        policyAgentId: 'research-memo',
        selectedToolIds: ['context-resolve', 'grounded-search', 'deep-search-agent', 'policy-memo'],
      }),
      appendToolCall: async (toolCall) => {
        toolCalls.push({ toolId: toolCall.toolId, output: toolCall.output });
        return toolCall;
      },
      appendApproval: async (approval) => approval,
      appendEvent: async (event) => {
        mirrored.push(String(event.data.phase ?? event.eventType));
        return event;
      },
      buildEvidencePack: async () => ({
        packId: 'evidence-1',
        ownerUid: 'user-1',
        capsuleId: 'cap-1',
        objective: 'No-op run',
        builtAt: '2026-05-15T12:00:00.000Z',
        activeCapsule: { capsuleId: 'cap-1', version: 1 } as never,
        knowledgeDocuments: [],
        sourceReceiptIds: [],
        sourcedParagraphs: [],
        documentDigests: [],
        outputHistory: [],
        memories: [],
        openGaps: [],
        receipts: {
          sourcesUsed: 0,
          paragraphsUsed: 0,
          unsupportedGaps: [],
          outputHistoryCount: 0,
          memoryCount: 0,
        },
      }),
      saveMemoDraft: async () => ({ memo: { id: 'memo-1' } }),
      saveOutputCapsule: async () => ({ id: 'output-1' }),
    });

    const searchCall = toolCalls.find((call) => call.toolId === 'grounded-search');
    expect(searchCall?.output).toMatchObject({
      sourceReceiptCount: 0,
      querySet: ['current border access restrictions'],
      groundingPosture: 'Grounding unavailable',
      degradedReason: 'Google Search grounding is not configured.',
    });
    expect(toolCalls.find((call) => call.toolId === 'deep-search-agent')?.output).toMatchObject({
      sourceReceiptCount: 0,
      gaps: expect.arrayContaining(['No current-source receipts were collected for this run.']),
    });
    expect(mirrored).toEqual(expect.arrayContaining([
      'grounding.search_evidence_started',
      'tool.grounded-search.completed',
      'tool.deep-search-agent.completed',
      'search_evidence_degraded',
      'search_evidence_collected',
      'memo_output_created',
    ]));
    expect(mirrored.indexOf('search_evidence_collected')).toBeLessThan(mirrored.indexOf('memo_output_created'));
  });

  it('routes output-formatter runs into an export-ready memo draft', async () => {
    const transitions: AgentRun['status'][] = [];
    const mirrored: string[] = [];
    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', { policyAgentId: 'output-formatter' }),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus, { policyAgentId: 'output-formatter' });
      },
      appendEvent: async (event) => {
        mirrored.push(String(event.data.phase ?? event.eventType));
        return event;
      },
      appendToolCall: async (toolCall) => toolCall,
      appendApproval: async (approval) => approval,
      saveMemoDraft: async (_uid, input) => {
        expect(input.templateId).toBe('policy-memo');
        expect(input.blocks.some((block) => block.id === 'structure')).toBe(true);
        expect(input.blocks.some((block) => block.id === 'export-readiness')).toBe(true);
        return { memo: { id: 'memo-format-1' } };
      },
    });

    expect(transitions).toEqual(['running', 'succeeded']);
    expect(result).toMatchObject({ status: 'succeeded', executionMode: 'output-formatter', memoId: 'memo-format-1', outputHref: '/app?panel=memo&memoId=memo-format-1' });
    expect(mirrored).toContain('formatted_output_created');
  });

  it('routes sourceability, red-team, and handover agents into reviewable receipts', async () => {
    for (const policyAgentId of ['sourceability-reviewer', 'red-team-analyst', 'handover-builder'] as const) {
      const transitions: AgentRun['status'][] = [];
      const toolCalls: string[] = [];
      const mirrored: string[] = [];
      const result = await executeAgentRun(payload, {
        getRun: async () => makeRun('queued', { policyAgentId }),
        updateStatus: async (input) => {
          transitions.push(input.toStatus);
          return makeRun(input.toStatus, { policyAgentId });
        },
        appendToolCall: async (toolCall) => {
          toolCalls.push(`${toolCall.toolId}:${toolCall.status}`);
          return toolCall;
        },
        appendEvent: async (event) => {
          mirrored.push(String(event.data.phase ?? event.eventType));
          return event;
        },
        saveMemoDraft: async (_uid, input) => {
          expect(input.blocks.some((block) => block.id === 'receipt')).toBe(true);
          expect(input.blocks.some((block) => block.id === 'claim-ledger-summary')).toBe(true);
          return { memo: { id: `memo-${policyAgentId}` } };
        },
      });

      expect(transitions).toEqual(['running', 'succeeded']);
      expect(result.status).toBe('succeeded');
      expect(result.executionMode).toBe(policyAgentId);
      expect(toolCalls.length).toBe(1);
      expect(mirrored).toContain('capsule.read_receipt_created');
      expect(mirrored).toContain('workflow.plan_created');
      expect(mirrored).toContain('sourceability.ledger_created');
      expect(mirrored).toContain(`${policyAgentId}_receipt_created`);
    }
  });

  it('routes capsule-factory runs through Genkit flow events and draft output persistence', async () => {
    const transitions: AgentRun['status'][] = [];
    const mirrored: { eventType: string; data: Record<string, unknown> }[] = [];
    const result = await executeAgentRun(payload, {
      buildEvidencePack: async () => makeEvidencePack(),
      getRun: async () => makeRun('queued', { policyAgentId: 'capsule-factory' }),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus, { policyAgentId: 'capsule-factory' });
      },
      appendEvent: async (event) => {
        mirrored.push({ eventType: event.eventType, data: event.data });
        return event;
      },
      createReviewCard: async () => ({ reviewCardId: 'review-card-unit' } as never),
    });

    expect(transitions).toEqual(['running', 'succeeded']);
    expect(result).toMatchObject({
      status: 'succeeded',
      executionMode: 'capsule-factory',
      outputHref: '/app/capsules',
    });
    expect(mirrored.map((event) => event.eventType)).toEqual(expect.arrayContaining([
      'genkit.flow.started',
      'genkit.flow.tool_call',
      'genkit.flow.succeeded',
    ]));
    expect(mirrored.some((event) => event.data.flowName === 'capsuleSynthesisFlow')).toBe(true);
    expect(mirrored.some((event) => event.data.draftOutput)).toBe(true);
  });
});

describe('canonical conversation agent return persistence', () => {
  const conversationPath = 'users/user-1/conversations/ask-thread-1';
  const returnPath = `${conversationPath}/turns/agent-result-run-1`;

  function fixture(overrides: Array<[string, Record<string, unknown> | null]> = []) {
    const records = new Map<string, Record<string, unknown>>([
      ['users/user-1', { uid: 'user-1' }],
      [conversationPath, { ownerUid: 'user-1', capsuleId: 'cap-1', title: 'Original Ask', turnCount: 1,
        createdAt: '2026-05-15T12:00:00.000Z' }],
      [`${conversationPath}/turns/original-ask`, { ownerUid: 'user-1', prompt: 'Write a short memo.',
        output: 'Work is queued.', createdAt: '2026-05-15T12:00:01.000Z' }],
    ]);
    for (const [path, value] of overrides) {
      if (value === null) records.delete(path);
      else records.set(path, value);
    }
    type Ref = { path: string; collection: (name: string) => { doc: (id: string) => Ref } };
    const ref = (path: string): Ref => ({ path, collection: (name) => ({ doc: (id) => ref(`${path}/${name}/${id}`) }) });
    const db = {
      collection: (name: string) => ({ doc: (id: string) => ref(`${name}/${id}`) }),
      runTransaction: async (work: (tx: unknown) => Promise<void>) => {
        const writes: Array<{ path: string; data: Record<string, unknown> }> = [];
        await work({
          get: async (address: Ref) => ({ exists: records.has(address.path),
            data: () => records.has(address.path) ? structuredClone(records.get(address.path)) : undefined }),
          set: (address: Ref, data: Record<string, unknown>) => { writes.push({ path: address.path, data }); },
        });
        for (const write of writes) records.set(write.path, { ...records.get(write.path), ...structuredClone(write.data) });
      },
    } as unknown as Firestore;
    return { records, db };
  }

  it('reloads one durable assistant result beside an existing Ask turn, including after duplicate delivery', async () => {
    const { records, db } = fixture();
    const events: AgentRunEvent[] = [];
    const run = makeRun('succeeded', { policyAgentId: 'sourceability-reviewer',
      askThreadRef: { threadId: 'ask-thread-1', capsuleId: 'cap-1' } });
    const deps = {
      persistAskConversationReturn: async (input: Parameters<typeof persistAgentRunConversationReturn>[0]) => persistAgentRunConversationReturn(input, db),
      persistAskThreadTurn: async () => null,
      isAskThreadSqlConfigured: () => false,
      appendEvent: async (event: AgentRunEvent) => { events.push(event); return event; },
    };
    await postAgentRunThreadReturn({ run, payload, status: 'succeeded', outputHref: '/app?memoId=memo-1', deps });
    const firstCreatedAt = records.get(returnPath)?.createdAt;
    await postAgentRunThreadReturn({ run, payload, status: 'succeeded', outputHref: '/app?memoId=memo-1', deps });

    // These are the nonempty canonical turn records the conversation GET reloads.
    const turns = [...records.entries()].filter(([path]) => path.startsWith(`${conversationPath}/turns/`))
      .map(([, record]) => record);
    const messages = savedConversationTurnsToMessages(turns);
    expect(turns).toHaveLength(2);
    expect(messages).toHaveLength(3);
    expect(messages.filter((message) => message.role === 'user').map((message) => message.text)).toEqual(['Write a short memo.']);
    expect(messages.at(-1)).toMatchObject({ role: 'assistant', runtime: {
      source: 'agent_run', runId: 'run-1', policyAgentId: 'sourceability-reviewer', outputHref: '/app?memoId=memo-1',
    } });
    expect(records.get(conversationPath)).toMatchObject({ title: 'Original Ask', turnCount: 2 });
    expect(records.get(returnPath)?.createdAt).toBe(firstCreatedAt);
    expect(events.map((event) => event.eventType)).toEqual(['thread_return_posted', 'thread_return_posted']);
  });

  it.each([
    ['missing owner', 'users/user-1', null],
    ['deleting owner', 'users/user-1', { accountDeletionStatus: 'deleting' }],
    ['deleted owner', 'users/user-1', { accountDeletionStatus: 'deleted' }],
    ['foreign conversation', conversationPath, { ownerUid: 'foreign-owner' }],
    ['foreign result', returnPath, { ownerUid: 'foreign-owner' }],
  ] as const)('refuses canonical writes for %s', async (_name, path, value) => {
    const { records, db } = fixture([[path, value]]);
    const before = JSON.stringify([...records]);
    await expect(persistAgentRunConversationReturn({
      uid: 'user-1', capsuleId: 'cap-1', threadId: 'ask-thread-1', turnId: 'agent-result-run-1',
      prompt: '[agent-run-result]', output: 'Completed work.', runtime: { source: 'agent_run', runId: 'run-1' },
    }, db)).rejects.toBeInstanceOf(Error);
    expect(JSON.stringify([...records])).toBe(before);
  });

  it('saves an arriving result without reopening an archived conversation', async () => {
    const { records, db } = fixture();
    records.set(conversationPath, { ...records.get(conversationPath), status: 'archived' });
    await persistAgentRunConversationReturn({
      uid: 'user-1', capsuleId: 'cap-1', threadId: 'ask-thread-1', turnId: 'agent-result-run-1',
      prompt: '[agent-run-result]', output: 'Completed work.', runtime: { source: 'agent_run', runId: 'run-1' },
    }, db);
    expect(records.get(conversationPath)).toMatchObject({ status: 'archived', title: 'Original Ask', turnCount: 2 });
    expect(records.get(returnPath)).toMatchObject({ output: 'Completed work.' });
  });

  it('reports failed thread return and stops other store writes when the canonical owner gate rejects it', async () => {
    const { db } = fixture([['users/user-1', { accountDeletionStatus: 'deleting' }]]);
    const legacyWrite = vi.fn();
    const events: AgentRunEvent[] = [];
    await postAgentRunThreadReturn({
      run: makeRun('succeeded', { askThreadRef: { threadId: 'ask-thread-1', capsuleId: 'cap-1' } }),
      payload, status: 'succeeded',
      deps: {
        persistAskConversationReturn: async (input) => persistAgentRunConversationReturn(input, db),
        persistAskThreadTurn: legacyWrite,
        appendEvent: async (event) => { events.push(event); return event; },
      },
    });
    expect(legacyWrite).not.toHaveBeenCalled();
    expect(events.map((event) => event.eventType)).toEqual(['thread_return_failed']);
  });
});

describe('agent memo exact capsule association', () => {
  const modes = ['output-formatter', 'sourceability-reviewer', 'red-team-analyst',
    'difference-checker', 'media-summarizer', 'human-friction-analyst', 'handover-builder'] as const;

  it.each(modes)('preserves the original saved version for %s despite later metadata drift', async (policyAgentId) => {
    const original = { version: 1, capsuleId: payload.capsuleId, capsuleVersion: 2 };
    const receiptVersions: unknown[] = [];
    const getExactVersion = vi.fn(async (ownerUid: string, capsuleId: string, version: number | null) => (
      makeSavedCapsule({ ownerUid, capsuleId, version: version ?? 1 })
    ));
    const save = vi.fn(async (_uid: string, input: SaveMemoDraftInput) => {
      const snapshot = recordMemoContextSnapshot(input, undefined, false);
      expect(snapshot).toMatchObject({ binding: 'recorded', capsuleId: payload.capsuleId,
        capsuleVersion: 2, runId: payload.runId });
      return { memo: { id: 'memo-pinned' } };
    });
    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', { policyAgentId, capsuleAgentExecutionContext: original }),
      updateStatus: async (input) => makeRun(input.toStatus, { policyAgentId,
        capsuleAgentExecutionContext: { ...original, capsuleVersion: 99 }, capsuleVersion: 99 }),
      getCapsuleAtVersion: getExactVersion,
      appendEvent: async (event) => {
        if (event.data.phase === 'capsule.read_receipt_created') {
          receiptVersions.push((event.data.capsuleReadReceipt as { capsuleVersion: number }).capsuleVersion);
        }
        return event;
      },
      appendToolCall: async (call) => call,
      appendApproval: async (approval) => approval,
      saveMemoDraft: save,
    });
    expect(result).toMatchObject({ status: 'succeeded', executionMode: policyAgentId, memoId: 'memo-pinned' });
    expect(getExactVersion).toHaveBeenCalledWith(payload.ownerUid, payload.capsuleId, 2);
    expect(save).toHaveBeenCalledOnce();
    expect(receiptVersions).toEqual([2]);
  });

  it.each(modes)('saves explicit empty association for unsaved context in %s', async (policyAgentId) => {
    const getExactVersion = vi.fn();
    const receiptVersions: unknown[] = [];
    const save = vi.fn(async (_uid: string, input: SaveMemoDraftInput) => {
      expect(input).toMatchObject({ capsuleId: null, capsuleVersion: null, runId: payload.runId });
      expect(recordMemoContextSnapshot(input, undefined, false)).toMatchObject({
        binding: 'recorded', capsuleId: null, capsuleVersion: null, runId: payload.runId,
      });
      return { memo: { id: 'memo-unsaved-context' } };
    });
    await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', { policyAgentId,
        capsuleAgentExecutionContext: { version: 1, capsuleId: payload.capsuleId, capsuleVersion: 0 } }),
      updateStatus: async (input) => makeRun(input.toStatus, { policyAgentId }),
      getCapsuleAtVersion: getExactVersion,
      appendEvent: async (event) => {
        if (event.data.phase === 'capsule.read_receipt_created') {
          receiptVersions.push((event.data.capsuleReadReceipt as { capsuleVersion: number }).capsuleVersion);
        }
        return event;
      },
      appendToolCall: async (call) => call,
      appendApproval: async (approval) => approval,
      saveMemoDraft: save,
    });
    expect(getExactVersion).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledOnce();
    expect(receiptVersions).toEqual([0]);
  });

  it.each(modes)('fails visibly without original version provenance in %s', async (policyAgentId) => {
    const save = vi.fn();
    const transitions: AgentRun['status'][] = [];
    await expect(executeAgentRun(payload, {
      getRun: async () => makeRun('queued', { policyAgentId, capsuleAgentExecutionContext: undefined,
        capsuleVersion: 99, capsuleReadReceipt: { capsuleId: payload.capsuleId, capsuleVersion: 99 } }),
      updateStatus: async (input) => { transitions.push(input.toStatus); return makeRun(input.toStatus, { policyAgentId }); },
      appendEvent: async (event) => event,
      saveMemoDraft: save,
    })).rejects.toMatchObject({ diagnostic: { failedPhase: 'context-resolved' } });
    expect(transitions).toEqual(['running', 'failed']);
    expect(save).not.toHaveBeenCalled();
  });

  it.each([
    { version: 2, capsuleId: payload.capsuleId, capsuleVersion: 2 },
    { version: 1, capsuleId: 'foreign-capsule', capsuleVersion: 2 },
    { version: 1, capsuleId: payload.capsuleId, capsuleVersion: null },
    { version: 1, capsuleId: payload.capsuleId, capsuleVersion: -1 },
    { version: 1, capsuleId: payload.capsuleId, capsuleVersion: 1.5 },
    { version: 1, capsuleId: payload.capsuleId, capsuleVersion: Number.MAX_SAFE_INTEGER + 1 },
  ])('rejects malformed original snapshot %j before loading or saving', async (snapshot) => {
    const getExactVersion = vi.fn();
    const save = vi.fn();
    await expect(executeAgentRun(payload, {
      getRun: async () => makeRun('queued', { policyAgentId: 'sourceability-reviewer', capsuleAgentExecutionContext: snapshot }),
      updateStatus: async (input) => makeRun(input.toStatus),
      getCapsuleAtVersion: getExactVersion,
      appendEvent: async (event) => event,
      saveMemoDraft: save,
    })).rejects.toBeInstanceOf(AgentWorkerError);
    expect(getExactVersion).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it.each([
    null,
    { ownerUid: 'foreign-owner', capsuleId: payload.capsuleId, version: 2 },
    { ownerUid: payload.ownerUid, capsuleId: 'foreign-capsule', version: 2 },
    { ownerUid: payload.ownerUid, capsuleId: payload.capsuleId, version: 99 },
    { ownerUid: payload.ownerUid, capsuleId: payload.capsuleId, version: 2, archivedAt: '2026-09-30' },
  ])('rejects unavailable or mismatched exact owner-scoped capsule %j', async (capsule) => {
    const save = vi.fn();
    await expect(executeAgentRun(payload, {
      getRun: async () => makeRun('queued', { policyAgentId: 'output-formatter',
        capsuleAgentExecutionContext: { version: 1, capsuleId: payload.capsuleId, capsuleVersion: 2 } }),
      updateStatus: async (input) => makeRun(input.toStatus),
      getCapsuleAtVersion: async () => capsule === null ? null : makeSavedCapsule(capsule),
      appendEvent: async (event) => event,
      saveMemoDraft: save,
    })).rejects.toBeInstanceOf(AgentWorkerError);
    expect(save).not.toHaveBeenCalled();
  });
});

describe('supervisor exact execution context', () => {
  const original = { version: 1, capsuleId: payload.capsuleId, capsuleVersion: 2 };
  const metadata = {
    policyAgentId: 'red-team-analyst',
    workflowPlan: { workflowKind: 'multi_agent_review' },
    selectedToolIds: ['grounded-search', 'sourceability-reviewer', 'policy-memo', 'red-team-review'],
    searchPlan: { queries: ['current treaty evidence'], sourceClasses: ['public_web'], freshnessNeed: 'current' },
    capsuleAgentExecutionContext: original,
    capsuleVersion: 2,
  };
  const evidence = (capsuleVersion = 2) => makeEvidencePack({
    activeCapsule: { ownerUid: payload.ownerUid, capsuleId: payload.capsuleId, version: capsuleVersion } as never,
  });
  const search = () => vi.fn(async ({ query }: { query: string }) => ({ query, sourceReceipts: [], degradedReason: null }));
  const generation = () => vi.fn(async () => ({ text: 'Reviewed policy memo with explicit evidence limits.' }));
  const save = () => vi.fn(async (_uid: string, _input: SaveMemoDraftInput) => ({ memo: { id: 'memo-supervisor-pinned' } }));

  it.each([3, 99])('keeps original v2 through approval and resume when latest and transition metadata say v%s', async (latestVersion) => {
    const approvals: AgentApproval[] = [];
    const receiptVersions: number[] = [];
    let completion: Record<string, unknown> | undefined;
    let status: AgentRun['status'] = 'queued';
    const pinnedMetadata = { ...metadata, agentOperatingContract: { approvalThreshold: 'medium' } };
    const providerSearch = search();
    const providerGenerate = generation();
    const getExactVersion = vi.fn(async (ownerUid: string, capsuleId: string, capsuleVersion: number | null) => (
      makeSavedCapsule({ ownerUid, capsuleId, version: capsuleVersion ?? 1 })
    ));
    const buildEvidencePack = vi.fn(async (input: { capsuleVersion?: number | null }) => evidence(input.capsuleVersion ?? latestVersion));
    const persist = save();
    const deps = {
      getRun: async () => makeRun(status, pinnedMetadata),
      updateStatus: async (input: { toStatus: AgentRun['status']; data?: Record<string, unknown> }) => {
        status = input.toStatus;
        if (input.toStatus === 'succeeded') completion = input.data;
        return makeRun(input.toStatus, { ...pinnedMetadata, capsuleVersion: latestVersion,
          capsuleAgentExecutionContext: { ...original, capsuleVersion: latestVersion } });
      },
      getCapsuleAtVersion: getExactVersion,
      listApprovals: async () => approvals,
      appendApproval: async (approval: AgentApproval) => { approvals.push(approval); return approval; },
      appendToolCall: async (call: AgentToolCall) => call,
      appendEvent: async (event: AgentRunEvent) => {
        if (event.data.phase === 'capsule.read_receipt_created') {
          receiptVersions.push((event.data.capsuleReadReceipt as { capsuleVersion: number }).capsuleVersion);
        }
        return event;
      },
      buildEvidencePack,
      runGroundedSearch: providerSearch,
      generateText: providerGenerate,
      saveMemoDraft: persist,
      saveOutputCapsule: async () => null,
    };
    const paused = await executeAgentRun(payload, deps);
    expect(paused).toMatchObject({ status: 'waiting_approval', executionMode: 'multi-agent-supervisor' });
    expect(approvals).toHaveLength(1);
    expect(buildEvidencePack).not.toHaveBeenCalled();
    expect(providerSearch).not.toHaveBeenCalled();
    expect(providerGenerate).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
    approvals[0] = { ...approvals[0], status: 'approved', decidedAt: '2026-09-30T00:00:00Z', decidedByUid: payload.ownerUid };
    status = 'running';
    const resumed = await executeAgentRun(payload, deps);
    expect(resumed).toMatchObject({ status: 'succeeded', executionMode: 'multi-agent-supervisor', memoId: 'memo-supervisor-pinned' });
    expect(getExactVersion).toHaveBeenCalledWith(payload.ownerUid, payload.capsuleId, 2);
    expect(buildEvidencePack).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ ownerUid: payload.ownerUid, capsuleId: payload.capsuleId, capsuleVersion: 2 }));
    expect(providerSearch).toHaveBeenCalled();
    expect(providerGenerate).toHaveBeenCalled();
    expect(receiptVersions.length).toBeGreaterThan(0);
    expect(receiptVersions.every((version) => version === 2)).toBe(true);
    expect(completion?.capsuleReadReceipt).toMatchObject({ capsuleId: payload.capsuleId, capsuleVersion: 2 });
    expect(persist).toHaveBeenCalledExactlyOnceWith(payload.ownerUid, expect.objectContaining({ capsuleId: payload.capsuleId, capsuleVersion: 2, runId: payload.runId }));
    const persisted = persist.mock.calls[0][1];
    expect(recordMemoContextSnapshot(persisted, undefined, false)).toMatchObject({ binding: 'recorded', capsuleId: payload.capsuleId, capsuleVersion: 2, runId: payload.runId });
  });

  it.each([
    undefined,
    { ...original, version: 2 },
    { ...original, capsuleId: 'foreign-capsule' },
    { ...original, capsuleVersion: null },
    { ...original, capsuleVersion: -1 },
    { ...original, capsuleVersion: 1.5 },
    { ...original, capsuleVersion: Number.MAX_SAFE_INTEGER + 1 },
  ])('rejects missing or malformed original pin %j before evidence, approval or providers', async (snapshot) => {
    const buildEvidencePack = vi.fn(async () => evidence());
    const providerSearch = search();
    const providerGenerate = generation();
    const persist = save();
    const appendApproval = vi.fn(async (approval: AgentApproval) => approval);
    const getExactVersion = vi.fn();
    await expect(executeAgentRun(payload, {
      getRun: async () => makeRun('queued', { ...metadata, capsuleAgentExecutionContext: snapshot }),
      updateStatus: async (input) => makeRun(input.toStatus, metadata),
      getCapsuleAtVersion: getExactVersion,
      appendApproval,
      appendToolCall: async (call) => call,
      appendEvent: async (event) => event,
      buildEvidencePack, runGroundedSearch: providerSearch, generateText: providerGenerate,
      saveMemoDraft: persist, saveOutputCapsule: async () => null,
    })).rejects.toMatchObject({ diagnostic: { failedPhase: 'context-resolved' } });
    expect(getExactVersion).not.toHaveBeenCalled();
    expect(appendApproval).not.toHaveBeenCalled();
    expect(buildEvidencePack).not.toHaveBeenCalled();
    expect(providerSearch).not.toHaveBeenCalled();
    expect(providerGenerate).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it.each([
    null,
    { ownerUid: 'foreign-owner', capsuleId: payload.capsuleId, version: 2 },
    { ownerUid: payload.ownerUid, capsuleId: 'foreign-capsule', version: 2 },
    { ownerUid: payload.ownerUid, capsuleId: payload.capsuleId, version: 3 },
    { ownerUid: payload.ownerUid, capsuleId: payload.capsuleId, version: 2, archivedAt: '2026-09-30' },
  ])('rejects unavailable or foreign original saved context %j before providers', async (capsule) => {
    const providerSearch = search();
    const providerGenerate = generation();
    const buildEvidencePack = vi.fn(async () => evidence());
    const persist = save();
    await expect(executeAgentRun(payload, {
      getRun: async () => makeRun('queued', metadata),
      updateStatus: async (input) => makeRun(input.toStatus, metadata),
      getCapsuleAtVersion: async () => capsule === null ? null : makeSavedCapsule(capsule),
      appendToolCall: async (call) => call,
      appendApproval: async (approval) => approval,
      appendEvent: async (event) => event,
      buildEvidencePack, runGroundedSearch: providerSearch, generateText: providerGenerate,
      saveMemoDraft: persist, saveOutputCapsule: async () => null,
    })).rejects.toMatchObject({ diagnostic: { failedPhase: 'context-resolved' } });
    expect(buildEvidencePack).not.toHaveBeenCalled();
    expect(providerSearch).not.toHaveBeenCalled();
    expect(providerGenerate).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it.each([
    { ownerUid: 'foreign-owner' },
    { capsuleId: 'foreign-capsule' },
    { activeCapsule: { ownerUid: 'foreign-owner', capsuleId: payload.capsuleId, version: 2 } },
    { activeCapsule: { ownerUid: payload.ownerUid, capsuleId: 'foreign-capsule', version: 2 } },
    { activeCapsule: { ownerUid: payload.ownerUid, capsuleId: payload.capsuleId, version: 3 } },
    { activeCapsule: { ownerUid: payload.ownerUid, capsuleId: payload.capsuleId, version: 2, archivedAt: '2026-09-30' } },
  ])('rejects evidence-pack tuple drift %j before providers or saves', async (patch) => {
    const providerSearch = search();
    const providerGenerate = generation();
    const persist = save();
    await expect(executeAgentRun(payload, {
      getRun: async () => makeRun('queued', metadata),
      updateStatus: async (input) => makeRun(input.toStatus, metadata),
      appendToolCall: async (call) => call,
      appendApproval: async (approval) => approval,
      appendEvent: async (event) => event,
      buildEvidencePack: async () => ({ ...evidence(), ...patch }) as never,
      runGroundedSearch: providerSearch, generateText: providerGenerate,
      saveMemoDraft: persist, saveOutputCapsule: async () => null,
    })).rejects.toMatchObject({ diagnostic: { failedPhase: 'research-agent' } });
    expect(providerSearch).not.toHaveBeenCalled();
    expect(providerGenerate).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it('fails v0 before evidence or providers with a save-and-reattach instruction', async () => {
    const getExactVersion = vi.fn();
    const buildEvidencePack = vi.fn(async () => evidence());
    const providerSearch = search();
    const providerGenerate = generation();
    const persist = save();
    await expect(executeAgentRun(payload, {
      getRun: async () => makeRun('queued', { ...metadata, capsuleAgentExecutionContext: { ...original, capsuleVersion: 0 } }),
      updateStatus: async (input) => makeRun(input.toStatus, metadata),
      getCapsuleAtVersion: getExactVersion,
      appendToolCall: async (call) => call,
      appendApproval: async (approval) => approval,
      appendEvent: async (event) => event,
      buildEvidencePack, runGroundedSearch: providerSearch, generateText: providerGenerate,
      saveMemoDraft: persist, saveOutputCapsule: async () => null,
    })).rejects.toMatchObject({ diagnostic: { failedPhase: 'context-resolved', errorMessage: expect.stringMatching(/save.*reattach/i) } });
    expect(getExactVersion).not.toHaveBeenCalled();
    expect(buildEvidencePack).not.toHaveBeenCalled();
    expect(providerSearch).not.toHaveBeenCalled();
    expect(providerGenerate).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it('retains the exact drafting output and findings when only revision generation fails', async () => {
    const draft = 'Original draft with an unresolved implementation assumption.';
    const critique = 'Human verification remains required.';
    const expectedDraft = `${draft}\n\nSourceability self-critique:\n${critique}`;
    const findings = ['Verify the implementation assumption.', 'Preserve the evidence caveat.'];
    const events: AgentRunEvent[] = [];
    const phases: string[] = [];
    let completion: { message?: string | null; data?: Record<string, unknown>; metadata?: Record<string, unknown> } | undefined;
    const persist = save();
    const providerGenerate = vi.fn(async (input: { generationPhase?: string }) => {
      if (input.generationPhase === 'memo-revision') throw new Error('Revision provider unavailable.');
      if (input.generationPhase === 'memo-self-critique') return { text: critique };
      if (input.generationPhase === 'memo-red-team') return { text: findings.join('\n') };
      return { text: draft };
    });
    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', metadata),
      updateStatus: async (input) => {
        if (typeof input.data?.phase === 'string') phases.push(input.data.phase);
        if (input.toStatus === 'succeeded') completion = input;
        return makeRun(input.toStatus, { ...metadata, ...input.metadata });
      },
      appendToolCall: async (call) => call,
      appendApproval: async (approval) => approval,
      appendEvent: async (event) => { events.push(event); return event; },
      buildEvidencePack: async () => evidence(),
      runGroundedSearch: search(), generateText: providerGenerate,
      saveMemoDraft: persist, saveOutputCapsule: async () => null,
    });
    expect(result).toMatchObject({ status: 'succeeded', executionMode: 'multi-agent-supervisor' });
    const memo = persist.mock.calls[0][1];
    expect(memo).toMatchObject({ capsuleId: payload.capsuleId, capsuleVersion: 2, runId: payload.runId });
    expect(memo.blocks.find((block) => block.id === 'multi-agent-final')).toMatchObject({
      title: 'Draft retained for review', content: expectedDraft,
      metadata: {
        reviewFindings: findings,
        revisionOutcome: { execution: 'retained-draft', generationReceipt: null, degradedReason: 'Revision provider unavailable.' },
      },
    });
    expect(memo.blocks.find((block) => block.id === 'red-team-findings')).toMatchObject({ title: 'Red-team findings for review', items: findings });
    expect(memo.blocks.find((block) => block.id === 'agent-graph-receipt')?.items).toContain('Revision did not complete; drafting-agent output was retained unchanged for human review.');
    expect(memo.blocks.find((block) => block.id === 'multi-agent-final')?.metadata).not.toHaveProperty('addressedRedTeamFindings');
    expect(JSON.stringify(memo)).not.toMatch(/Addressed:|Red-team findings addressed/);
    expect(phases).toEqual(expect.arrayContaining(['memo-draft', 'memo-self-critique', 'memo-red-team']));
    expect(phases).not.toContain('memo-revision');
    const revisionEvent = events.find((event) => event.data.phase === 'supervisor.agent.revise.retained_draft');
    expect(revisionEvent?.data).toMatchObject({
      produces: [], reviewFindings: findings,
      revisionOutcome: { execution: 'retained-draft', generationReceipt: null, degradedReason: 'Revision provider unavailable.' },
    });
    expect(events.some((event) => event.data.phase === 'supervisor.agent.revise.succeeded')).toBe(false);
    expect(events.find((event) => event.data.phase === 'supervisor.graph.updated')?.data).toMatchObject({ finalAgentId: 'drafting-agent', revisionOutcome: { execution: 'retained-draft' } });
    expect(events.find((event) => event.data.phase === 'artifact.finalized')?.message).toMatch(/revision did not complete/i);
    expect(completion?.message).toMatch(/revision did not complete/i);
    expect(completion?.data).toMatchObject({ revisionOutcome: { execution: 'retained-draft' }, redTeamFindings: findings });
    expect(completion?.metadata).toMatchObject({ revisionOutcome: { execution: 'retained-draft' } });
  });

  it('does not retain or save a draft when the revision execution lease is lost', async () => {
    const persist = save();
    const providerGenerate = vi.fn(async (input: { generationPhase?: string }) => {
      if (input.generationPhase === 'memo-revision') throw new AgentExecutionLeaseError('Revision execution ownership expired.');
      return { text: 'Original memo or review finding.' };
    });
    await expect(executeAgentRun(payload, {
      getRun: async () => makeRun('queued', metadata),
      updateStatus: async (input) => makeRun(input.toStatus, { ...metadata, ...input.metadata }),
      appendToolCall: async (call) => call,
      appendApproval: async (approval) => approval,
      appendEvent: async (event) => event,
      buildEvidencePack: async () => evidence(),
      runGroundedSearch: search(), generateText: providerGenerate,
      saveMemoDraft: persist, saveOutputCapsule: async () => null,
    })).rejects.toMatchObject({ diagnostic: { failedPhase: 'revise-agent', errorMessage: 'Revision execution ownership expired.' } });
    expect(persist).not.toHaveBeenCalled();
  });
});
