import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AgentRunSnapshotState } from '@/hooks/useAgentRunSnapshots';
import type { AskOrchestrationStatusEvent } from '@/lib/ai/ask-orchestrator';

const mocks = vi.hoisted(() => ({ snapshots: vi.fn(), events: vi.fn() }));
vi.mock('@/hooks/useAgentRunSnapshots', () => ({ useAgentRunSnapshots: mocks.snapshots }));
vi.mock('@/hooks/useOrchestratorEvents', () => ({
  useOrchestratorEvents: mocks.events,
  agentRailStageFromEvent: () => 'Output saved',
}));

import { AskQueuedAgentRunPanel, latestAgentRunSummary } from '@/components/ask/AskQueuedAgentRunPanel';

const queued: AskOrchestrationStatusEvent = {
  type: 'orchestrationStatus', id: 'worker', label: 'Saving artifact',
  status: 'warn', detail: 'Dispatch failed', runId: 'run-1', fallbackPosture: 'dispatch_failed',
};

function snapshot(run: AgentRunSnapshotState['run']): AgentRunSnapshotState {
  return { run, events: [], toolCalls: [], approvals: [], isConnected: true, error: null };
}

describe('agent run status recovery', () => {
  beforeEach(() => {
    mocks.snapshots.mockReturnValue(snapshot(null));
    mocks.events.mockReturnValue({ events: [] });
  });

  it('keeps the retry action for an actual dispatch failure', () => {
    mocks.snapshots.mockReturnValue(snapshot({ runId: 'run-1', status: 'queued' }));
    const html = renderToStaticMarkup(<AskQueuedAgentRunPanel queuedRun={queued} />);
    expect(html).toContain('Agent dispatch failed');
    expect(html).toContain('>Retry</button>');
    expect(html).not.toContain('>Cancel</button>');
  });

  it('shows a recovered running agent and allows cancellation despite the original failure receipt', () => {
    mocks.snapshots.mockReturnValue(snapshot({ runId: 'run-1', status: 'running' }));
    const html = renderToStaticMarkup(<AskQueuedAgentRunPanel queuedRun={queued} />);
    expect(html).not.toContain('Agent dispatch failed');
    expect(html).toContain('run-1 / running');
    expect(html).toContain('>Cancel</button>');
    expect(html).not.toContain('>Retry</button>');
    expect(mocks.events.mock.calls.at(-1)?.[1].enabled).toBe(true);
  });

  it('shows completion and stops streaming even when the queued receipt recorded dispatch failure', () => {
    mocks.snapshots.mockReturnValue(snapshot({ runId: 'run-1', status: 'succeeded', outputHref: '/app?memo=1' }));
    const html = renderToStaticMarkup(<AskQueuedAgentRunPanel queuedRun={queued} />);
    expect(html).toContain('run-1 / succeeded');
    expect(html).not.toContain('Agent dispatch failed');
    expect(html).not.toContain('>Retry</button>');
    expect(mocks.events.mock.calls.at(-1)?.[1].enabled).toBe(false);
  });

  it('keeps the newest API receipt when the Firestore mirror is behind', () => {
    const completed = { runId: 'run-1', status: 'succeeded', updatedAt: '2026-09-29T13:00:01Z' };
    const staleMirror = { runId: 'run-1', status: 'running', updatedAt: '2026-09-29T13:00:00Z' };
    expect(latestAgentRunSummary('run-1', completed, staleMirror)).toBe(completed);
    expect(latestAgentRunSummary('run-1', staleMirror, completed)).toBe(completed);
  });

  it('uses newer approval transitions in either direction', () => {
    const waiting = { runId: 'run-1', status: 'waiting_approval', updatedAt: '2026-09-29T13:00:00Z' };
    const resumed = { runId: 'run-1', status: 'running', updatedAt: '2026-09-29T13:00:01Z' };
    expect(latestAgentRunSummary('run-1', resumed, waiting)).toBe(resumed);
    expect(latestAgentRunSummary('run-1', waiting, resumed)).toBe(resumed);
  });

  it('ignores the original run after retry and preserves terminal proof without timestamps', () => {
    const oldRun = { runId: 'run-1', status: 'failed' };
    const retry = { runId: 'run-2', status: 'queued' };
    expect(latestAgentRunSummary('run-2', oldRun, retry)).toBe(retry);
    expect(latestAgentRunSummary('run-2', oldRun)).toBeNull();
    const completed = { runId: 'run-2', status: 'succeeded' };
    expect(latestAgentRunSummary('run-2', completed, retry)).toBe(completed);
  });
});
