import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { resolveFeedCapabilities } from '@/lib/data-feeds/capabilities';

export const runtime = 'nodejs';
export const maxDuration = 15;

/**
 * GET /api/capabilities
 *
 * Returns the live feed-capability matrix for the authenticated user. Used
 * by the dashboard header, onboarding tier note, and any tool page that
 * wants to render accurate empty-states.
 */
export const GET = withAuth(async (_req, user) => {
  try {
    const matrix = await resolveFeedCapabilities(user.uid);
    return NextResponse.json(matrix);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to resolve capabilities';
    console.error('[capabilities GET]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
});
