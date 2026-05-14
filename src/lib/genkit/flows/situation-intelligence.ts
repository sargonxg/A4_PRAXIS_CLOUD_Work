import { z } from 'genkit';
import { ai, gemini25Pro } from '@/lib/genkit';
import { validateSituationIntelligence } from '@/lib/ai/schemas/situation-intelligence';
import { GenkitSituationIntelligenceSchema } from '@/lib/genkit/schemas/situation-intelligence';

export const SituationIntelligenceFlowInputSchema = z.object({
  systemPromptBlock: z.string(),
  toolContext: z.string(),
  webContext: z.string(),
  crossToolContext: z.string(),
  sourceBlock: z.string(),
});

export type SituationIntelligenceFlowInput = z.infer<typeof SituationIntelligenceFlowInputSchema>;

export const situationIntelligenceFlow = ai.defineFlow(
  {
    name: 'situationIntelligence',
    inputSchema: SituationIntelligenceFlowInputSchema,
    outputSchema: GenkitSituationIntelligenceSchema,
  },
  async (input) => {
    const prompt = ai.prompt<
      typeof SituationIntelligenceFlowInputSchema,
      typeof GenkitSituationIntelligenceSchema
    >('situation-intelligence');
    const { output } = await prompt(input, {
      model: gemini25Pro,
      config: { temperature: 0.4 },
    });
    return validateSituationIntelligence(output);
  },
);
