import { NextResponse } from 'next/server';
import {
  publishProfileEvent,
  refreshProfileEmbedding,
  type ProfileEvent,
} from '@/lib/firebase/profile-events';
import { decodePubSubJsonEnvelope } from '@/lib/events/pubsub';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = verifyPubSubPushAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const decoded = decodePubSubJsonEnvelope<ProfileEvent>(await request.json().catch(() => null));
  if (!decoded.ok) {
    return NextResponse.json({ error: decoded.error }, { status: 400 });
  }

  const event = decoded.payload;
  if (!event.uid || !event.kind) {
    return NextResponse.json({ error: 'Profile event requires uid and kind' }, { status: 400 });
  }

  if (event.kind === 'embedding_refreshed') {
    return NextResponse.json({ handled: true, skipped: true, reason: 'embedding_refreshed is terminal' });
  }

  const refreshed = await refreshProfileEmbedding(event.uid);
  if (refreshed) {
    void publishProfileEvent({
      uid: event.uid,
      kind: 'embedding_refreshed',
      versionId: event.versionId,
      extra: { sourceMessageId: decoded.messageId ?? '' },
    });
  }

  return NextResponse.json({
    handled: true,
    refreshed,
    messageId: decoded.messageId,
    kind: event.kind,
  });
}

function verifyPubSubPushAuth(request: Request): {
  ok: true;
} | {
  ok: false;
  error: string;
  status: number;
} {
  const secret = process.env.PUBSUB_PUSH_SHARED_SECRET;
  if (!secret && process.env.NODE_ENV !== 'production') return { ok: true };
  if (!secret) {
    return { ok: false, error: 'Pub/Sub push secret is not configured', status: 503 };
  }

  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const explicit = request.headers.get('x-praxis-pubsub-secret')?.trim();
  if (bearer === secret || explicit === secret) return { ok: true };
  return { ok: false, error: 'Unauthorized Pub/Sub push request', status: 401 };
}
