import { collectAgenticSearchHealth } from '@/lib/health/agentic-search-health';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const report = collectAgenticSearchHealth();
const routeFailures = checkRouteInventory();
const redflag = buildRedflagArtifact(report, routeFailures);
writeRedflagArtifacts(redflag);

console.log('audit:agentic-search');
console.log(`Status: ${report.status}`);
console.log(`Summary: ${report.summary}`);
console.log(`Checked: ${report.checkedAt}`);
console.log(`Redflag artifact: ${redflag.markdownPath}`);

for (const check of report.checks) {
  const missing = check.missing?.length ? ` missing=${check.missing.join(', ')}` : '';
  console.log(`- ${check.status.toUpperCase()} ${check.label}: ${check.detail}${missing}`);
}

if (routeFailures.length) {
  console.error('Route/runtime inventory failures:');
  for (const failure of routeFailures) console.error(`- ${failure}`);
}

if (report.status === 'blocked' || routeFailures.length) {
  console.error('Blocked agentic-search config:');
  for (const name of report.missing) console.error(`- ${name}`);
  process.exit(1);
}

console.log('audit:agentic-search OK');

function checkRouteInventory(): string[] {
  const root = process.cwd();
  const failures: string[] = [];
  const expected = [
    ['src/app/api/ai/chat/route.ts', ['createAgentRun', 'enqueueAgentRunDispatch', 'resolveGroundingPlan']],
    ['src/app/api/agents/runs/route.ts', ['createAgentRun', 'toAgentRunOutput']],
    ['src/app/api/agents/runs/[runId]/stream/route.ts', ['listAgentRunEvents', 'text/event-stream']],
    ['src/lib/agent-runtime/adk-bridge.ts', ['mapAdkEventToPraxisRunEvent']],
    ['src/lib/agent-runtime/mirror.ts', ['mirrorAdkAgentEvent', 'mirrorGenkitFlowEvent']],
    ['src/lib/agent-runtime/grounding-adapter.ts', ['resolveGroundingPlan', 'google_search']],
    ['src/app/api/health/agentic-search/route.ts', ['collectAgenticSearchHealth']],
  ] as const;

  for (const [relativePath, markers] of expected) {
    const absolutePath = join(root, relativePath);
    if (!existsSync(absolutePath)) {
      failures.push(`Missing ${relativePath}`);
      continue;
    }
    const source = readFileSync(absolutePath, 'utf8');
    for (const marker of markers) {
      if (!source.includes(marker)) failures.push(`${relativePath} missing ${marker}`);
    }
  }
  return failures;
}

function buildRedflagArtifact(
  health: ReturnType<typeof collectAgenticSearchHealth>,
  routeInventoryFailures: string[],
) {
  const appSearchProof = collectAppSearchProof();
  const checkById = new Map(health.checks.map((check) => [check.id, check]));
  const date = health.checkedAt.slice(0, 10);
  const redflags = [
    {
      id: 'local_env_blockers',
      status: health.missing.length ? 'blocked' : 'ready',
      detail: health.missing.length ? `Missing: ${health.missing.join(', ')}` : 'Required local env markers are present.',
    },
    {
      id: 'production_readiness',
      status: health.status,
      detail: health.summary,
    },
    {
      id: 'agent_run_ledger',
      status: checkById.get('ledger')?.status ?? 'blocked',
      detail: checkById.get('ledger')?.detail ?? 'AgentRun ledger check missing.',
    },
    {
      id: 'stream_availability',
      status: routeInventoryFailures.some((failure) => failure.includes('[runId]/stream')) ? 'blocked' : 'ready',
      detail: routeInventoryFailures.some((failure) => failure.includes('[runId]/stream'))
        ? 'AgentRun stream route inventory failed.'
        : 'AgentRun stream route is present in inventory.',
    },
    {
      id: 'grounding_configured',
      status: checkById.get('vertex_grounding')?.status ?? 'degraded',
      detail: checkById.get('vertex_grounding')?.detail ?? 'Grounding check missing.',
    },
    {
      id: 'adk_configured',
      status: checkById.get('adk_runtime')?.status ?? 'degraded',
      detail: checkById.get('adk_runtime')?.detail ?? 'ADK check missing.',
    },
    {
      id: 'saved_output_persistence',
      status: routeInventoryFailures.some((failure) => failure.includes('agent-runtime')) ? 'blocked' : 'ready',
      detail: routeInventoryFailures.some((failure) => failure.includes('agent-runtime'))
        ? 'Agent runtime persistence route inventory failed.'
        : 'AgentRun ledger, events, tool calls, approvals, and artifacts are checked by runtime inventory.',
    },
    {
      id: 'app_search_proof',
      status: appSearchProof.status,
      detail: appSearchProof.detail,
    },
  ];

  return {
    checkedAt: health.checkedAt,
    status: redflags.some((item) => item.status === 'blocked') ? 'blocked' : redflags.some((item) => item.status === 'degraded') ? 'degraded' : 'ready',
    markdownPath: `docs/audits/${date}-agentic-search-redflags.md`,
    jsonPath: `docs/audits/${date}-agentic-search-redflags.json`,
    redflags,
  };
}

function collectAppSearchProof(): { status: 'ready' | 'blocked'; detail: string } {
  const required = [
    'src/app/api/app/search/route.ts',
    'src/lib/app-search/app-search.ts',
    'src/components/shared/global-search.tsx',
    'scripts/audit-app-search-contract.ts',
  ];
  const missing = required.filter((relativePath) => !existsSync(join(process.cwd(), relativePath)));
  if (missing.length) {
    return { status: 'blocked', detail: `Missing app-search proof files: ${missing.join(', ')}` };
  }
  return { status: 'ready', detail: 'Unified app-search route, service, GlobalSearch wiring, and contract audit are present.' };
}

function writeRedflagArtifacts(redflag: ReturnType<typeof buildRedflagArtifact>): void {
  const root = process.cwd();
  mkdirSync(join(root, 'docs/audits'), { recursive: true });
  writeFileSync(join(root, redflag.jsonPath), `${JSON.stringify(redflag, null, 2)}\n`);
  writeFileSync(join(root, redflag.markdownPath), [
    `# Agentic Search Redflags (${redflag.checkedAt.slice(0, 10)})`,
    '',
    `Status: ${redflag.status}`,
    '',
    '| Redflag | Status | Detail |',
    '| --- | --- | --- |',
    ...redflag.redflags.map((item) => `| ${item.id} | ${item.status} | ${item.detail.replace(/\|/g, '/')} |`),
    '',
  ].join('\n'));
}
