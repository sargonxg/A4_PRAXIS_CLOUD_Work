import { spawnSync } from 'node:child_process';
import { GOOGLE_AGENT_BIGQUERY_TABLES } from '../src/lib/google-agent-platform/bigquery-schema';

type Status = 'ok' | 'warn' | 'fail';

type Check = {
  label: string;
  status: Status;
  detail: string;
};

const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GOOGLE_VERTEX_PROJECT || 'praxisbytacitus';
const region = process.env.GOOGLE_CLOUD_LOCATION || process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
const requiredServices = [
  'aiplatform.googleapis.com',
  'bigquery.googleapis.com',
  'bigquerystorage.googleapis.com',
  'cloudbuild.googleapis.com',
  'cloudtasks.googleapis.com',
  'secretmanager.googleapis.com',
  'storage.googleapis.com',
];
const checks: Check[] = [];

checkCommand('gcloud CLI', 'gcloud', ['--version'], (output) => output.split('\n')[0] || 'installed');
checkCommand('Google Cloud project', 'gcloud', ['config', 'get-value', 'project'], (output) => {
  const active = output.trim();
  return active === project ? `active project ${active}` : `active project ${active}; expected ${project}`;
}, { failWhen: (output) => output.trim() !== project });
checkCommand('Google Cloud active account', 'gcloud', ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'], (output) => output.trim() || 'no active account', {
  failWhen: (output) => !output.trim(),
});
checkCommand('Application Default Credentials', 'gcloud', ['auth', 'application-default', 'print-access-token'], () => 'ADC token available');

const services = run('gcloud', ['services', 'list', '--enabled', `--project=${project}`, '--format=value(config.name)']);
if (services.status === 0) {
  const enabled = new Set(services.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));
  for (const service of requiredServices) {
    add(service, enabled.has(service) ? 'ok' : 'fail', enabled.has(service) ? 'enabled' : 'missing');
  }
} else {
  add('Google API inventory', 'fail', services.stderr || services.stdout || 'could not list enabled services');
}

checkCommand('Cloud Tasks agent-runs queue', 'gcloud', [
  'tasks',
  'queues',
  'describe',
  'agent-runs',
  `--location=${region}`,
  `--project=${project}`,
  '--format=value(state)',
], (output) => `state ${output.trim() || 'unknown'}`, {
  failWhen: (output) => output.trim() !== 'RUNNING',
});

checkCommand('Agent staging bucket', 'gcloud', [
  'storage',
  'buckets',
  'describe',
  `gs://${project}-agent-staging`,
  '--format=value(name)',
], (output) => output.trim() || 'bucket exists', {
  warnOnly: true,
});

checkCommand('bq CLI', 'bq', ['version'], (output) => output.trim() || 'installed', {
  warnOnly: true,
});

const tables = run('bq', ['--project_id=' + project, 'ls', '--format=json', 'praxis_analytics']);
if (tables.status === 0) {
  const existingTables = new Set(parseBqTables(tables.stdout));
  const missingTables = GOOGLE_AGENT_BIGQUERY_TABLES
    .map((table) => table.name)
    .filter((tableId) => !existingTables.has(tableId));
  add(
    'BigQuery praxis_analytics tables',
    missingTables.length ? 'warn' : 'ok',
    missingTables.length ? `missing ${missingTables.join(', ')}` : 'all expected agent analytics tables exist',
  );
} else {
  add('BigQuery praxis_analytics tables', 'warn', tables.stderr || tables.stdout || 'could not list dataset tables');
}

add('VERTEX_AGENT_ENGINE_ID', process.env.VERTEX_AGENT_ENGINE_ID ? 'ok' : 'warn', process.env.VERTEX_AGENT_ENGINE_ID ? 'present' : 'missing until ADK app is deployed');
add('VERTEX_RAG_CORPUS', process.env.VERTEX_RAG_CORPUS || process.env.VERTEX_RAG_CORPUS_RESOURCE ? 'ok' : 'warn', process.env.VERTEX_RAG_CORPUS || process.env.VERTEX_RAG_CORPUS_RESOURCE ? 'present' : 'missing until RAG corpus is created');

console.log(`Google Agent Platform cloud doctor project=${project} region=${region}`);
for (const check of checks) console.log(`${check.status.toUpperCase().padEnd(4)} ${check.label}: ${check.detail}`);

if (checks.some((check) => check.status === 'fail')) process.exit(1);

function checkCommand(
  label: string,
  command: string,
  args: string[],
  detail: (output: string) => string,
  options: { warnOnly?: boolean; failWhen?: (output: string) => boolean } = {},
): void {
  const result = run(command, args);
  if (result.status !== 0) {
    add(label, options.warnOnly ? 'warn' : 'fail', result.stderr || result.stdout || `${command} failed`);
    return;
  }
  const failed = options.failWhen?.(result.stdout) ?? false;
  add(label, failed ? (options.warnOnly ? 'warn' : 'fail') : 'ok', detail(result.stdout));
}

function run(command: string, args: string[]) {
  if (process.platform === 'win32') {
    return spawnSync('cmd.exe', ['/d', '/c', [command, ...args].join(' ')], { encoding: 'utf8', shell: false });
  }
  return spawnSync(command, args, { encoding: 'utf8', shell: false });
}

function add(label: string, status: Status, detail: string): void {
  checks.push({ label, status, detail: detail.trim() });
}

function parseBqTables(output: string): string[] {
  try {
    const entries = JSON.parse(output) as Array<{ tableReference?: { tableId?: string } }>;
    return entries.map((entry) => entry.tableReference?.tableId).filter((tableId): tableId is string => Boolean(tableId));
  } catch {
    return [];
  }
}
