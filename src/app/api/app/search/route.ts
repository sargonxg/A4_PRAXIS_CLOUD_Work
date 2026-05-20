import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { normalizeAppSearchQuery, searchApp } from '@/lib/app-search/app-search';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (request, user) => {
  let query;
  try {
    query = normalizeAppSearchQuery(Object.fromEntries(new URL(request.url).searchParams));
  } catch (err) {
    return NextResponse.json({
      error: 'Invalid app search',
      detail: err instanceof Error ? err.message : 'Invalid query parameters',
    }, { status: 400 });
  }

  const response = await searchApp({
    uid: user.uid,
    isDemo: user.isDemo,
    query: query.q,
    types: query.types,
    limit: query.limit,
  });

  return NextResponse.json(response);
});
