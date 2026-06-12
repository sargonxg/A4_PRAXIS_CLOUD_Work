import { describe, expect, it } from 'vitest';
import {
  AGENT_RUN_CANCELLABLE_STATUSES,
  AGENT_RUN_RETRYABLE_STATUSES,
  AGENT_RUN_TERMINAL_STATUSES,
  agentRunLifecycleSteps,
  canCancelAgentRunStatus,
  canRetryAgentRunStatus,
  shouldPollAgentRunStatus,
  shouldStreamAgentRunStatus,
  userSafeAgentRunError,
} from '@/lib/agent-runtime/status';

describe('agent run status policy', () => {
  it('centralizes terminal, retryable, and cancellable statuses', () => {
    expect(AGENT_RUN_TERMINAL_STATUSES).toEqual(['succeeded', 'failed', 'cancelled', 'expired']);
    expect(AGENT_RUN_RETRYABLE_STATUSES).toEqual(['dispatch_failed', 'failed', 'cancelled']);
    expect(AGENT_RUN_CANCELLABLE_STATUSES).toEqual(['queued', 'dispatch_enqueued', 'running', 'waiting_approval']);
  });

  it('only retries dispatch failures and terminal failed runs', () => {
    for (const status of ['dispatch_failed', 'failed', 'cancelled']) {
      expect(canRetryAgentRunStatus(status)).toBe(true);
    }
    for (const status of ['queued', 'dispatch_enqueued', 'running', 'waiting_approval', 'succeeded', 'expired', 'warn']) {
      expect(canRetryAgentRunStatus(status)).toBe(false);
    }
  });

  it('stops polling and streaming terminal runs unless the user expands details', () => {
    expect(shouldPollAgentRunStatus('running')).toBe(true);
    expect(shouldStreamAgentRunStatus('running', { expanded: false, newestActive: true })).toBe(true);
    expect(shouldPollAgentRunStatus('succeeded')).toBe(false);
    expect(shouldStreamAgentRunStatus('succeeded', { expanded: false, newestActive: true })).toBe(false);
    expect(shouldStreamAgentRunStatus('succeeded', { expanded: true, newestActive: false })).toBe(true);
  });

  it('builds a compact lifecycle timeline without pretending failed runs completed', () => {
    expect(agentRunLifecycleSteps('waiting_approval').map((step) => [step.id, step.state])).toEqual([
      ['queued', 'complete'],
      ['dispatched', 'complete'],
      ['started', 'complete'],
      ['approval', 'active'],
      ['output_saved', 'pending'],
      ['thread_returned', 'pending'],
    ]);

    expect(agentRunLifecycleSteps('failed').map((step) => [step.id, step.state])).toContainEqual(['thread_returned', 'failed']);
    expect(agentRunLifecycleSteps('expired').at(-1)).toMatchObject({ id: 'thread_returned', label: 'Expired', state: 'expired' });
  });

  it('derives the seven-step proof rail from returned-to-thread events in order', () => {
    const steps = agentRunLifecycleSteps('succeeded', {
      sourceReceiptCount: 2,
      approvalCount: 1,
      outputHref: '/app?memoId=memo-1',
      events: [
        lifecycleEvent('dispatch_enqueued'),
        lifecycleEvent('status_transition', { toStatus: 'running' }),
        lifecycleEvent('praxis.source.discovered', { sourceReceiptIds: ['source-1'] }),
        lifecycleEvent('approval_requested'),
        lifecycleEvent('approval_approved'),
        lifecycleEvent('praxis.output_created'),
        lifecycleEvent('thread_return_posted'),
      ],
    });

    expect(steps.map((step) => step.label)).toEqual([
      'Queued',
      'Dispatched',
      'Started',
      'Sources',
      'Approval',
      'Output saved',
      'Returned to thread',
    ]);
    expect(steps.map((step) => step.state)).toEqual([
      'complete',
      'complete',
      'complete',
      'complete',
      'complete',
      'complete',
      'complete',
    ]);
  });

  it('marks thread return failures as degraded with the failure message', () => {
    const steps = agentRunLifecycleSteps('succeeded', {
      events: [
        lifecycleEvent('dispatch_enqueued'),
        lifecycleEvent('status_transition', { toStatus: 'running' }),
        lifecycleEvent('praxis.output_created'),
        lifecycleEvent('thread_return_failed', {}, 'Could not append to the Ask thread.'),
      ],
    });

    expect(steps.at(-1)).toMatchObject({
      id: 'thread_returned',
      label: 'Returned to thread',
      state: 'degraded',
      title: 'Could not append to the Ask thread.',
    });
  });

  it('maps ledger and queue failures to user-safe language', () => {
    expect(userSafeAgentRunError('Agent run ledger is not configured')).toMatch(/Deep work ledger/i);
    expect(userSafeAgentRunError('Cloud Tasks queue unavailable')).toMatch(/Deep work queue/i);
  });

  it('allows cancellation only before terminal states', () => {
    for (const status of ['queued', 'dispatch_enqueued', 'running', 'waiting_approval']) {
      expect(canCancelAgentRunStatus(status)).toBe(true);
    }
    for (const status of ['succeeded', 'failed', 'cancelled', 'expired']) {
      expect(canCancelAgentRunStatus(status)).toBe(false);
    }
  });
});

function lifecycleEvent(rawType: string, data: Record<string, unknown> = {}, message: string | null = null) {
  return {
    id: rawType,
    rawType,
    eventType: rawType,
    type: 'progress',
    data,
    message,
    createdAt: '2026-06-12T12:00:00.000Z',
  };
}
