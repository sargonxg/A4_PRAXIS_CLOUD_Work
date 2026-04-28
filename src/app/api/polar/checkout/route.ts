import { NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { withAuth } from '@/lib/api/with-auth';
import { getPolarProductId, getPolarServer, POLAR_ORGANIZATION_ID } from '@/lib/billing/polar';

export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Payment requires a real account' }, { status: 403 });
  }

  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: 'Polar is not configured yet. Add POLAR_ACCESS_TOKEN and product IDs.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const tierId = body.tierId ?? body.planId;
    const productId = getPolarProductId(tierId);

    if (!productId) {
      return NextResponse.json({ error: 'Invalid or unconfigured plan selected' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://praxis.tacitus.me';
    const successUrl = process.env.POLAR_SUCCESS_URL || `${baseUrl}/app/settings?payment=success&provider=polar&checkout_id={CHECKOUT_ID}`;
    const polar = new Polar({ accessToken, server: getPolarServer() });
    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl,
      returnUrl: `${baseUrl}/pricing?payment=cancelled&provider=polar`,
      externalCustomerId: user.uid,
      customerEmail: user.email,
      customerName: user.name,
      allowDiscountCodes: true,
      metadata: {
        uid: user.uid,
        tierId,
        organizationId: POLAR_ORGANIZATION_ID,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error('[polar] Checkout failed:', err);
    return NextResponse.json({ error: 'Failed to create Polar checkout session' }, { status: 500 });
  }
});
