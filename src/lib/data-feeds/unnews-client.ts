/**
 * UN News Client — FREE, no API key required
 *
 * Uses UN News RSS feeds and search to pull official UN statements,
 * press releases, and Security Council summaries relevant to a situation.
 *
 * Endpoints used (all public, no auth):
 *   - https://news.un.org/feed/subscribe/en/news/all/rss.xml (global feed)
 *   - https://news.un.org/feed/subscribe/en/news/topic/peace-and-security/rss.xml
 *   - https://news.un.org/feed/subscribe/en/news/topic/humanitarian-aid/rss.xml
 */

export interface UNNewsItem {
  title: string;
  url: string;
  date: string;
  summary: string;
  topic: string;
}

const UN_FEEDS = [
  { url: 'https://news.un.org/feed/subscribe/en/news/topic/peace-and-security/rss.xml', topic: 'Peace & Security' },
  { url: 'https://news.un.org/feed/subscribe/en/news/topic/humanitarian-aid/rss.xml', topic: 'Humanitarian Aid' },
  { url: 'https://news.un.org/feed/subscribe/en/news/topic/human-rights/rss.xml', topic: 'Human Rights' },
];

const CACHE_TTL = 30 * 60 * 1000; // 30 min
const cache = new Map<string, { data: UNNewsItem[]; ts: number }>();

function parseRSSItems(xml: string, topic: string): UNNewsItem[] {
  const items: UNNewsItem[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const match of itemMatches) {
    const block = match[1];
    const title = (block.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/) || block.match(/<title>(.+?)<\/title>/))?.[1]?.trim() || '';
    const link = (block.match(/<link>(.+?)<\/link>/) || block.match(/<guid[^>]*>(.+?)<\/guid>/))?.[1]?.trim() || '';
    const pubDate = block.match(/<pubDate>(.+?)<\/pubDate>/)?.[1]?.trim() || '';
    const description = (block.match(/<description><!\[CDATA\[(.+?)\]\]><\/description>/) || block.match(/<description>(.+?)<\/description>/))?.[1]?.replace(/<[^>]+>/g, '').trim() || '';

    if (title && link) {
      items.push({
        title,
        url: link,
        date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        summary: description.slice(0, 400),
        topic,
      });
    }
  }
  return items;
}

async function fetchFeed(feedUrl: string, topic: string): Promise<UNNewsItem[]> {
  try {
    const res = await fetch(feedUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml, topic);
  } catch {
    return [];
  }
}

/**
 * Search UN News by filtering RSS items that mention the query terms.
 * Returns items matching the situation name or country/region.
 */
export async function searchUNNews(query: string, limit = 6): Promise<UNNewsItem[]> {
  const cacheKey = `un:${query.toLowerCase()}:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const results = await Promise.allSettled(UN_FEEDS.map((f) => fetchFeed(f.url, f.topic)));

  const allItems: UNNewsItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') allItems.push(...r.value);
  }

  // Filter by query relevance (title or summary contains any query word)
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const relevant = allItems.filter((item) => {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    return queryWords.some((w) => text.includes(w));
  });

  // Sort by date descending
  relevant.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const data = relevant.slice(0, limit);
  cache.set(cacheKey, { data, ts: Date.now() });
  return data;
}
