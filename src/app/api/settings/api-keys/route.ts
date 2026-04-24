import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { listUserKeyStatuses } from '@/lib/providers/user-keys';
import { PROVIDER_REGISTRY } from '@/lib/providers/registry';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/settings/api-keys
 *
 * Returns the user's per-provider key status plus the public registry spec
 * so the Settings UI can render itself without a second round-trip.
 *
 * Never returns plaintext secrets — only masked previews and non-secret
 * configured fields (e.g. ACLED email).
 */
export const GET = withAuth(async (_req, user) => {
  try {
    const statuses = await listUserKeyStatuses(user.uid);
    return NextResponse.json({ providers: PROVIDER_REGISTRY, statuses });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to list API keys';
    console.error('[api-keys GET]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
