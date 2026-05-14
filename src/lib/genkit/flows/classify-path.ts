import { z } from 'genkit';
import { ai, gemini25Flash } from '@/lib/genkit';
import { PATH_IDS, isPathId, type PathId } from '@/lib/path/types';
import { PATH_SEEDS } from '@/lib/path/seeds';
import { classifyPath } from '@/lib/domain/classifier';
import {
  GenkitClassifyPathInputSchema,
  GenkitClassifyPathOutputSchema,
} from '@/lib/genkit/schemas/classify-path';

export const ClassifyPathFlowInputSchema = z.object({
  domainId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  sourceUrls: z.array(z.string()).default([]),
});

export const ClassifyPathFlowOutputSchema = z.object({
  pathId: z.enum(PATH_IDS).nullable(),
  confidence: z.number().min(0).max(1),
  rationale: z.string(),
  alternates: z.array(z.object({
    id: z.enum(PATH_IDS),
    confidence: z.number().min(0).max(1),
  })),
});

export type ClassifyPathFlowInput = z.infer<typeof ClassifyPathFlowInputSchema>;
export type ClassifyPathFlowOutput = z.infer<typeof ClassifyPathFlowOutputSchema>;

export const classifyPathFlow = ai.defineFlow(
  {
    name: 'classifyPath',
    inputSchema: ClassifyPathFlowInputSchema,
    outputSchema: ClassifyPathFlowOutputSchema,
  },
  async (input) => {
    const seedText = [
      input.name,
      input.description,
      ...(input.sourceUrls ?? []),
    ].filter(Boolean).join('\n');

    if (!seedText.trim()) {
      return {
        pathId: null,
        confidence: 0,
        rationale: 'No seed text was provided.',
        alternates: [],
      };
    }

    try {
      const prompt = ai.prompt<
        typeof GenkitClassifyPathInputSchema,
        typeof GenkitClassifyPathOutputSchema
      >('classify-path');
      const { output } = await prompt({
        domainId: input.domainId,
        seedText,
        pathCatalogue: buildPathCatalogue(),
      }, {
        model: gemini25Flash,
        config: { temperature: 0 },
      });
      const parsed = GenkitClassifyPathOutputSchema.parse(output);
      return normalizeOutput(parsed);
    } catch (err) {
      console.warn('[genkit/classify-path] falling back to deterministic classifier:', err);
      const fallback = classifyPath({
        name: input.name ?? '',
        description: input.description ?? '',
        sourceUrls: input.sourceUrls,
        domainId: input.domainId,
        domainConfidence: 0.72,
      });
      return {
        pathId: fallback.pathId,
        confidence: fallback.confidence,
        rationale: fallback.rationale,
        alternates: fallback.alternatives.map((alt) => ({
          id: alt.pathId,
          confidence: alt.confidence,
        })),
      };
    }
  },
);

function buildPathCatalogue(): string {
  return PATH_IDS.map((id) => {
    const seed = PATH_SEEDS[id];
    return [
      `id=${id}`,
      `name=${seed.name}`,
      `domain=${seed.domainId}`,
      `description=${seed.description}`,
      `tools=${seed.toolBundle.join(', ')}`,
      `lenses=${seed.lensTop3.join(', ')}`,
      `frameworks=${seed.frameworkPath.join(' -> ')}`,
      `audience=${seed.audienceDefault}`,
      `horizon=${seed.timeHorizonDefault}`,
    ].join(' | ');
  }).join('\n');
}

function normalizeOutput(output: {
  pathId: string;
  confidence: number;
  rationale: string;
  alternates: Array<{ id: string; confidence: number }>;
}): ClassifyPathFlowOutput {
  const pathId = isPathId(output.pathId) ? output.pathId : null;
  const alternates = output.alternates
    .filter((alt): alt is { id: PathId; confidence: number } => isPathId(alt.id) && alt.id !== pathId)
    .slice(0, 3)
    .map((alt) => ({ id: alt.id, confidence: clamp01(alt.confidence) }));

  return {
    pathId,
    confidence: pathId ? clamp01(output.confidence) : 0,
    rationale: output.rationale.slice(0, 400),
    alternates,
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
