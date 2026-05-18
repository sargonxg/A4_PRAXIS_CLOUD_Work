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
      'triage',
      'capsule',
      'tool_router',
      'supervisor',
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
      'Triage',
      'Context',
      'Tools',
      'Sources',
      'Agent run',
      'Draft',
    ]);
    expect(events.map((event) => event.status)).toEqual([
      'complete',
      'warn',
      'complete',
      'complete',
      'queued',
      'active',
    ]);
    expect(events.find((event) => event.id === 'agent-run')).toMatchObject({
      detail: 'Durable agent run queued for deeper work.',
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

    expect(buildAskOrchestrationStatusEvents(receipt).find((event) => event.id === 'agent-run')).toMatchObject({
      status: 'skipped',
      detail: 'No durable run needed for this answer.',
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
