/**
 * ReliefWeb API v1 Client
 * https://apidoc.rwlabs.org/
 *
 * Free, no API key required. The world's largest humanitarian information source.
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

const RW_BASE = 'https://api.reliefweb.int/v1';

export async function searchReports(options: {
  query?: string;
  country?: string;
  limit?: number;
  dateStart?: string;
  format?: string[];
}): Promise<RWReport[]> {
  const body: Record<string, unknown> = {
    appname: 'praxis-tacitus',
    limit: options.limit || 10,
    fields: {
      include: ['title', 'url_alias', 'source.name', 'date.original', 'country.name', 'theme.name', 'format.name', 'body'],
    },
    sort: ['date.original:desc'],
  };

  const conditions: Record<string, unknown>[] = [];
  if (options.query) {
    conditions.push({ field: 'title', value: options.query, operator: 'AND' });
  }
  if (options.country) {
    conditions.push({ field: 'country.name', value: [options.country] });
  }
  if (options.dateStart) {
    conditions.push({ field: 'date.original', value: { from: options.dateStart } });
  }
  if (options.format?.length) {
    conditions.push({ field: 'format.name', value: options.format });
  }
  if (conditions.length > 0) {
    body.filter = { operator: 'AND', conditions };
  }

  try {
    const res = await fetch(`${RW_BASE}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const data = await res.json();

    return (data.data || []).map((item: Record<string, unknown>) => {
      const fields = item.fields as Record<string, unknown>;
      return {
        id: item.id as number,
        title: fields.title as string || '',
        url: `https://reliefweb.int/report/${(fields.url_alias as string) || item.id}`,
        source: ((fields.source as { name?: string }[]))?.[0]?.name || 'Unknown',
        date: ((fields.date as { original?: string })?.original) || '',
        country: ((fields.country as { name?: string }[]))?.[0]?.name || '',
        theme: ((fields.theme as { name?: string }[]) || []).map((t) => t.name || ''),
        format: ((fields.format as { name?: string }[]))?.[0]?.name || '',
        body: (fields.body as string)?.slice(0, 2000) || undefined,
      };
    });
  } catch (err) {
    console.error('[reliefweb] searchReports failed:', err);
    return [];
  }
}

export async function getDisasters(country: string): Promise<{ id: number; name: string; status: string; date: string }[]> {
  try {
    const res = await fetch(`${RW_BASE}/disasters?appname=praxis-tacitus&filter[field]=country.name&filter[value][]=${encodeURIComponent(country)}&limit=10&sort[]=date.created:desc`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((d: Record<string, unknown>) => {
      const f = d.fields as Record<string, unknown>;
      return {
        id: d.id as number,
        name: f.name as string || '',
        status: f.status as string || '',
        date: (f.date as { created?: string })?.created || '',
      };
    });
  } catch {
    return [];
  }
}
