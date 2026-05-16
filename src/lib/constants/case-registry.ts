/**
 * PRAXIS user-case ontology types.
 *
 * Seeded demo case registries have been removed. Runtime case data should come
 * from user-owned situations, ContextCapsules, source receipts, and approved
 * graph snapshots.
 */

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
  | 'legal'
  | 'environmental'
  | 'workplace'
  | 'economic'
  | 'electoral'
  | 'migration'
  | 'custom';

export interface RegisteredCase {
  meta: {
    id: string;
    name: string;
    region: string;
    status: string;
    riskLevel?: string;
  };
  ontology: CaseOntology;
  archetype: CaseArchetype;
  suitableFor: string[];
}

export const CASE_REGISTRY: Record<string, RegisteredCase> = {};

export function getCaseOntology(id: string): CaseOntology | null {
  return CASE_REGISTRY[id]?.ontology ?? null;
}

export function getCasesByArchetype(archetype: CaseArchetype): RegisteredCase[] {
  return Object.values(CASE_REGISTRY).filter((item) => item.archetype === archetype);
}

export function getCasesSuitableFor(useCase: string): RegisteredCase[] {
  return Object.values(CASE_REGISTRY).filter((item) =>
    item.suitableFor.some((candidate) => candidate.toLowerCase().includes(useCase.toLowerCase())),
  );
}

export function getRegistrySummary() {
  return Object.entries(CASE_REGISTRY).map(([id, item]) => ({
    id,
    name: item.meta.name,
    archetype: item.archetype,
    region: item.meta.region,
    status: item.meta.status,
    actorCount: item.ontology.actors.length,
    glaslStage: item.ontology.glaslStage,
  }));
}

export function getActorFromCase(caseId: string, actorId: string): OntologyActor | null {
  return getCaseOntology(caseId)?.actors.find((actor) => actor.id === actorId) ?? null;
}

export function getCaseEventsSorted(caseId: string): OntologyEvent[] {
  const ontology = getCaseOntology(caseId);
  if (!ontology) return [];
  return [...ontology.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getActorRelationships(caseId: string, actorId: string): OntologyRelationship[] {
  const ontology = getCaseOntology(caseId);
  if (!ontology) return [];
  return ontology.relationships.filter((item) => item.source === actorId || item.target === actorId);
}

export function getActorClaims(caseId: string, actorId: string): OntologyClaim[] {
  return getCaseOntology(caseId)?.claims.filter((item) => item.actorId === actorId) ?? [];
}

export function getActorInterests(caseId: string, actorId: string): OntologyInterest[] {
  return getCaseOntology(caseId)?.interests.filter((item) => item.actorId === actorId) ?? [];
}

export function buildCaseContextString(caseId: string): string {
  void caseId;
  return '';
}
