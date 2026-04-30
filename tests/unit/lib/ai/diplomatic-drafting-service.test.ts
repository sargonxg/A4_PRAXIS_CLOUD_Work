import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/firebase/situations', () => ({ getSituationById: vi.fn() }));

import {
  buildDraftingEvidencePrompt,
  resolveSituationFromRequest,
  sourceAuditPrompt,
} from '@/lib/ai/diplomatic-drafting-service';
import { getSituationById } from '@/lib/firebase/situations';

describe('diplomatic-drafting-service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prefers an embedded situation when present', async () => {
    const result = await resolveSituationFromRequest({
      uid: 'u1',
      situationId: 's1',
      situation: { id: 's1', name: 'Test Situation', actors: [] },
    });

    expect(result.situation?.name).toBe('Test Situation');
    expect(result.situationId).toBe('s1');
    expect(getSituationById).not.toHaveBeenCalled();
  });

  it('loads a situation by id when only situationId is provided', async () => {
    vi.mocked(getSituationById).mockResolvedValueOnce({
      id: 's2',
      name: 'Loaded Situation',
      actors: [],
    } as never);

    const result = await resolveSituationFromRequest({ uid: 'u1', situationId: 's2' });

    expect(getSituationById).toHaveBeenCalledWith('u1', 's2');
    expect(result.situation?.name).toBe('Loaded Situation');
    expect(result.situationId).toBe('s2');
  });

  it('builds a clear evidence prompt when context is missing', () => {
    expect(buildDraftingEvidencePrompt({})).toContain('No external evidence was available');
  });

  it('requires audit fields for diplomatic artifacts', () => {
    const prompt = sourceAuditPrompt('policy-memo');
    expect(prompt).toContain('draftingAudit.artifactMode');
    expect(prompt).toContain('policy-memo');
    expect(prompt).toContain('followUpResearch');
  });
});
