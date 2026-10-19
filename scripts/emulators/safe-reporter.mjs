import { writeFileSync, renameSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const files = new Set(['tests/e2e/onboarding.spec.ts', 'tests/e2e/golden-path.spec.ts',
  'tests/e2e/authenticated-app-post-login.spec.ts', 'tests/e2e/helpers/auth.ts', 'tests/e2e/workbench-context-readiness.emulator.spec.ts']);
const identities = new Map([
  ['tests/e2e/onboarding.spec.ts\0handles onboarding or an already-onboarded canary profile', 'ONBOARDING_FIRST_LOGIN'],
  ['tests/e2e/golden-path.spec.ts\0sign in → chat → capsule library → boardroom → settings', 'GOLDEN_CORE_ROUTES'],
  ['tests/e2e/golden-path.spec.ts\0capsule prompt → Ask with sources → memo export → boardroom proof', 'GOLDEN_MEMO_BOARDROOM'],
  ['tests/e2e/authenticated-app-post-login.spec.ts\0logs in with the Firebase canary and verifies core protected routes', 'AUTHENTICATED_PROTECTED_ROUTES'],
  ['tests/e2e/workbench-context-readiness.emulator.spec.ts\0waits for owner context before sending the requested conversation turn', 'WORKBENCH_CONTEXT_READINESS'],
]);
const statuses = new Set(['passed', 'failed', 'timedOut', 'skipped', 'interrupted']);
const runStatuses = new Set(['passed', 'failed', 'timedout', 'interrupted']);
const bounded = (value, max, min = 0) => Number.isInteger(value) && value >= min && value <= max ? value : null;
function repositoryFile(file) {
  if (typeof file !== 'string' || !isAbsolute(file)) return null;
  const name = relative(root, resolve(file)).split('\\').join('/');
  return files.has(name) ? name : null;
}
export function safeLocation(location) {
  const file = repositoryFile(location?.file);
  const line = bounded(location?.line, 100_000, 1);
  const column = bounded(location?.column, 100_000, 1);
  return file && line && (column !== null || location?.column == null) ? { file, line, column } : null;
}
export function safeTestRecord(test, result, steps = []) {
  const file = repositoryFile(test?.location?.file);
  const testId = identities.get(`${file}\0${typeof test?.title === 'string' ? test.title : ''}`) || 'UNKNOWN_TEST';
  const locations = [...steps.slice(0, 8), ...(Array.isArray(result?.errors) ? result.errors.slice(0, 8).map(error => error?.location) : [])];
  const failureLocations = [];
  for (const location of locations) {
    const safe = safeLocation(location);
    if (safe && !failureLocations.some(item => JSON.stringify(item) === JSON.stringify(safe))) failureLocations.push(safe);
    if (failureLocations.length === 8) break;
  }
  return { testId, status: statuses.has(result?.status) ? result.status : 'unknown',
    retry: bounded(result?.retry, 10), durationMs: bounded(result?.duration, 3_600_000), failureLocations };
}
export function reporterDestination(receipt, phase) {
  const filename = phase === 'first-login-onboarding' ? 'onboarding-tests.json'
    : phase === 'authenticated-personas' ? 'persona-tests.json' : null;
  if (!filename || typeof receipt !== 'string' || !isAbsolute(receipt) || receipt !== resolve(receipt) || basename(receipt) !== 'acceptance.json'
    || !/^praxis-emulator-[A-Za-z0-9_-]+$/.test(basename(dirname(receipt)))) throw new Error('SAFE_REPORTER_DESTINATION_INVALID');
  return join(dirname(receipt), filename);
}

// Strict projection only. Never emit errors, step titles, attachments, source
// snippets, stacks, runtime values or arbitrary result/config properties.
export default class SafeReporter {
  constructor(options = {}) {
    this.phase = options.phase ?? process.env.PRAXIS_EMULATOR_SUITE;
    this.destination = reporterDestination(options.receipt ?? process.env.PRAXIS_EMULATOR_RECEIPT, this.phase);
    this.tests = [];
    this.steps = new WeakMap();
    this.status = 'running';
    this.globalError = false;
  }
  printsToStdio() { return false; }
  persist() {
    try {
      writeFileSync(`${this.destination}.tmp`, JSON.stringify({ schemaVersion: 1, phase: this.phase,
        status: this.status, globalError: this.globalError, tests: this.tests, hostedAcceptance: false }, null, 2));
      renameSync(`${this.destination}.tmp`, this.destination);
    } catch { /* Reporting cannot replace the original suite outcome. */ }
  }
  onBegin() { this.persist(); }
  onStepEnd(test, _result, step) {
    if (!step?.error) return;
    const locations = this.steps.get(test) || [];
    for (const candidate of [step.location, step.error.location]) {
      const safe = safeLocation(candidate);
      if (safe && locations.length < 8) locations.push({ ...safe, file: join(root, safe.file) });
    }
    this.steps.set(test, locations);
  }
  onTestEnd(test, result) {
    if (this.tests.length < 8) this.tests.push(safeTestRecord(test, result, this.steps.get(test) || []));
    this.steps.delete(test);
    this.persist();
  }
  onError(_error) { this.globalError = true; this.persist(); }
  onEnd(result) { this.status = runStatuses.has(result?.status) ? result.status : 'unknown'; this.persist(); }
}
