import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures: string[] = [];
const runner = readFileSync(join(process.cwd(), 'src/lib/tools/marketplace/runner.ts'), 'utf8');
const route = readFileSync(join(process.cwd(), 'src/app/api/tools/marketplace/run/route.ts'), 'utf8');
const provider = readFileSync(join(process.cwd(), 'src/lib/tools/context-provider.ts'), 'utf8');

for (const forbidden of [
  '@/lib/firebase/admin',
  '@/lib/firebase/client',
  'getAdminDb',
  'collection(',
  'doc(',
  'query(',
  'fetch(',
]) {
  if (runner.includes(forbidden)) failures.push(`marketplace runner must not access stores directly: ${forbidden}`);
}

for (const marker of ['buildContextSnapshot', 'createContextProvider', '.forTool(tool)', 'buildMarketplaceToolRun']) {
  if (!route.includes(marker)) failures.push(`marketplace route missing context isolation marker: ${marker}`);
}

for (const marker of ['ContextProvider', 'prepare(', 'forTool(', 'subagent(']) {
  if (!provider.includes(marker)) failures.push(`context provider missing marker: ${marker}`);
}

if (failures.length > 0) {
  console.error('Tool context isolation audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Tool context isolation audit passed.');
