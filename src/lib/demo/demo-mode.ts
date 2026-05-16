// ---------------------------------------------------------------------------
// Legacy compatibility utilities. Sample mode has been retired; these helpers
// remain so older API routes compile while returning live/user-owned behavior.
// ---------------------------------------------------------------------------

export function isDemoMode(): boolean {
  return false;
}

export function isServerDemoMode(): boolean {
  return false;
}

/**
 * Simple hash function for matching user inputs to cached responses.
 * Produces a lowercase, normalized string key from an input object.
 */
export function hashInput(input: object): string {
  const str = JSON.stringify(input).toLowerCase();

  // Check for greeting-like messages
  if (matchesPattern(str, ['hello', 'hi ', 'hey', 'good morning', 'good afternoon', 'good evening', 'welcome', 'help', 'what can you do'])) {
    return 'greeting';
  }

  // Check for key actors questions
  if (matchesPattern(str, ['key actors', 'main actors', 'who are the', 'actors in', 'parties to', 'stakeholders', 'key players'])) {
    return 'key_actors';
  }

  // Check for practical risk/evidence/mediation questions.
  if (
    matchesPattern(str, ['most important risk', 'biggest risk', 'primary risk', 'top risk', 'risk this week']) ||
    (matchesPattern(str, ['risk']) && matchesPattern(str, ['evidence', 'supports', 'mediator', 'ask next', 'what should']))
  ) {
    return 'risk_mediator';
  }

  // Check for ceasefire/scenario questions
  if (matchesPattern(str, ['ceasefire collapse', 'ceasefire fails', 'ceasefire breaks', 'what if the ceasefire', 'september ceasefire', 'what if ceasefire'])) {
    return 'ceasefire_collapse';
  }

  // Check for escalation assessment
  if (matchesPattern(str, ['escalation', 'glasl', 'escalation stage', 'escalation assessment', 'escalation model', 'how escalated'])) {
    return 'glasl_assessment';
  }

  // Check for talking points
  if (matchesPattern(str, ['talking points', 'security council', 'briefing points', 'unsc brief', 'council briefing', 'prepare brief'])) {
    return 'unsc_briefing';
  }

  // Check for morning brief / dashboard
  if (matchesPattern(str, ['morning brief', 'intelligence brief', 'daily brief', 'situation brief', 'morning intelligence'])) {
    return 'morning_brief';
  }

  // Check for ARGUS / knowledge graph queries
  if (matchesPattern(str, ['argus', 'knowledge graph', 'commitment chain', 'entity', 'graph query'])) {
    return 'argus_query';
  }

  // Check for CONCORDIA / mediation queries
  if (matchesPattern(str, ['concordia', 'mediation recommend', 'mediation round', 'mediation package'])) {
    return 'concordia_query';
  }

  // Check for Wind Tunnel / scenario simulation queries
  if (matchesPattern(str, ['wind tunnel', 'psychographic', 'tribe', 'civisphere'])) {
    return 'windtunnel_query';
  }

  // No match
  return '';
}

/**
 * Retrieves a cached response for a given route and input hash.
 * Returns undefined if no cached response is available.
 */
export function getCachedResponse(routeKey: string, inputHash: string): string | undefined {
  void routeKey;
  void inputHash;
  return undefined;
}

/**
 * Formats a cached response as a Vercel AI SDK text-stream response.
 * This makes the cached response indistinguishable from a live streamed response.
 */
export function formatAsStreamResponse(text: string): Response {
  // Vercel AI SDK text-stream format: each text chunk is prefixed with "0:"
  // followed by a JSON-encoded string, then a newline.
  const lines = splitIntoChunks(text, 80);
  const streamLines = [
    ...lines.map((chunk) => `0:${JSON.stringify(chunk)}\n`),
    `d:${JSON.stringify({ finishReason: 'stop' })}\n`,
  ].join('');

  return new Response(streamLines, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function matchesPattern(str: string, patterns: string[]): boolean {
  return patterns.some((p) => str.includes(p));
}

/**
 * Split text into chunks of approximately `size` characters,
 * breaking at word boundaries when possible.
 */
function splitIntoChunks(text: string, size: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= size) {
      chunks.push(remaining);
      break;
    }

    // Find the last space within the chunk size
    let breakPoint = remaining.lastIndexOf(' ', size);
    if (breakPoint <= 0) breakPoint = size;

    chunks.push(remaining.slice(0, breakPoint));
    remaining = remaining.slice(breakPoint);
  }

  return chunks;
}
