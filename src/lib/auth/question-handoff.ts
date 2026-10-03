import { safeWorkspaceReturnTarget } from './post-login-redirect';

/** Temporary same-tab continuity only. Authenticated records remain server-owned. */
type TabStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
interface QuestionHandoff { schemaVersion: 1; id: string; text: string; target: string; ownerUid: string | null; expiresAt: number }
export const QUESTION_HANDOFF_TTL_MS = 30 * 60 * 1000;
export const validHandoffId = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const key = (id: string) => `praxis.question-handoff.v1.${id}`;
const publicIndex = 'praxis.question-handoff.v1.public-current';

export function saveQuestionHandoff(storage: TabStorage, input: { text: string; target: string; ownerUid?: string }, options: { now?: number; id?: string } = {}) {
  const text = input.text.trim();
  const target = safeWorkspaceReturnTarget(input.target);
  const id = options.id ?? crypto.randomUUID();
  if (!text || text.length > 12000 || !target || !validHandoffId(id)) throw new Error('Question could not be preserved in this tab.');
  // Avoid overwriting a prior operation, including two tabs using copied storage.
  if (storage.getItem(key(id))) throw new Error('Question handoff identifier already exists.');
  const record: QuestionHandoff = { schemaVersion: 1, id, text, target, ownerUid: input.ownerUid ?? null, expiresAt: (options.now ?? Date.now()) + QUESTION_HANDOFF_TTL_MS };
  storage.setItem(key(id), JSON.stringify(record));
  if (!input.ownerUid) storage.setItem(publicIndex, id);
  const url = new URL(target, 'https://praxis.invalid');
  url.searchParams.set('handoff', id);
  const destination = `${url.pathname}${url.search}`;
  return { id, destination, loginUrl: `/login?${new URLSearchParams({ mode: 'signup', redirect: destination })}` };
}

function read(storage: TabStorage, id: string, uid: string, now: number, target?: string): QuestionHandoff | null {
  if (!validHandoffId(id) || !uid) return null;
  try {
    const record = JSON.parse(storage.getItem(key(id)) ?? 'null') as QuestionHandoff | null;
    if (!record || record.schemaVersion !== 1 || record.id !== id || typeof record.text !== 'string' || !record.text.trim() || record.text.length > 12000 || typeof record.expiresAt !== 'number' || !Number.isFinite(record.expiresAt) || record.expiresAt > now + QUESTION_HANDOFF_TTL_MS || typeof record.target !== 'string' || safeWorkspaceReturnTarget(record.target) !== record.target || (record.ownerUid !== null && record.ownerUid !== uid)) return null;
    if (record.expiresAt <= now) { storage.removeItem(key(id)); return null; }
    if (target && new URL(record.target, 'https://praxis.invalid').pathname !== new URL(target, 'https://praxis.invalid').pathname) return null;
    return record;
  } catch { return null; }
}

/** Existence only: never render anonymous draft contents for a newly signed-in account. */
export function pendingQuestionHandoff(storage: TabStorage, id: string, uid: string, now = Date.now(), target?: string): boolean { return read(storage, id, uid, now, target) !== null; }

/** Cancelled login recovery: a claimed question is never displayed to signed-out visitors. */
export function readPublicQuestionHandoff(storage: TabStorage, now = Date.now()): string | null {
  const id = storage.getItem(publicIndex);
  if (!id) return null;
  const record = read(storage, id, 'public-unclaimed', now);
  return record?.ownerUid === null ? record.text : null;
}

/** Call only after an explicit Restore decision for the displayed signed-in account. */
export function claimQuestionHandoff(storage: TabStorage, id: string, uid: string, now = Date.now(), target?: string): QuestionHandoff | null {
  const record = read(storage, id, uid, now, target);
  if (!record) return null;
  const claimed = { ...record, ownerUid: uid };
  storage.setItem(key(id), JSON.stringify(claimed));
  return claimed;
}

export function consumeQuestionHandoff(storage: TabStorage, id: string, uid: string, now = Date.now()): boolean {
  const record = read(storage, id, uid, now);
  if (!record || record.ownerUid !== uid) return false;
  storage.removeItem(key(id));
  return true;
}
