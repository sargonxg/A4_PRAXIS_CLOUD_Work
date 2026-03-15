/**
 * Research Service — Client-side abstraction for PRAXIS research API routes.
 *
 * Provides typed helpers that call:
 *   - /api/ai/deep-research  (Google Search grounded multi-step pipeline)
 *   - /api/ai/claude-analyze (Anthropic Claude deep analysis)
 *
 * All methods return a ReadableStream<string> for progressive UI rendering.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ResearchMode = 'briefing' | 'background' | 'media-scan' | 'actor-profile';
export type ResearchDepth = 'quick' | 'standard' | 'comprehensive';
export type AnalysisType = 'diplomatic' | 'bias' | 'geopolitical' | 'legal';

export interface ResearchRequest {
  topic: string;
  mode: ResearchMode;
  depth?: ResearchDepth;
  context?: string;
  conflictId?: string;
}

export interface AnalysisRequest {
  query: string;
  analysisType?: AnalysisType;
  context?: string;
}

export interface ResearchResult {
  stream: ReadableStream<Uint8Array>;
  provider: string;
  model: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchStream(
  url: string,
  body: Record<string, unknown>,
): Promise<ResearchResult> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error ?? `Request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  return {
    stream: response.body,
    provider: response.headers.get('X-AI-Provider') ?? 'google',
    model: response.headers.get('X-AI-Model') ?? 'unknown',
  };
}

/**
 * Reads a text stream and calls onChunk with accumulated text.
 * Returns the full accumulated text when done.
 */
export async function consumeStream(
  stream: ReadableStream<Uint8Array>,
  onChunk: (accumulated: string) => void,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    onChunk(accumulated);
  }

  return accumulated;
}

// ---------------------------------------------------------------------------
// Research API
// ---------------------------------------------------------------------------

/**
 * Conduct briefing research — structured diplomatic briefing preparation.
 */
export function conductBriefingResearch(
  topic: string,
  context?: string,
): Promise<ResearchResult> {
  return fetchStream('/api/ai/deep-research', {
    topic,
    mode: 'briefing',
    depth: 'standard',
    context,
  });
}

/**
 * Conduct background research — deep background on actors, conflicts, or topics.
 */
export function conductBackgroundResearch(
  topic: string,
  scope?: string,
): Promise<ResearchResult> {
  return fetchStream('/api/ai/deep-research', {
    topic,
    mode: 'background',
    depth: 'comprehensive',
    context: scope,
  });
}

/**
 * Conduct media scan — scan media coverage of a topic across outlets.
 */
export function conductMediaScan(
  topic: string,
  sources?: string[],
  timeframe?: string,
): Promise<ResearchResult> {
  return fetchStream('/api/ai/deep-research', {
    topic,
    mode: 'media-scan',
    depth: 'standard',
    context: [
      sources?.length ? `Focus on: ${sources.join(', ')}` : '',
      timeframe ? `Timeframe: ${timeframe}` : '',
    ].filter(Boolean).join('. '),
  });
}

/**
 * Generate a research report from a topic with full depth.
 */
export function generateResearchReport(
  topic: string,
  context?: string,
): Promise<ResearchResult> {
  return fetchStream('/api/ai/deep-research', {
    topic,
    mode: 'briefing',
    depth: 'comprehensive',
    context,
  });
}

// ---------------------------------------------------------------------------
// Analysis API (Claude / Gemini fallback)
// ---------------------------------------------------------------------------

/**
 * Request deep analysis — uses Claude when available, Gemini otherwise.
 */
export function requestAnalysis(
  query: string,
  analysisType: AnalysisType = 'diplomatic',
  context?: string,
): Promise<ResearchResult> {
  return fetchStream('/api/ai/claude-analyze', {
    query,
    analysisType,
    context,
  });
}

/**
 * Request diplomatic analysis.
 */
export function analyzeDiplomatically(
  query: string,
  context?: string,
): Promise<ResearchResult> {
  return requestAnalysis(query, 'diplomatic', context);
}

/**
 * Request media bias analysis.
 */
export function analyzeBias(
  query: string,
  context?: string,
): Promise<ResearchResult> {
  return requestAnalysis(query, 'bias', context);
}

/**
 * Request geopolitical analysis.
 */
export function analyzeGeopolitically(
  query: string,
  context?: string,
): Promise<ResearchResult> {
  return requestAnalysis(query, 'geopolitical', context);
}

/**
 * Request international law analysis.
 */
export function analyzeLegally(
  query: string,
  context?: string,
): Promise<ResearchResult> {
  return requestAnalysis(query, 'legal', context);
}
