import { z } from 'zod';

// ============================================================================
// Media Source Schema
// ============================================================================

export const MediaSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    'state_funded',
    'private',
    'public_broadcaster',
    'wire_service',
    'independent',
    'social_media',
  ]),
  country: z.string(),
  /** Political orientation on a -1 (left) to 1 (right) spectrum */
  politicalOrientation: z.number().min(-1).max(1),
  /** Reliability score from 0 (unreliable) to 1 (highly reliable) */
  reliability: z.number().min(0).max(1),
  /** Editorial independence from 0 (no independence) to 1 (fully independent) */
  editorialIndependence: z.number().min(0).max(1),
  description: z.string(),
  knownBiases: z.array(z.string()),
  coverageStrengths: z.array(z.string()),
  languages: z.array(z.string()),
});

// ============================================================================
// Media Analysis Schemas
// ============================================================================

export const MediaCoverageAnalysisSchema = z.object({
  sourceId: z.string(),
  sourceName: z.string(),
  headline: z.string(),
  summary: z.string(),
  tone: z.enum(['positive', 'negative', 'neutral', 'mixed']),
  framing: z.string(),
  keyActorsMentioned: z.array(z.string()),
  narrativesIdentified: z.array(z.string()),
  omissions: z.array(z.string()).optional(),
  factualAccuracy: z.number().min(0).max(1).optional(),
  emotionalLanguageScore: z.number().min(0).max(1).optional(),
});

export const MediaComparisonSchema = z.object({
  topic: z.string(),
  sources: z.array(MediaCoverageAnalysisSchema),
  convergencePoints: z.array(z.string()),
  divergencePoints: z.array(z.string()),
  notableOmissions: z.array(z.string()),
  overallAssessment: z.string(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type MediaSource = z.infer<typeof MediaSourceSchema>;
export type MediaCoverageAnalysis = z.infer<typeof MediaCoverageAnalysisSchema>;
export type MediaComparison = z.infer<typeof MediaComparisonSchema>;
