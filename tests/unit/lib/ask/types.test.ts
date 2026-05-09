import { describe, expect, it } from 'vitest';

import {
  ASK_MODES,
  askMessageCitationSchema,
  askMessageSchema,
  askRunRequestSchema,
  askThreadSchema,
} from '@/lib/ask/types';

const uuid = '11111111-1111-4111-8111-111111111111';

describe('v7 Ask substrate types', () => {
  it('keeps the locked Ask modes stable', () => {
    expect(ASK_MODES).toEqual(['quick', 'deep', 'plan', 'memo', 'brief', 'talking_points']);
  });

  it('validates a thread, message, citation, and run request', () => {
    expect(() =>
      askThreadSchema.parse({
        id: uuid,
        ownerUid: 'uid-1',
        situationId: 'syria-2026',
        situationCoreId: uuid,
        title: 'Ask PRAXIS thread',
        mode: 'quick',
        status: 'active',
        attachedCoreIds: [uuid],
        createdAt: '2026-05-08T00:00:00Z',
        updatedAt: '2026-05-08T00:00:00Z',
        metadata: {},
      }),
    ).not.toThrow();

    expect(() =>
      askMessageSchema.parse({
        id: uuid,
        ownerUid: 'uid-1',
        threadId: uuid,
        role: 'assistant',
        content: 'Grounded answer.',
        sequence: 1,
        routeAction: 'direct_answer',
        tokenCount: 24,
        costUsd: 0.001,
        createdAt: '2026-05-08T00:00:00Z',
        metadata: {},
      }),
    ).not.toThrow();

    expect(() =>
      askMessageCitationSchema.parse({
        id: uuid,
        ownerUid: 'uid-1',
        messageId: uuid,
        citationIndex: 1,
        sourceKind: 'source_receipt',
        sourceId: 'src-1',
        title: 'Source receipt',
        confidence: 0.8,
        createdAt: '2026-05-08T00:00:00Z',
        metadata: {},
      }),
    ).not.toThrow();

    expect(askRunRequestSchema.parse({ query: 'What changed?', attachedCoreIds: [uuid] }).mode).toBe('quick');
  });
});
