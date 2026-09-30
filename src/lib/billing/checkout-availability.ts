import { isPolarBillingConfigured, polarBillingMode } from '@/lib/billing/polar-server';

export type CheckoutAvailability = {
  analyst: boolean;
  team: false;
  mode: 'sandbox' | 'production' | 'unconfigured';
};

/** Public availability contains no provider credentials or product identifiers. */
export function getCheckoutAvailability(): CheckoutAvailability {
  const analyst = process.env.PRAXIS_ENABLE_PAID_CHECKOUT === 'true'
    && isPolarBillingConfigured('analyst');
  return {
    analyst,
    // Shared workspaces and seats have not passed their own activation gate.
    team: false,
    mode: analyst ? polarBillingMode('analyst') : 'unconfigured',
  };
}
