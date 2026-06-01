import { z } from 'zod';

import { CAPSULE_EVAL_JUDGE_MODEL } from '@/lib/ai/model-matrix';
import { TACITUS_CORE_PRIMITIVES } from '@/lib/graph/core-primitives';
import { isOntologyId } from '@/lib/ontology/types';
import { DOMAIN_IDS } from '@/types/domain';

const SemVerSchema = z.string().min(1).max(40);
const HashSchema = z.string().min(1).max(120);
const DomainKeySchema = z.union([z.enum(DOMAIN_IDS), z.string().min(1).max(120)]);
const JsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);
const JsonObjectSchema = z.record(z.string(), JsonValueSchema);

export const CapsuleRefSchema = z.object({
  id: z.string().min(1).max(180),
  version: SemVerSchema.optional(),
  hash: HashSchema.optional(),
});

export const CapsuleImportSchema = z.object({
  ref: CapsuleRefSchema,
  as: z.string().min(1).max(120),
  pick: z.array(z.string().min(1).max(80)).max(32).optional(),
});

export const FewShotExampleSchema = z.object({
  id: z.string().min(1).max(120),
  input: z.string().min(1).max(8000),
  output: z.string().min(1).max(16000),
  notes: z.string().max(2000).optional(),
  version: SemVerSchema.optional(),
  sourceRefs: z.array(z.string().min(1).max(180)).max(50).optional(),
});

export const SourcingPolicySchema = z.object({
  mode: z.enum(['live-search', 'corpus', 'skc', 'hybrid']),
  minSourcesPerClaim: z.number().int().min(0).max(12),
  allowedDomains: z.array(z.string().min(1).max(240)).max(200).default([]),
  blockedDomains: z.array(z.string().min(1).max(240)).max(200).default([]),
  recencyWindowDays: z.number().int().positive().max(3650).optional(),
  requiredSourceTypes: z.array(z.string().min(1).max(80)).max(50).default([]),
  citationStyle: z.enum(['inline', 'footnote', 'source-card']).optional(),
  sourceTrust: z.record(z.string(), z.number().min(0).max(1)).optional(),
});

export const RetrievalConfigSchema = z.object({
  mode: z.enum(['live-search', 'corpus', 'skc', 'hybrid']),
  corpora: z.array(z.string().min(1).max(240)).max(200).default([]),
  graphExpansionDepth: z.number().int().min(0).max(6),
  topK: z.number().int().min(1).max(100),
  trustRank: z.enum(['balanced', 'strict', 'recency']),
  vectorIndex: z.string().min(1).max(240).optional(),
  filters: JsonObjectSchema.optional(),
});

export const CapsuleTemporalitySchema = z.object({
  timelineAnchors: z.array(z.object({
    id: z.string().min(1).max(160),
    label: z.string().min(1).max(240),
    date: z.string().min(1).max(80),
    kind: z.enum(['as-of', 'event', 'deadline', 'review', 'validity-start', 'validity-end']),
    sourceRefs: z.array(z.string().min(1).max(180)).max(80).optional(),
    confidence: z.number().min(0).max(1).optional(),
  })).max(80).default([]),
  asOf: z.string().min(1).max(80).optional(),
  validFrom: z.string().min(1).max(80).optional(),
  validUntil: z.string().min(1).max(80).optional(),
});

export const CapsuleCausalitySchema = z.object({
  causalLinks: z.array(z.object({
    id: z.string().min(1).max(160),
    cause: z.string().min(1).max(800),
    effect: z.string().min(1).max(800),
    relation: z.enum(['causes', 'enables', 'blocks', 'escalates', 'de-escalates', 'correlates']),
    evidenceRefs: z.array(z.string().min(1).max(180)).max(80).default([]),
    confidence: z.number().min(0).max(1).optional(),
    caveat: z.string().max(1200).optional(),
  })).max(120).default([]),
});

export const CapsuleOntologyBindingSchema = z.object({
  domainId: DomainKeySchema,
  taxonomyPath: z.array(z.string().min(1).max(160)).max(12).default(['generic']),
  ontologyIds: z.array(z.string().refine(isOntologyId, 'Unknown ontology id')).max(12).default(['governance']),
  acoPrimitives: z.array(z.enum(TACITUS_CORE_PRIMITIVES)).max(16).default(['Actor', 'Claim']),
  bindingRationale: z.string().min(1).max(2000).default('Use the generic PRAXIS ontology binding until a domain-specific review updates this capsule.'),
});

const CapsuleEmbeddedGraphReviewStateSchema = z.enum(['canonical', 'proposed', 'missing', 'advisory', 'reviewed']);

export const CapsuleEmbeddedGraphProjectionSchema = z.object({
  provider: z.literal('graphlite'),
  projectionId: z.string().min(1).max(220),
  status: z.enum(['compiled-advisory', 'stale', 'reviewed', 'promoted']),
  namedGraph: z.string().min(1).max(220),
  advisoryOnly: z.literal(true),
  canonicalStore: z.literal('Firestore ContextCapsules'),
  promotionGate: z.string().min(1).max(1200),
  nodeCount: z.number().int().nonnegative().optional(),
  edgeCount: z.number().int().nonnegative().optional(),
  nodes: z.array(z.object({
    id: z.string().min(1).max(220),
    label: z.string().min(1).max(300),
    entityType: z.string().min(1).max(120),
    reviewState: CapsuleEmbeddedGraphReviewStateSchema.optional(),
    confidence: z.number().min(0).max(1).optional(),
    sourceReceiptIds: z.array(z.string().min(1).max(180)).max(80).optional(),
  })).max(1000).default([]),
  edges: z.array(z.object({
    id: z.string().min(1).max(220),
    source: z.string().min(1).max(220),
    target: z.string().min(1).max(220),
    label: z.string().min(1).max(240),
    relationshipType: z.string().min(1).max(160).optional(),
    reviewState: CapsuleEmbeddedGraphReviewStateSchema.optional(),
    confidence: z.number().min(0).max(1).optional(),
    sourceReceiptIds: z.array(z.string().min(1).max(180)).max(80).optional(),
  })).max(2000).default([]),
});

export const VertexSafetySettingSchema = z.object({
  category: z.string().min(1).max(160),
  threshold: z.string().min(1).max(160),
});

export const CapsuleEvalSchema = z.object({
  goldenSetRef: z.string().min(1).max(300),
  thresholds: z.object({
    faithfulness: z.number().min(0).max(1),
    citationCoverage: z.number().min(0).max(1),
    contextRecall: z.number().min(0).max(1),
    schemaConformance: z.number().min(0).max(1),
    redTeamPassRate: z.number().min(0).max(1),
    safetyScore: z.number().min(0).max(1),
  }),
  metrics: z.array(z.enum([
    'faithfulness',
    'response_relevancy',
    'context_precision',
    'context_recall',
    'factual_correctness',
    'tool_call_accuracy',
    'agent_goal_accuracy',
  ])).min(1).max(16),
  judge: z.literal(CAPSULE_EVAL_JUDGE_MODEL),
  lastRun: z.object({
    runId: z.string().min(1).max(180),
    scores: z.record(z.string(), z.number()),
    passedAt: z.string().min(1).max(80),
  }).optional(),
});

export const CertificationBadgeSchema = z.object({
  tier: z.enum(['community', 'reviewed', 'verified']),
  scores: z.record(z.string(), z.number()),
  evalRunId: z.string().min(1).max(180),
  signedBy: z.string().min(1).max(180),
  expiresAt: z.string().min(1).max(80),
});

export const ContextCapsuleSchema = z.object({
  id: z.string().min(1).max(180),
  schemaVersion: z.literal('capsule/v2'),
  version: SemVerSchema,
  contentHash: HashSchema,
  status: z.enum(['draft', 'published', 'deprecated', 'verified']),
  forkedFrom: CapsuleRefSchema.optional(),
  immutable: z.boolean(),

  extends: CapsuleRefSchema.optional(),
  imports: z.array(CapsuleImportSchema).max(32).optional(),
  mergeStrategy: z.enum(['prototype', 'deep-merge', 'override']),

  persona: z.object({
    analystProfile: z.record(z.string(), JsonValueSchema).default({}),
    systemFrame: z.string().min(1).max(24000),
    domain: DomainKeySchema,
    frameworks: z.array(z.string().min(1).max(120)).max(80).default([]),
    fewShot: z.array(FewShotExampleSchema).max(40).default([]),
  }),

  output: z.object({
    format: z.enum(['json', 'markdown', 'report', 'brief']),
    responseJsonSchema: z.record(z.string(), JsonValueSchema),
    propertyOrdering: z.array(z.string().min(1).max(120)).max(100),
    zodRef: z.string().min(1).max(180).optional(),
    renderTemplate: z.string().max(32000).optional(),
  }),

  sourcing: SourcingPolicySchema,
  retrieval: RetrievalConfigSchema,
  temporality: CapsuleTemporalitySchema.default({ timelineAnchors: [] }),
  causality: CapsuleCausalitySchema.default({ causalLinks: [] }),
  ontologyBinding: CapsuleOntologyBindingSchema.default({
    domainId: 'generic',
    taxonomyPath: ['generic'],
    ontologyIds: ['governance'],
    acoPrimitives: ['Actor', 'Claim'],
    bindingRationale: 'Use the generic PRAXIS ontology binding until a domain-specific review updates this capsule.',
  }),
  embeddedGraph: CapsuleEmbeddedGraphProjectionSchema.default({
    provider: 'graphlite',
    projectionId: 'capsule-graphlite-projection',
    status: 'stale',
    namedGraph: 'capsule_graphlite_projection',
    advisoryOnly: true,
    canonicalStore: 'Firestore ContextCapsules',
    promotionGate: 'Human review-card approval required before canonical graph promotion.',
    nodes: [],
    edges: [],
  }),

  tools: z.object({
    bound: z.array(z.string().min(1).max(160)).max(80).default([]),
    recommended: z.array(z.string().min(1).max(160)).max(80).default([]),
    policy: z.enum(['auto', 'suggest', 'manual']),
  }),

  guardrails: z.object({
    refusalPolicy: z.string().min(1).max(12000),
    blockedTopics: z.array(z.string().min(1).max(240)).max(200).default([]),
    piiHandling: z.enum(['redact', 'block', 'allow']),
    citationRequired: z.boolean(),
    maxUngroundedClaims: z.number().int().min(0).max(100),
    safetySettings: z.array(VertexSafetySettingSchema).max(40).default([]),
  }),

  eval: CapsuleEvalSchema,
  provenance: z.object({
    author: z.object({
      uid: z.string().min(1).max(180),
      org: z.string().min(1).max(180).optional(),
    }),
    createdAt: z.string().min(1).max(80),
    publishedAt: z.string().min(1).max(80).optional(),
    signature: z.record(z.string(), JsonValueSchema).optional(),
    attestation: z.record(z.string(), JsonValueSchema).optional(),
    certification: CertificationBadgeSchema.optional(),
  }),

  market: z.object({
    visibility: z.enum(['private', 'org', 'unlisted', 'public']),
    pricing: z.enum(['free', 'credits', 'subscription']),
    credits: z.number().int().nonnegative().optional(),
    category: DomainKeySchema,
    tags: z.array(z.string().min(1).max(80)).max(60).default([]),
    installs: z.number().int().nonnegative().default(0),
    rating: z.number().min(0).max(5).default(0),
    revenueShare: z.object({
      authorUid: z.string().min(1).max(180),
      pct: z.number().min(0).max(100),
    }).optional(),
  }),
});

export type ContextCapsuleInput = z.input<typeof ContextCapsuleSchema>;
export type ContextCapsuleOutput = z.output<typeof ContextCapsuleSchema>;
