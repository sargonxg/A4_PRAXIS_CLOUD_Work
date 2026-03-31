/**
 * SIPRI Arms Transfers Database Client
 * https://armstrade.sipri.org/
 * Uses Firecrawl to extract from public SIPRI database pages.
 * Returns empty arrays if Firecrawl is not configured.
 */

export interface SIPRITransfer {
  supplier: string;
  recipient: string;
  weaponCategory: string;
  year: number;
  tivValue: number; // SIPRI TIV (trend-indicator values)
  description: string;
}

export interface SIPRIArmsSnapshot {
  country: string;
  asRecipient: SIPRITransfer[];
  asSupplier: SIPRITransfer[];
  totalImportTIV: number;
  totalExportTIV: number;
  majorSuppliers: string[];
  majorRecipients: string[];
  fetchedAt: string;
}

const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours
const cache = new Map<string, { data: SIPRIArmsSnapshot | null; ts: number }>();

/**
 * Scrape SIPRI arms transfer data for a country.
 * Requires FIRECRAWL_API_KEY. Returns null if unavailable.
 */
export async function getArmsTransfers(country: string): Promise<SIPRIArmsSnapshot | null> {
  const cacheKey = `sipri:${country.toLowerCase()}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  if (!firecrawlKey) {
    cache.set(cacheKey, { data: null, ts: Date.now() });
    return null;
  }

  try {
    const currentYear = new Date().getFullYear();
    const url = `https://armstrade.sipri.org/armstrade/page/values.php?lang=en&submit=show&yearfrom=${currentYear - 5}&yearto=${currentYear - 1}&selcountries=${encodeURIComponent(country)}&format=stat`;

    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        timeout: 15000,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      cache.set(cacheKey, { data: null, ts: Date.now() });
      return null;
    }

    const data = await res.json() as Record<string, unknown>;
    const markdown = (data.data as Record<string, unknown>)?.markdown as string ?? '';

    // Parse table data from markdown (SIPRI renders as HTML tables → markdown tables)
    const transfers: SIPRITransfer[] = [];
    const rows = markdown.split('\n').filter((l) => l.includes('|') && !l.includes('---'));

    for (const row of rows.slice(1, 50)) {
      const cells = row.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 4) {
        const yearMatch = cells.find((c) => /^20\d\d$/.test(c));
        const tivMatch = cells.find((c) => /^\d+(\.\d+)?$/.test(c.replace(/,/g, '')));
        if (yearMatch && tivMatch) {
          transfers.push({
            supplier: cells[0] || country,
            recipient: cells[1] || country,
            weaponCategory: cells[2] || 'Unknown',
            year: parseInt(yearMatch, 10),
            tivValue: parseFloat(tivMatch.replace(/,/g, '')) || 0,
            description: cells[cells.length - 1] || '',
          });
        }
      }
    }

    const asRecipient = transfers.filter((t) => t.recipient.toLowerCase().includes(country.toLowerCase()));
    const asSupplier = transfers.filter((t) => t.supplier.toLowerCase().includes(country.toLowerCase()));

    const snapshot: SIPRIArmsSnapshot = {
      country,
      asRecipient,
      asSupplier,
      totalImportTIV: asRecipient.reduce((s, t) => s + t.tivValue, 0),
      totalExportTIV: asSupplier.reduce((s, t) => s + t.tivValue, 0),
      majorSuppliers: [...new Set(asRecipient.map((t) => t.supplier))].slice(0, 5),
      majorRecipients: [...new Set(asSupplier.map((t) => t.recipient))].slice(0, 5),
      fetchedAt: new Date().toISOString(),
    };

    cache.set(cacheKey, { data: snapshot, ts: Date.now() });
    return snapshot;
  } catch {
    cache.set(cacheKey, { data: null, ts: Date.now() });
    return null;
  }
}

export function isSIPRIConfigured(): boolean {
  return !!process.env.FIRECRAWL_API_KEY;
}
