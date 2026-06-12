import type { AgentRunStatus } from '@/lib/agent-runtime/types';

export type AgentRunUiStatus =
  | AgentRunStatus
  | 'dispatch_enqueued'
  | 'dispatch_failed'
  | 'ledger_failed'
  | 'warn';

export const AGENT_RUN_TERMINAL_STATUSES = ['succeeded', 'failed', 'cancelled', 'expired'] as const;
export const AGENT_RUN_RETRYABLE_STATUSES = ['dispatch_failed', 'failed', 'cancelled'] as const;
export const AGENT_RUN_CANCELLABLE_STATUSES = ['queued', 'dispatch_enqueued', 'running', 'waiting_approval'] as const;

export type AgentRunLifecycleStep = {
  id: 'queued' | 'dispatched' | 'started' | 'sources' | 'approval' | 'output_saved' | 'thread_returned';
  label: string;
  state: 'pending' | 'active' | 'complete' | 'failed' | 'degraded' | 'expired';
  title?: string;
};

export type AgentRunLifecycleEvent = {
  rawType?: string | null;
  eventType?: string | null;
  type?: string | null;
  message?: string | null;
  data?: Record<string, unknown> | null;
};

export type AgentRunLifecycleInput = {
  events?: AgentRunLifecycleEvent[];
  sourceReceiptCount?: number;
  approvalCount?: number;
  pendingApprovalCount?: number;
  outputHref?: string | null;
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

export function agentRunLifecycleSteps(
  status: string | null | undefined,
  input: AgentRunLifecycleInput = {},
): AgentRunLifecycleStep[] {
  const normalized = status ?? 'queued';
  const events = input.events ?? [];
  const failed = normalized === 'failed' || normalized === 'cancelled' || normalized === 'dispatch_failed' || normalized === 'ledger_failed';
  const expired = normalized === 'expired';
  const dispatchFailed = normalized === 'dispatch_failed' || normalized === 'ledger_failed';
  const succeeded = normalized === 'succeeded';
  const runningOrLater = normalized === 'running' || normalized === 'waiting_approval' || isTerminalAgentRunStatus(normalized);
  const approvalRelevant = normalized === 'waiting_approval'
    || (input.approvalCount ?? 0) > 0
    || (input.pendingApprovalCount ?? 0) > 0
    || hasLifecycleEvent(events, isApprovalEvent);
  const sourcesRelevant = (input.sourceReceiptCount ?? 0) > 0 || hasLifecycleEvent(events, isSourceEvent);
  const dispatchDone = hasLifecycleEvent(events, (event) => event.rawType === 'dispatch_enqueued') || runningOrLater;
  const startedDone = hasLifecycleEvent(events, (event) => event.rawType === 'status_transition' && stringValue(event.data?.toStatus) === 'running')
    || normalized === 'waiting_approval'
    || isTerminalAgentRunStatus(normalized);
  const outputDone = Boolean(input.outputHref)
    || succeeded
    || hasLifecycleEvent(events, isOutputEvent);
  const approvalResolved = approvalRelevant
    && (succeeded || failed || expired || hasLifecycleEvent(events, isApprovalResolvedEvent));
  const sourceDone = sourcesRelevant
    && ((input.sourceReceiptCount ?? 0) > 0 || hasLifecycleEvent(events, isSourceDoneEvent) || outputDone || succeeded);
  const threadReturnPosted = hasLifecycleEvent(events, (event) => event.rawType === 'thread_return_posted');
  const threadReturnFailed = events.find((event) => eventRawType(event) === 'thread_return_failed');
  const failedTitle = threadReturnFailed?.message ?? stringValue(threadReturnFailed?.data?.message) ?? undefined;

  const steps: AgentRunLifecycleStep[] = [
    { id: 'queued', label: 'Queued', state: normalized === 'queued' ? 'active' : 'complete' },
    {
      id: 'dispatched',
      label: 'Dispatched',
      state: dispatchFailed ? 'failed' : dispatchDone ? 'complete' : normalized === 'dispatch_enqueued' ? 'active' : 'pending',
    },
    {
      id: 'started',
      label: 'Started',
      state: startedDone ? 'complete' : normalized === 'running' ? 'active' : 'pending',
    },
  ];

  if (sourcesRelevant) {
    steps.push({
      id: 'sources',
      label: 'Sources',
      state: sourceDone ? 'complete' : normalized === 'running' ? 'active' : 'pending',
    });
  }

  if (approvalRelevant) {
    steps.push({
      id: 'approval',
      label: 'Approval',
      state: normalized === 'waiting_approval'
        ? 'active'
        : approvalResolved
          ? 'complete'
          : 'pending',
    });
  }

  steps.push({
    id: 'output_saved',
    label: 'Output saved',
    state: outputDone ? 'complete' : succeeded ? 'complete' : 'pending',
  });

  if (threadReturnFailed) {
    steps.push({
      id: 'thread_returned',
      label: 'Returned to thread',
      state: 'degraded',
      title: failedTitle,
    });
  } else if (threadReturnPosted) {
    steps.push({ id: 'thread_returned', label: 'Returned to thread', state: 'complete' });
  } else if (expired) {
    steps.push({ id: 'thread_returned', label: 'Expired', state: 'expired' });
  } else if (failed || normalized === 'cancelled') {
    steps.push({
      id: 'thread_returned',
      label: normalized === 'cancelled' ? 'Cancelled' : 'Failed',
      state: normalized === 'cancelled' ? 'degraded' : 'failed',
    });
  } else {
    steps.push({
      id: 'thread_returned',
      label: 'Returned to thread',
      state: outputDone ? 'active' : 'pending',
    });
  }

  return steps;
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

function hasLifecycleEvent(
  events: AgentRunLifecycleEvent[],
  predicate: (event: { rawType: string; data: Record<string, unknown>; message: string | null }) => boolean,
): boolean {
  return events.some((event) => predicate(normalizeLifecycleEvent(event)));
}

function normalizeLifecycleEvent(event: AgentRunLifecycleEvent): {
  rawType: string;
  data: Record<string, unknown>;
  message: string | null;
} {
  return {
    rawType: eventRawType(event),
    data: event.data && typeof event.data === 'object' && !Array.isArray(event.data) ? event.data : {},
    message: event.message ?? null,
  };
}

function eventRawType(event: AgentRunLifecycleEvent): string {
  return stringValue(event.rawType) ?? stringValue(event.eventType) ?? stringValue(event.type) ?? '';
}

function isSourceEvent(event: { rawType: string; data: Record<string, unknown> }): boolean {
  return event.rawType.includes('source')
    || event.rawType.includes('grounding')
    || event.rawType.includes('document.retrieved')
    || stringArray(event.data.sourceReceiptIds).length > 0;
}

function isSourceDoneEvent(event: { rawType: string; data: Record<string, unknown> }): boolean {
  return isSourceEvent(event)
    && !event.rawType.includes('started')
    && !event.rawType.includes('degraded');
}

function isApprovalEvent(event: { rawType: string }): boolean {
  return event.rawType.includes('approval');
}

function isApprovalResolvedEvent(event: { rawType: string }): boolean {
  return event.rawType === 'approval_approved'
    || event.rawType === 'approval_rejected'
    || event.rawType === 'approval_expired'
    || event.rawType.includes('approval.granted');
}

function isOutputEvent(event: { rawType: string; data: Record<string, unknown> }): boolean {
  return event.rawType.includes('output_created')
    || event.rawType.includes('memo_output')
    || event.rawType.includes('artifact.finalized')
    || stringValue(event.data.outputHref) !== null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}
