import { describe, expect, it } from 'vitest';
import {
  mergeWorkspaceNextMoves,
  nextMovesDocId,
  sanitizeNextMoveStatus,
  sanitizeWorkspaceNextMoves,
  updateNextMoveStatus,
} from '@/lib/dashboard/next-moves';

describe('dashboard next moves persistence contract', () => {
  it('sanitizes core-derived next moves for owner-scoped storage', () => {
    const state = sanitizeWorkspaceNextMoves({
      situationId: 'sit-1',
      userModelId: 'foreign-policy-analyst',
      now: '2026-05-12T12:00:00.000Z',
      moves: [
        {
          id: 'memo-drafter',
          label: 'Memo Drafter',
          detail: 'Turn the selected cores into a reviewable draft.',
          href: '/app?panel=memo&situationId=sit-1',
          emphasis: 'primary',
        },
        {
          id: 'external',
          label: 'Bad',
          detail: 'Should not persist.',
          href: 'https://example.com',
        },
      ],
    });

    expect(state).toEqual(expect.objectContaining({
      situationId: 'sit-1',
      userModelId: 'foreign-policy-analyst',
      generatedAt: '2026-05-12T12:00:00.000Z',
    }));
    expect(state?.moves).toHaveLength(1);
    expect(state?.moves[0]).toEqual(expect.objectContaining({
      id: 'memo-drafter',
      status: 'open',
      source: 'user-core-situation-core',
    }));
  });

  it('builds stable Firestore-safe document ids', () => {
    expect(nextMovesDocId('sit/1', 'model:2')).toBe('sit_1__model_2');
  });

  it('updates one persisted next move status without changing the rest', () => {
    const state = sanitizeWorkspaceNextMoves({
      situationId: 'sit-1',
      userModelId: 'foreign-policy-analyst',
      now: '2026-05-12T12:00:00.000Z',
      moves: [
        { id: 'research', label: 'Research', detail: 'Pull fresh evidence.', href: '/app?panel=advanced' },
        { id: 'memo', label: 'Memo', detail: 'Draft the memo.', href: '/app?panel=memo' },
      ],
    });

    const updated = updateNextMoveStatus(state!, 'memo', 'done', '2026-05-12T12:05:00.000Z');

    expect(updated?.updatedAt).toBe('2026-05-12T12:05:00.000Z');
    expect(updated?.moves.map((move) => [move.id, move.status])).toEqual([
      ['research', 'open'],
      ['memo', 'done'],
    ]);
  });

  it('rejects invalid next move statuses', () => {
    expect(sanitizeNextMoveStatus('done')).toBe('done');
    expect(sanitizeNextMoveStatus('blocked')).toBeNull();
  });

  it('merges Ask-derived moves without wiping existing dashboard queue state', () => {
    const previous = sanitizeWorkspaceNextMoves({
      situationId: 'sit-1',
      userModelId: 'foreign-policy-analyst',
      now: '2026-05-12T12:00:00.000Z',
      moves: [
        { id: 'research', label: 'Research', detail: 'Pull fresh evidence.', href: '/app?panel=advanced', status: 'done' },
        { id: 'memo', label: 'Memo', detail: 'Draft the memo.', href: '/app?panel=memo' },
      ],
    });
    const next = sanitizeWorkspaceNextMoves({
      situationId: 'sit-1',
      userModelId: 'foreign-policy-analyst',
      now: '2026-05-12T12:10:00.000Z',
      moves: [
        { id: 'ask-follow-up', label: 'Ask follow-up', detail: 'Check the open question.', href: '/app?panel=ask' },
      ],
    });

    const merged = mergeWorkspaceNextMoves(previous, next!);

    expect(merged.generatedAt).toBe('2026-05-12T12:00:00.000Z');
    expect(merged.moves.map((move) => [move.id, move.status])).toEqual([
      ['ask-follow-up', 'open'],
      ['research', 'done'],
      ['memo', 'open'],
    ]);
  });
});
