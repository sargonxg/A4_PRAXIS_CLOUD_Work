import { z } from 'zod';

export const SATCategorySchema = z.enum(['ach', 'kac', 'red_team', 'premortem']);
export const ACHStatusSchema = z.enum(['draft', 'in_progress', 'concluded', 'archived']);
export const ACHScoreRatingSchema = z.enum(['consistent', 'inconsistent', 'irrelevant', 'unknown']);
export const ACHConclusionSchema = z.enum(['most_likely', 'plausible', 'unlikely', 'rejected']);

export const ACHHypothesisSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  proposedBy: z.enum(['user', 'subagent']),
  notes: z.string().optional(),
});

export const ACHEvidenceSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  sourceKind: z.enum(['graph_node', 'free_text', 'document']),
  sourceRef: z.string().optional(),
  weight: z.number().min(0).max(1),
  diagnosticity: z.number().min(0).max(1).optional(),
});

export const ACHScoreSchema = z.object({
  hypothesisId: z.string(),
  evidenceId: z.string(),
  rating: ACHScoreRatingSchema,
  note: z.string().optional(),
});

export const ACHRankingSchema = z.object({
  hypothesisId: z.string(),
  inconsistencyCount: z.number().int().nonnegative(),
  weightedInconsistency: z.number().min(0),
  rank: z.number().int().positive(),
  conclusion: ACHConclusionSchema,
});

export const ACHMatrixSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  ownerUid: z.string(),
  title: z.string(),
  status: ACHStatusSchema,
  hypotheses: z.array(ACHHypothesisSchema),
  evidence: z.array(ACHEvidenceSchema),
  scores: z.array(ACHScoreSchema),
  ranking: z.array(ACHRankingSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const KACAssumptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  status: z.enum(['stated', 'unstated']),
  supportLevel: z.enum(['well_supported', 'questionable', 'unsupported', 'unrated']),
  evidence: z.array(z.string()).optional(),
  userVerdict: z.enum(['accept', 'flag', 'reject']).optional(),
});

export const KACReportSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  ownerUid: z.string(),
  scopeRef: z.object({
    kind: z.enum(['memo', 'analysis_text']),
    ref: z.string(),
  }),
  assumptions: z.array(KACAssumptionSchema),
  generatedAt: z.string(),
  subagentRunId: z.string(),
  synthesized: z.literal(true).default(true),
  confidence: z.number().max(0.6).default(0.6),
});

export const RedTeamReportSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  ownerUid: z.string(),
  targetActorId: z.string(),
  framingNote: z.string(),
  analysis: z.object({
    interests: z.array(z.string()),
    constraints: z.array(z.string()),
    likelyMoves: z.array(z.object({
      move: z.string(),
      rationale: z.string(),
      probability: z.enum(['high', 'medium', 'low']),
    })),
    viewOfOtherActors: z.array(z.object({
      actorId: z.string(),
      view: z.string(),
    })),
  }),
  generatedAt: z.string(),
  subagentRunId: z.string(),
  synthesized: z.literal(true).default(true),
  confidence: z.number().max(0.6).default(0.6),
});

export const PremortemPathwaySchema = z.object({
  id: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'catastrophic']),
  likelihood: z.enum(['low', 'medium', 'high']),
  triggeringConditions: z.array(z.string()),
  mitigations: z.array(z.string()),
});

export const PremortemReportSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  ownerUid: z.string(),
  scopeRef: z.object({
    kind: z.enum(['memo_recommendation', 'free_text']),
    ref: z.string(),
  }),
  failurePathways: z.array(PremortemPathwaySchema),
  generatedAt: z.string(),
  subagentRunId: z.string(),
  synthesized: z.literal(true).default(true),
  confidence: z.number().max(0.6).default(0.6),
});

export type SATCategory = z.infer<typeof SATCategorySchema>;
export type ACHStatus = z.infer<typeof ACHStatusSchema>;
export type ACHScoreRating = z.infer<typeof ACHScoreRatingSchema>;
export type ACHConclusion = z.infer<typeof ACHConclusionSchema>;
export type ACHHypothesis = z.infer<typeof ACHHypothesisSchema>;
export type ACHEvidence = z.infer<typeof ACHEvidenceSchema>;
export type ACHScore = z.infer<typeof ACHScoreSchema>;
export type ACHRanking = z.infer<typeof ACHRankingSchema>;
export type ACHMatrix = z.infer<typeof ACHMatrixSchema>;
export type KACAssumption = z.infer<typeof KACAssumptionSchema>;
export type KACReport = z.infer<typeof KACReportSchema>;
export type RedTeamReport = z.infer<typeof RedTeamReportSchema>;
export type PremortemPathway = z.infer<typeof PremortemPathwaySchema>;
export type PremortemReport = z.infer<typeof PremortemReportSchema>;
