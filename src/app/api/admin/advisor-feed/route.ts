import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuth } from '@/lib/api/with-auth';
import { isAdminPrincipal } from '@/lib/auth/admin-gate';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = new Set(['policy', 'methodology', 'source', 'playbook', 'warning']);

export const GET = withAuth(async () => {
  const db = getAdminDbOrThrow();
  const snap = await db
    .collection('advisor_feed_items')
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return NextResponse.json({
    items: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    fetchedAt: Date.now(),
  });
});

export const POST = withAuth(async (req, user) => {
  if (!isAdminPrincipal(user)) {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as {
    title?: unknown;
    content?: unknown;
    type?: unknown;
    sourceUrl?: unknown;
    tags?: unknown;
  } | null;

  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  const type = typeof body?.type === 'string' ? body.type.trim() : '';
  const sourceUrl = typeof body?.sourceUrl === 'string' ? body.sourceUrl.trim() : '';
  const tags = Array.isArray(body?.tags)
    ? body.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean).slice(0, 12)
    : [];

  if (title.length < 4 || title.length > 160) {
    return NextResponse.json({ error: 'Title must be 4-160 characters' }, { status: 400 });
  }
  if (content.length < 20 || content.length > 12000) {
    return NextResponse.json({ error: 'Content must be 20-12000 characters' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: 'Invalid advisor feed type' }, { status: 400 });
  }

  const db = getAdminDbOrThrow();
  const docRef = db.collection('advisor_feed_items').doc();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  await docRef.set({
    id: docRef.id,
    title,
    content,
    type,
    sourceUrl: sourceUrl || null,
    tags,
    status: 'active',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    expiresAt,
    createdBy: { uid: user.uid, email: user.email },
  });

  await db.collection('audit_logs').doc().set({
    action: 'advisor_feed.create',
    actor: user.email || user.uid,
    actorUid: user.uid,
    target: docRef.id,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt,
    metadata: { title, type, tagCount: tags.length },
  });

  return NextResponse.json({ ok: true, id: docRef.id });
});
