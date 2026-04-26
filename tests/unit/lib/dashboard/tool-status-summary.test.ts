import { describe, expect, it } from 'vitest';
import { summarizeToolStatuses } from '@/lib/dashboard/tool-status-summary';

describe('dashboard tool status summary', () => {
  it('counts health, freshness, running, and priority items', () => {
    const summary = summarizeToolStatuses({
      briefing: {
        health: 'green',
        generatedAt: '2026-04-26T00:00:00.000Z',
        isFresh: true,
        isStale: false,
        isResearching: false,
        lastError: null,
      },
      'risk-monitor': {
        health: 'yellow',
        generatedAt: '2026-04-24T00:00:00.000Z',
        isFresh: false,
        isStale: true,
        isResearching: false,
        lastError: null,
      },
      'deep-search-agent': {
        health: 'green',
        generatedAt: null,
        isFresh: false,
        isStale: false,
        isResearching: true,
        lastError: null,
      },
      'media-compass': {
        health: 'red',
        generatedAt: null,
        isFresh: false,
        isStale: false,
        isResearching: false,
        lastError: 'timeout',
      },
    });

    expect(summary.total).toBe(4);
    expect(summary.fresh).toBe(1);
    expect(summary.stale).toBe(1);
    expect(summary.running).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.warning).toBe(1);
    expect(summary.priorityItems.map((item) => item.toolId)).toEqual([
      'media-compass',
      'deep-search-agent',
      'risk-monitor',
    ]);
  });

  it('limits priority rows', () => {
    const summary = summarizeToolStatuses({
      a: status('red'),
      b: status('red'),
      c: status('yellow'),
    }, 2);

    expect(summary.priorityItems).toHaveLength(2);
  });
});

function status(health: 'green' | 'yellow' | 'red') {
  return {
    health,
    generatedAt: null,
    isFresh: false,
    isStale: false,
    isResearching: false,
    lastError: health === 'red' ? 'failed' : null,
  };
}
