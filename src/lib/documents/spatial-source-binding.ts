import { createHash } from 'crypto';
import { GoogleAuth } from 'google-auth-library';
import type {
  DocumentLayoutChunk,
  SpatialBoundingBox,
  SpatialCitationRef,
  SpatialSourceBinding,
} from '@/types/spatial-source';

type SpatialBindingInput = {
  ownerUid: string;
  situationId: string;
  documentId: string;
  sourceReceiptId?: string | null;
  filename: string;
  fileType: string;
  mimeType?: string | null;
  text: string;
  fileBuffer?: Buffer;
  now?: Date;
};

type DocumentAiLayoutBlock = {
  textBlock?: { text?: string };
  pageSpan?: { pageStart?: number; pageEnd?: number };
  boundingBox?: {
    normalizedVertices?: Array<{ x?: number; y?: number }>;
  };
};

type DocumentAiResponse = {
  document?: {
    text?: string;
    chunkedDocument?: {
      chunks?: Array<{
        chunkId?: string;
        content?: string;
        pageSpan?: { pageStart?: number; pageEnd?: number };
      }>;
    };
    documentLayout?: {
      blocks?: DocumentAiLayoutBlock[];
    };
  };
};

export function isDocumentAiLayoutParserConfigured(): boolean {
  return Boolean(
    process.env.DOCUMENT_AI_LAYOUT_PROCESSOR_ID
      && (process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT)
      && process.env.DOCUMENT_AI_LOCATION,
  );
}

export async function buildSpatialSourceBinding(input: SpatialBindingInput): Promise<SpatialSourceBinding> {
  if (
    process.env.DOCUMENT_AI_LAYOUT_PARSER_ENABLED === 'true'
    && input.fileType === 'pdf'
    && input.fileBuffer
    && isDocumentAiLayoutParserConfigured()
  ) {
    try {
      const parsed = await parseWithDocumentAiLayoutParser(input);
      if (parsed.chunks.length > 0) return parsed;
    } catch (err) {
      console.warn('[spatial-source-binding] Document AI layout parser failed; using text fallback.', err);
    }
  }
  return buildFallbackSpatialSourceBinding(input);
}

export function buildFallbackSpatialSourceBinding(input: SpatialBindingInput): SpatialSourceBinding {
  const now = (input.now ?? new Date()).toISOString();
  const normalized = input.text.trim().replace(/\s+/g, ' ');
  const chunks = splitTextIntoCitationChunks(normalized).map((text, index): DocumentLayoutChunk => {
    const chunkId = `${input.documentId}:chunk-${index + 1}`;
    const textStart = normalized.indexOf(text);
    const textEnd = textStart >= 0 ? textStart + text.length : undefined;
    const citationRef = makeSpatialCitationRef({
      documentId: input.documentId,
      chunkId,
      sourceReceiptId: input.sourceReceiptId,
      text,
      pageNumber: input.fileType === 'pdf' ? 1 : undefined,
      confidence: 0.45,
    });
    return {
      chunkId,
      pageNumber: citationRef.pageNumber,
      text,
      textStart: textStart >= 0 ? textStart : undefined,
      textEnd,
      citationRef,
      metadata: { parser: 'fallback-text' },
    };
  });

  return {
    documentId: input.documentId,
    parser: 'fallback-text',
    parserVersion: 'fallback-text-v1',
    status: chunks.length > 0 ? 'text-only' : 'unavailable',
    chunks,
    createdAt: now,
    metadata: {
      filename: input.filename,
      fileType: input.fileType,
      ownerUid: input.ownerUid,
      situationId: input.situationId,
      spatialCoordinates: false,
    },
  };
}

export function makeSpatialCitationRef(input: {
  documentId: string;
  chunkId: string;
  sourceReceiptId?: string | null;
  pageNumber?: number;
  coords?: SpatialBoundingBox;
  text: string;
  confidence: number;
}): SpatialCitationRef {
  return {
    cid: `#${shortHash(`${input.documentId}:${input.chunkId}:${input.text}`).slice(0, 8)}`,
    documentId: input.documentId,
    chunkId: input.chunkId,
    sourceReceiptId: input.sourceReceiptId ?? undefined,
    pageNumber: input.pageNumber,
    coords: input.coords,
    textPreview: input.text.trim().replace(/\s+/g, ' ').slice(0, 500),
    quoteHash: shortHash(input.text),
    confidence: clamp01(input.confidence),
  };
}

export function normalizeBoundingBox(vertices: Array<{ x?: number; y?: number }> | undefined): SpatialBoundingBox | undefined {
  if (!Array.isArray(vertices) || vertices.length === 0) return undefined;
  const xs = vertices.map((vertex) => vertex.x).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const ys = vertices.map((vertex) => vertex.y).filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (xs.length === 0 || ys.length === 0) return undefined;
  const minX = clamp01(Math.min(...xs));
  const maxX = clamp01(Math.max(...xs));
  const minY = clamp01(Math.min(...ys));
  const maxY = clamp01(Math.max(...ys));
  return {
    x: minX,
    y: minY,
    width: clamp01(maxX - minX),
    height: clamp01(maxY - minY),
  };
}

async function parseWithDocumentAiLayoutParser(input: SpatialBindingInput): Promise<SpatialSourceBinding> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const location = process.env.DOCUMENT_AI_LOCATION;
  const processorId = process.env.DOCUMENT_AI_LAYOUT_PROCESSOR_ID;
  if (!projectId || !location || !processorId || !input.fileBuffer) {
    return buildFallbackSpatialSourceBinding(input);
  }

  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const endpoint = `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rawDocument: {
        content: input.fileBuffer.toString('base64'),
        mimeType: input.mimeType || 'application/pdf',
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Document AI layout parser failed with ${response.status}: ${await response.text()}`);
  }

  const payload = (await response.json()) as DocumentAiResponse;
  const blocks = payload.document?.documentLayout?.blocks ?? [];
  const chunksFromBlocks = blocks
    .map((block, index) => blockToLayoutChunk(input, block, index))
    .filter((chunk): chunk is DocumentLayoutChunk => Boolean(chunk))
    .slice(0, 250);
  const fallbackChunks = payload.document?.chunkedDocument?.chunks
    ?.map((chunk, index) => chunkToLayoutChunk(input, chunk, index))
    .filter((chunk): chunk is DocumentLayoutChunk => Boolean(chunk))
    .slice(0, 250) ?? [];
  const chunks = chunksFromBlocks.length > 0 ? chunksFromBlocks : fallbackChunks;

  return {
    documentId: input.documentId,
    parser: 'document-ai-layout-parser',
    parserVersion: process.env.DOCUMENT_AI_LAYOUT_PROCESSOR_VERSION || 'processor-default',
    status: chunks.some((chunk) => chunk.coords) ? 'spatial' : 'text-only',
    chunks,
    createdAt: (input.now ?? new Date()).toISOString(),
    metadata: {
      filename: input.filename,
      fileType: input.fileType,
      ownerUid: input.ownerUid,
      situationId: input.situationId,
      spatialCoordinates: chunks.some((chunk) => chunk.coords),
    },
  };
}

function blockToLayoutChunk(input: SpatialBindingInput, block: DocumentAiLayoutBlock, index: number): DocumentLayoutChunk | null {
  const text = block.textBlock?.text?.trim().replace(/\s+/g, ' ');
  if (!text) return null;
  const pageNumber = normalizePageNumber(block.pageSpan?.pageStart);
  const coords = normalizeBoundingBox(block.boundingBox?.normalizedVertices);
  const chunkId = `${input.documentId}:layout-${index + 1}`;
  return {
    chunkId,
    pageNumber,
    text,
    coords,
    citationRef: makeSpatialCitationRef({
      documentId: input.documentId,
      chunkId,
      sourceReceiptId: input.sourceReceiptId,
      pageNumber,
      coords,
      text,
      confidence: coords ? 0.9 : 0.72,
    }),
    metadata: { parser: 'document-ai-layout-parser', blockIndex: index },
  };
}

function chunkToLayoutChunk(
  input: SpatialBindingInput,
  chunk: NonNullable<NonNullable<DocumentAiResponse['document']>['chunkedDocument']>['chunks'][number],
  index: number,
): DocumentLayoutChunk | null {
  const text = chunk.content?.trim().replace(/\s+/g, ' ');
  if (!text) return null;
  const pageNumber = normalizePageNumber(chunk.pageSpan?.pageStart);
  const chunkId = chunk.chunkId || `${input.documentId}:layout-chunk-${index + 1}`;
  return {
    chunkId,
    pageNumber,
    text,
    citationRef: makeSpatialCitationRef({
      documentId: input.documentId,
      chunkId,
      sourceReceiptId: input.sourceReceiptId,
      pageNumber,
      text,
      confidence: 0.72,
    }),
    metadata: { parser: 'document-ai-layout-parser', chunkIndex: index },
  };
}

function splitTextIntoCitationChunks(text: string): string[] {
  if (!text) return [];
  const max = 900;
  const chunks: string[] = [];
  for (let offset = 0; offset < text.length && chunks.length < 80; offset += max) {
    chunks.push(text.slice(offset, offset + max).trim());
  }
  return chunks.filter(Boolean);
}

function normalizePageNumber(value: unknown): number | undefined {
  const page = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(page) && page > 0 ? page : undefined;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function shortHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
