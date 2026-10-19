import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isIsolatedNetworkRejection } from '../../../../scripts/emulators/egress-proof.mjs';

describe('causal emulator egress proof', () => {
  it('rejects generic offline failures and finds guard errors inside nested causes', () => {
    expect(isIsolatedNetworkRejection(new TypeError('fetch failed'))).toBe(false);
    expect(isIsolatedNetworkRejection(new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND') }))).toBe(false);
    const guard = new Error('Non-lane network connection blocked by isolated emulator guard');
    expect(isIsolatedNetworkRejection(new TypeError('fetch failed', { cause: new AggregateError([guard]) }))).toBe(true);
    const cycle: { cause?: unknown } = {}; cycle.cause = cycle;
    expect(isIsolatedNetworkRejection(cycle)).toBe(false);
  });

  it('observes interception of real fetch calls in the guarded runtime', () => {
    const proof = pathToFileURL(resolve('scripts/emulators/egress-proof.mjs')).href;
    const result = spawnSync(process.execPath, ['--require', resolve('scripts/emulators/loopback-only.js'), '--input-type=module', '-e', `
      import assert from 'node:assert/strict';
      import { isIsolatedNetworkRejection } from ${JSON.stringify(proof)};
      for (const url of ['https://identitytoolkit.googleapis.com/egress-probe', 'https://generativelanguage.googleapis.com/egress-probe']) {
        await assert.rejects(fetch(url), isIsolatedNetworkRejection);
      }
    `], { env: { NODE_ENV: 'test', PATH: process.env.PATH, PRAXIS_EMULATOR_MODE: 'local-ci', GCLOUD_PROJECT: 'demo-praxis-ci',
      FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080' } });
    expect(result.status, result.stderr.toString()).toBe(0);
  });
});
