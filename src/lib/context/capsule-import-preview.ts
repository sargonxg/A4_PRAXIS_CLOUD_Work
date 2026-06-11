import JSZip from 'jszip';
import {
  mapDialecticaExportToPraxisPreview,
  parseDialecticaContextExport,
  type DialecticaSourceReceipt,
} from '@/lib/context/dialectica-context-contract';

export type CapsuleImportPreviewKind = 'dialectica' | 'capsule-plus';

export interface CapsuleImportPreview {
  kind: CapsuleImportPreviewKind;
  packageId: string;
  title: string;
  factCount: number;
  conflictingCount: number;
  evidenceGapCount: number;
  sourceReceiptCount: number;
  sourceReceipts: DialecticaSourceReceipt[];
  reviewGatedSummary: string;
}

export function buildDialecticaImportPreview(input: unknown): CapsuleImportPreview {
  const exportPackage = parseDialecticaContextExport(input);
  const preview = mapDialecticaExportToPraxisPreview(exportPackage);

  return {
    kind: 'dialectica',
    packageId: preview.packageId,
    title: preview.title,
    factCount: preview.factClaims.length,
    conflictingCount: preview.conflictingClaims.length,
    evidenceGapCount: preview.evidenceGaps.length,
    sourceReceiptCount: preview.sourceReceipts.length,
    sourceReceipts: preview.sourceReceipts,
    reviewGatedSummary: 'Facts, conflicting claims, gaps, and source receipts stay review-gated until a human approves the import review card.',
  };
}

export async function buildCapsulePlusImportPreview(buffer: Buffer | ArrayBuffer | Uint8Array): Promise<CapsuleImportPreview> {
  const zip = await JSZip.loadAsync(buffer);
  const manifest = parseRecord(await requiredZipJson(zip, 'manifest.json'));
  const capsule = parseRecord(await requiredZipJson(zip, 'capsule.json'));
  const nodes = parseLooseJsonl(await optionalZipText(zip, 'graph/nodes.jsonl'));
  const edges = parseLooseJsonl(await optionalZipText(zip, 'graph/edges.jsonl'));
  const proposals = parseLooseJsonl(await optionalZipText(zip, 'graph/proposals.jsonl'));
  const sourceReceipts = parseLooseJsonl(await optionalZipText(zip, 'receipts/source-receipts.jsonl'))
    .map((receipt) => normalizeSourceReceipt(receipt))
    .filter((receipt): receipt is DialecticaSourceReceipt => Boolean(receipt));
  const packageId = stringField(manifest.capsuleId) ?? stringField(capsule.capsuleId) ?? 'capsule-plus-import';
  const title = stringField(capsule.label) ?? stringField(capsule.title) ?? packageId;

  return {
    kind: 'capsule-plus',
    packageId,
    title,
    factCount: nodes.length,
    conflictingCount: 0,
    evidenceGapCount: proposals.length || edges.length,
    sourceReceiptCount: sourceReceipts.length,
    sourceReceipts,
    reviewGatedSummary: 'Graph nodes, edges, proposals, and source receipts stay review-gated until a human approves the Capsule+ review card.',
  };
}

export function buildCapsuleImportReviewHref(capsuleId: string): string {
  return `/app/capsules?capsuleId=${encodeURIComponent(capsuleId)}&panel=review`;
}

async function requiredZipJson(zip: JSZip, path: string): Promise<unknown> {
  const text = await zip.file(path)?.async('string');
  if (!text) throw new Error(`Capsule import preview is missing ${path}.`);
  return JSON.parse(text);
}

async function optionalZipText(zip: JSZip, path: string): Promise<string> {
  return zip.file(path)?.async('string') ?? '';
}

function parseLooseJsonl(text: string): Array<Record<string, unknown>> {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => parseRecord(JSON.parse(line)));
}

function normalizeSourceReceipt(input: Record<string, unknown>): DialecticaSourceReceipt | null {
  const id = stringField(input.id);
  const title = stringField(input.title) ?? stringField(input.label);
  const url = stringField(input.url);
  const citation = stringField(input.citation);
  const excerpt = stringField(input.excerpt);
  if (!id || !title) return null;
  return {
    id,
    title,
    ...(url ? { url } : {}),
    ...(citation ? { citation } : {}),
    ...(excerpt ? { excerpt } : {}),
  };
}

function parseRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Capsule import preview expected an object payload.');
  }
  return value as Record<string, unknown>;
}

function stringField(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
