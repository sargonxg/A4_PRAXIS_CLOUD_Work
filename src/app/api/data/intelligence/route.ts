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
      sources: { acled: 0, gdelt: 0, reliefweb: 0, unnews: 0 },
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
    };
    const { country, query, dateStart, limit, profile, actors, region } = body;

    if (!country) {
      return NextResponse.json({ error: 'Country required' }, { status: 400 });
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
