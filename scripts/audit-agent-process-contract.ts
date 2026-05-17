import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

function read(path: string) {
  return readFileSync(join(root, path), 'utf8');
}

function requireIncludes(path: string, markers: string[]) {
  const source = read(path);
  for (const marker of markers) {
    if (!source.includes(marker)) failures.push(`${path} missing ${marker}`);
  }
}

requireIncludes('src/lib/agent-runtime/types.ts', [
  'AgentRun',
  'AgentToolCall',
  'AgentApproval',
  'AgentTrigger',
  'capsuleId',
  'selectedCoreIds',
]);

requireIncludes('src/lib/agent-runtime/postgres.ts', [
  'CREATE TABLE IF NOT EXISTS agent_runs',
  'CREATE TABLE IF NOT EXISTS agent_run_events',
  'agent_runs_owner_capsule_created_idx',
  'decideAgentApproval',
]);

requireIncludes('src/lib/agent-runtime/worker.ts', [
  'executeResearchMemoAgentRun',
  'buildCapsuleWorkerContext',
  'mirrorWorkerEvent',
  'saveMemoDraft',
  'outputHrefFromMetadata',
]);

requireIncludes('src/app/api/agents/runs/[runId]/cancel/route.ts', [
  "toStatus: 'cancelled'",
  'Sample mode cannot cancel private agent runs',
]);

requireIncludes('src/app/api/agents/runs/[runId]/retry/route.ts', [
  'enqueueAgentRunDispatch',
  'parentRunId: source.id',
]);

requireIncludes('src/app/api/agents/runs/[runId]/approvals/[approvalId]/route.ts', [
  'decideAgentApproval',
  "decision !== 'approved'",
  'enqueueAgentRunDispatch',
]);

requireIncludes('src/lib/agent-runtime/adk-bridge.ts', [
  'validateAdkRunAllowed',
  'buildAdkPromptFromContextCapsule',
  'mapAdkEventToPraxisRunEvent',
  'Mirror material ADK events into the PRAXIS run ledger.',
]);

requireIncludes('src/lib/product/policy-agents.ts', [
  "id: 'research-memo'",
  "id: 'sourceability-reviewer'",
  "id: 'red-team-analyst'",
  "id: 'handover-builder'",
  'FORBIDDEN_MVP_INTEGRATION_CLAIMS',
]);

requireIncludes('src/app/agents/[runId]/page.tsx', [
  'TaskletPraxisWorkbench',
  'focusedRunId',
]);

requireIncludes('src/proxy.ts', [
  "pathname.startsWith('/agents/')",
  "loginUrl.searchParams.set('redirect'",
  "'/agents/:path*'",
]);

requireIncludes('src/components/praxis/tasklet-praxis-workbench.tsx', [
  'focusedRunId',
  '`/api/agents/runs/${encodeURIComponent(runId)}`',
  '`/api/agents/runs/${encodeURIComponent(focusedRunId)}/${path}`',
  "router.push(`/agents/${encodeURIComponent(run.runId)}`)",
  'setInterval',
  'onRetryFocusedRun',
  'onCancelFocusedRun',
  'onDecideApproval',
  'FocusedAgentRunPanel',
]);

if (failures.length) {
  console.error('audit:agent-process-contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:agent-process-contract OK');
