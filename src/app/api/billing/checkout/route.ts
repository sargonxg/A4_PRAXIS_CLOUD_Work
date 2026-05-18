import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { createPolarClient, isPolarBillingConfigured, polarProductIdForPlan } from '@/lib/billing/polar-server';

export const dynamic = 'force-dynamic';

const CheckoutSchema = z.object({
  plan: z.enum(['analyst', 'team']).default('analyst'),
});

export const POST = withAuth(async (request, user) => {
  const raw = await request.json().catch(() => ({}));
  const parsed = CheckoutSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid checkout request', details: parsed.error.flatten() }, { status: 400 });
  }

  const productId = polarProductIdForPlan(parsed.data.plan);
  if (!productId || !isPolarBillingConfigured(parsed.data.plan)) {
    return NextResponse.json({
      error: 'Billing is not configured',
      configured: false,
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

  return NextResponse.json({ url: checkout.url, configured: true });
});
