import { createHash } from 'crypto';
import type { CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import type { AgentRun, SelectedCoreIds } from '@/lib/agent-runtime/types';
import type { PolicyAgentOutputDestination } from '@/lib/product/policy-agents';

export interface CapsuleReadReceipt {
  version: 1;
  receiptId: string;
  capsuleId: string | null;
  capsuleVersion: number | null;
  evidencePackId: string | null;
  builtAt: string;
  selectedCoreRefs: {
    userCoreId: string | null;
    situationCoreId: string | null;
    graphCoreId: string | null;
    timeCoreId: string | null;
    memoryCoreId: string | null;
    sourceCoreIds: string[];
    documentCoreIds: string[];
    outputCoreIds: string[];
    toolCoreIds: string[];
  };
  sourceCount: number;
  documentCount: number;
  sourcedParagraphCount: number;
  memoryCount: number;
  outputHistoryCount: number;
  outputTarget: PolicyAgentOutputDestination | null;
  selectedTools: string[];
  contextGaps: string[];
  groundingPosture: string;
  constraints: string[];
}

export function buildCapsuleReadReceiptFromEvidencePack(
  pack: CapsuleEvidencePack,
  options: {
    selectedTools?: string[];
    outputTarget?: PolicyAgentOutputDestination | null;
    groundingPosture?: string | null;
    constraints?: string[];
    builtAt?: string;
  } = {},
): CapsuleReadReceipt {
  const coreRefs = normalizeCoreRefs(pack.activeCapsule.coreRefs ?? {});
  return {
    version: 1,
    receiptId: stableReceiptId('capsule-read', pack.capsuleId, pack.packId, options.builtAt ?? pack.builtAt),
    capsuleId: pack.capsuleId,
    capsuleVersion: pack.activeCapsule.version ?? null,
    evidencePackId: pack.packId,
    builtAt: options.builtAt ?? pack.builtAt,
    selectedCoreRefs: coreRefs,
    sourceCount: pack.sourceReceiptIds.length,
    documentCount: pack.knowledgeDocuments.length,
    sourcedParagraphCount: pack.sourcedParagraphs.length,
    memoryCount: pack.memories.length,
    outputHistoryCount: pack.outputHistory.length,
    outputTarget: options.outputTarget ?? null,
    selectedTools: uniqueStrings(options.selectedTools ?? []),
    contextGaps: uniqueStrings(pack.openGaps),
    groundingPosture: options.groundingPosture ?? 'No grounding metadata',
    constraints: normalizeConstraints(options.constraints ?? []),
  };
}

export function buildCapsuleReadReceiptFromRun(
  run: AgentRun,
  options: {
    selectedTools?: string[];
    outputTarget?: PolicyAgentOutputDestination | null;
    groundingPosture?: string | null;
    contextGaps?: string[];
    builtAt?: string;
  } = {},
): CapsuleReadReceipt {
  const selectedTools = uniqueStrings([
    ...(options.selectedTools ?? []),
    ...stringArray(run.metadata.selectedToolIds),
    ...stringArray(run.metadata.selectedTools),
    ...run.selectedCoreIds.toolCoreIds,
  ]);
  const sourceCount = nonnegativeInt(run.metadata.sourceCount)
    ?? stringArray(run.metadata.sourceReceiptIds).length
    ?? run.selectedCoreIds.sourceCoreIds.length;
  const documentCount = nonnegativeInt(run.metadata.documentCount) ?? run.selectedCoreIds.documentCoreIds.length;
  const builtAt = options.builtAt ?? new Date().toISOString();
  return {
    version: 1,
    receiptId: stableReceiptId('capsule-read', run.capsuleId, run.id, builtAt),
    capsuleId: run.capsuleId,
    capsuleVersion: nonnegativeInt(run.metadata.capsuleVersion),
    evidencePackId: typeof run.metadata.evidencePackId === 'string' ? run.metadata.evidencePackId : null,
    builtAt,
    selectedCoreRefs: normalizeCoreRefs(run.selectedCoreIds),
    sourceCount,
    documentCount,
    sourcedParagraphCount: nonnegativeInt(run.metadata.evidenceParagraphCount) ?? 0,
    memoryCount: nonnegativeInt(run.metadata.memoryCount) ?? (run.selectedCoreIds.memoryCoreId ? 1 : 0),
    outputHistoryCount: nonnegativeInt(run.metadata.outputHistoryCount) ?? 0,
    outputTarget: normalizeOutputTarget(options.outputTarget ?? run.metadata.outputDestination),
    selectedTools,
    contextGaps: uniqueStrings(options.contextGaps ?? stringArray(run.metadata.contextGaps)),
    groundingPosture: options.groundingPosture ?? (typeof run.metadata.groundingPosture === 'string' ? run.metadata.groundingPosture : 'No grounding metadata'),
    constraints: normalizeConstraints(stringArray(run.metadata.constraints)),
  };
}

export function buildCapsuleReadReceiptFromAsk(input: {
  capsuleId: string | null;
  capsuleVersion: number | null;
  selectedTools: string[];
  outputTarget?: PolicyAgentOutputDestination | null;
  sourceCount: number;
  documentCount: number;
  sourcedParagraphCount: number;
  contextGaps: string[];
  groundingPosture: string;
  builtAt?: string;
}): CapsuleReadReceipt {
  const builtAt = input.builtAt ?? new Date().toISOString();
  return {
    version: 1,
    receiptId: stableReceiptId('capsule-read', input.capsuleId ?? 'none', input.selectedTools.join(','), builtAt),
    capsuleId: input.capsuleId,
    capsuleVersion: input.capsuleVersion,
    evidencePackId: null,
    builtAt,
    selectedCoreRefs: normalizeCoreRefs({}),
    sourceCount: input.sourceCount,
    documentCount: input.documentCount,
    sourcedParagraphCount: input.sourcedParagraphCount,
    memoryCount: 0,
    outputHistoryCount: 0,
    outputTarget: input.outputTarget ?? null,
    selectedTools: uniqueStrings(input.selectedTools),
    contextGaps: uniqueStrings(input.contextGaps),
    groundingPosture: input.groundingPosture,
    constraints: normalizeConstraints([]),
  };
}

function normalizeCoreRefs(coreRefs: Partial<SelectedCoreIds>): CapsuleReadReceipt['selectedCoreRefs'] {
  return {
    userCoreId: coreRefs.userCoreId ?? null,
    situationCoreId: coreRefs.situationCoreId ?? null,
    graphCoreId: coreRefs.graphCoreId ?? null,
    timeCoreId: coreRefs.timeCoreId ?? null,
    memoryCoreId: coreRefs.memoryCoreId ?? null,
    sourceCoreIds: uniqueStrings(coreRefs.sourceCoreIds ?? []),
    documentCoreIds: uniqueStrings(coreRefs.documentCoreIds ?? []),
    outputCoreIds: uniqueStrings(coreRefs.outputCoreIds ?? []),
    toolCoreIds: uniqueStrings(coreRefs.toolCoreIds ?? []),
  };
}

function normalizeConstraints(values: string[]): string[] {
  const normalized = uniqueStrings(values);
  return normalized.length ? normalized : [
    'Read ContextCapsules before downstream agent work.',
    'Persist source, gap, output, and approval receipts in PRAXIS-owned stores.',
    'Do not imply live web grounding unless grounding metadata proves it.',
  ];
}

function normalizeOutputTarget(value: unknown): PolicyAgentOutputDestination | null {
  return value === 'memo_studio' || value === 'canvas' || value === 'library' || value === 'handover' ? value : null;
}

function stableReceiptId(...parts: string[]): string {
  return `crr:${createHash('sha256').update(parts.join(':')).digest('hex').slice(0, 20)}`;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).slice(0, 80);
}

function nonnegativeInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}
