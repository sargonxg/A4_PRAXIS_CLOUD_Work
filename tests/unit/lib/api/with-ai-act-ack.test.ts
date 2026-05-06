import { describe, expect, it } from 'vitest';
import { aiActAcknowledgedAt, requireAiActAck } from '@/lib/api/with-ai-act-ack';

describe('AI Act acknowledgement gate', () => {
  it('returns 428 when the acknowledgement header is missing', async () => {
    const res = requireAiActAck(new Request('https://praxis.test/api/ai/forecast', { method: 'POST' }));
    expect(res?.status).toBe(428);
    await expect(res?.json()).resolves.toMatchObject({ error: 'AI Act ack required' });
  });

  it('allows acknowledged requests and records an ISO timestamp', () => {
    const req = new Request('https://praxis.test/api/ai/forecast', {
      method: 'POST',
      headers: { 'X-AI-Act-Ack': 'session-1' },
    });
    expect(requireAiActAck(req)).toBeNull();
    expect(aiActAcknowledgedAt(req)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
