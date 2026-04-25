import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

interface PatchPayload {
  read?: boolean;
  archived?: boolean;
}

export const PATCH = withAuth(async (req, user, { params }: { params: { id: string } }) => {
  const id = params.id;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  let body: PatchPayload = {};
  try { body = await req.json() as PatchPayload; } catch { /* empty body OK */ }

  const update: Record<string, unknown> = {};
  if (body.read === true) {
    update.read = true;
    update.readAt = Timestamp.now();
  }
  if (body.archived === true) update.archived = true;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'no-op' }, { status: 400 });
  }

  const db = getAdminDbOrThrow();
  await db.collection('users').doc(user.uid)
    .collection('notifications').doc(id)
    .update(update);

  return NextResponse.json({ ok: true });
});
