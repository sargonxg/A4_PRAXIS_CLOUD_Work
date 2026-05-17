import { beforeEach, describe, expect, it, vi } from 'vitest';

const refreshProfileEmbedding = vi.fn();
const publishProfileEvent = vi.fn();

vi.mock('@/lib/firebase/profile-events', () => ({
  refreshProfileEmbedding: (uid: string) => refreshProfileEmbedding(uid),
  publishProfileEvent: (event: unknown) => publishProfileEvent(event),
}));

const { POST } = await import('@/app/api/events/pubsub/profile/route');

function request(payload: unknown, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/events/pubsub/profile', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(payload),
  });
}

function envelope(payload: unknown) {
  return {
    message: {
      data: Buffer.from(JSON.stringify(payload)).toString('base64'),
      messageId: 'm1',
    },
  };
}

describe('profile Pub/Sub subscriber route', () => {
  beforeEach(() => {
    refreshProfileEmbedding.mockReset();
    publishProfileEvent.mockReset();
    refreshProfileEmbedding.mockResolvedValue(true);
    publishProfileEvent.mockResolvedValue(true);
    delete process.env.PUBSUB_PUSH_SHARED_SECRET;
  });

  it('refreshes profile embeddings from valid push messages', async () => {
    const res = await POST(request(envelope({
      uid: 'u1',
      kind: 'completed',
      versionId: 'v1',
    })));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ handled: true, refreshed: true, messageId: 'm1' });
    expect(refreshProfileEmbedding).toHaveBeenCalledWith('u1');
    expect(publishProfileEvent).toHaveBeenCalledWith(expect.objectContaining({
      uid: 'u1',
      kind: 'embedding_refreshed',
      versionId: 'v1',
    }));
  });

  it('skips terminal embedding_refreshed events to avoid loops', async () => {
    const res = await POST(request(envelope({
      uid: 'u1',
      kind: 'embedding_refreshed',
    })));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ handled: true, skipped: true });
    expect(refreshProfileEmbedding).not.toHaveBeenCalled();
  });

  it('requires the shared secret when configured', async () => {
    process.env.PUBSUB_PUSH_SHARED_SECRET = 'secret-1';

    const unauthorized = await POST(request(envelope({ uid: 'u1', kind: 'completed' })));
    expect(unauthorized.status).toBe(401);

    const authorized = await POST(request(envelope({ uid: 'u1', kind: 'completed' }), {
      authorization: 'Bearer secret-1',
    }));
    expect(authorized.status).toBe(200);
  });
});
