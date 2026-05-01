import type {
  CanonicalSourceReceipt,
  SourceReceiptConfidence,
  SourceReceiptKind,
  SourceReceiptRetrievalMethod,
} from '@/types/source-receipt';

export function normalizeSourceReceipts(values: unknown[] | undefined | null): CanonicalSourceReceipt[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value, index) => normalizeSourceReceipt(value, index))
    .filter((receipt): receipt is CanonicalSourceReceipt => Boolean(receipt));
}

export function normalizeSourceReceipt(value: unknown, index = 0): CanonicalSourceReceipt | null {
  if (!isRecord(value)) return null;

  const title = readString(value, 'title') ?? readString(value, 'name') ?? readString(value, 'source') ?? readString(value, 'url');
  if (!title) return null;

  const url = readString(value, 'url');
  const provider = readString(value, 'provider') ?? readString(value, 'retrievalProvider') ?? 'unknown';
  const source = readString(value, 'source') ?? hostFromUrl(url) ?? provider;
  const kind = normalizeKind(readString(value, 'kind'));
  const retrievalMethod = normalizeRetrievalMethod(readString(value, 'retrievalMethod'), kind);
  const confidence = normalizeConfidence(readString(value, 'confidence'));
  const reliabilityScore = normalizeReliability(value.reliabilityScore ?? value.confidenceScore);
  const timestamp = readString(value, 'timestamp') ?? readString(value, 'retrievedAt') ?? readString(value, 'generatedAt') ?? new Date(0).toISOString();
  const excerpt = readString(value, 'excerpt') ?? readString(value, 'quote') ?? readString(value, 'snippet');
  const contentHash = readString(value, 'contentHash') ?? stableId([url, title, excerpt].filter(Boolean).join('|'), 'hash');
  const sourceId = readString(value, 'sourceId') ?? stableId(url ?? `${provider}:${source}:${title}`, 'src');
  const receiptId = readString(value, 'receiptId') ?? readString(value, 'citation_id') ?? stableId(`${sourceId}:${timestamp}:${index}`, 'rcpt');

  return {
    receiptId,
    sourceId,
    name: readString(value, 'name') ?? source,
    title,
    url,
    provider,
    source,
    kind,
    retrievalMethod,
    timestamp,
    publishedDate: readString(value, 'publishedDate') ?? readString(value, 'published_at'),
    query: readString(value, 'query') ?? readString(value, 'retrievalQuery'),
    reliabilityScore,
    confidence,
    excerpt,
    contentHash,
    span: normalizeSpan(value.span, excerpt),
    graphPath: Array.isArray(value.graphPath) ? value.graphPath.filter((item): item is string => typeof item === 'string') : undefined,
    advisorId: readString(value, 'advisorId') ?? readString(value, 'advisor_id'),
    toolRunId: readString(value, 'toolRunId') ?? readString(value, 'tool_run_id'),
  };
}

function normalizeKind(kind?: string): SourceReceiptKind {
  if (kind === 'web-result' || kind === 'scraped-excerpt' || kind === 'structured-data' || kind === 'document' || kind === 'tool-output') {
    return kind;
  }
  return 'web-result';
}

function normalizeRetrievalMethod(method: string | undefined, kind: SourceReceiptKind): SourceReceiptRetrievalMethod {
  if (
    method === 'web_search' ||
    method === 'scrape' ||
    method === 'structured_data' ||
    method === 'document' ||
    method === 'tool' ||
    method === 'vector' ||
    method === 'bm25' ||
    method === 'graph_path' ||
    method === 'user_upload'
  ) {
    return method;
  }
  if (kind === 'scraped-excerpt') return 'scrape';
  if (kind === 'structured-data') return 'structured_data';
  if (kind === 'document') return 'document';
  if (kind === 'tool-output') return 'tool';
  return 'web_search';
}

function normalizeConfidence(value?: string): SourceReceiptConfidence {
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return 'low';
}

function normalizeReliability(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0.5;
  return Math.max(0, Math.min(1, numeric));
}

function normalizeSpan(value: unknown, fallbackQuote?: string) {
  if (isRecord(value)) {
    return {
      start: typeof value.start === 'number' ? value.start : undefined,
      end: typeof value.end === 'number' ? value.end : undefined,
      quote: readString(value, 'quote') ?? fallbackQuote,
    };
  }
  if (fallbackQuote) return { quote: fallbackQuote };
  return undefined;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hostFromUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function stableId(input: string, prefix: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return `${prefix}_${hash.toString(36)}`;
}
