import {
  DEFAULT_CONTEXT_STACK_ID,
  sanitizeActiveContextStack,
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

export interface InjectableContextInput {
  uid: string;
  capsuleId?: string | null;
  contextPackageId?: string | null;
  activeContextStack?: Partial<ActiveContextStackState> | null;
  situationId?: string | null;
}

export interface InjectableContext {
  capsule: PraxisCapsule;
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

  if (!capsule && incomingStack && incomingStack.stackId === DEFAULT_CONTEXT_STACK_ID) {
    capsule = (await saveContextStackCompat(input.uid, incomingStack, deps)).capsule;
  }

  if (!capsule) {
    capsule = (await getOrMigrateDefaultCapsule(input.uid, deps)).capsule;
  }

  const stack = capsuleToStack(capsule);
  const resolvedAt = new Date().toISOString();
  return {
    capsule,
    stack,
    injectionKey: buildCapsuleInjectionKey(capsule),
    promptBlock: buildCapsulePromptBlock(capsule, { resolvedAt, situationId: input.situationId }),
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
  input: { resolvedAt?: string; situationId?: string | null } = {},
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
    '[retrieval_policy]',
    `layers: ${capsule.retrievalPolicy.layers.join(', ')}`,
    `limit: ${capsule.retrievalPolicy.limit}`,
    `freshness_check: ${capsule.retrievalPolicy.checkFreshness ? 'on' : 'off'}`,
    `freshness_window_days: ${capsule.retrievalPolicy.freshnessWindowDays ?? 'default'}`,
    '',
    '[rules]',
    'Use this ContextCapsule Lite as the inherited working context for the answer.',
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

function cleanPointer(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned.slice(0, 120) : null;
}
