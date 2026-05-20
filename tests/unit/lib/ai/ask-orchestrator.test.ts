import { describe, expect, it } from 'vitest';
import {
  buildAskConversationOrchestrationReceipt,
  buildAskOrchestrationStatusEvents,
} from '@/lib/ai/ask-orchestrator';
import type { AskContextReceipt } from '@/lib/ai/ask-conversation';

describe('Ask PRAXIS conversation orchestrator', () => {
  it('keeps simple turns agentic without forcing a durable run', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'What should I look at next?',
      intent: 'normal_answer',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 4 }),
      sourcePreviewCount: 2,
      activeGapCount: 0,
    });

    expect(receipt.triage.agenticMode).toBe('direct_with_receipts');
    expect(receipt.supervisor.action).toBe('direct_answer');
    expect(receipt.toolRouting.selectedToolIds).toEqual([
      'context-resolve',
      'capsule-evidence-pack',
    ]);
    expect(receipt.stages.map((stage) => stage.stage)).toEqual([
      'capsule',
      'triage',
      'agent_router',
      'model_tier',
      'tool_router',
      'worker',
      'draft',
    ]);
  });

  it('auto-queues deep current multi-source asks through a durable agent run', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Do a deep search with current sources and prepare a memo on the latest access restrictions.',
      intent: 'research_memo',
      contextReceipt: contextReceipt({ health: 'thin', evidenceCount: 1 }),
      sourcePreviewCount: 1,
      activeGapCount: 2,
    });

    expect(receipt.triage.complexity).toBe('deep');
    expect(receipt.triage.agenticMode).toBe('queue_agent_run');
    expect(receipt.triage.policyAgentId).toBe('research-memo');
    expect(receipt.toolRouting.selectedToolIds).toEqual(expect.arrayContaining([
      'context-resolve',
      'capsule-evidence-pack',
      'grounded-search',
      'deep-search-agent',
      'policy-memo',
      'sourceability-reviewer',
    ]));
    expect(receipt.supervisor).toMatchObject({
      action: 'queue_agent_run',
      status: 'planned',
      policyAgentId: 'research-memo',
    });
    expect(receipt.routingDecision).toMatchObject({
      policyAgentId: 'research-memo',
      modelTier: 'deep',
      workerMode: 'research-memo',
    });
    expect(receipt.routingDecision.userSafeLabels.modelTier).toBe('TACITUS selected deep reasoning');
  });

  it('routes capsule-building and formatting prompts to concrete worker modes', () => {
    const capsule = buildAskConversationOrchestrationReceipt({
      prompt: 'Build a ContextCapsule from these attached sources.',
      intent: 'normal_answer',
      contextReceipt: contextReceipt({ health: 'thin', evidenceCount: 1 }),
      sourcePreviewCount: 1,
      activeGapCount: 2,
    });
    const formatter = buildAskConversationOrchestrationReceipt({
      prompt: 'Format this answer into an export-ready memo.',
      intent: 'normal_answer',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 4 }),
      sourcePreviewCount: 2,
      activeGapCount: 0,
    });

    expect(capsule.routingDecision).toMatchObject({
      policyAgentId: 'capsule-factory',
      workerMode: 'capsule-factory',
    });
    expect(formatter.routingDecision).toMatchObject({
      policyAgentId: 'output-formatter',
      workerMode: 'output-formatter',
    });
  });

  it('approval-gates high-risk tool routes while preserving the answer path', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Update the graph and export this externally after the answer.',
      intent: 'normal_answer',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 3 }),
      sourcePreviewCount: 1,
      activeGapCount: 0,
    });

    expect(receipt.supervisor.action).toBe('direct_answer');
    expect(receipt.toolRouting.approvalRequiredToolIds).toEqual(expect.arrayContaining([
      'graph-mutation',
      'external-export',
    ]));
    expect(receipt.toolRouting.blockedToolIds).toEqual(expect.arrayContaining([
      'graph-mutation',
      'external-export',
    ]));
  });

  it('queues specialist sourceability, red-team, and handover asks even when the prompt is short', () => {
    for (const intent of ['sourceability_review', 'red_team_review', 'handover'] as const) {
      const receipt = buildAskConversationOrchestrationReceipt({
        prompt: 'Review this.',
        intent,
        contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 3 }),
        sourcePreviewCount: 1,
        activeGapCount: 0,
      });

      expect(receipt.supervisor.action).toBe('queue_agent_run');
      expect(receipt.triage.agenticMode).toBe('queue_agent_run');
    }
  });

  it('maps receipt stages to safe user-facing Ask working timeline events', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Do a deep sourceability review and prepare a memo with current sources.',
      intent: 'sourceability_review',
      contextReceipt: contextReceipt({ health: 'thin', evidenceCount: 1, warnings: ['DATABASE_URL missing at https://internal.run.app'] }),
      sourcePreviewCount: 2,
      activeGapCount: 3,
      contextPackageId: 'pack-1',
    });

    const events = buildAskOrchestrationStatusEvents(receipt);

    expect(events.map((event) => event.label)).toEqual([
      'Capsule read',
      'Research plan',
      'Source discovery',
      'Document retrieval',
      'Gap review',
      'Synthesis',
      'Save output',
    ]);
    expect(events.map((event) => event.status)).toEqual([
      'warn',
      'complete',
      'complete',
      'complete',
      'complete',
      'queued',
      'active',
    ]);
    expect(events.find((event) => event.id === 'worker')).toMatchObject({
      detail: 'Durable agent run queued for deeper work.',
      agentLabel: 'Sourceability Reviewer',
      selectedToolIds: expect.arrayContaining(['grounded-search', 'deep-search-agent']),
      sourceCount: 2,
      approvalGateCount: 0,
      outputTarget: 'Memo Studio',
      groundingPosture: 'Google grounding requested',
    });
    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain('DATABASE_URL');
    expect(serialized).not.toContain('https://');
    expect(serialized).not.toContain('run.app');
  });

  it('marks skipped agent runs plainly for simple synchronous answers', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Summarize this capsule.',
      intent: 'normal_answer',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 4 }),
      sourcePreviewCount: 0,
      activeGapCount: 0,
    });

    expect(buildAskOrchestrationStatusEvents(receipt).find((event) => event.id === 'worker')).toMatchObject({
      status: 'skipped',
      detail: 'No durable run needed for this answer.',
    });
  });

  it('keeps dispatch failures actionable without hiding the run id', () => {
    const receipt = buildAskConversationOrchestrationReceipt({
      prompt: 'Do a deep current source memo.',
      intent: 'research_memo',
      contextReceipt: contextReceipt({ health: 'ready', evidenceCount: 3 }),
      sourcePreviewCount: 1,
      activeGapCount: 0,
    });

    const events = buildAskOrchestrationStatusEvents({
      ...receipt,
      supervisor: {
        ...receipt.supervisor,
        status: 'dispatch_enqueued',
        queuedRun: {
          runId: 'run-1',
          status: 'dispatch_failed',
          outputHref: '/app/write',
          error: 'worker target missing',
        },
      },
    });

    expect(events.find((event) => event.id === 'worker')).toMatchObject({
      status: 'warn',
      runId: 'run-1',
      canOpen: true,
      canRetry: true,
      canCancel: false,
      fallbackPosture: 'dispatch_failed',
    });
  });
});

function contextReceipt(overrides: Partial<AskContextReceipt> = {}): AskContextReceipt {
  return {
    capsuleId: 'capsule-1',
    capsuleVersion: 3,
    threadId: 'ask-capsule-1',
    traceId: 'trace-1',
    health: 'ready',
    coreRefs: {
      userCoreId: 'user-core-1',
      situationCoreId: 'situation-core-1',
      sourceDocumentCoreIds: ['doc-1'],
      graphCoreId: 'graph-1',
      memoryCoreId: 'memory-1',
      outputCoreIds: ['memo-1'],
    },
    retrievalLayers: ['capsule-core-refs', 'source-receipts'],
    referenceCapsuleIds: [],
    referenceCapsuleCount: 0,
    missingReferenceCapsuleIds: [],
    evidenceCount: 3,
    historyTurnCount: 1,
    memoryPersistence: 'cloud-sql',
    warnings: [],
    stages: [],
    ...overrides,
  };
}
