import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Check = {
  id: string;
  label: string;
  path: string;
  markers: string[];
};

const checks: Check[] = [
  {
    id: 'ask-queued-run-metadata',
    label: 'Ask queued AgentRun metadata',
    path: 'src/app/api/ai/chat/route.ts',
    markers: [
      'createAgentRun',
      'enqueueAgentRunDispatch',
      'buildAskAgentRunSearchPlan',
      'selectedToolIds',
      'selectedTools',
      'sourceReceiptIds',
      'sourceCount',
      'sourcePosture',
      'groundingPlan',
      'groundingPosture',
      'degradedReason',
      'ledger_failed',
    ],
  },
  {
    id: 'ask-grounding-labels',
    label: 'Ask grounding/source posture labels',
    path: 'src/lib/ai/ask-orchestrator.ts',
    markers: [
      'resolveGroundingPlan',
      'groundingPlan',
      'sourcePosture',
      'groundingPosture',
      'Grounding unavailable',
      'Google Search grounding active',
      'Google Search grounding is not configured.',
    ],
  },
  {
    id: 'worker-search-evidence',
    label: 'Worker search evidence collection phase',
    path: 'src/lib/agent-runtime/worker.ts',
    markers: [
      'collectSearchEvidenceForRun',
      'grounding.search_evidence_started',
      'tool.${toolId}.completed',
      'search_evidence_degraded',
      'search_evidence_collected',
      'sourceReceiptCount',
      'querySet',
      'degradedReason',
    ],
  },
  {
    id: 'safe-agent-run-dto',
    label: 'Safe AgentRun DTO proof fields',
    path: 'src/lib/agent-runtime/schema.ts',
    markers: [
      'searchPlan',
      'sourceReceiptIds',
      'sourceCount',
      'groundingPlan',
      'groundingPosture',
      'degradedReason',
      'contextReceipt',
    ],
  },
  {
    id: 'ask-ui-proof',
    label: 'Ask queued-run UI proof fields',
    path: 'src/components/ask/AskStreamPanel.tsx',
    markers: [
      'Search queued',
      'Search degraded',
      'Grounding unavailable',
      'Source receipts saved',
      'sourceReceiptIds',
      'groundingPosture',
      'degradedReason',
      'outputTargetLabel',
    ],
  },
  {
    id: 'direct-route-labels',
    label: 'Direct search routes labeled fallback/specialized',
    path: 'docs/audits/2026-05-20-agentic-search-proof.md',
    markers: [
      '/api/ai/deep-search-agent',
      '/api/ai/grounded-search',
      '/api/ai/source-scout',
      'fallback/specialized',
      'queued AgentRun',
    ],
  },
];

const root = process.cwd();
const failures: string[] = [];

for (const check of checks) {
  const absolutePath = join(root, check.path);
  if (!existsSync(absolutePath)) {
    failures.push(`${check.id}: missing ${check.path}`);
    continue;
  }
  const source = readFileSync(absolutePath, 'utf8');
  for (const marker of check.markers) {
    if (!source.includes(marker)) {
      failures.push(`${check.id}: ${check.path} missing marker ${marker}`);
    }
  }
}

const orchestrator = readFileSync(join(root, 'src/lib/ai/ask-orchestrator.ts'), 'utf8');
if (/Google grounding requested/.test(orchestrator)) {
  failures.push('ask-grounding-labels: user-facing orchestrator still claims Google grounding from tool selection alone');
}

console.log('audit:agentic-search-proof');
for (const check of checks) console.log(`- checked ${check.label}`);

if (failures.length) {
  console.error('Agentic search proof failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:agentic-search-proof OK');
