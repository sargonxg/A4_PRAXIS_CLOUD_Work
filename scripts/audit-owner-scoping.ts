import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures: string[] = [];

const auth = readFileSync(join(process.cwd(), 'src/lib/api/with-auth.ts'), 'utf8');
const toolArtifact = readFileSync(join(process.cwd(), 'src/lib/tools/marketplace/run-artifact.ts'), 'utf8');
const kgRepos = readFileSync(join(process.cwd(), 'backend/services/kg_repositories.py'), 'utf8');
const contextLayers = readFileSync(join(process.cwd(), 'backend/services/context_layers.py'), 'utf8');

for (const marker of ['uid', 'userUid', 'checkRateLimit', 'logApiCall']) {
  if (!auth.includes(marker)) failures.push(`withAuth missing owner marker: ${marker}`);
}

for (const marker of ['uid', 'situationId', 'toolRunArtifacts']) {
  if (!toolArtifact.includes(marker)) failures.push(`tool artifact persistence missing owner/case marker: ${marker}`);
}

for (const marker of ['owner_uid', 'case_id']) {
  if (!kgRepos.includes(marker)) failures.push(`KG repository missing scope marker: ${marker}`);
  if (!contextLayers.includes(marker)) failures.push(`Python context layer missing scope marker: ${marker}`);
}

if (failures.length > 0) {
  console.error('Owner scoping audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Owner scoping audit passed.');
