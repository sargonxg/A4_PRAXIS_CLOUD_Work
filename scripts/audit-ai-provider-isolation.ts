import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { getAskPraxisRuntimeModelIds } from '../src/lib/ai/model-runtime-policy';

const root = process.cwd();
const allowedFiles = new Set([
  'src/lib/ai/MODEL_MATRIX.json',
  'src/lib/ai/providers.ts',
  'src/lib/ai/model-runtime-policy.ts',
  'src/lib/ai/model-preferences.ts',
  'src/lib/ai/ask-runtime-catalog.ts',
  'backend/ai/providers.py',
]);
const skippedDirs = new Set(['.git', '.next', 'node_modules', 'graphify-out', 'coverage']);
const searchedExt = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.py']);
const runtimePrefixes = [
  'src/app/api/',
  'src/lib/ai/',
  'src/lib/agent-runtime/',
  'src/lib/genkit/',
  'backend/ai/',
];
const modelPattern = /gemini-\d+(?:\.\d+)?-[a-z0-9.-]+/g;
const allowedModels = new Set(getAskPraxisRuntimeModelIds());
const failures: string[] = [];

walk(root);

if (failures.length) {
  console.error('[audit:ai-provider-isolation] failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:ai-provider-isolation] ok');

function walk(dir: string): void {
  for (const entry of readdirSync(dir)) {
    if (skippedDirs.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    const rel = relative(root, full).replace(/\\/g, '/');
    if (!runtimePrefixes.some((prefix) => rel.startsWith(prefix))) continue;
    if (!searchedExt.has(extname(entry))) continue;
    const src = readFileSync(full, 'utf8');
    const matches = src.match(modelPattern) ?? [];
    for (const model of matches) {
      if (!allowedModels.has(model)) continue;
      if (allowedFiles.has(rel) || rel.startsWith('tests/')) continue;
      failures.push(`${rel} hard-codes ${model}; import the matrix/runtime policy instead.`);
    }
  }
}

function extname(fileName: string): string {
  const index = fileName.lastIndexOf('.');
  return index >= 0 ? fileName.slice(index) : '';
}
