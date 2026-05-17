import type { SubscriptionTier } from '@/lib/api/tier';

export type AppliedConversationCapsule = {
  id: string;
  label: string;
  role: 'user' | 'situation' | 'tool' | 'output';
};

export type WeeklyConversationGateReason =
  | 'paid_plan'
  | 'free_allowance_available'
  | 'existing_conversation'
  | 'weekly_free_limit';

export type WeeklyConversationGateResult = {
  allowed: boolean;
  reason: WeeklyConversationGateReason;
  remaining: number;
};

const CAPSULE_ROLES = new Set(['user', 'situation', 'tool', 'output']);

export function weeklyFreeUsageSummary(used: number, allowance = 1) {
  const normalizedAllowance = Math.max(0, Math.floor(allowance));
  const normalizedUsed = Math.max(0, Math.floor(used));
  return {
    allowance: normalizedAllowance,
    used: normalizedUsed,
    remaining: Math.max(0, normalizedAllowance - normalizedUsed),
  };
}

export function canStartConversationThisWeek(input: {
  tier: SubscriptionTier;
  used: number;
  allowance?: number;
  existingTurnCount: number;
}): WeeklyConversationGateResult {
  const summary = weeklyFreeUsageSummary(input.used, input.allowance ?? 1);
  if (input.tier !== 'free') {
    return { allowed: true, reason: 'paid_plan', remaining: summary.remaining };
  }
  if (input.existingTurnCount > 0) {
    return { allowed: true, reason: 'existing_conversation', remaining: summary.remaining };
  }
  if (summary.remaining > 0) {
    return { allowed: true, reason: 'free_allowance_available', remaining: summary.remaining };
  }
  return { allowed: false, reason: 'weekly_free_limit', remaining: 0 };
}

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
