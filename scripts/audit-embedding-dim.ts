import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures: string[] = [];

type TaskKind = {
  provider?: string;
  model?: string;
  dimensions?: number;
};

const matrixPath = path.join(root, 'src/lib/ai/MODEL_MATRIX.json');
const matrix = JSON.parse(readFileSync(matrixPath, 'utf8')) as { taskKinds?: Record<string, TaskKind> };

for (const key of ['embeddings_text', 'embeddings_long']) {
  const task = matrix.taskKinds?.[key];
  if (!task) {
    failures.push(`MODEL_MATRIX.json missing taskKind ${key}`);
    continue;
  }
  if (task.provider !== 'vertex') failures.push(`${key} provider must be vertex`);
  if (task.model !== 'text-embedding-005') failures.push(`${key} model must be text-embedding-005`);
  if (task.dimensions !== 768) failures.push(`${key} dimensions must be 768`);
}

const backendProviders = readFileSync(path.join(root, 'backend/ai/providers.py'), 'utf8');
for (const marker of [
  'COGNEE_LLM_PROVIDER = "vertex_ai"',
  'COGNEE_LLM_API_KEY = "vertex-adc"',
  'COGNEE_EMBEDDING_MODEL = "vertex_ai/text-embedding-005"',
  'COGNEE_EMBEDDING_DIMENSIONS = 768',
]) {
  if (!backendProviders.includes(marker)) failures.push(`backend/ai/providers.py missing marker: ${marker}`);
}

const cogneeMemory = readFileSync(path.join(root, 'backend/services/cognee_memory.py'), 'utf8');
for (const marker of [
  'settings.cognee_llm_provider != "vertex_ai"',
  'settings.cognee_llm_api_key != "vertex-adc"',
  'settings.cognee_embedding_dimensions != 768',
]) {
  if (!cogneeMemory.includes(marker)) failures.push(`backend/services/cognee_memory.py missing runtime guard: ${marker}`);
}

if (failures.length > 0) {
  console.error('[audit:embedding-dim] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:embedding-dim] ok');
