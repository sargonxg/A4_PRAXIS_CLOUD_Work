export type UsageReservationFailure =
  | 'insufficient'
  | 'situation-cap'
  | 'account-missing'
  | 'account-deleting'
  | 'invalid-policy';
export type FundedUsageDecision =
  | { allowed: true; remainingCredits: number; situationCreditsUsed: number | null }
  | { allowed: false; reason: UsageReservationFailure; remainingCredits: number };

/** Evaluate a funded account and optional workspace cap from one transaction snapshot. */
export function decideFundedUsage(input: {
  account: Record<string, unknown> | null;
  situation?: Record<string, unknown> | null;
  cost: number;
  monthKey: string;
}): FundedUsageDecision {
  const account = input.account;
  if (!account) return { allowed: false, reason: 'account-missing', remainingCredits: 0 };
  if (account.accountDeletionStatus === 'deleting' || account.accountDeletionStatus === 'deleted') {
    return { allowed: false, reason: 'account-deleting', remainingCredits: 0 };
  }
  const credits = finiteNonnegative(account.credits);
  if (!Number.isFinite(input.cost) || !Number.isInteger(input.cost) || input.cost <= 0) {
    return { allowed: false, reason: 'invalid-policy', remainingCredits: credits };
  }
  if (credits < input.cost) return { allowed: false, reason: 'insufficient', remainingCredits: credits };

  const situation = input.situation;
  if (!situation) return { allowed: true, remainingCredits: credits - input.cost, situationCreditsUsed: null };
  const rawCap = situation.monthlyCreditCap;
  if (invalidOptionalCounter(rawCap)) return { allowed: false, reason: 'invalid-policy', remainingCredits: credits };
  const rawUsed = situation.monthlyCreditsUsed;
  if (invalidOptionalCounter(rawUsed)) return { allowed: false, reason: 'invalid-policy', remainingCredits: credits };
  const cap = typeof rawCap === 'number' ? Math.floor(rawCap) : null;
  // Adopt legacy counters without resetting them. A recorded previous month
  // can reset at its actual calendar boundary; the funded account never refills here.
  const previousMonth = situation.monthlyCreditMonthKey;
  const earlierRecordedMonth = typeof previousMonth === 'string'
    && /^\d{4}-(0[1-9]|1[0-2])$/.test(previousMonth)
    && previousMonth < input.monthKey;
  const used = earlierRecordedMonth ? 0 : finiteNonnegative(rawUsed);
  if (cap !== null && used + input.cost > cap) return { allowed: false, reason: 'situation-cap', remainingCredits: credits };
  return { allowed: true, remainingCredits: credits - input.cost, situationCreditsUsed: used + input.cost };
}

function invalidOptionalCounter(value: unknown): boolean {
  return value !== undefined && value !== null
    && (typeof value !== 'number' || !Number.isFinite(value) || value < 0);
}

function finiteNonnegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}
