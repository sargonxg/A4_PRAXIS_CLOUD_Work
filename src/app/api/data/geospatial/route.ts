import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { getSituationIntelligence } from '@/lib/data-feeds/feed-aggregator';
import type { HotspotCluster } from '@/lib/analytics/geospatial-engine';
import { clusterEvents } from '@/lib/analytics/geospatial-engine';

export const maxDuration = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeospatialEvent {
  id: string;
  date: string;
  type: string;
  subType?: string;
  country: string;
  location: string;
  lat: number;
  lng: number;
  fatalities: number;
  actors: string[];
  description: string;
  source: 'event_feed' | 'gdelt' | 'manual';
}

export interface GeospatialResponse {
  events: GeospatialEvent[];
  hotspots: HotspotCluster[];
  fetchedAt: string;
  degraded?: boolean;
  message?: string;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

interface CacheEntry { data: unknown; ts: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 15 * 60 * 1000;

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

// ─── Demo data generator ──────────────────────────────────────────────────────

const EVENT_TYPES = [
  'battles',
  'explosions-remote-violence',
  'violence-against-civilians',
  'protests',
  'riots',
  'strategic-developments',
] as const;

const EVENT_TYPE_LABELS: Record<string, string> = {
  'battles': 'Battles',
  'explosions-remote-violence': 'Explosions/Remote violence',
  'violence-against-civilians': 'Violence against civilians',
  'protests': 'Protests',
  'riots': 'Riots',
  'strategic-developments': 'Strategic developments',
};

const DEMO_ACTORS = [
  'Sudan Armed Forces (SAF)',
  'Rapid Support Forces (RSF)',
  'Sudan Liberation Army (SLA)',
  'Justice and Equality Movement (JEM)',
  'SPLM-N',
  'Civilian protesters',
  'Unknown armed group',
];

const DEMO_LOCATIONS = [
  'Khartoum', 'Omdurman', 'North Darfur', 'West Darfur', 'South Darfur',
  'Kassala', 'Gedaref', 'Blue Nile', 'South Kordofan', 'El Fasher',
  'Nyala', 'Zalingei', 'Geneina', 'Port Sudan', 'Wad Madani',
];

function generateDemoEvents(): GeospatialEvent[] {
  const events: GeospatialEvent[] = [];
  const now = new Date('2026-03-31');

  for (let i = 0; i < 50; i++) {
    const type = EVENT_TYPES[i % EVENT_TYPES.length];
    const daysBack = Math.floor(Math.random() * 90);
    const date = new Date(now);
    date.setDate(date.getDate() - daysBack);

    // Spread around Sudan/Darfur region (lat 15.6, lng 32.5) with ±3 degrees
    const lat = 15.6 + (Math.random() - 0.5) * 6;
    const lng = 32.5 + (Math.random() - 0.5) * 6;

    const actor1 = DEMO_ACTORS[Math.floor(Math.random() * DEMO_ACTORS.length)];
    const actor2 = DEMO_ACTORS[Math.floor(Math.random() * DEMO_ACTORS.length)];
    const location = DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)];

    const fatalities =
      type === 'battles' ? Math.floor(Math.random() * 30)
      : type === 'explosions-remote-violence' ? Math.floor(Math.random() * 15)
      : type === 'violence-against-civilians' ? Math.floor(Math.random() * 10)
      : 0;

    events.push({
      id: `demo-${i}`,
      date: date.toISOString().split('T')[0],
      type,
      country: 'Sudan',
      location,
      lat: Math.round(lat * 10000) / 10000,
      lng: Math.round(lng * 10000) / 10000,
      fatalities,
      actors: actor1 !== actor2 ? [actor1, actor2] : [actor1],
      description: `[DEMO] ${EVENT_TYPE_LABELS[type] ?? type} involving ${actor1} near ${location}.`,
      source: 'event_feed',
    });
  }

  return events.sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Hotspot helper (adapts GeospatialEvent → minimal event shape) ───────────

interface MinimalEvent {
  event_id_cnty: string;
  event_date: string;
  year: number;
  event_type: string;
  sub_event_type: string;
  actor1: string;
  actor2: string;
  country: string;
  admin1: string;
  admin2: string;
  admin3: string;
  location: string;
  latitude: number;
  longitude: number;
  fatalities: number;
  notes: string;
  source: string;
  source_scale: string;
  geo_precision: number;
  timestamp: number;
}

function eventsToHotspotShape(events: GeospatialEvent[]): MinimalEvent[] {
  return events.map((e) => ({
    event_id_cnty: e.id,
    event_date: e.date,
    year: new Date(e.date).getFullYear(),
    event_type: EVENT_TYPE_LABELS[e.type] ?? e.type,
    sub_event_type: e.subType ?? '',
    actor1: e.actors[0] ?? '',
    actor2: e.actors[1] ?? '',
    country: e.country,
    admin1: e.location,
    admin2: '',
    admin3: '',
    location: e.location,
    latitude: e.lat,
    longitude: e.lng,
    fatalities: e.fatalities,
    notes: e.description,
    source: e.source,
    source_scale: 'National',
    geo_precision: 1,
    timestamp: new Date(e.date).getTime(),
  }));
}

// ─── Route handler ────────────────────────────────────────────────────────────

export const POST = withAuth(async (req, user) => {
  if (user.isDemo) {
    const events = generateDemoEvents();
    const hotspotShape = eventsToHotspotShape(events);
    const hotspots = clusterEvents(hotspotShape);
    const response: GeospatialResponse = {
      events,
      hotspots: hotspots.slice(0, 5),
      fetchedAt: new Date().toISOString(),
    };
    return NextResponse.json(response);
  }

  try {
    const body = await req.json() as {
      country?: string;
      region?: string;
      dateStart?: string;
      limit?: number;
    };
    const { country, region, dateStart, limit = 200 } = body;

    if (!country) {
      return NextResponse.json({ error: 'country is required' }, { status: 400 });
    }

    const cacheKey = `geo:${user.uid}:${country}:${region ?? ''}:${dateStart ?? ''}`;
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json(cached);

    const intelligence = await getSituationIntelligence({
      country,
      query: region ?? country,
      dateStart,
      limit: Math.min(limit, 200),
    });

    // Convert IntelligenceItems with coordinates into GeospatialEvents
    const events: GeospatialEvent[] = [];
    for (const item of intelligence.events) {
      const meta = item.metadata as Record<string, unknown>;
      const lat = typeof meta.latitude === 'number' ? meta.latitude
        : typeof meta.lat === 'number' ? meta.lat
        : null;
      const lng = typeof meta.longitude === 'number' ? meta.longitude
        : typeof meta.lng === 'number' ? meta.lng
        : null;

      if (lat === null || lng === null) continue;
      if (lat === 0 && lng === 0) continue;

      const eventType: string =
        typeof meta.event_type === 'string' ? meta.event_type.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-')
        : item.type === 'event' ? 'battles'
        : 'strategic-developments';

      events.push({
        id: item.id,
        date: item.date,
        type: eventType,
        subType: typeof meta.sub_event_type === 'string' ? meta.sub_event_type : undefined,
        country: typeof meta.country === 'string' ? meta.country : country,
        location: item.location ?? (typeof meta.location === 'string' ? meta.location : 'Unknown'),
        lat,
        lng,
        fatalities: typeof meta.fatalities === 'number' ? meta.fatalities : 0,
        actors: item.actors,
        description: item.description,
        source: item.source === 'gdelt' ? 'gdelt' : item.source === 'grounded_search' ? 'event_feed' : 'manual',
      });
    }

    const hotspotShape = eventsToHotspotShape(events);
    const hotspots = clusterEvents(hotspotShape);

    const response: GeospatialResponse = {
      events: events.slice(0, 200),
      hotspots: hotspots.slice(0, 5),
      fetchedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, { data: response, ts: Date.now() });
    return NextResponse.json(response);
  } catch (err) {
    console.error('[geospatial] Failed:', err);
    const response: GeospatialResponse = {
      events: [],
      hotspots: [],
      fetchedAt: new Date().toISOString(),
      degraded: true,
      message: 'Live geospatial feeds are temporarily unavailable. No sample events are shown in authenticated workspaces.',
    };
    return NextResponse.json(response);
  }
});
