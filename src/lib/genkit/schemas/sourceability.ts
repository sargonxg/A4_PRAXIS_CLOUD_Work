import { z } from 'genkit';

export const GenkitSourceabilityStatusSchema = z.enum([
  'supported',
  'weak',
  'unsupported',
  'needs_date_check',
]);

export const GenkitSourceSnippetSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().min(1).max(300),
  url: z.string().max(1000).optional(),
  date: z.string().max(80).optional(),
  span: z.string().min(1).max(4000),
});

export const GenkitSourceabilityInputSchema = z.object({
  claimText: z.string().min(3).max(4000),
  memoParagraph: z.string().max(6000).optional(),
  sourceSnippets: z.array(GenkitSourceSnippetSchema).max(20).default([]),
  capsuleId: z.string().max(160).optional(),
  situationId: z.string().max(160).optional(),
  memoId: z.string().max(180).optional(),
  paragraphId: z.string().max(180).optional(),
  outputTarget: z.string().max(120).optional(),
});

export const GenkitSourceabilityOutputSchema = z.object({
  status: GenkitSourceabilityStatusSchema,
  explanation: z.string().min(1).max(1200),
  supportingSourceIds: z.array(z.string().min(1).max(160)).max(10),
  missingEvidence: z.array(z.string().min(1).max(240)).max(8),
  suggestedRewrite: z.string().min(1).max(1200),
  citationWarnings: z.array(z.string().min(1).max(240)).max(8),
});

export type GenkitSourceabilityInput = z.infer<typeof GenkitSourceabilityInputSchema>;
export type GenkitSourceabilityOutput = z.infer<typeof GenkitSourceabilityOutputSchema>;
