import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const PATH = (uid: string) => `users/${uid}/profile/onboarding_draft`;

export const GET = withAuth(async (_req, user) => {
  try {
    const snap = await adminDb.doc(PATH(user.uid)).get();
    return NextResponse.json(snap.exists ? snap.data() : null);
  } catch (err) {
    console.warn('[onboarding/draft] GET failed:', err);
    return NextResponse.json(null);
  }
});

export const PATCH = withAuth(async (req, user) => {
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'invalid body' }, { status: 400 });
    }
    await adminDb.doc(PATH(user.uid)).set(
      { ...body, updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn('[onboarding/draft] PATCH failed:', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (_req, user) => {
  try {
    await adminDb.doc(PATH(user.uid)).delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn('[onboarding/draft] DELETE failed:', err);
    return NextResponse.json({ ok: true });
  }
});
