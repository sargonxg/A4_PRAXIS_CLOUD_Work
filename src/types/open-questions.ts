import { z } from 'zod';

export const OpenQuestionCategorySchema = z.enum([
  'scope-question',
  'evidence-gap',
  'decision-needed',
  'stakeholder-input',
  'other',
]);

export const OpenQuestionStatusSchema = z.enum(['open', 'answered', 'parked', 'dismissed']);

export const OpenQuestionSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  ownerUid: z.string(),
  question: z.string(),
  category: OpenQuestionCategorySchema.default('other'),
  status: OpenQuestionStatusSchema.default('open'),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
  resolvedBy: z.enum(['user', 'memo-block', 'tool-run', 'boardroom-claim']).optional(),
  resolvedRef: z.string().optional(),
  notes: z.string().optional(),
});

export type OpenQuestionCategory = z.infer<typeof OpenQuestionCategorySchema>;
export type OpenQuestionStatus = z.infer<typeof OpenQuestionStatusSchema>;
export type OpenQuestion = z.infer<typeof OpenQuestionSchema>;
