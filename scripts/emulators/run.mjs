import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { finished, pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { emulatorEnvironment, FIREBASE_TOOLS_VERSION, FIRESTORE_BINARY } from './environment.mjs';
import { runBoundedChild } from './bounded-process.mjs';
import { bootstrapRecord, failureRecord, persistSafeReceipt, readPrivateLogTail } from './bootstrap-receipt.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const overall = new AbortController();
const overallTimer = setTimeout(() => overall.abort(), 36 * 60_000);
overallTimer.unref();
process.chdir(root);
if (!process.versions.node.startsWith('22.')) throw new Error('Use the reviewed Node 22 runtime');
for (const name of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  if (await access(join(root, name)).then(() => true, () => false)) throw new Error('Use a clean isolated checkout without private environment files');
}
const runtime = await mkdtemp(join(process.env.PRAXIS_EMULATOR_OUTPUT || tmpdir(), 'praxis-emulator-'));
const env = emulatorEnvironment(process.env, runtime);
await mkdir(env.XDG_CONFIG_HOME, { recursive: true });
const cli = process.env.PRAXIS_FIREBASE_CLI;
if (!cli || !isAbsolute(cli)) throw new Error('Set PRAXIS_FIREBASE_CLI to the isolated pinned CLI JavaScript entry point');
const cliPackage = JSON.parse(await readFile(resolve(dirname(cli), '../../package.json'), 'utf8'));
if (cliPackage.name !== 'firebase-tools' || cliPackage.version !== FIREBASE_TOOLS_VERSION) throw new Error('Firebase CLI version differs from reviewed pin');
const npm = process.env.npm_execpath || process.env.PRAXIS_NPM_CLI;
if (!npm || !isAbsolute(npm)) throw new Error('Run through npm or supply the local npm CLI path');
for (const port of [3000, 3139, 4400, 4500, 8080, 9099, 9150]) {
  await new Promise((resolve, reject) => {
    const server = createServer(); server.once('error', () => reject(new Error(`Owned emulator port ${port} is unavailable`)));
    server.listen(port, '127.0.0.1', () => server.close(resolve));
  });
}
const receipts = [];
let lastFailure;
const implementationSha256 = {};
const sourceFiles = new Set(execFileSync('git', ['ls-files', '--', 'src', 'public', 'package*.json', 'next.config.*',
  'tsconfig*.json', 'firestore.rules', 'firestore.indexes.json'], { encoding: 'utf8', cwd: root }).trim().split(/\r?\n/).filter(Boolean));
for (const file of ['src/lib/firebase/emulator-config.ts', 'src/lib/firebase/admin.ts', 'src/lib/firebase/config.ts',
  'src/lib/auth/current-token.ts', 'src/proxy.ts', 'scripts/emulators/environment.mjs', 'scripts/emulators/run.mjs',
  'scripts/emulators/accept.mjs', 'scripts/emulators/loopback-only.js', 'scripts/emulators/egress-proof.mjs',
  'scripts/emulators/bounded-process.mjs', 'scripts/emulators/seed-prerequisites.mjs', 'firebase.emulators.json',
  'scripts/emulators/bootstrap-receipt.mjs', 'tests/unit/lib/firebase/emulator-bootstrap-receipt.test.ts',
  'scripts/emulators/safe-reporter.mjs', 'tests/unit/lib/firebase/emulator-safe-reporter.test.ts',
  'tests/emulators/playwright.config.ts', 'src/components/praxis/tasklet-workbench-history.ts',
  'src/components/praxis/use-workbench-conversation.ts', 'tests/unit/components/tasklet-workbench-history.test.ts',
  'tests/unit/hooks/use-workbench-conversation.test.ts', 'tests/unit/lib/ai/tasklet-stream-framing.test.ts',
  'tests/unit/components/tasklet-workbench-contract.test.ts', 'tests/e2e/onboarding.spec.ts',
  'tests/e2e/golden-path.spec.ts', 'tests/e2e/authenticated-app-post-login.spec.ts', 'tests/e2e/helpers/auth.ts',
  'tests/unit/lib/firebase/emulator-egress.test.ts', 'tests/unit/lib/firebase/emulator-process.test.ts',
  'tests/unit/lib/firebase/emulator-admin.test.ts', 'tests/unit/lib/firebase/emulator-config.test.ts',
  'tests/unit/lib/firebase/emulator-runner.test.ts', 'tests/unit/lib/auth/current-token.test.ts',
  '.github/workflows/persona-release-ci.yml', 'docs/testing/FIREBASE_EMULATOR_LANE.md']) sourceFiles.add(file);
for (const file of [...sourceFiles].sort()) {
  implementationSha256[file] = createHash('sha256').update(await readFile(join(root, file))).digest('hex');
}
await writeFile(join(runtime, 'source.json'), JSON.stringify({
  baseHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', cwd: root }).trim(),
  implementationSha256, meaning: 'Local implementation bytes; uncommitted work is not certified as the base commit',
}, null, 2), { flag: 'wx' });
async function run(label, executable, args, timeoutMs) {
  const logPath = join(runtime, `${label}.log`);
  const started = Date.now(); const log = createWriteStream(logPath, { flags: 'wx' });
  const flushed = finished(log).catch(error => error);
  let result, originalError;
  try {
    result = await runBoundedChild(executable, args, { env, cwd: root, stdout: log, stderr: log, timeoutMs, signal: overall.signal });
  } catch (error) {
    originalError = error;
  } finally {
    log.end();
    const flushError = await flushed;
    if (flushError) originalError ??= flushError;
  }
  if (originalError) {
    let bootstrap;
    try { bootstrap = JSON.parse(await readPrivateLogTail(join(runtime, 'bootstrap.json'))); } catch { /* fixed unknown phase below */ }
    lastFailure = failureRecord(label, bootstrap, await readPrivateLogTail(logPath), originalError?.code, originalError?.rootExit);
    await persistSafeReceipt(join(runtime, 'failure.json'), lastFailure);
    receipts.push({ label, exit: lastFailure.rootExit, status: 'process-error', failureCode: lastFailure.processFailureCode,
      primaryFailureCode: lastFailure.failureCode, bootstrapPhase: lastFailure.phase,
      descendantCleanupVerified: lastFailure.descendantCleanupVerified,
      timeoutMs, elapsedMs: Date.now() - started });
    await writeFile(join(runtime, 'stages.json'), JSON.stringify(receipts, null, 2)).catch(() => {});
    throw originalError;
  }
  const { exit, timedOut } = result;
  receipts.push({ label, exit, timedOut, timeoutMs, elapsedMs: Date.now() - started });
  await writeFile(join(runtime, 'stages.json'), JSON.stringify(receipts, null, 2));
  if (timedOut || exit !== 0) throw new Error(`Emulator lane ${label} ${timedOut ? 'timed out' : 'failed'}; inspect the task-local log`);
}
try {
  await run('java-version', join(env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'), ['-version'], 30_000);
  const javaVersion = (await readFile(join(runtime, 'java-version.log'), 'utf8')).match(/version "(21\.[^"]+)"/)?.[1];
  if (!javaVersion) throw new Error('Java 21 is required');
  await mkdir(env.FIREBASE_EMULATORS_PATH, { recursive: true });
  const binary = join(env.FIREBASE_EMULATORS_PATH, FIRESTORE_BINARY.name);
  if (!await access(binary).then(() => true, () => false)) {
    const signal = AbortSignal.any([overall.signal, AbortSignal.timeout(120_000)]);
    const response = await fetch(`https://storage.googleapis.com/firebase-preview-drop/emulator/${FIRESTORE_BINARY.name}`, { signal });
    if (!response.ok || !response.body) throw new Error('Could not obtain the pinned public emulator binary');
    await pipeline(Readable.fromWeb(response.body), createWriteStream(binary, { flags: 'wx' }), { signal });
  }
  const hash = createHash('sha256'); for await (const chunk of createReadStream(binary)) hash.update(chunk);
  if (hash.digest('hex') !== FIRESTORE_BINARY.sha256) throw new Error('Firestore emulator SHA-256 differs from reviewed pin');
  await writeFile(join(runtime, 'tooling.json'), JSON.stringify({ node: process.version, java: javaVersion,
    firebaseTools: cliPackage.version, firestore: FIRESTORE_BINARY, platform: process.platform,
    explicitBrowserCache: Boolean(env.PLAYWRIGHT_BROWSERS_PATH) }, null, 2));
  await run('build', process.execPath, [npm, 'run', 'build'], 25 * 60_000);
  await writeFile(join(runtime, 'build-mode.json'), JSON.stringify({
    buildId: (await readFile(join(root, '.next/BUILD_ID'), 'utf8')).trim(),
    mode: 'emulator-configured production compilation for local acceptance only',
    deploymentArtifact: false, hostedAcceptance: false,
  }, null, 2), { flag: 'wx' });
  // This fixed command starts only the two local emulators. It never logs in,
  // imports a production export, deploys rules, or dispatches a hosted operation.
  await persistSafeReceipt(join(runtime, 'bootstrap.json'), bootstrapRecord('cli-bootstrap', 'started'));
  await run('emulator-acceptance', process.execPath, [cli, 'emulators:exec', '--only', 'auth,firestore',
    '--project', 'demo-praxis-ci', '--config', 'firebase.emulators.json', '--non-interactive',
    'node --experimental-strip-types --require ./scripts/emulators/loopback-only.js scripts/emulators/accept.mjs'], 8 * 60_000);
  console.log(JSON.stringify({ status: 'emulator-only-accepted', receiptFolder: runtime, hostedAcceptance: false }));
} catch {
  const safe = lastFailure ?? failureRecord('emulator-acceptance', null, '', 'PROCESS_ERROR', null);
  console.error(JSON.stringify({ status: 'failed', receiptFolder: runtime, failureCode: safe.failureCode,
    processFailureCode: safe.processFailureCode, reason: safe.message, hostedAcceptance: false }));
  process.exitCode = 1;
} finally {
  clearTimeout(overallTimer);
}
