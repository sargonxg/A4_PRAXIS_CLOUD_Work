import { describe, it, expect, beforeEach } from 'vitest';
import { useAiErrorStore } from '@/stores/ai-error-store';

describe('useAiErrorStore', () => {
  beforeEach(() => {
    useAiErrorStore.getState().clear();
  });

  it('starts empty', () => {
    expect(useAiErrorStore.getState().errors).toEqual([]);
  });

  it('publishes an entry with id, at, and supplied fields', () => {
    const id = useAiErrorStore.getState().publish({
      toolId: 'risk-monitor',
      status: 503,
      message: 'Pro model quota exhausted',
    });
    const entries = useAiErrorStore.getState().errors;
    expect(entries.length).toBe(1);
    expect(entries[0].id).toBe(id);
    expect(entries[0].toolId).toBe('risk-monitor');
    expect(entries[0].status).toBe(503);
    expect(entries[0].message).toBe('Pro model quota exhausted');
    expect(entries[0].at.length).toBeGreaterThan(0);
  });

  it('dismiss removes the entry by id', () => {
    const a = useAiErrorStore.getState().publish({
      toolId: 'briefing',
      status: 503,
      message: 'one',
    });
    const b = useAiErrorStore.getState().publish({
      toolId: 'humanitarian',
      status: 429,
      message: 'two',
    });
    useAiErrorStore.getState().dismiss(a);
    const entries = useAiErrorStore.getState().errors;
    expect(entries.length).toBe(1);
    expect(entries[0].id).toBe(b);
  });

  it('preserves retry callback across publish', async () => {
    let retried = 0;
    useAiErrorStore.getState().publish({
      toolId: 'media-roundup',
      status: 500,
      message: 'boom',
      retryable: true,
      retry: () => {
        retried += 1;
      },
    });
    const entry = useAiErrorStore.getState().errors[0];
    expect(entry.retryable).toBe(true);
    await entry.retry?.();
    expect(retried).toBe(1);
  });

  it('clear empties the queue', () => {
    useAiErrorStore.getState().publish({ toolId: 't1', status: 500, message: 'x' });
    useAiErrorStore.getState().publish({ toolId: 't2', status: 500, message: 'y' });
    useAiErrorStore.getState().clear();
    expect(useAiErrorStore.getState().errors).toEqual([]);
  });

  it('every published id is unique even within the same ms', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const id = useAiErrorStore.getState().publish({ toolId: 'x', status: 500, message: String(i) });
      ids.add(id);
    }
    expect(ids.size).toBe(50);
  });
});
