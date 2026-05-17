import { describe, expect, it } from 'vitest';
import { buildOutputFormatterReasoningLoop, runBoundedReasoningLoop } from '@/lib/agent-runtime/reasoning-loop';
import type { AgentRun } from '@/lib/agent-runtime/types';

function run(maxStep = 20): AgentRun {
  return {
    id: 'run-1',
    agentSpecId: null,
    ownerUid: 'user-1',
    capsuleId: 'cap-1',
    contextStackId: 'default',
    contextPackageId: null,
    selectedCoreIds: {
      userCoreId: null,
      teamCoreId: null,
      situationCoreId: null,
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
    status: 'running',
    triggerType: 'manual',
    objective: 'Draft memo',
    traceId: 'trace-1',
    parentRunId: null,
    idempotencyKey: 'idem-1',
    maxStep,
    maxSessionMinutes: 30,
    internalEstimatedCostCents: null,
    internalSpendCents: 0,
    metadata: {},
    createdAt: '2026-05-15T12:00:00.000Z',
    updatedAt: '2026-05-15T12:00:00.000Z',
    queuedAt: '2026-05-15T12:00:00.000Z',
    startedAt: null,
    completedAt: null,
    expiresAt: null,
  };
}

describe('agent reasoning loop', () => {
  it('stops at the run max step budget and emits a completion receipt', () => {
    const result = runBoundedReasoningLoop(run(1), [
      { id: 'one', phase: 'plan', toolId: 'context-resolve', message: 'One', readOnly: true },
      { id: 'two', phase: 'act', toolId: 'policy-memo', message: 'Two' },
    ]);

    expect(result.completed).toBe(true);
    expect(result.steps.map((step) => step.id)).toEqual(['one', 'loop-complete']);
  });

  it('stops before high-risk tools and records an approval reason', () => {
    const result = runBoundedReasoningLoop(run(), [
      { id: 'safe', phase: 'plan', toolId: 'context-resolve', message: 'Safe', readOnly: true },
      { id: 'external', phase: 'act', toolId: 'external-send-email', message: 'Send' },
      { id: 'never', phase: 'reflect', toolId: 'sourceability-reviewer', message: 'Never' },
    ]);

    expect(result.completed).toBe(false);
    expect(result.stoppedForApproval).toBe(true);
    expect(result.nextApprovalReason).toContain('external-send-email');
    expect(result.steps.map((step) => step.phase)).toEqual(['plan', 'approval_gate']);
  });

  it('builds an output formatter loop that preserves citation review', () => {
    const result = buildOutputFormatterReasoningLoop(run());

    expect(result.completed).toBe(true);
    expect(result.stoppedForApproval).toBe(false);
    expect(result.steps.map((step) => step.id)).toContain('format-work-product');
    expect(result.steps.map((step) => step.id)).toContain('preserve-citations');
  });
});
