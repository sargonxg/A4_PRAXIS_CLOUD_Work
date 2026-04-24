import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getSituationAdmin } from '@/lib/firebase/situations';
import { getSituationIntelligence, type IntelligenceItem } from '@/lib/data-feeds/feed-aggregator';
import { handleRouteError } from '@/lib/api/standard-error';

type RouteContext = { params: Promise<{ id: string }> };

interface FeedAlert {
  id: string;
  title: string;
  source: string;
  publishedAt: string | null;
  url: string | null;
  salience: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; payload: FeedAlert[] }>();

function salienceOf(item: IntelligenceItem): number {
  if (item.source === 'acled') {
    const fatalities = Number((item.metadata as { fatalities?: number }).fatalities ?? 0);
    return fatalities * 5 + (item.severity === 'critical' ? 10 : 0);
  }
  if (item.source === 'gdelt') {
    const tone = Number((item.metadata as { tone?: number }).tone ?? 0);
    return Math.abs(tone) * 2;
  }
  if (item.source === 'reliefweb' || item.source === 'unnews') {
    return item.severity === 'high' ? 3 : 1;
  }
  return 0.5;
}

function parseWindowHours(raw: string | null): number {
  if (!raw) return 24;
  const match = /^(\d+)h$/i.exec(raw);
  if (match) return Math.max(1, Math.min(168, parseInt(match[1], 10)));
  return 24;
}

export const GET = withAuth<RouteContext>(async (req: Request, user, context) => {
  try {
    const { id: situationId } = await context.params;
    if (!situationId) {
      return NextResponse.json({ error: 'situationId required' }, { status: 400 });
    }

    const url = new URL(req.url);
    const windowHours = parseWindowHours(url.searchParams.get('window'));
    const limit = Math.min(10, Math.max(1, Number(url.searchParams.get('limit') ?? '3') || 3));

    if (user.isDemo) {
      return NextResponse.json({ items: [] });
    }

    const cacheKey = `${user.uid}:${situationId}:${windowHours}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return NextResponse.json({ items: cached.payload, cached: true });
    }

    const situation = await getSituationAdmin(user.uid, situationId);
    if (!situation) {
      return NextResponse.json({ error: 'situation not found' }, { status: 404 });
    }

    const intel = await getSituationIntelligence({
      country: situation.region,
      query: situation.name,
      limit: 50,
    });

    const cutoffMs = Date.now() - windowHours * 60 * 60 * 1000;
    const ranked: FeedAlert[] = intel.events
      .filter((e) => {
        const t = e.date ? new Date(e.date).getTime() : 0;
        return t >= cutoffMs;
      })
      .map((e) => ({
        id: e.id,
        title: e.title,
        source: e.source,
        publishedAt: e.date || null,
        url: e.url ?? null,
        salience: salienceOf(e),
      }))
      .sort((a, b) => b.salience - a.salience)
      .slice(0, limit);

    cache.set(cacheKey, { at: Date.now(), payload: ranked });
    return NextResponse.json({ items: ranked });
  } catch (err) {
    return handleRouteError(err, 'situation-feed-alerts');
  }
});
