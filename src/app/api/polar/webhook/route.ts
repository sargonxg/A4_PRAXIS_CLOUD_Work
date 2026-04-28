import { NextResponse } from 'next/server';
import { Webhooks } from '@polar-sh/nextjs';
import {
  applyPolarSubscription,
  downgradePolarCustomer,
  tierFromMetadata,
  tierFromPolarProduct,
} from '@/lib/billing/polar';

type PolarSubscriptionPayload = {
  type: string;
  data: {
    id: string;
    status?: string;
    productId?: string;
    customerId?: string;
    checkoutId?: string | null;
    trialEnd?: Date | string | null;
    currentPeriodEnd?: Date | string | null;
    metadata?: Record<string, unknown>;
    customer?: {
      id?: string;
      externalId?: string | null;
    };
  };
};

type PolarOrderPayload = {
  type: string;
  data: {
    id: string;
    productId?: string | null;
    checkoutId?: string | null;
    subscriptionId?: string | null;
    metadata?: Record<string, unknown>;
    customerId?: string;
    customer?: {
      id?: string;
      externalId?: string | null;
    };
    subscription?: {
      id?: string;
      status?: string;
      trialEnd?: Date | string | null;
      currentPeriodEnd?: Date | string | null;
    } | null;
  };
};

function eventId(payload: { type: string; data: { id?: string } }): string {
  return `${payload.type}:${payload.data.id ?? crypto.randomUUID()}`;
}

async function isEventProcessed(id: string): Promise<boolean> {
  const { adminDb } = await import('@/lib/firebase/admin');
  if (!adminDb) return false;
  const doc = await adminDb.collection('polar_processed_events').doc(id).get();
  return doc.exists;
}

async function markEventProcessed(id: string): Promise<void> {
  const { adminDb } = await import('@/lib/firebase/admin');
  if (!adminDb) return;
  await adminDb.collection('polar_processed_events').doc(id).set({
    processedAt: new Date().toISOString(),
  });
}

async function handleSubscription(payload: PolarSubscriptionPayload) {
  const id = eventId(payload);
  if (await isEventProcessed(id)) return;

  const uid = payload.data.customer?.externalId;
  const tier = tierFromMetadata(payload.data.metadata) ?? tierFromPolarProduct(payload.data.productId);
  if (!uid || !tier) {
    await markEventProcessed(id);
    return;
  }

  if (payload.type === 'subscription.revoked') {
    await downgradePolarCustomer({
      polarCustomerId: payload.data.customerId ?? payload.data.customer?.id ?? '',
      eventId: id,
    });
  } else {
    await applyPolarSubscription({
      uid,
      tier,
      status: payload.data.status,
      polarCustomerId: payload.data.customerId ?? payload.data.customer?.id,
      polarSubscriptionId: payload.data.id,
      polarProductId: payload.data.productId,
      trialEndsAt: payload.data.trialEnd,
      currentPeriodEnd: payload.data.currentPeriodEnd,
      checkoutId: payload.data.checkoutId,
      eventId: id,
      grantCredits: payload.type === 'subscription.active' || payload.type === 'subscription.created',
    });
  }

  await markEventProcessed(id);
}

async function handleOrderPaid(payload: PolarOrderPayload) {
  const id = eventId(payload);
  if (await isEventProcessed(id)) return;

  const uid = payload.data.customer?.externalId;
  const tier = tierFromMetadata(payload.data.metadata) ?? tierFromPolarProduct(payload.data.productId);
  if (uid && tier) {
    await applyPolarSubscription({
      uid,
      tier,
      status: payload.data.subscription?.status ?? 'active',
      polarCustomerId: payload.data.customerId ?? payload.data.customer?.id,
      polarSubscriptionId: payload.data.subscriptionId ?? payload.data.subscription?.id,
      polarProductId: payload.data.productId,
      trialEndsAt: payload.data.subscription?.trialEnd,
      currentPeriodEnd: payload.data.subscription?.currentPeriodEnd,
      checkoutId: payload.data.checkoutId,
      eventId: id,
      grantCredits: false,
    });
  }

  await markEventProcessed(id);
}

const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

export const POST = webhookSecret
  ? Webhooks({
      webhookSecret,
      onSubscriptionCreated: handleSubscription,
      onSubscriptionActive: handleSubscription,
      onSubscriptionUpdated: handleSubscription,
      onSubscriptionCanceled: handleSubscription,
      onSubscriptionRevoked: handleSubscription,
      onSubscriptionUncanceled: handleSubscription,
      onOrderPaid: handleOrderPaid,
    })
  : async () => NextResponse.json({ error: 'Polar webhook not configured' }, { status: 503 });
