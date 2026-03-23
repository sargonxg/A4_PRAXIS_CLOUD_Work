/**
 * Unified data feed aggregator
 * Merges ACLED, GDELT, and ReliefWeb into a single intelligence stream
 */

import { fetchEvents, isACLEDConfigured, type ACLEDEvent } from './acled-client';
import { searchArticles, type GDELTArticle } from './gdelt-client';
import { searchReports, type RWReport } from './reliefweb-client';

export interface IntelligenceItem {
  id: string;
  source: 'acled' | 'gdelt' | 'reliefweb';
  type: 'event' | 'article' | 'report';
  title: string;
  description: string;
  date: string;
  url?: string;
  actors: string[];
  location?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  metadata: Record<string, unknown>;
}

export interface SituationIntelligence {
  events: IntelligenceItem[];
  totalCount: number;
  sources: { acled: number; gdelt: number; reliefweb: number };
  fetchedAt: string;
}

function acledToIntel(e: ACLEDEvent): IntelligenceItem {
  const severity = e.fatalities > 10 ? 'critical' : e.fatalities > 0 ? 'high' :
    ['Battles', 'Violence against civilians'].includes(e.event_type) ? 'medium' : 'low';
  return {
    id: `acled-${e.event_id_cnty}`,
    source: 'acled',
    type: 'event',
    title: `${e.event_type}: ${e.sub_event_type}`,
    description: e.notes?.slice(0, 500) || '',
    date: e.event_date,
    actors: [e.actor1, e.actor2].filter(Boolean),
    location: [e.location, e.admin1, e.country].filter(Boolean).join(', '),
    severity,
    metadata: { fatalities: e.fatalities, eventType: e.event_type, latitude: e.latitude, longitude: e.longitude },
  };
}

function gdeltToIntel(a: GDELTArticle): IntelligenceItem {
  return {
    id: `gdelt-${Buffer.from(a.url).toString('base64').slice(0, 20)}`,
    source: 'gdelt',
    type: 'article',
    title: a.title,
    description: '',
    date: a.seendate,
    url: a.url,
    actors: [],
    severity: Math.abs(a.tone) > 5 ? 'high' : Math.abs(a.tone) > 2 ? 'medium' : 'low',
    metadata: { tone: a.tone, domain: a.domain, language: a.language, sourcecountry: a.sourcecountry },
  };
}

function rwToIntel(r: RWReport): IntelligenceItem {
  return {
    id: `rw-${r.id}`,
    source: 'reliefweb',
    type: 'report',
    title: r.title,
    description: r.body?.slice(0, 300) || '',
    date: r.date,
    url: r.url,
    actors: [],
    location: r.country,
    severity: r.format === 'Situation Report' ? 'high' : 'medium',
    metadata: { source: r.source, format: r.format, theme: r.theme },
  };
}

/**
 * Fetch intelligence from all available data sources for a country/situation
 */
export async function getSituationIntelligence(options: {
  country: string;
  query?: string;
  dateStart?: string;
  limit?: number;
}): Promise<SituationIntelligence> {
  const results = await Promise.allSettled([
    isACLEDConfigured()
      ? fetchEvents({ country: options.country, dateStart: options.dateStart, limit: options.limit || 50 })
      : Promise.resolve([]),
    searchArticles({ query: options.query || options.country, timespan: '7d', maxRecords: 20 }),
    searchReports({ country: options.country, limit: 10 }),
  ]);

  const acledEvents = results[0].status === 'fulfilled' ? results[0].value as ACLEDEvent[] : [];
  const gdeltArticles = results[1].status === 'fulfilled' ? results[1].value as GDELTArticle[] : [];
  const rwReports = results[2].status === 'fulfilled' ? results[2].value as RWReport[] : [];

  const items: IntelligenceItem[] = [
    ...acledEvents.map(acledToIntel),
    ...gdeltArticles.map(gdeltToIntel),
    ...rwReports.map(rwToIntel),
  ];

  // Sort by date descending, then severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return {
    events: items,
    totalCount: items.length,
    sources: { acled: acledEvents.length, gdelt: gdeltArticles.length, reliefweb: rwReports.length },
    fetchedAt: new Date().toISOString(),
  };
}
