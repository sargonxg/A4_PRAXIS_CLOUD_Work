/**
 * UN News Client — FREE, no API key required
 *
 * Uses UN News RSS feeds and search to pull official UN statements,
 * press releases, and Security Council summaries relevant to a situation.
 *
 * Endpoints used (all public, no auth):
 *   - https://news.un.org/feed/subscribe/en/news/topic/peace-and-security/rss.xml
 *   - https://news.un.org/feed/subscribe/en/news/topic/humanitarian-aid/rss.xml
 *   - https://news.un.org/feed/subscribe/en/news/topic/human-rights/rss.xml
 *   - https://news.un.org/feed/subscribe/en/news/topic/international-law/rss.xml
 *   - https://news.un.org/feed/subscribe/en/news/topic/africa/rss.xml
 *   - https://news.un.org/feed/subscribe/en/news/topic/middle-east/rss.xml
 */

export interface UNNewsItem {
  title: string;
  url: string;
  date: string;
  summary: string;
  topic: string;
  isSGStatement: boolean;
  isSecurityCouncil: boolean;
}

const UN_FEEDS = [
  { url: 'https://news.un.org/feed/subscribe/en/news/topic/peace-and-security/rss.xml', topic: 'Peace & Security' },
  { url: 'https://news.un.org/feed/subscribe/en/news/topic/humanitarian-aid/rss.xml', topic: 'Humanitarian Aid' },
  { url: 'https://news.un.org/feed/subscribe/en/news/topic/human-rights/rss.xml', topic: 'Human Rights' },
  { url: 'https://news.un.org/feed/subscribe/en/news/topic/international-law/rss.xml', topic: 'International Law' },
  { url: 'https://news.un.org/feed/subscribe/en/news/topic/africa/rss.xml', topic: 'Africa' },
  { url: 'https://news.un.org/feed/subscribe/en/news/topic/middle-east/rss.xml', topic: 'Middle East' },
];

const CACHE_TTL = 30 * 60 * 1000; // 30 min
const cache = new Map<string, { data: UNNewsItem[]; ts: number }>();

// Patterns for SG and Security Council detection
const SG_PATTERNS = [
  /secretary-general/i,
  /António Guterres/i,
  /antonio guterres/i,
  /\bSG\b/,
  /office of the secretary/i,
];

const SC_PATTERNS = [
  /security council/i,
  /\bS\/\d{4}\/\d+\b/, // UN Security Council document reference
  /resolution \d+/i,
  /security council resolution/i,
];

function detectSGStatement(text: string): boolean {
  return SG_PATTERNS.some((pattern) => pattern.test(text));
}

function detectSecurityCouncil(text: string): boolean {
  return SC_PATTERNS.some((pattern) => pattern.test(text));
}

function extractCDATA(block: string, tag: string): string {
  const cdataMatch = block.match(new RegExp(`<${tag}><\\!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
  if (cdataMatch) return cdataMatch[1].trim();
  const plainMatch = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return plainMatch?.[1]?.trim() || '';
}

function parseRSSItems(xml: string, topic: string): UNNewsItem[] {
  const items: UNNewsItem[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const block = match[1];

    const title = extractCDATA(block, 'title');
    const description = extractCDATA(block, 'description').replace(/<[^>]+>/g, '').trim();
    const link =
      (block.match(/<link>([^<]+)<\/link>/) || block.match(/<guid[^>]*>([^<]+)<\/guid>/))?.[1]?.trim() || '';
    const pubDate = block.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1]?.trim() || '';

    if (!title || !link) continue;

    const fullText = `${title} ${description}`;

    items.push({
      title,
      url: link,
      date: pubDate
        ? new Date(pubDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      summary: description.slice(0, 400),
      topic,
      isSGStatement: detectSGStatement(fullText),
      isSecurityCouncil: detectSecurityCouncil(fullText),
    });
  }

  return items;
}

async function fetchFeed(feedUrl: string, topic: string): Promise<UNNewsItem[]> {
  try {
    const res = await fetch(feedUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml, topic);
  } catch {
    return [];
  }
}

/**
 * Build a set of query words for relevance filtering.
 * Strips common stop words and returns words longer than 3 chars,
 * plus any shorter words that look like country codes or acronyms.
 */
function buildQueryWords(query: string): string[] {
  const stopWords = new Set(['and', 'the', 'for', 'with', 'that', 'this', 'from', 'have', 'been', 'will', 'are', 'its', 'their', 'into']);
  return query
    .toLowerCase()
    .split(/[\s,;/]+/)
    .filter((w) => w.length > 0)
    .filter((w) => {
      if (w.length <= 2) return false; // too short to be useful
      if (w.length === 3) return /^[a-z]{3}$/.test(w) && !stopWords.has(w); // country codes
      return !stopWords.has(w);
    });
}

function isRelevant(item: UNNewsItem, queryWords: string[]): boolean {
  if (queryWords.length === 0) return true;
  const text = `${item.title} ${item.summary}`.toLowerCase();
  return queryWords.some((w) => text.includes(w));
}

/**
 * Search UN News by filtering RSS items that mention the query terms.
 * Returns items matching the situation name or country/region, sorted by date.
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

  const queryWords = buildQueryWords(query);
  const relevant = allItems.filter((item) => isRelevant(item, queryWords));

  // Sort: SG statements and SC items first, then by date descending
  relevant.sort((a, b) => {
    const aWeight = (a.isSGStatement ? 2 : 0) + (a.isSecurityCouncil ? 1 : 0);
    const bWeight = (b.isSGStatement ? 2 : 0) + (b.isSecurityCouncil ? 1 : 0);
    if (bWeight !== aWeight) return bWeight - aWeight;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const data = relevant.slice(0, limit);
  cache.set(cacheKey, { data, ts: Date.now() });
  return data;
}

/**
 * Fetch news filtered by specific topics and optionally a country/region keyword.
 * Topics correspond to feed topic slugs (e.g. 'peace-and-security', 'africa', 'middle-east').
 */
export async function fetchTopicalNews(
  topics: string[],
  country?: string,
  limit = 10,
): Promise<UNNewsItem[]> {
  const topicLower = topics.map((t) => t.toLowerCase());

  // Determine which feeds to query based on requested topics
  const feedsToQuery = UN_FEEDS.filter((f) => {
    const slug = f.url.match(/\/topic\/([^/]+)\//)?.[1]?.toLowerCase() || '';
    return topicLower.some((t) => slug.includes(t) || f.topic.toLowerCase().includes(t));
  });

  // Fall back to all feeds if no match
  const targetFeeds = feedsToQuery.length > 0 ? feedsToQuery : UN_FEEDS;

  const cacheKey = `un:topical:${topicLower.join(',')}:${country || ''}:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const results = await Promise.allSettled(targetFeeds.map((f) => fetchFeed(f.url, f.topic)));

  const allItems: UNNewsItem[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') allItems.push(...r.value);
  }

  // If country is specified, filter by it
  let filtered = allItems;
  if (country && country.trim().length > 0) {
    const countryWords = buildQueryWords(country);
    filtered = allItems.filter((item) => isRelevant(item, countryWords));
  }

  // De-duplicate by URL
  const seen = new Set<string>();
  const unique = filtered.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Sort by date descending, SG/SC weighted first
  unique.sort((a, b) => {
    const aWeight = (a.isSGStatement ? 2 : 0) + (a.isSecurityCouncil ? 1 : 0);
    const bWeight = (b.isSGStatement ? 2 : 0) + (b.isSecurityCouncil ? 1 : 0);
    if (bWeight !== aWeight) return bWeight - aWeight;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const data = unique.slice(0, limit);
  cache.set(cacheKey, { data, ts: Date.now() });
  return data;
}
