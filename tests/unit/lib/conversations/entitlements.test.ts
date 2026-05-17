import { describe, expect, it } from 'vitest';

import {
  canStartConversationThisWeek,
  normalizeAppliedCapsules,
  weeklyFreeUsageSummary,
} from '@/lib/conversations/entitlements';

describe('conversation entitlements', () => {
  it('allows paid users to start new saved conversations regardless of free usage', () => {
    expect(canStartConversationThisWeek({ tier: 'analyst', used: 99, allowance: 1, existingTurnCount: 0 })).toEqual({
      allowed: true,
      reason: 'paid_plan',
      remaining: 0,
    });
  });

  it('blocks a second free weekly conversation but allows continuing an existing one', () => {
    expect(canStartConversationThisWeek({ tier: 'free', used: 1, allowance: 1, existingTurnCount: 0 })).toEqual({
      allowed: false,
      reason: 'weekly_free_limit',
      remaining: 0,
    });
    expect(canStartConversationThisWeek({ tier: 'free', used: 1, allowance: 1, existingTurnCount: 3 })).toEqual({
      allowed: true,
      reason: 'existing_conversation',
      remaining: 0,
    });
  });

  it('normalizes weekly usage and applied capsule snapshots for receipts', () => {
    expect(weeklyFreeUsageSummary(4, 1)).toMatchObject({ allowance: 1, used: 4, remaining: 0 });
    expect(normalizeAppliedCapsules([
      { id: 'capsule-1', label: 'Situation', role: 'situation', ignored: true },
      { id: 'capsule-2', label: 'Tool', role: 'tool' },
      { id: 'bad', label: 'Bad', role: 'unknown' },
    ])).toEqual([
      { id: 'capsule-1', label: 'Situation', role: 'situation' },
      { id: 'capsule-2', label: 'Tool', role: 'tool' },
    ]);
  });
});
