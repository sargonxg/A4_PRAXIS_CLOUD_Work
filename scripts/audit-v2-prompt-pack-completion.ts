import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];

const v2Prompts = [
  'V2_00_README',
  'V2_A0_MT_DATA_MODEL',
  'V2_A1_ORGID_CONTEXT',
  'V2_A2_COLLABORATORS_SCHEMA',
  'V2_A3_FIRESTORE_RULES',
  'V2_A4_TEAM_INVITE_FLOW',
  'V2_A5_ROLE_PILLS_AND_GUARDS',
  'V2_A6_MT_AUDIT_LOG',
  'V2_B0_KG_PREFLIGHT',
  'V2_B1_DUAL_WRITE_GRAPH',
  'V2_B2_READ_PATH_POSTGRES',
  'V2_B3_RETIRE_FIRESTORE_GRAPH',
  'V2_C0_COGNEE_LIVE',
  'V2_C1_MEMORY_RECALL_IN_CALIBRATION',
  'V2_C2_AGENT_ENGINE_SUBAGENTS',
  'V2_D0_STRUCTURED_EVENTS',
  'V2_D1_KPI_PIPELINE',
  'V2_ITERATE_LOOP',
  'V2_STATUS_TEMPLATE',
  'V2_Z1_EXPORT_E2E',
  'V2_Z2_DEMO_TRANSITION',
  'V2_Z3_DEEP_RESEARCH_CONSOLIDATE',
];

const checkpointPath = 'docs/audits/2026-05-08-V2-PROMPT-PACK-COMPLETION.md';
const checkpoint = read(checkpointPath);
const status = read('STATUS.md');
const packageJsonText = read('package.json');

if (!checkpoint) failures.push(`missing ${checkpointPath}`);

for (const prompt of v2Prompts) {
  const promptFile = `docs/codex-prompts/PRAXIS_${prompt}.md`;
  if (!existsSync(join(root, promptFile))) failures.push(`missing prompt file ${promptFile}`);
  if (!status.includes(`| ${prompt} |`)) failures.push(`STATUS.md missing task row for ${prompt}`);
  if (!checkpoint.includes(`| ${prompt} |`)) failures.push(`${checkpointPath} missing checkpoint row for ${prompt}`);
}

const requiredStatusMarkers = [
  '## Approvals Required',
  'MT-1 org model',
  '## B0 KG Preflight Approval',
  '## C2 Agent Engine Decision',
  '## Pending Operational Steps',
  'OP-001',
  'OP-002',
  'OP-003',
  'OP-004',
  'praxis-cognee',
  'Cloud SQL',
];

for (const marker of requiredStatusMarkers) {
  if (!status.includes(marker)) failures.push(`STATUS.md missing blocker marker: ${marker}`);
}

const packageJson = packageJsonText ? JSON.parse(packageJsonText) as { scripts?: Record<string, string> } : { scripts: {} };
const scripts = packageJson.scripts ?? {};

const requiredScripts = [
  'audit:codex-prompts',
  'audit:telemetry-coverage',
  'audit:bq-views',
  'audit:export-coverage',
  'audit:demo-claim',
  'audit:deep-research-canonical',
  'audit:v2-prompt-pack-completion',
];

for (const script of requiredScripts) {
  if (!scripts[script]) failures.push(`package.json missing script ${script}`);
}

const gate = scripts['audit:gate'] ?? '';
for (const script of requiredScripts) {
  if (!gate.includes(`npm run ${script}`)) failures.push(`audit:gate missing ${script}`);
}

if (failures.length > 0) {
  console.error('audit:v2-prompt-pack-completion failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:v2-prompt-pack-completion passed: all V2 prompts are preserved, status rows exist, blocker gates are explicit, and D/Z guard audits are in audit:gate. (static-marker)');

function read(file: string): string {
  const full = join(root, file);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}
