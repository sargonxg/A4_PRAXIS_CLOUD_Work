import { describe, expect, it } from 'vitest';
import {
  answerEnvelopeFromDataStreamLine,
  buildConversationPath,
  safeMarkdownHref,
  sanitizeConversationThreadId,
  savedConversationHref,
  savedConversationTurnsToMessages,
} from '@/components/praxis/tasklet-workbench-conversation';

describe('tasklet workbench conversation helpers', () => {
  it('keeps conversation links capsule scoped and sanitizes thread ids', () => {
    expect(sanitizeConversationThreadId(' ask-good_123! ')).toBe('ask-good_123');
    expect(sanitizeConversationThreadId('x!')).toBeNull();
    expect(buildConversationPath('capsule one', 'ask-good_123')).toBe('/app/conversations/ask-good_123?capsuleId=capsule%20one');
    expect(savedConversationHref({ conversationId: 'ask-existing', href: '/app/conversations/ask-existing?capsuleId=c1' }, 'fallback')).toBe('/app/conversations/ask-existing?capsuleId=c1');
    expect(savedConversationHref({ conversationId: 'ask-existing', capsuleId: 'c2' }, 'fallback')).toBe('/app/conversations/ask-existing?capsuleId=c2');
  });

  it('restores saved turns with answer envelopes and retry-safe failure text', () => {
    const messages = savedConversationTurnsToMessages([
      {
        prompt: 'What supports this?',
        output: '',
        runtime: {
          error: 'provider timeout',
          answerEnvelope: { followUps: ['Check sources'] },
          routingReceipt: { selectedToolIds: ['ask-praxis'] },
        },
      },
    ]);

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ role: 'user', text: 'What supports this?' });
    expect(messages[1]).toMatchObject({
      role: 'assistant',
      text: 'This Ask PRAXIS turn did not complete. provider timeout',
      answerEnvelope: { followUps: ['Check sources'] },
      routingReceipt: { selectedToolIds: ['ask-praxis'] },
    });
  });

  it('prefers first-class saved Ask answer envelopes while keeping legacy runtime fallback', () => {
    const envelope = {
      orchestrationReceipt: {
        turnPlan: { summary: 'Plan the policy answer' },
        supervisor: { queuedRun: { runId: 'run-1', status: 'dispatch_enqueued' } },
      },
      answerQualitySummary: { sourceCount: 3 },
      agenticDepthRecommendation: { mode: 'queued', runId: 'run-1' },
      contextRepairActions: [{ id: 'check-sources', label: 'Check sources' }],
      sourceCards: [{ id: 'source-1', title: 'Primary source' }],
      documentPackCandidate: { title: 'Answer pack' },
    };
    const messages = savedConversationTurnsToMessages([
      {
        prompt: 'What changed?',
        output: 'A sourced answer.',
        answerEnvelope: envelope as never,
        runtime: { answerEnvelope: { followUps: ['legacy fallback only'] } },
      },
    ]);

    expect(messages[1]).toMatchObject({
      role: 'assistant',
      answerEnvelope: envelope,
    });
  });

  it('parses answer envelopes from AI SDK data stream lines and rejects unsafe markdown links', () => {
    expect(answerEnvelopeFromDataStreamLine('2:{"type":"answerEnvelope","answerEnvelope":{"followUps":["Check weakest claim"]}}')).toMatchObject({
      followUps: ['Check weakest claim'],
    });
    expect(answerEnvelopeFromDataStreamLine('0:"plain text"')).toBeUndefined();
    expect(safeMarkdownHref('https://example.com/source')).toBe('https://example.com/source');
    expect(safeMarkdownHref('/app/library?receiptId=r1')).toBe('/app/library?receiptId=r1');
    expect(safeMarkdownHref('javascript:alert(1)')).toBeNull();
  });
});
