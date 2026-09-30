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
import { getAdminDbOrThrow, getAdminStorage, getDefaultBucketName } from '@/lib/firebase/admin';
import { handleRouteError } from '@/lib/api/standard-error';
import { eraseOwnerAccount, OwnerErasureError, pendingExternalErasureStores } from '@/lib/account/owner-erasure';
import { eraseOwnerRuntimeData } from '@/lib/agent-runtime/postgres';
import { eraseOwnerDocumentMirror, isDocumentSqlMirrorConfigured } from '@/lib/agent-runtime/document-postgres';
import { eraseOwnerAskThreadMemory, isAskThreadSqlConfigured } from '@/lib/agent-runtime/ask-thread-postgres';

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

    if (process.env.PRAXIS_ACCOUNT_ERASURE_RULES_VERIFIED !== 'true') {
      return NextResponse.json({ error: 'Account deletion is temporarily unavailable. Contact TACITUS for account cleanup.', code: 'account_erasure_unavailable' }, { status: 503 });
    }
    const report = await eraseOwnerAccount(user.uid, {
      db: getAdminDbOrThrow(),
      bucket: getAdminStorage().bucket(getDefaultBucketName()),
      deleteAuthUser: (uid) => getAuth().deleteUser(uid),
      externalCleanup: [
        { name: 'postgres_runtime', configured: Boolean(process.env.AGENT_RUNTIME_DATABASE_URL || process.env.PRAXIS_DATABASE_URL || process.env.DATABASE_URL), erase: eraseOwnerRuntimeData },
        { name: 'postgres_document_mirror', configured: isDocumentSqlMirrorConfigured(), erase: eraseOwnerDocumentMirror },
        { name: 'postgres_ask_memory', configured: isAskThreadSqlConfigured(), erase: eraseOwnerAskThreadMemory },
      ],
      pendingExternalStores: pendingExternalErasureStores(),
    });
    if (report.status === 'pending') {
      return NextResponse.json({
        success: false, pending: true, report,
        message: 'Account cleanup is in progress. Retry deletion to finish; contact TACITUS if a provider cleanup remains pending.',
      }, { status: 202 });
    }
    const cookieStore = await cookies();
    cookieStore.delete('tacitus-auth-session');
    return NextResponse.json({ success: true, message: 'Account and owned workspace data deleted.', report });
  } catch (err) {
    if (err instanceof OwnerErasureError) {
      return NextResponse.json({ error: err.message, code: err.code, billingPath: '/app/settings?tab=billing' }, { status: 409 });
    }
    return handleRouteError(err, 'account-delete');
  }
});
