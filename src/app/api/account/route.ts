/**
 * DELETE /api/account
 *
 * Permanently deletes the authenticated user's account (GDPR Article 17 — Right to Erasure).
 * Removes:
 *  - All situations and their subcollections (cascade)
 *  - Credit transaction history
 *  - User Firestore document
 *  - Firebase Auth user record
 *  - Session cookie
 */

import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { handleRouteError } from '@/lib/api/standard-error';

const SITUATION_SUBCOLLECTIONS = [
  'graph', 'documents', 'reports', 'scenarios', 'chats',
  'tool-data', 'briefings', 'dossiers', 'talking-points',
  'risk-assessments', 'conflict-grammar',
];

const ACCOUNT_PATCH_FIELDS = new Set(['displayName', 'role', 'orgId', 'orgName', 'marketingConsent', 'photoURL']);

// Avatars are stored as small inline data URLs (client downscales to ~96px
// JPEG before save) so no Cloud Storage rules or public bucket is involved.
const MAX_PHOTO_DATA_URL_LENGTH = 160_000;
const PHOTO_DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

function cleanAccountPatch(input: unknown): Record<string, string | boolean> | null {
  if (!input || typeof input !== 'object') return null;
  const patch: Record<string, string | boolean> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!ACCOUNT_PATCH_FIELDS.has(key)) continue;
    if (key === 'marketingConsent') {
      if (typeof value === 'boolean') patch[key] = value;
      continue;
    }
    if (key === 'photoURL') {
      if (value === '') {
        patch[key] = '';
        continue;
      }
      if (typeof value === 'string'
        && value.length <= MAX_PHOTO_DATA_URL_LENGTH
        && PHOTO_DATA_URL_PATTERN.test(value)) {
        patch[key] = value;
      }
      continue;
    }
    if (typeof value === 'string') patch[key] = value.trim().slice(0, 160);
  }
  return patch;
}

function serializeFirestoreData(data: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!data) return {};
  return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
}

async function purgeCollection(
  colRef: FirebaseFirestore.CollectionReference,
  db: FirebaseFirestore.Firestore,
): Promise<void> {
  let snap = await colRef.limit(200).get();
  while (!snap.empty) {
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (snap.size < 200) break;
    snap = await colRef.limit(200).get();
  }
}

export const GET = withAuth(async (_request: Request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({
        uid: user.uid,
        email: user.email,
        displayName: user.name,
        role: 'analyst',
        orgId: 'demo',
        orgName: 'TACITUS demo workspace',
        credits: 0,
        totalCreditsUsed: 0,
        subscription: 'free',
        isDemo: true,
      });
    }

    const db = getAdminDbOrThrow();
    const snap = await db.collection('users').doc(user.uid).get();
    if (!snap.exists) {
      return NextResponse.json({
        uid: user.uid,
        email: user.email,
        displayName: user.name,
        role: 'analyst',
        orgId: 'org-default',
        orgName: '',
        credits: 0,
        totalCreditsUsed: 0,
        subscription: 'free',
        isDemo: false,
      });
    }

    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      ...serializeFirestoreData(snap.data()),
    });
  } catch (err) {
    return handleRouteError(err, 'account-read');
  }
});

export const PATCH = withAuth(async (request: Request, user) => {
  try {
    if (user.isDemo) {
      return NextResponse.json({ ok: true, demo: true });
    }

    const raw = await request.json().catch(() => null);
    const patch = cleanAccountPatch(raw);
    if (!patch || Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No supported account fields provided.' }, { status: 400 });
    }

    const db = getAdminDbOrThrow();
    await db.collection('users').doc(user.uid).set(patch, { merge: true });
    const snap = await db.collection('users').doc(user.uid).get();
    return NextResponse.json({
      ok: true,
      account: {
        uid: user.uid,
        email: user.email,
        ...serializeFirestoreData(snap.data()),
      },
    });
  } catch (err) {
    return handleRouteError(err, 'account-update');
  }
});

export const DELETE = withAuth(async (_request: Request, user) => {
  try {
    // Demo users cannot delete real accounts
    if (user.isDemo) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete a demo account.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const uid = user.uid;
    const db = getAdminDbOrThrow();

    // 1. Cascade-delete all situations and their subcollections
    const situationsSnap = await db.collection('users').doc(uid).collection('situations').get();
    for (const sitDoc of situationsSnap.docs) {
      for (const name of SITUATION_SUBCOLLECTIONS) {
        await purgeCollection(sitDoc.ref.collection(name), db);
      }
      await sitDoc.ref.delete();
    }

    // 2. Delete credit transaction history
    const txSnap = await db.collection('credit_transactions')
      .where('userId', '==', uid)
      .limit(500)
      .get();
    if (!txSnap.empty) {
      const batch = db.batch();
      txSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    // 3. Delete user Firestore document
    await db.collection('users').doc(uid).delete();

    // 4. Delete Firebase Auth user record
    await getAuth().deleteUser(uid);

    // 5. Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete('tacitus-auth-session');

    return new Response(
      JSON.stringify({ success: true, message: 'Account permanently deleted.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return handleRouteError(err, 'account-delete');
  }
});
