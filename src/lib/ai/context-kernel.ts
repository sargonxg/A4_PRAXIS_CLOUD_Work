import {
  getCapability,
  type CapabilityDefinition,
  type CapabilityId,
} from '@/lib/ai/capability-registry';
import {
  resolveInjectableContext,
  type InjectableContext,
  type InjectableContextInput,
} from '@/lib/context/context-injection';
import type { CapsuleServiceDeps } from '@/lib/context/capsule-service';

export type MemoryType = 'semantic' | 'episodic' | 'procedural';

export interface KernelMemoryItem {
  id: string;
  text: string;
  type: MemoryType;
  capsuleId?: string;
  deletedAt?: string | null;
  updatedAt?: string;
}

export interface TurnCapsule {
  traceId: string;
  capsuleId: string;
  capsuleVersion: number;
  stack: {
    stackId: string;
    label: string;
    scope: string;
    parentCapsuleId: string | null;
    forkedFromVersion: number | null;
    activeForSituationIds: string[];
    lockedCoreKinds: string[];
  };
  userCore: string | null;
  situationCore: string | null;
  sourceDocumentCore: string[];
  graphCore: string | null;
  memoryCore: string | null;
  outputCore: string[];
  retrievedEvidence: Array<{ id: string; title: string; citation?: string; excerpt?: string }>;
  graphProposalCounts: { proposed: number; accepted: number; rejected: number };
  activeGaps: string[];
  recentToolOutputs: string[];
  tokenBudgetReport: { maxInputTokens: number; reservedOutputTokens: number; estimatedContextChars: number };
  injectableContext: InjectableContext;
  memory: Record<MemoryType, KernelMemoryItem[]>;
}

export interface TurnCapsuleInput extends InjectableContextInput {
  query?: string;
  traceId?: string;
  retrievedEvidence?: TurnCapsule['retrievedEvidence'];
  graphProposalCounts?: Partial<TurnCapsule['graphProposalCounts']>;
  activeGaps?: string[];
  recentToolOutputs?: string[];
  memoryItems?: KernelMemoryItem[];
}

export interface RunCapabilityInput {
  capabilityId: CapabilityId;
  capsule: TurnCapsule;
  payload?: Record<string, unknown>;
  actionLabel?: string;
}

export interface CapabilityRunPlan {
  capability: CapabilityDefinition;
  routeFamily: CapabilityDefinition['routeFamily'];
  canonicalPath: CapabilityDefinition['canonicalPath'];
  requiredCores: CapabilityDefinition['requiredCores'];
  persistenceTarget: CapabilityDefinition['persistenceTarget'];
  payload: Record<string, unknown>;
  traceId: string;
  receipt: SuggestedActionReceipt;
}

export interface SemanticNextAction {
  id: 'find_sources' | 'extract_commitments' | 'map_stakeholders' | 'draft_memo' | 'review_weak_claim' | 'build_scenario';
  label: 'Find sources' | 'Extract commitments' | 'Map stakeholders' | 'Draft memo' | 'Review weak claim' | 'Build scenario';
  detail: string;
  href: string;
  prompt: string;
  priority: number;
  capabilityId: CapabilityId;
}

export interface SuggestedActionReceipt {
  actionId: string;
  capabilityId: CapabilityId;
  capsuleId: string;
  capsuleVersion: number;
  routeFamily: CapabilityDefinition['routeFamily'];
  traceId: string;
  status: 'planned' | 'running' | 'succeeded' | 'failed';
  actionLabel: string;
  createdAt: string;
}

const DEFAULT_MAX_INPUT_TOKENS = 24_000;
const DEFAULT_RESERVED_OUTPUT_TOKENS = 4_000;

export async function buildTurnCapsule(
  input: TurnCapsuleInput,
  deps?: CapsuleServiceDeps,
): Promise<TurnCapsule> {
  const injectableContext = await resolveInjectableContext(input, deps);
  const refs = injectableContext.capsule.coreRefs;
  const memory = groupVisibleMemory(input.memoryItems ?? [], injectableContext.capsule.capsuleId);
  const estimatedContextChars = [
    injectableContext.promptBlock,
    input.query ?? '',
    ...Object.values(memory).flat().map((item) => item.text),
    ...(input.activeGaps ?? []),
    ...(input.recentToolOutputs ?? []),
  ].join('\n').length;

  return {
    traceId: input.traceId ?? `turn_${Date.now().toString(36)}`,
    capsuleId: injectableContext.capsule.capsuleId,
    capsuleVersion: injectableContext.capsule.version,
    stack: {
      stackId: injectableContext.capsule.capsuleId,
      label: injectableContext.capsule.label,
      scope: injectableContext.capsule.scope,
      parentCapsuleId: injectableContext.capsule.parentCapsuleId,
      forkedFromVersion: injectableContext.capsule.forkedFromVersion,
      activeForSituationIds: injectableContext.capsule.activeForSituationIds,
      lockedCoreKinds: injectableContext.capsule.lockedCoreKinds,
    },
    userCore: refs.userCoreId ?? null,
    situationCore: refs.situationCoreId ?? null,
    sourceDocumentCore: [...refs.sourceCoreIds, ...refs.documentCoreIds],
    graphCore: refs.graphCoreId ?? null,
    memoryCore: refs.memoryCoreId ?? null,
    outputCore: refs.outputCoreIds,
    retrievedEvidence: input.retrievedEvidence ?? [],
    graphProposalCounts: {
      proposed: input.graphProposalCounts?.proposed ?? 0,
      accepted: input.graphProposalCounts?.accepted ?? 0,
      rejected: input.graphProposalCounts?.rejected ?? 0,
    },
    activeGaps: input.activeGaps ?? injectableContext.capsule.health.warnings,
    recentToolOutputs: input.recentToolOutputs ?? [],
    tokenBudgetReport: {
      maxInputTokens: DEFAULT_MAX_INPUT_TOKENS,
      reservedOutputTokens: DEFAULT_RESERVED_OUTPUT_TOKENS,
      estimatedContextChars,
    },
    injectableContext,
    memory,
  };
}

export function suggestNextActions(capsule: TurnCapsule, surface: 'ask' | 'drafting' = 'ask'): SemanticNextAction[] {
  const missingSources = capsule.sourceDocumentCore.length === 0;
  const hasGaps = capsule.activeGaps.length > 0;
  const base = [
    action('find_sources', missingSources ? 98 : hasGaps ? 84 : 48, 'Find sources', 'Fill the most important source gaps before relying on this answer.', '/app/workbench?tab=library', 'Find sources for the weakest claims in the active Context Capsule.', 'source-search'),
    action('extract_commitments', capsule.sourceDocumentCore.length ? 86 : 52, 'Extract commitments', 'Pull commitments, obligations, claims, and dates into reviewable proposals.', '/app/canvas', 'Extract commitments and claims from the active capsule sources.', 'commitment-tracking'),
    action('map_stakeholders', capsule.graphCore ? 62 : 80, 'Map stakeholders', 'Turn actors, claims, and relationships into reviewable graph proposals.', '/app/canvas', 'Map stakeholders, commitments, and evidence gaps from the active capsule.', 'stakeholder-mapping'),
    action('draft_memo', surface === 'drafting' ? 92 : 68, 'Draft memo', 'Move the answer into an Output Core with citations and explicit gaps.', '/app/write', 'Draft a concise options memo from this capsule and mark weak evidence.', 'brief-generation'),
    action('review_weak_claim', hasGaps ? 90 : 58, 'Review weak claim', 'Check weak evidence, contradictions, and stale context.', '/app/assistant', 'Review the weakest claim for evidence gaps and unresolved contradictions.', 'evidence-critique'),
    action('build_scenario', capsule.situationCore ? 64 : 40, 'Build scenario', 'Project next plausible paths from the current capsule.', '/app/canvas', 'Build scenario branches from the active situation capsule.', 'scenario-projection'),
  ].sort((a, b) => b.priority - a.priority);

  return base.slice(0, 3);
}

export function runCapability(input: RunCapabilityInput): CapabilityRunPlan {
  const capability = getCapability(input.capabilityId);
  const actionLabel = input.actionLabel ?? capability.capabilityId;
  const receipt: SuggestedActionReceipt = {
    actionId: `action_${input.capsule.traceId}_${capability.capabilityId}`,
    capabilityId: capability.capabilityId,
    capsuleId: input.capsule.capsuleId,
    capsuleVersion: input.capsule.capsuleVersion,
    routeFamily: capability.routeFamily,
    traceId: input.capsule.traceId,
    status: 'planned',
    actionLabel,
    createdAt: new Date().toISOString(),
  };
  return {
    capability,
    routeFamily: capability.routeFamily,
    canonicalPath: capability.canonicalPath,
    requiredCores: capability.requiredCores,
    persistenceTarget: capability.persistenceTarget,
    payload: {
      ...(input.payload ?? {}),
      capsuleId: input.capsule.capsuleId,
      capsuleVersion: input.capsule.capsuleVersion,
      traceId: input.capsule.traceId,
      capabilityId: capability.capabilityId,
      actionLabel,
    },
    traceId: input.capsule.traceId,
    receipt,
  };
}

export async function persistSuggestedActionReceipt(
  uid: string,
  receipt: SuggestedActionReceipt,
  deps?: CapsuleServiceDeps,
): Promise<SuggestedActionReceipt> {
  const db = deps?.db;
  if (!db) return receipt;
  await db
    .collection('users')
    .doc(uid)
    .collection('capability_action_receipts')
    .doc(receipt.actionId)
    .set(receipt, { merge: true });
  return receipt;
}

function groupVisibleMemory(items: KernelMemoryItem[], capsuleId: string): TurnCapsule['memory'] {
  const grouped: TurnCapsule['memory'] = { semantic: [], episodic: [], procedural: [] };
  for (const item of items) {
    if (item.deletedAt) continue;
    if (item.capsuleId && item.capsuleId !== capsuleId && item.capsuleId !== '__global__') continue;
    grouped[item.type].push(item);
  }
  return grouped;
}

function action(
  id: SemanticNextAction['id'],
  priority: number,
  label: SemanticNextAction['label'],
  detail: string,
  href: string,
  prompt: string,
  capabilityId: CapabilityId,
): SemanticNextAction {
  return { id, priority, label, detail, href, prompt, capabilityId };
}
