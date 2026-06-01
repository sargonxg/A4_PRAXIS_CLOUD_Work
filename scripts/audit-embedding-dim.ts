import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'src/lib/knowledge/embedding-config.ts');
const vectorLayerPath = path.join(root, 'src/lib/knowledge/vector-layer.ts');
const providerPath = path.join(root, 'src/lib/ai/providers.ts');

for (const file of [configPath, vectorLayerPath]) {
  if (!existsSync(file)) {
    throw new Error(`audit:embedding-dim missing path: ${path.relative(root, file)}`);
  }
}

const config = readFileSync(configPath, 'utf8');
const vectorLayer = readFileSync(vectorLayerPath, 'utf8');

const requiredConfigMarkers = [
  "export const EMBEDDING_MODEL = 'text-embedding-005' as const;",
  'export const EMBEDDING_DIMENSION = 768 as const;',
];
const missingConfigMarkers = requiredConfigMarkers.filter((marker) => !config.includes(marker));
if (missingConfigMarkers.length) {
  throw new Error(`audit:embedding-dim missing config markers: ${missingConfigMarkers.join(', ')}`);
}

const requiredVectorMarkers = [
  'embeddingDimension: EMBEDDING_DIMENSION',
  'embeddingModel: EMBEDDING_MODEL',
  'embedding.length !== EMBEDDING_DIMENSION',
  'findCrossCapsuleSimilarities',
];
const missingVectorMarkers = requiredVectorMarkers.filter((marker) => !vectorLayer.includes(marker));
if (missingVectorMarkers.length) {
  throw new Error(`audit:embedding-dim missing vector-layer markers: ${missingVectorMarkers.join(', ')}`);
}

const disallowedModelStringHits = listFiles(path.join(root, 'src'))
  .filter((file) => file !== configPath && file !== providerPath)
  .filter((file) => /\.(ts|tsx|js|jsx|mjs)$/.test(file))
  .filter((file) => readFileSync(file, 'utf8').includes('text-embedding-005'));
if (disallowedModelStringHits.length) {
  throw new Error(`audit:embedding-dim found direct embedding model string outside embedding-config: ${disallowedModelStringHits.map((file) => path.relative(root, file)).join(', ')}`);
}

console.log('audit:embedding-dim OK');

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const file = path.join(dir, entry);
    const stat = statSync(file);
    return stat.isDirectory() ? listFiles(file) : [file];
  });
}
