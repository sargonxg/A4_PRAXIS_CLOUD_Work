import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const AppliedCapsuleSchema = z.object({
  id: z.string().min(1).max(160),
  label: z.string().min(1).max(200),
  role: z.enum(['user', 'situation', 'tool', 'output']),
});

const UpsertConversationSchema = z.object({
  conversationId: z.string().min(3).max(96).regex(/^[a-zA-Z0-9_-]+$/),
  capsuleId: z.string().min(1).max(160).default('default'),
  title: z.string().min(1).max(160).optional(),
  appliedCapsules: z.array(AppliedCapsuleSchema).max(8).default([]),
});

export const GET = withAuth(async (_request, user) => {
  if (user.isDemo) return NextResponse.json({ conversations: [], persisted: false });

  const db = getAdminDbOrThrow();
  const snapshot = await db
    .collection('users').doc(user.uid)
    .collection('conversations')
    .orderBy('updatedAt', 'desc')
    .limit(30)
    .get();

  return NextResponse.json({
    persisted: true,
    conversations: snapshot.docs.map((doc) => ({ conversationId: doc.id, ...doc.data() })),
  });
});

export const POST = withAuth(async (request, user) => {
  if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot persist conversations' }, { status: 403 });

  const raw = await request.json().catch(() => ({}));
  const parsed = UpsertConversationSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid conversation request', details: parsed.error.flatten() }, { status: 400 });
  }

  const db = getAdminDbOrThrow();
  const ref = db
    .collection('users').doc(user.uid)
    .collection('conversations').doc(parsed.data.conversationId);

  const now = new Date().toISOString();
  await ref.set({
    conversationId: parsed.data.conversationId,
    capsuleId: parsed.data.capsuleId,
    appliedCapsules: parsed.data.appliedCapsules,
    title: parsed.data.title ?? 'New PRAXIS conversation',
    status: 'draft',
    visibility: 'private',
    turnCount: FieldValue.increment(0),
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  return NextResponse.json({
    conversationId: parsed.data.conversationId,
    href: `/app/conversations/${encodeURIComponent(parsed.data.conversationId)}?capsuleId=${encodeURIComponent(parsed.data.capsuleId)}`,
  }, { status: 201 });
});
