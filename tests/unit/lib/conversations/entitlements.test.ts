import { describe, expect, it } from 'vitest';

import {
  canStartConversationThisMonth,
  normalizeAppliedCapsules,
  monthlyFreeUsageSummary,
} from '@/lib/conversations/entitlements';
import { PRAXIS_ASK_TOKEN_COST, PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE } from '@/lib/billing/usage-policy';

describe('conversation entitlements', () => {
  it('allows paid users to start new saved conversations regardless of free usage', () => {
    expect(canStartConversationThisMonth({
      tier: 'analyst',
      creditsUsed: PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE,
      requestedCredits: PRAXIS_ASK_TOKEN_COST,
      existingTurnCount: 0,
    })).toEqual({
      allowed: true,
      reason: 'paid_plan',
      remaining: 0,
    });
  });

  it('allows free users under the monthly PRAXIS credit allowance to start conversations', () => {
    expect(canStartConversationThisMonth({
      tier: 'free',
      creditsUsed: PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE - PRAXIS_ASK_TOKEN_COST,
      requestedCredits: PRAXIS_ASK_TOKEN_COST,
      existingTurnCount: 0,
    })).toEqual({
      allowed: true,
      reason: 'free_allowance_available',
      remaining: 0,
    });
  });

  it('blocks free users over monthly PRAXIS credits but allows continuing an existing conversation', () => {
    expect(canStartConversationThisMonth({
      tier: 'free',
      creditsUsed: PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE,
      requestedCredits: PRAXIS_ASK_TOKEN_COST,
      existingTurnCount: 0,
    })).toEqual({
      allowed: false,
      reason: 'monthly_free_limit',
      remaining: 0,
    });
    expect(canStartConversationThisMonth({
      tier: 'free',
      creditsUsed: PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE,
      requestedCredits: PRAXIS_ASK_TOKEN_COST,
      existingTurnCount: 3,
    })).toEqual({
      allowed: true,
      reason: 'existing_conversation',
      remaining: 0,
    });
  });

  it('allows verified unlimited admins regardless of monthly usage', () => {
    expect(canStartConversationThisMonth({
      tier: 'free',
      creditsUsed: 999_999,
      requestedCredits: PRAXIS_ASK_TOKEN_COST,
      existingTurnCount: 0,
      user: { email: 'giulio@tacitus.me', emailVerified: true },
    })).toEqual({
      allowed: true,
      reason: 'unlimited_admin',
      remaining: Number.POSITIVE_INFINITY,
    });
    expect(canStartConversationThisMonth({
      tier: 'free',
      creditsUsed: 999_999,
      requestedCredits: PRAXIS_ASK_TOKEN_COST,
      existingTurnCount: 0,
      user: { email: 'giuliocatanzariti@gmail.com', emailVerified: true },
    }).allowed).toBe(true);
  });

  it('normalizes monthly usage and applied capsule snapshots for receipts', () => {
    expect(monthlyFreeUsageSummary(4, PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE)).toMatchObject({
      allowance: PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE,
      used: 4,
      remaining: PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE - 4,
    });
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
