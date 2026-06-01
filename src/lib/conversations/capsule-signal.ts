import { DEFAULT_CONTEXT_STACK_ID, sanitizeActiveContextStack, type ActiveContextStackState } from '@/lib/context/active-context-stack';
import { buildCapsulePromptBlock, type InjectableContext } from '@/lib/context/context-injection';
import type { PraxisCapsule, CapsuleCoreRefs } from '@/lib/context/capsule-service';
import { buildCapsuleRetrievalPlan, type TurnCapsule } from '@/lib/ai/context-kernel';
import type { AppliedConversationCapsule } from '@/lib/conversations/entitlements';

export interface ConversationCapsuleSignalInput {
  uid?: string | null;
  capsuleId?: string | null;
  contextPackageId?: string | null;
  appliedCapsules?: unknown;
  activeContextStack?: unknown;
}

export function hasConversationCapsuleSignal(input: ConversationCapsuleSignalInput): boolean {
  if (cleanSignal(input.contextPackageId)) return true;
  const capsuleId = cleanSignal(input.capsuleId);
  if (capsuleId && capsuleId !== 'default') return true;
  if (normalizeAppliedCapsuleRefs(input.appliedCapsules).length > 0) return true;
  const stack = isRecord(input.activeContextStack) ? sanitizeActiveContextStack(input.activeContextStack) : null;
  return Boolean(stack && (
    cleanSignal(stack.capsuleId) ||
    stack.capsuleRefs.length > 0 ||
    cleanSignal(stack.contextPackageId) ||
    cleanSignal(stack.situationId) ||
    cleanSignal(stack.userModelId) ||
    stack.sourceIds.length > 0 ||
    stack.documentIds.length > 0 ||
    stack.evidenceGaps.length > 0 ||
    cleanSignal(stack.outputGoal)
  ));
}

export function buildThinCapsuleFallback(input: ConversationCapsuleSignalInput): TurnCapsule {
  const now = new Date().toISOString();
  const stack = isRecord(input.activeContextStack)
    ? sanitizeActiveContextStack(input.activeContextStack)
    : {
        ...sanitizeActiveContextStack({}),
        capsuleId: cleanSignal(input.capsuleId),
        contextPackageId: cleanSignal(input.contextPackageId),
      };
  const appliedCapsules = normalizeAppliedCapsuleRefs(input.appliedCapsules);
  const capsuleId = cleanSignal(input.capsuleId)
    ?? cleanSignal(stack.capsuleId)
    ?? stack.capsuleRefs[0]?.capsuleId
    ?? cleanSignal(input.contextPackageId)
    ?? appliedCapsules[0]?.id
    ?? 'thin-capsule-fallback';
  const refs = buildFallbackCoreRefs(stack, appliedCapsules);
  const capsule: PraxisCapsule = {
    capsuleId,
    ownerUid: input.uid ?? 'unknown',
    scope: 'situation',
    parentCapsuleId: null,
    forkedFromVersion: null,
    associatedCapsuleIds: appliedCapsules.map((capsuleRef) => capsuleRef.id).filter((id) => id !== capsuleId),
    coreRefs: refs,
    retrievalPolicy: {
      layers: ['documents', 'sources', 'graph', 'tool-output'],
      limit: 8,
      checkFreshness: true,
      freshnessWindowDays: 30,
    },
    health: {
      score: 35,
      semaphore: 'amber',
      signals: [],
      missingCores: [],
      warnings: ['thin capsule fallback: resolver could not load the full capsule record; answer must treat this as partial context.'],
      blockers: [],
    },
    activeForSituationIds: refs.situationCoreId ? [refs.situationCoreId] : [],
    lockedCoreKinds: [],
    provenance: {
      source: 'api',
      createdBy: input.uid ?? 'unknown',
      parentCapsuleId: null,
      forkedFromVersion: null,
      notes: 'Thin fallback built from appliedCapsules and activeContextStack.',
    },
    access: {
      visibility: 'private',
      sharedWithUserIds: [],
      sharedWithOrgIds: [],
      allowClone: false,
      allowDownload: false,
      allowCommunityRating: false,
    },
    community: {
      favorite: false,
      userRating: null,
      averageRating: null,
      ratingCount: 0,
      tags: ['thin-fallback'],
      listedInMarketplace: false,
      publishedAt: null,
      cloneCount: 0,
      downloadCount: 0,
    },
    trust: {
      level: 'amber',
      score: 35,
      label: 'Thin capsule fallback',
      summary: 'Fallback built from client-supplied active context.',
      blockers: [],
      recommendations: ['Repair or select the full ContextCapsule before relying on detailed claims.'],
      checkedAt: now,
    },
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    schemaVersion: 1,
    version: 0,
    label: 'Thin capsule fallback',
  };
  const injectableContext: InjectableContext = {
    capsule,
    associatedCapsules: [],
    missingAssociatedCapsuleIds: [],
    stack: {
      ...stack,
      stackId: stack.stackId || DEFAULT_CONTEXT_STACK_ID,
      capsuleId,
      contextPackageId: cleanSignal(input.contextPackageId) ?? stack.contextPackageId,
      updatedAt: now,
    },
    injectionKey: `thin-fallback:${capsuleId}:v0`,
    promptBlock: [
      '<praxis-context-capsule-fallback>',
      'context_mode: thin capsule fallback',
      'warning: The full InjectableContext could not be resolved. Use only the fallback fields below and state uncertainty.',
      `capsule_id: ${capsuleId}`,
      `context_package_id: ${input.contextPackageId ?? stack.contextPackageId ?? 'none'}`,
      `applied_capsules: ${appliedCapsules.length ? appliedCapsules.map((item) => `${item.id}${item.role ? `(${item.role})` : ''}`).join(', ') : 'none'}`,
      `situation_core: ${refs.situationCoreId ?? 'missing'}`,
      `source_refs: ${refs.sourceCoreIds.length ? refs.sourceCoreIds.join(', ') : 'none'}`,
      `document_refs: ${refs.documentCoreIds.length ? refs.documentCoreIds.join(', ') : 'none'}`,
      `output_goal: ${stack.outputGoal ?? 'none'}`,
      'rule: Do not answer as ungrounded generic chat. Make the thin fallback visible and identify the missing capsule record as a context gap.',
      '</praxis-context-capsule-fallback>',
      '',
      buildCapsulePromptBlock(capsule, { resolvedAt: now, situationId: stack.situationId, activeContextStack: stack }),
    ].join('\n'),
    sharePath: `/app?capsuleId=${encodeURIComponent(capsuleId)}`,
    resolvedAt: now,
  };
  const baseCapsule = {
    traceId: `turn_thin_${Date.now().toString(36)}`,
    capsuleId,
    capsuleVersion: 0,
    stack: {
      stackId: capsuleId,
      label: capsule.label,
      scope: capsule.scope,
      parentCapsuleId: null,
      forkedFromVersion: null,
      activeForSituationIds: capsule.activeForSituationIds,
      lockedCoreKinds: [],
    },
    userCore: refs.userCoreId,
    situationCore: refs.situationCoreId,
    sourceDocumentCore: [...refs.sourceCoreIds, ...refs.documentCoreIds],
    graphCore: refs.graphCoreId,
    memoryCore: refs.memoryCoreId ?? null,
    outputCore: refs.outputCoreIds,
    retrievedEvidence: [],
    graphProposalCounts: { proposed: 0, accepted: 0, rejected: 0 },
    activeGaps: capsule.health.warnings,
    recentToolOutputs: [],
    tokenBudgetReport: {
      maxInputTokens: 24_000,
      reservedOutputTokens: 4_000,
      estimatedContextChars: 0,
      estimatedContextTokens: 0,
      droppedCores: [],
    },
    injectableContext,
    memory: { semantic: [], episodic: [], procedural: [] },
  } satisfies Omit<TurnCapsule, 'retrievalPlan'>;

  return {
    ...baseCapsule,
    retrievalPlan: buildCapsuleRetrievalPlan(baseCapsule),
  };
}

function buildFallbackCoreRefs(stack: ActiveContextStackState, appliedCapsules: AppliedCapsuleRef[]): CapsuleCoreRefs {
  const byRole = (role: string): string[] => appliedCapsules
    .filter((capsule) => capsule.role === role)
    .map((capsule) => capsule.id);
  return {
    userCoreId: byRole('user')[0] ?? stack.userModelId ?? null,
    teamCoreId: null,
    situationCoreId: byRole('situation')[0] ?? stack.situationId ?? stack.capsuleRefs[0]?.capsuleId ?? stack.capsuleId ?? null,
    pathCoreId: null,
    sourceCoreIds: uniqueStrings([...stack.sourceIds, ...byRole('source'), ...byRole('reference')]),
    documentCoreIds: uniqueStrings(stack.documentIds),
    graphCoreId: byRole('graph')[0] ?? null,
    timeCoreId: null,
    outputCoreIds: uniqueStrings([...byRole('output'), ...(stack.outputGoal ? [stack.outputGoal] : [])]),
    toolCoreIds: uniqueStrings(byRole('tool')),
    objectiveCoreIds: [],
    productCoreIds: [],
    memoryCoreId: byRole('memory')[0] ?? null,
  };
}

type AppliedCapsuleRef = Pick<AppliedConversationCapsule, 'id' | 'label'> & { role: string };

function normalizeAppliedCapsuleRefs(value: unknown): AppliedCapsuleRef[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): AppliedCapsuleRef[] => {
    if (!isRecord(item)) return [];
    const id = cleanSignal(item.id) ?? cleanSignal(item.capsuleId);
    if (!id) return [];
    return [{
      id,
      label: cleanSignal(item.label) ?? id,
      role: cleanSignal(item.role) ?? 'reference',
    }];
  }).slice(0, 12);
}

function cleanSignal(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, 160) : null;
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim() ?? '').filter(Boolean)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
