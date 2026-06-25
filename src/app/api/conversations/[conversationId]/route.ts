import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

type ConversationRouteContext = {
  params: Promise<{ conversationId: string }>;
};

export const GET = withAuth<ConversationRouteContext>(async (_request, user, context) => {
  if (user.isDemo) return NextResponse.json({ conversation: null, turns: [], persisted: false });
  const { conversationId } = await context.params;
  const cleanConversationId = conversationId.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 96);
  if (!cleanConversationId) return NextResponse.json({ error: 'Invalid conversation id' }, { status: 400 });

  const db = getAdminDbOrThrow();
  const conversationRef = db
    .collection('users').doc(user.uid)
    .collection('conversations').doc(cleanConversationId);
  const conversationSnap = await conversationRef.get();
  if (conversationSnap.exists && !recordOwnedBy(conversationSnap.data(), user.uid)) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }
  const turnsSnap = await conversationRef
    .collection('turns')
    .orderBy('createdAt', 'asc')
    .limit(100)
    .get()
    .catch(() => null);

  return NextResponse.json({
    persisted: true,
    conversation: conversationSnap.exists
      ? { conversationId: conversationSnap.id, ...conversationSnap.data(), ownerUid: ownerUidOrPath(conversationSnap.data(), user.uid) }
      : null,
    turns: turnsSnap?.docs
      .filter((doc) => recordOwnedBy(doc.data(), user.uid))
      .map((doc) => ({ turnId: doc.id, ...doc.data(), ownerUid: ownerUidOrPath(doc.data(), user.uid) })) ?? [],
  });
});

function recordOwnedBy(value: Record<string, unknown> | undefined, uid: string): boolean {
  const ownerUid = typeof value?.ownerUid === 'string' && value.ownerUid.trim() ? value.ownerUid.trim() : null;
  return !ownerUid || ownerUid === uid;
}

function ownerUidOrPath(value: Record<string, unknown> | undefined, uid: string): string {
  return typeof value?.ownerUid === 'string' && value.ownerUid.trim() ? value.ownerUid.trim() : uid;
}
