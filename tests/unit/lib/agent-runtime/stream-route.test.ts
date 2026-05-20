import { describe, expect, it } from 'vitest';
import { encodeSseEvents } from '@/app/api/agents/runs/[runId]/stream/route';
import type { AgentRunEvent } from '@/lib/agent-runtime/types';
import {
  agentRailStageFromEvent,
  normalizeOrchestratorEvent,
} from '@/hooks/useOrchestratorEvents';

describe('agent run SSE stream route helpers', () => {
  it('encodes ledger events as named SSE events', () => {
    const body = encodeSseEvents([
      {
        id: 'event-1',
        runId: 'run-1',
        ownerUid: 'user-1',
        capsuleId: 'cap-1',
        eventType: 'praxis.reasoning.plan',
        fromStatus: null,
        toStatus: null,
        message: 'Planning',
        data: { phase: 'plan' },
        traceId: 'trace-1',
        createdAt: '2026-05-15T12:00:00.000Z',
      } satisfies AgentRunEvent,
    ]);

    expect(body).toContain('id: event-1');
    expect(body).toContain('event: praxis.reasoning.plan');
    expect(body).toContain('"traceId":"trace-1"');
    expect(body).toContain(': end');
  });

  it('maps worker, tool, source, approval, complete, and fail events to stable rail labels', () => {
    const events = [
      normalizeOrchestratorEvent({ type: 'status_transition', data: JSON.stringify({ toStatus: 'running' }) }),
      normalizeOrchestratorEvent({ type: 'praxis.reasoning.plan', data: JSON.stringify({ message: 'Plan' }) }),
      normalizeOrchestratorEvent({ type: 'praxis.reasoning.act', data: JSON.stringify({ toolId: 'grounded-search' }) }),
      normalizeOrchestratorEvent({ type: 'praxis.source.discovered', data: JSON.stringify({ sourceCount: 2 }) }),
      normalizeOrchestratorEvent({ type: 'praxis.approval_requested', data: JSON.stringify({ approvalId: 'approval-1' }) }),
      normalizeOrchestratorEvent({ type: 'praxis.memo_output_created', data: JSON.stringify({ memoId: 'memo-1' }) }),
      normalizeOrchestratorEvent({ type: 'fail', data: JSON.stringify({ message: 'failed' }) }),
    ];

    expect(events.map(agentRailStageFromEvent)).toEqual([
      'Agent started',
      'Research plan',
      'Tool call',
      'Source discovery',
      'Approval gate',
      'Save output',
      'Failed',
    ]);
  });
});
