import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { resolveServerEmulators } from '../../src/lib/firebase/emulator-config.ts';
import { isIsolatedNetworkRejection } from './egress-proof.mjs';
import { seedGoldenPrerequisites } from './seed-prerequisites.mjs';

const config = resolveServerEmulators(process.env);
if (!config) throw new Error('Isolated emulator configuration is required');
const receipt = process.env.PRAXIS_EMULATOR_RECEIPT;
if (!receipt) throw new Error('Missing task-local receipt path');
const { initializeApp, deleteApp } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
const { getFirestore } = await import('firebase-admin/firestore');
let app, db, proxy, server, log, closed;
let deniedRequests = 0;
const stages = [];
try {
  app = initializeApp({ projectId: config.projectId });
  const auth = getAuth(app); db = getFirestore(app);
  // Deliberately synthetic, fresh emulator-only identity. Server profile creation
  // and onboarding persistence happen through unchanged real application routes.
  const uid = 'emulator-persona-user';
  await auth.createUser({ uid, email: process.env.TEST_FIREBASE_EMAIL, password: process.env.TEST_FIREBASE_PASSWORD, emailVerified: true });
  proxy = createServer((_req, res) => { deniedRequests++; res.writeHead(403); res.end('External requests disabled in isolated tests'); });
  proxy.on('connect', (_request, socket) => { deniedRequests++; socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); });
  await new Promise((resolve, reject) => { proxy.once('error', reject); proxy.listen(3139, '127.0.0.1', resolve); });
  log = createWriteStream(join(dirname(receipt), 'app-server.log'), { flags: 'wx' });
  // Use the existing production server command with complete .next/static and
  // public assets in the checkout; this is not standalone-image acceptance.
  server = spawn(process.execPath, ['--require', './scripts/emulators/loopback-only.js', 'node_modules/next/dist/bin/next',
    'start', '--hostname', '127.0.0.1', '--port', '3000'],
  { env: process.env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  server.stdout.pipe(log, { end: false }); server.stderr.pipe(log, { end: false });
  closed = new Promise(resolve => { server.once('close', resolve); server.once('error', resolve); });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error('Local application exited before readiness');
    try { ready = (await fetch('http://127.0.0.1:3000')).ok; } catch { /* bounded readiness only */ }
    if (ready) break; await delay(1000);
  }
  assert.ok(ready, 'Local application did not become ready');
  // Prove that Node cannot send Firebase/provider traffic beyond loopback.
  for (const url of ['https://identitytoolkit.googleapis.com/egress-probe', 'https://generativelanguage.googleapis.com/egress-probe']) {
    await assert.rejects(fetch(url), isIsolatedNetworkRejection);
  }
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ proxy: { server: 'http://127.0.0.1:3139', bypass: '127.0.0.1,localhost' }, serviceWorkers: 'block' });
    for (const url of ['https://identitytoolkit.googleapis.com/egress-probe', 'https://generativelanguage.googleapis.com/egress-probe']) {
      const before = deniedRequests; await assert.rejects(page.goto(url));
      assert.ok(deniedRequests > before, 'Browser external request did not reach the rejecting local proxy');
    }
  } finally { await browser.close(); }
  const suites = [
    // Exercise the first-login branch before another suite persists its skip.
    ['first-login-onboarding', 'tests/e2e/onboarding.spec.ts'],
    // Every remaining assertion runs once; no duplicate golden-path invocation.
    ['authenticated-personas', 'tests/e2e/golden-path.spec.ts', 'tests/e2e/authenticated-app-post-login.spec.ts'],
  ];
  for (const [label, ...files] of suites) {
    const started = Date.now();
    const child = spawn(process.execPath, ['--require', './scripts/emulators/loopback-only.js', 'node_modules/@playwright/test/cli.js',
      'test', ...files, '--config=tests/emulators/playwright.config.ts', '--workers=1', '--retries=0'],
    { env: process.env, stdio: 'inherit', windowsHide: true });
    const [exit] = await once(child, 'close'); stages.push({ label, exit, elapsedMs: Date.now() - started });
    if (exit !== 0) throw new Error(`Unchanged authenticated suite ${label} failed`);
    if (label === 'first-login-onboarding') {
      const setupStarted = Date.now();
      const fixture = await seedGoldenPrerequisites(chromium, uid);
      await writeFile(join(dirname(receipt), 'synthetic-prerequisites.json'), JSON.stringify(fixture, null, 2), { flag: 'wx' });
      stages.push({ label: 'synthetic-private-draft-prerequisites', exit: 0, elapsedMs: Date.now() - setupStarted });
    }
  }
  const profile = await db.doc(`users/${uid}/profile/analyst`).get();
  assert.ok(profile.exists && profile.data()?.meta?.skipCount >= 1, 'Onboarding reminder was not persisted in the actual emulator database');
  await writeFile(receipt, JSON.stringify({ project: config.projectId, stages, serverEgressGuardVerified: true,
    browserEgressGuardVerified: true, deniedRequests, onboardingSkipPersisted: true,
    identity: 'fresh synthetic Auth emulator account', hostedAcceptance: false,
    limitations: ['Local emulator transport only; no hosted Firebase/reCAPTCHA/provider/production rules acceptance.',
      'Existing golden-path model/boardroom/export mocks are unchanged.'] }, null, 2), { flag: 'wx' });
} finally {
  if (server && server.exitCode === null) {
    server.kill();
    if (!await Promise.race([closed.then(() => true), delay(10_000).then(() => false)])) {
      server.kill('SIGKILL');
      if (!await Promise.race([closed.then(() => true), delay(5_000).then(() => false)])) throw new Error('Owned app process did not stop');
    }
  }
  log?.end();
  if (proxy?.listening) {
    proxy.closeAllConnections();
    await new Promise(resolve => proxy.close(resolve));
  }
  if (db) await db.terminate();
  if (app) await deleteApp(app);
}
