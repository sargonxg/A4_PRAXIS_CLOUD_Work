import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  try {
    const stripe = new (await import('stripe')).default(stripeKey);
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const uid = session.metadata?.uid;
        const tierId = session.metadata?.tierId;
        console.log(`[stripe] Checkout completed: uid=${uid}, tier=${tierId}`);

        if (uid) {
          // Update user profile in Firestore with new tier
          try {
            const { adminDb } = await import('@/lib/firebase/admin');
            if (adminDb) {
              const creditAmounts: Record<string, number> = {
                analyst: 1000,
                team: 5000,
                credits_100: 100,
              };
              const credits = creditAmounts[tierId || ''] || 0;
              await adminDb.collection('users').doc(uid).update({
                subscriptionTier: tierId,
                credits: credits,
                subscriptionUpdatedAt: new Date().toISOString(),
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
              });
              console.log(`[stripe] Updated user ${uid}: tier=${tierId}, credits=${credits}`);
            }
          } catch (err) {
            console.error('[stripe] Firestore update failed:', err);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        console.log(`[stripe] Subscription cancelled: customer=${customerId}`);
        // Downgrade to free tier
        try {
          const { adminDb } = await import('@/lib/firebase/admin');
          if (adminDb) {
            const users = await adminDb.collection('users').where('stripeCustomerId', '==', customerId).get();
            for (const doc of users.docs) {
              await doc.ref.update({
                subscriptionTier: 'free',
                credits: 50,
                subscriptionUpdatedAt: new Date().toISOString(),
              });
            }
          }
        } catch (err) {
          console.error('[stripe] Downgrade failed:', err);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe] Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
