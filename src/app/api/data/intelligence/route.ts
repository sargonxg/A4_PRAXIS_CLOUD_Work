import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';

export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({ events: [], totalCount: 0, sources: { acled: 0, gdelt: 0, reliefweb: 0 }, fetchedAt: new Date().toISOString() });
  }

  try {
    const { country, query, dateStart, limit } = await req.json();
    if (!country) {
      return NextResponse.json({ error: 'Country required' }, { status: 400 });
    }

    const intelligence = await getSituationIntelligence({ country, query, dateStart, limit });
    return NextResponse.json(intelligence);
  } catch (err) {
    console.error('[intelligence] Failed:', err);
    return NextResponse.json({ error: 'Intelligence fetch failed' }, { status: 500 });
  }
});
