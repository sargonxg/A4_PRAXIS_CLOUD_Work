import { z } from 'zod';

export const CORE_KINDS = [
  'praxis',
  'user',
  'team',
  'situation',
  'source',
  'document',
  'graph',
  'output',
] as const;

export const CORE_STATUSES = ['active', 'archived', 'locked'] as const;
export const CORE_GRANT_ROLES = ['owner', 'editor', 'commenter', 'viewer'] as const;
export const CORE_GRANT_PRINCIPALS = ['user', 'team', 'link', 'public'] as const;

export const truthLayerSchema = z.enum(['Source', 'Claim', 'Evidence', 'Verdict']);
export const primitiveSchema = z.enum([
  'Actor',
  'Claim',
  'Interest',
  'Constraint',
  'Leverage',
  'Commitment',
  'Event',
  'Narrative',
]);

export const coreIdSchema = z.string().uuid();
export const ontologyRefSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1).optional(),
});
export const skillRefSchema = z.object({
  id: z.string().min(1),
  version: z.string().optional(),
});
export const subagentRefSchema = skillRefSchema;

export const praxisCoreMetadataSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  tools: z.array(skillRefSchema),
  subagents: z.array(subagentRefSchema),
  truth_layers: z.array(truthLayerSchema),
  primitives: z.array(primitiveSchema),
  ontologies: z.array(ontologyRefSchema),
  default_models: z.object({
    quick: z.string().min(1),
    deep: z.string().min(1),
    memo: z.string().min(1),
  }),
  routing_rules: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const userCoreMetadataSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  mandate: z.string().optional(),
  language: z.string().min(2),
  jurisdiction: z.string().optional(),
  style: z.object({
    formality: z.enum(['formal', 'plain', 'casual']),
    citation_density: z.enum(['high', 'medium', 'low']),
    structure_preference: z.enum(['narrative', 'bulleted', 'mixed']),
  }),
  model_prefs: z.object({
    quick_model: z.string().optional(),
    deep_model: z.string().optional(),
    cost_ceiling_per_thread_usd: z.number().nonnegative().optional(),
  }).default({}),
  default_attached_cores: z.array(coreIdSchema).default([]),
  saved_situations: z.array(coreIdSchema).default([]),
  tags: z.array(z.string()).default([]),
});

export const teamCoreMetadataSchema = z.object({
  name: z.string().min(1),
  org: z.string().min(1),
  members: z.array(z.object({
    uid: z.string().min(1),
    role: z.enum(['admin', 'editor', 'viewer']),
  })),
  default_situation_template_id: coreIdSchema.optional(),
  rubrics: z.object({
    memo_template_ids: z.array(coreIdSchema).default([]),
    brief_template_ids: z.array(coreIdSchema).default([]),
    output_branding: z.record(z.string(), z.unknown()).default({}),
  }).default({ memo_template_ids: [], brief_template_ids: [], output_branding: {} }),
  shared_skill_overrides: z.record(z.string(), z.object({
    default_model: z.string().optional(),
    disabled: z.boolean().optional(),
  })).default({}),
});

export const situationFrameSchema = z.object({
  what_is_happening: z.string(),
  why_does_it_matter: z.string(),
  what_would_change_assessment: z.string(),
  policy_question: z.string(),
});

export const localOntologyExtensionsSchema = z.object({
  primitive_subtypes: z.record(z.string(), z.array(z.string())).default({}),
  relations: z.array(z.object({
    name: z.string().min(1),
    source: primitiveSchema,
    target: primitiveSchema,
  })).default([]),
}).default({ primitive_subtypes: {}, relations: [] });

export const situationCoreMetadataSchema = z.object({
  name: z.string().min(1),
  frame: situationFrameSchema,
  goals: z.array(z.string()).default([]),
  geography: z.object({
    regions: z.array(z.string()).default([]),
    iso_codes: z.array(z.string()).default([]),
    bbox: z.array(z.number()).length(4).optional(),
  }).default({ regions: [], iso_codes: [] }),
  case_type: z.string().min(1),
  case_type_secondary: z.string().optional(),
  ontology_id: z.string().min(1),
  ontology_compat: z.array(z.string()).default([]),
  ontology_version: z.string().min(1),
  hypotheses: z.array(z.object({
    id: z.string().min(1),
    text: z.string(),
    status: z.enum(['open', 'supported', 'refuted']),
  })).default([]),
  gaps: z.array(z.object({
    id: z.string().min(1),
    kind: z.enum(['source', 'actor', 'event', 'claim', 'graph']),
    text: z.string(),
    severity: z.number().min(0).max(100),
  })).default([]),
  methodology: z.object({
    parent_methodology_core_id: coreIdSchema.optional(),
    rubric_id: z.string().optional(),
    notes: z.string().default(''),
  }).default({ notes: '' }),
  source_core_id: coreIdSchema.optional(),
  document_core_id: coreIdSchema.optional(),
  graph_core_id: coreIdSchema.optional(),
  output_core_id: coreIdSchema.optional(),
  shared_with_team_id: z.string().optional(),
  local_ontology_extensions: localOntologyExtensionsSchema,
});

export const sourceCoreMetadataSchema = z.object({
  name: z.string().min(1),
  source_receipts_count: z.number().int().nonnegative(),
  credibility_rules: z.object({
    require_two_independent_for: z.array(z.enum(['Claim', 'Verdict'])).default([]),
    blocked_domains: z.array(z.string()).default([]),
    trusted_domains: z.array(z.string()).default([]),
  }).default({ require_two_independent_for: [], blocked_domains: [], trusted_domains: [] }),
  coverage_targets: z.object({
    actors_min: z.number().int().nonnegative().optional(),
    events_min: z.number().int().nonnegative().optional(),
    timeframe: z.object({ from: z.string(), to: z.string() }).optional(),
  }).default({}),
});

export const documentCoreMetadataSchema = z.object({
  name: z.string().min(1),
  document_count: z.number().int().nonnegative(),
  extraction_rules: z.object({
    ocr_threshold: z.number().min(0).max(1),
    language_hints: z.array(z.string()).default([]),
  }),
  entity_filters: z.object({
    include_types: z.array(z.string()).default([]),
    exclude_types: z.array(z.string()).default([]),
  }).default({ include_types: [], exclude_types: [] }),
});

export const graphCoreMetadataSchema = z.object({
  name: z.string().min(1),
  ontology_id: z.string().min(1),
  ontology_version: z.string().min(1),
  embedding_model: z.string().min(1),
  confidence_floor: z.number().min(0).max(1).default(0.45),
  promotion_policy: z.enum(['manual', 'auto-low', 'never-auto']).default('never-auto'),
  layers_enabled: z.array(truthLayerSchema).default(['Source', 'Claim', 'Evidence', 'Verdict']),
});

export const outputCoreMetadataSchema = z.object({
  name: z.string().min(1),
  output_count: z.number().int().nonnegative(),
  template_id: z.string().optional(),
  branding: z.record(z.string(), z.unknown()).optional(),
  default_export_formats: z.array(z.enum(['md', 'docx', 'pdf'])).default(['md', 'docx', 'pdf']),
});

export const coreMetadataSchemas = {
  praxis: praxisCoreMetadataSchema,
  user: userCoreMetadataSchema,
  team: teamCoreMetadataSchema,
  situation: situationCoreMetadataSchema,
  source: sourceCoreMetadataSchema,
  document: documentCoreMetadataSchema,
  graph: graphCoreMetadataSchema,
  output: outputCoreMetadataSchema,
} as const;

export const coreRecordSchema = z.object({
  id: coreIdSchema,
  kind: z.enum(CORE_KINDS),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  owner_uid: z.string().min(1),
  team_id: z.string().nullable().optional(),
  parent_core_id: coreIdSchema.nullable().optional(),
  version: z.number().int().positive(),
  status: z.enum(CORE_STATUSES),
  tags: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()),
  ontology_id: z.string().nullable().optional(),
  ontology_version: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().min(1),
});

export type CoreKind = (typeof CORE_KINDS)[number];
export type CoreRecord = z.infer<typeof coreRecordSchema>;
export type PraxisCoreMetadata = z.infer<typeof praxisCoreMetadataSchema>;
export type UserCoreMetadata = z.infer<typeof userCoreMetadataSchema>;
export type TeamCoreMetadata = z.infer<typeof teamCoreMetadataSchema>;
export type SituationCoreMetadata = z.infer<typeof situationCoreMetadataSchema>;
export type SourceCoreMetadata = z.infer<typeof sourceCoreMetadataSchema>;
export type DocumentCoreMetadata = z.infer<typeof documentCoreMetadataSchema>;
export type GraphCoreMetadata = z.infer<typeof graphCoreMetadataSchema>;
export type OutputCoreMetadata = z.infer<typeof outputCoreMetadataSchema>;
