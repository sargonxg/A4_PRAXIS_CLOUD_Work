import { execSync } from 'node:child_process';

const PROJECT = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'praxisbytacitus';
const REGION = process.env.GCP_REGION || process.env.GOOGLE_CLOUD_REGION || 'us-central1';

const fix = process.argv.includes('--fix');

type Check = {
  name: string;
  ok: boolean;
  detail: string;
};

function run(command: string): string {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
}

function tryRun(command: string): { ok: true; out: string } | { ok: false; err: string } {
  try {
    return { ok: true, out: run(command) };
  } catch (error) {
    const err = error as { stderr?: Buffer | string; message?: string };
    const stderr = Buffer.isBuffer(err.stderr) ? err.stderr.toString('utf8') : err.stderr;
    return { ok: false, err: (stderr || err.message || 'command failed').trim() };
  }
}

function check(name: string, command: string, okDetail: (out: string) => string): Check {
  const result = tryRun(command);
  if (result.ok) return { name, ok: true, detail: okDetail(result.out) };
  return { name, ok: false, detail: result.err.split(/\r?\n/)[0] || 'failed' };
}

if (fix) {
  tryRun(`gcloud config set project ${PROJECT}`);
  tryRun(`gcloud config set run/region ${REGION}`);
  tryRun(`gcloud auth application-default set-quota-project ${PROJECT}`);
}

const checks: Check[] = [
  check('gcloud CLI', 'gcloud version --format=json', () => 'installed'),
  check(
    'gcloud active account',
    'gcloud auth list --filter=status:ACTIVE --format="value(account)"',
    (out) => out || 'none'
  ),
  check('gcloud project config', 'gcloud config get-value project', (out) =>
    out === PROJECT ? out : `${out || 'unset'} (expected ${PROJECT})`
  ),
  check('gcloud project access', `gcloud projects describe ${PROJECT} --format="value(projectId)"`, (out) => out),
  check(
    'Application Default Credentials',
    'gcloud auth application-default print-access-token --quiet',
    () => 'valid'
  ),
  check('Firebase CLI login', 'firebase login:list', (out) => out.replace(/\s+/g, ' ')),
  check('Firebase project binding', 'firebase use --json', (out) => {
    try {
      const parsed = JSON.parse(out) as { result?: string | { activeProject?: string } };
      if (typeof parsed.result === 'string') return parsed.result;
      return parsed.result?.activeProject || 'no active project';
    } catch {
      return out || 'unknown';
    }
  }),
];

let failed = 0;

for (const item of checks) {
  const marker = item.ok ? 'OK' : 'FAIL';
  if (!item.ok) failed += 1;
  console.log(`${marker.padEnd(4)} ${item.name}: ${item.detail}`);
}

if (failed > 0) {
  console.log('');
  console.log('Repair commands that require a human browser login:');
  console.log(`  gcloud auth login --update-adc`);
  console.log(`  gcloud auth application-default login --project=${PROJECT}`);
  console.log(`  gcloud auth application-default set-quota-project ${PROJECT}`);
  console.log(`  firebase login --reauth`);
  console.log('');
  console.log('Then run:');
  console.log('  npm run auth:doctor -- --fix');
  process.exitCode = 1;
}
