/**
 * Firestore-backed document service for the PRAXIS RAG pipeline.
 *
 * Data model:
 *   users/{uid}/situations/{sitId}/documents/{docId}
 *     - metadata (title, type, size, status, uploadedAt)
 *     - text (full extracted text)
 *     - entities (ACO extraction results)
 *
 *   users/{uid}/situations/{sitId}/documents/{docId}/chunks/{chunkId}
 *     - text (chunk content)
 *     - index (position in original document)
 *     - metadata (source doc title, page number if available)
 *
 * Chunks are stored as a subcollection for efficient retrieval.
 * Embeddings are stored inline on the chunk document for simplicity.
 */

import { getAdminDbOrThrow } from './admin';
import { FieldValue } from 'firebase-admin/firestore';
import { embed, embedMany } from 'ai';
import { getEmbeddingModel, hasServerAiProvider } from '@/lib/ai/providers';
import type { AutoStructuredDocument } from '@/lib/documents/auto-structure';
import { assertDocumentTextSize, DocumentIngestionError, DOCUMENT_LIMITS } from '@/lib/documents/ingestion-policy';
import { documentTextIdentity } from '@/lib/documents/upload-identity';
import { assertDocumentOwnerWritable, withDocumentOwnerWrite } from '@/lib/documents/owner-write';

export interface StoredDocument {
  id: string;
  ownerUid?: string;
  title: string;
  fileType: string;
  size: number;
  text: string;
  status: 'uploaded' | 'processing' | 'extracted' | 'error';
  uploadedAt: string;
  entities?: Record<string, unknown>;
  entityCount: number;
  chunkCount?: number;
  ingestionRunId?: string;
  ingestionStatus?: string;
  bucketUri?: string;
  structured?: AutoStructuredDocument;
  indexing?: {
    status: 'pending' | 'indexing' | 'indexed' | 'keyword_only' | 'failed';
    textHash: string;
    nextChunk: number;
    chunkCount: number;
    updatedAt: string;
    error?: string;
    retrievalMode?: 'hybrid' | 'keyword_only';
  };
  uploadCompletion?: { fingerprint: string; result: Record<string, unknown> };
  sourceCore?: {
    id: string;
    situationId: string;
    documentId: string;
    title: string;
    sourceType: string;
    linkedAt: string;
    sourceReceiptId?: string;
    ingestionRunId?: string;
  };
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  text: string;
  index: number;
  charStart: number;
  charEnd: number;
  embedding?: number[]; // Canonical embedding vector (768 dimensions)
  textHash?: string;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

// ---------------------------------------------------------------------------
// Document CRUD
// ---------------------------------------------------------------------------

function docsCollection(uid: string, situationId: string) {
  const db = getAdminDbOrThrow();
  return db.collection('users').doc(uid).collection('situations').doc(situationId).collection('documents');
}

function chunksCollection(uid: string, situationId: string, docId: string) {
  return docsCollection(uid, situationId).doc(docId).collection('chunks');
}

export async function saveDocument(
  uid: string,
  situationId: string,
  doc: Omit<StoredDocument, 'id'>,
  options: { documentId?: string } = {},
): Promise<StoredDocument> {
  const ref = options.documentId ? docsCollection(uid, situationId).doc(options.documentId) : docsCollection(uid, situationId).doc();
  const stored: StoredDocument = { ...doc, id: ref.id, ownerUid: uid };
  const db = getAdminDbOrThrow();
  const sitRef = db.collection('users').doc(uid).collection('situations').doc(situationId);
  return withDocumentOwnerWrite(uid, async (transaction) => {
    if (options.documentId) {
      const existing = await transaction.get(ref);
      if (existing.exists) {
        const previous = existing.data() as StoredDocument;
        if (!documentOwnedBy(previous, uid)) throw new Error('Document owner does not match the upload owner');
        return withPathOwner({ ...previous, id: ref.id }, uid);
      }
    }
    transaction.set(ref, stored);
    transaction.update(sitRef, { documentCount: FieldValue.increment(1) });
    return stored;
  }, db);
}

export async function getDocumentById(
  uid: string,
  situationId: string,
  docId: string
): Promise<StoredDocument | null> {
  const snap = await docsCollection(uid, situationId).doc(docId).get();
  if (!snap.exists) return null;
  const data = snap.data() as StoredDocument;
  return documentOwnedBy(data, uid) ? withPathOwner(data, uid) : null;
}

export async function listDocuments(
  uid: string,
  situationId: string
): Promise<StoredDocument[]> {
  const snap = await docsCollection(uid, situationId)
    .orderBy('uploadedAt', 'desc')
    .limit(100)
    .get();
  return snap.docs
    .map((d) => d.data() as StoredDocument)
    .filter((doc) => documentOwnedBy(doc, uid))
    .map((doc) => withPathOwner(doc, uid));
}

export async function updateDocumentStatus(
  uid: string,
  situationId: string,
  docId: string,
  status: StoredDocument['status'],
  updates?: Partial<StoredDocument>
): Promise<void> {
  await updateDocumentIngestionMetadata(uid, situationId, docId, { status, ...updates });
}

export class DocumentWriteUnavailableError extends Error {
  readonly status = 409;
  readonly code = 'DOCUMENT_UNAVAILABLE';
}

/** Final writes must neither recreate an erased document nor bypass owner deletion. */
export async function updateDocumentIngestionMetadata(uid: string, situationId: string, docId: string,
  updates: Partial<StoredDocument>,
): Promise<void> {
  const ref = docsCollection(uid, situationId).doc(docId);
  await withDocumentOwnerWrite(uid, async (transaction) => {
    const current = await transaction.get(ref);
    if (!current.exists || !documentOwnedBy(current.data() as StoredDocument, uid)) {
      throw new DocumentWriteUnavailableError('The document is unavailable for ingestion writes.');
    }
    transaction.set(ref, { ...updates, id: ref.id, ownerUid: uid }, { merge: true });
  });
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

/**
 * Simple sentence-aware chunking with overlap.
 * Splits text into chunks of ~1500 chars with 200 char overlap.
 */
export function chunkText(
  text: string,
  opts: { maxLength?: number; overlap?: number } = {}
): { text: string; charStart: number; charEnd: number }[] {
  const maxLength = opts.maxLength ?? 1500;
  const overlap = opts.overlap ?? 200;

  if (!Number.isSafeInteger(maxLength) || maxLength <= 0) {
    throw new RangeError('maxLength must be a positive safe integer.');
  }
  if (!Number.isSafeInteger(overlap) || overlap < 0 || overlap >= maxLength) {
    throw new RangeError('overlap must be a nonnegative safe integer smaller than maxLength.');
  }

  if (text.length <= maxLength) {
    return [{ text, charStart: 0, charEnd: text.length }];
  }

  const chunks: { text: string; charStart: number; charEnd: number }[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + maxLength, text.length);

    // Try to break at sentence boundary
    if (end < text.length) {
      const slice = text.slice(start, end);
      const lastPeriod = slice.lastIndexOf('. ');
      const lastNewline = slice.lastIndexOf('\n');
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > maxLength * 0.5) {
        end = start + breakPoint + 1;
      }
    }

    chunks.push({
      text: text.slice(start, end).trim(),
      charStart: start,
      charEnd: end,
    });

    if (end === text.length) break;

    // Sentence shortening must not let a large overlap move backwards.
    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}

/**
 * Chunk a document, generate embeddings, and save to Firestore.
 * Uses the shared provider embedding model for semantic search.
 * Falls back gracefully if embedding generation fails.
 */
export async function chunkAndSaveDocument(
  uid: string,
  situationId: string,
  docId: string,
  docTitle: string,
  fullText: string
): Promise<number> {
  await assertDocumentOwnerWritable(uid);
  assertDocumentTextSize(fullText);
  const chunks = chunkText(fullText);
  if (chunks.length > DOCUMENT_LIMITS.chunks) {
    throw new DocumentIngestionError(`The source exceeds ${DOCUMENT_LIMITS.chunks} text chunks. Split it into smaller documents.`);
  }
  const col = chunksCollection(uid, situationId, docId);
  const docRef = docsCollection(uid, situationId).doc(docId);
  const previous = (await docRef.get()).data() as StoredDocument | undefined;
  if (previous && !documentOwnedBy(previous, uid)) throw new Error('Document owner does not match indexing owner');
  const textHash = documentTextIdentity(fullText);
  const checkpoint = previous?.indexing?.textHash === textHash ? previous.indexing : undefined;
  if (checkpoint && ['indexed', 'keyword_only'].includes(checkpoint.status) && checkpoint.nextChunk === chunks.length) return chunks.length;
  const start = checkpoint ? Math.max(0, Math.min(chunks.length, checkpoint.nextChunk)) : 0;
  let keywordOnly = checkpoint?.status === 'keyword_only' || checkpoint?.retrievalMode === 'keyword_only';
  const progress = (status: NonNullable<StoredDocument['indexing']>['status'], nextChunk: number, error?: string) => ({
    status, textHash, nextChunk, chunkCount: chunks.length, retrievalMode: keywordOnly ? 'keyword_only' as const : 'hybrid' as const,
    updatedAt: new Date().toISOString(), ...(error ? { error } : {}),
  });
  await updateDocumentIngestionMetadata(uid, situationId, docId, { indexing: progress('indexing', start) });
  let nextChunk = start;
  try {
    for (let offset = start; offset < chunks.length; offset += DOCUMENT_LIMITS.embeddingBatch) {
      const slice = chunks.slice(offset, offset + DOCUMENT_LIMITS.embeddingBatch);
      let embeddings: number[][] | null = null;
      try {
        const embeddingModel = hasServerAiProvider() ? getEmbeddingModel() : null;
        if (embeddingModel) embeddings = (await embedMany({ model: embeddingModel, values: slice.map((chunk) => chunk.text) })).embeddings;
        else keywordOnly = true;
      } catch (err) {
        keywordOnly = true;
        console.warn('[documents] Embedding batch failed; keyword retrieval remains available:', err);
      }
      const committedThrough = offset + slice.length;
      await withDocumentOwnerWrite(uid, async (transaction) => {
        const current = await transaction.get(docRef);
        if (!current.exists || !documentOwnedBy(current.data() as StoredDocument, uid)) {
          throw new DocumentWriteUnavailableError('The document is unavailable for ingestion writes.');
        }
        for (let i = 0; i < slice.length; i++) {
        // Repeating a committed batch after response loss replaces the same chunks.
        const ref = col.doc(`chunk-${textHash.slice(0, 16)}-${String(offset + i).padStart(4, '0')}`);
        transaction.set(ref, { id: ref.id, documentId: docId, documentTitle: docTitle, textHash,
          text: slice[i].text, index: offset + i, charStart: slice[i].charStart, charEnd: slice[i].charEnd,
          ...(embeddings?.[i] ? { embedding: embeddings[i] } : {}) } satisfies DocumentChunk);
        }
        transaction.set(docRef, { indexing: progress('indexing', committedThrough) }, { merge: true });
      });
      nextChunk = committedThrough;
    }
    await updateDocumentIngestionMetadata(uid, situationId, docId, { chunkCount: chunks.length, indexing: progress(keywordOnly ? 'keyword_only' : 'indexed', chunks.length) });
  } catch (err) {
    await updateDocumentIngestionMetadata(uid, situationId, docId, { indexing: progress('failed', nextChunk, 'Indexing was interrupted. Retry this upload to resume.') }).catch(() => undefined);
    throw err;
  }

  return chunks.length;
}

// ---------------------------------------------------------------------------
// Retrieval (keyword-based for now, embeddings can be added later)
// ---------------------------------------------------------------------------

/**
 * Hybrid retrieval: uses vector cosine similarity when embeddings are available,
 * falls back to keyword overlap scoring otherwise.
 * Combines both signals for best results.
 */
export async function retrieveRelevantChunks(
  uid: string,
  situationId: string,
  query: string,
  opts: { maxChunks?: number; documentIds?: string[] } = {}
): Promise<DocumentChunk[]> {
  const maxChunks = Math.max(1, Math.min(50, Math.floor(opts.maxChunks ?? 5)));

  // Explicit capsule selections are authoritative, including older documents
  // outside the recent-document catalogue. Scope before scoring or top-K.
  const docs = opts.documentIds === undefined
    ? await listDocuments(uid, situationId)
    : (await Promise.all(Array.from(new Set(opts.documentIds))
      .filter((id) => id.length > 0 && !id.includes('/'))
      .map((id) => getDocumentById(uid, situationId, id))))
      .filter((doc): doc is StoredDocument => Boolean(doc));
  if (docs.length === 0) return [];

  // Generate query embedding if API key is available
  let queryEmbedding: number[] | null = null;
  try {
    const embeddingModel = hasServerAiProvider() ? getEmbeddingModel() : null;
    if (embeddingModel) {
      const result = await embed({ model: embeddingModel, value: query });
      queryEmbedding = result.embedding;
    }
  } catch {
    // Fall back to keyword-only
  }

  // Collect all chunks across documents
  const allChunks: (DocumentChunk & { score: number })[] = [];
  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  for (const doc of docs) {
    const snap = await chunksCollection(uid, situationId, doc.id).orderBy('index').get();

    for (const chunkSnap of snap.docs) {
      const chunk = chunkSnap.data() as DocumentChunk;
      if (chunk.documentId !== doc.id || typeof chunk.text !== 'string') continue;
      if (doc.indexing?.textHash && chunk.textHash !== doc.indexing.textHash) continue;
      const lowerText = chunk.text.toLowerCase();

      // Keyword score (always computed)
      let keywordScore = 0;
      for (const term of queryTerms) {
        const matches = lowerText.split(term).length - 1;
        keywordScore += matches;
      }

      // Vector similarity score (when both query and chunk have embeddings)
      let vectorScore = 0;
      if (queryEmbedding && chunk.embedding) {
        vectorScore = cosineSimilarity(queryEmbedding, chunk.embedding);
      }

      // Combined score: vector similarity (weighted 0.7) + keyword overlap (weighted 0.3)
      const hasVector = queryEmbedding && chunk.embedding;
      const score = hasVector
        ? vectorScore * 0.7 + Math.min(keywordScore / 5, 1) * 0.3
        : keywordScore;

      if (score > 0) {
        allChunks.push({ ...chunk, score });
      }
    }
  }

  // Sort by score descending, return top N
  allChunks.sort((a, b) => b.score - a.score);
  return allChunks.slice(0, maxChunks);
}

/**
 * Get all document text for a situation (for full-context injection).
 * Used when the total text is small enough to fit in a prompt.
 */
export async function getAllDocumentText(
  uid: string,
  situationId: string,
  opts: { maxChars?: number } = {}
): Promise<string> {
  const maxChars = opts.maxChars ?? 30000;
  const docs = await listDocuments(uid, situationId);

  let result = '';
  for (const doc of docs) {
    if (result.length >= maxChars) break;
    const header = `\n\n--- Document: ${doc.title} (${doc.fileType}, ${doc.uploadedAt}) ---\n\n`;
    const remaining = maxChars - result.length - header.length;
    if (remaining <= 0) break;
    result += header + doc.text.slice(0, remaining);
  }

  return result.trim();
}

function documentOwnedBy(doc: StoredDocument, uid: string): boolean {
  return !doc.ownerUid || doc.ownerUid === uid;
}

function withPathOwner(doc: StoredDocument, uid: string): StoredDocument {
  return { ...doc, ownerUid: doc.ownerUid ?? uid };
}
