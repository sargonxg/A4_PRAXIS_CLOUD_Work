/**
 * Shared PRAXIS usage constants for server metering and user-facing copy.
 */
export const PRAXIS_ASK_TOKEN_COST = 10;
export const PRAXIS_ASK_CREDIT_COST = PRAXIS_ASK_TOKEN_COST;
export const PRAXIS_STARTER_TOKEN_ALLOWANCE = 1000;
export const PRAXIS_FREE_MONTHLY_CREDIT_ALLOWANCE = 31_000;
export const PRAXIS_UNLIMITED_USAGE_EMAILS = [
  'giulio@tacitus.me',
  'giuliocatanzariti@gmail.com',
] as const;
export const PRAXIS_USAGE_COPY = {
  starterLabel: 'Free tier',
  upgradeLabel: 'Upgrade',
  shortLabel: 'credits',
  askCost: '10 PRAXIS credits per Ask turn',
  starterAllowance: '31,000 monthly PRAXIS credits',
} as const;

export type UsagePrincipal = {
  email?: string | null;
  emailVerified?: boolean | null;
  isDemo?: boolean | null;
};

export function normalizeUsageEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function isUnlimitedUsagePrincipal(user: UsagePrincipal | null | undefined): boolean {
  if (!user || user.isDemo === true) return false;
  if (user.emailVerified !== true) return false;
  return (PRAXIS_UNLIMITED_USAGE_EMAILS as readonly string[]).includes(normalizeUsageEmail(user.email));
}

export function shouldBypassMinuteRateLimit(user: UsagePrincipal | null | undefined): boolean {
  return isUnlimitedUsagePrincipal(user);
}

export function currentMonthlyUsageKey(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function monthlyUsageDocId(monthKey = currentMonthlyUsageKey()): string {
  return `monthly-free-${monthKey}`;
}

export function nextMonthlyReset(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}
