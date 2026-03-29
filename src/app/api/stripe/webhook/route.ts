import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// In-memory set of processed event IDs for idempotency
// In production with multiple instances, use Redis or Firestore
const processedEvents = new Set<string>();
const MAX_PROCESSED = 1000;

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

    // Verify webhook signature cryptographically
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    // Idempotency: skip if we've already processed this event
    if (processedEvents.has(event.id)) {
      console.log(`[stripe] Duplicate event skipped: ${event.id}`);
      return NextResponse.json({ received: true });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const uid = session.metadata?.uid;
        const tierId = session.metadata?.tierId;
        console.log(`[stripe] Checkout completed: uid=${uid}, tier=${tierId}`);

        if (uid && tierId) {
          try {
            const { adminDb } = await import('@/lib/firebase/admin');
            if (adminDb) {
              const creditAmounts: Record<string, number> = {
                analyst: 1000,
                team: 5000,
                credits_100: 100,
              };
              const credits = creditAmounts[tierId] || 0;
              await adminDb.collection('users').doc(uid).update({
                subscription: tierId === 'credits_100' ? undefined : tierId,
                credits: credits,
                subscriptionUpdatedAt: new Date().toISOString(),
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
              });

              // Log the transaction for audit trail
              await adminDb.collection('credit_transactions').add({
                userId: uid,
                amount: credits,
                type: 'subscription',
                description: `${tierId} plan activated via Stripe`,
                stripeEventId: event.id,
                stripeSessionId: session.id,
                createdAt: new Date().toISOString(),
              });

              console.log(`[stripe] Updated user ${uid}: tier=${tierId}, credits=${credits}`);
            }
          } catch (err) {
            console.error('[stripe] Firestore update failed:', err);
            // Return 500 so Stripe retries
            return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        console.log(`[stripe] Subscription cancelled: customer=${customerId}`);
        try {
          const { adminDb } = await import('@/lib/firebase/admin');
          if (adminDb) {
            const users = await adminDb.collection('users').where('stripeCustomerId', '==', customerId).get();
            for (const userDoc of users.docs) {
              await userDoc.ref.update({
                subscription: 'free',
                credits: 100,
                subscriptionUpdatedAt: new Date().toISOString(),
              });
              // Log the downgrade
              await adminDb.collection('credit_transactions').add({
                userId: userDoc.id,
                amount: 100,
                type: 'subscription',
                description: 'Downgraded to free tier (subscription cancelled)',
                stripeEventId: event.id,
                createdAt: new Date().toISOString(),
              });
            }
          }
        } catch (err) {
          console.error('[stripe] Downgrade failed:', err);
          return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
        }
        break;
      }
    }

    // Mark event as processed (idempotency)
    processedEvents.add(event.id);
    // Prevent memory leak — keep only recent events
    if (processedEvents.size > MAX_PROCESSED) {
      const oldest = processedEvents.values().next().value;
      if (oldest) processedEvents.delete(oldest);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[stripe] Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}
