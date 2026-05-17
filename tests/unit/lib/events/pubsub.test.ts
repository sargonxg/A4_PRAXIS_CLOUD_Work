import { beforeEach, describe, expect, it, vi } from 'vitest';
import { decodePubSubJsonEnvelope, publishPubSubJson } from '@/lib/events/pubsub';

const publishMessage = vi.fn();

vi.mock('@google-cloud/pubsub', () => ({
  PubSub: class {
    topic(name: string) {
      return {
        publishMessage: (input: unknown) => publishMessage(name, input),
      };
    }
  },
}));

describe('Pub/Sub JSON helper', () => {
  beforeEach(() => {
    publishMessage.mockReset();
    publishMessage.mockResolvedValue('message-1');
  });

  it('publishes JSON payloads with compact string attributes', async () => {
    const ok = await publishPubSubJson({
      topicName: 'praxis.events',
      payload: { eventType: 'agent_run.created', runId: 'run-1' },
      attributes: {
        eventType: 'agent_run.created',
        runId: 'run-1',
        capsuleId: null,
      },
    });

    expect(ok).toBe(true);
    expect(publishMessage).toHaveBeenCalledWith('praxis.events', {
      data: expect.any(Buffer),
      attributes: {
        eventType: 'agent_run.created',
        runId: 'run-1',
      },
    });
    const published = publishMessage.mock.calls[0][1] as { data: Buffer };
    expect(JSON.parse(published.data.toString('utf8'))).toEqual({
      eventType: 'agent_run.created',
      runId: 'run-1',
    });
  });

  it('returns false instead of throwing when publish fails', async () => {
    publishMessage.mockRejectedValueOnce(new Error('topic missing'));

    await expect(publishPubSubJson({
      topicName: 'missing.topic',
      payload: {},
      logPrefix: 'test',
    })).resolves.toBe(false);
  });

  it('decodes Pub/Sub push envelopes', () => {
    const decoded = decodePubSubJsonEnvelope({
      message: {
        data: Buffer.from(JSON.stringify({ uid: 'u1', kind: 'completed' })).toString('base64'),
        attributes: { kind: 'completed' },
        messageId: 'm1',
      },
      subscription: 'projects/p/subscriptions/s',
    });

    expect(decoded).toMatchObject({
      ok: true,
      payload: { uid: 'u1', kind: 'completed' },
      attributes: { kind: 'completed' },
      messageId: 'm1',
    });
  });

  it('rejects malformed push envelopes', () => {
    expect(decodePubSubJsonEnvelope({})).toEqual({
      ok: false,
      error: 'Invalid Pub/Sub push envelope',
    });
    expect(decodePubSubJsonEnvelope({ message: {} })).toEqual({
      ok: false,
      error: 'Pub/Sub message data is required',
    });
  });
});
