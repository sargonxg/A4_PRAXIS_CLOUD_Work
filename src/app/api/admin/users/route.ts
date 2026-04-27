import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { isAdminPrincipal } from '@/lib/auth/admin-gate';
import { adminAuth, getAdminDbOrThrow } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UserDocSummary {
  credits?: number;
  subscription?: string;
  totalCreditsUsed?: number;
  lastLoginAt?: unknown;
  createdAt?: unknown;
}

export const GET = withAuth(async (request, user) => {
  if (!isAdminPrincipal(user)) {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
  }

  const url = new URL(request.url);
  const maxResults = Math.min(Number(url.searchParams.get('limit') ?? 50), 100);
  const pageToken = url.searchParams.get('pageToken') ?? undefined;

  const db = getAdminDbOrThrow();
  const listed = await adminAuth.listUsers(maxResults, pageToken);

  const docs = await Promise.all(
    listed.users.map(async (record) => {
      const snap = await db.collection('users').doc(record.uid).get().catch(() => null);
      return [record.uid, snap?.exists ? (snap.data() as UserDocSummary) : null] as const;
    }),
  );
  const byUid = new Map(docs);

  return NextResponse.json({
    users: listed.users.map((record) => {
      const doc = byUid.get(record.uid);
      return {
        uid: record.uid,
        email: record.email ?? null,
        displayName: record.displayName ?? null,
        disabled: record.disabled,
        emailVerified: record.emailVerified,
        providerIds: record.providerData.map((provider) => provider.providerId),
        createdAt: record.metadata.creationTime,
        lastSignInAt: record.metadata.lastSignInTime ?? null,
        profile: doc
          ? {
              credits: doc.credits ?? null,
              subscription: doc.subscription ?? null,
              totalCreditsUsed: doc.totalCreditsUsed ?? null,
              lastLoginAt: doc.lastLoginAt ?? null,
              createdAt: doc.createdAt ?? null,
            }
          : null,
      };
    }),
    nextPageToken: listed.pageToken ?? null,
  });
});
