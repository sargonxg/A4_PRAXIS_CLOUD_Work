import { z } from 'genkit';
import { PATH_IDS } from '@/lib/path/types';

export const GenkitClassifyPathInputSchema = z.object({
  domainId: z.string().optional(),
  seedText: z.string(),
  pathCatalogue: z.string(),
});

export const GenkitClassifyPathOutputSchema = z.object({
  pathId: z.enum(PATH_IDS),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  alternates: z.array(z.object({
    id: z.enum(PATH_IDS),
    confidence: z.number().min(0).max(1),
  })),
});

export type GenkitClassifyPathOutput = z.infer<typeof GenkitClassifyPathOutputSchema>;
