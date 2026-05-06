import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Primitive = {
  name: string;
  jsonType: string;
  description: string;
  subtypes: string[];
};

type Relationship = {
  name: string;
  canonical: string;
  sourceTypes: string[];
  targetTypes: string[];
  description: string;
};

type ConfidenceLevel = {
  name: string;
  description: string;
};

type ConflictGrammarSource = {
  examples: Array<{
    version: string;
    primitives: Primitive[];
    relationships: Relationship[];
    confidenceLevels: ConfidenceLevel[];
  }>;
};

const repoRoot = resolve(__dirname, '..');
const schemaPath = resolve(repoRoot, 'schemas/conflict-grammar-v1.json');
const source = JSON.parse(readFileSync(schemaPath, 'utf8')) as ConflictGrammarSource;

const grammar = source.examples[0];
const primitives = grammar.primitives;
const relationships = grammar.relationships;
const confidenceLevels = grammar.confidenceLevels;

if (primitives.length !== 8) throw new Error(`Expected 8 primitives, found ${primitives.length}`);
if (relationships.length !== 42) throw new Error(`Expected 42 relationships, found ${relationships.length}`);
if (confidenceLevels.length !== 4) throw new Error(`Expected 4 confidence levels, found ${confidenceLevels.length}`);

const q = (value: string) => JSON.stringify(value);
const tsArray = (values: string[]) => `[${values.map(q).join(', ')}]`;
const pyList = (values: string[]) => `[${values.map(q).join(', ')}]`;

const ts = `/* GENERATED FILE - DO NOT EDIT.
 * Source: schemas/conflict-grammar-v1.json
 * Regenerate with: npm run schema:gen
 */

import { z } from 'zod';

export const CONFLICT_GRAMMAR_VERSION = ${q(grammar.version)};

export const ACO_ENTITY_TYPES = ${tsArray(primitives.map((p) => p.name))} as const;
export type ACOEntityType = (typeof ACO_ENTITY_TYPES)[number];

export const CONFLICT_ENTITY_TYPES = ${tsArray(primitives.map((p) => p.jsonType))} as const;
export type ConflictEntityType = (typeof CONFLICT_ENTITY_TYPES)[number];

export const CONFIDENCE_LEVELS = ${tsArray(confidenceLevels.map((l) => l.name))} as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const RELATIONSHIP_TYPES = ${tsArray(relationships.map((r) => r.name))} as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const RELATIONSHIP_CANONICAL_TYPES = ${tsArray(relationships.map((r) => r.canonical))} as const;
export type RelationshipCanonicalType = (typeof RELATIONSHIP_CANONICAL_TYPES)[number];

export const PRIMITIVE_DESCRIPTIONS: Record<ACOEntityType, string> = {
${primitives.map((p) => `  ${q(p.name)}: ${q(p.description)},`).join('\n')}
};

export const PRIMITIVE_SUBTYPES: Record<ACOEntityType, readonly string[]> = {
${primitives.map((p) => `  ${q(p.name)}: ${tsArray(p.subtypes)},`).join('\n')}
};

export const RELATIONSHIP_VOCABULARY: Record<RelationshipType, { canonical: RelationshipCanonicalType; sourceTypes: readonly string[]; targetTypes: readonly string[]; description: string }> = {
${relationships.map((r) => `  ${q(r.name)}: { canonical: ${q(r.canonical)} as RelationshipCanonicalType, sourceTypes: ${tsArray(r.sourceTypes)}, targetTypes: ${tsArray(r.targetTypes)}, description: ${q(r.description)} },`).join('\n')}
};

const ConfidenceLevelSchema = z.enum(CONFIDENCE_LEVELS);
const NumericConfidenceSchema = z.number().min(0).max(1);

export const SourceSpanSchema = z.object({
  documentId: z.string(),
  charStart: z.number().int().min(0),
  charEnd: z.number().int().min(0),
  excerpt: z.string().max(500),
  retrievedAt: z.string(),
  retrievalMethod: z.enum(['grounded_search', 'feed', 'upload', 'manual']),
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
`;

const pyAco = `# GENERATED FILE - DO NOT EDIT.
# Source: schemas/conflict-grammar-v1.json
# Regenerate with: npm run schema:gen
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


CONFLICT_GRAMMAR_VERSION = ${q(grammar.version)}


class ConfidenceLevel(str, Enum):
${confidenceLevels.map((l) => `    ${l.name.toLowerCase()} = ${q(l.name)}  # ${l.description}`).join('\n')}


class PrimitiveType(str, Enum):
${primitives.map((p) => `    ${p.jsonType} = ${q(p.name)}`).join('\n')}


CORE_PRIMITIVES = {
${primitives.map((p) => `    PrimitiveType.${p.jsonType},`).join('\n')}
}

EXTENDED_PRIMITIVES: set[PrimitiveType] = set()


class SourceSpan(BaseModel):
    documentId: str = ""
    charStart: int = Field(default=0, ge=0)
    charEnd: int = Field(default=0, ge=0)
    excerpt: str = Field(default="", max_length=500)
    retrievedAt: str = ""
    retrievalMethod: str = "manual"


class ACONode(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    label: str
    description: str = ""
    primitive_type: PrimitiveType = PrimitiveType.actor
    source_file: str = ""
    source_location: str = ""
    confidence: float = Field(default=0.75, ge=0, le=1)
    confidence_level: ConfidenceLevel = ConfidenceLevel.extracted
    extractor_version: str = CONFLICT_GRAMMAR_VERSION
    source_span: SourceSpan | None = None
    tenant_id: str = ""
    situation_id: str = ""
    extracted_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = Field(default_factory=dict)
    valid_from: str = ""
    valid_until: str = ""
    last_verified: str = ""
    provenance: list[str] = Field(default_factory=list)


class Actor(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.actor
    actor_type: str = ""
    affiliation: str = ""
    capabilities: list[str] = Field(default_factory=list)
    stated_position: str = ""


class Claim(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.claim
    claim_type: str = ""
    content: str = ""
    legitimacy_basis: str = ""


class Interest(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.interest
    interest_type: str = ""
    salience: float = Field(default=0.5, ge=0, le=1)
    is_negotiable: bool = True


class Constraint(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.constraint
    constraint_type: str = ""
    severity: str = "soft"
    imposed_by: str = ""


class Leverage(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.leverage
    leverage_type: str = ""
    holder: str = ""
    target: str = ""
    effectiveness: float = Field(default=0.5, ge=0, le=1)
    sustainability: str = ""


class Commitment(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.commitment
    commitment_type: str = ""
    status: str = "pending"
    parties: list[str] = Field(default_factory=list)
    date_made: str = ""


class Event(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.event
    event_type: str = ""
    date: str = ""
    location: str = ""
    casualties: int | None = None
    escalation_impact: float = Field(default=0.0, ge=-1, le=1)


class Narrative(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.narrative
    narrative_type: str = ""
    framing: str = ""
    propagated_by: str = ""
    reach: str = "local"


class ACOEdge(BaseModel):
    model_config = ConfigDict(extra="allow")

    source: str
    target: str
    relation: str
    confidence: float = Field(default=0.75, ge=0, le=1)
    confidence_level: ConfidenceLevel = ConfidenceLevel.extracted
    source_file: str = ""
    source_location: str = ""
    source_span: SourceSpan | None = None
    weight: float = 1.0
    tenant_id: str = ""
    situation_id: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)
    valid_from: str = ""
    valid_until: str = ""


ACO_TYPE_MAP: dict[str, type[ACONode]] = {
${primitives.map((p) => `    ${q(p.name)}: ${p.name},`).join('\n')}
}


def make_aco_node(data: dict) -> ACONode:
    """Deserialize a dict into the correct ACONode subclass."""
    ptype = data.get("primitive_type", "Actor")
    cls = ACO_TYPE_MAP.get(ptype)
    payload = dict(data)
    if cls is None:
        payload.pop("primitive_type", None)
        cls = Actor
    return cls(**payload)
`;

const pyRelationships = `# GENERATED FILE - DO NOT EDIT.
# Source: schemas/conflict-grammar-v1.json
# Regenerate with: npm run schema:gen
from __future__ import annotations

from .aco import ACOEdge


ACO_RELATIONSHIPS: dict[str, dict[str, list[str] | str]] = {
${relationships.map((r) => `    ${q(r.name)}: {"canonical": ${q(r.canonical)}, "source_types": ${pyList(r.sourceTypes)}, "target_types": ${pyList(r.targetTypes)}, "description": ${q(r.description)}},`).join('\n')}
}

_CANONICAL_TO_NAME = {v["canonical"]: k for k, v in ACO_RELATIONSHIPS.items()}


def normalize_relation(relation: str) -> str:
    """Normalize a relationship type to the canonical uppercase enum key."""
    raw = relation.strip()
    if raw in ACO_RELATIONSHIPS:
        return raw
    normalized = raw.lower().replace(" ", "_").replace("-", "_").strip("_")
    if normalized in _CANONICAL_TO_NAME:
        return _CANONICAL_TO_NAME[normalized]
    upper = normalized.upper()
    if upper in ACO_RELATIONSHIPS:
        return upper
    return upper


def canonical_relation(relation: str) -> str:
    """Return the snake-case relation label used by LLM prompts and UI edges."""
    key = normalize_relation(relation)
    rel = ACO_RELATIONSHIPS.get(key)
    return str(rel["canonical"]) if rel else relation.strip().lower()


def validate_relation(relation: str, source_type: str, target_type: str) -> tuple[bool, str]:
    """Validate a relationship against the 42-edge ACO vocabulary."""
    key = normalize_relation(relation)
    rel = ACO_RELATIONSHIPS.get(key)
    if rel is None:
        return False, key
    source_types = rel["source_types"]
    target_types = rel["target_types"]
    source_ok = "*" in source_types or source_type in source_types
    target_ok = "*" in target_types or target_type in target_types
    return source_ok and target_ok, key


RELATIONSHIP_CATEGORIES: dict[str, list[str]] = {
    "causal": ["TRIGGERED_BY", "ESCALATES", "DE_ESCALATES", "DERIVED_FROM_EVENT", "IMPOSED_BY_EVENT"],
    "structural": ["SUBORDINATE_TO", "FACES_CONSTRAINT", "CONSTRAINED_BY"],
    "antagonistic": ["OPPOSES", "CONTRADICTS", "CONFLICTS_WITH", "UNDERMINES_CLAIM", "UNDERMINED_BY", "VIOLATED_BY_EVENT"],
    "cooperative": ["ALLIED_WITH", "SUPPORTS_CLAIM", "ALIGNS_WITH", "MADE_COMMITMENT", "ADDRESSES_CLAIM", "REINFORCES"],
    "foundational": ["HAS_INTEREST", "CLAIMS", "BASED_ON_INTEREST", "UNDERLYING_INTEREST_OF"],
}
`;

const pyInit = `# GENERATED FILE - DO NOT EDIT.
# Source: schemas/conflict-grammar-v1.json
# Regenerate with: npm run schema:gen

from .aco import (
    ACOEdge,
    ACONode,
    ACO_TYPE_MAP,
    Actor,
    Claim,
    Commitment,
    ConfidenceLevel,
    Constraint,
    Event,
    Interest,
    Leverage,
    Narrative,
    PrimitiveType,
    SourceSpan,
    CORE_PRIMITIVES,
    EXTENDED_PRIMITIVES,
    make_aco_node,
)

from .relationships import (
    ACO_RELATIONSHIPS,
    RELATIONSHIP_CATEGORIES,
    canonical_relation,
    normalize_relation,
    validate_relation,
)

from .extraction import (
    ExtractionEdge,
    ExtractionNode,
    ExtractionResult,
    TimelineEntry,
)

__all__ = [
    "ACOEdge", "ACONode", "ACO_TYPE_MAP", "Actor", "Claim", "Commitment",
    "ConfidenceLevel", "Constraint", "Event", "Interest", "Leverage",
    "Narrative", "PrimitiveType", "SourceSpan", "CORE_PRIMITIVES",
    "EXTENDED_PRIMITIVES", "make_aco_node", "ACO_RELATIONSHIPS",
    "RELATIONSHIP_CATEGORIES", "canonical_relation", "normalize_relation",
    "validate_relation", "ExtractionEdge", "ExtractionNode",
    "ExtractionResult", "TimelineEntry",
]
`;

writeFileSync(resolve(repoRoot, 'src/lib/ai/schemas/conflict-grammar.ts'), ts);
writeFileSync(resolve(repoRoot, 'backend/graphify_tacitus/schemas/aco.py'), pyAco);
writeFileSync(resolve(repoRoot, 'backend/graphify_tacitus/schemas/relationships.py'), pyRelationships);
writeFileSync(resolve(repoRoot, 'backend/graphify_tacitus/schemas/__init__.py'), pyInit);

console.log(`Generated conflict grammar ${grammar.version}: ${primitives.length} primitives, ${relationships.length} relationships`);
