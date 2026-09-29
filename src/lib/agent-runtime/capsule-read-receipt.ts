import { createHash } from 'crypto';
import type { CapsuleEvidencePack } from '@/lib/agent-runtime/evidence-pack';
import type { AgentRun, SelectedCoreIds } from '@/lib/agent-runtime/types';
import type { PolicyAgentOutputDestination } from '@/lib/product/policy-agents';

export interface CapsuleReceiptOntologyStack {
  stackId: string;
  activeOntologyIds: string[];
}

export interface AgentReadContract {
  version: 1;
  contractId: string;
  capsuleId: string | null;
  capsuleVersion: number | null;
  ontologyStackId: string | null;
  capsuleReadReceiptId: string;
  sourceCounts: {
    sourceCount: number;
    documentCount: number;
    sourcedParagraphCount: number;
  };
  advisoryLabels: string[];
  humanGates: string[];
  rejectedProposalWarnings: string[];
  stopConditions: string[];
  outputRestrictions: string[];
  allowedTools: string[];
  promptPurpose: string;
  promptBlock: string;
  contentHash: string;
}

export interface CapsuleReadReceipt {
  version: 2;
  receiptId: string;
  readContractId: string;
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
  ontologyStack: CapsuleReceiptOntologyStack | null;
  advisoryLabels: string[];
  humanGates: string[];
  rejectedProposalWarnings: string[];
  stopConditions: string[];
  outputRestrictions: string[];
  allowedTools: string[];
}

type CapsuleReceiptGovernanceOptions = {
  ontologyStack?: CapsuleReceiptOntologyStack | null;
  advisoryLabels?: string[];
  humanGates?: string[];
  rejectedProposalWarnings?: string[];
  stopConditions?: string[];
  outputRestrictions?: string[];
  allowedTools?: string[];
};

export function buildCapsuleReadReceiptFromEvidencePack(
  pack: CapsuleEvidencePack,
  options: {
    selectedTools?: string[];
    outputTarget?: PolicyAgentOutputDestination | null;
    groundingPosture?: string | null;
    constraints?: string[];
    builtAt?: string;
  } & CapsuleReceiptGovernanceOptions = {},
): CapsuleReadReceipt {
  const coreRefs = normalizeCoreRefs(pack.activeCapsule.coreRefs ?? {});
  const receiptId = stableReceiptId('capsule-read', pack.capsuleId, pack.packId, options.builtAt ?? pack.builtAt);
  const selectedTools = uniqueStrings(options.selectedTools ?? []);
  return {
    version: 2,
    receiptId,
    readContractId: stableContractId(receiptId),
    capsuleId: pack.capsuleId,
    capsuleVersion: pack.activeCapsule.version ?? null,
    evidencePackId: pack.packId,
    builtAt: options.builtAt ?? pack.builtAt,
    selectedCoreRefs: coreRefs,
    sourceCount: pack.sourceReceiptIds.length,
    documentCount: uniqueStrings([...pack.knowledgeDocuments.map((doc) => doc.documentId),
      ...pack.sourcedParagraphs.map((paragraph) => paragraph.documentId)]).length,
    sourcedParagraphCount: pack.sourcedParagraphs.length,
    memoryCount: pack.memories.length,
    outputHistoryCount: pack.outputHistory.length,
    outputTarget: options.outputTarget ?? null,
    selectedTools,
    contextGaps: uniqueStrings(pack.openGaps),
    groundingPosture: options.groundingPosture ?? 'No grounding metadata',
    constraints: normalizeConstraints(options.constraints ?? []),
    ...governanceFields(options, selectedTools),
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
  } & CapsuleReceiptGovernanceOptions = {},
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
  const receiptId = stableReceiptId('capsule-read', run.capsuleId, run.id, builtAt);
  return {
    version: 2,
    receiptId,
    readContractId: stableContractId(receiptId),
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
    ...governanceFields({
      ontologyStack: normalizeOntologyStack(run.metadata.ontologyStack),
      advisoryLabels: stringArray(run.metadata.advisoryLabels),
      humanGates: stringArray(run.metadata.humanGates),
      rejectedProposalWarnings: stringArray(run.metadata.rejectedProposalWarnings),
      stopConditions: stringArray(run.metadata.stopConditions),
      outputRestrictions: stringArray(run.metadata.outputRestrictions),
      allowedTools: stringArray(run.metadata.allowedTools),
      ...options,
    }, selectedTools),
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
} & CapsuleReceiptGovernanceOptions): CapsuleReadReceipt {
  const builtAt = input.builtAt ?? new Date().toISOString();
  const receiptId = stableReceiptId('capsule-read', input.capsuleId ?? 'none', input.selectedTools.join(','), builtAt);
  const selectedTools = uniqueStrings(input.selectedTools);
  return {
    version: 2,
    receiptId,
    readContractId: stableContractId(receiptId),
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
    selectedTools,
    contextGaps: uniqueStrings(input.contextGaps),
    groundingPosture: input.groundingPosture,
    constraints: normalizeConstraints([]),
    ...governanceFields(input, selectedTools),
  };
}

export function buildAgentReadContractFromReceipt(
  receipt: CapsuleReadReceipt,
  options: {
    contractId?: string;
    promptPurpose?: string;
  } = {},
): AgentReadContract {
  const contractId = options.contractId ?? receipt.readContractId;
  const promptPurpose = options.promptPurpose ?? 'Read the active ContextCapsule before downstream agent work.';
  const promptLines = [
    '[agent_read_contract]',
    `contract_id: ${contractId}`,
    `capsule_id: ${receipt.capsuleId ?? 'none'}`,
    `capsule_version: ${receipt.capsuleVersion ?? 'unknown'}`,
    `capsule_read_receipt: ${receipt.receiptId}`,
    `ontology_stack: ${receipt.ontologyStack?.stackId ?? 'none'}`,
    `active_ontologies: ${receipt.ontologyStack?.activeOntologyIds.join(', ') || 'none'}`,
    `source_counts: sources=${receipt.sourceCount}; documents=${receipt.documentCount}; sourced_paragraphs=${receipt.sourcedParagraphCount}`,
    `advisory_labels: ${receipt.advisoryLabels.length ? receipt.advisoryLabels.join(', ') : 'none'}`,
    `human_gates: ${receipt.humanGates.length ? receipt.humanGates.join(', ') : 'none'}`,
    `rejected_proposal_warnings: ${receipt.rejectedProposalWarnings.length ? receipt.rejectedProposalWarnings.join(' | ') : 'none'}`,
    `stop_conditions: ${receipt.stopConditions.length ? receipt.stopConditions.join(' | ') : 'none'}`,
    `output_restrictions: ${receipt.outputRestrictions.length ? receipt.outputRestrictions.join(' | ') : 'none'}`,
    `allowed_tools: ${receipt.allowedTools.length ? receipt.allowedTools.join(', ') : 'none'}`,
    `purpose: ${promptPurpose}`,
    'rule: Advisory memory, graph proposals, source gaps, and ontology suggestions are not canonical until a review card is applied.',
    'rule: Stop before external output when human gates, moderation requirements, or rejected proposal warnings block the action.',
    '[/agent_read_contract]',
  ];
  const promptBlock = promptLines.join('\n');
  return {
    version: 1,
    contractId,
    capsuleId: receipt.capsuleId,
    capsuleVersion: receipt.capsuleVersion,
    ontologyStackId: receipt.ontologyStack?.stackId ?? null,
    capsuleReadReceiptId: receipt.receiptId,
    sourceCounts: {
      sourceCount: receipt.sourceCount,
      documentCount: receipt.documentCount,
      sourcedParagraphCount: receipt.sourcedParagraphCount,
    },
    advisoryLabels: receipt.advisoryLabels,
    humanGates: receipt.humanGates,
    rejectedProposalWarnings: receipt.rejectedProposalWarnings,
    stopConditions: receipt.stopConditions,
    outputRestrictions: receipt.outputRestrictions,
    allowedTools: receipt.allowedTools,
    promptPurpose,
    promptBlock,
    contentHash: `sha256:${createHash('sha256').update(promptBlock).digest('hex')}`,
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

function stableContractId(receiptId: string): string {
  return `arc:${createHash('sha256').update(`agent-read-contract:${receiptId}`).digest('hex').slice(0, 20)}`;
}

function governanceFields(
  input: CapsuleReceiptGovernanceOptions,
  selectedTools: string[],
): Pick<CapsuleReadReceipt, 'ontologyStack' | 'advisoryLabels' | 'humanGates' | 'rejectedProposalWarnings' | 'stopConditions' | 'outputRestrictions' | 'allowedTools'> {
  return {
    ontologyStack: normalizeOntologyStack(input.ontologyStack),
    advisoryLabels: uniqueStrings(input.advisoryLabels ?? []),
    humanGates: uniqueStrings(input.humanGates ?? []),
    rejectedProposalWarnings: uniqueStrings(input.rejectedProposalWarnings ?? []),
    stopConditions: uniqueStrings(input.stopConditions ?? []),
    outputRestrictions: uniqueStrings(input.outputRestrictions ?? []),
    allowedTools: uniqueStrings(input.allowedTools?.length ? input.allowedTools : selectedTools),
  };
}

function normalizeOntologyStack(value: unknown): CapsuleReceiptOntologyStack | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  const stackId = typeof body.stackId === 'string' && body.stackId.trim() ? body.stackId.trim().slice(0, 160) : '';
  if (!stackId) return null;
  return {
    stackId,
    activeOntologyIds: uniqueStrings(stringArray(body.activeOntologyIds)),
  };
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
