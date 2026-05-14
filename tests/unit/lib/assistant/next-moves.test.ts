import { describe, expect, it } from 'vitest';
import { getNextMoves } from '@/lib/assistant/next-moves';

describe('getNextMoves', () => {
  it('returns at most three moves and starts with missing Situation Core', () => {
    const moves = getNextMoves({ situation: null });

    expect(moves).toHaveLength(3);
    expect(moves[0]).toMatchObject({
      id: 'add_situation_core',
      label: 'Add Situation Core',
    });
    expect(moves.map((move) => move.label)).toMatchInlineSnapshot(`
      [
        "Add Situation Core",
        "Add Source Core",
        "Check sources",
      ]
    `);
    expect(moves.every((move) => !('toolId' in move))).toBe(true);
  });

  it('prioritizes memo drafting and source checks when context is ready', () => {
    const moves = getNextMoves({
      situation: {
        id: 'sit-1',
        name: 'Indo-Pacific 2026',
        sourceUrls: ['https://example.test/source'],
        latestEventDate: '2026-05-14',
        workflowPath: 'reporting',
      },
    });

    expect(moves).toHaveLength(3);
    expect(moves.map((move) => move.label)).toMatchInlineSnapshot(`
      [
        "Draft memo",
        "Map situation",
        "Check sources",
      ]
    `);
  });
});
