import {
  DEFAULT_CONTEXT_STACK_ID,
  sanitizeActiveContextStack,
  type ActiveContextBlocks,
  type ActiveContextStackState,
} from '@/lib/context/active-context-stack';
import {
  capsuleToStack,
  getCapsule,
  getOrMigrateDefaultCapsule,
  saveContextStackCompat,
  type CapsuleServiceDeps,
  type PraxisCapsule,
} from '@/lib/context/capsule-service';
import { buildCapsuleStarterPromptBlock } from '@/lib/product/context-capsules';

export interface InjectableContextInput {
  uid: string;
  capsuleId?: string | null;
  contextPackageId?: string | null;
  activeContextStack?: unknown;
  situationId?: string | null;
}

export interface InjectableContext {
  capsule: PraxisCapsule;
  associatedCapsules: PraxisCapsule[];
  missingAssociatedCapsuleIds: string[];
  stack: ActiveContextStackState;
  injectionKey: string;
  promptBlock: string;
  sharePath: string;
  resolvedAt: string;
}

export async function resolveInjectableContext(
  input: InjectableContextInput,
  deps?: CapsuleServiceDeps,
): Promise<InjectableContext> {
  const pointer = cleanPointer(input.capsuleId ?? input.contextPackageId);
  const incomingStack = input.activeContextStack
    ? sanitizeActiveContextStack(input.activeContextStack)
    : null;

  let capsule: PraxisCapsule | null = null;
  if (pointer) {
    capsule = await getCapsule(input.uid, pointer, deps);
  }

  let resolvedStack = incomingStack;
  if (!capsule && incomingStack && incomingStack.stackId === DEFAULT_CONTEXT_STACK_ID) {
    const saved = await saveContextStackCompat(input.uid, incomingStack, deps);
    capsule = saved.capsule;
    resolvedStack = saved.stack;
  }

  if (!capsule) {
    capsule = (await getOrMigrateDefaultCapsule(input.uid, deps)).capsule;
  }

  const stack = resolvedStack
    ? sanitizeActiveContextStack({ ...capsuleToStack(capsule), ...resolvedStack })
    : capsuleToStack(capsule);
  const resolvedAt = new Date().toISOString();
  const associated = await resolveAssociatedCapsules(input.uid, capsule, deps);
  return {
    capsule,
    associatedCapsules: associated.capsules,
    missingAssociatedCapsuleIds: associated.missingIds,
    stack,
    injectionKey: buildCapsuleInjectionKey(capsule),
    promptBlock: buildCapsulePromptBlock(capsule, {
      resolvedAt,
      situationId: input.situationId,
      activeContextStack: stack,
      associatedCapsules: associated.capsules,
      missingAssociatedCapsuleIds: associated.missingIds,
    }),
    sharePath: `/app?capsuleId=${encodeURIComponent(capsule.capsuleId)}`,
    resolvedAt,
  };
}

export function buildCapsuleInjectionKey(capsule: PraxisCapsule): string {
  return [
    'capsule',
    capsule.capsuleId,
    `v${capsule.version}`,
    `h${capsule.health.score}`,
    capsule.coreRefs.userCoreId ?? 'no-user',
    capsule.coreRefs.situationCoreId ?? 'no-situation',
  ].join(':');
}

export function buildCapsulePromptBlock(
  capsule: PraxisCapsule,
  input: {
    resolvedAt?: string;
    situationId?: string | null;
    activeContextStack?: ActiveContextStackState | null;
    associatedCapsules?: PraxisCapsule[];
    missingAssociatedCapsuleIds?: string[];
  } = {},
): string {
  const refs = capsule.coreRefs;
  const lines = [
    '<praxis-context-capsule>',
    'context_mode: praxis_lite',
    'display_label: ContextCapsule Lite',
    `capsule_id: ${capsule.capsuleId}`,
    `capsule_version: ${capsule.version}`,
    `injection_key: ${buildCapsuleInjectionKey(capsule)}`,
    `scope: ${capsule.scope}`,
    `health_score: ${capsule.health.score}`,
    `locked_cores: ${capsule.lockedCoreKinds.length ? capsule.lockedCoreKinds.join(', ') : 'none'}`,
    `resolved_at: ${input.resolvedAt ?? capsule.updatedAt}`,
    `active_situation: ${input.situationId ?? refs.situationCoreId ?? 'none'}`,
    '',
    '[governed_context_v2]',
    `schema_version: ${capsule.schemaVersion}`,
    `active_ontology_stack: ${capsule.activeOntologyStackId ?? 'ontology-stack-default'}`,
    `active_read_contract: ${capsule.activeReadContractId ?? 'read-contract-default'}`,
    `latest_gate_state: ${capsule.latestGateState ?? 'none'}`,
    `review_cards: ${capsule.readinessSummary?.reviewCardCount ?? 0}`,
    `advisory_memory_hits: ${capsule.readinessSummary?.advisoryMemoryHitCount ?? 0}`,
    `graph_proposals: ${capsule.readinessSummary?.graphProposalCount ?? 0}`,
    `review_required: ${capsule.readinessSummary?.reviewRequired ? 'yes' : 'no'}`,
    '',
    '[core_refs]',
    `user_core: ${refs.userCoreId ?? 'missing'}`,
    `situation_core: ${refs.situationCoreId ?? 'missing'}`,
    `path_core: ${refs.pathCoreId ?? 'missing'}`,
    `team_core: ${refs.teamCoreId ?? 'none'}`,
    `source_cores: ${refs.sourceCoreIds.length ? refs.sourceCoreIds.join(', ') : 'none'}`,
    `document_cores: ${refs.documentCoreIds.length ? refs.documentCoreIds.join(', ') : 'none'}`,
    `graph_core: ${refs.graphCoreId ?? 'none'}`,
    `time_core: ${refs.timeCoreId ?? 'none'}`,
    `output_cores: ${refs.outputCoreIds.length ? refs.outputCoreIds.join(', ') : 'none'}`,
    `tool_cores: ${refs.toolCoreIds?.length ? refs.toolCoreIds.join(', ') : 'none'}`,
    `objective_cores: ${refs.objectiveCoreIds?.length ? refs.objectiveCoreIds.join(', ') : 'none'}`,
    `product_cores: ${refs.productCoreIds?.length ? refs.productCoreIds.join(', ') : 'none'}`,
    `memory_core: ${refs.memoryCoreId ?? 'none'}`,
    '',
    buildCapsuleStarterPromptBlock(capsule.capsuleId, capsule.starterSnapshot),
    buildAssociatedCapsulesPromptBlock(input.associatedCapsules ?? [], input.missingAssociatedCapsuleIds ?? []),
    buildContextChainBlocksPromptBlock(input.activeContextStack?.contextBlocks),
    buildGenerationContractPromptBlock(capsule, input.associatedCapsules ?? []),
    buildAdvisoryMemoryPromptBlock(capsule),
    '[retrieval_policy]',
    `layers: ${capsule.retrievalPolicy.layers.join(', ')}`,
    `limit: ${capsule.retrievalPolicy.limit}`,
    `freshness_check: ${capsule.retrievalPolicy.checkFreshness ? 'on' : 'off'}`,
    `freshness_window_days: ${capsule.retrievalPolicy.freshnessWindowDays ?? 'default'}`,
    `stale_cores: ${formatStaleCores(refs, input.resolvedAt ?? capsule.updatedAt)}`,
    '',
    '[rules]',
    'Use this ContextCapsule Lite as the inherited working context for the answer.',
    'Capsules are the principal governed context.',
    'Outside model knowledge, online reading, and retrieval are supplemental only.',
    'Use outside information only to supplement, verify, or fill explicit gaps, and clearly mark when a claim comes from outside the capsule.',
    'Treat associated capsules as reference-only context. Do not merge their cores, documents, tools, or outputs into the primary capsule.',
    'Treat ContextCapsule Lite as the current PRAXIS-built lightweight institutional-memory object; full DIALECTICA-built capsules may arrive through the adapter later.',
    'Respect locked cores as fixed context. Do not suggest swapping them unless the user asks to unlock.',
    'Treat missing cores and warnings as constraints; do not invent their contents.',
    'Prefer cited source and document cores when making factual claims.',
    'If the capsule is thin, answer with caveats and propose the smallest context repair.',
    '</praxis-context-capsule>',
  ];

  if (capsule.health.warnings.length) {
    lines.splice(
      lines.indexOf('[rules]'),
      0,
      '[health_warnings]',
      ...capsule.health.warnings.slice(0, 8).map((warning) => `- ${warning}`),
      '',
    );
  }

  return lines.join('\n');
}

function buildGenerationContractPromptBlock(capsule: PraxisCapsule, associatedCapsules: PraxisCapsule[]): string {
  const outputTargets = capsule.coreRefs.outputCoreIds.length
    ? capsule.coreRefs.outputCoreIds.join(', ')
    : 'answer, memo, brief, source review, or handover as requested';
  const toolTargets = capsule.coreRefs.toolCoreIds?.length
    ? capsule.coreRefs.toolCoreIds.join(', ')
    : 'sourceability, grounded research, memo drafting, red-team review, and handover when available';
  return [
    '[llm_generation_contract]',
    'primary_capsule_governs: yes',
    `primary_capsule: ${capsule.capsuleId}`,
    `reference_capsule_count: ${associatedCapsules.length}`,
    `preferred_outputs: ${outputTargets}`,
    `preferred_tools: ${toolTargets}`,
    'generation_order:',
    '1. Read the active ContextCapsule and active ContextChain before answering.',
    '2. Treat capsule cores, source/document receipts, locked cores, and review cards as the highest-priority context.',
    '3. Use associated capsules only as labeled reference context; do not silently merge them into the primary capsule.',
    '4. Separate capsule-grounded facts, retrieved evidence, outside model knowledge, and user-provided assumptions in the answer.',
    '5. Turn missing or stale support into explicit evidence gaps with the smallest useful repair action.',
    '6. Preserve the requested output contract: answer, memo, brief, source review, boardroom pack, or handover.',
    '7. If the task needs durable multi-agent work, recommend or queue a capsule-bound AgentRun rather than improvising invisible work.',
    '8. Never claim a capsule, source, graph, memo, or external system was mutated unless the runtime returned a receipt for that mutation.',
    '',
  ].join('\n');
}

function buildAdvisoryMemoryPromptBlock(capsule: PraxisCapsule): string {
  const posture = memoryPostureOf(capsule);
  const advisory = stringArray(posture?.advisoryCogneeRecall).slice(0, 8);
  if (!advisory.length) return '';
  return [
    '[advisory_memory_non_canonical]',
    'Advisory memory - NOT canonical until a review card is applied.',
    ...advisory.map((item) => `- ${item}`),
    '',
  ].join('\n');
}

function memoryPostureOf(capsule: PraxisCapsule): Record<string, unknown> | null {
  if (isRecord(capsule.v3?.memoryPosture)) return capsule.v3.memoryPosture;
  if (isRecord(capsule.memoryPosture)) return capsule.memoryPosture;
  return null;
}

function formatStaleCores(refs: PraxisCapsule['coreRefs'], now: string): string {
  const freshness = refs.coreFreshness ?? {};
  const compare = Date.parse(now);
  if (Number.isNaN(compare)) return 'none';
  const staleIds = Object.entries(freshness)
    .filter(([, value]) => {
      const expiresAt = value.freshnessExpiresAt ? Date.parse(value.freshnessExpiresAt) : Number.NaN;
      return !Number.isNaN(expiresAt) && expiresAt < compare;
    })
    .map(([id]) => id);
  return staleIds.length ? staleIds.slice(0, 12).join(', ') : 'none';
}

function buildContextChainBlocksPromptBlock(blocks: ActiveContextBlocks | undefined): string {
  if (!blocks) {
    return [
      '[context_chain_blocks]',
      'Read every context_chain_blocks item in order; primary items lead the answer and secondary items remain governing context.',
      'user_core: none',
      'situation: none',
      'sources: none',
      'thinking_devices: none',
      'output: none',
      '',
    ].join('\n');
  }
  return [
    '[context_chain_blocks]',
    'Read every context_chain_blocks item in order; primary items lead the answer and secondary items remain governing context.',
    `user_core: ${formatContextBlockItems(blocks.userCore)}`,
    `situation: ${formatContextBlockItems(blocks.situation)}`,
    `sources: ${formatContextBlockItems(blocks.sources)}`,
    `thinking_devices: ${formatContextBlockItems(blocks.thinkingDevices)}`,
    `output: ${formatContextBlockItems(blocks.output)}`,
    '',
  ].join('\n');
}

function formatContextBlockItems(items: ActiveContextBlocks[keyof ActiveContextBlocks]): string {
  if (!items.length) return 'none';
  return items
    .map((item) => `${item.id} [${item.primary ? 'primary' : 'secondary'}]${item.label ? ` ${item.label}` : ''}`)
    .join('; ');
}

async function resolveAssociatedCapsules(
  uid: string,
  capsule: PraxisCapsule,
  deps?: CapsuleServiceDeps,
): Promise<{ capsules: PraxisCapsule[]; missingIds: string[] }> {
  const candidateIds = uniqueStrings(capsule.associatedCapsuleIds)
    .filter((capsuleId) => capsuleId !== capsule.capsuleId)
    .slice(0, 5);
  const capsules: PraxisCapsule[] = [];
  const missingIds: string[] = [];
  for (const capsuleId of candidateIds) {
    const associated = await getCapsule(uid, capsuleId, deps);
    if (!associated || associated.archivedAt) {
      missingIds.push(capsuleId);
      continue;
    }
    capsules.push(associated);
  }
  return { capsules, missingIds };
}

function buildAssociatedCapsulesPromptBlock(capsules: PraxisCapsule[], missingIds: string[]): string {
  return [
    '[associated_capsules]',
    capsules.length ? capsules.slice(0, 5).map(formatAssociatedCapsuleSummary).join('\n---\n') : 'none',
    missingIds.length ? `missing_or_archived: ${missingIds.join(', ')}` : 'missing_or_archived: none',
    '',
  ].join('\n');
}

function formatAssociatedCapsuleSummary(capsule: PraxisCapsule): string {
  return [
    `id: ${capsule.capsuleId}`,
    `label: ${capsule.label}`,
    'role: reference',
    `version: ${capsule.version}`,
    `scope: ${capsule.scope}`,
    `health: ${capsule.health.score} (${capsule.health.semaphore ?? 'not-checked'})`,
    `core_refs: ${formatReferenceCoreRefs(capsule.coreRefs)}`,
  ].join('\n');
}

function formatReferenceCoreRefs(refs: PraxisCapsule['coreRefs']): string {
  const values = [
    refs.userCoreId ? `user=${refs.userCoreId}` : null,
    refs.situationCoreId ? `situation=${refs.situationCoreId}` : null,
    refs.pathCoreId ? `path=${refs.pathCoreId}` : null,
    refs.sourceCoreIds.length ? `sources=${refs.sourceCoreIds.join('|')}` : null,
    refs.documentCoreIds.length ? `documents=${refs.documentCoreIds.join('|')}` : null,
    refs.graphCoreId ? `graph=${refs.graphCoreId}` : null,
    refs.timeCoreId ? `time=${refs.timeCoreId}` : null,
    refs.memoryCoreId ? `memory=${refs.memoryCoreId}` : null,
    refs.outputCoreIds.length ? `outputs=${refs.outputCoreIds.join('|')}` : null,
    refs.toolCoreIds?.length ? `tools=${refs.toolCoreIds.join('|')}` : null,
    refs.objectiveCoreIds?.length ? `objectives=${refs.objectiveCoreIds.join('|')}` : null,
    refs.productCoreIds?.length ? `products=${refs.productCoreIds.join('|')}` : null,
  ].filter(Boolean);
  return values.length ? values.join('; ') : 'none';
}

function cleanPointer(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned.slice(0, 120) : null;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim() ?? '').filter(Boolean)));
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
