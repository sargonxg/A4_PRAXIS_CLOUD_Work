import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { bootstrapRecord, classifyBootstrapFailure, failureRecord, MAX_PRIVATE_LOG_TAIL_BYTES,
  persistSafeReceipt, readPrivateLogTail } from '../../../../scripts/emulators/bootstrap-receipt.mjs';

const secrets = ['synthetic-password-not-real', 'synthetic-cookie-not-real',
  'eyJhbGciOiJub25lIn0.eyJzdWIiOiJzeW50aGV0aWMifQ.fake', 'synthetic-query-not-real'];
const privateText = `Executable doesn't exist at /private/cache\npassword=${secrets[0]}\nCookie: ${secrets[1]}\nBearer ${secrets[2]}\nhttps://example.invalid/?token=${secrets[3]}`;

describe('safe emulator bootstrap diagnostics', () => {
  it('reports a fixed browser-missing code without copying any secret, JWT, Bearer or query text', () => {
    const code = classifyBootstrapFailure(privateText, 'browser-launch');
    const record = bootstrapRecord('browser-launch', 'failed', code);
    expect(record.failureCode).toBe('BROWSER_EXECUTABLE_MISSING');
    for (const secret of secrets) expect(JSON.stringify(record)).not.toContain(secret);
    expect(JSON.stringify(record)).not.toContain('/private/cache');
  });
  it('retains primary startup failure separately from conservative process cleanup status', () => {
    const record = failureRecord('emulator-acceptance', bootstrapRecord('browser-launch', 'failed', 'BROWSER_EXECUTABLE_MISSING'),
      privateText, 'OWNED_DESCENDANTS_UNVERIFIED', 1);
    expect(record.failureCode).toBe('BROWSER_EXECUTABLE_MISSING');
    expect(record.processFailureCode).toBe('OWNED_DESCENDANTS_UNVERIFIED');
    expect(record.descendantCleanupVerified).toBe(false);
    expect(record.rootExit).toBe(1);
  });
  it('maps unknown phases, errors and process codes to fixed outputs without passthrough', () => {
    const record = failureRecord('emulator-acceptance', { phase: privateText, status: 'failed', failureCode: privateText },
      secrets.join(' '), privateText, privateText);
    expect(record.phase).toBe('unknown-bootstrap');
    expect(record.failureCode).toBe('UNKNOWN_STARTUP_FAILURE');
    expect(record.processFailureCode).toBe('PROCESS_ERROR');
    expect(record.rootExit).toBeNull();
    for (const secret of secrets) expect(JSON.stringify(record)).not.toContain(secret);
  });
  it('identifies only known startup classes and otherwise retains the exact bounded phase', () => {
    expect(classifyBootstrapFailure('Host system is missing dependencies to run browsers')).toBe('BROWSER_DEPENDENCIES_MISSING');
    expect(classifyBootstrapFailure('java.lang.UnsupportedClassVersionError')).toBe('JAVA_RUNTIME_INCOMPATIBLE');
    expect(classifyBootstrapFailure('EADDRINUSE')).toBe('EMULATOR_PORT_IN_USE');
    expect(classifyBootstrapFailure('unknown private error', 'auth-seed')).toBe('AUTH_SEED_FAILED');
    expect(classifyBootstrapFailure('unknown private error')).toBe('UNKNOWN_STARTUP_FAILURE');
  });
  it('reads at most the private tail and strictly projects persisted fields', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'praxis-bootstrap-test-'));
    try {
      const log = join(directory, 'private.log'), output = join(directory, 'safe.json');
      await writeFile(log, 'x'.repeat(MAX_PRIVATE_LOG_TAIL_BYTES * 3) + privateText);
      const tail = await readPrivateLogTail(log);
      expect(Buffer.byteLength(tail)).toBeLessThanOrEqual(MAX_PRIVATE_LOG_TAIL_BYTES);
      expect(tail).toContain("Executable doesn't exist at");
      await persistSafeReceipt(output, { ...bootstrapRecord('browser-launch', 'failed', 'BROWSER_EXECUTABLE_MISSING'),
        error: privateText, password: secrets[0], cookie: secrets[1] });
      const saved = await readFile(output, 'utf8');
      expect(JSON.parse(saved).failureCode).toBe('BROWSER_EXECUTABLE_MISSING');
      for (const secret of secrets) expect(saved).not.toContain(secret);
      expect(saved).not.toContain('"error"');
      await persistSafeReceipt(output, { ...failureRecord('emulator-acceptance', JSON.parse(saved), tail,
        'OWNED_DESCENDANTS_UNVERIFIED', 1), rawLog: privateText });
      const wrapper = JSON.parse(await readFile(output, 'utf8'));
      expect(wrapper.phase).toBe('browser-launch');
      expect(wrapper.failureCode).toBe('BROWSER_EXECUTABLE_MISSING');
      expect(wrapper.processFailureCode).toBe('OWNED_DESCENDANTS_UNVERIFIED');
      expect(wrapper.descendantCleanupVerified).toBe(false);
      expect(wrapper).not.toHaveProperty('rawLog');
      for (const secret of secrets) expect(JSON.stringify(wrapper)).not.toContain(secret);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  it('cannot replace the original error when diagnostic persistence fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'praxis-bootstrap-error-'));
    try {
      const original = new Error('original synthetic failure');
      const run = async () => {
        try { throw original; }
        catch (error) {
          expect(await persistSafeReceipt(join(directory, 'absent', 'safe.json'), bootstrapRecord('auth-seed', 'failed', 'AUTH_SEED_FAILED'))).toBe(false);
          throw error;
        }
      };
      await expect(run()).rejects.toBe(original);
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
