/**
 * Analyst Memory — P19
 *
 * Stores analyst judgment patterns to inform future AI analyses.
 * When analysts repeatedly correct the same type of error or consistently
 * flag a particular pattern, those patterns are stored and injected into
 * future AI prompts via buildGraphContext.
 *
 * Firestore path: users/{uid}/analyst-memory/{memoryId}
 *
 * Server-only — uses Firebase Admin SDK.
 */
import { adminDb } from '@/lib/firebase/admin';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MemoryCategory =
  | 'actor_correction'     // analyst corrected actor attribution
  | 'risk_calibration'     // analyst consistently corrects risk level
  | 'framework_preference' // analyst prefers a specific analytical framework
  | 'source_preference'    // analyst prefers certain data sources
  | 'writing_style'        // analyst corrects writing style/tone
  | 'factual_correction'   // factual error corrections
  | 'regional_expertise'   // region-specific knowledge
  | 'general';

export interface AnalystMemory {
  id: string;
  category: MemoryCategory;
  pattern: string;        // what the analyst consistently does/prefers
  example?: string;       // an example from a specific annotation
  weight: number;         // 1-10, increases with reinforcement
  situationIds: string[]; // situations where this was observed
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upsert an analyst memory pattern.
 * If a memory with the same category + pattern fingerprint exists, increment weight.
 */
export async function upsertAnalystMemory(
  uid: string,
  memory: Omit<AnalystMemory, 'id' | 'weight' | 'createdAt' | 'updatedAt'> & { situationId: string },
): Promise<void> {
  if (!adminDb || !uid) return;

  const now = new Date().toISOString();
  // Fingerprint — category + first 60 chars of pattern
  const fingerprint = `${memory.category}_${memory.pattern.slice(0, 60).replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
  const ref = adminDb.collection('users').doc(uid).collection('analyst-memory').doc(fingerprint);

  const existing = await ref.get();

  if (existing.exists) {
    const { FieldValue } = await import('firebase-admin/firestore');
    await ref.update({
      weight: FieldValue.increment(1),
      updatedAt: now,
      situationIds: FieldValue.arrayUnion(memory.situationId),
      ...(memory.example ? { example: memory.example } : {}),
    });
  } else {
    await ref.set({
      category: memory.category,
      pattern: memory.pattern,
      example: memory.example || '',
      weight: 1,
      situationIds: [memory.situationId],
      createdAt: now,
      updatedAt: now,
    });
  }
}

/**
 * Extract analyst memory patterns from a set of annotations and persist them.
 * Called after annotations are saved.
 */
export async function extractMemoryFromAnnotations(
  uid: string,
  situationId: string,
  annotations: Array<{ type: string; note: string; correction?: string }>,
): Promise<void> {
  if (!adminDb || !uid || annotations.length === 0) return;

  for (const ann of annotations) {
    if (ann.type === 'correct' || ann.type === 'disagree') {
      await upsertAnalystMemory(uid, {
        category: 'factual_correction',
        pattern: ann.note.slice(0, 200),
        example: ann.correction?.slice(0, 200),
        situationIds: [],
        situationId,
      }).catch(() => {/* non-critical */});
    }
  }
}

/**
 * Load analyst memories relevant to a tool, formatted as a context block.
 * Returns '' if no memories exist or threshold weight not met.
 */
export async function buildAnalystMemoryContext(
  uid: string,
  minWeight = 2,
): Promise<string> {
  if (!adminDb || !uid) return '';

  try {
    const snap = await adminDb
      .collection('users').doc(uid)
      .collection('analyst-memory')
      .where('weight', '>=', minWeight)
      .orderBy('weight', 'desc')
      .limit(10)
      .get();

    if (snap.empty) return '';

    const lines: string[] = ['\n## ANALYST PREFERENCE PATTERNS (learned — apply these):'];
    for (const doc of snap.docs) {
      const m = doc.data() as AnalystMemory;
      lines.push(`- [${m.category}] ${m.pattern}`);
      if (m.example) lines.push(`  Example: ${m.example}`);
    }
    return lines.join('\n');
  } catch {
    return '';
  }
}

/**
 * List all analyst memories for the settings/profile page.
 */
export async function listAnalystMemories(uid: string): Promise<AnalystMemory[]> {
  if (!adminDb || !uid) return [];

  try {
    const snap = await adminDb
      .collection('users').doc(uid)
      .collection('analyst-memory')
      .orderBy('weight', 'desc')
      .limit(50)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AnalystMemory));
  } catch {
    return [];
  }
}

/**
 * Delete a specific memory entry (user can remove patterns they don't want).
 */
export async function deleteAnalystMemory(uid: string, memoryId: string): Promise<void> {
  if (!adminDb || !uid || !memoryId) return;
  await adminDb
    .collection('users').doc(uid)
    .collection('analyst-memory')
    .doc(memoryId)
    .delete()
    .catch(() => {/* non-critical */});
}
