import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

type Lane = 'preflight' | 'local' | 'product' | 'agent' | 'live' | 'all';

type Step = {
  name: string;
  command: string;
  args: string[];
};

export type AuthRuntimePreflightCheck = {
  name: string;
  status: 'pass' | 'blocked';
  detail: string;
  remediation?: string;
};

export type AuthRuntimePreflightResult = {
  status: 'pass' | 'blocked';
  checks: AuthRuntimePreflightCheck[];
  missingEnvVars: string[];
};

const EXPECTED_PROJECT = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'praxisbytacitus';
const DEFAULT_BASE_URL = 'http://localhost:3000';

const args = new Set(process.argv.slice(2));
const lane = readLane(process.argv.slice(2));
const continueOnFailure = args.has('--continue-on-failure');

const localSmoke: Step[] = [
  step('Typecheck', 'npm', ['run', 'typecheck']),
  step('Production build', 'npm', ['run', 'build']),
  step('Golden-path smoke', 'npm', ['run', 'smoke:golden-path']),
  step('Canary auth skip smoke', 'npx', ['playwright', 'test', 'tests/e2e/canary-auth-skip.spec.ts']),
  step('Ask capsule runtime smoke', 'npx', ['playwright', 'test', 'tests/e2e/ask-capsule-runtime.spec.ts']),
  step('Same-thread AgentRun canary', 'npx', ['playwright', 'test', 'tests/e2e/ask-same-thread-agent-run.spec.ts']),
];

const productSurface: Step[] = [
  step('MVP route shape audit', 'npm', ['run', 'audit:mvp-route-shape']),
  step('Public surface audit', 'npm', ['run', 'audit:public-surface']),
  step('Tasklet MVP foundation audit', 'npm', ['run', 'audit:tasklet-mvp-foundation']),
  step('Ask cockpit runtime audit', 'npm', ['run', 'audit:ask-cockpit-runtime']),
];

const agentRuntime: Step[] = [
  step('Agent process contract audit', 'npm', ['run', 'audit:agent-process-contract']),
  step('Agent runtime proof audit', 'npm', ['run', 'audit:agent-runtime-proof']),
  step('Agent runtime unit proof', 'npx', ['vitest', 'run', 'tests/unit/lib/agent-runtime', 'src/__tests__/genkit-provider.test.ts']),
];

const liveRuntime: Step[] = [
  step('Live runtime health audit', 'npm', ['run', 'audit:runtime-health-live']),
  step('GCP audit', 'npm', ['run', 'audit:gcp']),
];

async function main() {
  printHeader();
  const preflightOk = runPreflight();
  if (lane === 'preflight') {
    process.exit(preflightOk ? 0 : 1);
  }

  if (!preflightOk) {
    console.error('');
    console.error('Authenticated runtime lane blocked before test execution.');
    console.error('Set the missing values or refresh credentials, then rerun this command.');
    process.exit(1);
  }

  const steps = stepsForLane(lane);
  const failures: string[] = [];
  for (const item of steps) {
    const result = runStep(item);
    if (result !== 0) {
      failures.push(`${item.name} exited with ${result}`);
      if (!continueOnFailure) break;
    }
  }

  if (failures.length > 0) {
    console.error('');
    console.error('Authenticated runtime lane failed:');
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }

  console.log('');
  console.log(`Authenticated runtime lane '${lane}' completed.`);
}

function printHeader() {
  console.log('PRAXIS authenticated runtime lane');
  console.log(`Lane: ${lane}`);
  console.log(`Base URL: ${process.env.PLAYWRIGHT_BASE_URL || DEFAULT_BASE_URL}`);
  console.log(`Project: ${EXPECTED_PROJECT}`);
  console.log('');
}

function runPreflight(): boolean {
  const result = evaluateAuthenticatedRuntimePreflight({
    env: process.env,
    capture,
  });

  for (const check of result.checks) {
    const marker = check.status === 'pass' ? 'OK' : 'FAIL';
    console.log(`${marker.padEnd(4)} ${check.name}: ${check.detail}`);
    if (check.status === 'blocked' && check.remediation) console.log(`     fix: ${check.remediation}`);
  }
  if (result.status === 'blocked') {
    console.log(`BLOCKED authenticated runtime preflight: ${result.missingEnvVars.length ? `missing ${result.missingEnvVars.join(', ')}` : 'credential/runtime prerequisite failed'}`);
  }
  return result.status === 'pass';
}

export function evaluateAuthenticatedRuntimePreflight(input: {
  env: NodeJS.ProcessEnv | Record<string, string | undefined>;
  capture: (
    command: string,
    commandArgs: string[],
    options?: { env?: Record<string, string> },
  ) => { ok: boolean; output: string };
}): AuthRuntimePreflightResult {
  const checks: Array<{ name: string; ok: boolean; detail: string; remediation?: string; envVar?: string }> = [];

  checks.push({
    name: 'TEST_FIREBASE_EMAIL',
    ok: Boolean(input.env.TEST_FIREBASE_EMAIL),
    detail: input.env.TEST_FIREBASE_EMAIL ? 'present' : 'missing',
    remediation: '$env:TEST_FIREBASE_EMAIL="<already-onboarded-test-user@example.com>"',
    envVar: 'TEST_FIREBASE_EMAIL',
  });
  checks.push({
    name: 'TEST_FIREBASE_PASSWORD',
    ok: Boolean(input.env.TEST_FIREBASE_PASSWORD),
    detail: input.env.TEST_FIREBASE_PASSWORD ? 'present' : 'missing',
    remediation: '$env:TEST_FIREBASE_PASSWORD="<test-user-password>"',
    envVar: 'TEST_FIREBASE_PASSWORD',
  });
  checks.push({
    name: 'PLAYWRIGHT_BASE_URL',
    ok: true,
    detail: input.env.PLAYWRIGHT_BASE_URL || `${DEFAULT_BASE_URL} (default)`,
    remediation: '$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"',
  });

  const activeAccount = input.capture('gcloud', ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']);
  checks.push({
    name: 'gcloud active account',
    ok: activeAccount.ok && activeAccount.output.length > 0,
    detail: activeAccount.ok ? activeAccount.output || 'none' : activeAccount.output,
    remediation: 'gcloud auth login',
  });

  const expectedProject = input.env.GCP_PROJECT_ID || input.env.GOOGLE_CLOUD_PROJECT || EXPECTED_PROJECT;
  const project = input.capture('gcloud', ['config', 'get-value', 'project']);
  checks.push({
    name: 'gcloud project',
    ok: project.ok && project.output === expectedProject,
    detail: project.ok ? project.output || 'unset' : project.output,
    remediation: `gcloud config set project ${expectedProject}`,
  });

  const firebaseLogin = input.capture('firebase', ['login:list']);
  checks.push({
    name: 'Firebase CLI login',
    ok: firebaseLogin.ok && firebaseLogin.output.length > 0,
    detail: firebaseLogin.ok ? oneLine(firebaseLogin.output) : firebaseLogin.output,
    remediation: 'firebase login --reauth',
  });

  const adc = resolveAdcCheck(input);
  checks.push({
    name: 'Application Default Credentials',
    ok: adc.ok && adc.output.length > 0,
    detail: adc.output,
    remediation: `gcloud auth application-default login --project=${expectedProject}`,
  });

  const normalized = checks.map((check): AuthRuntimePreflightCheck => ({
    name: check.name,
    status: check.ok ? 'pass' : 'blocked',
    detail: check.detail,
    remediation: check.remediation,
  }));
  const missingEnvVars = checks
    .filter((check) => !check.ok && check.envVar)
    .map((check) => check.envVar!);
  return {
    status: normalized.every((check) => check.status === 'pass') ? 'pass' : 'blocked',
    checks: normalized,
    missingEnvVars,
  };
}

function resolveAdcCheck(input: {
  env: NodeJS.ProcessEnv | Record<string, string | undefined>;
  capture: (
    command: string,
    commandArgs: string[],
    options?: { env?: Record<string, string> },
  ) => { ok: boolean; output: string };
}): { ok: boolean; output: string } {
  const adc = input.capture('gcloud', ['auth', 'application-default', 'print-access-token', '--quiet']);
  if (adc.ok && adc.output.length > 0) {
    return { ok: true, output: 'valid access token' };
  }

  const serviceAccountRaw = input.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountRaw) return adc;

  let tempDir = '';
  try {
    const parsed = JSON.parse(serviceAccountRaw);
    if (parsed.private_key && typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    tempDir = mkdtempSync(join(tmpdir(), 'praxis-adc-'));
    const credentialPath = join(tempDir, 'service-account.json');
    writeFileSync(credentialPath, JSON.stringify(parsed), 'utf8');
    const serviceAccountAdc = input.capture(
      'gcloud',
      ['auth', 'application-default', 'print-access-token', '--quiet'],
      { env: { GOOGLE_APPLICATION_CREDENTIALS: credentialPath } },
    );
    if (serviceAccountAdc.ok && serviceAccountAdc.output.length > 0) {
      return { ok: true, output: 'valid access token via FIREBASE_SERVICE_ACCOUNT_KEY service-account fallback' };
    }
  } catch {
    // Keep the original ADC failure below; the service-account key is validated by Firebase Admin separately.
  } finally {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  }

  return adc;
}

function stepsForLane(selected: Lane): Step[] {
  if (selected === 'local') return localSmoke;
  if (selected === 'product') return productSurface;
  if (selected === 'agent') return agentRuntime;
  if (selected === 'live') return liveRuntime;
  if (selected === 'all') return [...localSmoke, ...productSurface, ...agentRuntime, ...liveRuntime];
  return [];
}

function step(name: string, command: string, args: string[]): Step {
  return { name, command, args };
}

function runStep(item: Step): number {
  console.log('');
  console.log(`> ${item.name}`);
  console.log(`  ${item.command} ${item.args.join(' ')}`);
  const result = spawnSync(resolveBin(item.command), item.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL || DEFAULT_BASE_URL,
    },
  });
  if (result.error) {
    console.error(result.error.message);
    return 1;
  }
  return result.status ?? 1;
}

function capture(
  command: string,
  commandArgs: string[],
  options: { env?: Record<string, string> } = {},
): { ok: boolean; output: string } {
  const result = spawnSync(resolveBin(command), commandArgs, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ...(options.env ?? {}),
    },
  });
  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  const output = result.status === 0 ? stdout : (stderr || stdout);
  if (result.error) return { ok: false, output: result.error.message };
  return { ok: result.status === 0, output: output.replace(/\r?\n$/, '') };
}

function readLane(values: string[]): Lane {
  const arg = values.find((value) => value.startsWith('--lane='));
  const value = (arg ? arg.slice('--lane='.length) : 'preflight') as Lane;
  if (!['preflight', 'local', 'product', 'agent', 'live', 'all'].includes(value)) {
    throw new Error(`Invalid --lane value: ${value}`);
  }
  return value;
}

function resolveBin(command: string): string {
  if (process.platform !== 'win32') return command;
  if (command === 'npm') return 'npm.cmd';
  if (command === 'npx') return 'npx.cmd';
  if (command === 'gcloud') return 'gcloud.cmd';
  if (command === 'firebase') return 'firebase.cmd';
  return command;
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/run-authenticated-runtime-lane.ts')) {
  void main();
}
