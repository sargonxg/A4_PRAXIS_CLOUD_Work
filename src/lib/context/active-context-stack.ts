export type ActiveContextBlockId = 'userCore' | 'situation' | 'sources' | 'thinkingDevices' | 'output';

export interface ActiveContextBlockItem {
  id: string;
  capsuleId: string | null;
  label: string | null;
  role: string | null;
  primary: boolean;
  order: number;
}

export type ActiveContextBlocks = Record<ActiveContextBlockId, ActiveContextBlockItem[]>;

export interface ActiveContextStackState {
  stackId: string;
  capsuleId: string | null;
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

export const DEFAULT_CONTEXT_STACK_ID = 'default';

export function defaultActiveContextStack(): ActiveContextStackState {
  return {
    stackId: DEFAULT_CONTEXT_STACK_ID,
    capsuleId: null,
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
    capsuleId: stringOrNull(body.capsuleId),
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
