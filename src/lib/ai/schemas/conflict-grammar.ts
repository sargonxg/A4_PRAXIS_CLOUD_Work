/* GENERATED FILE - DO NOT EDIT.
 * Source: schemas/conflict-grammar-v1.json
 * Regenerate with: npm run schema:gen
 */

import { z } from 'zod';

export const CONFLICT_GRAMMAR_VERSION = "1.0.0";

export const ACO_ENTITY_TYPES = ["Actor", "Claim", "Interest", "Constraint", "Leverage", "Commitment", "Event", "Narrative"] as const;
export type ACOEntityType = (typeof ACO_ENTITY_TYPES)[number];

export const CONFLICT_ENTITY_TYPES = ["actor", "claim", "interest", "constraint", "leverage", "commitment", "event", "narrative"] as const;
export type ConflictEntityType = (typeof CONFLICT_ENTITY_TYPES)[number];

export const CONFIDENCE_LEVELS = ["EXTRACTED", "INFERRED", "AMBIGUOUS", "ASSESSED"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const RELATIONSHIP_TYPES = ["CLAIMS", "HAS_INTEREST", "FACES_CONSTRAINT", "HOLDS_LEVERAGE", "MADE_COMMITMENT", "PARTICIPATED_IN", "PROPAGATES_NARRATIVE", "ALLIED_WITH", "OPPOSES", "MEDIATES_BETWEEN", "SPONSORS", "SUBORDINATE_TO", "CONTRADICTS", "SUPPORTS_CLAIM", "BASED_ON_INTEREST", "JUSTIFIED_BY_NARRATIVE", "CONSTRAINED_BY", "CONFLICTS_WITH", "ALIGNS_WITH", "UNDERLYING_INTEREST_OF", "LIMITS_LEVERAGE", "BLOCKS_COMMITMENT", "IMPOSED_BY_EVENT", "TARGETS", "DERIVED_FROM_EVENT", "UNDERMINED_BY", "ADDRESSES_CLAIM", "VIOLATED_BY_EVENT", "SUPERSEDES", "TRIGGERED_BY", "ESCALATES", "DE_ESCALATES", "INVOLVES_ACTOR", "AFFECTS_LEVERAGE", "VALIDATES_NARRATIVE", "CONTRADICTS_NARRATIVE", "FRAMES_EVENT", "JUSTIFIES_CLAIM", "UNDERMINES_CLAIM", "COMPETES_WITH", "REINFORCES", "SEMANTICALLY_SIMILAR_TO"] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const RELATIONSHIP_CANONICAL_TYPES = ["claims", "has_interest", "faces_constraint", "holds_leverage", "made_commitment", "participated_in", "propagates_narrative", "allied_with", "opposes", "mediates_between", "sponsors", "subordinate_to", "contradicts", "supports_claim", "based_on_interest", "justified_by_narrative", "constrained_by", "conflicts_with", "aligns_with", "underlying_interest_of", "limits_leverage", "blocks_commitment", "imposed_by_event", "targets", "derived_from_event", "undermined_by", "addresses_claim", "violated_by_event", "supersedes", "triggered_by", "escalates", "de_escalates", "involves_actor", "affects_leverage", "validates_narrative", "contradicts_narrative", "frames_event", "justifies_claim", "undermines_claim", "competes_with", "reinforces", "semantically_similar_to"] as const;
export type RelationshipCanonicalType = (typeof RELATIONSHIP_CANONICAL_TYPES)[number];

export const PRIMITIVE_DESCRIPTIONS: Record<ACOEntityType, string> = {
  "Actor": "Any entity with agency in a conflict: state, organization, group, individual, coalition, or institution.",
  "Claim": "A formal or informal assertion of rights, status, territory, harm, grievance, or policy position.",
  "Interest": "Underlying motivations, needs, or objectives that drive an actor's behavior.",
  "Constraint": "Factors that limit an actor's freedom of action, including institutions, norms, resources, geography, law, or domestic politics.",
  "Leverage": "Sources of power or influence one actor holds over another.",
  "Commitment": "Promises, obligations, treaties, policies, or pledges made by actors.",
  "Event": "A significant occurrence that affects conflict dynamics or validates/undermines claims and commitments.",
  "Narrative": "A framing, discourse, or interpretation of the conflict propagated by actors or media ecosystems.",
};

export const PRIMITIVE_SUBTYPES: Record<ACOEntityType, readonly string[]> = {
  "Actor": ["state", "non_state_armed_group", "international_organization", "regional_organization", "civil_society", "private_sector", "individual", "coalition", "diaspora", "media", "institution"],
  "Claim": ["territorial", "sovereignty", "self_determination", "resource", "historical", "legal", "political", "economic", "security", "humanitarian", "cultural", "religious", "grievance"],
  "Interest": ["security", "economic", "political", "ideological", "territorial", "resource", "prestige", "survival", "domestic_legitimacy", "regional_influence", "global_influence", "humanitarian", "cultural", "religious"],
  "Constraint": ["legal", "institutional", "military", "economic", "political", "social", "geographic", "normative", "resource", "alliance", "domestic", "international", "norm"],
  "Leverage": ["military", "economic", "diplomatic", "informational", "institutional", "normative", "energy", "trade", "financial", "technological", "demographic", "moral"],
  "Commitment": ["treaty", "ceasefire", "agreement", "declaration", "resolution", "unilateral", "bilateral", "multilateral", "conditional", "unconditional", "policy_commitment"],
  "Event": ["military", "political", "diplomatic", "economic", "humanitarian", "legal", "social", "environmental", "election", "protest", "negotiation", "ceasefire", "violation", "escalation", "de_escalation"],
  "Narrative": ["official", "media", "propaganda", "historical", "identity", "victimhood", "liberation", "security", "humanitarian"],
};

export const RELATIONSHIP_VOCABULARY: Record<RelationshipType, { canonical: RelationshipCanonicalType; sourceTypes: readonly string[]; targetTypes: readonly string[]; description: string }> = {
  "CLAIMS": { canonical: "claims" as RelationshipCanonicalType, sourceTypes: ["Actor"], targetTypes: ["Claim"], description: "Actor asserts a claim." },
  "HAS_INTEREST": { canonical: "has_interest" as RelationshipCanonicalType, sourceTypes: ["Actor"], targetTypes: ["Interest"], description: "Actor has an underlying interest." },
  "FACES_CONSTRAINT": { canonical: "faces_constraint" as RelationshipCanonicalType, sourceTypes: ["Actor"], targetTypes: ["Constraint"], description: "Actor is limited by a constraint." },
  "HOLDS_LEVERAGE": { canonical: "holds_leverage" as RelationshipCanonicalType, sourceTypes: ["Actor"], targetTypes: ["Leverage"], description: "Actor holds a leverage source." },
  "MADE_COMMITMENT": { canonical: "made_commitment" as RelationshipCanonicalType, sourceTypes: ["Actor"], targetTypes: ["Commitment"], description: "Actor made or joined a commitment." },
  "PARTICIPATED_IN": { canonical: "participated_in" as RelationshipCanonicalType, sourceTypes: ["Actor"], targetTypes: ["Event"], description: "Actor participated in an event." },
  "PROPAGATES_NARRATIVE": { canonical: "propagates_narrative" as RelationshipCanonicalType, sourceTypes: ["Actor"], targetTypes: ["Narrative"], description: "Actor propagates a narrative." },
  "ALLIED_WITH": { canonical: "allied_with" as RelationshipCanonicalType, sourceTypes: ["Actor"], targetTypes: ["Actor"], description: "Actor is allied with another actor." },
  "OPPOSES": { canonical: "opposes" as RelationshipCanonicalType, sourceTypes: ["Actor"], targetTypes: ["Actor"], description: "Actor opposes another actor." },
  "MEDIATES_BETWEEN": { canonical: "mediates_between" as RelationshipCanonicalType, sourceTypes: ["Actor"], targetTypes: ["Actor"], description: "Actor mediates between actors." },
  "SPONSORS": { canonical: "sponsors" as RelationshipCanonicalType, sourceTypes: ["Actor"], targetTypes: ["Actor"], description: "Actor sponsors another actor." },
  "SUBORDINATE_TO": { canonical: "subordinate_to" as RelationshipCanonicalType, sourceTypes: ["Actor"], targetTypes: ["Actor"], description: "Actor is subordinate to another actor." },
  "CONTRADICTS": { canonical: "contradicts" as RelationshipCanonicalType, sourceTypes: ["Claim"], targetTypes: ["Claim"], description: "Claim contradicts another claim." },
  "SUPPORTS_CLAIM": { canonical: "supports_claim" as RelationshipCanonicalType, sourceTypes: ["Claim"], targetTypes: ["Claim"], description: "Claim supports another claim." },
  "BASED_ON_INTEREST": { canonical: "based_on_interest" as RelationshipCanonicalType, sourceTypes: ["Claim"], targetTypes: ["Interest"], description: "Claim is based on an underlying interest." },
  "JUSTIFIED_BY_NARRATIVE": { canonical: "justified_by_narrative" as RelationshipCanonicalType, sourceTypes: ["Claim"], targetTypes: ["Narrative"], description: "Claim is justified by a narrative." },
  "CONSTRAINED_BY": { canonical: "constrained_by" as RelationshipCanonicalType, sourceTypes: ["Claim"], targetTypes: ["Constraint"], description: "Claim is limited by a constraint." },
  "CONFLICTS_WITH": { canonical: "conflicts_with" as RelationshipCanonicalType, sourceTypes: ["Interest"], targetTypes: ["Interest"], description: "Interest conflicts with another interest." },
  "ALIGNS_WITH": { canonical: "aligns_with" as RelationshipCanonicalType, sourceTypes: ["Interest"], targetTypes: ["Interest"], description: "Interest aligns with another interest." },
  "UNDERLYING_INTEREST_OF": { canonical: "underlying_interest_of" as RelationshipCanonicalType, sourceTypes: ["Interest"], targetTypes: ["Claim"], description: "Interest underlies a claim." },
  "LIMITS_LEVERAGE": { canonical: "limits_leverage" as RelationshipCanonicalType, sourceTypes: ["Constraint"], targetTypes: ["Leverage"], description: "Constraint limits leverage." },
  "BLOCKS_COMMITMENT": { canonical: "blocks_commitment" as RelationshipCanonicalType, sourceTypes: ["Constraint"], targetTypes: ["Commitment"], description: "Constraint blocks a commitment." },
  "IMPOSED_BY_EVENT": { canonical: "imposed_by_event" as RelationshipCanonicalType, sourceTypes: ["Constraint"], targetTypes: ["Event"], description: "Constraint is imposed by an event." },
  "TARGETS": { canonical: "targets" as RelationshipCanonicalType, sourceTypes: ["Leverage"], targetTypes: ["Actor"], description: "Leverage targets an actor." },
  "DERIVED_FROM_EVENT": { canonical: "derived_from_event" as RelationshipCanonicalType, sourceTypes: ["Leverage"], targetTypes: ["Event"], description: "Leverage derives from an event." },
  "UNDERMINED_BY": { canonical: "undermined_by" as RelationshipCanonicalType, sourceTypes: ["Leverage"], targetTypes: ["Constraint"], description: "Leverage is undermined by a constraint." },
  "ADDRESSES_CLAIM": { canonical: "addresses_claim" as RelationshipCanonicalType, sourceTypes: ["Commitment"], targetTypes: ["Claim"], description: "Commitment addresses a claim." },
  "VIOLATED_BY_EVENT": { canonical: "violated_by_event" as RelationshipCanonicalType, sourceTypes: ["Commitment"], targetTypes: ["Event"], description: "Commitment is violated or stressed by an event." },
  "SUPERSEDES": { canonical: "supersedes" as RelationshipCanonicalType, sourceTypes: ["Commitment"], targetTypes: ["Commitment"], description: "Commitment supersedes another commitment." },
  "TRIGGERED_BY": { canonical: "triggered_by" as RelationshipCanonicalType, sourceTypes: ["Event"], targetTypes: ["Event"], description: "Event is triggered by another event." },
  "ESCALATES": { canonical: "escalates" as RelationshipCanonicalType, sourceTypes: ["Event"], targetTypes: ["Event"], description: "Event escalates another event or sequence." },
  "DE_ESCALATES": { canonical: "de_escalates" as RelationshipCanonicalType, sourceTypes: ["Event"], targetTypes: ["Event"], description: "Event de-escalates another event or sequence." },
  "INVOLVES_ACTOR": { canonical: "involves_actor" as RelationshipCanonicalType, sourceTypes: ["Event"], targetTypes: ["Actor"], description: "Event involves an actor." },
  "AFFECTS_LEVERAGE": { canonical: "affects_leverage" as RelationshipCanonicalType, sourceTypes: ["Event"], targetTypes: ["Leverage"], description: "Event affects leverage." },
  "VALIDATES_NARRATIVE": { canonical: "validates_narrative" as RelationshipCanonicalType, sourceTypes: ["Event"], targetTypes: ["Narrative"], description: "Event validates a narrative." },
  "CONTRADICTS_NARRATIVE": { canonical: "contradicts_narrative" as RelationshipCanonicalType, sourceTypes: ["Event"], targetTypes: ["Narrative"], description: "Event contradicts a narrative." },
  "FRAMES_EVENT": { canonical: "frames_event" as RelationshipCanonicalType, sourceTypes: ["Narrative"], targetTypes: ["Event"], description: "Narrative frames an event." },
  "JUSTIFIES_CLAIM": { canonical: "justifies_claim" as RelationshipCanonicalType, sourceTypes: ["Narrative"], targetTypes: ["Claim"], description: "Narrative justifies a claim." },
  "UNDERMINES_CLAIM": { canonical: "undermines_claim" as RelationshipCanonicalType, sourceTypes: ["Narrative"], targetTypes: ["Claim"], description: "Narrative undermines a claim." },
  "COMPETES_WITH": { canonical: "competes_with" as RelationshipCanonicalType, sourceTypes: ["Narrative"], targetTypes: ["Narrative"], description: "Narrative competes with another narrative." },
  "REINFORCES": { canonical: "reinforces" as RelationshipCanonicalType, sourceTypes: ["Narrative"], targetTypes: ["Narrative"], description: "Narrative reinforces another narrative." },
  "SEMANTICALLY_SIMILAR_TO": { canonical: "semantically_similar_to" as RelationshipCanonicalType, sourceTypes: ["*"], targetTypes: ["*"], description: "Nodes are semantically similar or likely duplicate references." },
};

const ConfidenceLevelSchema = z.enum(CONFIDENCE_LEVELS);
const NumericConfidenceSchema = z.number().min(0).max(1);

export const SourceSpanSchema = z.object({
  documentId: z.string(),
  charStart: z.number().int().min(0),
  charEnd: z.number().int().min(0),
  excerpt: z.string().max(500),
  retrievedAt: z.string(),
  retrievalMethod: z.enum(['grounded_search', 'Grounded Search', 'feed', 'upload', 'manual']),
});

const BaseEntitySchema = z.object({
  id: z.string(),
  type: z.enum(CONFLICT_ENTITY_TYPES),
  description: z.string().optional(),
  confidence: NumericConfidenceSchema.optional(),
  confidenceLevel: ConfidenceLevelSchema.optional(),
  sourceSpan: SourceSpanSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export const ActorSchema = BaseEntitySchema.extend({
  type: z.literal('actor'),
  name: z.string(),
  description: z.string(),
  shortName: z.string().optional(),
  actorType: z.string(),
  relationships: z.array(z.object({
    targetActorId: z.string(),
    type: z.string(),
    description: z.string().optional(),
    strength: z.number().min(0).max(1).optional(),
  }).passthrough()).optional(),
}).passthrough();

export const ClaimSchema = BaseEntitySchema.extend({
  type: z.literal('claim'),
  actorId: z.string(),
  claimType: z.string(),
  title: z.string(),
  description: z.string(),
  basis: z.string(),
  status: z.string(),
  legitimacyScore: z.number().min(0).max(1).optional(),
  internationalRecognition: z.string().optional(),
  competingClaimIds: z.array(z.string()).optional(),
}).passthrough();

export const InterestSchema = BaseEntitySchema.extend({
  type: z.literal('interest'),
  actorId: z.string(),
  interestType: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.string(),
  visibility: z.string(),
  alignedActorIds: z.array(z.string()).optional(),
  conflictingInterestIds: z.array(z.string()).optional(),
}).passthrough();

export const ConstraintSchema = BaseEntitySchema.extend({
  type: z.literal('constraint'),
  actorId: z.string(),
  constraintType: z.string(),
  title: z.string(),
  description: z.string(),
  severity: z.string(),
  source: z.string(),
  isRemovable: z.boolean().optional(),
  expiryCondition: z.string().optional(),
}).passthrough();

export const LeverageSchema = BaseEntitySchema.extend({
  type: z.literal('leverage'),
  actorId: z.string(),
  targetActorId: z.string(),
  leverageType: z.string(),
  title: z.string(),
  description: z.string(),
  effectiveness: z.number().min(0).max(1),
  sustainability: z.string(),
  isActive: z.boolean(),
  cost: z.string().optional(),
}).passthrough();

export const CommitmentSchema = BaseEntitySchema.extend({
  type: z.literal('commitment'),
  actorId: z.string(),
  commitmentType: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  counterpartyIds: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  verificationMechanism: z.string().optional(),
  dateCommitted: z.string().optional(),
  dateExpires: z.string().optional(),
}).passthrough();

export const EventSchema = BaseEntitySchema.extend({
  type: z.literal('event'),
  title: z.string(),
  description: z.string(),
  eventType: z.string(),
  date: z.string(),
  location: z.string().optional(),
  actorIds: z.array(z.string()),
  impact: z.string(),
  escalatoryDirection: z.string(),
  relatedEventIds: z.array(z.string()).optional(),
  sources: z.array(z.string()).optional(),
}).passthrough();

export const NarrativeSchema = BaseEntitySchema.extend({
  type: z.literal('narrative'),
  actorId: z.string(),
  title: z.string(),
  description: z.string(),
  narrativeType: z.string(),
  keyMessages: z.array(z.string()).optional(),
  targetAudience: z.union([z.string(), z.array(z.string())]).optional(),
  effectiveness: z.number().min(0).max(1).optional(),
  counterNarrativeIds: z.array(z.string()).optional(),
}).passthrough();

export const ConflictEntitySchema = z.discriminatedUnion('type', [
  ActorSchema,
  ClaimSchema,
  InterestSchema,
  ConstraintSchema,
  LeverageSchema,
  CommitmentSchema,
  EventSchema,
  NarrativeSchema,
]);

export const EntityEnrichmentSchema = z.object({
  entityId: z.string(),
  confidence: NumericConfidenceSchema.optional(),
  confidenceLevel: ConfidenceLevelSchema.optional(),
  sourcePassage: z.string().optional(),
  sourceDocument: z.string().optional(),
  sourceSpan: SourceSpanSchema.optional(),
  retrievalMethod: z.enum(['extraction', 'inference', 'manual', 'lookup']).optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  lastVerified: z.string().optional(),
  qualityScore: z.number().min(0).max(100).optional(),
}).passthrough();

export const ConflictGraphSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  region: z.string().optional(),
  status: z.enum(['active', 'frozen', 'resolved', 'emerging', 'escalating']),
  actors: z.array(ActorSchema),
  claims: z.array(ClaimSchema),
  interests: z.array(InterestSchema),
  constraints: z.array(ConstraintSchema),
  leverage: z.array(LeverageSchema),
  commitments: z.array(CommitmentSchema),
  events: z.array(EventSchema),
  narratives: z.array(NarrativeSchema),
  lastUpdated: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  enrichments: z.record(z.string(), EntityEnrichmentSchema).optional(),
  dataCompleteness: z.number().min(0).max(100).optional(),
}).passthrough();

export type Actor = z.infer<typeof ActorSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type Interest = z.infer<typeof InterestSchema>;
export type Constraint = z.infer<typeof ConstraintSchema>;
export type Leverage = z.infer<typeof LeverageSchema>;
export type Commitment = z.infer<typeof CommitmentSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Narrative = z.infer<typeof NarrativeSchema>;
export type ConflictEntity = z.infer<typeof ConflictEntitySchema>;
export type ConflictGraph = z.infer<typeof ConflictGraphSchema>;
export type EntityEnrichment = z.infer<typeof EntityEnrichmentSchema>;
export type SourceSpan = z.infer<typeof SourceSpanSchema>;

export const ENTITY_TYPE_LABELS: Record<ConflictEntityType, string> = {
  actor: 'Actor',
  claim: 'Claim',
  interest: 'Interest',
  constraint: 'Constraint',
  leverage: 'Leverage',
  commitment: 'Commitment',
  event: 'Event',
  narrative: 'Narrative',
};

export const ENTITY_TYPE_COLORS: Record<ConflictEntityType, string> = {
  actor: '#4B92DB',
  claim: '#E8B931',
  interest: '#10B981',
  constraint: '#A63D40',
  leverage: '#8B5CF6',
  commitment: '#3B82F6',
  event: '#F97316',
  narrative: '#EC4899',
};
