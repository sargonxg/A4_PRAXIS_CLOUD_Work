export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  groundingSupports?: GroundingSupport[];
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  retrievedContext?: {
    uri?: string;
    title?: string;
    text?: string;
  };
  [key: string]: unknown;
}

export interface GroundingSupport {
  segment?: {
    startIndex?: number;
    endIndex?: number;
    text?: string;
  };
  groundingChunkIndices?: number[];
  confidenceScores?: number[];
}

export interface InlineCitation {
  id: string;
  chunkIndex: number;
  title: string;
  uri: string;
  snippet?: string;
}

export interface InlineGroundingSupport {
  startIndex: number;
  endIndex: number;
  text: string;
  citationIds: string[];
  confidenceScores: number[];
}

export interface InlineCitationMap {
  textWithCitations: string;
  citations: InlineCitation[];
  supports: InlineGroundingSupport[];
}

export interface ClaimGroundingInput {
  claims: Array<{
    id: string;
    text: string;
    sourceIds: string[];
  }>;
  minSourcesPerClaim: number;
  maxUngroundedClaims: number;
}

export interface ClaimGroundingResult {
  status: 'pass' | 'fail';
  supportedClaims: string[];
  weakClaims: string[];
  unsupportedClaims: string[];
  failures: string[];
}

export function buildInlineCitationMap(text: string, metadata: GroundingMetadata | null | undefined): InlineCitationMap {
  const chunks = metadata?.groundingChunks ?? [];
  const citationByChunk = new Map<number, InlineCitation>();
  chunks.forEach((chunk, chunkIndex) => {
    const source = chunk.web ?? chunk.retrievedContext ?? {};
    const uri = cleanText(source.uri);
    const title = cleanText(source.title) || uri || `Grounding source ${chunkIndex + 1}`;
    if (!uri && !title) return;
    citationByChunk.set(chunkIndex, {
      id: `g${citationByChunk.size + 1}`,
      chunkIndex,
      title,
      uri,
      snippet: cleanText(chunk.retrievedContext?.text) || undefined,
    });
  });

  const normalizedSupports = (metadata?.groundingSupports ?? [])
    .map((support): InlineGroundingSupport | null => {
      const startIndex = safeIndex(support.segment?.startIndex);
      const endIndex = safeIndex(support.segment?.endIndex);
      if (endIndex <= startIndex || endIndex > text.length) return null;
      const citationIds = (support.groundingChunkIndices ?? [])
        .map((chunkIndex) => citationByChunk.get(chunkIndex)?.id)
        .filter((id): id is string => Boolean(id));
      return {
        startIndex,
        endIndex,
        text: cleanText(support.segment?.text) || text.slice(startIndex, endIndex),
        citationIds,
        confidenceScores: (support.confidenceScores ?? []).filter((score) => Number.isFinite(score)),
      };
    })
    .filter((support): support is InlineGroundingSupport => Boolean(support));

  const supportsForInsertion = [...normalizedSupports].sort((a, b) => b.endIndex - a.endIndex);
  let textWithCitations = text;
  for (const support of supportsForInsertion) {
    const marker = support.citationIds
      .map((id) => citationByIdIndex(id, Array.from(citationByChunk.values())))
      .filter((index) => index > 0)
      .map((index) => `[${index}]`)
      .join('');
    if (!marker) continue;
    textWithCitations = `${textWithCitations.slice(0, support.endIndex)} ${marker}${textWithCitations.slice(support.endIndex)}`;
  }

  return {
    textWithCitations,
    citations: Array.from(citationByChunk.values()),
    supports: supportsForInsertion,
  };
}

export function verifyClaimGrounding(input: ClaimGroundingInput): ClaimGroundingResult {
  const supportedClaims: string[] = [];
  const weakClaims: string[] = [];
  const unsupportedClaims: string[] = [];

  for (const claim of input.claims) {
    const sourceCount = new Set(claim.sourceIds.filter(Boolean)).size;
    if (sourceCount === 0) {
      unsupportedClaims.push(claim.id);
    } else if (sourceCount < input.minSourcesPerClaim) {
      weakClaims.push(claim.id);
    } else {
      supportedClaims.push(claim.id);
    }
  }

  const failures: string[] = [];
  if (unsupportedClaims.length > input.maxUngroundedClaims) {
    failures.push(`${unsupportedClaims.length} claim(s) have no supporting sources; maximum allowed is ${input.maxUngroundedClaims}.`);
  }
  if (weakClaims.length > 0) {
    failures.push(`${weakClaims.length} claim(s) have fewer than ${input.minSourcesPerClaim} source(s).`);
  }

  return {
    status: failures.length ? 'fail' : 'pass',
    supportedClaims,
    weakClaims,
    unsupportedClaims,
    failures,
  };
}

function citationByIdIndex(id: string, citations: InlineCitation[]): number {
  return citations.findIndex((citation) => citation.id === id) + 1;
}

function safeIndex(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
