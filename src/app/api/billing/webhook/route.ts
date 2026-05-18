import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks';
import { NextResponse } from 'next/server';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import {
  applyPolarSubscriptionPatch,
  polarSubscriptionPatchFromEvent,
  polarWebhookIdFromHeaders,
} from '@/lib/billing/polar-webhook';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Polar webhook is not configured' }, { status: 503 });
  }

  const body = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(body, headers, secret);
  } catch (error) {
    const status = error instanceof WebhookVerificationError ? 401 : 400;
    return NextResponse.json({ error: 'Invalid Polar webhook' }, { status });
  }

  const webhookId = polarWebhookIdFromHeaders(headers) ?? `${event.type}:${event.timestamp.toISOString()}`;
  const patch = polarSubscriptionPatchFromEvent(event);
  if (!patch) {
    return NextResponse.json({ ok: true, ignored: true, eventType: event.type });
  }

  const result = await applyPolarSubscriptionPatch(getAdminDbOrThrow(), patch, webhookId);
  return NextResponse.json({ ok: true, result, uid: patch.uid, subscription: patch.subscription, status: patch.subscriptionStatus });
}
