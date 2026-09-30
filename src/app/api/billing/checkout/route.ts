import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { createPolarClient, isPolarBillingConfigured, polarBillingMode, polarProductIdForPlan } from '@/lib/billing/polar-server';
import { getCheckoutAvailability } from '@/lib/billing/checkout-availability';

export const dynamic = 'force-dynamic';

const CheckoutSchema = z.object({
  plan: z.enum(['analyst', 'team']).default('analyst'),
});

export const POST = withAuth(async (request, user) => {
  if (process.env.PRAXIS_ENABLE_PAID_CHECKOUT !== 'true') {
    return NextResponse.json({
      error: 'Paid upgrades are unavailable for this experimental project.',
      available: false,
      fallbackHref: '/pricing',
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const raw = await request.json().catch(() => ({}));
  const parsed = CheckoutSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid checkout request', details: parsed.error.flatten() }, { status: 400 });
  }

  if (!getCheckoutAvailability()[parsed.data.plan]) {
    return NextResponse.json({
      error: parsed.data.plan === 'team' ? 'Team subscriptions are not available.' : 'Practitioner checkout is not available.',
      available: false,
      fallbackHref: '/pricing',
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  const productId = polarProductIdForPlan(parsed.data.plan);
  if (!productId || !isPolarBillingConfigured(parsed.data.plan)) {
    return NextResponse.json({
      error: 'Billing is not configured',
      configured: false,
      mode: polarBillingMode(parsed.data.plan),
      fallbackHref: '/pricing',
    }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const checkout = await createPolarClient().checkouts.create({
    products: [productId],
    externalCustomerId: user.uid,
    customerEmail: user.email,
    customerName: user.name,
    successUrl: `${origin}/app/settings?tab=billing&checkout=success&checkoutId={CHECKOUT_ID}`,
    returnUrl: `${origin}/app/settings?tab=billing&checkout=cancelled`,
    metadata: {
      uid: user.uid,
      plan: parsed.data.plan,
      source: 'praxis-settings',
    },
  });

  return NextResponse.json({ url: checkout.url, configured: true, mode: polarBillingMode(parsed.data.plan) });
});
