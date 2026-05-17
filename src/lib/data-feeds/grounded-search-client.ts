/**
 * Grounded Search Client — Gemini Flash + Google Search.
 *
 * Primary PRAXIS live-research path. This client gives users checkable URLs
 * for the current political information they are asking the system to
 * understand.
 *
 * Zero-config: works with just GOOGLE_AI_API_KEY or Vertex ADC on Cloud Run.
 */

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getGroundedModel } from '@/lib/ai/providers';

// ───────────────────────────────────────────────────────────────────────────────
// Public types
// ───────────────────────────────────────────────────────────────────────────────

export interface FeedEvent {
  id: string;
  source: 'grounded_search';
  type: 'event' | 'article' | 'report' | 'statement';
  title: string;
  description: string;
  date: string;
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actors: string[];
  location?: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// Zod schema for Output.object
// ───────────────────────────────────────────────────────────────────────────────

const EventSchema = z.object({
  title: z.string().min(8).max(200),
  description: z.string().min(10).max(600),
  url: z.string().url().or(z.string().startsWith('http')),
  date: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  actors: z.array(z.string()).max(6).default([]),
  location: z.string().optional(),
});

const GroundedSearchOutput = z.object({
  events: z.array(EventSchema).max(20).default([]),
});

type RawEvent = z.infer<typeof EventSchema>;

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

function safeDate(raw: string): string {
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return new Date().toISOString();
}

function stableId(url: string, title: string): string {
  const seed = `${url}|${title}`;
  // 32-bit FNV-like hash → stays deterministic across runs
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `grounded-${(h >>> 0).toString(36)}`;
}

function toFeedEvent(raw: RawEvent): FeedEvent {
  return {
    id: stableId(raw.url, raw.title),
    source: 'grounded_search',
    type: 'article',
    title: raw.title.trim(),
    description: raw.description.trim(),
    date: safeDate(raw.date),
    url: raw.url,
    severity: raw.severity,
    actors: (raw.actors ?? []).filter((a) => a && a.trim()).slice(0, 4),
    location: raw.location?.trim() || undefined,
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Fetch recent news events about {query} via Gemini Flash + Google Search grounding.
 * Returns `[]` on any error so callers can continue with secondary feeds.
 */
export async function getGroundedSearchEvents(opts: {
  query: string;
  country?: string;
  limit?: number;
}): Promise<FeedEvent[]> {
  const query = opts.query?.trim();
  if (!query) return [];
  const limit = Math.max(1, Math.min(opts.limit ?? 10, 20));
  const todayISO = new Date().toISOString().slice(0, 10);

  const system =
    'You are PRAXIS, a conflict-intelligence researcher. Use Google Search to find real, recent news events. Return ONLY verifiable items from reputable sources (wire services, UN agencies, major broadcasters, think tanks). Never invent URLs.';

  const countryClause = opts.country ? ` in ${opts.country}` : '';
  const prompt = `Return ${limit} recent (≤30 days) news events, announcements, or developments about ${query}${countryClause}.
For each: title (8-14 words), 2-sentence description, source URL, date (ISO 8601), severity (low|medium|high|critical), and up to 4 actors mentioned.
Respond ONLY as a JSON object of shape { "events": [...] }. Today is ${todayISO}.`;

  try {
    const result = await generateText({
      model: getGroundedModel(),
      system,
      prompt,
      experimental_output: Output.object({ schema: GroundedSearchOutput }),
      maxRetries: 1,
    });

    const raw = (result as { experimental_output?: unknown }).experimental_output;
    const parsed = GroundedSearchOutput.safeParse(raw);

    if (parsed.success && parsed.data.events.length > 0) {
      return parsed.data.events.map(toFeedEvent);
    }

    // Fallback: try parsing any JSON array in result.text
    const text = (result as { text?: string }).text ?? '';
    const match = text.match(/\{[\s\S]*"events"[\s\S]*\}/);
    if (match) {
      try {
        const obj = JSON.parse(match[0]);
        const parsed2 = GroundedSearchOutput.safeParse(obj);
        if (parsed2.success) return parsed2.data.events.map(toFeedEvent);
      } catch {
        /* noop */
      }
    }

    return [];
  } catch (err) {
    console.warn('[grounded-search-client] failed:', err instanceof Error ? err.message : err);
    return [];
  }
}
