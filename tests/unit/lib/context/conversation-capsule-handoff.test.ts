import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { CAPSULE_NOTES_MAX_CHARS, saveConversationCapsuleHandoff, readConversationCapsuleHandoff, clearConversationCapsuleHandoff, prepareArchitectNotes } from '@/lib/context/conversation-capsule-handoff';

function storage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}

describe('conversation capsule handoff', () => {
  it('retains provenance and separates supplied statements from AI suggestions', () => {
    const store = storage();
    const result = saveConversationCapsuleHandoff(store, { ownerId: 'owner', threadId: 'thread-a', capsuleId: 'capsule-a', messages: [
      { role: 'user', content: 'Map stakeholders for my consultation.' },
      { role: 'assistant', content: 'Consider municipal agencies.' },
    ], notes: 'Focus on local delivery.' });
    expect(result.notes).toContain('USER — supplied context');
    expect(result.notes).toContain('ASSISTANT — unverified AI suggestion');
    expect(result.notes).toContain('not independent evidence');
    expect(result.notes).toContain('Conversation: thread-a');
    expect(result.notes).toContain('Source capsule: capsule-a');
    expect(result.notes).toContain('composer notes (not yet sent)');
    expect(readConversationCapsuleHandoff(store, 'owner')).toEqual(result);
  });

  it('bounds input, preserves recent turns, and clearly marks omitted content', () => {
    const result = saveConversationCapsuleHandoff(storage(), { ownerId: 'owner', messages: Array.from({ length: 80 }, (_, index) => ({ role: 'user' as const, content: `Turn ${index}: ${'x'.repeat(5000)}` })) });
    expect(result.notes.length).toBeLessThanOrEqual(CAPSULE_NOTES_MAX_CHARS);
    expect(result.purpose.length).toBeLessThanOrEqual(4000);
    expect(result.notes).toContain('Bounded excerpt');
    expect(result.notes).toContain('Turn 79');
    expect(result.purpose).toContain('Turn 79');
    expect(result.notes).not.toContain('Turn 0:');
  });

  it('accepts standalone ideas and rejects empty drafts', () => {
    expect(saveConversationCapsuleHandoff(storage(), { ownerId: 'owner', messages: [], notes: 'My idea' }).notes).toContain('My idea');
    expect(() => saveConversationCapsuleHandoff(storage(), { ownerId: 'owner', messages: [] })).toThrow('Add an idea');
  });

  it('does not expose another owner or expired drafts and removes only the current owner handoff', () => {
    const store = storage();
    saveConversationCapsuleHandoff(store, { ownerId: 'owner', messages: [], notes: 'Private idea' });
    expect(readConversationCapsuleHandoff(store, 'other')).toBeNull();
    clearConversationCapsuleHandoff(store, 'other');
    expect(readConversationCapsuleHandoff(store, 'owner')).not.toBeNull();
    expect(readConversationCapsuleHandoff(store, 'owner', Date.now() + 3 * 60 * 60 * 1000)).toBeNull();
    clearConversationCapsuleHandoff(store, 'owner');
    expect(readConversationCapsuleHandoff(store, 'owner')).toBeNull();
  });

  it('reports storage failure before navigation and safely rejects malformed data', () => {
    const store = storage();
    expect(() => saveConversationCapsuleHandoff({ ...store, setItem: () => { throw new Error('quota'); } }, { ownerId: 'owner', messages: [], notes: 'Idea' })).toThrow('could not be carried');
    expect(readConversationCapsuleHandoff({ ...store, getItem: () => '{broken' }, 'owner')).toBeNull();
  });
});

describe('notes to canonical evidence intake', () => {
  it('uploads labeled notes, reads the saved source, and reuses its receipt on retry', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ situation: { id: 'private-case' } }))
      .mockResolvedValueOnce(Response.json({ documentId: 'notes-doc' }))
      .mockResolvedValueOnce(Response.json({ document: { previewText: 'Stored working notes' } }));
    const receipt = await prepareArchitectNotes('My idea', { fetcher });
    const file = (fetcher.mock.calls[1][1].body as FormData).get('file') as File;
    expect(await file.text()).toContain('Review-only working notes');
    expect(await file.text()).toContain('not independent evidence');
    expect(receipt.document.documentId).toBe('notes-doc');
    expect(receipt.document.text).toBe('Stored working notes');
    const retry = await prepareArchitectNotes('My idea', { fetcher, previous: receipt, situationId: 'private-case' });
    expect(retry).toBe(receipt);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('fails visibly when no stored source is readable instead of sending fabricated evidence', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response('', { status: 503 }));
    await expect(prepareArchitectNotes('My idea', { situationId: 'case', fetcher })).rejects.toThrow('Upload failed');
    await expect(prepareArchitectNotes('x'.repeat(12001), { fetcher })).rejects.toThrow('12,000');
  });

  it('both conversation surfaces use the review builder and builder accepts notes-only input', () => {
    for (const path of ['src/components/app/praxis-chat.tsx', 'src/components/praxis/tasklet-praxis-workbench.tsx']) {
      const source = readFileSync(path, 'utf8');
      expect(source).toContain('saveConversationCapsuleHandoff(window.sessionStorage');
      expect(source).toContain("router.push('/app/capsules/builder?from=conversation')");
      expect(source).toContain('Build capsule from conversation');
    }
    const builder = readFileSync('src/components/capsules/CapsuleBuilderWizard.tsx', 'utf8');
    expect(builder).toContain('!architectDocuments.length && !sourceNotes.trim()');
    expect(builder).toContain('await prepareArchitectNotes(sourceNotes');
    expect(builder).toContain('documents = [...documents, receipt.document]');
    expect(builder).toContain('/api/capsules/assist/architect');
    const chat = readFileSync('src/components/app/praxis-chat.tsx', 'utf8');
    expect(chat.slice(chat.indexOf('export function PraxisChat'), chat.indexOf('function ConversationCapsuleButton'))).not.toContain('useAuth()');
    expect(chat).toContain('!isPublic && !demoMode');
  });
});
