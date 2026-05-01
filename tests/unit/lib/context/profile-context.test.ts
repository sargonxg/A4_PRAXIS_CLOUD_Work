import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase/analyst-profile-admin', () => ({
  getAnalystProfile: vi.fn(),
}));
vi.mock('@/lib/firebase/situations', () => ({
  getSituationById: vi.fn(),
}));
vi.mock('@/lib/knowledge/profile-weighted-retrieval', () => ({
  retrieveForProfile: vi.fn(),
}));

import { buildCalibratedContext } from '@/lib/context/profile-context';
import { getAnalystProfile } from '@/lib/firebase/analyst-profile-admin';
import { getSituationById } from '@/lib/firebase/situations';
import { retrieveForProfile } from '@/lib/knowledge/profile-weighted-retrieval';
import { DEFAULT_ANALYST_PROFILE } from '@/types/analyst-profile';

describe('buildCalibratedContext', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns neutral context when profile missing and situation missing', async () => {
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const ctx = await buildCalibratedContext({ uid: 'u1', toolId: 'risk-monitor' });
    expect(ctx.provenance.profileVersion).toBe(0);
    expect(ctx.provenance.situationVersion).toBeNull();
    expect(ctx.systemPromptBlock).toContain('No profile set');
    expect(ctx.systemPromptBlock).toContain('No active situation');
    expect(ctx.outputConstraints.language).toBe('en');
  });

  it('includes situation and profile when both exist', async () => {
    const profile = { ...DEFAULT_ANALYST_PROFILE, meta: { ...DEFAULT_ANALYST_PROFILE.meta, version: 4 } };
    const situation = { id: 's1', name: 'Sudan', type: 'civil', region: 'Horn of Africa', actors: [], userRole: 'analyst', status: 'active', description: 'Ceasefire context', createdAt: null, updatedAt: null };
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
    (getSituationById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(situation);
    const ctx = await buildCalibratedContext({ uid: 'u1', toolId: 'risk-monitor', situationId: 's1' });
    expect(ctx.provenance.profileVersion).toBe(4);
    expect(ctx.systemPromptBlock).toContain('Sudan');
    expect(retrieveForProfile).toHaveBeenCalledWith({
      uid: 'u1',
      situationId: 's1',
      query: expect.stringContaining('risk-monitor | Sudan'),
      topK: 5,
    });
  });

  it('calls retrieval when retrievalQuery provided', async () => {
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(DEFAULT_ANALYST_PROFILE);
    (getSituationById as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (retrieveForProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'c1', text: 'hit', source: 'wiki' }]);
    const ctx = await buildCalibratedContext({ uid: 'u1', toolId: 'chat', retrievalQuery: 'why', retrievalTopK: 5 });
    expect(retrieveForProfile).toHaveBeenCalledWith({ uid: 'u1', situationId: undefined, query: 'why', topK: 5 });
    expect(ctx.systemPromptBlock).toContain('<retrieved-knowledge>');
  });

  it('never throws when embedding or retrieval fails — returns neutral fallback', async () => {
    (getAnalystProfile as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('firestore down'));
    const ctx = await buildCalibratedContext({ uid: 'u1', toolId: 'risk-monitor' });
    expect(ctx.provenance.profileVersion).toBe(0);
  });
});
