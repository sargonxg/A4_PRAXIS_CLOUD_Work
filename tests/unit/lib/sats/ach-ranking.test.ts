import { describe, expect, it } from 'vitest';
import { rankACH } from '@/lib/sats/ach-ranking';
import type { ACHMatrix } from '@/types/sats';

const baseMatrix: ACHMatrix = {
  id: 'ach-1',
  caseId: 'case-1',
  ownerUid: 'user-1',
  title: 'Test ACH',
  status: 'in_progress',
  hypotheses: [
    { id: 'h-a', text: 'A', proposedBy: 'user' },
    { id: 'h-b', text: 'B', proposedBy: 'user' },
    { id: 'h-c', text: 'C', proposedBy: 'user' },
  ],
  evidence: [
    { id: 'e-1', text: 'First', sourceKind: 'free_text', weight: 1, diagnosticity: 1 },
    { id: 'e-2', text: 'Second', sourceKind: 'free_text', weight: 0.5, diagnosticity: 0.5 },
  ],
  scores: [
    { hypothesisId: 'h-a', evidenceId: 'e-1', rating: 'consistent' },
    { hypothesisId: 'h-a', evidenceId: 'e-2', rating: 'unknown' },
    { hypothesisId: 'h-b', evidenceId: 'e-1', rating: 'inconsistent' },
    { hypothesisId: 'h-b', evidenceId: 'e-2', rating: 'consistent' },
    { hypothesisId: 'h-c', evidenceId: 'e-1', rating: 'consistent' },
    { hypothesisId: 'h-c', evidenceId: 'e-2', rating: 'inconsistent' },
  ],
  createdAt: '2026-05-06T00:00:00.000Z',
  updatedAt: '2026-05-06T00:00:00.000Z',
};

describe('rankACH', () => {
  it('ranks by least weighted inconsistency, not support count', () => {
    const rankings = rankACH(baseMatrix);

    expect(rankings.map((ranking) => ranking.hypothesisId)).toEqual(['h-a', 'h-c', 'h-b']);
    expect(rankings[0]).toMatchObject({
      hypothesisId: 'h-a',
      inconsistencyCount: 0,
      weightedInconsistency: 0,
      rank: 1,
      conclusion: 'most_likely',
    });
    expect(rankings[1]).toMatchObject({
      hypothesisId: 'h-c',
      inconsistencyCount: 1,
      weightedInconsistency: 0.25,
      conclusion: 'plausible',
    });
  });

  it('uses deterministic tie-breaking after weighted inconsistency and count', () => {
    const tied = rankACH({
      ...baseMatrix,
      scores: [
        { hypothesisId: 'h-b', evidenceId: 'e-1', rating: 'unknown' },
        { hypothesisId: 'h-a', evidenceId: 'e-1', rating: 'unknown' },
      ],
    });

    expect(tied.map((ranking) => ranking.hypothesisId)).toEqual(['h-a', 'h-b', 'h-c']);
  });
});
