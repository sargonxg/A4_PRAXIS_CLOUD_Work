/**
 * ACLED API v3 Client
 * Armed Conflict Location & Event Data Project
 * https://developer.acleddata.com/
 *
 * Requires: ACLED_API_KEY + ACLED_EMAIL env vars
 * Free academic access available at https://developer.acleddata.com/
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

const ACLED_BASE = 'https://api.acleddata.com/acled/read';

function getCredentials() {
  const key = process.env.ACLED_API_KEY;
  const email = process.env.ACLED_EMAIL;
  if (!key || !email) return null;
  return { key, email };
}

export function isACLEDConfigured(): boolean {
  return !!getCredentials();
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return res;
      if (res.status === 429 && i < retries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 2000));
        continue;
      }
      throw new Error(`ACLED API ${res.status}: ${res.statusText}`);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('ACLED fetch failed after retries');
}

export async function fetchEvents(options: {
  country: string;
  dateStart?: string;
  dateEnd?: string;
  eventType?: string;
  limit?: number;
}): Promise<ACLEDEvent[]> {
  const creds = getCredentials();
  if (!creds) return [];

  const params = new URLSearchParams({
    key: creds.key,
    email: creds.email,
    country: options.country,
    limit: String(options.limit || 100),
  });
  if (options.dateStart) params.set('event_date', options.dateStart);
  if (options.dateEnd) params.set('event_date_where', `BETWEEN|${options.dateStart}|${options.dateEnd}`);
  if (options.eventType) params.set('event_type', options.eventType);

  try {
    const res = await fetchWithRetry(`${ACLED_BASE}?${params}`);
    const data: ACLEDResponse = await res.json();
    return data.success ? data.data : [];
  } catch (err) {
    console.error('[acled] fetchEvents failed:', err);
    return [];
  }
}

export async function fetchActors(country: string): Promise<string[]> {
  const events = await fetchEvents({ country, limit: 200 });
  const actors = new Set<string>();
  for (const e of events) {
    if (e.actor1) actors.add(e.actor1);
    if (e.actor2) actors.add(e.actor2);
  }
  return Array.from(actors).sort();
}

/**
 * Map ACLED event types to ACO Conflict Grammar entity types
 */
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
    actors: [event.actor1, event.actor2].filter(Boolean),
  };
}
