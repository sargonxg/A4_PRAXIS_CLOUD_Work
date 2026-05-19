import { z } from 'genkit';

export const CapsuleFactoryCoreKindSchema = z.enum([
  'user',
  'situation',
  'source',
  'document',
  'graph',
  'time',
  'tool',
  'objective',
  'product',
  'output',
  'memory',
  'handover',
]);
export const CapsuleFactoryLaneIdSchema = z.enum(['dialectica', 'kairos', 'agon']);
export const CapsuleFactoryReviewStateSchema = z.enum(['draft', 'reviewed', 'applied', 'rejected']);
export const CapsuleFactoryProposalSourceSchema = z.enum(['firestore', 'cognee', 'future_graphiti']);
export const CapsuleFactoryApplyTargetSchema = z.enum([
  'user_core',
  'situation_core',
  'source_core',
  'document_core',
  'graph_core',
  'time_core',
  'tool_core',
  'objective_core',
  'product_core',
  'output_core',
  'memory_core',
  'handover_core',
  'context_capsule',
]);
export const CapsuleFactoryGraphModeSchema = z.enum(['none', 'embedded_proposal', 'approved_postgres_kg']);
export const CapsuleFactoryCogneeModeSchema = z.enum(['disabled', 'recall_only', 'write_candidates']);
export const CapsuleFactoryEcosystemContributorSchema = z.enum(['dialectica', 'kairos', 'agon']);

export const CapsuleFactorySourceSnippetSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().min(1).max(300),
  url: z.string().max(1000).optional(),
  date: z.string().max(80).optional(),
  span: z.string().min(1).max(4000),
  source: CapsuleFactoryProposalSourceSchema.default('firestore'),
});

export const CapsuleFactoryDocumentSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().min(1).max(300),
  text: z.string().min(1).max(8000),
});

export const CapsuleFactoryDraftCoreSchema = z.object({
  kind: CapsuleFactoryCoreKindSchema,
  label: z.string().min(1).max(160),
  summary: z.string().min(1).max(1200),
  provenanceIds: z.array(z.string().min(1).max(160)).max(20).default([]),
  confidence: z.enum(['low', 'medium', 'high']).default('medium'),
  source: CapsuleFactoryProposalSourceSchema.default('firestore'),
});

export const CapsuleIntakeInputSchema = z.object({
  objective: z.string().min(1).max(2000),
  prompt: z.string().max(6000).optional(),
  documents: z.array(CapsuleFactoryDocumentSchema).max(10).default([]),
  sourceSnippets: z.array(CapsuleFactorySourceSnippetSchema).max(20).default([]),
  activeCapsuleId: z.string().max(160).optional(),
});

export const CapsuleIntakeOutputSchema = z.object({
  draftCores: z.array(CapsuleFactoryDraftCoreSchema).min(1).max(12),
  sourceGaps: z.array(z.string().min(1).max(240)).max(12),
  suggestedTools: z.array(z.string().min(1).max(120)).max(10),
  applyMode: z.literal('draft_review'),
  warnings: z.array(z.string().min(1).max(240)).max(10),
});

export const CapsuleResearchPlanInputSchema = z.object({
  objective: z.string().min(1).max(2000),
  currentCores: z.array(CapsuleFactoryDraftCoreSchema.pick({
    kind: true,
    label: true,
    summary: true,
  })).max(12).default([]),
  sourceSnippets: z.array(CapsuleFactorySourceSnippetSchema).max(20).default([]),
});

export const CapsuleResearchPlanOutputSchema = z.object({
  sourceGaps: z.array(z.string().min(1).max(240)).max(12),
  searchQueries: z.array(z.string().min(1).max(240)).max(8),
  readOnlyTools: z.array(z.object({
    toolId: z.string().min(1).max(120),
    reason: z.string().min(1).max(240),
    approvalPosture: z.literal('receipt_only'),
  })).max(8),
  corpusReads: z.array(z.string().min(1).max(160)).max(12),
  freshnessNeeds: z.array(z.string().min(1).max(240)).max(8),
});

export const CapsuleSynthesisInputSchema = z.object({
  objective: z.string().min(1).max(2000),
  draftCores: z.array(CapsuleFactoryDraftCoreSchema).min(1).max(12),
  researchPlan: CapsuleResearchPlanOutputSchema,
  sourceSnippets: z.array(CapsuleFactorySourceSnippetSchema).max(20).default([]),
});

export const ContextCapsuleDraftSchema = z.object({
  label: z.string().min(1).max(160),
  summary: z.string().min(1).max(1200),
  coreIds: z.array(z.string().min(1).max(160)).max(20),
  provenance: z.object({
    sourceIds: z.array(z.string().min(1).max(160)).max(20),
    documentIds: z.array(z.string().min(1).max(160)).max(20),
  }),
  assumptions: z.array(z.string().min(1).max(240)).max(10),
  status: z.literal('draft'),
});

export const CapsuleFactoryLaneImprovementSchema = z.object({
  laneId: CapsuleFactoryLaneIdSchema,
  title: z.string().min(1).max(160),
  summary: z.string().min(1).max(1200),
  proposedTags: z.array(z.string().min(1).max(80)).max(12).default([]),
  evidenceIds: z.array(z.string().min(1).max(160)).max(20).default([]),
  requiresConfirmation: z.literal(true),
});

export const CapsuleFactoryReceiptsSchema = z.object({
  selectedOntologyStack: z.array(z.string().min(1).max(120)).max(12).default([]),
  sourceCount: z.number().int().nonnegative().default(0),
  graphCandidateCount: z.number().int().nonnegative().default(0),
  graphMode: CapsuleFactoryGraphModeSchema.default('embedded_proposal'),
  cogneeMode: CapsuleFactoryCogneeModeSchema.default('disabled'),
  ecosystemContributors: z.array(CapsuleFactoryEcosystemContributorSchema).max(3).default([]),
  approvalState: CapsuleFactoryReviewStateSchema.default('draft'),
});

export const CapsuleFactoryRunMetadataSchema = z.object({
  factoryLane: z.enum(['catalog', 'repository', 'ontology', 'graph', 'sources', 'temporality', 'conflict', 'output', 'runs']).optional(),
  ontologyStack: z.array(z.string().min(1).max(120)).max(12).default([]),
  graphMode: CapsuleFactoryGraphModeSchema.default('embedded_proposal'),
  cogneeMode: CapsuleFactoryCogneeModeSchema.default('disabled'),
  sourceReceiptIds: z.array(z.string().min(1).max(160)).max(30).default([]),
  embeddedGraphArtifactId: z.string().min(1).max(160).nullable().default(null),
  ecosystemContributors: z.array(CapsuleFactoryEcosystemContributorSchema).max(3).default([]),
});

export const CapsuleSynthesisOutputSchema = z.object({
  contextCapsuleDraft: ContextCapsuleDraftSchema,
  proposedCores: z.array(CapsuleFactoryDraftCoreSchema).max(12),
  openQuestions: z.array(z.string().min(1).max(240)).max(12),
  suggestedTools: z.array(z.string().min(1).max(120)).max(10),
  applyActions: z.array(z.object({
    label: z.string().min(1).max(120),
    target: CapsuleFactoryApplyTargetSchema,
    requiresConfirmation: z.literal(true),
  })).max(10),
  laneImprovements: z.array(CapsuleFactoryLaneImprovementSchema).max(8).default([]),
  factoryReceipts: CapsuleFactoryReceiptsSchema.optional(),
});

export const CapsuleFactoryReviewDiffSchema = z.object({
  diffId: z.string().min(1).max(160),
  capsuleId: z.string().min(1).max(160),
  reviewState: CapsuleFactoryReviewStateSchema,
  proposedCapsule: ContextCapsuleDraftSchema,
  proposedCores: z.array(CapsuleFactoryDraftCoreSchema).max(12).default([]),
  sourceGaps: z.array(z.string().min(1).max(240)).max(12).default([]),
  openQuestions: z.array(z.string().min(1).max(240)).max(12).default([]),
  laneImprovements: z.array(CapsuleFactoryLaneImprovementSchema).max(8).default([]),
  applyActions: z.array(z.object({
    label: z.string().min(1).max(120),
    target: CapsuleFactoryApplyTargetSchema,
    requiresConfirmation: z.literal(true),
  })).max(10).default([]),
  provenanceIds: z.array(z.string().min(1).max(160)).max(30).default([]),
  factoryReceipts: CapsuleFactoryReceiptsSchema.optional(),
  confirmation: z.object({
    required: z.literal(true),
    confirmedAt: z.string().datetime().nullable().default(null),
    confirmedBy: z.string().max(160).nullable().default(null),
  }),
});

export const CapsuleWritingProfileInputSchema = z.object({
  objective: z.string().min(1).max(2000),
  audience: z.string().max(240).optional(),
  outputGoal: z.string().max(240).optional(),
  contextCapsuleDraft: ContextCapsuleDraftSchema,
});

export const CapsuleWritingProfileOutputSchema = z.object({
  defaultFormat: z.enum(['memo', 'brief', 'talking_points', 'handover']),
  tone: z.string().min(1).max(240),
  audience: z.string().min(1).max(240),
  citationPosture: z.string().min(1).max(320),
  exportGates: z.array(z.string().min(1).max(240)).max(8),
});

export type CapsuleIntakeInput = z.infer<typeof CapsuleIntakeInputSchema>;
export type CapsuleIntakeOutput = z.infer<typeof CapsuleIntakeOutputSchema>;
export type CapsuleFactoryLaneId = z.infer<typeof CapsuleFactoryLaneIdSchema>;
export type CapsuleFactoryLaneImprovement = z.infer<typeof CapsuleFactoryLaneImprovementSchema>;
export type CapsuleFactoryReviewState = z.infer<typeof CapsuleFactoryReviewStateSchema>;
export type CapsuleFactoryReviewDiff = z.infer<typeof CapsuleFactoryReviewDiffSchema>;
export type CapsuleFactoryRunMetadata = z.infer<typeof CapsuleFactoryRunMetadataSchema>;
export type CapsuleResearchPlanInput = z.infer<typeof CapsuleResearchPlanInputSchema>;
export type CapsuleResearchPlanOutput = z.infer<typeof CapsuleResearchPlanOutputSchema>;
export type CapsuleSynthesisInput = z.infer<typeof CapsuleSynthesisInputSchema>;
export type CapsuleSynthesisOutput = z.infer<typeof CapsuleSynthesisOutputSchema>;
export type CapsuleWritingProfileInput = z.infer<typeof CapsuleWritingProfileInputSchema>;
export type CapsuleWritingProfileOutput = z.infer<typeof CapsuleWritingProfileOutputSchema>;
