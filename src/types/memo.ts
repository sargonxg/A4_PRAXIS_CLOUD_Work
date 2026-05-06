import { z } from 'zod';

export const MemoTemplateIdSchema = z.enum([
  'mandate-brief',
  'mediation-summary',
  'policy-memo',
  'sit-rep',
  'frame-analysis',
  'talking-points',
]);

export const MemoStatusSchema = z.enum(['draft', 'review', 'final', 'archived']);

export const MemoCitationSchema = z.object({
  nodeIds: z.array(z.string()).default([]),
  sourceReceiptIds: z.array(z.string()).default([]),
  surface: z.enum(['inline', 'footnote']).default('footnote'),
});

export const MemoBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['heading', 'paragraph', 'bullets', 'quote', 'callout', 'graph-snippet', 'table', 'divider']),
  title: z.string().optional(),
  content: z.string().default(''),
  items: z.array(z.string()).optional(),
  citations: z.array(MemoCitationSchema).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const MemoSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  ownerUid: z.string(),
  templateId: MemoTemplateIdSchema,
  title: z.string(),
  status: MemoStatusSchema.default('draft'),
  currentVersionId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MemoVersionSchema = z.object({
  id: z.string(),
  memoId: z.string(),
  versionNumber: z.number().int().positive(),
  authorUid: z.string(),
  createdAt: z.string(),
  graphSnapshotId: z.string(),
  blocks: z.array(MemoBlockSchema),
  changeNote: z.string().optional(),
});

export type MemoTemplateId = z.infer<typeof MemoTemplateIdSchema>;
export type MemoStatus = z.infer<typeof MemoStatusSchema>;
export type MemoCitation = z.infer<typeof MemoCitationSchema>;
export type MemoBlock = z.infer<typeof MemoBlockSchema>;
export type Memo = z.infer<typeof MemoSchema>;
export type MemoVersion = z.infer<typeof MemoVersionSchema>;

export interface MemoTemplate {
  id: MemoTemplateId;
  label: string;
  description: string;
  recommendedFor: Array<{ persona: string; ontologyId?: string }>;
  sectionStructure: Array<{
    id: string;
    title: string;
    description: string;
    required: boolean;
  }>;
}
