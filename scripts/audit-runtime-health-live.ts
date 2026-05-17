import { execFileSync } from 'node:child_process';

const PROJECT = process.env.GCP_PROJECT_ID ?? 'praxisbytacitus';
const REGION = process.env.GCP_REGION ?? 'us-central1';
const BASE_URL = (process.env.PRAXIS_LIVE_BASE_URL ?? 'https://praxis.tacitus.me').replace(/\/$/, '');

type RuntimePayload = {
  status?: string;
  summary?: string;
  checkedAt?: string;
  debugHref?: string;
  checks?: Array<{
    id?: string;
    label?: string;
    status?: string;
    latencyMs?: number;
  }>;
};

const failures: string[] = [];

async function fetchJson(path: string) {
  const response = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    failures.push(`${path} did not return JSON`);
  }
  if (!response.ok) failures.push(`${path} returned HTTP ${response.status}`);
  return { response, json, text };
}

function gcloud(args: string[]): string {
  return execFileSync('gcloud', [...args, '--project', PROJECT], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function describeCloudRunService(name: string): string {
  const revision = gcloud([
    'run',
    'services',
    'describe',
    name,
    '--region',
    REGION,
    '--format',
    'value(status.latestReadyRevisionName)',
  ]);
  if (!revision) failures.push(`Cloud Run service ${name} has no latest ready revision`);
  return revision;
}

function assertRuntimePayload(value: unknown): asserts value is RuntimePayload {
  const payload = value as RuntimePayload;
  if (!payload || typeof payload !== 'object') {
    failures.push('/api/health/runtime returned a non-object payload');
    return;
  }
  if (!['ok', 'degraded', 'down'].includes(String(payload.status))) {
    failures.push(`/api/health/runtime returned invalid status ${String(payload.status)}`);
  }
  if (typeof payload.summary !== 'string') failures.push('/api/health/runtime missing summary');
  if (typeof payload.checkedAt !== 'string') failures.push('/api/health/runtime missing checkedAt');
  if (payload.debugHref !== '/app/settings?tab=system') {
    failures.push('/api/health/runtime debugHref must stay on the public-safe system settings tab');
  }
  if (!Array.isArray(payload.checks)) failures.push('/api/health/runtime missing checks array');
}

function assertPublicHealthSanitized(text: string) {
  const forbidden = [
    /https?:\/\//i,
    /\b[A-Z0-9_]*(SECRET|TOKEN|KEY|PASSWORD|DATABASE_URL|SERVICE_ACCOUNT)[A-Z0-9_]*\b/i,
    /gserviceaccount\.com/i,
    /-----BEGIN [^-]+-----/i,
    /\b[a-z0-9-]+\.run\.app\b/i,
    /\b(stack|traceback|exception)\b/i,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(text)) failures.push(`/api/health/runtime leaked public-forbidden pattern ${pattern}`);
  }
}

async function main() {
  const health = await fetchJson('/api/health');
  const healthPayload = health.json as { status?: string } | null;
  if (!healthPayload || typeof healthPayload !== 'object' || !healthPayload.status) {
    failures.push('/api/health did not include a status field');
  }

  const runtime = await fetchJson('/api/health/runtime');
  assertRuntimePayload(runtime.json);
  assertPublicHealthSanitized(runtime.text);

  const frontendRevision = describeCloudRunService('praxis-frontend');
  const backendRevision = describeCloudRunService('praxis-backend');

  const workerPools = gcloud([
    'run',
    'worker-pools',
    'list',
    '--region',
    REGION,
    '--format',
    'value(metadata.name)',
  ]).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (workerPools.includes('gdelt-poller')) {
    failures.push('retired Cloud Run worker pool gdelt-poller is still present');
  }

  console.log(`Live health base: ${BASE_URL}`);
  console.log(`/api/health status: ${healthPayload?.status ?? 'unknown'}`);
  console.log(`/api/health/runtime status: ${(runtime.json as RuntimePayload | null)?.status ?? 'unknown'}`);
  console.log(`praxis-frontend ready revision: ${frontendRevision || 'missing'}`);
  console.log(`praxis-backend ready revision: ${backendRevision || 'missing'}`);
  console.log(`gdelt-poller worker pool: ${workerPools.includes('gdelt-poller') ? 'present' : 'absent'}`);

  if (failures.length > 0) {
    console.error('audit:runtime-health-live failed:');
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
  console.log('audit:runtime-health-live OK');
}

void main().catch((error) => {
  console.error(`audit:runtime-health-live failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
