import { describe, expect, it } from 'vitest';
import { encodeSseEvents } from '@/app/api/agents/runs/[runId]/stream/route';
import type { AgentRunEvent } from '@/lib/agent-runtime/types';

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
});
