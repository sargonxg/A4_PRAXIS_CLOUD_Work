import { z } from 'zod';
import type { CanonicalSourceReceipt } from '@/types/source-receipt';
import type { SpatialCitationRef } from '@/types/spatial-source';
import { EvidenceSpanSchema } from './schema';
import type { EvidenceSpan } from './types';

/** Source capture time is not silently relabeled as a content version. */
export function evidenceFromReceipt(receipt: CanonicalSourceReceipt): EvidenceSpan | null {
  const quote = receipt.span?.quote || receipt.excerpt;
  if (!quote?.trim()) return null;
  return EvidenceSpanSchema.parse({ id: receipt.receiptId, sourceId: receipt.sourceId, sourceVersion: receipt.contentHash || 'unresolved-source-version', quote,
    ...(receipt.url ? { uri: receipt.url } : {}), ...(receipt.contentHash ? { sourceHash: receipt.contentHash } : {}),
    ...(receipt.span?.pageNumber ? { page: receipt.span.pageNumber } : {}),
    ...(receipt.span?.start !== undefined && receipt.span?.end !== undefined ? { start: receipt.span.start, end: receipt.span.end } : {}),
    ...(receipt.span?.coords ? { geometry: receipt.span.coords } : {}),
    anchorStatus: receipt.span?.quote ? 'exact' : 'excerpt' });
}
export function evidenceFromSpatialCitation(ref: SpatialCitationRef, original: {
  sourceId: string; sourceVersion: string; quote: string; start?: number; end?: number; prefix?: string; suffix?: string;
}): EvidenceSpan {
  return EvidenceSpanSchema.parse({ id: ref.cid, ...original, documentId: ref.documentId, chunkId: ref.chunkId, citationId: ref.cid,
    ...(ref.pageNumber ? { page: ref.pageNumber } : {}), ...(ref.coords ? { geometry: ref.coords } : {}), quoteHash: ref.quoteHash, anchorStatus: 'exact' });
}
export function toWebAnnotation(span: EvidenceSpan) {
  const selector: Array<Record<string, unknown>> = [{ type: 'TextQuoteSelector', exact: span.quote,
    ...(span.prefix ? { prefix: span.prefix } : {}), ...(span.suffix ? { suffix: span.suffix } : {}) }];
  if (span.start !== undefined && span.end !== undefined) selector.push({ type: 'TextPositionSelector', start: span.start, end: span.end });
  if (span.geometry) selector.push({ type: 'FragmentSelector', conformsTo: 'http://www.w3.org/TR/media-frags/', value: `xywh=percent:${span.geometry.x * 100},${span.geometry.y * 100},${span.geometry.width * 100},${span.geometry.height * 100}` });
  return { '@context': 'http://www.w3.org/ns/anno.jsonld', id: `urn:tacitus:evidence:${encodeURIComponent(span.id)}`, type: 'Annotation', motivation: 'linking',
    body: { type: 'TextualBody', value: span.quote }, target: { source: span.uri || `urn:tacitus:source:${encodeURIComponent(span.sourceId)}`,
      sourceVersion: span.sourceVersion, ...(span.page ? { page: span.page } : {}), selector } };
}
const geometry = EvidenceSpanSchema.shape.geometry;
export const DocumentIrSchema = z.object({ schemaVersion: z.literal('document-ir/0.1.0'), documentId: z.string().min(1), sourceVersion: z.string().min(1),
  blocks: z.array(z.object({ id: z.string().min(1), type: z.enum(['heading', 'paragraph', 'table', 'cell', 'image', 'footnote', 'span']),
    text: z.string(), page: z.number().int().positive().optional(), start: z.number().int().nonnegative().optional(), end: z.number().int().nonnegative().optional(),
    geometry, parentId: z.string().optional(), row: z.number().int().nonnegative().optional(), column: z.number().int().nonnegative().optional(),
  }).strict()).max(10000),
}).strict();
export function documentIrFromChunks(documentId: string, sourceVersion: string, chunks: Array<{
  chunkId: string; text: string; pageNumber?: number; textStart?: number; textEnd?: number; coords?: SpatialCitationRef['coords'];
}>) {
  return DocumentIrSchema.parse({ schemaVersion: 'document-ir/0.1.0', documentId, sourceVersion, blocks: chunks.map((chunk) => ({
    id: chunk.chunkId, type: 'paragraph', text: chunk.text, ...(chunk.pageNumber ? { page: chunk.pageNumber } : {}),
    ...(chunk.textStart !== undefined ? { start: chunk.textStart } : {}), ...(chunk.textEnd !== undefined ? { end: chunk.textEnd } : {}),
    ...(chunk.coords ? { geometry: chunk.coords } : {}),
  })) });
}
