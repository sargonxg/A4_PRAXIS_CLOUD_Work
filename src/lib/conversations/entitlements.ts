import type { SubscriptionTier } from '@/lib/api/tier';
import {
  PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE,
  isUnlimitedUsagePrincipal,
  type UsagePrincipal,
} from '@/lib/billing/usage-policy';

export type AppliedConversationCapsule = {
  id: string;
  label: string;
  role: 'user' | 'situation' | 'tool' | 'output';
};

export type MonthlyConversationGateReason =
  | 'unlimited_admin'
  | 'paid_plan'
  | 'free_allowance_available'
  | 'existing_conversation'
  | 'monthly_free_limit';

export type MonthlyConversationGateResult = {
  allowed: boolean;
  reason: MonthlyConversationGateReason;
  remaining: number;
};

const CAPSULE_ROLES = new Set(['user', 'situation', 'tool', 'output']);

export function monthlyFreeUsageSummary(used: number, allowance = PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE) {
  const normalizedAllowance = Math.max(0, Math.floor(allowance));
  const normalizedUsed = Math.max(0, Math.floor(used));
  return {
    allowance: normalizedAllowance,
    used: normalizedUsed,
    remaining: Math.max(0, normalizedAllowance - normalizedUsed),
  };
}

export function canStartConversationThisMonth(input: {
  tier: SubscriptionTier;
  creditsUsed: number;
  requestedCredits: number;
  allowance?: number;
  existingTurnCount: number;
  user?: UsagePrincipal | null;
}): MonthlyConversationGateResult {
  const summary = monthlyFreeUsageSummary(input.creditsUsed, input.allowance);
  if (isUnlimitedUsagePrincipal(input.user)) {
    return { allowed: true, reason: 'unlimited_admin', remaining: Number.POSITIVE_INFINITY };
  }
  if (input.tier !== 'free') {
    return { allowed: true, reason: 'paid_plan', remaining: summary.remaining };
  }
  if (input.existingTurnCount > 0) {
    return { allowed: true, reason: 'existing_conversation', remaining: summary.remaining };
  }
  if (summary.remaining > 0) {
    const requestedCredits = Math.max(1, Math.floor(input.requestedCredits));
    if (summary.remaining >= requestedCredits) {
      return { allowed: true, reason: 'free_allowance_available', remaining: summary.remaining - requestedCredits };
    }
  }
  return { allowed: false, reason: 'monthly_free_limit', remaining: 0 };
}

export const weeklyFreeUsageSummary = monthlyFreeUsageSummary;
export const canStartConversationThisWeek = (input: {
  tier: SubscriptionTier;
  used: number;
  allowance?: number;
  existingTurnCount: number;
}): MonthlyConversationGateResult => canStartConversationThisMonth({
  tier: input.tier,
  creditsUsed: input.used,
  requestedCredits: 1,
  allowance: input.allowance,
  existingTurnCount: input.existingTurnCount,
});

export function normalizeAppliedCapsules(input: unknown): AppliedConversationCapsule[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const candidate = item as Record<string, unknown>;
      const id = typeof candidate.id === 'string' ? candidate.id.trim().slice(0, 160) : '';
      const label = typeof candidate.label === 'string' ? candidate.label.trim().slice(0, 200) : id;
      const role = typeof candidate.role === 'string' ? candidate.role : '';
      if (!id || !label || !CAPSULE_ROLES.has(role)) return null;
      return { id, label, role: role as AppliedConversationCapsule['role'] };
    })
    .filter((item): item is AppliedConversationCapsule => Boolean(item))
    .filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 8);
}
