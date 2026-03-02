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
// Discriminated Union
// ============================================================================

/**
 * ConflictEntitySchema - Discriminated union of all 8 conflict grammar primitives
 * Uses the `type` field as the discriminator
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
export type ConflictEntity = z.infer<typeof ConflictEntitySchema>;
export type ConflictGraph = z.infer<typeof ConflictGraphSchema>;

export type ConflictEntityType = ConflictEntity['type'];
