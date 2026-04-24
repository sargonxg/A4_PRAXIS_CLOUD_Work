/**
 * ACLED API v3 Client — Armed Conflict Location & Event Data Project
 * https://developer.acleddata.com/
 * Requires: ACLED_API_KEY + ACLED_EMAIL env vars
 */

export interface ACLEDEvent {
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

export interface ACLEDResponse {
  success: boolean;
  data: ACLEDEvent[];
  count: number;
}

export interface ACLEDActorSummary {
  name: string;
  eventCount: number;
  fatalities: number;
  eventTypes: string[];
}

export interface ACLEDWeeklyTrend {
  weekStart: string;
  eventCount: number;
  fatalities: number;
  battleCount: number;
}

export type ACLEDEventType =
  | 'Battles'
  | 'Explosions/Remote violence'
  | 'Violence against civilians'
  | 'Protests'
  | 'Riots'
  | 'Strategic developments';

const ACLED_BASE = 'https://api.acleddata.com/acled/read';
const RATE_LIMIT_DELAY = 1200; // ~50 req/min
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, { data: ACLEDEvent[]; ts: number }>();

let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_DELAY) {
    await new Promise((r) => setTimeout(r, RATE_LIMIT_DELAY - elapsed));
  }
  lastRequestTime = Date.now();
}

export interface ACLEDCredentials { key: string; email: string }

function getCredentials(override?: ACLEDCredentials | null): ACLEDCredentials | null {
  if (override && override.key && override.email) return override;
  const key = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;
  if (!key || !email) return null;
  return { key, email };
}

export function isACLEDConfigured(override?: ACLEDCredentials | null): boolean {
  return !!getCredentials(override);
}

/** Normalize actor names (strip trailing numbers, standardize common variants) */
function normalizeActor(name: string): string {
  if (!name) return '';
  return name
    .replace(/\s*\(\d+\)$/, '') // Remove trailing (123)
    .replace(/^(Forces of|Military Forces of|Armed Forces of)\s+/i, '')
    .trim();
}

async function fetchPage(params: URLSearchParams): Promise<ACLEDEvent[]> {
  await rateLimit();
  const res = await fetch(`${ACLED_BASE}?${params}`, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`ACLED API ${res.status}: ${res.statusText}`);
  const data: ACLEDResponse = await res.json();
  return data.success ? data.data : [];
}

async function fetchWithRetry(params: URLSearchParams, retries = 2): Promise<ACLEDEvent[]> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchPage(params);
    } catch (err) {
      if (i === retries) throw err;
      if ((err as Error).message?.includes('429')) {
        await new Promise((r) => setTimeout(r, Math.pow(2, i + 1) * 2000));
      } else {
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
      }
    }
  }
  return [];
}

export async function fetchEvents(options: {
  country: string;
  dateStart?: string;
  dateEnd?: string;
  eventType?: ACLEDEventType;
  subEventType?: string;
  admin1?: string;
  admin2?: string;
  limit?: number;
  paginate?: boolean; // auto page-through up to 15000 events
  /** Per-call credential override — takes precedence over ENV fallback. Used to inject user-configured keys. */
  credentials?: ACLEDCredentials | null;
}): Promise<ACLEDEvent[]> {
  const creds = getCredentials(options.credentials ?? null);
  if (!creds) return [];

  const cacheKey = JSON.stringify(options);
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const pageSize = 5000;
  const maxEvents = options.paginate ? 15000 : (options.limit || 100);

  const buildParams = (page: number, limit: number) => {
    const p = new URLSearchParams({
      key: creds.key,
      email: creds.email,
      country: options.country,
      limit: String(Math.min(limit, pageSize)),
      page: String(page),
      fields: 'event_id_cnty|event_date|year|event_type|sub_event_type|actor1|actor2|country|admin1|admin2|admin3|location|latitude|longitude|fatalities|notes|source|source_scale|geo_precision|timestamp',
    });
    if (options.dateStart) p.set('event_date', `${options.dateStart}|${options.dateEnd || new Date().toISOString().slice(0, 10)}`);
    if (options.dateEnd && !options.dateStart) p.set('event_date', options.dateEnd);
    if (options.eventType) p.set('event_type', options.eventType);
    if (options.subEventType) p.set('sub_event_type', options.subEventType);
    if (options.admin1) p.set('admin1', options.admin1);
    if (options.admin2) p.set('admin2', options.admin2);
    return p;
  };

  try {
    const allEvents: ACLEDEvent[] = [];
    let page = 1;

    while (allEvents.length < maxEvents) {
      const remaining = maxEvents - allEvents.length;
      const events = await fetchWithRetry(buildParams(page, remaining));
      allEvents.push(...events);
      if (events.length < pageSize || allEvents.length >= maxEvents || !options.paginate) break;
      page++;
    }

    const result = allEvents.slice(0, maxEvents);
    cache.set(cacheKey, { data: result, ts: Date.now() });
    return result;
  } catch (err) {
    console.error('[acled] fetchEvents failed:', err);
    return [];
  }
}

/** Returns unique actors with event counts and fatalities */
export async function fetchActors(country: string, limit = 200): Promise<ACLEDActorSummary[]> {
  const events = await fetchEvents({ country, limit });
  const actorMap = new Map<string, ACLEDActorSummary>();

  for (const e of events) {
    for (const rawName of [e.actor1, e.actor2]) {
      const name = normalizeActor(rawName);
      if (!name) continue;
      const existing = actorMap.get(name) ?? { name, eventCount: 0, fatalities: 0, eventTypes: [] };
      existing.eventCount++;
      existing.fatalities += e.fatalities;
      if (!existing.eventTypes.includes(e.event_type)) existing.eventTypes.push(e.event_type);
      actorMap.set(name, existing);
    }
  }

  return Array.from(actorMap.values()).sort((a, b) => b.eventCount - a.eventCount);
}

/** Weekly event counts for the last N weeks */
export async function fetchEventTrend(country: string, weeks = 12): Promise<ACLEDWeeklyTrend[]> {
  const dateStart = new Date(Date.now() - weeks * 7 * 86400000).toISOString().slice(0, 10);
  const events = await fetchEvents({ country, dateStart, limit: 5000, paginate: true });

  const weekMap = new Map<string, ACLEDWeeklyTrend>();

  for (const e of events) {
    const d = new Date(e.event_date);
    const dayOfWeek = d.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(d.getTime() + mondayOffset * 86400000);
    const weekStart = monday.toISOString().slice(0, 10);

    const existing = weekMap.get(weekStart) ?? { weekStart, eventCount: 0, fatalities: 0, battleCount: 0 };
    existing.eventCount++;
    existing.fatalities += e.fatalities;
    if (e.event_type === 'Battles') existing.battleCount++;
    weekMap.set(weekStart, existing);
  }

  return Array.from(weekMap.values()).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/** Aggregate fatalities by time period */
export function aggregateFatalities(events: ACLEDEvent[], period: 'daily' | 'weekly' | 'monthly'): { period: string; fatalities: number; eventCount: number }[] {
  const map = new Map<string, { fatalities: number; eventCount: number }>();

  for (const e of events) {
    const d = e.event_date;
    let key: string;
    if (period === 'daily') key = d.slice(0, 10);
    else if (period === 'weekly') {
      const date = new Date(d);
      const week = Math.floor(date.getTime() / (7 * 86400000));
      key = new Date(week * 7 * 86400000).toISOString().slice(0, 10);
    } else {
      key = d.slice(0, 7);
    }

    const existing = map.get(key) ?? { fatalities: 0, eventCount: 0 };
    existing.fatalities += e.fatalities;
    existing.eventCount++;
    map.set(key, existing);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({ period, ...v }));
}

/** Cluster events by location proximity (simple grid-based, ~25km cells) */
export function clusterByLocation(events: ACLEDEvent[]): { centroid: { lat: number; lng: number }; events: ACLEDEvent[]; admin1: string }[] {
  const GRID_SIZE = 0.25; // ~25km at equator
  const grid = new Map<string, ACLEDEvent[]>();

  for (const e of events) {
    const gridLat = Math.round(e.latitude / GRID_SIZE) * GRID_SIZE;
    const gridLng = Math.round(e.longitude / GRID_SIZE) * GRID_SIZE;
    const key = `${gridLat.toFixed(2)},${gridLng.toFixed(2)}`;
    const bucket = grid.get(key) ?? [];
    bucket.push(e);
    grid.set(key, bucket);
  }

  return Array.from(grid.values())
    .filter((bucket) => bucket.length > 0)
    .map((bucket) => {
      const avgLat = bucket.reduce((s, e) => s + e.latitude, 0) / bucket.length;
      const avgLng = bucket.reduce((s, e) => s + e.longitude, 0) / bucket.length;
      return {
        centroid: { lat: avgLat, lng: avgLng },
        events: bucket,
        admin1: bucket[0].admin1 || '',
      };
    })
    .sort((a, b) => b.events.length - a.events.length);
}

/** Map ACLED event types to ACO Conflict Grammar entity types */
export function mapACLEDtoACO(event: ACLEDEvent) {
  const typeMap: Record<string, string> = {
    'Battles': 'event',
    'Violence against civilians': 'event',
    'Explosions/Remote violence': 'event',
    'Riots': 'event',
    'Protests': 'event',
    'Strategic developments': 'commitment',
  };
  return {
    acoType: typeMap[event.event_type] || 'event',
    escalatoryDirection: ['Battles', 'Violence against civilians', 'Explosions/Remote violence'].includes(event.event_type)
      ? 'escalatory' : event.event_type === 'Protests' ? 'ambiguous' : 'neutral',
    actors: [event.actor1, event.actor2].filter(Boolean).map(normalizeActor),
  };
}
