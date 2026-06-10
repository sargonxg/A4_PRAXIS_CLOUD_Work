export type ActiveContextBlockId = 'userCore' | 'situation' | 'sources' | 'thinkingDevices' | 'output';
export type ActiveCapsuleRole = 'primary' | 'reference' | 'comparison';

export const CAPSULE_MERGE_PRECEDENCE =
  'primary capsule governs; reference capsules fill gaps in explicit order; comparison capsules remain labeled context; duplicate capsule ids use the first occurrence.';

export interface ActiveContextBlockItem {
  id: string;
  capsuleId: string | null;
  label: string | null;
  role: string | null;
  primary: boolean;
  order: number;
}

export type ActiveContextBlocks = Record<ActiveContextBlockId, ActiveContextBlockItem[]>;

export interface ActiveCapsuleRef {
  capsuleId: string;
  label: string | null;
  role: ActiveCapsuleRole;
  primary: boolean;
  order: number;
  version: number | null;
}

export interface ActiveCapsuleRefInput {
  capsuleId: string;
  label?: string | null;
  role?: ActiveCapsuleRole | string | null;
  primary?: boolean;
  order?: number;
  version?: number | null;
}

export interface ActiveContextStackState {
  stackId: string;
  capsuleId: string | null;
  capsuleRefs: ActiveCapsuleRef[];
  contextPackageId: string | null;
  userModelId: string | null;
  situationId: string | null;
  sourceIds: string[];
  documentIds: string[];
  outputGoal: string | null;
  evidenceGaps: ActiveEvidenceGap[];
  canvasLayout: Record<string, { x: number; y: number }>;
  contextBlocks: ActiveContextBlocks;
  updatedAt: string;
  schemaVersion: 1;
}

export interface ActiveEvidenceGap {
  id: string;
  situationId: string | null;
  subjectId: string;
  claimId: string;
  claim: string;
  status: 'weak' | 'unsupported' | 'needs_date_check';
  sourceHints: string[];
  savedAt: string;
  resolvedAt: string | null;
}

export type CapsuleDockCompositionState = 'loading' | 'ready' | 'review' | 'thin' | 'blocked';
export type CapsuleDockWarningSeverity = 'info' | 'review' | 'blocking';

export interface CapsuleDockItem {
  capsuleId: string;
  label: string;
  role: ActiveCapsuleRole;
  roleLabel: string;
  primary: boolean;
  order: number;
  versionLabel: string;
}

export interface CapsuleDockWarning {
  id: 'loading' | 'no-saved-context' | 'missing-primary' | 'multiple-primary' | 'missing-output';
  severity: CapsuleDockWarningSeverity;
  label: string;
  detail: string;
}

export interface CapsuleDockModel {
  title: 'Capsule Dock';
  items: CapsuleDockItem[];
  counts: Record<ActiveCapsuleRole | 'total', number>;
  warnings: CapsuleDockWarning[];
  stackLabel: string;
  stackPolicyLabel: 'Track latest' | 'Pinned package';
  contextPackageLabel: string;
  persistenceLabel: string;
  compositionState: CapsuleDockCompositionState;
  canAskDirectly: boolean;
}

export const DEFAULT_CONTEXT_STACK_ID = 'default';

export function defaultActiveContextStack(): ActiveContextStackState {
  return {
    stackId: DEFAULT_CONTEXT_STACK_ID,
    capsuleId: null,
    capsuleRefs: [],
    contextPackageId: null,
    userModelId: null,
    situationId: null,
    sourceIds: [],
    documentIds: [],
    outputGoal: null,
    evidenceGaps: [],
    canvasLayout: {},
    contextBlocks: emptyContextBlocks(),
    updatedAt: new Date(0).toISOString(),
    schemaVersion: 1,
  };
}

export function sanitizeActiveContextStack(input: unknown): ActiveContextStackState {
  const body = isRecord(input) ? input : {};
  const stackId = stringOrNull(body.stackId) ?? DEFAULT_CONTEXT_STACK_ID;
  const layout = isRecord(body.canvasLayout) ? body.canvasLayout : {};
  const capsuleRefs = sanitizeCapsuleRefs(body.capsuleRefs, stringOrNull(body.capsuleId));
  const legacySourceIds = stringList(body.sourceIds).slice(0, 50);
  const legacyDocumentIds = stringList(body.documentIds).slice(0, 50);
  const legacyBlocks = contextBlocksFromLegacy({
    userModelId: stringOrNull(body.userModelId),
    situationId: stringOrNull(body.situationId),
    sourceIds: legacySourceIds,
    documentIds: legacyDocumentIds,
    outputGoal: stringOrNull(body.outputGoal),
  });
  const explicitBlocks = sanitizeContextBlocks(body.contextBlocks);
  const contextBlocks = mergeContextBlocks(explicitBlocks, legacyBlocks);
  const primaryUser = contextBlocks.userCore[0]?.id ?? null;
  const primarySituation = contextBlocks.situation[0]?.id ?? null;
  const primaryOutput = contextBlocks.output[0]?.id ?? null;
  const legacyDocumentIdSet = new Set(legacyDocumentIds);
  const blockSourceIds = contextBlocks.sources
    .filter((item) => item.role !== 'document' && !legacyDocumentIdSet.has(item.id))
    .map((item) => item.id);
  const blockDocumentIds = contextBlocks.sources
    .filter((item) => item.role === 'document' || legacyDocumentIdSet.has(item.id))
    .map((item) => item.id);

  return {
    stackId: stackId.slice(0, 80),
    capsuleId: capsuleRefs[0]?.capsuleId ?? stringOrNull(body.capsuleId),
    capsuleRefs,
    contextPackageId: stringOrNull(body.contextPackageId),
    userModelId: primaryUser ?? stringOrNull(body.userModelId),
    situationId: primarySituation ?? stringOrNull(body.situationId),
    sourceIds: uniqueStrings(blockSourceIds.length ? blockSourceIds : legacySourceIds).slice(0, 50),
    documentIds: uniqueStrings(blockDocumentIds.length ? blockDocumentIds : legacyDocumentIds).slice(0, 50),
    outputGoal: primaryOutput ?? stringOrNull(body.outputGoal),
    evidenceGaps: sanitizeEvidenceGaps(body.evidenceGaps),
    canvasLayout: sanitizeCanvasLayout(layout),
    contextBlocks,
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
}

export function attachCapsuleRef(
  stack: ActiveContextStackState,
  ref: ActiveCapsuleRefInput,
): ActiveContextStackState {
  const current = sanitizeActiveContextStack(stack);
  if (!stringOrNull(ref.capsuleId)) return current;
  const nextRefs = [
    ...current.capsuleRefs,
    {
      capsuleId: ref.capsuleId,
      label: ref.label ?? null,
      role: ref.role ?? (current.capsuleRefs.length ? 'reference' : 'primary'),
      primary: ref.primary ?? current.capsuleRefs.length === 0,
      version: ref.version ?? null,
    },
  ];
  return sanitizeActiveContextStack({
    ...current,
    capsuleId: current.capsuleId ?? ref.capsuleId,
    capsuleRefs: nextRefs,
  });
}

export function detachCapsuleRef(stack: ActiveContextStackState, capsuleId: string): ActiveContextStackState {
  const current = sanitizeActiveContextStack(stack);
  const target = stringOrNull(capsuleId);
  if (!target) return current;
  const nextRefs = current.capsuleRefs.filter((ref) => ref.capsuleId !== target);
  return sanitizeActiveContextStack({
    ...current,
    capsuleId: nextRefs[0]?.capsuleId ?? null,
    capsuleRefs: nextRefs,
  });
}

export function swapCapsuleRef(
  stack: ActiveContextStackState,
  currentCapsuleId: string,
  nextRef: ActiveCapsuleRefInput,
): ActiveContextStackState {
  const current = sanitizeActiveContextStack(stack);
  const target = stringOrNull(currentCapsuleId);
  const replacementId = stringOrNull(nextRef.capsuleId);
  if (!target || !replacementId) return current;
  const replacedRef = current.capsuleRefs.find((ref) => ref.capsuleId === target);
  let replaced = false;
  const nextRefs = current.capsuleRefs.flatMap((ref) => {
    if (ref.capsuleId !== target) return [ref];
    replaced = true;
    return [{
      capsuleId: replacementId,
      label: nextRef.label ?? ref.label,
      role: nextRef.role ?? ref.role,
      primary: nextRef.primary ?? ref.primary,
      order: ref.order,
      version: nextRef.version ?? ref.version,
    }];
  });
  if (!replaced) {
    nextRefs.push({
      capsuleId: replacementId,
      label: nextRef.label ?? null,
      role: nextRef.role ?? 'reference',
      primary: nextRef.primary ?? false,
      order: nextRefs.length,
      version: nextRef.version ?? null,
    });
  }
  return sanitizeActiveContextStack({
    ...current,
    capsuleId: replacedRef?.primary ? replacementId : current.capsuleId,
    capsuleRefs: nextRefs,
  });
}

export function buildCapsuleDockModel(
  stack: ActiveContextStackState,
  options: { hydrated?: boolean; persisted?: boolean } = {},
): CapsuleDockModel {
  const current = sanitizeActiveContextStack(stack);
  const hydrated = options.hydrated ?? true;
  const persisted = options.persisted ?? false;
  const items = current.capsuleRefs.map((ref) => ({
    capsuleId: ref.capsuleId,
    label: ref.label ?? shortenCapsuleId(ref.capsuleId),
    role: ref.role,
    roleLabel: roleLabel(ref.role),
    primary: ref.primary,
    order: ref.order,
    versionLabel: ref.version ? `v${ref.version}` : 'latest',
  }));
  const counts = {
    primary: items.filter((item) => item.role === 'primary').length,
    reference: items.filter((item) => item.role === 'reference').length,
    comparison: items.filter((item) => item.role === 'comparison').length,
    total: items.length,
  };
  const stackPolicyLabel = current.contextPackageId ? 'Pinned package' : 'Track latest';
  const contextPackageLabel = current.contextPackageId
    ? `Context package ${shortenCapsuleId(current.contextPackageId)}`
    : 'Package resolves on send';
  const warnings: CapsuleDockWarning[] = [];

  if (!hydrated) {
    warnings.push({
      id: 'loading',
      severity: 'info',
      label: 'Loading stack',
      detail: 'PRAXIS is reading the workspace context before finalizing the Dock.',
    });
  }

  if (items.length === 0) {
    warnings.push({
      id: 'no-saved-context',
      severity: 'info',
      label: 'Direct Ask',
      detail: 'No saved context is attached. Ask can continue, but serious work should attach context first.',
    });
  } else if (counts.primary === 0) {
    warnings.push({
      id: 'missing-primary',
      severity: 'blocking',
      label: 'Choose a primary capsule',
      detail: 'Saved context is attached, but no primary capsule is selected.',
    });
  } else if (counts.primary > 1) {
    warnings.push({
      id: 'multiple-primary',
      severity: 'blocking',
      label: 'Too many primary capsules',
      detail: 'Only one primary capsule can govern an Ask turn.',
    });
  }

  if (!current.outputGoal) {
    warnings.push({
      id: 'missing-output',
      severity: 'review',
      label: 'Output not set',
      detail: 'Set a memo, brief, or handoff target before final export.',
    });
  }

  const hasBlockingWarning = warnings.some((warning) => warning.severity === 'blocking');
  const hasReviewWarning = warnings.some((warning) => warning.severity === 'review');
  const compositionState: CapsuleDockCompositionState = !hydrated
    ? 'loading'
    : hasBlockingWarning
      ? 'blocked'
      : items.length === 0
        ? 'thin'
        : hasReviewWarning
          ? 'review'
          : 'ready';

  return {
    title: 'Capsule Dock',
    items,
    counts,
    warnings,
    stackLabel: formatStackLabel(current.stackId),
    stackPolicyLabel,
    contextPackageLabel,
    persistenceLabel: hydrated ? (persisted ? 'Workspace saved' : 'Local stack') : 'Loading stack',
    compositionState,
    canAskDirectly: !hasBlockingWarning,
  };
}

function emptyContextBlocks(): ActiveContextBlocks {
  return {
    userCore: [],
    situation: [],
    sources: [],
    thinkingDevices: [],
    output: [],
  };
}

function contextBlocksFromLegacy(input: {
  userModelId: string | null;
  situationId: string | null;
  sourceIds: string[];
  documentIds: string[];
  outputGoal: string | null;
}): ActiveContextBlocks {
  return {
    userCore: input.userModelId ? blockItems([{ id: input.userModelId, role: 'user' }]) : [],
    situation: input.situationId ? blockItems([{ id: input.situationId, role: 'situation' }]) : [],
    sources: blockItems([
      ...input.sourceIds.map((id) => ({ id, role: 'source' })),
      ...input.documentIds.map((id) => ({ id, role: 'document' })),
    ]),
    thinkingDevices: [],
    output: input.outputGoal ? blockItems([{ id: input.outputGoal, role: 'output' }]) : [],
  };
}

function sanitizeContextBlocks(value: unknown): ActiveContextBlocks {
  if (!isRecord(value)) return emptyContextBlocks();
  return {
    userCore: sanitizeBlockItems(value.userCore, 'user').slice(0, 8),
    situation: sanitizeBlockItems(value.situation, 'situation').slice(0, 8),
    sources: sanitizeBlockItems(value.sources, 'source').slice(0, 20),
    thinkingDevices: sanitizeBlockItems(value.thinkingDevices, 'tool').slice(0, 12),
    output: sanitizeBlockItems(value.output, 'output').slice(0, 8),
  };
}

function sanitizeCapsuleRefs(value: unknown, legacyCapsuleId: string | null): ActiveCapsuleRef[] {
  const rawRefs = Array.isArray(value)
    ? value.flatMap((item, index): Array<ActiveCapsuleRefInput & { originalOrder: number }> => {
        if (typeof item === 'string') return [{ capsuleId: item, role: 'reference', originalOrder: index }];
        if (!isRecord(item)) return [];
        const capsuleId = stringOrNull(item.capsuleId) ?? stringOrNull(item.id);
        if (!capsuleId) return [];
        return [{
          capsuleId,
          label: stringOrNull(item.label),
          role: stringOrNull(item.role),
          primary: item.primary === true,
          order: typeof item.order === 'number' && Number.isFinite(item.order) ? item.order : index,
          version: typeof item.version === 'number' && Number.isFinite(item.version) ? Math.floor(item.version) : null,
          originalOrder: index,
        }];
      })
    : [];

  if (legacyCapsuleId && !rawRefs.some((ref) => ref.capsuleId === legacyCapsuleId)) {
    rawRefs.unshift({
      capsuleId: legacyCapsuleId,
      label: null,
      role: 'primary',
      primary: true,
      order: -1,
      version: null,
      originalOrder: -1,
    });
  }

  const primaryId =
    legacyCapsuleId ??
    rawRefs.find((ref) => ref.primary || ref.role === 'primary')?.capsuleId ??
    rawRefs[0]?.capsuleId ??
    null;

  const deduped: Array<ActiveCapsuleRefInput & { originalOrder: number }> = [];
  for (const ref of rawRefs) {
    const capsuleId = stringOrNull(ref.capsuleId);
    if (!capsuleId || deduped.some((candidate) => candidate.capsuleId === capsuleId)) continue;
    deduped.push({
      ...ref,
      capsuleId,
      label: ref.label ? ref.label.slice(0, 240) : null,
      role: normalizeCapsuleRole(ref.role),
      originalOrder: ref.originalOrder,
    });
  }

  return deduped
    .sort((a, b) => {
      if (a.capsuleId === primaryId) return -1;
      if (b.capsuleId === primaryId) return 1;
      return a.originalOrder - b.originalOrder;
    })
    .slice(0, 12)
    .map((ref, index) => ({
      capsuleId: ref.capsuleId.slice(0, 160),
      label: ref.label ? ref.label.slice(0, 240) : null,
      role: index === 0 ? 'primary' : normalizeCapsuleRole(ref.role) === 'primary' ? 'reference' : normalizeCapsuleRole(ref.role),
      primary: index === 0,
      order: index,
      version: typeof ref.version === 'number' && Number.isFinite(ref.version) ? Math.max(1, Math.floor(ref.version)) : null,
    }));
}

function normalizeCapsuleRole(value: unknown): ActiveCapsuleRole {
  return value === 'primary' || value === 'reference' || value === 'comparison' ? value : 'reference';
}

function roleLabel(role: ActiveCapsuleRole): string {
  if (role === 'primary') return 'Primary';
  if (role === 'comparison') return 'Comparison';
  return 'Reference';
}

function formatStackLabel(stackId: string): string {
  if (stackId === DEFAULT_CONTEXT_STACK_ID) return 'Default stack';
  const label = stackId
    .replace(/[_:.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return shortenLabel(label || stackId, 48);
}

function shortenLabel(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 11)}...${value.slice(-8)}` : value;
}

function shortenCapsuleId(value: string): string {
  return value.length > 28 ? `${value.slice(0, 14)}...${value.slice(-8)}` : value;
}

function sanitizeBlockItems(value: unknown, fallbackRole: string): ActiveContextBlockItem[] {
  if (!Array.isArray(value)) return [];
  return blockItems(value.flatMap((item) => {
    if (typeof item === 'string') return [{ id: item, role: fallbackRole }];
    if (!isRecord(item)) return [];
    const id = stringOrNull(item.id) ?? stringOrNull(item.capsuleId);
    if (!id) return [];
    return [{
      id,
      capsuleId: stringOrNull(item.capsuleId) ?? id,
      label: stringOrNull(item.label),
      role: stringOrNull(item.role) ?? fallbackRole,
    }];
  }));
}

function blockItems(
  values: Array<{ id: string; capsuleId?: string | null; label?: string | null; role?: string | null }>,
): ActiveContextBlockItem[] {
  return uniqueById(values).map((item, index) => ({
    id: item.id.slice(0, 160),
    capsuleId: (item.capsuleId ?? item.id).slice(0, 160),
    label: item.label ? item.label.slice(0, 240) : null,
    role: item.role ? item.role.slice(0, 80) : null,
    primary: index === 0,
    order: index,
  }));
}

function mergeContextBlocks(explicitBlocks: ActiveContextBlocks, legacyBlocks: ActiveContextBlocks): ActiveContextBlocks {
  return {
    userCore: explicitBlocks.userCore.length ? explicitBlocks.userCore : legacyBlocks.userCore,
    situation: explicitBlocks.situation.length ? explicitBlocks.situation : legacyBlocks.situation,
    sources: explicitBlocks.sources.length ? explicitBlocks.sources : legacyBlocks.sources,
    thinkingDevices: explicitBlocks.thinkingDevices.length ? explicitBlocks.thinkingDevices : legacyBlocks.thinkingDevices,
    output: explicitBlocks.output.length ? explicitBlocks.output : legacyBlocks.output,
  };
}

function sanitizeEvidenceGaps(value: unknown): ActiveEvidenceGap[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).flatMap((item): ActiveEvidenceGap[] => {
    if (!isRecord(item)) return [];
    const id = stringOrNull(item.id);
    const subjectId = stringOrNull(item.subjectId);
    const claimId = stringOrNull(item.claimId);
    const claim = stringOrNull(item.claim);
    const status = item.status === 'weak' || item.status === 'unsupported' || item.status === 'needs_date_check'
      ? item.status
      : null;
    if (!id || !subjectId || !claimId || !claim || !status) return [];
    return [{
      id,
      situationId: stringOrNull(item.situationId),
      subjectId,
      claimId,
      claim,
      status,
      sourceHints: stringList(item.sourceHints).slice(0, 8),
      savedAt: stringOrNull(item.savedAt) ?? new Date().toISOString(),
      resolvedAt: stringOrNull(item.resolvedAt),
    }];
  });
}

function sanitizeCanvasLayout(layout: Record<string, unknown>): ActiveContextStackState['canvasLayout'] {
  const entries = Object.entries(layout).slice(0, 100);
  return Object.fromEntries(
    entries.flatMap(([id, value]) => {
      if (!isRecord(value)) return [];
      const x = typeof value.x === 'number' && Number.isFinite(value.x) ? value.x : null;
      const y = typeof value.y === 'number' && Number.isFinite(value.y) ? value.y : null;
      if (x === null || y === null) return [];
      return [[id.slice(0, 120), { x: Math.round(x), y: Math.round(y) }]];
    }),
  );
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim().slice(0, 160));
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, 240) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uniqueById<T extends { id: string }>(values: T[]): T[] {
  return values.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
}
