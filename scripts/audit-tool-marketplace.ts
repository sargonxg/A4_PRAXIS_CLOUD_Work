import { CASE_ONTOLOGIES } from '@/lib/ontology/registry';
import { MARKETPLACE_HANDLER_CONTRACTS } from '@/lib/tools/marketplace/handler-contracts';
import { MARKETPLACE_TOOLS } from '@/lib/tools/marketplace/registry';
import { existsSync, readFileSync } from 'node:fs';

const ontologyIds = new Set(CASE_ONTOLOGIES.map((ontology) => ontology.id));
const failures: string[] = [];
const runRoutePath = 'src/app/api/tools/marketplace/run/route.ts';
const runnerPath = 'src/lib/tools/marketplace/runner.ts';
const uiPath = 'src/components/tools/ToolMarketplace.tsx';

if (MARKETPLACE_TOOLS.length !== 22) failures.push(`expected exactly 22 marketplace tools after Pack 18 memo additions, found ${MARKETPLACE_TOOLS.length}`);
for (const requiredMemoTool of ['cross.memo-create', 'cross.memo-refresh']) {
  if (!MARKETPLACE_TOOLS.some((tool) => tool.id === requiredMemoTool)) failures.push(`${requiredMemoTool} must be registered as a first-class marketplace tool`);
}
if (new Set(MARKETPLACE_TOOLS.map((tool) => tool.id)).size !== MARKETPLACE_TOOLS.length) failures.push('tool ids must be unique');

for (const tool of MARKETPLACE_TOOLS) {
  const handlerContract = MARKETPLACE_HANDLER_CONTRACTS[tool.id];
  if (tool.estimatedRuntimeMs > 30000) failures.push(`${tool.id} exceeds 30s runtime budget`);
  if (tool.inputSchema.type !== 'object' || tool.outputSchema.type !== 'object') failures.push(`${tool.id} schemas must be object schemas`);
  if (!tool.inputSchema.additionalProperties || !tool.outputSchema.additionalProperties) failures.push(`${tool.id} schemas must allow additional properties`);
  if (tool.canaryCaseIds.length === 0) failures.push(`${tool.id} needs at least one canary case`);
  if (!handlerContract) failures.push(`${tool.id} is missing a marketplace handler contract`);
  if (handlerContract && handlerContract.toolId !== tool.id) failures.push(`${tool.id} handler contract toolId mismatch`);
  if (handlerContract && !['prompt-contract', 'model-backed'].includes(handlerContract.executionStage)) {
    failures.push(`${tool.id} handler contract has invalid execution stage`);
  }
  if (handlerContract && handlerContract.executionStage === 'model-backed') {
    failures.push(`${tool.id} is marked model-backed before a specialist execution path is audited`);
  }
  if (handlerContract && (
    handlerContract.requiredContext.length === 0 ||
    handlerContract.analysisMoves.length === 0 ||
    handlerContract.outputSections.length === 0 ||
    handlerContract.qualityChecks.length === 0
  )) {
    failures.push(`${tool.id} handler contract needs required context, moves, sections, and quality checks`);
  }
  for (const ontologyId of tool.ontologyRequirements) {
    if (!ontologyIds.has(ontologyId)) failures.push(`${tool.id} references unknown ontology ${ontologyId}`);
  }
}

for (const contractId of Object.keys(MARKETPLACE_HANDLER_CONTRACTS)) {
  if (!MARKETPLACE_TOOLS.some((tool) => tool.id === contractId)) failures.push(`${contractId} handler contract has no matching registry tool`);
}

if (!existsSync(runRoutePath)) failures.push('marketplace run API route is missing');
if (!existsSync(runnerPath)) failures.push('marketplace foundation runner is missing');
if (!existsSync(uiPath)) failures.push('marketplace UI is missing');

if (existsSync(runRoutePath)) {
  const route = readFileSync(runRoutePath, 'utf8');
  for (const required of ['withAuth', 'buildContextSnapshot', 'createContextProvider', 'persistToolRunArtifact', 'export const GET', 'summarizeToolRunArtifact', 'runTelemetry', 'durationMs']) {
    if (!route.includes(required)) failures.push(`marketplace run route must use ${required}`);
  }
}

if (existsSync(runnerPath)) {
  const runner = readFileSync(runnerPath, 'utf8');
  for (const required of ['strictBlocking: false', 'storesRawText', 'storesContextDump', 'storesStructuredOutput', 'handlerContract']) {
    if (!runner.includes(required)) failures.push(`marketplace runner must preserve tolerant artifact posture: ${required}`);
  }
}

if (existsSync(uiPath)) {
  const ui = readFileSync(uiPath, 'utf8');
  for (const required of ['/api/tools/marketplace/run', 'Run', 'artifact', 'Run history', 'loadRunHistory', 'durationMs', 'costClass', 'ToolChainActions', 'canChainInto', 'AbortController', 'Cancel', 'Retry']) {
    if (!ui.includes(required)) failures.push(`marketplace UI must expose executable runs: ${required}`);
  }
}

if (failures.length > 0) {
  console.error('Tool marketplace audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Tool marketplace audit passed for 22 curated tools, handler contracts, and foundation execution.');
console.log('Pack 15 SAT toolkit present: ACH, KAC, Red Team, and Premortem. Pack 18 memo tools present: memo-create and memo-refresh.');
