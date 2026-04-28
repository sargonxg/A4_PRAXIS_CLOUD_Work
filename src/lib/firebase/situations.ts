/**
 * PRAXIS Situation Service — Firestore CRUD for User Situations
 *
 * Each authenticated user can create "Situations" (conflict cases).
 * Stored in Firestore: users/{uid}/situations/{situationId}
 * Each situation contains Conflict Grammar entities that are built up
 * over time through research, AI analysis, and manual input.
 *
 * ─────────────────────────────────────────────────────────────────
 *  Client / Admin distinction
 * ─────────────────────────────────────────────────────────────────
 *  SECTION A — Client-side functions (firebase/firestore SDK)
 *    Use in React components and client-only code.
 *    Functions: createSituation, getSituation, getUserSituations,
 *               updateSituation, deleteSituation, addActor, addEvent,
 *               mergeEntities, saveSituationReport, saveSituationScenario,
 *               saveSituationResearch, getSituationResearch
 *
 *  SECTION B — Admin/server-side functions (firebase-admin SDK)
 *    Use in API routes and server-side code only. Require the
 *    FIREBASE_SERVICE_ACCOUNT_KEY env var to be set. Named with
 *    an "Admin" suffix where a client-side equivalent exists.
 *    Functions: createSituationAdmin, getSituationAdmin,
 *               listSituations, updateSituationAdmin,
 *               archiveSituation, deleteSituationAdmin,
 *               getConflictGraphAdmin
 * ─────────────────────────────────────────────────────────────────
 */

// ============================================================================
// SECTION A — Client-side (firebase/firestore SDK)
// ============================================================================

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  type Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { adminDb } from './admin';
import type { Situation as AdminSituation, CreateSituationInput } from '@/types/situation';

// ---------------------------------------------------------------------------
// Types (client-side domain model)
// ---------------------------------------------------------------------------

export interface SituationActor {
  id: string;
  name: string;
  type: 'state' | 'non_state_armed_group' | 'international_org' | 'civil_society' | 'media' | 'diaspora' | 'private_sector' | 'individual' | 'other';
  description: string;
  importance: number;       // 1-10
  threatLevel?: 'critical' | 'high' | 'medium' | 'low';
  relationships?: { targetActorId: string; type: string; label: string }[];
  aiEnriched?: boolean;
  lastEnrichedAt?: string;
  sources?: string[];
}

export interface SituationClaim {
  id: string;
  actorId: string;
  title: string;
  description: string;
  claimType: 'territorial' | 'sovereignty' | 'political' | 'resource' | 'security' | 'humanitarian' | 'legal' | 'identity' | 'other';
  status: 'active' | 'dormant' | 'resolved' | 'escalating' | 'contested';
  legitimacyScore?: number;
}

export interface SituationInterest {
  id: string;
  actorId: string;
  description: string;
  type: 'security' | 'economic' | 'political' | 'territorial' | 'identity' | 'humanitarian' | 'status' | 'other';
  priority: 'critical' | 'high' | 'medium' | 'low';
  isExplicit: boolean;
}

export interface SituationConstraint {
  id: string;
  description: string;
  type: 'legal' | 'military' | 'economic' | 'political' | 'social' | 'geographic' | 'other';
  affectedActors: string[];
  severity: 'critical' | 'significant' | 'moderate' | 'minor';
}

export interface SituationLeverage {
  id: string;
  holderId: string;
  targetId: string;
  type: 'military' | 'economic' | 'diplomatic' | 'informational' | 'legal' | 'other';
  description: string;
  effectiveness: 'high' | 'medium' | 'low';
}

export interface SituationCommitment {
  id: string;
  type: 'ceasefire' | 'treaty' | 'agreement' | 'resolution' | 'declaration' | 'other';
  parties: string[];
  description: string;
  dateEstablished?: string;
  status: 'active' | 'violated' | 'suspended' | 'fulfilled' | 'expired';
}

export interface SituationEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'military' | 'political' | 'diplomatic' | 'humanitarian' | 'economic' | 'legal' | 'social' | 'other';
  impact: 'critical' | 'significant' | 'moderate' | 'minor';
  involvedActors: string[];
  escalatoryDirection: 'escalatory' | 'de-escalatory' | 'neutral';
  sources?: string[];
}

export interface SituationNarrative {
  id: string;
  actorId: string;
  title: string;
  description: string;
  type: 'justification' | 'threat' | 'victimhood' | 'legitimacy' | 'reconciliation' | 'counter_narrative' | 'other';
  effectiveness: 'high' | 'medium' | 'low';
}

export interface SituationRelationship {
  source: string;
  target: string;
  type: 'ally' | 'adversary' | 'mediator' | 'patron' | 'proxy' | 'competitor' | 'dependent' | 'neutral';
  label: string;
}

export interface ClientSituation {
  id: string;
  name: string;
  description: string;
  region: string;
  status: 'active' | 'monitoring' | 'resolved' | 'emerging';
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  updatedAt: Timestamp | ReturnType<typeof serverTimestamp>;

  // Conflict Grammar entities
  actors: SituationActor[];
  claims: SituationClaim[];
  interests: SituationInterest[];
  constraints: SituationConstraint[];
  leverage: SituationLeverage[];
  commitments: SituationCommitment[];
  events: SituationEvent[];
  narratives: SituationNarrative[];
  relationships: SituationRelationship[];

  // AI-generated intelligence
  riskScore: number | null;
  glaslStage: number | null;
  escalationTrend: string | null;
  lastResearchAt: Timestamp | null;

  // User preferences for this situation
  mediaOutlets: string[];
  watchKeywords: string[];
}

export interface SituationSummary {
  id: string;
  name: string;
  description: string;
  region: string;
  status: string;
  actorCount: number;
  eventCount: number;
  riskScore: number | null;
  glaslStage: number | null;
  updatedAt: Timestamp | null;
}

// ---------------------------------------------------------------------------
// Client-side helpers
// ---------------------------------------------------------------------------

function situationsCollection(uid: string) {
  return collection(db, 'users', uid, 'situations');
}

function situationDoc(uid: string, situationId: string) {
  return doc(db, 'users', uid, 'situations', situationId);
}

function generateId(): string {
  return `sit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Client-side CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Create a new empty situation (client SDK).
 */
export async function createSituation(
  uid: string,
  data: { name: string; description: string; region: string; status?: string }
): Promise<ClientSituation> {
  const id = generateId();
  const situation: ClientSituation = {
    id,
    name: data.name,
    description: data.description,
    region: data.region,
    status: (data.status as ClientSituation['status']) || 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    actors: [],
    claims: [],
    interests: [],
    constraints: [],
    leverage: [],
    commitments: [],
    events: [],
    narratives: [],
    relationships: [],
    riskScore: null,
    glaslStage: null,
    escalationTrend: null,
    lastResearchAt: null,
    mediaOutlets: [],
    watchKeywords: [],
  };

  await setDoc(situationDoc(uid, id), situation);
  return situation;
}

/**
 * Get all situations for a user (summaries only) — client SDK.
 */
export async function getUserSituations(uid: string): Promise<SituationSummary[]> {
  try {
    const q = query(situationsCollection(uid), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as ClientSituation;
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        region: data.region,
        status: data.status,
        actorCount: data.actors?.length || 0,
        eventCount: data.events?.length || 0,
        riskScore: data.riskScore,
        glaslStage: data.glaslStage,
        updatedAt: data.updatedAt as Timestamp | null,
      };
    });
  } catch (err) {
    console.error('[situations] Failed to load situations:', err);
    return [];
  }
}

/**
 * Get a single situation with full data — client SDK.
 */
export async function getSituation(uid: string, situationId: string): Promise<ClientSituation | null> {
  try {
    const snap = await getDoc(situationDoc(uid, situationId));
    if (!snap.exists()) return null;
    return snap.data() as ClientSituation;
  } catch (err) {
    console.error('[situations] Failed to load situation:', err);
    return null;
  }
}

/**
 * Update a situation (partial update) — client SDK.
 */
export async function updateSituation(
  uid: string,
  situationId: string,
  data: Partial<Omit<ClientSituation, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(situationDoc(uid, situationId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a situation — client SDK (simple, no subcollection cascade).
 */
export async function deleteSituation(uid: string, situationId: string): Promise<void> {
  await deleteDoc(situationDoc(uid, situationId));
}

// ---------------------------------------------------------------------------
// Entity Operations (add/remove entities to/from a situation)
// ---------------------------------------------------------------------------

/**
 * Add an actor to a situation.
 */
export async function addActor(uid: string, situationId: string, actor: Omit<SituationActor, 'id'>): Promise<SituationActor> {
  const situation = await getSituation(uid, situationId);
  if (!situation) throw new Error('Situation not found');

  const newActor: SituationActor = { ...actor, id: `actor-${Date.now().toString(36)}` };
  const actors = [...situation.actors, newActor];
  await updateSituation(uid, situationId, { actors });
  return newActor;
}

/**
 * Add an event to a situation.
 */
export async function addEvent(uid: string, situationId: string, event: Omit<SituationEvent, 'id'>): Promise<SituationEvent> {
  const situation = await getSituation(uid, situationId);
  if (!situation) throw new Error('Situation not found');

  const newEvent: SituationEvent = { ...event, id: `event-${Date.now().toString(36)}` };
  const events = [...situation.events, newEvent];
  await updateSituation(uid, situationId, { events });
  return newEvent;
}

/**
 * Bulk-add entities extracted by AI (e.g., from research).
 * Merges new entities with existing ones (no duplicates by name).
 */
export async function mergeEntities(
  uid: string,
  situationId: string,
  entities: {
    actors?: Omit<SituationActor, 'id'>[];
    claims?: Omit<SituationClaim, 'id'>[];
    interests?: Omit<SituationInterest, 'id'>[];
    constraints?: Omit<SituationConstraint, 'id'>[];
    leverage?: Omit<SituationLeverage, 'id'>[];
    commitments?: Omit<SituationCommitment, 'id'>[];
    events?: Omit<SituationEvent, 'id'>[];
    narratives?: Omit<SituationNarrative, 'id'>[];
    relationships?: SituationRelationship[];
  }
): Promise<void> {
  const situation = await getSituation(uid, situationId);
  if (!situation) throw new Error('Situation not found');

  const updates: Partial<ClientSituation> = {};
  const ts = Date.now().toString(36);

  if (entities.actors?.length) {
    const existingNames = new Set(situation.actors.map((a) => a.name.toLowerCase()));
    const newActors = entities.actors
      .filter((a) => !existingNames.has(a.name.toLowerCase()))
      .map((a, i) => ({ ...a, id: `actor-${ts}-${i}` }));
    updates.actors = [...situation.actors, ...newActors];
  }

  if (entities.events?.length) {
    const existingTitles = new Set(situation.events.map((e) => e.title.toLowerCase()));
    const newEvents = entities.events
      .filter((e) => !existingTitles.has(e.title.toLowerCase()))
      .map((e, i) => ({ ...e, id: `event-${ts}-${i}` }));
    updates.events = [...situation.events, ...newEvents];
  }

  if (entities.claims?.length) {
    const newClaims = entities.claims.map((c, i) => ({ ...c, id: `claim-${ts}-${i}` }));
    updates.claims = [...situation.claims, ...newClaims];
  }

  if (entities.interests?.length) {
    const newInterests = entities.interests.map((i2, idx) => ({ ...i2, id: `interest-${ts}-${idx}` }));
    updates.interests = [...situation.interests, ...newInterests];
  }

  if (entities.constraints?.length) {
    const newConstraints = entities.constraints.map((c, i) => ({ ...c, id: `constraint-${ts}-${i}` }));
    updates.constraints = [...situation.constraints, ...newConstraints];
  }

  if (entities.leverage?.length) {
    const newLeverage = entities.leverage.map((l, i) => ({ ...l, id: `leverage-${ts}-${i}` }));
    updates.leverage = [...situation.leverage, ...newLeverage];
  }

  if (entities.commitments?.length) {
    const newCommitments = entities.commitments.map((c, i) => ({ ...c, id: `commitment-${ts}-${i}` }));
    updates.commitments = [...situation.commitments, ...newCommitments];
  }

  if (entities.narratives?.length) {
    const newNarratives = entities.narratives.map((n, i) => ({ ...n, id: `narrative-${ts}-${i}` }));
    updates.narratives = [...situation.narratives, ...newNarratives];
  }

  if (entities.relationships?.length) {
    updates.relationships = [...situation.relationships, ...entities.relationships];
  }

  if (Object.keys(updates).length > 0) {
    await updateSituation(uid, situationId, updates);
  }
}

// ---------------------------------------------------------------------------
// Sub-collection Operations (reports, scenarios, research)
// ---------------------------------------------------------------------------

export async function saveSituationReport(
  uid: string,
  situationId: string,
  reportId: string,
  data: Record<string, unknown>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'situations', situationId, 'reports', reportId);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveSituationScenario(
  uid: string,
  situationId: string,
  scenarioId: string,
  data: Record<string, unknown>
): Promise<void> {
  const ref = doc(db, 'users', uid, 'situations', situationId, 'scenarios', scenarioId);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveSituationResearch(
  uid: string,
  situationId: string,
  data: { query: string; results: string; sources: string[]; mode: string }
): Promise<string> {
  const id = `research-${Date.now().toString(36)}`;
  const ref = doc(db, 'users', uid, 'situations', situationId, 'research', id);
  await setDoc(ref, { ...data, id, createdAt: serverTimestamp() });
  return id;
}

export async function getSituationResearch(uid: string, situationId: string) {
  const colRef = collection(db, 'users', uid, 'situations', situationId, 'research');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
}

// ============================================================================
// SECTION B — Admin/server-side (firebase-admin SDK)
// ============================================================================
//
// All functions below require adminDb to be initialized (set
// FIREBASE_SERVICE_ACCOUNT_KEY in your environment). They are intended
// exclusively for use in API routes and other server-side code.
//
// Where a client-side equivalent exists the admin version carries an
// "Admin" suffix (e.g. createSituationAdmin, getSituationAdmin, etc.).
// Pure admin-only helpers (listSituations, archiveSituation,
// getConflictGraphAdmin) keep their original names.
// ============================================================================

function adminSituationsCol(uid: string) {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
  }
  return adminDb.collection('users').doc(uid).collection('situations');
}

/**
 * Create a new situation using the Admin SDK.
 * Accepts the full CreateSituationInput schema (type, actors as string[], etc.)
 */
export async function createSituationAdmin(
  uid: string,
  data: CreateSituationInput
): Promise<AdminSituation> {
  const col = adminSituationsCol(uid);
  const ref = col.doc();
  const now = new Date().toISOString();
  const situation: AdminSituation = {
    id: ref.id,
    name: data.name,
    type: data.type,
    description: data.description,
    region: data.region,
    actors: data.actors,
    userRole: data.userRole,
    status: data.status ?? 'active',
    riskScore: typeof data.riskScore === 'number' ? data.riskScore : 0,
    glaslStage: typeof data.glaslStage === 'number' || data.glaslStage === null ? data.glaslStage : null,
    escalationTrend: data.escalationTrend ?? 'stable',
    actorCount: data.actors.length,
    graphEntities: 0,
    documentCount: data.initialDocumentIds?.length ?? 0,
    ...(data.sourceUrls?.length ? { sourceUrls: data.sourceUrls } : {}),
    ...(data.contextNotes ? { contextNotes: data.contextNotes } : {}),
    ...(data.initialDocumentIds?.length ? { initialDocumentIds: data.initialDocumentIds } : {}),
    ...(data.ontology ? { ontology: data.ontology } : {}),
    ...(data.sourceCategoriesEnabled ? { sourceCategoriesEnabled: data.sourceCategoriesEnabled } : {}),
    ...(data.sourceCategoryOrder?.length ? { sourceCategoryOrder: data.sourceCategoryOrder } : {}),
    ...(data.workflowPath ? { workflowPath: data.workflowPath } : {}),
    ...(data.workflowPathLabel ? { workflowPathLabel: data.workflowPathLabel } : {}),
    ...(data.customSources?.length ? { customSources: data.customSources } : {}),
    ...(data.domain ? { domain: data.domain } : {}),
    ...(typeof data.domainConfidence === 'number'
      ? { domainConfidence: data.domainConfidence }
      : {}),
    ...(typeof data.domainOverriddenByUser === 'boolean'
      ? { domainOverriddenByUser: data.domainOverriddenByUser }
      : {}),
    ...(data.domain ? { domainClassifiedAt: now } : {}),
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(situation);
  return situation;
}

/**
 * Get a single situation using the Admin SDK.
 */
export async function getSituationAdmin(
  uid: string,
  situationId: string
): Promise<AdminSituation | null> {
  const snap = await adminSituationsCol(uid).doc(situationId).get();
  return snap.exists ? (snap.data() as AdminSituation) : null;
}

/**
 * List all situations for a user — Admin SDK, server-side only.
 */
export async function listSituations(uid: string): Promise<AdminSituation[]> {
  try {
    const snap = await adminSituationsCol(uid).orderBy('updatedAt', 'desc').get();
    return snap.docs.map((d) => d.data() as AdminSituation);
  } catch {
    // If index doesn't exist yet, try without ordering
    try {
      const snap = await adminSituationsCol(uid).get();
      return snap.docs.map((d) => d.data() as AdminSituation);
    } catch {
      return [];
    }
  }
}

/**
 * Partial update of a situation using the Admin SDK.
 */
export async function updateSituationAdmin(
  uid: string,
  situationId: string,
  updates: Partial<AdminSituation>
): Promise<void> {
  await adminSituationsCol(uid).doc(situationId).update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Archive a situation (sets status to "archived") — Admin SDK.
 */
export async function archiveSituation(
  uid: string,
  situationId: string
): Promise<void> {
  await updateSituationAdmin(uid, situationId, { status: 'archived' });
}

/**
 * Delete a situation and all its subcollections — Admin SDK.
 * Cascades through graph, documents, reports, scenarios, chats,
 * tool-data, briefings, dossiers, talking-points, risk-assessments,
 * and conflict-grammar subcollections.
 */
export async function deleteSituationAdmin(
  uid: string,
  situationId: string
): Promise<void> {
  if (!adminDb) throw new Error('Firebase Admin SDK not initialized.');
  const db = adminDb;
  const sitRef = adminSituationsCol(uid).doc(situationId);
  const subcollections = [
    'graph', 'documents', 'reports', 'scenarios', 'chats',
    'tool-data', 'briefings', 'dossiers', 'talking-points',
    'risk-assessments', 'conflict-grammar',
  ];
  for (const name of subcollections) {
    let snap = await sitRef.collection(name).limit(200).get();
    while (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      if (snap.size < 200) break;
      snap = await sitRef.collection(name).limit(200).get();
    }
  }
  await sitRef.delete();
}

/**
 * Get a single situation by uid + situationId — Admin SDK, server-side only.
 * Thin alias for getSituationAdmin with a stable name for buildCalibratedContext.
 * Returns null (never throws) when the document does not exist.
 */
export async function getSituationById(
  uid: string,
  situationId: string
): Promise<AdminSituation | null> {
  const snap = await adminSituationsCol(uid).doc(situationId).get();
  return snap.exists ? (snap.data() as AdminSituation) : null;
}

/**
 * Reads the conflict knowledge graph for a situation using the Admin SDK.
 * Used server-side to pre-load graph data into AI tool context.
 */
export async function getConflictGraphAdmin(
  uid: string,
  situationId: string
): Promise<{ nodes: unknown[]; edges: unknown[] } | null> {
  if (!adminDb) return null;
  const snap = await adminSituationsCol(uid)
    .doc(situationId)
    .collection('graph')
    .doc('main')
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as { nodes?: unknown[]; edges?: unknown[] };
  return { nodes: data.nodes ?? [], edges: data.edges ?? [] };
}
