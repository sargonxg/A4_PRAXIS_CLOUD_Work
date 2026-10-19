import { open, rename, writeFile } from 'node:fs/promises';

export const MAX_PRIVATE_LOG_TAIL_BYTES = 64 * 1024;
const phases = new Set(['cli-bootstrap', 'auth-seed', 'app-start', 'node-egress-proof', 'browser-launch',
  'browser-egress-proof', 'first-login-onboarding', 'synthetic-prerequisites', 'authenticated-personas',
  'onboarding-persistence', 'complete', 'unknown-bootstrap']);
const stages = new Set(['java-version', 'build', 'emulator-acceptance']);
const messages = Object.freeze({
  BROWSER_EXECUTABLE_MISSING: 'Playwright browser executable is absent from its configured cache.',
  BROWSER_DEPENDENCIES_MISSING: 'Playwright reported missing browser host dependencies.',
  JAVA_RUNTIME_INCOMPATIBLE: 'The emulator reported an incompatible Java runtime.',
  EMULATOR_PORT_IN_USE: 'A required local emulator port is unavailable.',
  FIRESTORE_STARTUP_FAILED: 'The Firestore emulator reported a startup failure.',
  ISOLATED_EGRESS_BLOCKED: 'The isolated network guard rejected a non-lane connection.',
  AUTH_SEED_FAILED: 'Synthetic Auth emulator account creation failed.',
  APP_START_FAILED: 'The local application failed before readiness.',
  NODE_EGRESS_PROOF_FAILED: 'The Node external-egress rejection proof failed.',
  BROWSER_LAUNCH_FAILED: 'The isolated browser failed to launch.',
  BROWSER_EGRESS_PROOF_FAILED: 'The browser external-egress rejection proof failed.',
  ONBOARDING_SUITE_FAILED: 'The unchanged first-login onboarding suite failed.',
  SYNTHETIC_PREREQUISITES_FAILED: 'Authenticated synthetic draft prerequisite setup failed.',
  AUTHENTICATED_SUITE_FAILED: 'The unchanged authenticated suites failed.',
  ONBOARDING_PERSISTENCE_FAILED: 'The emulator onboarding persistence assertion failed.',
  UNKNOWN_STARTUP_FAILURE: 'Startup failed without a recognized safe diagnostic.',
  STAGE_FAILED: 'An isolated emulator lane stage failed.',
});
const phaseFailures = {
  'auth-seed': 'AUTH_SEED_FAILED', 'app-start': 'APP_START_FAILED', 'node-egress-proof': 'NODE_EGRESS_PROOF_FAILED',
  'browser-launch': 'BROWSER_LAUNCH_FAILED', 'browser-egress-proof': 'BROWSER_EGRESS_PROOF_FAILED',
  'first-login-onboarding': 'ONBOARDING_SUITE_FAILED', 'synthetic-prerequisites': 'SYNTHETIC_PREREQUISITES_FAILED',
  'authenticated-personas': 'AUTHENTICATED_SUITE_FAILED', 'onboarding-persistence': 'ONBOARDING_PERSISTENCE_FAILED',
};

/** Return only a fixed code; never copy a private log/error fragment into JSON. */
export function classifyBootstrapFailure(text, phase = 'unknown-bootstrap') {
  const tail = typeof text === 'string' ? text.slice(-MAX_PRIVATE_LOG_TAIL_BYTES) : '';
  if (/Executable doesn't exist at/i.test(tail)) return 'BROWSER_EXECUTABLE_MISSING';
  if (/Host system is missing dependencies to run browsers/i.test(tail)) return 'BROWSER_DEPENDENCIES_MISSING';
  if (/UnsupportedClassVersionError/i.test(tail)) return 'JAVA_RUNTIME_INCOMPATIBLE';
  if (/EADDRINUSE|port [0-9]+ is not open|port [0-9]+ is already in use/i.test(tail)) return 'EMULATOR_PORT_IN_USE';
  if (/Could not start Firestore Emulator|Firestore Emulator has exited with code: 1/i.test(tail)) return 'FIRESTORE_STARTUP_FAILED';
  if (/Non-lane network connection blocked by isolated emulator guard/i.test(tail)) return 'ISOLATED_EGRESS_BLOCKED';
  return Object.hasOwn(phaseFailures, phase) ? phaseFailures[phase] : 'UNKNOWN_STARTUP_FAILURE';
}

export function bootstrapRecord(phase, status, failureCode = '') {
  const safePhase = phases.has(phase) ? phase : 'unknown-bootstrap';
  const safeStatus = ['started', 'passed', 'failed'].includes(status) ? status : 'failed';
  const code = Object.hasOwn(messages, failureCode) ? failureCode : 'UNKNOWN_STARTUP_FAILURE';
  return { schemaVersion: 1, phase: safePhase, status: safeStatus,
    ...(safeStatus === 'failed' ? { failureCode: code, message: messages[code] } : {}), hostedAcceptance: false };
}

/** Strict projection: unknown fields, codes, messages, destinations and secrets cannot pass through. */
export function failureRecord(stage, bootstrap, privateTail, processCode, rootExit) {
  const data = bootstrap && typeof bootstrap === 'object' ? bootstrap : {};
  const phase = phases.has(data.phase) ? data.phase : 'unknown-bootstrap';
  const code = stage !== 'emulator-acceptance' ? 'STAGE_FAILED'
    : data.status === 'failed' && Object.hasOwn(messages, data.failureCode) ? data.failureCode
      : classifyBootstrapFailure(privateTail, phase);
  return { schemaVersion: 1, stage: stages.has(stage) ? stage : 'emulator-acceptance', phase, status: 'failed',
    failureCode: code, message: messages[code],
    processFailureCode: ['OWNED_DESCENDANTS_UNVERIFIED', 'PROCESS_ERROR', 'ENOENT', 'EACCES', 'EPERM'].includes(processCode)
      ? processCode : 'PROCESS_ERROR',
    rootExit: Number.isInteger(rootExit) && rootExit >= -128 && rootExit <= 255 ? rootExit : null,
    descendantCleanupVerified: processCode === 'OWNED_DESCENDANTS_UNVERIFIED' ? false : null,
    hostedAcceptance: false };
}

/** At most 64 KiB are read from a private file, regardless of its total size. */
export async function readPrivateLogTail(path) {
  let file;
  try {
    file = await open(path, 'r');
    const size = (await file.stat()).size;
    const buffer = Buffer.alloc(Math.min(size, MAX_PRIVATE_LOG_TAIL_BYTES));
    const { bytesRead } = await file.read(buffer, 0, buffer.length, Math.max(0, size - buffer.length));
    return buffer.subarray(0, bytesRead).toString('utf8');
  } catch { return ''; }
  finally { await file?.close().catch(() => {}); }
}

/** Reporting failure must never replace the application's original exception. */
export async function persistSafeReceipt(path, record) {
  try {
    const input = record && typeof record === 'object' ? record : {};
    const safe = Object.hasOwn(input, 'stage')
      ? failureRecord(input.stage, input, '', input.processFailureCode, input.rootExit)
      : bootstrapRecord(input.phase, input.status, input.failureCode);
    await writeFile(`${path}.tmp`, JSON.stringify(safe, null, 2));
    await rename(`${path}.tmp`, path);
    return true;
  } catch { return false; }
}
