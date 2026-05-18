import { describe, expect, it } from 'vitest';

import {
  applyOrchestratorEvent,
  normalizeOrchestratorEvent,
  type OrchestratorEventState,
} from '@/hooks/useOrchestratorEvents';

describe('useOrchestratorEvents state helpers', () => {
  const baseState: OrchestratorEventState = {
    events: [],
    lastEventId: null,
    isConnected: false,
    isReconnecting: false,
    lastEventAt: null,
    terminalEvent: null,
    error: null,
  };

  it('normalizes supported SSE events and tracks last event id', () => {
    const start = normalizeOrchestratorEvent({
      id: 'evt-1',
      type: 'start',
      data: JSON.stringify({
        runId: 'run-1',
        eventType: 'start',
        message: 'Research Memo Agent started',
        createdAt: '2026-05-18T10:00:00.000Z',
      }),
    });

    expect(start).toMatchObject({
      id: 'evt-1',
      runId: 'run-1',
      type: 'start',
      message: 'Research Memo Agent started',
      createdAt: '2026-05-18T10:00:00.000Z',
    });

    const next = applyOrchestratorEvent(baseState, start);
    expect(next.lastEventId).toBe('evt-1');
    expect(next.lastEventAt).toBe('2026-05-18T10:00:00.000Z');
    expect(next.isReconnecting).toBe(false);
    expect(next.events).toHaveLength(1);
  });

  it('maps PRAXIS ledger events to progress and terminal states', () => {
    const progress = normalizeOrchestratorEvent({
      id: 'evt-2',
      type: 'praxis.reasoning.plan',
      data: JSON.stringify({
        id: 'evt-2',
        runId: 'run-1',
        eventType: 'praxis.reasoning.plan',
        message: 'Planning',
        createdAt: '2026-05-18T10:00:01.000Z',
      }),
    });
    const complete = normalizeOrchestratorEvent({
      id: 'evt-3',
      type: 'status_transition',
      data: JSON.stringify({
        id: 'evt-3',
        runId: 'run-1',
        eventType: 'status_transition',
        toStatus: 'succeeded',
        message: 'Completed',
        createdAt: '2026-05-18T10:00:02.000Z',
      }),
    });

    const afterProgress = applyOrchestratorEvent(baseState, progress);
    const afterComplete = applyOrchestratorEvent(afterProgress, complete);

    expect(progress.type).toBe('progress');
    expect(complete.type).toBe('complete');
    expect(afterComplete.terminalEvent?.type).toBe('complete');
    expect(afterComplete.lastEventId).toBe('evt-3');
    expect(afterComplete.events.map((event) => event.type)).toEqual(['progress', 'complete']);
  });

  it('marks reconnect attempts without losing previous events', () => {
    const progress = normalizeOrchestratorEvent({
      id: 'evt-4',
      type: 'progress',
      data: JSON.stringify({ runId: 'run-1', message: 'Working' }),
    });
    const afterProgress = applyOrchestratorEvent(baseState, progress);
    const reconnecting = { ...afterProgress, isConnected: false, isReconnecting: true };

    expect(reconnecting.events).toHaveLength(1);
    expect(reconnecting.lastEventId).toBe('evt-4');
    expect(reconnecting.isReconnecting).toBe(true);
  });
});
