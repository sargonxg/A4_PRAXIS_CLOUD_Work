import { z } from 'zod';

// ============================================================================
// Report Section Schema
// ============================================================================

export const ReportSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  status: z.enum(['empty', 'generating', 'draft', 'reviewed', 'final']),
  generatedBy: z.enum(['ai', 'human', 'mixed']).optional(),
  sources: z
    .array(
      z.object({
        type: z.enum(['document', 'web', 'graph']),
        title: z.string(),
        reference: z.string(),
      })
    )
    .optional(),
  wordCount: z.number().optional(),
});

// ============================================================================
// Report Schema
// ============================================================================

export const ReportSchema = z.object({
  id: z.string(),
  title: z.string(),
  template: z.string(),
  status: z.enum(['draft', 'review', 'final', 'archived']),
  sections: z.array(ReportSectionSchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type ReportSection = z.infer<typeof ReportSectionSchema>;
export type Report = z.infer<typeof ReportSchema>;
