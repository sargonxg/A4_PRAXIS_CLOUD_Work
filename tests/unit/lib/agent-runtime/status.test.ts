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
    expect(AGENT_RUN_RETRYABLE_STATUSES).toEqual(['dispatch_failed', 'failed', 'cancelled', 'expired']);
    expect(AGENT_RUN_CANCELLABLE_STATUSES).toEqual(['queued', 'dispatch_enqueued', 'running', 'waiting_approval']);
  });

  it('only retries dispatch failures and terminal failed runs', () => {
    for (const status of ['dispatch_failed', 'failed', 'cancelled', 'expired']) {
      expect(canRetryAgentRunStatus(status)).toBe(true);
    }
    for (const status of ['queued', 'dispatch_enqueued', 'running', 'waiting_approval', 'succeeded', 'warn']) {
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
      ['running', 'complete'],
      ['approval', 'active'],
      ['completed', 'pending'],
      ['failed', 'pending'],
    ]);

    expect(agentRunLifecycleSteps('failed').map((step) => [step.id, step.state])).toContainEqual(['failed', 'failed']);
    expect(agentRunLifecycleSteps('failed').map((step) => [step.id, step.state])).toContainEqual(['completed', 'pending']);
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
