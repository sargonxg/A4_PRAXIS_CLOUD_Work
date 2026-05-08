import { existsSync, readFileSync } from 'node:fs';
import { WORKBENCH_CHAPTER_FLOW } from '../src/lib/workbench/chapter-flow';

for (const file of [
  'src/types/truth-layers.ts',
  'backend/services/truth_layers.py',
  'schemas/truth-layers-v1.json',
  'schemas/truth-layers-v1.md',
  'src/lib/context/context-health-score.ts',
  'src/lib/context/context-health-gate.ts',
  'src/types/context.ts',
  'src/lib/context/context-aware.ts',
  'src/lib/api/with-context-aware.ts',
  'src/lib/api/with-context-health-gate.ts',
  'src/lib/api/with-firewall.ts',
  'src/lib/firebase/claims-service.ts',
  'src/lib/graph/neo4j-drift-verifier.ts',
  'src/app/api/situations/[id]/context-health/route.ts',
  'src/app/api/cron/verify-neo4j-sync/route.ts',
  'scripts/verify-neo4j-sync.ts',
  'infrastructure/scheduler/neo4j-drift-verifier-cron.yaml',
  'tests/e2e/personas/diplomat.spec.ts',
  'tests/e2e/personas/mediator.spec.ts',
  'tests/e2e/personas/analyst.spec.ts',
  'tests/e2e/personas/researcher.spec.ts',
]) {
  if (!existsSync(file)) {
    throw new Error(`Missing context/truth-layer contract file: ${file}`);
  }
}

const truthLayers = readFileSync('src/types/truth-layers.ts', 'utf8');
const pythonTruthLayers = readFileSync('backend/services/truth_layers.py', 'utf8');
const truthLayerSchema = readFileSync('schemas/truth-layers-v1.json', 'utf8');
for (const layer of ['source', 'claim', 'evidence', 'verdict']) {
  if (!truthLayers.includes(`'${layer}'`)) throw new Error(`Missing truth layer: ${layer}`);
  if (!pythonTruthLayers.includes(`${layer}`)) throw new Error(`Python truth-layer model missing: ${layer}`);
  if (!truthLayerSchema.includes(`"${layer}"`)) throw new Error(`JSON schema missing truth layer: ${layer}`);
}

const toolsIndex = WORKBENCH_CHAPTER_FLOW.findIndex((chapter) => chapter.id === 'tools');
const deskIndex = WORKBENCH_CHAPTER_FLOW.findIndex((chapter) => chapter.id === 'desk');
if (deskIndex !== 0 || toolsIndex !== 5) {
  throw new Error('Workspace chapters must keep Desk first and Tools sixth in the seven-chapter model.');
}

const toolGate = readFileSync('src/components/workbench/tool-gate.tsx', 'utf8');
if (!toolGate.includes('justification.length < 50') && !toolGate.includes('overrideText.trim().length < 50')) {
  throw new Error('Tool gate must require a typed override justification of at least 50 characters.');
}
if (!toolGate.includes('{children}')) {
  throw new Error('Tool gate must render child tools even when context health is low.');
}

const contextHealthRoute = readFileSync('src/app/api/situations/[id]/context-health/route.ts', 'utf8');
if (!contextHealthRoute.includes("action: 'context_health_override'")) {
  throw new Error('Context-health API must persist override audit entries.');
}

const calibration = readFileSync('src/lib/api/with-calibration.ts', 'utf8');
if (!calibration.includes('withContextAware') || !calibration.includes('contextSnapshot')) {
  throw new Error('Shared AI calibration boundary must attach advisory context snapshots.');
}
if (!calibration.includes('withFirewall({')) {
  throw new Error('Shared AI calibration boundary must run the firewall verifier, not only attach headers.');
}

const firewall = readFileSync('src/lib/api/with-firewall.ts', 'utf8');
for (const marker of ['extractFirewallClaims', 'verifyFirewallClaim', 'persistClaimTrust', 'X-Praxis-Firewall-Claims']) {
  if (!firewall.includes(marker)) throw new Error(`Firewall verifier missing marker: ${marker}`);
}

const claimsService = readFileSync('src/lib/firebase/claims-service.ts', 'utf8');
for (const marker of ['collection(\'claims\')', 'computeClaimTrustScore', 'claimTrustId']) {
  if (!claimsService.includes(marker)) throw new Error(`Claim Trust Score persistence missing marker: ${marker}`);
}

const indexes = readFileSync('firestore.indexes.json', 'utf8');
if (!indexes.includes('"collectionGroup": "claims"')) {
  throw new Error('Firestore indexes must include collection-group support for claim Trust Scores.');
}

const neo4jVerifier = readFileSync('scripts/verify-neo4j-sync.ts', 'utf8');
if (neo4jVerifier.includes('requires production Neo4j credentials') || !neo4jVerifier.includes('verifyNeo4jSync')) {
  throw new Error('Neo4j verifier must be implemented as a real drift report, not a placeholder.');
}

const neo4jCron = readFileSync('src/app/api/cron/verify-neo4j-sync/route.ts', 'utf8');
if (!neo4jCron.includes('verifyNeo4jSync') || !neo4jCron.includes('CRON_SECRET')) {
  throw new Error('Neo4j drift verifier must have a protected cron route.');
}

const personaFiles = [
  'tests/e2e/personas/diplomat.spec.ts',
  'tests/e2e/personas/mediator.spec.ts',
  'tests/e2e/personas/analyst.spec.ts',
  'tests/e2e/personas/researcher.spec.ts',
];
for (const file of personaFiles) {
  const contents = readFileSync(file, 'utf8');
  if (!contents.includes('openExampleWorkbench')) {
    throw new Error(`Persona Playwright flow must open the unified workbench: ${file}`);
  }
}

console.log('audit-context-vs-tools: ok (static-marker)');
