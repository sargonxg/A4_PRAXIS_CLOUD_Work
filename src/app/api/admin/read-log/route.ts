import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { isAdminPrincipal } from '@/lib/auth/admin-gate';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import type { ReadAuditEvent } from '@/lib/audit/read-ledger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, user) => {
  if (!isAdminPrincipal(user)) {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters = {
    uid: clean(url.searchParams.get('uid')),
    situationId: clean(url.searchParams.get('situationId')),
    toolId: clean(url.searchParams.get('toolId')),
    from: clean(url.searchParams.get('from')),
    to: clean(url.searchParams.get('to')),
  };
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 100), 1), 250);
  const db = getAdminDbOrThrow();
  const snap = filters.uid
    ? await db.collection('users').doc(filters.uid).collection('audit').orderBy('createdAt', 'desc').limit(limit * 2).get()
    : await db.collectionGroup('audit').orderBy('createdAt', 'desc').limit(limit * 2).get();

  const events = snap.docs
    .map((doc) => ({ eventId: doc.id, ...doc.data() }) as ReadAuditEvent)
    .filter((event) => matches(event, filters))
    .slice(0, limit);

  return NextResponse.json({ events, filters, limit });
});

function matches(event: ReadAuditEvent, filters: {
  uid?: string;
  situationId?: string;
  toolId?: string;
  from?: string;
  to?: string;
}) {
  if (filters.uid && event.uid !== filters.uid) return false;
  if (filters.situationId && event.situationId !== filters.situationId) return false;
  if (filters.toolId && event.toolId !== filters.toolId) return false;
  if (filters.from && event.createdAt < filters.from) return false;
  if (filters.to && event.createdAt > filters.to) return false;
  return true;
}

function clean(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}
