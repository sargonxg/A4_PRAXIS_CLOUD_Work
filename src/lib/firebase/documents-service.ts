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

export interface StoredDocument {
  id: string;
  title: string;
  fileType: string;
  size: number;
  text: string;
  status: 'uploaded' | 'processing' | 'extracted' | 'error';
  uploadedAt: string;
  entities?: Record<string, unknown>;
  entityCount: number;
  chunkCount?: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  text: string;
  index: number;
  charStart: number;
  charEnd: number;
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
  doc: Omit<StoredDocument, 'id'>
): Promise<StoredDocument> {
  const ref = docsCollection(uid, situationId).doc();
  const stored: StoredDocument = { ...doc, id: ref.id };
  await ref.set(stored);

  // Update situation document count
  const db = getAdminDbOrThrow();
  const sitRef = db.collection('users').doc(uid).collection('situations').doc(situationId);
  await sitRef.update({ documentCount: FieldValue.increment(1) });

  return stored;
}

export async function getDocumentById(
  uid: string,
  situationId: string,
  docId: string
): Promise<StoredDocument | null> {
  const snap = await docsCollection(uid, situationId).doc(docId).get();
  return snap.exists ? (snap.data() as StoredDocument) : null;
}

export async function listDocuments(
  uid: string,
  situationId: string
): Promise<StoredDocument[]> {
  const snap = await docsCollection(uid, situationId)
    .orderBy('uploadedAt', 'desc')
    .limit(100)
    .get();
  return snap.docs.map((d) => d.data() as StoredDocument);
}

export async function updateDocumentStatus(
  uid: string,
  situationId: string,
  docId: string,
  status: StoredDocument['status'],
  updates?: Partial<StoredDocument>
): Promise<void> {
  await docsCollection(uid, situationId).doc(docId).update({ status, ...updates });
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

    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

/**
 * Chunk a document and save chunks to Firestore.
 */
export async function chunkAndSaveDocument(
  uid: string,
  situationId: string,
  docId: string,
  docTitle: string,
  fullText: string
): Promise<number> {
  const chunks = chunkText(fullText);
  const col = chunksCollection(uid, situationId, docId);

  const batch = getAdminDbOrThrow().batch();
  for (let i = 0; i < chunks.length; i++) {
    const ref = col.doc();
    const chunk: DocumentChunk = {
      id: ref.id,
      documentId: docId,
      documentTitle: docTitle,
      text: chunks[i].text,
      index: i,
      charStart: chunks[i].charStart,
      charEnd: chunks[i].charEnd,
    };
    batch.set(ref, chunk);
  }
  await batch.commit();

  // Update chunk count on the document
  await docsCollection(uid, situationId).doc(docId).update({ chunkCount: chunks.length });

  return chunks.length;
}

// ---------------------------------------------------------------------------
// Retrieval (keyword-based for now, embeddings can be added later)
// ---------------------------------------------------------------------------

/**
 * Simple retrieval: fetches all chunks for a situation's documents
 * and scores them by keyword overlap with the query.
 * This is a practical first step before vector embeddings.
 */
export async function retrieveRelevantChunks(
  uid: string,
  situationId: string,
  query: string,
  opts: { maxChunks?: number } = {}
): Promise<DocumentChunk[]> {
  const maxChunks = opts.maxChunks ?? 5;

  // Get all documents for this situation
  const docs = await listDocuments(uid, situationId);
  if (docs.length === 0) return [];

  // Collect all chunks across documents
  const allChunks: (DocumentChunk & { score: number })[] = [];

  for (const doc of docs) {
    const snap = await chunksCollection(uid, situationId, doc.id).orderBy('index').get();
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

    for (const chunkSnap of snap.docs) {
      const chunk = chunkSnap.data() as DocumentChunk;
      const lowerText = chunk.text.toLowerCase();

      // Score by keyword overlap
      let score = 0;
      for (const term of queryTerms) {
        const matches = lowerText.split(term).length - 1;
        score += matches;
      }

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
