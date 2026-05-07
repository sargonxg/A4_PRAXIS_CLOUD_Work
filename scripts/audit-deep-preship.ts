import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

type Status = 'PASS' | 'WARN' | 'BLOCKED';

type Check = {
  id: string;
  section: string;
  title: string;
  status: Status;
  evidence: string;
  remediation: string;
};

const root = process.cwd();
const today = new Date().toISOString().slice(0, 10);
const checks: Check[] = [];

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.relative(root, full);
    if (rel.includes('node_modules') || rel.includes('.next') || rel.includes('.venv') || rel.includes('__pycache__')) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function read(rel: string): string {
  const full = path.join(root, rel);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

function add(check: Check) {
  checks.push(check);
}

function requireIncludes(source: string, needles: string[], section: string, idPrefix: string, file: string) {
  for (const needle of needles) {
    add({
      id: `${idPrefix}-${needle.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 32)}`,
      section,
      title: `${file} includes ${needle}`,
      status: source.includes(needle) ? 'PASS' : 'BLOCKED',
      evidence: source.includes(needle) ? `${file} contains required marker.` : `${file} is missing required marker.`,
      remediation: source.includes(needle) ? 'None.' : `Add or wire ${needle} before marking this checklist item complete.`,
    });
  }
}

const migrationText = walk(path.join(root, 'backend/migrations/versions'))
  .filter((file) => file.endsWith('.py'))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');

const requiredTables = [
  'cases',
  'workspaces',
  'situation_frames',
  'source_receipts',
  'aco_cognee_link',
  'graph_nodes',
  'graph_edges',
  'research_threads',
  'ach_hypotheses',
  'ach_cells',
  'dialectica_runs',
  'memos',
  'memo_versions',
  'briefings',
  'drafts',
  'workspace_suggestions',
  'workspace_events_log',
  'workspace_orchestrator_log',
  'cognee_pending_writes',
  'notifications',
  'notification_preferences',
];

for (const table of requiredTables) {
  const exists = new RegExp(`CREATE TABLE IF NOT EXISTS\\s+${table}\\b`, 'i').test(migrationText);
  add({
    id: `db-table-${table}`,
    section: '1. Database, migrations, RLS, connection pool',
    title: `Required table ${table}`,
    status: exists ? 'PASS' : 'BLOCKED',
    evidence: exists ? `Migration creates ${table}.` : `No CREATE TABLE marker found for ${table}.`,
    remediation: exists ? 'None.' : `Add a reversible migration for ${table}, or document why it is intentionally external to Postgres.`,
  });
}

for (const marker of ['case_type', 'case_type_secondary']) {
  add({
    id: `db-cases-${marker}`,
    section: '1. Database, migrations, RLS, connection pool',
    title: `cases.${marker} column`,
    status: new RegExp(`ALTER TABLE\\s+cases[\\s\\S]*${marker}|${marker}\\s+text`, 'i').test(migrationText) ? 'PASS' : 'BLOCKED',
    evidence: new RegExp(marker, 'i').test(migrationText)
      ? `Migration text references ${marker}.`
      : `No migration marker found for ${marker}.`,
    remediation: `Add ${marker} to the canonical case record if Postgres cases are part of the production substrate.`,
  });
}

for (const table of ['situation_frames', 'source_receipts', 'research_threads', 'memos', 'drafts', 'briefings', 'dialectica_runs', 'workspace_suggestions', 'workspace_orchestrator_log']) {
  const hasIndex = new RegExp(`ON\\s+${table}\\s*\\(\\s*owner_uid\\s*,\\s*case_id`, 'i').test(migrationText);
  add({
    id: `db-index-${table}`,
    section: '1. Database, migrations, RLS, connection pool',
    title: `${table} owner/case index`,
    status: hasIndex ? 'PASS' : 'WARN',
    evidence: hasIndex ? `${table} has owner_uid/case_id index marker.` : `No owner_uid/case_id index marker found for ${table}.`,
    remediation: hasIndex ? 'None.' : `Add owner_uid/case_id index for ${table} before load testing.`,
  });
}

for (const table of ['cases', 'workspaces', 'situation_frames', 'source_receipts', 'research_threads', 'memos', 'drafts', 'briefings', 'dialectica_runs', 'workspace_suggestions', 'workspace_events_log', 'workspace_orchestrator_log', 'notifications', 'notification_preferences']) {
  const hasExplicitRls = new RegExp(`ALTER TABLE\\s+${table}\\s+ENABLE ROW LEVEL SECURITY`, 'i').test(migrationText);
  const hasExplicitPolicy = new RegExp(`CREATE POLICY\\s+${table}_tenant_isolation`, 'i').test(migrationText);
  const coveredByTenantLoop = migrationText.includes(`"${table}"`)
    && migrationText.includes('ALTER TABLE {table} ENABLE ROW LEVEL SECURITY')
    && migrationText.includes('CREATE POLICY {table}_tenant_isolation');
  const hasRls = hasExplicitRls || coveredByTenantLoop;
  const hasPolicy = hasExplicitPolicy || coveredByTenantLoop;
  add({
    id: `db-rls-${table}`,
    section: '1. Database, migrations, RLS, connection pool',
    title: `${table} RLS policy`,
    status: hasRls && hasPolicy ? 'PASS' : 'BLOCKED',
    evidence: hasRls && hasPolicy ? `${table} has RLS and tenant policy markers.` : `${table} missing RLS or tenant policy marker.`,
    remediation: hasRls && hasPolicy ? 'None.' : `Enable RLS and add owner_uid=current_tenant() policy for ${table}.`,
  });
}

const postgres = read('backend/services/postgres.py');
requireIncludes(
  postgres,
  ['set_config(\'app.tenant_id\', %s, true)', 'asynccontextmanager', 'AsyncConnectionPool', 'record_tenant_session_reset'],
  '5. Tenant isolation',
  'tenant-session',
  'backend/services/postgres.py',
);

const metricsService = read('backend/services/metrics.py');
requireIncludes(
  metricsService,
  ['cognee_calls_total', 'cognee_failures_total', 'cognee_latency_seconds', 'tenant_session_resets_total', 'render_prometheus'],
  '2. Cognee substrate wrapper',
  'backend-metrics',
  'backend/services/metrics.py',
);

const cogneeMemory = read('backend/services/cognee_memory.py');
requireIncludes(
  cogneeMemory,
  ['def dataset_for', 'async def improve', 'async def add', 'async def cognify', 'async def memify', 'async def search', 'async def remember', 'async def recall', 'async def forget', 'def get_resolver', 'def get_data_points', 'record_cognee_call'],
  '2. Cognee substrate wrapper',
  'cognee-wrapper',
  'backend/services/cognee_memory.py',
);

const codeFiles = walk(root).filter((file) => /\.(py|ts|tsx)$/.test(file));
const datasetViolations = codeFiles.filter((file) => {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  if (rel === 'backend/services/cognee_memory.py' || rel.startsWith('docs/') || rel.startsWith('scripts/')) return false;
  return /__\{case_id\}|\{owner_uid\}__|owner_uid.*__.*case_id|case_id.*__.*owner_uid/.test(readFileSync(file, 'utf8'));
});
add({
  id: 'cognee-dataset-centralized',
  section: '2. Cognee substrate wrapper',
  title: 'Dataset names flow through cognee_memory.dataset_for',
  status: datasetViolations.length === 0 ? 'PASS' : 'BLOCKED',
  evidence: datasetViolations.length === 0
    ? 'No inline owner_uid__case_id construction found outside wrapper.'
    : datasetViolations.map((file) => path.relative(root, file)).join(', '),
  remediation: 'Replace inline dataset-name construction with MemoryScope or dataset_for().',
});

const ontologySystem = read('backend/services/ontology_system.py');
requireIncludes(
  ontologySystem,
  ['ONTOLOGY_VERSION', 'CASE_TYPES', 'ontology_stack_for_case_types', 'ontology_cache_snapshot'],
  '3. ACO ontology system',
  'ontology-system',
  'backend/services/ontology_system.py',
);

const baseOwl = existsSync(path.join(root, 'backend/data/ontologies/praxis_aco_base.owl'));
const specializationCount = existsSync(path.join(root, 'backend/data/ontologies/specializations'))
  ? readdirSync(path.join(root, 'backend/data/ontologies/specializations')).filter((entry) => entry.endsWith('.owl')).length
  : 0;
add({
  id: 'ontology-files-present',
  section: '3. ACO ontology system',
  title: 'Base and ten specialization OWL files exist',
  status: baseOwl && specializationCount === 10 ? 'PASS' : 'BLOCKED',
  evidence: `base=${baseOwl}; specializations=${specializationCount}`,
  remediation: 'Add the missing OWL files before marking ontology functional complete.',
});

const main = read('backend/main.py');
requireIncludes(
  main,
  ['@app.get("/metrics")', 'render_prometheus', 'PlainTextResponse'],
  '1. Database, migrations, RLS, connection pool',
  'metrics-endpoint',
  'backend/main.py',
);
requireIncludes(
  main,
  ['/v1/debug/ontology/cache', '/v1/debug/case/{case_id}/ontology'],
  '3. ACO ontology system',
  'ontology-debug',
  'backend/main.py',
);

const orchestratorFiles = walk(path.join(root, 'backend/services/workspace_orchestrator')).filter((file) => file.endsWith('.py'));
const orchestratorText = orchestratorFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
const orchestratorSurfaceText = `${orchestratorText}\n${read('backend/routers/tabs.py')}\n${read('backend/routers/workspace.py')}`;
for (const marker of ['on_situation_frame_saved', 'workspace_orchestrator_log', 'workspace_suggestions']) {
  add({
    id: `orchestrator-${marker.replace(/_/g, '-')}`,
    section: '6. Workspace orchestrator',
    title: `Workspace orchestrator marker ${marker}`,
    status: orchestratorSurfaceText.includes(marker) ? 'PASS' : 'BLOCKED',
    evidence: orchestratorSurfaceText.includes(marker) ? `Found ${marker}.` : `Missing ${marker}.`,
    remediation: `Wire ${marker} before the orchestrator checklist can be complete.`,
  });
}

const allSource = codeFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
for (const model of ['gemini-3-flash', 'gemini-3.1-pro-preview']) {
  add({
    id: `vertex-model-${model}`,
    section: '7. Vertex Gemini integration',
    title: `Allowed model ${model} present`,
    status: allSource.includes(model) ? 'PASS' : 'WARN',
    evidence: allSource.includes(model) ? `${model} appears in source.` : `${model} not found in source scan.`,
    remediation: 'Confirm model routing matrix if this is intentional.',
  });
}
const bannedModelMarkers = [
  ['gpt', '-'].join(''),
  ['claude', '-'].join(''),
  ['gemini', '-1.'].join(''),
  ['gemini', '-2.'].join(''),
];
for (const banned of bannedModelMarkers) {
  const found = allSource.includes(banned);
  add({
    id: `vertex-banned-${banned.replace(/[^a-z0-9]/gi, '-')}`,
    section: '7. Vertex Gemini integration',
    title: `No banned direct model marker ${banned}`,
    status: found ? 'WARN' : 'PASS',
    evidence: found ? `${banned} marker found; run audit:model-strings for allowlist context.` : `${banned} marker not found.`,
    remediation: found ? 'Move direct model strings into the approved provider matrix or update the allowlist audit.' : 'None.',
  });
}

const mcpServer = read('backend/mcp/praxis_server.py');
requireIncludes(
  mcpServer,
  ['praxis.list_cases', 'praxis.get_situation_frame', 'praxis.list_sources', 'praxis.get_graph', 'praxis.recall'],
  '9. MCP server',
  'mcp-tools',
  'backend/mcp/praxis_server.py',
);

for (const script of ['audit:cognee', 'audit:workspace-tabs-chapters', 'audit:substrate-writers', 'audit:orchestrator-writes', 'audit:ontology-system']) {
  const present = read('package.json').includes(`"${script}"`);
  add({
    id: `ci-${script.replace(/:/g, '-')}`,
    section: '16. CI / audit scripts',
    title: `${script} script exists`,
    status: present ? 'PASS' : 'BLOCKED',
    evidence: present ? `${script} is in package.json.` : `${script} is missing from package.json.`,
    remediation: `Add package script ${script}.`,
  });
}

const blocked = checks.filter((check) => check.status === 'BLOCKED').length;
const warn = checks.filter((check) => check.status === 'WARN').length;
const pass = checks.filter((check) => check.status === 'PASS').length;

const bySection = new Map<string, Check[]>();
for (const check of checks) {
  bySection.set(check.section, [...(bySection.get(check.section) ?? []), check]);
}

const reportLines = [
  '# PRAXIS Deep Pre-Ship Checklist Audit',
  '',
  `Date: ${today}`,
  '',
  `Summary: ${pass} PASS, ${warn} WARN, ${blocked} BLOCKED across ${checks.length} static pre-ship checks.`,
  '',
  'This audit is deliberately conservative: live staging checks, Cloud SQL restore tests, load tests, browser sessions, and Vertex billing comparisons remain blocked until run against staging/production credentials and datasets.',
  '',
];

for (const [section, sectionChecks] of bySection) {
  reportLines.push(`## ${section}`, '');
  reportLines.push('| Status | Check | Evidence | Remediation |');
  reportLines.push('|---|---|---|---|');
  for (const check of sectionChecks) {
    reportLines.push(`| ${check.status} | ${check.title.replaceAll('|', '\\|')} | ${check.evidence.replaceAll('|', '\\|')} | ${check.remediation.replaceAll('|', '\\|')} |`);
  }
  reportLines.push('');
}

const auditDir = path.join(root, 'docs/audits');
mkdirSync(auditDir, { recursive: true });
const mdPath = path.join(auditDir, `${today}-DEEP_PRESHIP_CHECKLIST.md`);
const jsonPath = path.join(auditDir, `${today}-DEEP_PRESHIP_CHECKLIST.json`);
writeFileSync(mdPath, `${reportLines.join('\n')}\n`);
writeFileSync(jsonPath, JSON.stringify({ date: today, summary: { pass, warn, blocked, total: checks.length }, checks }, null, 2));

console.log(`[audit:deep-preship] wrote ${path.relative(root, mdPath)} and ${path.relative(root, jsonPath)}`);
console.log(`[audit:deep-preship] ${pass} PASS, ${warn} WARN, ${blocked} BLOCKED`);
