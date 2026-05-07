import { describe, expect, it } from 'vitest';
import { buildInitialACHMatrix } from '@/lib/sats/ach-store';

describe('ACH persistence helpers', () => {
  it('builds owner-scoped matrices with computed rankings', () => {
    const matrix = buildInitialACHMatrix({
      uid: 'user-1',
      caseId: 'case-1',
      achId: 'ach-1',
      title: 'ACH test',
      now: '2026-05-06T12:00:00.000Z',
    });

    expect(matrix).toMatchObject({
      id: 'ach-1',
      caseId: 'case-1',
      ownerUid: 'user-1',
      title: 'ACH test',
      createdAt: '2026-05-06T12:00:00.000Z',
      updatedAt: '2026-05-06T12:00:00.000Z',
    });
    expect(matrix.ranking).toEqual(expect.arrayContaining([
      expect.objectContaining({ rank: 1, conclusion: 'most_likely' }),
    ]));
  });
});
