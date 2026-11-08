import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getAdminPrincipalAccess } from '@/lib/auth/admin-gate';
import { readCloudflareResearch, ResearchDatasetError } from '@/lib/data-feeds/cloudflare-research';

export const runtime = 'nodejs';

/** Private dataset access stays admin-only until a separate distribution policy is established. */
export const GET = withAuth(async (request, user) => {
  const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
  if (user.isDemo || !getAdminPrincipalAccess(user).admin) {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403, headers });
  }
  try {
    const data = await readCloudflareResearch(new URL(request.url).searchParams);
    return NextResponse.json(data, { headers });
  } catch (error) {
    const known = error instanceof ResearchDatasetError;
    return NextResponse.json({ error: known ? error.message : 'The research connection could not answer this request.',
      code: known ? error.code : 'RESEARCH_FAILURE' }, { status: known ? error.status : 503, headers });
  }
});
