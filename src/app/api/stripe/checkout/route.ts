import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';

const STRIPE_PRICE_IDS: Record<string, string> = {
  analyst: process.env.STRIPE_PRICE_ANALYST || '',
  team: process.env.STRIPE_PRICE_TEAM || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
  credits_100: process.env.STRIPE_PRICE_CREDITS_100 || '',
};

export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ error: 'Payment requires a real account' }, { status: 403 });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: 'Payment system not configured yet. Coming soon!' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const tierId = body.tierId ?? body.planId;
    const priceId = STRIPE_PRICE_IDS[tierId];

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // Dynamic import to avoid build errors when stripe is not installed
    const stripe = new (await import('stripe')).default(stripeKey);

    const session = await stripe.checkout.sessions.create({
      mode: tierId === 'credits_100' ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://praxis.tacitus.me'}/app/settings?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://praxis.tacitus.me'}/pricing?payment=cancelled`,
      client_reference_id: user.uid,
      customer_email: user.email,
      metadata: { uid: user.uid, tierId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[stripe] Checkout failed:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
});
