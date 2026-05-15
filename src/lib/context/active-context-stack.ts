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
    updatedAt: new Date(0).toISOString(),
    schemaVersion: 1,
  };
}

export function sanitizeActiveContextStack(input: unknown): ActiveContextStackState {
  const body = isRecord(input) ? input : {};
  const stackId = stringOrNull(body.stackId) ?? DEFAULT_CONTEXT_STACK_ID;
  const layout = isRecord(body.canvasLayout) ? body.canvasLayout : {};

  return {
    stackId: stackId.slice(0, 80),
    capsuleId: stringOrNull(body.capsuleId),
    contextPackageId: stringOrNull(body.contextPackageId),
    userModelId: stringOrNull(body.userModelId),
    situationId: stringOrNull(body.situationId),
    sourceIds: stringList(body.sourceIds).slice(0, 50),
    documentIds: stringList(body.documentIds).slice(0, 50),
    outputGoal: stringOrNull(body.outputGoal),
    evidenceGaps: sanitizeEvidenceGaps(body.evidenceGaps),
    canvasLayout: sanitizeCanvasLayout(layout),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
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
