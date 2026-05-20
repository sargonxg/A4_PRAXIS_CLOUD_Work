export const EXA_SEARCH_ENDPOINT = 'https://api.exa.ai/search';

export type ExaSearchType = 'auto' | 'fast' | 'instant' | 'deep-lite' | 'deep' | 'deep-reasoning';

export interface ExaAgenticSearchInput {
  query: string;
  type?: string | null;
  numResults?: number | null;
  includeDomains?: string[] | null;
  excludeDomains?: string[] | null;
  maxAgeHours?: number | null;
  outputSchema?: Record<string, unknown> | null;
  systemPrompt?: string | null;
}

export interface ExaAgenticSearchResult {
  requestId?: string;
  searchType?: string;
  costDollars?: unknown;
  results?: Array<{
    title?: string | null;
    url?: string | null;
    id?: string | null;
    publishedDate?: string | null;
    author?: string | null;
    highlights?: string[];
    highlightScores?: number[];
    summary?: string | null;
  }>;
  output?: {
    content?: unknown;
    grounding?: Array<{
      field?: string;
      citations?: Array<{ url?: string; title?: string }>;
      confidence?: string;
    }>;
  };
}

const EXA_SEARCH_TYPES = new Set<ExaSearchType>(['auto', 'fast', 'instant', 'deep-lite', 'deep', 'deep-reasoning']);

export function normalizeExaSearchType(value: string | null | undefined): ExaSearchType {
  return EXA_SEARCH_TYPES.has(value as ExaSearchType) ? value as ExaSearchType : 'auto';
}

export function buildExaAgenticSearchRequest(input: ExaAgenticSearchInput) {
  const query = input.query.trim().slice(0, 1000);
  const numResults = Math.min(20, Math.max(1, Math.floor(input.numResults ?? 8)));
  const contents: Record<string, unknown> = { highlights: true };
  if (typeof input.maxAgeHours === 'number' && Number.isFinite(input.maxAgeHours)) {
    contents.maxAgeHours = Math.max(-1, Math.floor(input.maxAgeHours));
  }

  return {
    query,
    type: normalizeExaSearchType(input.type),
    numResults,
    ...(normalizedDomains(input.includeDomains).length ? { includeDomains: normalizedDomains(input.includeDomains) } : {}),
    ...(normalizedDomains(input.excludeDomains).length ? { excludeDomains: normalizedDomains(input.excludeDomains) } : {}),
    ...(input.systemPrompt?.trim() ? { systemPrompt: input.systemPrompt.trim().slice(0, 1200) } : {}),
    ...(input.outputSchema ? { outputSchema: input.outputSchema } : {}),
    contents,
  };
}

export async function runExaAgenticSearch(input: ExaAgenticSearchInput, env: Record<string, string | undefined> = process.env) {
  const apiKey = env.EXA_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false as const,
      requiresKey: 'EXA_API_KEY',
      message: 'Exa agentic search is configured as a paid extra but EXA_API_KEY is not set on the server.',
    };
  }

  const requestBody = buildExaAgenticSearchRequest(input);
  const response = await fetch(EXA_SEARCH_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      error: typeof payload?.error === 'string' ? payload.error : 'exa_search_failed',
      message: 'Exa search failed before PRAXIS could attach source receipts.',
    };
  }

  return {
    ok: true as const,
    request: requestBody,
    response: summarizeExaSearchResponse(payload as ExaAgenticSearchResult),
    _generatedAt: new Date().toISOString(),
  };
}

export function summarizeExaSearchResponse(payload: ExaAgenticSearchResult) {
  return {
    requestId: payload.requestId ?? null,
    searchType: payload.searchType ?? null,
    results: (payload.results ?? []).slice(0, 20).map((result) => ({
      title: result.title ?? '',
      url: result.url ?? '',
      id: result.id ?? result.url ?? '',
      publishedDate: result.publishedDate ?? null,
      author: result.author ?? null,
      highlights: (result.highlights ?? []).slice(0, 5),
      highlightScores: (result.highlightScores ?? []).slice(0, 5),
      summary: result.summary ?? null,
    })),
    output: payload.output
      ? {
          content: payload.output.content ?? null,
          grounding: (payload.output.grounding ?? []).slice(0, 20).map((entry) => ({
            field: entry.field ?? '',
            citations: (entry.citations ?? []).slice(0, 5).map((citation) => ({
              url: citation.url ?? '',
              title: citation.title ?? '',
            })),
            confidence: entry.confidence ?? 'medium',
          })),
        }
      : null,
  };
}

function normalizedDomains(value: string[] | null | undefined): string[] {
  return Array.from(new Set((value ?? [])
    .map((domain) => domain.trim().toLowerCase())
    .filter((domain) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain))))
    .slice(0, 50);
}
