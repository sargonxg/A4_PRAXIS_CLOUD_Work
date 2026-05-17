export type WorkspaceNextMoveStatus = 'open' | 'done' | 'dismissed';

export interface WorkspaceNextMove {
  id: string;
  label: string;
  detail: string;
  href: string;
  emphasis: 'primary' | 'secondary' | 'subtle';
  status: WorkspaceNextMoveStatus;
  source: 'user-core-situation-core';
}

export interface WorkspaceNextMovesState {
  situationId: string;
  userModelId: string;
  moves: WorkspaceNextMove[];
  generatedAt: string;
  updatedAt: string;
}

const MAX_MOVES = 8;
const MAX_TEXT = 280;

function cleanText(value: unknown, max = MAX_TEXT): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  return cleaned ? cleaned.slice(0, max) : null;
}

function cleanHref(value: unknown): string | null {
  const href = cleanText(value, 500);
  if (!href) return null;
  if (href.startsWith('/app/') || href === '/app' || href.startsWith('/app?') || href.startsWith('#')) return href;
  return null;
}

function cleanEmphasis(value: unknown): WorkspaceNextMove['emphasis'] {
  return value === 'primary' || value === 'secondary' || value === 'subtle' ? value : 'secondary';
}

function cleanStatus(value: unknown): WorkspaceNextMoveStatus {
  return value === 'done' || value === 'dismissed' || value === 'open' ? value : 'open';
}

export function sanitizeNextMoveStatus(value: unknown): WorkspaceNextMoveStatus | null {
  return value === 'done' || value === 'dismissed' || value === 'open' ? value : null;
}

export function sanitizeWorkspaceNextMoves(input: {
  situationId: unknown;
  userModelId: unknown;
  moves: unknown;
  now?: string;
}): WorkspaceNextMovesState | null {
  const situationId = cleanText(input.situationId, 160);
  const userModelId = cleanText(input.userModelId, 160);
  if (!situationId || !userModelId || !Array.isArray(input.moves)) return null;

  const now = cleanText(input.now, 80) ?? new Date().toISOString();
  const moves: WorkspaceNextMove[] = [];
  const seen = new Set<string>();

  for (const raw of input.moves.slice(0, MAX_MOVES)) {
    if (!raw || typeof raw !== 'object') continue;
    const record = raw as Record<string, unknown>;
    const id = cleanText(record.id, 120);
    const label = cleanText(record.label, 80);
    const detail = cleanText(record.detail, 220);
    const href = cleanHref(record.href);
    if (!id || !label || !detail || !href || seen.has(id)) continue;
    seen.add(id);
    moves.push({
      id,
      label,
      detail,
      href,
      emphasis: cleanEmphasis(record.emphasis),
      status: cleanStatus(record.status),
      source: 'user-core-situation-core',
    });
  }

  if (moves.length === 0) return null;

  return {
    situationId,
    userModelId,
    moves,
    generatedAt: now,
    updatedAt: now,
  };
}

export function nextMovesDocId(situationId: string, userModelId: string): string {
  return `${situationId}__${userModelId}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 260);
}

export function updateNextMoveStatus(
  state: WorkspaceNextMovesState,
  moveId: string,
  status: WorkspaceNextMoveStatus,
  now = new Date().toISOString(),
): WorkspaceNextMovesState | null {
  let found = false;
  const moves = state.moves.map((move) => {
    if (move.id !== moveId) return move;
    found = true;
    return { ...move, status };
  });
  if (!found) return null;
  return { ...state, moves, updatedAt: now };
}

export function mergeWorkspaceNextMoves(
  previous: WorkspaceNextMovesState | null,
  next: WorkspaceNextMovesState,
): WorkspaceNextMovesState {
  if (!previous) return next;

  const previousById = new Map(previous.moves.map((move) => [move.id, move]));
  const mergedById = new Map<string, WorkspaceNextMove>();
  for (const move of next.moves) {
    const existing = previousById.get(move.id);
    mergedById.set(move.id, existing ? { ...move, status: existing.status } : move);
  }
  for (const move of previous.moves) {
    if (!mergedById.has(move.id)) mergedById.set(move.id, move);
  }

  return {
    ...next,
    generatedAt: previous.generatedAt,
    moves: Array.from(mergedById.values()).slice(0, MAX_MOVES),
  };
}
