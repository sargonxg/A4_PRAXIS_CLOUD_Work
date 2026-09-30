import { createHash } from 'crypto';
import { getCapsule, type PraxisCapsule } from '@/lib/context/capsule-service';
import { listCapsuleMemories, type CapsuleMemory } from '@/lib/context/capsule-details-service';
import { getDocumentById, retrieveRelevantChunks, type DocumentChunk } from '@/lib/firebase/documents-service';
import { listKnowledgeDocuments, type KnowledgeDocument } from '@/lib/knowledge/library-service';
import { listOutputCapsules } from '@/lib/output-capsules/storage';
import type { OutputCapsuleRecord } from '@/lib/output-capsules/types';

export interface SourcedParagraphRecord {
  id: string;
  documentId: string;
  chunkId: string;
  sourceReceiptId: string | null;
  pageRef: string | null;
  paragraphRef: string | null;
  charStart: number;
  charEnd: number;
  excerpt: string;
  score: number;
  confidence: number;
  citationLabel: string;
}

export interface CapsuleEvidencePack {
  packId: string;
  ownerUid: string;
  capsuleId: string;
  objective: string;
  builtAt: string;
  activeCapsule: PraxisCapsule;
  knowledgeDocuments: KnowledgeDocument[];
  sourceReceiptIds: string[];
  sourcedParagraphs: SourcedParagraphRecord[];
  documentDigests: Array<{
    documentId: string;
    title: string;
    shortSummary: string;
    keyClaims: string[];
    sourceabilityWarnings: string[];
  }>;
  outputHistory: Array<{
    outputCapsuleId: string;
    templateId: string;
    status: string;
    qualityStatus: string;
    createdAt: string;
  }>;
  memories: CapsuleMemory[];
  openGaps: string[];
  receipts: {
    sourcesUsed: number;
    paragraphsUsed: number;
    unsupportedGaps: string[];
    outputHistoryCount: number;
    memoryCount: number;
  };
}

export interface BuildCapsuleEvidencePackInput {
  ownerUid: string;
  capsuleId: string;
  objective: string;
  maxParagraphs?: number;
}

export interface CapsuleEvidencePackDeps {
  getCapsule?: typeof getCapsule;
  listKnowledgeDocuments?: typeof listKnowledgeDocuments;
  retrieveRelevantChunks?: typeof retrieveRelevantChunks;
  getDocumentById?: typeof getDocumentById;
  listOutputCapsules?: typeof listOutputCapsules;
  listCapsuleMemories?: typeof listCapsuleMemories;
  now?: () => Date;
}

export async function buildCapsuleEvidencePack(
  input: BuildCapsuleEvidencePackInput,
  deps: CapsuleEvidencePackDeps = {},
): Promise<CapsuleEvidencePack> {
  const readCapsule = deps.getCapsule ?? getCapsule;
  const capsule = await readCapsule(input.ownerUid, input.capsuleId);
  if (!capsule || capsule.archivedAt || capsule.ownerUid !== input.ownerUid || capsule.capsuleId !== input.capsuleId) {
    throw new Error(`Active ContextCapsule not found: ${input.capsuleId}`);
  }

  const situationId = capsule.coreRefs.situationCoreId ?? capsule.activeForSituationIds[0] ?? capsule.capsuleId;
  const [
    knowledgeDocuments,
    rawChunks,
    outputHistory,
    memories,
  ] = await Promise.all([
    (deps.listKnowledgeDocuments ?? listKnowledgeDocuments)(input.ownerUid, { capsuleId: capsule.capsuleId }).catch(() => []),
    situationId
      ? (deps.retrieveRelevantChunks ?? retrieveRelevantChunks)(input.ownerUid, situationId, input.objective, {
          maxChunks: input.maxParagraphs ?? 8,
          ...(capsule.coreRefs.documentCoreIds.length ? { documentIds: capsule.coreRefs.documentCoreIds } : {}),
        }).catch(() => [])
      : Promise.resolve([]),
    (deps.listOutputCapsules ?? listOutputCapsules)(input.ownerUid, {
      contextCapsuleId: capsule.capsuleId,
      limit: 10,
    }).catch(() => []),
    (deps.listCapsuleMemories ?? listCapsuleMemories)(input.ownerUid, capsule.capsuleId).catch(() => []),
  ]);

  const maxParagraphs = Math.max(1, Math.min(24, input.maxParagraphs ?? 8));
  const chunks = rawChunks.filter((chunk) => (
    capsule.coreRefs.documentCoreIds.length === 0 ||
    capsule.coreRefs.documentCoreIds.includes(chunk.documentId)
  ));
  // Uploads are immediately usable, even before optional chunk indexing completes.
  // Read only explicit capsule documents through the owner-scoped storage path.
  const missingDocumentIds = capsule.coreRefs.documentCoreIds
    .filter((id) => !chunks.some((chunk) => chunk.documentId === id))
    .slice(0, maxParagraphs);
  const storedDocuments = await Promise.all(missingDocumentIds.map((id) => (
    (deps.getDocumentById ?? getDocumentById)(input.ownerUid, situationId, id).catch(() => null)
  )));
  for (const doc of storedDocuments) {
    if (!doc || (doc.ownerUid && doc.ownerUid !== input.ownerUid) || !missingDocumentIds.includes(doc.id) || !doc.text?.trim()) continue;
    chunks.push({ id: `${doc.id}:preview`, documentId: doc.id, documentTitle: doc.title,
      text: doc.text.slice(0, 900), index: 0, charStart: 0, charEnd: Math.min(doc.text.length, 900) });
  }
  const sourceReceiptIds = uniqueStrings([
    ...capsule.coreRefs.sourceCoreIds,
    ...knowledgeDocuments.flatMap((doc) => doc.digest?.suggestedTags?.filter((tag) => tag.startsWith('receipt:')).map((tag) => tag.slice(8)) ?? []),
  ]);
  // A document reference is its own provenance; never assign an unrelated source by array position.
  const sourcedParagraphs = chunks.slice(0, maxParagraphs).map((chunk, index) => sourcedParagraphFromChunk(chunk, `document:${chunk.documentId}`, index));
  sourceReceiptIds.push(...uniqueStrings(sourcedParagraphs.flatMap((paragraph) => paragraph.sourceReceiptId ? [paragraph.sourceReceiptId] : []))
    .filter((id) => !sourceReceiptIds.includes(id)));
  const documentDigests = knowledgeDocuments
    .filter((doc) => doc.digest)
    .map((doc) => ({
      documentId: doc.documentId,
      title: doc.title,
      shortSummary: doc.digest?.shortSummary ?? '',
      keyClaims: doc.digest?.keyClaims ?? [],
      sourceabilityWarnings: doc.digest?.sourceabilityWarnings ?? [],
    }));
  const openGaps = buildEvidenceGaps(capsule, knowledgeDocuments, sourcedParagraphs);
  const builtAt = (deps.now?.() ?? new Date()).toISOString();

  return {
    packId: stablePackId(input.ownerUid, capsule.capsuleId, input.objective, builtAt),
    ownerUid: input.ownerUid,
    capsuleId: capsule.capsuleId,
    objective: input.objective,
    builtAt,
    activeCapsule: capsule,
    knowledgeDocuments,
    sourceReceiptIds,
    sourcedParagraphs,
    documentDigests,
    outputHistory: summarizeOutputs(outputHistory),
    memories,
    openGaps,
    receipts: {
      sourcesUsed: sourceReceiptIds.length,
      paragraphsUsed: sourcedParagraphs.length,
      unsupportedGaps: openGaps,
      outputHistoryCount: outputHistory.length,
      memoryCount: memories.length,
    },
  };
}

export function formatEvidencePackPromptBlock(pack: CapsuleEvidencePack): string {
  const lines = [
    '## Capsule Evidence Pack',
    `pack_id: ${pack.packId}`,
    `capsule: ${pack.capsuleId} v${pack.activeCapsule.version}`,
    `objective: ${pack.objective}`,
    `source_receipts: ${pack.sourceReceiptIds.length ? pack.sourceReceiptIds.join(', ') : 'none'}`,
    `open_gaps: ${pack.openGaps.length ? pack.openGaps.join(' | ') : 'none'}`,
    '',
    '### Sourced Paragraphs',
    'Uploaded documents are user-supplied context, not independent verification. Preserve synthetic/example and assistant-generated labels.',
  ];
  for (const paragraph of pack.sourcedParagraphs) {
    lines.push(`- ${paragraph.citationLabel} [${paragraph.sourceReceiptId}]: ${paragraph.excerpt}`);
  }
  if (pack.sourcedParagraphs.length === 0) lines.push('- none');
  return lines.join('\n');
}

function sourcedParagraphFromChunk(
  chunk: DocumentChunk & { score?: number; pageNumber?: number },
  sourceReceiptId: string | null,
  index: number,
): SourcedParagraphRecord {
  const pageRef = typeof chunk.pageNumber === 'number' ? `p.${chunk.pageNumber}` : null;
  const paragraphRef = `para-${chunk.index + 1}`;
  const excerpt = chunk.text.trim().replace(/\s+/g, ' ').slice(0, 900);
  const score = typeof chunk.score === 'number' && Number.isFinite(chunk.score) ? chunk.score : 0.5;
  return {
    id: stableId(`${chunk.documentId}:${chunk.id}:${chunk.charStart}:${chunk.charEnd}`),
    documentId: chunk.documentId,
    chunkId: chunk.id,
    sourceReceiptId,
    pageRef,
    paragraphRef,
    charStart: Math.max(0, Math.floor(chunk.charStart)),
    charEnd: Math.max(0, Math.floor(chunk.charEnd)),
    excerpt,
    score,
    confidence: Math.max(0.2, Math.min(0.95, score > 1 ? 0.65 : score)),
    citationLabel: `[D${index + 1}:${pageRef ?? paragraphRef}]`,
  };
}

function buildEvidenceGaps(
  capsule: PraxisCapsule,
  documents: KnowledgeDocument[],
  paragraphs: SourcedParagraphRecord[],
): string[] {
  return [
    capsule.coreRefs.sourceCoreIds.length === 0 ? 'No Source Core receipts are attached.' : null,
    documents.length === 0 ? 'No Knowledge Library documents are attached.' : null,
    paragraphs.length === 0 ? 'No retrievable paragraph chunks matched the objective.' : null,
    capsule.coreRefs.graphCoreId ? null : 'Graph Core is thin; graph mutation must stay approval-gated.',
    capsule.coreRefs.timeCoreId ? null : 'Time Core is unset; freshness assumptions need review.',
  ].filter((item): item is string => Boolean(item));
}

function summarizeOutputs(outputs: OutputCapsuleRecord[]): CapsuleEvidencePack['outputHistory'] {
  return outputs.map((output) => ({
    outputCapsuleId: output.id,
    templateId: output.templateId,
    status: output.status,
    qualityStatus: output.quality.blockers.length ? 'blocked' : output.quality.sourceabilityStatus,
    createdAt: output.createdAt,
  }));
}

function stablePackId(ownerUid: string, capsuleId: string, objective: string, builtAt: string): string {
  return `evidence:${stableId(`${ownerUid}:${capsuleId}:${objective}:${builtAt}`).slice(0, 16)}`;
}

function stableId(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 100);
}
