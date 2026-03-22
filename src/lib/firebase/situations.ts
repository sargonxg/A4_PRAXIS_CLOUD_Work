/**
 * PRAXIS Situation Service — Firestore CRUD for User Situations
 *
 * Each authenticated user can create "Situations" (conflict cases).
 * Stored in Firestore: users/{uid}/situations/{situationId}
 * Each situation contains Conflict Grammar entities that are built up
 * over time through research, AI analysis, and manual input.
 */

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

// ---------------------------------------------------------------------------
// Types
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

export interface Situation {
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
// Helpers
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
// CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Create a new empty situation.
 */
export async function createSituation(
  uid: string,
  data: { name: string; description: string; region: string; status?: string }
): Promise<Situation> {
  const id = generateId();
  const situation: Situation = {
    id,
    name: data.name,
    description: data.description,
    region: data.region,
    status: (data.status as Situation['status']) || 'active',
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
 * Get all situations for a user (summaries only).
 */
export async function getUserSituations(uid: string): Promise<SituationSummary[]> {
  try {
    const q = query(situationsCollection(uid), orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as Situation;
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
 * Get a single situation with full data.
 */
export async function getSituation(uid: string, situationId: string): Promise<Situation | null> {
  try {
    const snap = await getDoc(situationDoc(uid, situationId));
    if (!snap.exists()) return null;
    return snap.data() as Situation;
  } catch (err) {
    console.error('[situations] Failed to load situation:', err);
    return null;
  }
}

/**
 * Update a situation (partial update).
 */
export async function updateSituation(
  uid: string,
  situationId: string,
  data: Partial<Omit<Situation, 'id' | 'createdAt'>>
): Promise<void> {
  await updateDoc(situationDoc(uid, situationId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a situation.
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

  const updates: Partial<Situation> = {};
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
