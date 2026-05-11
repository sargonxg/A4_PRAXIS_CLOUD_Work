import { V5_DEMO_CASE_MODULES } from '@/lib/cases/v5-demo-contexts';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';

export const DEMO_USER_MODEL_IDS = [
  'foreign-policy-analyst',
  'domestic-policy-analyst',
  'corporate-strategic-analyst',
] as const;

export function getDemoContext(contextId: string) {
  const context = V5_DEMO_CASE_MODULES.find((candidate) => candidate.id === contextId);
  if (!context) {
    throw new Error(`Missing demo context: ${contextId}`);
  }
  return context;
}

export function printContextSeed(contextId: string) {
  const context = getDemoContext(contextId);
  const situationEpisodes = context.episodes?.filter((episode) => episode.strand === 'situation').length ?? 0;
  const workEpisodes = context.episodes?.filter((episode) => episode.strand === 'work').length ?? 0;
  console.log(`demo-context ${context.id}`);
  console.log(`  name: ${context.manifest.name}`);
  console.log(`  sources: ${context.sources.length}`);
  console.log(`  situation_episodes: ${situationEpisodes}`);
  console.log(`  work_episodes: ${workEpisodes}`);
  console.log(`  cached_responses: ${context.cachedResponses?.length ?? 0}`);
}

export function printCachedResponses() {
  for (const context of V5_DEMO_CASE_MODULES) {
    for (const response of context.cachedResponses ?? []) {
      console.log(`${context.id}/${response.questionId} -> ${response.targetPath} (${response.latencyTargetMs}ms)`);
    }
  }
}

export function printDemoUserModels() {
  for (const modelId of DEMO_USER_MODEL_IDS) {
    const model = PUBLIC_USER_MODELS.find((candidate) => candidate.modelId === modelId);
    if (!model) {
      throw new Error(`Missing public user model: ${modelId}`);
    }
    console.log(`${model.modelId}: ${model.identity} (${model.workOntologyId})`);
  }
}
