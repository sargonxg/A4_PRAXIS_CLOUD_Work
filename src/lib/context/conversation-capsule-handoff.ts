import { ingestArchitectDocuments, type ArchitectDocumentDraft } from './architect-document-intake';

export const CAPSULE_NOTES_MAX_CHARS = 12000;
const HANDOFF_KEY = 'praxis:capsule-conversation:v1';
const MAX_AGE_MS = 2 * 60 * 60 * 1000;
const PROVENANCE = 'Review-only working notes. User statements are user-provided context, not verified facts. Assistant suggestions are AI-generated and are not independent evidence. Corroborate factual claims before approving or reusing them.';

export interface ConversationCapsuleHandoff {
  version: 1;
  ownerId: string;
  createdAt: number;
  purpose: string;
  notes: string;
}

type HandoffStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function saveConversationCapsuleHandoff(storage: HandoffStorage, input: {
  ownerId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  notes?: string;
  threadId?: string | null;
  capsuleId?: string | null;
}, now = Date.now()): ConversationCapsuleHandoff {
  if (!input.ownerId) throw new Error('Sign in before preparing a capsule.');
  const messages = input.messages.filter((message) => message.content.trim());
  const blocks = messages.slice(-20).map((message) => `${message.role === 'user' ? 'USER — supplied context' : 'ASSISTANT — unverified AI suggestion'}:\n${message.content.trim().slice(0, 3000)}${message.content.trim().length > 3000 ? '\n[Message shortened]' : ''}`);
  if (input.notes?.trim()) blocks.push(`USER — composer notes (not yet sent):\n${input.notes.trim()}`);
  if (!blocks.length) throw new Error('Add an idea or have a conversation first.');
  const header = `${PROVENANCE}\nConversation: ${(input.threadId ?? 'unspecified').slice(0, 180)}\nSource capsule: ${(input.capsuleId ?? 'none').slice(0, 180)}\n\n`;
  let shortened = messages.length > 20 || messages.some((message) => message.content.trim().length > 3000);
  while (blocks.length > 1 && blocks.join('\n\n').length > CAPSULE_NOTES_MAX_CHARS - header.length - 100) {
    blocks.shift();
    shortened = true;
  }
  const body = blocks.join('\n\n');
  const remaining = CAPSULE_NOTES_MAX_CHARS - header.length - 100;
  shortened ||= body.length > remaining;
  const handoff: ConversationCapsuleHandoff = {
    version: 1, ownerId: input.ownerId, createdAt: now,
    purpose: (input.notes?.trim() || [...messages].reverse().find((message) => message.role === 'user')?.content.trim() || 'Create a capsule from this conversation.').slice(0, 4000),
    notes: header + (shortened ? '[Bounded excerpt: some conversation content was omitted or shortened.]\n\n' : '') + body.slice(0, remaining),
  };
  try { storage.setItem(HANDOFF_KEY, JSON.stringify(handoff)); }
  catch { throw new Error('Conversation could not be carried to the builder. Allow browser session storage, or copy your notes into the capsule builder.'); }
  return handoff;
}

export function readConversationCapsuleHandoff(storage: HandoffStorage, ownerId: string, now = Date.now()): ConversationCapsuleHandoff | null {
  try {
    const value = JSON.parse(storage.getItem(HANDOFF_KEY) ?? 'null');
    if (!value || value.version !== 1 || value.ownerId !== ownerId || !ownerId
      || typeof value.createdAt !== 'number' || value.createdAt > now || now - value.createdAt > MAX_AGE_MS
      || typeof value.purpose !== 'string' || value.purpose.length > 4000
      || typeof value.notes !== 'string' || value.notes.length > CAPSULE_NOTES_MAX_CHARS) return null;
    return value;
  } catch { return null; }
}

export function clearConversationCapsuleHandoff(storage: HandoffStorage, ownerId: string) {
  if (readConversationCapsuleHandoff(storage, ownerId)) {
    try { storage.removeItem(HANDOFF_KEY); } catch { /* Saved source receipt is authoritative. */ }
  }
}

export interface ArchitectNotesReceipt {
  notes: string;
  document: ArchitectDocumentDraft;
  situationId: string;
}

/** Reuse the saved receipt on an architect retry; edited notes become a new source. */
export async function prepareArchitectNotes(notes: string, options: {
  situationId?: string;
  workspaceName?: string;
  previous?: ArchitectNotesReceipt | null;
  fetcher?: typeof fetch;
}): Promise<ArchitectNotesReceipt> {
  const trimmed = notes.trim();
  if (!trimmed || trimmed.length > CAPSULE_NOTES_MAX_CHARS) throw new Error('Add notes of up to 12,000 characters.');
  if (options.previous?.notes === trimmed && (!options.situationId || options.previous.situationId === options.situationId)) return options.previous;
  const file = new File([`${PROVENANCE}\n\n${trimmed}`], 'working-notes-unverified.txt', { type: 'text/plain' });
  const result = await ingestArchitectDocuments([file], options);
  if (!result.documents[0] || !result.situationId) throw new Error(result.warnings.join(' ') || 'Notes could not be saved. Please retry.');
  return { notes: trimmed, document: result.documents[0], situationId: result.situationId };
}
