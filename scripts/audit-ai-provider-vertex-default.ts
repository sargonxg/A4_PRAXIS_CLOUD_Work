import { readFileSync } from 'node:fs';
import path from 'node:path';
import { AI_PLATFORM_POSTURE, MODEL_MATRIX, getModelMatrixEntry } from '../src/lib/ai/model-matrix';

const root = process.cwd();
const providerSource = readFileSync(path.join(root, 'src/lib/ai/providers.ts'), 'utf8');

const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
const configuredProvider = (process.env.AI_PROVIDER ?? '').toLowerCase();

const failures: string[] = [];

if (isProduction && configuredProvider && configuredProvider !== 'vertex') {
  failures.push(`production AI_PROVIDER must be unset or vertex, got ${configuredProvider}`);
}

if (AI_PLATFORM_POSTURE.developerModelRuntime !== 'vertex-ai') {
  failures.push('MODEL_MATRIX platform.developerModelRuntime must be vertex-ai');
}

if (AI_PLATFORM_POSTURE.enterpriseAgentPlatform !== 'gemini-enterprise') {
  failures.push('MODEL_MATRIX platform.enterpriseAgentPlatform must be gemini-enterprise');
}

for (const [taskKind, entry] of Object.entries(MODEL_MATRIX.taskKinds)) {
  if (entry.provider !== 'vertex') {
    failures.push(`${taskKind} provider must be vertex`);
  }
}

if (getModelMatrixEntry('embeddings_text').model !== 'text-embedding-005') {
  failures.push('embeddings_text must use text-embedding-005');
}

if (!providerSource.includes('isVertexProviderActive')) {
  failures.push('providers.ts must expose isVertexProviderActive');
}

if (!providerSource.includes('getEmbeddingModel')) {
  failures.push('providers.ts must expose getEmbeddingModel');
}

if (failures.length > 0) {
  console.error('[audit:ai-provider-vertex-default] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:ai-provider-vertex-default] ok');
