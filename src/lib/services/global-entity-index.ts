/**
 * Global Entity Index — P19
 *
 * Maintains a cross-situation entity registry so that analysts can see
 * how the same actors, claims, and events appear across multiple situations.
 *
 * Firestore path: users/{uid}/global-entities/{entityId}
 *
 * Entities are indexed by normalized name (lowercase, trimmed). When a tool
 * output is persisted, `indexEntitiesFromToolOutput` is called to upsert
 * mentions into the global index.
 *
 * Server-only — uses Firebase Admin SDK.
 */
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GlobalEntityMention {
  situationId: string;
  situationName: string;
  toolId: string;
  context: string;   // short excerpt (≤200 chars)
  seenAt: string;    // ISO timestamp
}

export interface GlobalEntity {
  id: string;
  name: string;
  normalizedName: string;
  type: string;    // 'actor' | 'location' | 'event' | 'claim' etc.
  firstSeenAt: string;
  lastSeenAt: string;
  mentionCount: number;
  mentions: GlobalEntityMention[]; // last 20
  situations: string[];            // de-duped situationIds
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function makeEntityId(name: string): string {
  return normalize(name).replace(/\s/g, '_').slice(0, 80);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Index a list of entity names from a tool output.
 * Upserts each entity in the global index.
 */
export async function indexEntities(
  uid: string,
  situationId: string,
  situationName: string,
  toolId: string,
  entities: Array<{ name: string; type: string; context?: string }>,
): Promise<void> {
  if (!adminDb || !uid || entities.length === 0) return;

  const now = new Date().toISOString();
  const batch = adminDb.batch();

  for (const entity of entities.slice(0, 30)) {
    if (!entity.name?.trim()) continue;
    const entityId = makeEntityId(entity.name);
    const ref = adminDb.collection('users').doc(uid).collection('global-entities').doc(entityId);

    const mention: GlobalEntityMention = {
      situationId,
      situationName,
      toolId,
      context: (entity.context || '').slice(0, 200),
      seenAt: now,
    };

    // Set base document (merge:true — won't overwrite existing firstSeenAt)
    batch.set(
      ref,
      {
        name: entity.name,
        normalizedName: normalize(entity.name),
        type: entity.type || 'unknown',
        lastSeenAt: now,
        mentionCount: 0,
        situations: [],
        mentions: [],
        firstSeenAt: now,
      },
      { merge: true },
    );

    // Increment counters and append mention
    batch.update(ref, {
      mentionCount: FieldValue.increment(1),
      lastSeenAt: now,
      situations: FieldValue.arrayUnion(situationId),
      mentions: FieldValue.arrayUnion(mention),
    });
  }

  await batch.commit().catch((err) => console.error('[global-entity-index] batch commit failed:', err));
}

/**
 * Search for entities by name fragment across all situations.
 */
export async function searchGlobalEntities(
  uid: string,
  query: string,
  limit = 20,
): Promise<GlobalEntity[]> {
  if (!adminDb || !uid || !query.trim()) return [];

  const normalizedQuery = normalize(query);
  const snap = await adminDb
    .collection('users').doc(uid)
    .collection('global-entities')
    .orderBy('mentionCount', 'desc')
    .limit(200)
    .get();

  const results: GlobalEntity[] = [];
  for (const doc of snap.docs) {
    const data = doc.data() as Omit<GlobalEntity, 'id'>;
    if (data.normalizedName.includes(normalizedQuery)) {
      results.push({ id: doc.id, ...data });
    }
    if (results.length >= limit) break;
  }

  return results;
}

/**
 * Get entities for a specific situation (for cross-situation tab).
 */
export async function getEntitiesForSituation(
  uid: string,
  situationId: string,
): Promise<GlobalEntity[]> {
  if (!adminDb || !uid || !situationId) return [];

  const snap = await adminDb
    .collection('users').doc(uid)
    .collection('global-entities')
    .where('situations', 'array-contains', situationId)
    .orderBy('mentionCount', 'desc')
    .limit(50)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GlobalEntity));
}

/**
 * Get entities that appear in multiple situations (cross-situation intel).
 */
export async function getCrossContextEntities(
  uid: string,
  situationId: string,
  minSituations = 2,
): Promise<GlobalEntity[]> {
  if (!adminDb || !uid || !situationId) return [];

  const entities = await getEntitiesForSituation(uid, situationId);
  return entities.filter((e) => e.situations.length >= minSituations);
}
