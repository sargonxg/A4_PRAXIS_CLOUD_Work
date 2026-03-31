/**
 * ReliefWeb API v1 Client
 * https://apidoc.rwlabs.org/
 * Free, no API key required.
 */

export interface RWReport {
  id: number;
  title: string;
  url: string;
  source: string;
  date: string;
  country: string;
  theme: string[];
  format: string;
  body?: string;
}

export interface RWDisaster {
  id: number;
  name: string;
  status: string;
  date: string;
  glide?: string;
}

const RW_BASE = 'https://api.reliefweb.int/v1';

async function rwPost(endpoint: string, body: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${RW_BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appname: 'praxis-tacitus', ...body }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error(`[reliefweb] ${endpoint} failed:`, err);
    return null;
  }
}

function parseReport(item: Record<string, unknown>): RWReport {
  const fields = item.fields as Record<string, unknown>;
  return {
    id: item.id as number,
    title: (fields.title as string) || '',
    url: `https://reliefweb.int/report/${(fields.url_alias as string) || item.id}`,
    source: ((fields.source as { name?: string }[]))?.[0]?.name || 'Unknown',
    date: ((fields.date as { original?: string })?.original) || '',
    country: ((fields.country as { name?: string }[]))?.[0]?.name || '',
    theme: ((fields.theme as { name?: string }[]) || []).map((t) => t.name || ''),
    format: ((fields.format as { name?: string }[]))?.[0]?.name || '',
    body: (fields.body as string)?.slice(0, 2000) || undefined,
  };
}

export async function searchReports(options: {
  query?: string;
  country?: string;
  limit?: number;
  dateStart?: string;
  dateEnd?: string;
  format?: string[];
  theme?: string[];
  source?: string[];
  language?: string;
}): Promise<RWReport[]> {
  const conditions: Record<string, unknown>[] = [];
  if (options.query) conditions.push({ field: 'title', value: options.query, operator: 'AND' });
  if (options.country) conditions.push({ field: 'country.name', value: [options.country] });
  if (options.dateStart || options.dateEnd) {
    const range: Record<string, string> = {};
    if (options.dateStart) range.from = options.dateStart;
    if (options.dateEnd) range.to = options.dateEnd;
    conditions.push({ field: 'date.original', value: range });
  }
  if (options.format?.length) conditions.push({ field: 'format.name', value: options.format });
  if (options.theme?.length) conditions.push({ field: 'theme.name', value: options.theme });
  if (options.source?.length) conditions.push({ field: 'source.name', value: options.source });
  if (options.language) conditions.push({ field: 'language.name', value: [options.language] });

  const body: Record<string, unknown> = {
    limit: options.limit || 10,
    fields: { include: ['title', 'url_alias', 'source.name', 'date.original', 'country.name', 'theme.name', 'format.name', 'body'] },
    sort: ['date.original:desc'],
  };
  if (conditions.length > 0) body.filter = { operator: 'AND', conditions };

  const data = await rwPost('reports', body);
  return (data?.data as Record<string, unknown>[] || []).map(parseReport);
}

export async function fetchLatestSituationReports(country: string, limit = 5): Promise<RWReport[]> {
  return searchReports({ country, format: ['Situation Report'], limit });
}

export async function fetchDisasterUpdates(country: string, limit = 5): Promise<RWReport[]> {
  return searchReports({ country, format: ['Situation Report', 'Update', 'Flash Update'], limit, dateStart: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10) });
}

export async function getDisasters(country: string): Promise<RWDisaster[]> {
  try {
    const res = await fetch(
      `${RW_BASE}/disasters?appname=praxis-tacitus&filter[field]=country.name&filter[value][]=${encodeURIComponent(country)}&limit=10&sort[]=date.created:desc`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((d: Record<string, unknown>) => {
      const f = d.fields as Record<string, unknown>;
      return {
        id: d.id as number,
        name: (f.name as string) || '',
        status: (f.status as string) || '',
        date: ((f.date as { created?: string })?.created) || '',
        glide: (f.glide as string) || undefined,
      };
    });
  } catch { return []; }
}
