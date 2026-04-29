import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getSituationIntelligence, getConflictProfile } from '@/lib/data-feeds/feed-aggregator';

export const maxDuration = 60;

// 15-minute in-memory cache
interface CacheEntry { data: unknown; ts: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000;

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    return NextResponse.json({
      events: [],
      totalCount: 0,
      sources: { event_feed: 0, gdelt: 0, ucdp: 0, reliefweb: 0, unnews: 0, grounded_search: 0 },
      fetchedAt: new Date().toISOString(),
    });
  }

  try {
    const body = await req.json() as {
      country?: string;
      query?: string;
      dateStart?: string;
      limit?: number;
      profile?: boolean;
      actors?: string[];
      region?: string;
      forceGrounded?: boolean;
    };
    const { country, query, dateStart, limit, profile, actors, region, forceGrounded } = body;

    if (!country) {
      return NextResponse.json({ error: 'Country required' }, { status: 400 });
    }

    // Manual "Use AI Search" trigger — skip structured feeds and go straight to
    // Gemini + Google Search. Bypasses the 15-min cache so user gets fresh hits.
    if (forceGrounded) {
      const { getGroundedSearchEvents } = await import('@/lib/data-feeds/grounded-search-client');
      const { groundedToIntel } = await import('@/lib/data-feeds/feed-aggregator');
      const grounded = await getGroundedSearchEvents({
        query: query ?? country,
        country,
        limit: limit ?? 10,
      });
      const events = grounded.map(groundedToIntel);
      return NextResponse.json({
        events,
        totalCount: events.length,
        sources: { event_feed: 0, gdelt: 0, ucdp: 0, reliefweb: 0, unnews: 0, grounded_search: grounded.length },
        fallbackUsed: grounded.length > 0,
        fetchedAt: new Date().toISOString(),
      });
    }

    const cacheKey = `${user.uid}:${country}:${query ?? ''}:${profile ? 'profile' : 'intel'}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    let result: unknown;
    if (profile) {
      result = await getConflictProfile({
        country,
        query,
        dateStart,
        limit,
        situation: actors || region ? { actors: actors ?? [], region: region ?? '' } : undefined,
      });
    } else {
      result = await getSituationIntelligence({ country, query, dateStart, limit });
    }

    cache.set(cacheKey, { data: result, ts: Date.now() });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[intelligence] Failed:', err);
    return NextResponse.json({ error: 'Intelligence fetch failed' }, { status: 500 });
  }
});
