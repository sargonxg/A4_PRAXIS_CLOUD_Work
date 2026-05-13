import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';
import {
  DEFAULT_CONTEXT_STACK_ID,
  defaultActiveContextStack,
  sanitizeActiveContextStack,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';

function docRef(uid: string, stackId = DEFAULT_CONTEXT_STACK_ID) {
  return adminDb.collection('users').doc(uid).collection('contextStacks').doc(stackId);
}

export const GET = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ stack: defaultActiveContextStack(), persisted: false });
  }

  const url = new URL(req.url);
  const stackId = url.searchParams.get('stackId') ?? DEFAULT_CONTEXT_STACK_ID;
  const snap = await docRef(user.uid, stackId).get();
  return NextResponse.json({
    stack: snap.exists ? (snap.data() as ActiveContextStackState) : defaultActiveContextStack(),
    persisted: snap.exists,
  });
});

export const PUT = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ stack: defaultActiveContextStack(), persisted: false });
  }

  const body = await req.json().catch(() => null);
  const incoming = body && typeof body === 'object' && !Array.isArray(body) ? body as Partial<ActiveContextStackState> : {};
  const currentSnap = await docRef(user.uid, typeof incoming.stackId === 'string' ? incoming.stackId : DEFAULT_CONTEXT_STACK_ID).get();
  const current = currentSnap.exists ? currentSnap.data() as ActiveContextStackState : defaultActiveContextStack();
  const stack = sanitizeActiveContextStack({
    ...current,
    ...incoming,
    evidenceGaps: incoming.evidenceGaps ?? current.evidenceGaps,
    canvasLayout: incoming.canvasLayout ?? current.canvasLayout,
  });
  await docRef(user.uid, stack.stackId).set(stack, { merge: true });
  return NextResponse.json({ stack, persisted: true });
});
