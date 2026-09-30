import { ContextCapsuleSchema } from '@/lib/ai/schemas/context-capsule';
import type { ContextCapsule } from '@/types/context-capsule';
import type { ArchitectDocumentDraft } from './architect-document-intake';

const KEY = 'praxis:builder-working-draft:v1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_BYTES = 600_000;
type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface BuilderWorkingDraft {
  capsule: ContextCapsule;
  purpose: string;
  notes: string;
  documents: ArchitectDocumentDraft[];
  situationId?: string;
  savedCapsuleId: string | null;
  savedFingerprint: string | null;
}

/** Content snapshot excludes generated identity: assigning a private id is not an edit. */
export function builderDraftFingerprint(draft: Pick<BuilderWorkingDraft, 'capsule' | 'purpose' | 'notes' | 'documents'>): string {
  const { id: _id, ...capsule } = draft.capsule;
  return JSON.stringify({ capsule, purpose: draft.purpose, notes: draft.notes, documents: draft.documents.map((document) => document.documentId) });
}

export function saveBuilderWorkingDraft(storage: DraftStorage, ownerId: string, draft: BuilderWorkingDraft, now = Date.now()): boolean {
  if (!ownerId) return false;
  try {
    const serialized = JSON.stringify({ version: 1, ownerId, createdAt: now, draft });
    if (serialized.length > MAX_BYTES) return false;
    storage.setItem(KEY, serialized);
    return true;
  } catch { return false; }
}

export function readBuilderWorkingDraft(storage: DraftStorage, ownerId: string, now = Date.now()): BuilderWorkingDraft | null {
  try {
    const raw = storage.getItem(KEY);
    if (!ownerId || !raw || raw.length > MAX_BYTES) return null;
    const value = JSON.parse(raw);
    if (value.version !== 1 || value.ownerId !== ownerId || typeof value.createdAt !== 'number'
      || value.createdAt > now || now - value.createdAt > MAX_AGE_MS) return null;
    const draft = value.draft;
    const parsed = ContextCapsuleSchema.safeParse(draft?.capsule);
    if (!parsed.success || typeof draft.purpose !== 'string' || draft.purpose.length > 4000
      || typeof draft.notes !== 'string' || draft.notes.length > 12000 || !Array.isArray(draft.documents) || draft.documents.length > 20
      || !draft.documents.every((document: ArchitectDocumentDraft) => document && ['documentId', 'title', 'mimeType', 'originalUri', 'text'].every((key) => typeof document[key as keyof ArchitectDocumentDraft] === 'string') && document.text.length <= 16000)
      || (draft.situationId !== undefined && typeof draft.situationId !== 'string')
      || (draft.savedCapsuleId !== null && typeof draft.savedCapsuleId !== 'string')
      || (draft.savedFingerprint !== null && typeof draft.savedFingerprint !== 'string')) return null;
    return { ...draft, capsule: parsed.data as ContextCapsule };
  } catch { return null; }
}

export function clearBuilderWorkingDraft(storage: DraftStorage): void {
  try { storage.removeItem(KEY); } catch { /* Canonical saves do not depend on tab storage. */ }
}

/** A receipt for an older snapshot must never trigger navigation to apparent current work. */
export async function saveCurrentBuilderForUse(input: {
  fingerprint: string;
  currentFingerprint: () => string;
  save: () => Promise<string | null>;
}): Promise<string | null> {
  const id = await input.save();
  return id && input.fingerprint === input.currentFingerprint() ? id : null;
}
