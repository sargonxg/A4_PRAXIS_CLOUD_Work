import type { AgentRunStatus } from '@/lib/agent-runtime/types';

export type AgentRunUiStatus =
  | AgentRunStatus
  | 'dispatch_enqueued'
  | 'dispatch_failed'
  | 'ledger_failed'
  | 'warn';

export const AGENT_RUN_TERMINAL_STATUSES = ['succeeded', 'failed', 'cancelled', 'expired'] as const;
export const AGENT_RUN_RETRYABLE_STATUSES = ['dispatch_failed', 'failed', 'cancelled', 'expired'] as const;
export const AGENT_RUN_CANCELLABLE_STATUSES = ['queued', 'dispatch_enqueued', 'running', 'waiting_approval'] as const;

export type AgentRunLifecycleStep = {
  id: 'queued' | 'dispatched' | 'running' | 'approval' | 'completed' | 'failed';
  label: string;
  state: 'pending' | 'active' | 'complete' | 'failed';
};

export function isTerminalAgentRunStatus(status: string | null | undefined): boolean {
  return AGENT_RUN_TERMINAL_STATUSES.includes(status as (typeof AGENT_RUN_TERMINAL_STATUSES)[number]);
}

export function canRetryAgentRunStatus(status: string | null | undefined): boolean {
  return AGENT_RUN_RETRYABLE_STATUSES.includes(status as (typeof AGENT_RUN_RETRYABLE_STATUSES)[number]);
}

export function canCancelAgentRunStatus(status: string | null | undefined): boolean {
  return AGENT_RUN_CANCELLABLE_STATUSES.includes(status as (typeof AGENT_RUN_CANCELLABLE_STATUSES)[number]);
}

export function shouldPollAgentRunStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  if (isTerminalAgentRunStatus(status)) return false;
  return status !== 'dispatch_failed' && status !== 'ledger_failed' && status !== 'warn';
}

export function shouldStreamAgentRunStatus(
  status: string | null | undefined,
  input: { expanded: boolean; newestActive: boolean },
): boolean {
  if (!status) return false;
  if (input.expanded) return true;
  return input.newestActive && shouldPollAgentRunStatus(status);
}

export function agentRunLifecycleSteps(status: string | null | undefined): AgentRunLifecycleStep[] {
  const normalized = status ?? 'queued';
  const failed = normalized === 'failed' || normalized === 'cancelled' || normalized === 'expired' || normalized === 'dispatch_failed' || normalized === 'ledger_failed' || normalized === 'warn';
  const succeeded = normalized === 'succeeded';

  const stateFor = (id: AgentRunLifecycleStep['id']): AgentRunLifecycleStep['state'] => {
    if (failed && id === 'failed') return 'failed';
    if (failed && id === 'completed') return 'pending';
    if (succeeded) return id === 'failed' ? 'pending' : 'complete';

    if (normalized === 'queued') return id === 'queued' ? 'active' : 'pending';
    if (normalized === 'dispatch_enqueued') {
      if (id === 'queued') return 'complete';
      return id === 'dispatched' ? 'active' : 'pending';
    }
    if (normalized === 'running') {
      if (id === 'queued' || id === 'dispatched') return 'complete';
      return id === 'running' ? 'active' : 'pending';
    }
    if (normalized === 'waiting_approval') {
      if (id === 'queued' || id === 'dispatched' || id === 'running') return 'complete';
      return id === 'approval' ? 'active' : 'pending';
    }

    return id === 'queued' ? 'active' : 'pending';
  };

  return [
    { id: 'queued', label: 'Queued', state: stateFor('queued') },
    { id: 'dispatched', label: 'Dispatched', state: stateFor('dispatched') },
    { id: 'running', label: 'Running', state: stateFor('running') },
    { id: 'approval', label: 'Approval', state: stateFor('approval') },
    { id: 'completed', label: 'Completed', state: stateFor('completed') },
    { id: 'failed', label: 'Failed', state: stateFor('failed') },
  ];
}

export function userSafeAgentRunError(message: string | null | undefined): string {
  const text = (message ?? '').toLowerCase();
  if (/\bledger\b|postgres|cloud sql|\bsql\b|database|not configured/.test(text)) {
    return 'Deep work ledger is unavailable. Ask stayed in the same thread, but durable run status cannot be updated right now.';
  }
  if (/queue|cloud tasks|task|dispatch|enqueue/.test(text)) {
    return 'Deep work queue is unavailable. Ask stayed in the same thread, and this run can be retried when dispatch recovers.';
  }
  return 'Deep work status is unavailable. Ask stayed in the same thread, but PRAXIS could not refresh this run.';
}
