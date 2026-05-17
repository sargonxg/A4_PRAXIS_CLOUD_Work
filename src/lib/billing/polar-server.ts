import { Polar } from '@polar-sh/sdk';
import type { SubscriptionTier } from '@/lib/api/tier';

export type BillablePlan = Extract<SubscriptionTier, 'analyst' | 'team'>;

export function polarProductIdForPlan(plan: string | null | undefined): string | null {
  if (plan === 'analyst') return process.env.POLAR_PRODUCT_ANALYST ?? null;
  if (plan === 'team') return process.env.POLAR_PRODUCT_TEAM ?? null;
  return null;
}

export function isPolarBillingConfigured(plan?: string | null): boolean {
  if (!process.env.POLAR_ACCESS_TOKEN) return false;
  if (plan) return Boolean(polarProductIdForPlan(plan));
  return Boolean(process.env.POLAR_PRODUCT_ANALYST || process.env.POLAR_PRODUCT_TEAM);
}

export function createPolarClient(): Polar {
  return new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    server: process.env.POLAR_SERVER === 'sandbox' ? 'sandbox' : 'production',
  });
}
