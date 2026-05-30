import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAgentRunTasksQueuePath } from '../src/lib/agent-runtime/cloud-tasks';
import { resolveGenkitGoogleProvider } from '../src/lib/genkit/provider';

type Status = 'ok' | 'warn' | 'fail';

const root = process.cwd();
const failures: string[] = [];
const warnings: string[] = [];

function read(relativePath: string): string {
  const absolute = join(root, relativePath);
  if (!existsSync(absolute)) {
    failures.push(`Missing ${relativePath}`);
    return '';
  }
  return readFileSync(absolute, 'utf8');
}

function requireMarkers(relativePath: string, markers: string[]): void {
  const source = read(relativePath);
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${relativePath} missing ${marker}`);
  }
}

function hasAnyEnv(names: string[]): boolean {
  return names.some((name) => Boolean(process.env[name]));
}

function line(label: string, status: Status, detail: string): void {
  const tag = status.toUpperCase().padEnd(4, ' ');
  console.log(`${tag} ${label}: ${detail}`);
}

requireMarkers('src/app/api/agents/runs/route.ts', [
  'CreateManualAgentRunRequestSchema',
  'createAgentRun',
  'toAgentRunOutput',
  "executionMode: 'queued-only'",
]);
requireMarkers('src/app/api/agents/runs/[runId]/dispatch/route.ts', [
  'enqueueAgentRunDispatch',
  'withAuth',
]);
requireMarkers('src/app/api/agents/runs/[runId]/execute/route.ts', [
  'verifyAgentWorkerRequest',
  'executeAgentRun',
]);
requireMarkers('src/app/api/agents/runs/[runId]/stream/route.ts', [
  'text/event-stream',
  'listAgentRunEvents',
  'encodeSseEvents',
]);
requireMarkers('src/lib/agent-runtime/postgres.ts', [
  'CREATE TABLE IF NOT EXISTS agent_runs',
  'CREATE TABLE IF NOT EXISTS agent_run_events',
  'CREATE TABLE IF NOT EXISTS agent_tool_calls',
  'CREATE TABLE IF NOT EXISTS agent_approvals',
  'mirrorAgentRunToFirestore',
  'publishAgentRunEvent',
]);
requireMarkers('src/lib/agent-runtime/firestore-mirror.ts', [
  'buildAgentRunFirestoreSnapshot',
  'mirrorAgentRunToFirestore',
  'mirrorAgentRunEventToFirestore',
  'agentRunFirestorePath',
]);
requireMarkers('src/hooks/useAgentRunSnapshots.ts', [
  'onSnapshot',
  "collection(db, 'users', uid, 'runs', runId, 'events')",
  "doc(db, 'users', uid, 'runs', runId)",
]);
requireMarkers('firestore.rules', [
  'match /runs/{runId}',
  'match /events/{eventId}',
  'allow write: if false;',
]);
requireMarkers('src/lib/agent-runtime/worker.ts', [
  'executeCapsuleFactoryAgentRun',
  'executeResearchMemoAgentRun',
  'saveMemoDraft',
  'saveOutputCapsule',
  'appendAgentToolCall',
  'appendAgentApproval',
  'capsule.read_receipt_created',
  'workflow.plan_created',
  'sourceability.ledger_created',
]);
requireMarkers('src/lib/agent-runtime/capsule-read-receipt.ts', [
  'CapsuleReadReceipt',
  'buildCapsuleReadReceiptFromEvidencePack',
]);
requireMarkers('src/lib/agent-runtime/workflow-plan.ts', [
  'AgentWorkflowPlan',
  'AGENT_WORKFLOW_PROCESS_RAIL',
]);
requireMarkers('src/lib/agent-runtime/sourceability-ledger.ts', [
  'SourceabilityLedger',
  'supported',
  'unsupported',
]);
requireMarkers('src/lib/agent-runtime/mirror.ts', [
  'mirrorWorkerEvent',
  'mirrorGenkitFlowEvent',
  'mirrorAdkAgentEvent',
]);
requireMarkers('src/lib/agent-runtime/adk-bridge.ts', [
  'buildAdkPromptFromContextCapsule',
  'mapAdkEventToPraxisRunEvent',
  'High-risk ADK action requires approval',
]);
requireMarkers('src/lib/genkit/index.ts', [
  'resolveGenkitGoogleProvider',
  'genkit',
]);
requireMarkers('src/lib/genkit/flows/capsule-factory.ts', [
  'capsuleIntakeFlow',
  'capsuleResearchPlanFlow',
  'capsuleSynthesisFlow',
  'capsuleWritingProfileFlow',
]);
requireMarkers('tests/unit/lib/agent-runtime/runtime-proof.test.ts', [
  'create -> dispatch -> execute -> stream -> output receipt path',
]);

const ledgerConfigured = hasAnyEnv(['AGENT_RUNTIME_DATABASE_URL', 'PRAXIS_DATABASE_URL', 'DATABASE_URL']);
const workerBaseConfigured = hasAnyEnv(['AGENT_RUN_WORKER_BASE_URL', 'APP_URL', 'NEXT_PUBLIC_APP_URL', 'VERCEL_PROJECT_PRODUCTION_URL']);
const workerAuthConfigured = hasAnyEnv(['AGENT_RUN_WORKER_SHARED_SECRET'])
  || (hasAnyEnv(['AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL']) && hasAnyEnv(['AGENT_RUN_WORKER_OIDC_AUDIENCE', 'AGENT_RUN_WORKER_BASE_URL', 'APP_URL', 'NEXT_PUBLIC_APP_URL', 'VERCEL_PROJECT_PRODUCTION_URL']));
const genkitProvider = resolveGenkitGoogleProvider();
const genkitLive = genkitProvider.kind === 'vertex'
  ? Boolean(genkitProvider.projectId || process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : Boolean(genkitProvider.apiKey);
const adkConfigured = hasAnyEnv(['VERTEX_AGENT_ENGINE_ID']);

if (!ledgerConfigured) warnings.push('Agent ledger env is missing: AGENT_RUNTIME_DATABASE_URL, PRAXIS_DATABASE_URL, or DATABASE_URL.');
if (!workerBaseConfigured) warnings.push('Worker base URL is missing: set AGENT_RUN_WORKER_BASE_URL or APP_URL before Cloud Tasks dispatch.');
if (!workerAuthConfigured) warnings.push('Worker auth is not production-ready: set Cloud Tasks OIDC service account/audience or local shared secret.');
if (!genkitLive) warnings.push('Genkit provider resolves, but live model calls are not configured in this shell.');
if (!adkConfigured) warnings.push('ADK Agent Engine is unconfigured for queued agent execution in this shell.');

console.log('Agent runtime proof audit');
line('static contract', failures.length ? 'fail' : 'ok', failures.length ? `${failures.length} missing marker(s)` : 'create, dispatch, execute, Firestore onSnapshot mirror, stream fallback, ledger, worker, mirror, ADK, and Genkit markers found');
line('ledger', ledgerConfigured ? 'ok' : 'warn', ledgerConfigured ? 'Cloud SQL/Postgres env present' : 'runtime proof can run with doubles only');
line('Cloud Tasks queue', 'ok', getAgentRunTasksQueuePath());
line('worker target', workerBaseConfigured ? 'ok' : 'warn', workerBaseConfigured ? 'worker base URL present' : 'dispatch URL cannot be built for live Cloud Tasks');
line('worker auth', workerAuthConfigured ? 'ok' : 'warn', workerAuthConfigured ? 'worker auth env present' : 'live worker route will reject Cloud Tasks calls until auth env is set');
line('Genkit', genkitLive ? 'ok' : 'warn', `${genkitProvider.kind} at ${genkitProvider.location}: ${genkitProvider.reason}`);
line('ADK Agent Engine', adkConfigured ? 'ok' : 'warn', adkConfigured ? 'VERTEX_AGENT_ENGINE_ID present' : 'queued ADK worker should stay planned/unconfigured');
line('proof command', 'ok', 'npx vitest run tests/unit/lib/agent-runtime src/__tests__/genkit-provider.test.ts');

for (const warning of warnings) console.warn(`WARN: ${warning}`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}

console.log('audit:agent-runtime-proof OK');
