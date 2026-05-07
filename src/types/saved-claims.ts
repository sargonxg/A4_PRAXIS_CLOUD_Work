import { z } from 'zod';

export const SavedClaimSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  ownerUid: z.string(),
  text: z.string(),
  title: z.string(),
  sourceRef: z.string().optional(),
  trustScore: z.number().min(0).max(100),
  status: z.enum(['saved', 'promoted', 'dismissed']).default('saved'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SavedClaim = z.infer<typeof SavedClaimSchema>;

