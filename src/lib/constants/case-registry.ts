/**
 * PRAXIS Unified Case Registry
 *
 * Central registry connecting case metadata (DemoCase) with deep
 * ontological data (actors, claims, interests, constraints, leverage,
 * commitments, events, narratives, relationships).
 *
 * Each registered case has both a "summary" (for case library listing)
 * and a "full" ontology (for graph visualization and analysis tools).
 */

import type { DemoCase } from './demo-cases';
import { DEMO_CASES } from './demo-cases';
import { DEMO_CONFLICT } from './demo-conflict';
import {
  WORKPLACE_DISPUTE_CASE,
  TECHCORP_ACTORS,
  TECHCORP_CLAIMS,
  TECHCORP_INTERESTS,
  TECHCORP_CONSTRAINTS,
  TECHCORP_LEVERAGE,
  TECHCORP_COMMITMENTS,
  TECHCORP_EVENTS,
  TECHCORP_NARRATIVES,
  TECHCORP_RELATIONSHIPS,
} from './cases/workplace-dispute';
import {
  ETHIOPIA_TIGRAY_CASE,
  ETHIOPIA_TIGRAY_ACTORS,
  ETHIOPIA_TIGRAY_CLAIMS,
  ETHIOPIA_TIGRAY_INTERESTS,
  ETHIOPIA_TIGRAY_CONSTRAINTS,
  ETHIOPIA_TIGRAY_LEVERAGE,
  ETHIOPIA_TIGRAY_COMMITMENTS,
  ETHIOPIA_TIGRAY_EVENTS,
  ETHIOPIA_TIGRAY_NARRATIVES,
  ETHIOPIA_TIGRAY_RELATIONSHIPS,
} from './cases/ethiopia-tigray';
import {
  COMMUNITY_LAND_DISPUTE_CASE,
  COMMUNITY_ACTORS,
  COMMUNITY_CLAIMS,
  COMMUNITY_INTERESTS,
  COMMUNITY_CONSTRAINTS,
  COMMUNITY_LEVERAGE,
  COMMUNITY_COMMITMENTS,
  COMMUNITY_EVENTS,
  COMMUNITY_NARRATIVES,
  COMMUNITY_RELATIONSHIPS,
} from './cases/community-land-dispute';

// ============================================================================
// Ontology Types
// ============================================================================

export interface OntologyActor {
  id: string;
  name: string;
  type: string;
  description: string;
  importance?: number;
  x?: number;
  y?: number;
  size?: number;
}

export interface OntologyClaim {
  id: string;
  actorId: string;
  claimType: string;
  title: string;
  text?: string;
  description: string;
  basis: string;
  type: string;
  status: string;
  legitimacyScore?: number;
  internationalRecognition?: string;
  competingClaimIds?: string[];
}

export interface OntologyInterest {
  id: string;
  actorId: string;
  description: string;
  type: string;
  priority: string;
  isExplicit: boolean;
}

export interface OntologyConstraint {
  id: string;
  description: string;
  type: string;
  affectedActors: string[];
  severity: string;
}

export interface OntologyLeverage {
  id: string;
  holderId: string;
  targetId: string;
  type: string;
  description: string;
  effectiveness: string;
}

export interface OntologyCommitment {
  id: string;
  type: string;
  parties: string[];
  description: string;
  dateEstablished: string;
  status: string;
  legalForce: string;
}

export interface OntologyEvent {
  id: string;
  date: string;
  title?: string;
  description: string;
  type: string;
  impact: string;
  involvedActors: string[];
  escalatoryDirection: string;
  glaslStage?: number;
  sources?: string[];
}

export interface OntologyNarrative {
  id: string;
  actorId: string;
  title: string;
  description: string;
  framingText?: string;
  keyMessages: string[];
  targetAudience: string;
  type: string;
  prevalence?: string;
  effectiveness?: number;
  reach?: string;
}

export interface OntologyRelationship {
  source: string;
  target: string;
  type: string;
  label: string;
}

export interface CaseOntology {
  actors: OntologyActor[];
  claims: OntologyClaim[];
  interests: OntologyInterest[];
  constraints: OntologyConstraint[];
  leverage: OntologyLeverage[];
  commitments: OntologyCommitment[];
  events: OntologyEvent[];
  narratives: OntologyNarrative[];
  relationships: OntologyRelationship[];
  glaslStage: number;
  escalationTrend: string;
}

export type CaseArchetype =
  | 'interstate'
  | 'intrastate'
  | 'organizational'
  | 'community'
  | 'peace_process'
  | 'maritime'
  | 'frozen_conflict';

export interface RegisteredCase {
  meta: DemoCase;
  ontology: CaseOntology;
  archetype: CaseArchetype;
  suitableFor: string[];
}

// ============================================================================
// Nordalia Ontology (from demo-conflict.ts)
// ============================================================================

const NORDALIA_ONTOLOGY: CaseOntology = {
  actors: DEMO_CONFLICT.actors as OntologyActor[],
  claims: DEMO_CONFLICT.claims as unknown as OntologyClaim[],
  interests: DEMO_CONFLICT.interests as unknown as OntologyInterest[],
  constraints: DEMO_CONFLICT.constraints as unknown as OntologyConstraint[],
  leverage: DEMO_CONFLICT.leverage as unknown as OntologyLeverage[],
  commitments: DEMO_CONFLICT.commitments as unknown as OntologyCommitment[],
  events: DEMO_CONFLICT.events as unknown as OntologyEvent[],
  narratives: DEMO_CONFLICT.narratives as unknown as OntologyNarrative[],
  relationships: DEMO_CONFLICT.relationships as OntologyRelationship[],
  glaslStage: DEMO_CONFLICT.glaslStage,
  escalationTrend: DEMO_CONFLICT.escalationTrend,
};

// ============================================================================
// TechCorp Workplace Dispute Ontology
// ============================================================================

const TECHCORP_ONTOLOGY: CaseOntology = {
  actors: TECHCORP_ACTORS as OntologyActor[],
  claims: TECHCORP_CLAIMS as unknown as OntologyClaim[],
  interests: TECHCORP_INTERESTS as unknown as OntologyInterest[],
  constraints: TECHCORP_CONSTRAINTS as unknown as OntologyConstraint[],
  leverage: TECHCORP_LEVERAGE as unknown as OntologyLeverage[],
  commitments: TECHCORP_COMMITMENTS as unknown as OntologyCommitment[],
  events: TECHCORP_EVENTS as unknown as OntologyEvent[],
  narratives: TECHCORP_NARRATIVES as unknown as OntologyNarrative[],
  relationships: TECHCORP_RELATIONSHIPS as OntologyRelationship[],
  glaslStage: 3,
  escalationTrend: 'volatile',
};

// ============================================================================
// Ethiopia-Tigray Ontology
// ============================================================================

const ETHIOPIA_TIGRAY_ONTOLOGY: CaseOntology = {
  actors: ETHIOPIA_TIGRAY_ACTORS as OntologyActor[],
  claims: ETHIOPIA_TIGRAY_CLAIMS as unknown as OntologyClaim[],
  interests: ETHIOPIA_TIGRAY_INTERESTS as unknown as OntologyInterest[],
  constraints: ETHIOPIA_TIGRAY_CONSTRAINTS as unknown as OntologyConstraint[],
  leverage: ETHIOPIA_TIGRAY_LEVERAGE as unknown as OntologyLeverage[],
  commitments: ETHIOPIA_TIGRAY_COMMITMENTS as unknown as OntologyCommitment[],
  events: ETHIOPIA_TIGRAY_EVENTS as unknown as OntologyEvent[],
  narratives: ETHIOPIA_TIGRAY_NARRATIVES as unknown as OntologyNarrative[],
  relationships: ETHIOPIA_TIGRAY_RELATIONSHIPS as OntologyRelationship[],
  glaslStage: 4,
  escalationTrend: 'de-escalating',
};

// ============================================================================
// Community Land Dispute Ontology
// ============================================================================

const COMMUNITY_ONTOLOGY: CaseOntology = {
  actors: COMMUNITY_ACTORS as OntologyActor[],
  claims: COMMUNITY_CLAIMS as unknown as OntologyClaim[],
  interests: COMMUNITY_INTERESTS as unknown as OntologyInterest[],
  constraints: COMMUNITY_CONSTRAINTS as unknown as OntologyConstraint[],
  leverage: COMMUNITY_LEVERAGE as unknown as OntologyLeverage[],
  commitments: COMMUNITY_COMMITMENTS as unknown as OntologyCommitment[],
  events: COMMUNITY_EVENTS as unknown as OntologyEvent[],
  narratives: COMMUNITY_NARRATIVES as unknown as OntologyNarrative[],
  relationships: COMMUNITY_RELATIONSHIPS as OntologyRelationship[],
  glaslStage: 3,
  escalationTrend: 'de-escalating',
};

// ============================================================================
// Nordalia DemoCase Meta (from DEMO_CASES matching the conflict)
// ============================================================================

const NORDALIA_META: DemoCase = DEMO_CASES.find((c) => c.id === 'nordalia') || {
  id: 'nordalia',
  name: 'Nordalia Crisis',
  region: 'East Africa',
  status: 'active',
  startYear: 2024,
  description: DEMO_CONFLICT.description,
  riskLevel: 'high',
  actorCount: 12,
  eventCount: 30,
  keyThemes: ['Armed conflict', 'Peace process', 'Resource governance', 'Regional proxy dynamics'],
  institutions: ['UNSC', 'AU PSC', 'UNMN'],
  primaryConflictType: 'Internal armed conflict with regional dimensions',
  summaryPrompt: 'Analyze the Nordalia Crisis.',
};

// ============================================================================
// Main Case Registry
// ============================================================================

export const CASE_REGISTRY: Record<string, RegisteredCase> = {
  'nordalia-crisis': {
    meta: { ...NORDALIA_META, id: 'nordalia-crisis' },
    ontology: NORDALIA_ONTOLOGY,
    archetype: 'intrastate',
    suitableFor: [
      'scenario planning',
      'mediation prep',
      'report drafting',
      'early warning',
      'stakeholder mapping',
      'negotiation space analysis',
      'narrative ecosystem mapping',
      'UN toolkit',
      'sanctions analysis',
    ],
  },
  'techcorp-restructuring': {
    meta: WORKPLACE_DISPUTE_CASE,
    ontology: TECHCORP_ONTOLOGY,
    archetype: 'organizational',
    suitableFor: [
      'mediation prep',
      'stakeholder mapping',
      'negotiation space analysis',
      'options paper',
      'scenario planning',
    ],
  },
  'ethiopia-tigray': {
    meta: ETHIOPIA_TIGRAY_CASE,
    ontology: ETHIOPIA_TIGRAY_ONTOLOGY,
    archetype: 'peace_process',
    suitableFor: [
      'DDR assessment',
      'report drafting',
      'scenario planning',
      'stakeholder mapping',
      'sanctions analysis',
      'human rights assessment',
      'early warning',
    ],
  },
  'riverside-land-dispute': {
    meta: COMMUNITY_LAND_DISPUTE_CASE,
    ontology: COMMUNITY_ONTOLOGY,
    archetype: 'community',
    suitableFor: [
      'mediation prep',
      'stakeholder mapping',
      'negotiation space analysis',
      'options paper',
      'scenario planning',
    ],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the full ontology for a case by ID
 */
export function getCaseOntology(id: string): CaseOntology | null {
  const normalizedId = id === 'nordalia' ? 'nordalia-crisis' : id;
  return CASE_REGISTRY[normalizedId]?.ontology ?? null;
}

/**
 * Get all registered cases for a given archetype
 */
export function getCasesByArchetype(archetype: CaseArchetype): RegisteredCase[] {
  return Object.values(CASE_REGISTRY).filter((c) => c.archetype === archetype);
}

/**
 * Get cases suitable for a specific use case
 */
export function getCasesSuitableFor(useCase: string): RegisteredCase[] {
  return Object.values(CASE_REGISTRY).filter((c) =>
    c.suitableFor.some((s) => s.toLowerCase().includes(useCase.toLowerCase()))
  );
}

/**
 * Get a summary of the case registry for display
 */
export function getRegistrySummary(): {
  id: string;
  name: string;
  archetype: CaseArchetype;
  region: string;
  status: string;
  actorCount: number;
  glaslStage: number;
}[] {
  return Object.entries(CASE_REGISTRY).map(([id, c]) => ({
    id,
    name: c.meta.name,
    archetype: c.archetype,
    region: c.meta.region,
    status: c.meta.status,
    actorCount: c.ontology.actors.length,
    glaslStage: c.ontology.glaslStage,
  }));
}

/**
 * Get actor by ID from a specific case
 */
export function getActorFromCase(caseId: string, actorId: string): OntologyActor | null {
  const ontology = getCaseOntology(caseId);
  return ontology?.actors.find((a) => a.id === actorId) ?? null;
}

/**
 * Get all events for a case sorted by date
 */
export function getCaseEventsSorted(caseId: string): OntologyEvent[] {
  const ontology = getCaseOntology(caseId);
  if (!ontology) return [];
  return [...ontology.events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Get relationships for a specific actor in a case
 */
export function getActorRelationships(
  caseId: string,
  actorId: string
): OntologyRelationship[] {
  const ontology = getCaseOntology(caseId);
  if (!ontology) return [];
  return ontology.relationships.filter(
    (r) => r.source === actorId || r.target === actorId
  );
}

/**
 * Get all claims for a specific actor
 */
export function getActorClaims(caseId: string, actorId: string): OntologyClaim[] {
  const ontology = getCaseOntology(caseId);
  if (!ontology) return [];
  return ontology.claims.filter((c) => c.actorId === actorId);
}

/**
 * Get all interests for a specific actor
 */
export function getActorInterests(caseId: string, actorId: string): OntologyInterest[] {
  const ontology = getCaseOntology(caseId);
  if (!ontology) return [];
  return ontology.interests.filter((i) => i.actorId === actorId);
}

/**
 * Build a plain-text context string suitable for AI prompts
 */
export function buildCaseContextString(caseId: string): string {
  const registered = CASE_REGISTRY[caseId] || CASE_REGISTRY['nordalia-crisis'];
  if (!registered) return '';

  const { meta, ontology } = registered;
  const actorList = ontology.actors.map((a) => `- ${a.name} (${a.type})`).join('\n');
  const recentEvents = getCaseEventsSorted(caseId)
    .slice(-5)
    .map((e) => `- ${e.date}: ${e.title || e.description.slice(0, 80)}...`)
    .join('\n');

  return `
CONFLICT: ${meta.name}
Region: ${meta.region}
Status: ${meta.status}
Glasl Stage: ${ontology.glaslStage} / 9
Escalation Trend: ${ontology.escalationTrend}
Risk Level: ${meta.riskLevel}

KEY ACTORS (${ontology.actors.length} total):
${actorList}

RECENT EVENTS (last 5):
${recentEvents}

OPEN CLAIMS: ${ontology.claims.length} documented
COMMITMENTS: ${ontology.commitments.length} (check status for active/suspended/violated)
CONSTRAINTS: ${ontology.constraints.length} identified
  `.trim();
}
