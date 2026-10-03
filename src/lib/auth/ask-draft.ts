import { QUESTION_HANDOFF_TTL_MS } from './question-handoff';
type TabStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const key = (owner: string, thread: string) => `praxis.ask-draft.v1.${JSON.stringify([owner, thread])}`;
export function saveAskDraft(storage: TabStorage, owner: string, thread: string, text: string, now = Date.now()): void {
  if (!owner || !thread || text.length > 12000) throw new Error('Draft requires an account, thread and at most 12,000 characters.');
  if (!text) { storage.removeItem(key(owner, thread)); return; }
  storage.setItem(key(owner, thread), JSON.stringify({ schemaVersion: 1, owner, thread, text, expiresAt: now + QUESTION_HANDOFF_TTL_MS }));
}
export function readAskDraft(storage: TabStorage, owner: string, thread: string, now = Date.now()): string | null {
  if (!owner || !thread) return null;
  try {
    const record = JSON.parse(storage.getItem(key(owner, thread)) ?? 'null');
    if (!record || record.schemaVersion !== 1 || record.owner !== owner || record.thread !== thread || typeof record.text !== 'string' || record.text.length > 12000 || !Number.isFinite(record.expiresAt) || record.expiresAt > now + QUESTION_HANDOFF_TTL_MS) return null;
    if (record.expiresAt <= now) { storage.removeItem(key(owner, thread)); return null; }
    return record.text;
  } catch { return null; }
}
