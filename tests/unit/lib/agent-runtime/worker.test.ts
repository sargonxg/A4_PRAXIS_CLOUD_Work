import { describe, expect, it } from 'vitest';
import { AgentWorkerError, executeAgentRun, executeNoopAgentRun, type ExecuteAgentRunPayload } from '@/lib/agent-runtime/worker';
import type { AgentApproval, AgentRun, AgentRunEvent, AgentToolCall } from '@/lib/agent-runtime/types';

const payload: ExecuteAgentRunPayload = {
  runId: 'run-1',
  ownerUid: 'user-1',
  capsuleId: 'cap-1',
  traceId: 'trace-1',
  dispatchId: 'dispatch-1',
  attempt: 1,
  requestedAt: '2026-05-15T12:00:00.000Z',
};

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

describe('agent runtime no-op worker', () => {
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
      generateText: async ({ system }) => {
        if (system.includes('red-team')) return { text: '- Clarify unsupported implementation dependency.\n- Preserve source caveat in the recommendation.' };
        if (system.includes('revise agent')) return { text: 'Revised memo with source caveat and explicit implementation dependency.' };
        if (system.includes('self-critique')) return { text: 'Self-critique: caveat retained.' };
        return { text: 'Draft memo with inline receipt [web-supervisor-1].' };
      },
      buildEvidencePack: async () => makeEvidencePack({ sourceReceiptIds: ['source-receipt-1'] }),
      saveMemoDraft: async (_uid, input) => {
        savedBlocks.push(...input.blocks.map((block) => `${block.id}:${block.content ?? ''}`));
        expect(input.blocks.find((block) => block.id === 'multi-agent-final')?.content).toContain('Red-team findings addressed in revision');
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
    expect(savedBlocks.join('\n')).toContain('Addressed: Clarify unsupported implementation dependency.');
  });

  it('routes research-memo runs into memo and output capsule receipts', async () => {
    const transitions: AgentRun['status'][] = [];
    const mirrored: string[] = [];
    const toolCalls: string[] = [];
    const result = await executeAgentRun(payload, {
      getRun: async () => makeRun('queued', { policyAgentId: 'research-memo' }),
      updateStatus: async (input) => {
        transitions.push(input.toStatus);
        return makeRun(input.toStatus, { policyAgentId: 'research-memo' });
      },
      appendToolCall: async (toolCall) => {
        toolCalls.push(`${toolCall.toolId}:${toolCall.status}`);
        return toolCall;
      },
      appendApproval: async (approval) => approval,
      buildEvidencePack: async () => ({
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
        mirrored.push(String(event.data.phase ?? event.eventType));
        return event;
      },
      saveMemoDraft: async (_uid, input) => {
        expect(input.templateId).toBe('policy-memo');
        expect(input.blocks.some((block) => block.id === 'source-receipt')).toBe(true);
        expect(input.blocks.some((block) => block.id === 'sourced-paragraphs')).toBe(true);
        expect(input.blocks.some((block) => block.id === 'gap-receipt')).toBe(true);
        return { memo: { id: 'memo-1' } };
      },
      saveOutputCapsule: async (_uid, input) => {
        expect(input.templateId).toBe('options-memo');
        expect(input.citations).toHaveLength(1);
        expect(input.gaps).toHaveLength(1);
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
    expect(mirrored).toContain('context_resolved');
    expect(mirrored).toContain('capsule.read_receipt_created');
    expect(mirrored).toContain('workflow.plan_created');
    expect(mirrored).toContain('sourceability.ledger_created');
    expect(mirrored).toContain('reasoning.plan');
    expect(mirrored).toContain('reasoning.act');
    expect(mirrored).toContain('reasoning.reflect');
    expect(mirrored).toContain('reasoning.complete');
    expect(mirrored).toContain('memo_output_created');
  });

  it('runs research memo as live plan, retrieval, source-check, draft, critique, and finalize phases', async () => {
    const mirrored: Array<{ phase: string; data: Record<string, unknown> }> = [];
    const toolCalls: Array<{ toolId: string; status: string; output: Record<string, unknown> | null }> = [];
    const generatedPrompts: string[] = [];
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
      updateStatus: async (input) => makeRun(input.toStatus, {
        policyAgentId: 'research-memo',
        selectedToolIds: ['context-resolve', 'grounded-search', 'sourceability-reviewer', 'policy-memo'],
      }),
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
        activeCapsule: { capsuleId: 'cap-1', version: 2 } as never,
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
        expect(input.unsupportedClaims).toContain('A disputed implementation detail still needs field confirmation.');
        expect(input.claimChecks).toEqual(expect.arrayContaining([
          expect.objectContaining({
            status: 'supported',
            sourceReceiptIds: expect.arrayContaining(['doc-src-1', 'web-live-1']),
          }),
        ]));
        expect(input.blocks.some((block) => block.id === 'live-memo-draft')).toBe(true);
        expect(input.blocks.find((block) => block.id === 'live-memo-draft')?.metadata).toMatchObject({
          weakSourceHighlight: true,
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
    expect(toolCalls).toEqual(expect.arrayContaining([
      expect.objectContaining({ toolId: 'grounded-search', status: 'succeeded' }),
      expect.objectContaining({ toolId: 'sourceability-reviewer', status: 'succeeded' }),
      expect.objectContaining({ toolId: 'policy-memo', status: 'succeeded' }),
    ]));
    expect(toolCalls.find((call) => call.toolId === 'sourceability-reviewer' && call.output)?.output).toMatchObject({
      unsupportedClaimCount: 1,
      checkedClaimCount: 2,
      liveSourceReceiptCount: 1,
    });
    expect(mirrored.map((event) => event.phase)).toEqual(expect.arrayContaining([
      'research.plan_created',
      'grounding.live_retrieval_started',
      'grounding.live_retrieval_succeeded',
      'sourceability.claims_verified',
      'memo.draft_created',
      'memo.self_critique_completed',
      'artifact.finalized',
    ]));
    expect(mirrored.find((event) => event.phase === 'sourceability.claims_verified')?.data).toMatchObject({
      unsupportedClaimCount: 1,
      liveSourceReceiptCount: 1,
    });
  });

  it('creates review cards instead of mutating the capsule when capsule factory proposes improvements', async () => {
    const reviewCards: Array<{ title: string; target: string; patch: Record<string, unknown> | undefined }> = [];

    await executeAgentRun(payload, {
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
