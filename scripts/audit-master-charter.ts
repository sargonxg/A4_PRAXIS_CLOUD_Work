import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const failures: string[] = [];

const requiredPromptFiles = [
  'docs/codex-prompts/PRAXIS_CODEX_00_MASTER_CHARTER.md',
  'docs/codex-prompts/PRAXIS_CODEX_03_WORKBENCH_ARCHITECTURE.md',
  'docs/codex-prompts/PRAXIS_CODEX_04_LANDING_AND_ENTRY_REBUILD.md',
  'docs/codex-prompts/PRAXIS_CODEX_05_CONTEXT_VS_TOOLS_SEPARATION.md',
  'docs/codex-prompts/PRAXIS_CODEX_06_ONTOLOGY_SYSTEM.md',
  'docs/codex-prompts/PRAXIS_CODEX_07_GRAPH_VISUALIZATION.md',
  'docs/codex-prompts/PRAXIS_CODEX_08_TOOLS_MARKETPLACE.md',
  'docs/codex-prompts/PRAXIS_CODEX_09_VERIFICATION_AND_ADMIN.md',
  'docs/codex-prompts/PRAXIS_CODEX_10_POSTGRES_KNOWLEDGE_GRAPH.md',
  'docs/codex-prompts/PRAXIS_CODEX_11_MEMO_STUDIO_AND_LAUNCH.md',
  'docs/codex-prompts/PRAXIS_CODEX_12_CONTEXT_ARCHITECTURE.md',
  'docs/codex-prompts/PRAXIS_CODEX_13_TOOL_CONTEXT_INTEROP.md',
  'docs/codex-prompts/PRAXIS_CODEX_14_PRODUCTION_EXCELLENCE.md',
];

for (const file of requiredPromptFiles) {
  const path = join(root, file);
  if (!existsSync(path)) failures.push(`missing preserved prompt: ${file}`);
  else if (readFileSync(path, 'utf8').length < 5000) failures.push(`prompt appears truncated: ${file}`);
}

const requiredDocs = [
  'README.md',
  'ARCHITECTURE.md',
  'CLAUDE.md',
  'AGENTS.md',
  'DESIGN.md',
  'DEPLOYMENT.md',
  'SECURITY.md',
  'TESTING.md',
  'TODO.md',
  'CHANGELOG.md',
  'docs/audits/2026-05-06-MASTER_CHARTER_STATUS.md',
  'docs/audits/2026-05-06-COMPREHENSIVE.md',
  'docs/audits/2026-05-06-REALITY_CHECK.md',
  'docs/roadmap/v1.1-and-beyond.md',
  'docs/backlog/2026-05-06-master-charter-completion-todo.md',
  'docs/launch/PRODUCTION_READINESS.signed.md',
  'docs/launch/ANNOUNCEMENT.md',
  'graphify-out/GRAPH_REPORT.md',
  'graphify-out/graph.json',
  'graphify-out/graph.html',
];

for (const file of requiredDocs) {
  if (!existsSync(join(root, file))) failures.push(`missing charter support file: ${file}`);
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
for (const script of ['audit:gate', 'audit:master-charter', 'audit:codex-prompts', 'audit:workbench', 'audit:landing', 'audit:context-aware-coverage', 'smoke:personas', 'deploy:frontend:cloud']) {
  if (!packageJson.scripts?.[script]) failures.push(`missing package script: ${script}`);
}

const status = readIfExists('docs/audits/2026-05-06-MASTER_CHARTER_STATUS.md');
for (const marker of ['Pack 14', 'Not v1.0.0 complete', 'Open S0/S1 From Self-Audit', 'Graphify', 'Remaining Work']) {
  if (!status.includes(marker)) failures.push(`master charter status missing marker: ${marker}`);
}

const selfAudit = readIfExists('docs/audits/2026-05-06-SELF_AUDIT.md');
for (const marker of ['3 S0', '15 S1', 'Public demo', 'Persona CI', 'Landing-Page Polish Plan']) {
  if (!selfAudit.includes(marker)) failures.push(`self audit missing marker: ${marker}`);
}

const selfAuditBacklog = readIfExists('docs/backlog/2026-05-06-from-self-audit.md');
for (const marker of ['S0 / S1 Launch Blockers', 'Public demo contract', 'Persona CI', 'Canonical entry routes', 'S2 Backlog']) {
  if (!selfAuditBacklog.includes(marker)) failures.push(`self audit backlog missing marker: ${marker}`);
}

const announcement = readIfExists('docs/launch/ANNOUNCEMENT.md');
if (/Known v1\.1 priorities are memo persistence\/export, Postgres KG repositories, full marketplace execution, admin consolidation/i.test(announcement)) {
  failures.push('launch announcement still contains stale v1.1 priorities');
}

const completionTodo = readIfExists('docs/backlog/2026-05-06-master-charter-completion-todo.md');
for (const marker of ['Pack 14 - Production Excellence', 'specialist model-backed handler', 'scheduler-backed operational metrics', 'Postgres Knowledge Graph', 'Run persona Playwright']) {
  if (!completionTodo.includes(marker)) failures.push(`master completion todo missing marker: ${marker}`);
}

const graphReport = readIfExists('graphify-out/GRAPH_REPORT.md');
const head = execSync('git rev-parse --short=8 HEAD', { cwd: root, encoding: 'utf8' }).trim();
const previousHead = execSync('git rev-parse --short=8 HEAD~1', { cwd: root, encoding: 'utf8' }).trim();
if (!graphReport.includes(`Built from commit: \`${head}`) && !graphReport.includes(`Built from commit: \`${previousHead}`)) {
  failures.push(`graphify report is stale; expected commit ${head} or ${previousHead}`);
}

if (failures.length > 0) {
  console.error('Master charter audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Master charter audit passed.');

function readIfExists(file: string): string {
  const path = join(root, file);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}
