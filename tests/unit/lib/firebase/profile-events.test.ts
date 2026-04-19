import { describe, it, expect, vi, beforeEach } from 'vitest';

const publishMock = vi.fn().mockResolvedValue('msg-1');
vi.mock('@google-cloud/pubsub', () => {
  class PubSub {
    topic() {
      return { publishMessage: publishMock };
    }
  }
  return { PubSub };
});

import { publishProfileEvent, refreshProfileEmbedding } from '@/lib/firebase/profile-events';

vi.mock('@/lib/firebase/analyst-profile-admin', () => ({
  getAnalystProfile: vi.fn(),
  upsertAnalystProfile: vi.fn(),
}));
vi.mock('@/lib/knowledge/embedding-service', () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(768).fill(0.01)),
}));
import { getAnalystProfile, upsertAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { DEFAULT_ANALYST_PROFILE } from '@/types/analyst-profile';

describe('profile-events', () => {
  beforeEach(() => vi.clearAllMocks());

  it('publishProfileEvent publishes to profile.events topic', async () => {
    const ok = await publishProfileEvent({ uid: 'u1', kind: 'completed', versionId: 'v3' });
    expect(ok).toBe(true);
    expect(publishMock).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.any(Buffer),
      attributes: expect.objectContaining({ kind: 'completed', uid: 'u1' }),
    }));
  });

  it('publishProfileEvent returns false but does not throw when Pub/Sub fails', async () => {
    publishMock.mockRejectedValueOnce(new Error('publish failed'));
    const ok = await publishProfileEvent({ uid: 'u1', kind: 'updated' });
    expect(ok).toBe(false);
  });

  it('refreshProfileEmbedding writes 768-dim vector', async () => {
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...DEFAULT_ANALYST_PROFILE,
      perspective: { ...DEFAULT_ANALYST_PROFILE.perspective, mandate: 'I do X', lenses: ['humanitarian'] },
    });
    const ok = await refreshProfileEmbedding('u1');
    expect(ok).toBe(true);
    expect(upsertAnalystProfile).toHaveBeenCalledWith('u1', expect.objectContaining({
      embedding: expect.objectContaining({ vector: expect.any(Array) }),
    }));
  });

  it('refreshProfileEmbedding is a no-op when profile missing', async () => {
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const ok = await refreshProfileEmbedding('u1');
    expect(ok).toBe(false);
  });
});
