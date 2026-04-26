/**
 * Analyst Notes — natural-language knowledge retention.
 *
 * Authored 2026-04-26 round 4. The user asked for a way the analyst can
 * type free-text facts into PRAXIS in plain language and have every tool
 * automatically consult them on the next run. This module is the storage
 * + retrieval contract.
 *
 * Storage: `users/{uid}/situations/{sitId}/analyst_notes/{noteId}` —
 * Firestore-admin-only. Each note carries:
 *   - text (free-form, ≤ 4000 chars)
 *   - tags[] (analyst-supplied keywords for filtering)
 *   - confidence ('high' | 'medium' | 'low' | 'unknown')
 *   - createdAt / updatedAt
 *   - authorUid (always === uid; surfaced for audit)
 *
 * Tools consume notes via:
 *   1. The corpus retriever — see the sibling "analyst-notes" layer
 *      proposed for `searchSituationCorpus` (round 5 brick).
 *   2. The prompt-injection helper `formatAnalystNotesBlock(notes)`
 *      renders a `## ANALYST NOTES (PROVIDED BY USER, TREAT AS HIGH-PRIORITY
 *      CONTEXT)` section that any calibrated route can prepend.
 *
 * Spec: docs/specs/2026-04-26-improvements/FF-analyst-notes.md (round-5
 * brick; this module ships the helper + tests today).
 */

import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

export const AnalystNoteSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(2).max(4000),
  tags: z.array(z.string().max(40)).max(12).default([]),
  confidence: z.enum(['high', 'medium', 'low', 'unknown']).default('medium'),
  authorUid: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type AnalystNote = z.infer<typeof AnalystNoteSchema>;

const COLLECTION = 'analyst_notes';

function notesRef(uid: string, situationId: string) {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized.');
  }
  return adminDb
    .collection('users')
    .doc(uid)
    .collection('situations')
    .doc(situationId)
    .collection(COLLECTION);
}

export async function addAnalystNote(
  uid: string,
  situationId: string,
  input: { text: string; tags?: string[]; confidence?: AnalystNote['confidence'] }
): Promise<string | null> {
  if (!adminDb) return null;
  const parsed = AnalystNoteSchema.safeParse({
    text: input.text,
    tags: input.tags ?? [],
    confidence: input.confidence ?? 'medium',
  });
  if (!parsed.success) {
    console.warn('[analyst-notes] invalid input:', parsed.error.flatten());
    return null;
  }
  const now = new Date().toISOString();
  const ref = await notesRef(uid, situationId).add({
    ...parsed.data,
    authorUid: uid,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateAnalystNote(
  uid: string,
  situationId: string,
  noteId: string,
  patch: Partial<Pick<AnalystNote, 'text' | 'tags' | 'confidence'>>
): Promise<boolean> {
  if (!adminDb) return false;
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (typeof patch.text === 'string') {
    if (patch.text.length < 2 || patch.text.length > 4000) return false;
    update.text = patch.text;
  }
  if (Array.isArray(patch.tags)) {
    update.tags = patch.tags.slice(0, 12).map((t) => t.slice(0, 40));
  }
  if (patch.confidence) update.confidence = patch.confidence;
  try {
    await notesRef(uid, situationId).doc(noteId).update(update);
    return true;
  } catch {
    return false;
  }
}

export async function listAnalystNotes(
  uid: string,
  situationId: string,
  max: number = 25
): Promise<AnalystNote[]> {
  if (!adminDb) return [];
  const limit = Math.min(Math.max(1, Math.floor(max)), 100);
  try {
    const snap = await notesRef(uid, situationId).orderBy('updatedAt', 'desc').limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AnalystNote, 'id'>) }));
  } catch {
    return [];
  }
}

export async function deleteAnalystNote(
  uid: string,
  situationId: string,
  noteId: string
): Promise<boolean> {
  if (!adminDb) return false;
  try {
    await notesRef(uid, situationId).doc(noteId).delete();
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper for prompt injection. Caller passes the result of
 * `listAnalystNotes(uid, situationId, 10)` and gets back a Markdown
 * block ready to prepend to a calibrated system prompt.
 *
 * Notes carry analyst confidence — the model is instructed to
 * treat them as PRIMARY context (the analyst types these in
 * deliberately) above generic web grounding, but BELOW direct
 * source documents the analyst uploaded.
 */
export function formatAnalystNotesBlock(notes: AnalystNote[]): string {
  if (notes.length === 0) {
    return '## ANALYST NOTES\nThe analyst has not added any free-text notes yet. If a fact is missing, ask via the clarifying-questions framework or mark it as an intelligence gap.';
  }
  const lines: string[] = [
    '## ANALYST NOTES (PROVIDED BY USER, TREAT AS HIGH-PRIORITY CONTEXT)',
    'The analyst has typed the following facts in plain language. They reflect the analyst\'s working knowledge — give them more weight than generic web priors when answering. Do NOT contradict an analyst note silently; if a note appears wrong relative to a primary source, flag the contradiction explicitly.',
    '',
  ];
  for (const note of notes) {
    const tags = note.tags && note.tags.length > 0 ? ` [${note.tags.join(', ')}]` : '';
    lines.push(`- (confidence: ${note.confidence})${tags} ${note.text}`);
  }
  return lines.join('\n');
}

export const __test__ = {
  formatAnalystNotesBlock,
};
