import { describe, expect, it } from 'vitest';
import { buildCompactRunTimelineViewModel } from '@/lib/agent-runtime/run-timeline-view-model';
import type { AgentRunSnapshotSummary } from '@/hooks/useAgentRunSnapshots';
import type { OrchestratorEvent } from '@/hooks/useOrchestratorEvents';

function event(rawType: string, phase: string, message: string, type: OrchestratorEvent['type'] = 'step'): OrchestratorEvent {
  return {
    id: `${rawType}-${phase}`,
    runId: 'run-1',
    rawType,
    type,
    message,
    data: { phase },
    createdAt: '2026-06-11T10:00:00.000Z',
  };
}

function run(overrides: Partial<AgentRunSnapshotSummary> = {}): AgentRunSnapshotSummary {
  return {
    runId: 'run-1',
    status: 'running',
    outputHref: null,
    policyAgentId: 'research-memo',
    policyAgentLabel: 'Research Memo Agent',
    outputTargetLabel: 'Work',
    selectedTools: ['grounded-search', 'deep-search-agent', 'sourceability-reviewer'],
    sourceReceiptIds: [],
    sourceCount: 0,
    approvalGateCount: 0,
    sourcePosture: null,
    groundingPosture: null,
    degradedReason: null,
    ...overrides,
  };
}

describe('compact run timeline view model', () => {
  it('maps research run events to five phase dots with latest line and counts', () => {
    const vm = buildCompactRunTimelineViewModel({
      run: run(),
      events: [
        event('praxis.orchestration.triage_decided', 'research.plan_created', 'Research plan created.'),
        event('praxis.tool.grounded-search.completed', 'grounding.live_retrieval_succeeded', 'Grounded search returned receipts.'),
        event('praxis.sourceability.completed', 'sourceability.claims_verified', 'Claims verified.'),
      ],
      toolCalls: [
        { id: 'tool-1', toolId: 'grounded-search', status: 'succeeded', risk: 'medium' },
        { id: 'tool-2', toolId: 'sourceability-reviewer', status: 'succeeded', risk: 'low' },
      ],
      approvals: [{ id: 'approval-1', runId: 'run-1', toolCallId: 'tool-3', status: 'pending', reason: 'Review needed', risk: 'medium', requestedAt: '2026-06-11T10:01:00.000Z' }],
    });

    expect(vm.mode).toBe('research');
    expect(vm.phases.map((phase) => phase.id)).toEqual(['plan', 'source', 'retrieve', 'verify', 'synthesize']);
    expect(vm.phases).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'plan', status: 'complete' }),
      expect.objectContaining({ id: 'retrieve', status: 'complete' }),
      expect.objectContaining({ id: 'verify', status: 'complete' }),
    ]));
    expect(vm.latestLine).toBe('Claims verified.');
    expect(vm.toolCallCount).toBe(2);
    expect(vm.pendingApprovalCount).toBe(1);
    expect(vm.collapsed).toBe(false);
  });

  it('collapses completed runs and preserves the result link', () => {
    const vm = buildCompactRunTimelineViewModel({
      run: run({ status: 'succeeded', outputHref: '/app?panel=memo&memoId=memo-1' }),
      events: [event('praxis.artifact.finalized', 'artifact.finalized', 'Artifact finalized.', 'complete')],
    });

    expect(vm.collapsed).toBe(true);
    expect(vm.outputHref).toBe('/app?panel=memo&memoId=memo-1');
    expect(vm.phases.every((phase) => phase.status === 'complete')).toBe(true);
  });
});
