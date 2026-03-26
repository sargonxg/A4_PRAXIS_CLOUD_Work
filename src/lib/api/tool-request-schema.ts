import { z } from 'zod';

/**
 * Shared request schema for all tool API routes.
 * Provides consistent situation context to every AI tool.
 */
export const SituationPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  region: z.string().optional(),
  description: z.string().optional(),
  actors: z.array(z.string()).optional(),
  userRole: z.string().optional(),
  status: z.string().optional(),
  riskScore: z.number().optional(),
  glaslStage: z.number().nullable().optional(),
  escalationTrend: z.string().optional(),
  sourceUrls: z.array(z.string()).optional(),
  contextNotes: z.string().optional(),
});

export const BaseToolRequestSchema = z.object({
  situationId: z.string(),
  situation: SituationPayloadSchema,
  sourceMode: z.enum(['all', 'web-and-docs', 'docs-only', 'llm-only']).optional(),
});

export type SituationPayload = z.infer<typeof SituationPayloadSchema>;
export type BaseToolRequest = z.infer<typeof BaseToolRequestSchema>;
