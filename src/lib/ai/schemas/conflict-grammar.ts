import { z } from 'zod';

// ============================================================================
// Conflict Grammar Primitives
// The 8 fundamental building blocks for structured conflict analysis
// ============================================================================

/**
 * Actor - Any entity with agency in a conflict
 * States, organizations, individuals, or groups that can take action
 */
export const ActorSchema = z.object({
  type: z.literal('actor'),
  id: z.string(),
  name: z.string(),
  shortName: z.string().optional(),
  actorType: z.enum([
    'state',
    'non_state_armed_group',
    'international_organization',
    'regional_organization',
    'civil_society',
    'private_sector',
    'individual',
    'coalition',
    'diaspora',
    'media',
  ]),
  description: z.string(),
  capabilities: z.array(z.string()).optional(),
  relationships: z
    .array(
      z.object({
        targetActorId: z.string(),
        type: z.enum([
          'ally',
          'adversary',
          'neutral',
          'patron',
          'proxy',
          'mediator',
          'competitor',
          'dependent',
        ]),
        description: z.string().optional(),
        strength: z.number().min(0).max(1).optional(),
      })
    )
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Claim - A formal or informal assertion of rights, territory, or status
 */
export const ClaimSchema = z.object({
  type: z.literal('claim'),
  id: z.string(),
  actorId: z.string(),
  claimType: z.enum([
    'territorial',
    'sovereignty',
    'self_determination',
    'resource',
    'historical',
    'legal',
    'political',
    'economic',
    'security',
    'humanitarian',
    'cultural',
    'religious',
  ]),
  title: z.string(),
  description: z.string(),
  basis: z.string(),
  status: z.enum([
    'active',
    'dormant',
    'resolved',
    'escalating',
    'de_escalating',
    'contested',
  ]),
  legitimacyScore: z.number().min(0).max(1).optional(),
  internationalRecognition: z.enum(['broad', 'limited', 'none', 'disputed']).optional(),
  competingClaimIds: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Interest - The underlying motivations driving an actor's behavior
 */
export const InterestSchema = z.object({
  type: z.literal('interest'),
  id: z.string(),
  actorId: z.string(),
  interestType: z.enum([
    'security',
    'economic',
    'political',
    'ideological',
    'territorial',
    'resource',
    'prestige',
    'survival',
    'domestic_legitimacy',
    'regional_influence',
    'global_influence',
    'humanitarian',
    'cultural',
    'religious',
  ]),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['vital', 'important', 'significant', 'minor']),
  visibility: z.enum(['stated', 'unstated', 'inferred']),
  alignedActorIds: z.array(z.string()).optional(),
  conflictingInterestIds: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Constraint - Factors limiting an actor's freedom of action
 */
export const ConstraintSchema = z.object({
  type: z.literal('constraint'),
  id: z.string(),
  actorId: z.string(),
  constraintType: z.enum([
    'legal',
    'institutional',
    'military',
    'economic',
    'political',
    'social',
    'geographic',
    'normative',
    'resource',
    'alliance',
    'domestic',
    'international',
  ]),
  title: z.string(),
  description: z.string(),
  severity: z.enum(['binding', 'significant', 'moderate', 'minor']),
  source: z.string(),
  isRemovable: z.boolean().optional(),
  expiryCondition: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Leverage - Sources of power or influence one actor holds over another
 */
export const LeverageSchema = z.object({
  type: z.literal('leverage'),
  id: z.string(),
  actorId: z.string(),
  targetActorId: z.string(),
  leverageType: z.enum([
    'military',
    'economic',
    'diplomatic',
    'informational',
    'institutional',
    'normative',
    'energy',
    'trade',
    'financial',
    'technological',
    'demographic',
  ]),
  title: z.string(),
  description: z.string(),
  effectiveness: z.number().min(0).max(1),
  sustainability: z.enum(['short_term', 'medium_term', 'long_term', 'permanent']),
  isActive: z.boolean(),
  cost: z.enum(['low', 'medium', 'high', 'prohibitive']).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Commitment - Promises, obligations, or pledges made by actors
 */
export const CommitmentSchema = z.object({
  type: z.literal('commitment'),
  id: z.string(),
  actorId: z.string(),
  commitmentType: z.enum([
    'treaty',
    'ceasefire',
    'agreement',
    'declaration',
    'resolution',
    'unilateral',
    'bilateral',
    'multilateral',
    'conditional',
    'unconditional',
  ]),
  title: z.string(),
  description: z.string(),
  status: z.enum([
    'proposed',
    'active',
    'suspended',
    'violated',
    'expired',
    'withdrawn',
    'fulfilled',
  ]),
  counterpartyIds: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  verificationMechanism: z.string().optional(),
  dateCommitted: z.string().optional(),
  dateExpires: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Event - A significant occurrence that affects the conflict dynamics
 */
export const EventSchema = z.object({
  type: z.literal('event'),
  id: z.string(),
  title: z.string(),
  description: z.string(),
  eventType: z.enum([
    'military',
    'political',
    'diplomatic',
    'economic',
    'humanitarian',
    'legal',
    'social',
    'environmental',
    'election',
    'protest',
    'negotiation',
    'ceasefire',
    'violation',
    'escalation',
    'de_escalation',
  ]),
  date: z.string(),
  location: z.string().optional(),
  actorIds: z.array(z.string()),
  impact: z.enum(['critical', 'major', 'moderate', 'minor']),
  escalatoryDirection: z.enum(['escalatory', 'de_escalatory', 'neutral', 'ambiguous']),
  relatedEventIds: z.array(z.string()).optional(),
  sources: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Narrative - A framing or interpretation of the conflict by an actor
 */
export const NarrativeSchema = z.object({
  type: z.literal('narrative'),
  id: z.string(),
  actorId: z.string(),
  title: z.string(),
  description: z.string(),
  narrativeType: z.enum([
    'justification',
    'victimhood',
    'historical',
    'legal',
    'moral',
    'security',
    'economic',
    'religious',
    'nationalist',
    'humanitarian',
    'counter_narrative',
    'propaganda',
  ]),
  keyMessages: z.array(z.string()),
  targetAudience: z.enum([
    'domestic',
    'international',
    'regional',
    'specific_actor',
    'diaspora',
    'media',
  ]),
  effectiveness: z.number().min(0).max(1).optional(),
  reach: z.enum(['local', 'national', 'regional', 'global']).optional(),
  counterNarrativeIds: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// Extended Primitives — Policy, Development, Human Rights, Governance
// ============================================================================

/**
 * Institution - Formal or informal structures that shape conflict dynamics
 * Courts, councils, peace processes, governance bodies, customary authorities
 */
export const InstitutionSchema = z.object({
  type: z.literal('institution'),
  id: z.string(),
  name: z.string(),
  institutionType: z.enum([
    'court', 'legislature', 'executive', 'military_body', 'peace_process',
    'mediation_mechanism', 'monitoring_body', 'sanctions_committee',
    'truth_commission', 'customary_authority', 'religious_authority',
    'regulatory_body', 'development_agency', 'humanitarian_cluster',
  ]),
  description: z.string(),
  mandate: z.string().optional(),
  legitimacy: z.enum(['high', 'contested', 'low', 'collapsed']).optional(),
  effectiveControl: z.string().optional(),
  relatedActorIds: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Norm - Legal, customary, or moral standards relevant to the situation
 * IHL, IHRL, UNSC resolutions, treaties, customary law, R2P
 */
export const NormSchema = z.object({
  type: z.literal('norm'),
  id: z.string(),
  title: z.string(),
  normType: z.enum([
    'ihl', 'ihrl', 'unsc_resolution', 'treaty', 'customary_law',
    'jus_cogens', 'soft_law', 'regional_instrument', 'bilateral_agreement',
    'ceasefire_terms', 'peace_accord', 'r2p', 'sanctions_regime',
    'arms_embargo', 'development_standard', 'environmental_law',
  ]),
  description: z.string(),
  legalBasis: z.string().optional(),
  complianceStatus: z.enum(['complied', 'partially_complied', 'violated', 'disputed', 'unknown']).optional(),
  violatingActorIds: z.array(z.string()).optional(),
  enforcementMechanism: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Resource - Natural, financial, or strategic assets at stake
 * Oil, water, minerals, territory, trade routes, aid flows, remittances
 */
export const ResourceSchema = z.object({
  type: z.literal('resource'),
  id: z.string(),
  name: z.string(),
  resourceType: z.enum([
    'hydrocarbon', 'mineral', 'water', 'agricultural_land', 'territory',
    'trade_route', 'port', 'financial', 'aid_flow', 'remittance',
    'arms', 'technology', 'labor', 'cultural_heritage', 'data',
  ]),
  description: z.string(),
  controlledByActorId: z.string().optional(),
  contestedByActorIds: z.array(z.string()).optional(),
  strategicValue: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  location: z.string().optional(),
  estimatedValue: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Risk - Identified threats, vulnerabilities, and early warning indicators
 * Escalation risks, humanitarian crises, protection concerns, spoiler threats
 */
export const RiskSchema = z.object({
  type: z.literal('risk'),
  id: z.string(),
  title: z.string(),
  riskType: z.enum([
    'escalation', 'violence', 'humanitarian', 'displacement',
    'famine', 'epidemic', 'economic_collapse', 'state_failure',
    'spoiler', 'external_intervention', 'election_violence',
    'hate_speech', 'environmental', 'cyber', 'wmd_proliferation',
  ]),
  description: z.string(),
  likelihood: z.enum(['very_high', 'high', 'medium', 'low', 'very_low']),
  impact: z.enum(['catastrophic', 'severe', 'significant', 'moderate', 'minor']),
  timeframe: z.enum(['imminent', 'short_term', 'medium_term', 'long_term']).optional(),
  indicators: z.array(z.string()).optional(),
  mitigationOptions: z.array(z.string()).optional(),
  relatedActorIds: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Policy - Policy positions, options, or interventions proposed or enacted
 * Sanctions, aid conditions, diplomatic initiatives, military options
 */
export const PolicySchema = z.object({
  type: z.literal('policy'),
  id: z.string(),
  actorId: z.string(),
  title: z.string(),
  policyType: z.enum([
    'sanctions', 'aid_conditionality', 'diplomatic_initiative', 'military_intervention',
    'peacekeeping', 'mediation_offer', 'trade_restriction', 'arms_embargo',
    'travel_ban', 'asset_freeze', 'development_program', 'capacity_building',
    'election_support', 'ssr', 'ddr', 'transitional_justice', 'humanitarian_access',
  ]),
  description: z.string(),
  status: z.enum(['proposed', 'adopted', 'implemented', 'suspended', 'terminated', 'under_review']),
  objectives: z.array(z.string()).optional(),
  effectiveness: z.enum(['effective', 'partially_effective', 'ineffective', 'counterproductive', 'unknown']).optional(),
  targetActorIds: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Grievance - Underlying causes of conflict: injustice, inequality, exclusion
 * Human rights violations, marginalization, historical wrongs, structural violence
 */
export const GrievanceSchema = z.object({
  type: z.literal('grievance'),
  id: z.string(),
  title: z.string(),
  grievanceType: z.enum([
    'political_exclusion', 'economic_inequality', 'land_dispossession',
    'ethnic_discrimination', 'religious_persecution', 'gender_violence',
    'historical_injustice', 'forced_displacement', 'extrajudicial_killing',
    'torture', 'enforced_disappearance', 'child_recruitment',
    'sexual_violence', 'cultural_destruction', 'environmental_injustice',
    'labor_exploitation', 'corruption', 'election_fraud',
  ]),
  description: z.string(),
  affectedGroupId: z.string().optional(),
  perpetratorActorId: z.string().optional(),
  scale: z.enum(['systematic', 'widespread', 'isolated', 'structural']).optional(),
  documented: z.boolean().optional(),
  documentedBy: z.array(z.string()).optional(),
  redressMechanism: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// Discriminated Union
// ============================================================================

/**
 * ConflictEntitySchema - Discriminated union of all 14 conflict grammar primitives
 * Uses the `type` field as the discriminator
 *
 * Original 8: Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative
 * Extended 6: Institution, Norm, Resource, Risk, Policy, Grievance
 */
export const ConflictEntitySchema = z.discriminatedUnion('type', [
  ActorSchema,
  ClaimSchema,
  InterestSchema,
  ConstraintSchema,
  LeverageSchema,
  CommitmentSchema,
  EventSchema,
  NarrativeSchema,
  InstitutionSchema,
  NormSchema,
  ResourceSchema,
  RiskSchema,
  PolicySchema,
  GrievanceSchema,
]);

// ============================================================================
// Conflict Graph Container
// ============================================================================

/**
 * ConflictGraphSchema - The full conflict knowledge graph
 * Contains all entities organized by type plus top-level metadata
 */
export const ConflictGraphSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  region: z.string().optional(),
  status: z.enum(['active', 'frozen', 'resolved', 'emerging', 'escalating']),
  // Original 8 primitives
  actors: z.array(ActorSchema),
  claims: z.array(ClaimSchema),
  interests: z.array(InterestSchema),
  constraints: z.array(ConstraintSchema),
  leverage: z.array(LeverageSchema),
  commitments: z.array(CommitmentSchema),
  events: z.array(EventSchema),
  narratives: z.array(NarrativeSchema),
  // Extended 6 primitives
  institutions: z.array(InstitutionSchema).optional(),
  norms: z.array(NormSchema).optional(),
  resources: z.array(ResourceSchema).optional(),
  risks: z.array(RiskSchema).optional(),
  policies: z.array(PolicySchema).optional(),
  grievances: z.array(GrievanceSchema).optional(),
  lastUpdated: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type Actor = z.infer<typeof ActorSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type Interest = z.infer<typeof InterestSchema>;
export type Constraint = z.infer<typeof ConstraintSchema>;
export type Leverage = z.infer<typeof LeverageSchema>;
export type Commitment = z.infer<typeof CommitmentSchema>;
export type Event = z.infer<typeof EventSchema>;
export type Narrative = z.infer<typeof NarrativeSchema>;
export type Institution = z.infer<typeof InstitutionSchema>;
export type Norm = z.infer<typeof NormSchema>;
export type Resource = z.infer<typeof ResourceSchema>;
export type Risk = z.infer<typeof RiskSchema>;
export type Policy = z.infer<typeof PolicySchema>;
export type Grievance = z.infer<typeof GrievanceSchema>;
export type ConflictEntity = z.infer<typeof ConflictEntitySchema>;
export type ConflictGraph = z.infer<typeof ConflictGraphSchema>;

export type ConflictEntityType = ConflictEntity['type'];

/** All 14 entity type labels for UI */
export const ENTITY_TYPE_LABELS: Record<ConflictEntityType, string> = {
  actor: 'Actor',
  claim: 'Claim',
  interest: 'Interest',
  constraint: 'Constraint',
  leverage: 'Leverage',
  commitment: 'Commitment',
  event: 'Event',
  narrative: 'Narrative',
  institution: 'Institution',
  norm: 'Norm / Legal Framework',
  resource: 'Resource',
  risk: 'Risk / Early Warning',
  policy: 'Policy / Intervention',
  grievance: 'Grievance / Root Cause',
};

/** Entity type colors for visualization */
export const ENTITY_TYPE_COLORS: Record<ConflictEntityType, string> = {
  actor: '#4B92DB',
  claim: '#E8B931',
  interest: '#10B981',
  constraint: '#A63D40',
  leverage: '#8B5CF6',
  commitment: '#3B82F6',
  event: '#F97316',
  narrative: '#EC4899',
  institution: '#6366F1',
  norm: '#14B8A6',
  resource: '#D97706',
  risk: '#EF4444',
  policy: '#0EA5E9',
  grievance: '#DC2626',
};
