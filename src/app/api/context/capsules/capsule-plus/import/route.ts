import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';

export const dynamic = 'force-dynamic';

// Capsule+ has a distinct graph/proposal contract. Keep it unavailable until all
// rows and the review can be retained in a single owner-checked transaction.
export const POST = withAuth(async (_request, user) => {
  if (user.isDemo) return NextResponse.json({ error: 'Sample mode cannot import private Capsule+ bundles' }, { status: 403 });
  return NextResponse.json({ code: 'CAPSULE_PLUS_IMPORT_UNAVAILABLE',
    error: 'Capsule+ import is temporarily unavailable pending atomic proposal-retention validation. Local preview and export remain available.' }, { status: 503 });
});
