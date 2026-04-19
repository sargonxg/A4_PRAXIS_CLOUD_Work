import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export interface SaveToolOutputInput {
  uid: string;
  situationId: string | undefined;
  toolId: string;
  profileVersion: number;
  output: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Persists a tool's output to situations/{id}/tools/{toolId}.
 * No-op when situationId absent (e.g., cross-situation chat).
 * Failures logged but do not throw.
 */
export async function saveToolOutput(input: SaveToolOutputInput): Promise<void> {
  if (!input.situationId) return;
  try {
    const db = getAdminDbOrThrow();
    await db.collection('users').doc(input.uid)
      .collection('situations').doc(input.situationId)
      .collection('tools').doc(input.toolId)
      .set({
        toolId: input.toolId,
        output: input.output,
        profileVersion: input.profileVersion,
        metadata: input.metadata ?? {},
        generatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
  } catch (err) {
    console.warn('[save-tool-output] failed:', err);
  }
}
