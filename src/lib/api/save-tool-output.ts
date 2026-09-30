import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDbOrThrow } from '@/lib/firebase/admin';
import { omitUndefinedMetadata } from '@/lib/firebase/ask-thread-service';
import { withDocumentOwnerWrite } from '@/lib/documents/owner-write';

export interface SaveToolOutputInput {
  uid: string;
  situationId: string | undefined;
  toolId: string;
  profileVersion: number;
  output: unknown;
  metadata?: Record<string, unknown>;
  toolRunId?: string | null;
  /** Fail closed and transact all receipts when preparing private documents. */
  requireWritableOwner?: boolean;
}

/**
 * Persists a tool's output to the canonical versioned tool-data envelope and
 * the legacy tools document for compatibility during the migration.
 *
 * Canonical: users/{uid}/situations/{id}/tool-data/{toolId}
 * Legacy:    users/{uid}/situations/{id}/tools/{toolId}
 *
 * No-op when situationId absent (e.g., cross-situation chat).
 * Default legacy failures are logged; owner-guarded persistence failures throw.
 */
export async function saveToolOutput(input: SaveToolOutputInput): Promise<void> {
  if (!input.situationId) return;
  try {
    const db = getAdminDbOrThrow();
    const situationRef = db.collection('users').doc(input.uid)
      .collection('situations').doc(input.situationId)
    const legacyRef = situationRef.collection('tools').doc(input.toolId);
    const canonicalRef = situationRef.collection('tool-data').doc(input.toolId);

    const saveEnvelopes = (version: number) => {
      const generatedAt = new Date().toISOString();
      const metadata = input.metadata ?? {};
      const sourceReceipts = Array.isArray(metadata.sourceReceipts) ? metadata.sourceReceipts : [];
      const envelopes = {
        canonical: { envelopeVersion: 1, toolId: input.toolId, data: input.output,
          profileVersion: input.profileVersion, toolRunId: input.toolRunId ?? null,
          metadata, sourceReceipts, generatedAt, version },
        legacy: { toolId: input.toolId, output: input.output, profileVersion: input.profileVersion,
          toolRunId: input.toolRunId ?? null, metadata: { ...metadata, canonicalCollection: 'tool-data', canonicalVersion: version },
          generatedAt: FieldValue.serverTimestamp(), generatedAtIso: generatedAt, version },
      };
      return input.requireWritableOwner ? omitUndefinedMetadata(envelopes) : envelopes;
    };
    if (input.requireWritableOwner) {
      await withDocumentOwnerWrite(input.uid, async (transaction) => {
        const current = await transaction.get(canonicalRef);
        const version = (current.exists ? (current.data()?.version as number | undefined) ?? 0 : 0) + 1;
        const envelopes = saveEnvelopes(version);
        transaction.set(canonicalRef, envelopes.canonical, { merge: true });
        transaction.set(canonicalRef.collection('versions').doc(String(version)), envelopes.canonical);
        transaction.set(legacyRef, envelopes.legacy, { merge: true });
      }, db);
      return;
    }
    const canonicalSnap = await canonicalRef.get();
    const previousVersion = canonicalSnap.exists
      ? ((canonicalSnap.data()?.version as number | undefined) ?? 0)
      : 0;
    const version = previousVersion + 1;
    const envelopes = saveEnvelopes(version);
    await canonicalRef.set(envelopes.canonical, { merge: true });
    await canonicalRef.collection('versions').doc(String(version)).set(envelopes.canonical);
    await legacyRef.set(envelopes.legacy, { merge: true });
  } catch (err) {
    if (input.requireWritableOwner) throw err;
    console.warn('[save-tool-output] failed:', err);
  }
}
