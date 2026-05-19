import { collectAgenticSearchHealth } from '@/lib/health/agentic-search-health';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const report = collectAgenticSearchHealth();
const routeFailures = checkRouteInventory();

console.log('audit:agentic-search');
console.log(`Status: ${report.status}`);
console.log(`Summary: ${report.summary}`);
console.log(`Checked: ${report.checkedAt}`);

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
