import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';

export interface SaveToolOutputInput {
  uid: string;
  situationId: string | undefined;
  toolId: string;
  profileVersion: number;
  output: unknown;
  metadata?: Record<string, unknown>;
  toolRunId?: string | null;
}

/**
 * Persists a tool's output to the canonical versioned tool-data envelope and
 * the legacy tools document for compatibility during the migration.
 *
 * Canonical: users/{uid}/situations/{id}/tool-data/{toolId}
 * Legacy:    users/{uid}/situations/{id}/tools/{toolId}
 *
 * No-op when situationId absent (e.g., cross-situation chat).
 * Failures logged but do not throw.
 */
export async function saveToolOutput(input: SaveToolOutputInput): Promise<void> {
  if (!input.situationId) return;
  try {
    const db = getAdminDbOrThrow();
    const situationRef = db.collection('users').doc(input.uid)
      .collection('situations').doc(input.situationId)
    const legacyRef = situationRef.collection('tools').doc(input.toolId);
    const canonicalRef = situationRef.collection('tool-data').doc(input.toolId);

    const canonicalSnap = await canonicalRef.get();
    const previousVersion = canonicalSnap.exists
      ? ((canonicalSnap.data()?.version as number | undefined) ?? 0)
      : 0;
    const version = previousVersion + 1;
    const generatedAt = new Date().toISOString();
    const metadata = input.metadata ?? {};
    const sourceReceipts = Array.isArray(metadata.sourceReceipts)
      ? metadata.sourceReceipts
      : [];

    const canonicalEnvelope = {
      envelopeVersion: 1,
      toolId: input.toolId,
      data: input.output,
      profileVersion: input.profileVersion,
      toolRunId: input.toolRunId ?? null,
      metadata,
      sourceReceipts,
      generatedAt,
      version,
    };

    await canonicalRef.set(canonicalEnvelope, { merge: true });
    await canonicalRef.collection('versions').doc(String(version)).set(canonicalEnvelope);

    await legacyRef.set({
      toolId: input.toolId,
      output: input.output,
      profileVersion: input.profileVersion,
      toolRunId: input.toolRunId ?? null,
      metadata: {
        ...metadata,
        canonicalCollection: 'tool-data',
        canonicalVersion: version,
      },
      generatedAt: FieldValue.serverTimestamp(),
      generatedAtIso: generatedAt,
      version,
    }, { merge: true });
  } catch (err) {
    console.warn('[save-tool-output] failed:', err);
  }
}
