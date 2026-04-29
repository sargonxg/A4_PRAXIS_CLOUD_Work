/**
 * PRAXIS Resilient Feed Fetcher
 * Every data type has a fallback chain ending in Gemini grounded search.
 * Uses circuit breakers to avoid hammering failed services.
 */

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getGroundedModel } from '@/lib/ai/providers';
import {
  gdeltBreaker, hdxBreaker,
  unhcrBreaker, worldbankBreaker,
} from '@/lib/utils/circuit-breaker';

// ── Gemini Grounded Fallback ────────────────────────────────────────────────

async function geminiGroundedFetch<T>(
  prompt: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  try {
    const result = await generateText({
      model: getGroundedModel(),
      prompt,
      output: Output.object({ schema }),
    });
    return result.output ?? null;
  } catch (err) {
    console.error('[resilient-fetch] Gemini grounded fallback failed:', err);
    return null;
  }
}

// ── Conflict Events ──────────────────────────────────────────────────────────

const ConflictEventSchema = z.object({
  events: z.array(z.object({
    date: z.string(),
    title: z.string(),
    description: z.string(),
    actors: z.array(z.string()),
    location: z.string().optional(),
    fatalities: z.number().optional(),
    source: z.string().optional(),
  })).max(20),
});

export async function fetchConflictEvents(
  country: string,
  dateRange: { from: string; to: string },
): Promise<z.infer<typeof ConflictEventSchema>['events']> {
  // 1. Try GDELT's public document stream for conflict-event signals.
  const gdeltResult = await gdeltBreaker.execute(
    async () => {
      const query = encodeURIComponent(`${country} conflict violence`);
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=20&format=json&startdatetime=${dateRange.from.replace(/-/g, '')}000000&enddatetime=${dateRange.to.replace(/-/g, '')}235959`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`GDELT ${res.status}`);
      const data = await res.json();
      return (data.articles ?? []).slice(0, 10).map((a: Record<string, unknown>) => ({
        date: String(a.seendate ?? '').slice(0, 10),
        title: String(a.title ?? ''),
        description: String(a.url ?? ''),
        actors: [],
        source: 'GDELT',
      }));
    },
    async () => [],
  );
  if (gdeltResult.length > 0) return gdeltResult;

  // 2. Gemini grounded fallback (always available)
  const grounded = await geminiGroundedFetch(
    `Find the 10 most significant conflict events in ${country} between ${dateRange.from} and ${dateRange.to}. For each: date, title, description, actors, location, estimated fatalities. Return as JSON.`,
    ConflictEventSchema,
  );
  return grounded?.events ?? [];
}

// ── Displacement Data ────────────────────────────────────────────────────────

const DisplacementSchema = z.object({
  idps: z.number(),
  refugees: z.number(),
  returnees: z.number().optional(),
  source: z.string(),
  asOf: z.string(),
});

export async function fetchDisplacementData(country: string): Promise<z.infer<typeof DisplacementSchema> | null> {
  // 1. HDX HAPI
  const hdxResult = await hdxBreaker.execute(
    async () => {
      const url = `https://hapi.humdata.org/api/v1/affected-people/refugees?location_code=${country.toUpperCase().slice(0, 3)}&output_format=json&limit=5`;
      const res = await fetch(url, { headers: { 'X-HDX-HAPI-APP-IDENTIFIER': 'praxis-tacitus' }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HDX ${res.status}`);
      const data = await res.json();
      const items = data.data ?? [];
      if (!items.length) return null;
      const idps = items.find((i: Record<string, unknown>) => i.population_group === 'IDP')?.population_number ?? 0;
      const refugees = items.find((i: Record<string, unknown>) => i.population_group === 'REF')?.population_number ?? 0;
      return { idps: Number(idps), refugees: Number(refugees), source: 'HDX HAPI', asOf: new Date().toISOString().slice(0, 10) };
    },
    async () => null,
  );
  if (hdxResult) return hdxResult;

  // 2. UNHCR fallback
  const unhcrResult = await unhcrBreaker.execute(
    async () => {
      const url = `https://api.unhcr.org/population/v1/population/?limit=1&dataset=unhcr&displayType=totals&year=2024&coa_iso3=${country.toUpperCase().slice(0, 3)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`UNHCR ${res.status}`);
      const data = await res.json();
      const items = data.items ?? [];
      if (!items.length) return null;
      return {
        idps: 0,
        refugees: Number(items[0].refugees ?? 0),
        source: 'UNHCR',
        asOf: '2024',
      };
    },
    async () => null,
  );
  if (unhcrResult) return unhcrResult;

  // 3. Gemini grounded fallback
  return geminiGroundedFetch(
    `What are the latest displacement figures for ${country}? Provide: number of IDPs, number of refugees, source name, and date. Return as JSON.`,
    DisplacementSchema,
  );
}

// ── Economic Indicators ──────────────────────────────────────────────────────

const EconomicSchema = z.object({
  gdpGrowth: z.number().nullable(),
  inflation: z.number().nullable(),
  unemployment: z.number().nullable(),
  gniPerCapita: z.number().nullable(),
  source: z.string(),
  year: z.number(),
});

export async function fetchEconomicIndicators(countryCode: string): Promise<z.infer<typeof EconomicSchema> | null> {
  // World Bank
  const wbResult = await worldbankBreaker.execute(
    async () => {
      const indicators = ['NY.GDP.MKTP.KD.ZG', 'FP.CPI.TOTL.ZG', 'SL.UEM.TOTL.ZS', 'NY.GNP.PCAP.CD'];
      const results = await Promise.all(indicators.map(async (ind) => {
        const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${ind}?format=json&mrv=1`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) return null;
        const data = await res.json();
        return data[1]?.[0]?.value ?? null;
      }));
      return {
        gdpGrowth: results[0] !== null ? Number(results[0]) : null,
        inflation: results[1] !== null ? Number(results[1]) : null,
        unemployment: results[2] !== null ? Number(results[2]) : null,
        gniPerCapita: results[3] !== null ? Number(results[3]) : null,
        source: 'World Bank',
        year: new Date().getFullYear() - 1,
      };
    },
    async () => null,
  );
  if (wbResult) return wbResult;

  return geminiGroundedFetch(
    `What are the latest economic indicators for ${countryCode}? Provide GDP growth rate, inflation rate, unemployment rate, GNI per capita, and the data year. Return as JSON.`,
    EconomicSchema,
  );
}

// ── News Articles ────────────────────────────────────────────────────────────

const NewsSchema = z.object({
  articles: z.array(z.object({
    title: z.string(),
    source: z.string(),
    url: z.string().optional(),
    publishedDate: z.string().optional(),
    summary: z.string(),
    tone: z.number().optional(), // GDELT tone score
  })).max(20),
});

export async function fetchNewsArticles(query: string, country: string): Promise<z.infer<typeof NewsSchema>['articles']> {
  // GDELT
  const gdeltResult = await gdeltBreaker.execute(
    async () => {
      const q = encodeURIComponent(`${query} ${country}`);
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=ArtList&maxrecords=20&format=json`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`GDELT ${res.status}`);
      const data = await res.json();
      return (data.articles ?? []).slice(0, 15).map((a: Record<string, unknown>) => ({
        title: String(a.title ?? ''),
        source: String(a.domain ?? ''),
        url: String(a.url ?? ''),
        publishedDate: String(a.seendate ?? '').slice(0, 10),
        summary: String(a.title ?? ''),
        tone: a.tone ? Number(a.tone) : undefined,
      }));
    },
    async () => [],
  );
  if (gdeltResult.length > 0) return gdeltResult;

  // Gemini grounded
  const grounded = await geminiGroundedFetch(
    `Find the 10 most recent and significant news articles about "${query}" in ${country}. For each: title, source name, publication date, brief summary. Return as JSON.`,
    NewsSchema,
  );
  return grounded?.articles ?? [];
}
