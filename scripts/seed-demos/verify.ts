import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { V5_DEMO_CASE_MODULES } from '@/lib/cases/v5-demo-contexts';
import { PUBLIC_USER_MODELS } from '@/lib/user-models/seeds';
import { DEMO_USER_MODEL_IDS } from './shared';

const ROOT = process.cwd();
const EXPECTED_CONTEXTS = ['indo-pacific-2026', 'ai-regulation-2026', 'fb-sustainability-2026'];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

assert(V5_DEMO_CASE_MODULES.length === 3, `Expected 3 v5 demo contexts, found ${V5_DEMO_CASE_MODULES.length}`);

for (const contextId of EXPECTED_CONTEXTS) {
  const context = V5_DEMO_CASE_MODULES.find((candidate) => candidate.id === contextId);
  assert(context, `Missing context ${contextId}`);

  const situationEpisodes = context.episodes?.filter((episode) => episode.strand === 'situation') ?? [];
  const workEpisodes = context.episodes?.filter((episode) => episode.strand === 'work') ?? [];
  const cachedResponses = context.cachedResponses ?? [];

  assert(context.sources.length >= 30, `${contextId} needs at least 30 sources`);
  assert(situationEpisodes.length >= 8, `${contextId} needs at least 8 situation episodes`);
  assert(workEpisodes.length >= 3, `${contextId} needs at least 3 work episodes`);
  assert(cachedResponses.length === 3, `${contextId} needs exactly 3 cached responses`);
  assert(context.situation.actorCount >= 30, `${contextId} needs graph actor count >= 30`);
  assert(context.truthLayers.claim.nodeCount >= 80, `${contextId} needs rich claim graph`);

  for (const response of cachedResponses) {
    assert(response.latencyTargetMs <= 200, `${contextId}/${response.questionId} exceeds 200ms target`);
    assert(response.targetPath.startsWith('/'), `${contextId}/${response.questionId} needs app target path`);
  }
}

for (const modelId of DEMO_USER_MODEL_IDS) {
  assert(PUBLIC_USER_MODELS.some((model) => model.modelId === modelId), `Missing demo user model ${modelId}`);
}

assert(
  existsSync(join(ROOT, 'src', 'app', 'demo', '[contextId]', 'page.tsx')),
  'Missing public /demo/[contextId] route',
);

console.log('OK v5 demo contexts: 3 contexts, 90+ sources, 24+ situation episodes, 9+ work episodes, 9 cached answers, 3 public user models');
