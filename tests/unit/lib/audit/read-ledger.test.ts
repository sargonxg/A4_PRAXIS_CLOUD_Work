import { describe, expect, it, vi } from 'vitest';
import { buildReadAuditEvent } from '@/lib/audit/read-ledger';

describe('buildReadAuditEvent', () => {
  it('normalizes Ask read ledger records', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456);
    const event = buildReadAuditEvent({
      uid: 'u1',
      situationId: 'sit-1',
      capsuleId: 'cap-1',
      threadId: 'thread-1',
      toolId: 'ask-praxis',
      sourceIds: ['src-1', ''],
      model: 'gemini-3-flash',
      latencyMs: 12.4,
      status: 'ok',
      costClass: 'standard',
      createdAt: '2026-05-14T00:00:00.000Z',
    });

    expect(event).toMatchObject({
      uid: 'u1',
      situationId: 'sit-1',
      capsuleId: 'cap-1',
      threadId: 'thread-1',
      toolId: 'ask-praxis',
      sourceIds: ['src-1'],
      model: 'gemini-3-flash',
      latencyMs: 12,
      status: 'ok',
      costClass: 'standard',
      createdAt: '2026-05-14T00:00:00.000Z',
    });
    expect(event.eventId).toMatch(/^evt-/);
  });
});
