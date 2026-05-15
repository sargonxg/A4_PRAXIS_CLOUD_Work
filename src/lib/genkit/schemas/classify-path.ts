import { z } from 'genkit';
import type { PolicyPathId } from '@/lib/product/context-capsules';

export const GenkitClassifyPathInputSchema = z.object({
  domainId: z.string().optional(),
  seedText: z.string(),
  pathCatalogue: z.string(),
});

const SuggestedUserCoreSchema = z.object({
  role: z.string(),
  audience: z.string(),
  workingStyle: z.string(),
  evidencePosture: z.string(),
});

const SuggestedSituationCoreSchema = z.object({
  problemFrame: z.string(),
  actors: z.array(z.string()),
  geography: z.string().nullable(),
  decisionContext: z.string(),
  timeHorizon: z.string(),
});

export const GenkitClassifyPathOutputSchema = z.object({
  policyPathId: z.string(),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  suggestedUserCore: SuggestedUserCoreSchema,
  suggestedSituationCore: SuggestedSituationCoreSchema,
  suggestedTools: z.array(z.string()),
  suggestedOutputs: z.array(z.string()),
  missingInformationQuestions: z.array(z.string()),
  alternates: z.array(z.object({
    id: z.string(),
    confidence: z.number().min(0).max(1),
  })),
});

export type GenkitClassifyPathOutput = z.infer<typeof GenkitClassifyPathOutputSchema> & {
  policyPathId: PolicyPathId;
};
