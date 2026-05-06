import { CASE_ONTOLOGIES } from '@/lib/ontology/registry';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';
import { existsSync, readFileSync } from 'node:fs';

const ontologyIds = new Set(CASE_ONTOLOGIES.map((ontology) => ontology.id));
const failures: string[] = [];
const runRoutePath = 'src/app/api/tools/marketplace/run/route.ts';
const runnerPath = 'src/lib/tools/marketplace/runner.ts';
const uiPath = 'src/components/tools/ToolMarketplace.tsx';

if (MARKETPLACE_TOOLS.length !== 16) failures.push(`expected exactly 16 marketplace tools, found ${MARKETPLACE_TOOLS.length}`);
if (new Set(MARKETPLACE_TOOLS.map((tool) => tool.id)).size !== MARKETPLACE_TOOLS.length) failures.push('tool ids must be unique');

for (const tool of MARKETPLACE_TOOLS) {
  if (tool.estimatedRuntimeMs > 30000) failures.push(`${tool.id} exceeds 30s runtime budget`);
  if (tool.inputSchema.type !== 'object' || tool.outputSchema.type !== 'object') failures.push(`${tool.id} schemas must be object schemas`);
  if (!tool.inputSchema.additionalProperties || !tool.outputSchema.additionalProperties) failures.push(`${tool.id} schemas must allow additional properties`);
  if (tool.canaryCaseIds.length === 0) failures.push(`${tool.id} needs at least one canary case`);
  for (const ontologyId of tool.ontologyRequirements) {
    if (!ontologyIds.has(ontologyId)) failures.push(`${tool.id} references unknown ontology ${ontologyId}`);
  }
}

if (!existsSync(runRoutePath)) failures.push('marketplace run API route is missing');
if (!existsSync(runnerPath)) failures.push('marketplace foundation runner is missing');
if (!existsSync(uiPath)) failures.push('marketplace UI is missing');

if (existsSync(runRoutePath)) {
  const route = readFileSync(runRoutePath, 'utf8');
  for (const required of ['withAuth', 'buildContextSnapshot', 'createContextProvider', 'persistToolRunArtifact']) {
    if (!route.includes(required)) failures.push(`marketplace run route must use ${required}`);
  }
}

if (existsSync(runnerPath)) {
  const runner = readFileSync(runnerPath, 'utf8');
  for (const required of ['strictBlocking: false', 'storesRawText', 'storesContextDump', 'storesStructuredOutput']) {
    if (!runner.includes(required)) failures.push(`marketplace runner must preserve tolerant artifact posture: ${required}`);
  }
}

if (existsSync(uiPath)) {
  const ui = readFileSync(uiPath, 'utf8');
  for (const required of ['/api/tools/marketplace/run', 'Run', 'artifact']) {
    if (!ui.includes(required)) failures.push(`marketplace UI must expose executable runs: ${required}`);
  }
}

if (failures.length > 0) {
  console.error('Tool marketplace audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Tool marketplace audit passed for 16 curated tools and foundation execution.');
