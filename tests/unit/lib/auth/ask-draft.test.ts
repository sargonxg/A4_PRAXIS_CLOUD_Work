import { describe, expect, it } from 'vitest';
import { readAskDraft, saveAskDraft } from '@/lib/auth/ask-draft';
const now = 1000;
function storage() { const values = new Map<string, string>(); return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, text: string) => { values.set(key, text); }, removeItem: (key: string) => { values.delete(key); } }; }
describe('recoverable owner/thread draft', () => {
  it('survives refresh only for the exact account and thread', () => {
    const s = storage(); saveAskDraft(s, 'a', 'thread-1', 'Funding remains undecided.', now);
    expect(readAskDraft(s, 'a', 'thread-1', now)).toBe('Funding remains undecided.');
    expect(readAskDraft(s, 'b', 'thread-1', now)).toBeNull();
    expect(readAskDraft(s, 'a', 'thread-2', now)).toBeNull();
  });
  it('expires, clears deliberately and never falls back to anonymous ownership', () => {
    const s = storage(); expect(() => saveAskDraft(s, '', 'thread-1', 'Private', now)).toThrow();
    saveAskDraft(s, 'a', 'thread-1', 'Private', now);
    expect(readAskDraft(s, 'a', 'thread-1', now + 1800000)).toBeNull();
    saveAskDraft(s, 'a', 'thread-1', 'Newer', now); saveAskDraft(s, 'a', 'thread-1', '', now);
    expect(readAskDraft(s, 'a', 'thread-1', now)).toBeNull();
  });
  it('reports blocked writes rather than pretending the draft persisted', () => {
    expect(() => saveAskDraft({ getItem: () => null, setItem: () => { throw Error('blocked'); }, removeItem: () => {} }, 'a', 'thread-1', 'Private', now)).toThrow('blocked');
  });
});
