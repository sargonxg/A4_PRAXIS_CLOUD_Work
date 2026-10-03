import { z } from 'zod';
import { createHash } from 'node:crypto';
import type { CanonicalSourceReceipt } from '@/types/source-receipt';
import type { SpatialCitationRef } from '@/types/spatial-source';
import { EvidenceSpanSchema } from './schema';
import type { EvidenceSpan } from './types';

/** SHA-256 over the literal UTF-8 quotation, without trimming or normalization. */
export function evidenceQuoteDigest(quote: string): string { return `sha256:${createHash('sha256').update(quote, 'utf8').digest('hex')}`; }
function supportedDigest(value: string | undefined): string | undefined {
  return value && /^(?:sha256:)?[a-f0-9]{64}$/.test(value) ? value.replace(/^sha256:/, '') : undefined;
}

/** Source capture time is not silently relabeled as a content version. */
export function evidenceFromReceipt(receipt: CanonicalSourceReceipt): EvidenceSpan | null {
  const quote = receipt.span?.quote || receipt.excerpt;
  if (!quote?.trim()) return null;
  const sourceHash = supportedDigest(receipt.contentHash);
  const capturedOriginal = Boolean(receipt.span?.quote && sourceHash && receipt.originalPassages?.some(passage =>
    supportedDigest(passage.contentHash) === sourceHash && passage.text.includes(quote)));
  return EvidenceSpanSchema.parse({ id: receipt.receiptId, sourceId: receipt.sourceId, sourceVersion: receipt.contentHash || 'unresolved-source-version', quote,
    ...(receipt.url ? { uri: receipt.url } : {}), ...(receipt.contentHash ? { sourceHash: receipt.contentHash } : {}),
    ...(receipt.span?.pageNumber ? { page: receipt.span.pageNumber } : {}),
    ...(receipt.span?.start !== undefined && receipt.span?.end !== undefined ? { start: receipt.span.start, end: receipt.span.end } : {}),
    ...(receipt.span?.coords ? { geometry: receipt.span.coords } : {}),
    quoteHash: evidenceQuoteDigest(quote), anchorStatus: capturedOriginal ? 'exact' : receipt.contentHash ? 'excerpt' : 'unresolved' });
}
export function evidenceFromSpatialCitation(ref: SpatialCitationRef, original: {
  sourceId: string; sourceVersion: string; quote: string; start?: number; end?: number; prefix?: string; suffix?: string; textPosture?: 'original' | 'normalized';
}): EvidenceSpan {
  const quotedDigest = supportedDigest(ref.quoteHash); const actual = evidenceQuoteDigest(original.quote);
  if (quotedDigest && quotedDigest !== actual.slice(7)) throw new Error('Spatial quote hash does not match the literal supplied quote.');
  const { textPosture, ...anchor } = original;
  const anchorStatus = !quotedDigest || !supportedDigest(original.sourceVersion) ? 'unresolved' : textPosture === 'normalized' ? 'excerpt' : 'exact';
  return EvidenceSpanSchema.parse({ id: ref.cid, ...anchor, documentId: ref.documentId, chunkId: ref.chunkId, citationId: ref.cid,
    ...(ref.pageNumber ? { page: ref.pageNumber } : {}), ...(ref.coords ? { geometry: ref.coords } : {}), quoteHash: quotedDigest ? actual : ref.quoteHash, anchorStatus });
}
export function toWebAnnotation(span: EvidenceSpan) {
  const selector: Array<Record<string, unknown>> = [{ type: 'TextQuoteSelector', exact: span.quote,
    ...(span.prefix ? { prefix: span.prefix } : {}), ...(span.suffix ? { suffix: span.suffix } : {}) }];
  if (span.start !== undefined && span.end !== undefined) selector.push({ type: 'TextPositionSelector', start: span.start, end: span.end });
  if (span.geometry) selector.push({ type: 'FragmentSelector', conformsTo: 'http://www.w3.org/TR/media-frags/', value: `xywh=percent:${span.geometry.x * 100},${span.geometry.y * 100},${span.geometry.width * 100},${span.geometry.height * 100}` });
  return { '@context': 'http://www.w3.org/ns/anno.jsonld', id: `urn:tacitus:evidence:${encodeURIComponent(span.id)}`, type: 'Annotation', motivation: 'linking',
    body: { type: 'TextualBody', value: span.quote }, target: { source: span.uri || `urn:tacitus:source:${encodeURIComponent(span.sourceId)}`,
      sourceVersion: span.sourceVersion, anchorStatus: span.anchorStatus, ...(span.page ? { page: span.page } : {}), selector } };
}
const geometry = EvidenceSpanSchema.shape.geometry;
export const DocumentIrSchema = z.object({ schemaVersion: z.literal('document-ir/0.1.0'), documentId: z.string().min(1).max(240), sourceVersion: z.string().min(1).max(240),
  textPosture: z.enum(['original', 'normalized', 'unknown']).default('unknown'),
  parser: z.object({ name: z.string().min(1).max(240), version: z.string().min(1).max(240) }).strict().optional(),
  pages: z.array(z.object({ number: z.number().int().positive(), width: z.number().positive().optional(), height: z.number().positive().optional() }).strict()).max(10000).default([]),
  blocks: z.array(z.object({ id: z.string().min(1).max(240), type: z.enum(['heading', 'paragraph', 'table', 'cell', 'image', 'footnote', 'span']),
    text: z.string().max(4000000), page: z.number().int().positive().optional(), start: z.number().int().nonnegative().optional(), end: z.number().int().nonnegative().optional(),
    geometry, parentId: z.string().min(1).max(240).optional(), row: z.number().int().nonnegative().optional(), column: z.number().int().nonnegative().optional(),
  }).strict()).max(10000),
}).strict().superRefine((document, ctx) => {
  const ids = new Map(document.blocks.map(block => [block.id, block])); const pages = new Set(document.pages.map(page => page.number));
  if (ids.size !== document.blocks.length) ctx.addIssue({ code: 'custom', path: ['blocks'], message: 'Document block IDs must be unique.' });
  if (pages.size !== document.pages.length) ctx.addIssue({ code: 'custom', path: ['pages'], message: 'Document page numbers must be unique.' });
  document.blocks.forEach((block, index) => {
    const issue = (field: string, message: string) => ctx.addIssue({ code: 'custom', path: ['blocks', index, field], message });
    if ((block.start === undefined) !== (block.end === undefined) || (block.start !== undefined && block.end! <= block.start)) issue('end', 'Block offsets require a positive paired span.');
    if (block.page !== undefined && !pages.has(block.page)) issue('page', 'Block refers to an undeclared page.');
    if (block.geometry && (!block.page || block.geometry.x + block.geometry.width > 1.001 || block.geometry.y + block.geometry.height > 1.001)) issue('geometry', 'Geometry requires a page and must remain within its bounds.');
    if (block.parentId && !ids.has(block.parentId)) issue('parentId', 'Parent block does not exist.');
    if (block.type === 'cell' && (ids.get(block.parentId ?? '')?.type !== 'table' || block.row === undefined || block.column === undefined)) issue('parentId', 'Cells require a table parent, row and column.');
    if (block.type !== 'cell' && (block.row !== undefined || block.column !== undefined)) issue('row', 'Grid coordinates belong to cells only.');
    const visited = new Set([block.id]); let parent = block.parentId;
    while (parent && ids.has(parent)) { if (visited.has(parent)) { issue('parentId', 'Document parent links cannot form a cycle.'); break; } visited.add(parent); parent = ids.get(parent)?.parentId; }
  });
});
export type DocumentIR = z.infer<typeof DocumentIrSchema>;
export function documentIrJsonSchema() { return z.toJSONSchema(DocumentIrSchema, { unrepresentable: 'throw' }); }
export function documentIrConstraintProjection(value: DocumentIR) {
  const document = DocumentIrSchema.parse(value); const prefix = `urn:tacitus:document:${encodeURIComponent(document.documentId)}:`;
  const blockIri = (id: string) => ({ '@id': `${prefix}block:${encodeURIComponent(id)}` });
  const pageIri = (number: number) => ({ '@id': `${prefix}page:${number}` });
  return { '@context': { '@vocab': 'https://tacitus.me/ns/document#' }, '@graph': [
    { '@id': prefix, '@type': 'Document', documentId: document.documentId, sourceVersion: document.sourceVersion,
      block: document.blocks.map(block => blockIri(block.id)), page: document.pages.map(page => pageIri(page.number)) },
    ...document.pages.map(page => ({ ...pageIri(page.number), '@type': 'Page', ...page })),
    ...document.blocks.map(block => ({ ...blockIri(block.id), '@type': 'Block', ...block,
      ...(block.page !== undefined ? { page: pageIri(block.page) } : {}), ...(block.parentId ? { parent: blockIri(block.parentId) } : {}) })),
  ] };
}
/** RDF export constraints; runtime also checks IDs, offsets, references and parent cycles. */
export function documentIrShacl(): string {
  return `@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
@prefix doc: <https://tacitus.me/ns/document#> .
doc:DocumentShape a sh:NodeShape ; sh:targetClass doc:Document ;
  sh:property [ sh:path doc:documentId ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:string ] ;
  sh:property [ sh:path doc:sourceVersion ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:string ] ;
  sh:property [ sh:path doc:block ; sh:node doc:BlockShape ] .
doc:PageShape a sh:NodeShape ; sh:targetClass doc:Page ;
  sh:property [ sh:path doc:number ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:integer ; sh:minInclusive 1 ] .
doc:BlockShape a sh:NodeShape ; sh:targetClass doc:Block ;
  sh:property [ sh:path doc:id ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:string ] ;
  sh:property [ sh:path doc:text ; sh:minCount 1 ; sh:maxCount 1 ; sh:datatype xsd:string ] ;
  sh:property [ sh:path doc:type ; sh:minCount 1 ; sh:maxCount 1 ; sh:in ( "heading" "paragraph" "table" "cell" "image" "footnote" "span" ) ] .
`;
}
export function documentIrFromChunks(documentId: string, sourceVersion: string, chunks: Array<{
  chunkId: string; text: string; pageNumber?: number; textStart?: number; textEnd?: number; coords?: SpatialCitationRef['coords'];
}>, metadata: { parser?: DocumentIR['parser']; textPosture?: DocumentIR['textPosture'] } = {}) {
  const pages = [...new Set(chunks.map(chunk => chunk.pageNumber).filter((page): page is number => page !== undefined))].sort((a, b) => a - b).map(number => ({ number }));
  return DocumentIrSchema.parse({ schemaVersion: 'document-ir/0.1.0', documentId, sourceVersion, ...metadata, pages, blocks: chunks.map((chunk) => ({
    id: chunk.chunkId, type: 'paragraph', text: chunk.text, ...(chunk.pageNumber ? { page: chunk.pageNumber } : {}),
    ...(chunk.textStart !== undefined ? { start: chunk.textStart } : {}), ...(chunk.textEnd !== undefined ? { end: chunk.textEnd } : {}),
    ...(chunk.coords ? { geometry: chunk.coords } : {}),
  })) });
}
