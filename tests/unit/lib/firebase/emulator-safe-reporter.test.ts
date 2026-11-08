import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import SafeReporter, { classifyTestError, safeLocation, safeTestRecord, reporterDestination } from '../../../../scripts/emulators/safe-reporter.mjs';

const root = process.cwd();
const file = join(root, 'tests/e2e/golden-path.spec.ts');
const known = { title: 'sign in → chat → capsule library → boardroom → settings', location: { file, line: 35, column: 3 } };
const poison = 'synthetic-private-password-cookie-Bearer https://private.invalid/?token=fake';

describe('isolated safe Playwright reporter', () => {
  it('maps known file and title to a fixed ID and preserves only structured failure location', () => {
    const record = safeTestRecord(known, { status: 'failed', retry: 0, duration: 125,
      errors: [{ location: { file, line: 40, column: 7 }, message: poison, stack: poison, snippet: poison }] });
    expect(record).toEqual({ testId: 'GOLDEN_CORE_ROUTES', status: 'failed', retry: 0, durationMs: 125,
      failureLocations: [{ file: 'tests/e2e/golden-path.spec.ts', line: 40, column: 7 }], failureCodes: ['UNCLASSIFIED_ERROR'] });
    expect(JSON.stringify(record)).not.toContain(poison);
  });
  it('recognizes only the fixed emulator context-readiness case and its repository source location', () => {
    const file = join(root, 'tests/e2e/workbench-context-readiness.emulator.spec.ts');
    const record = safeTestRecord({ title: 'waits for owner context before sending the requested conversation turn', location: { file } },
      { status: 'failed', errors: [{ location: { file, line: 60 }, message: poison }] });
    expect(record.testId).toBe('WORKBENCH_CONTEXT_READINESS');
    expect(record.failureLocations).toEqual([{ file: 'tests/e2e/workbench-context-readiness.emulator.spec.ts', line: 60, column: null }]);
    expect(JSON.stringify(record)).not.toContain(poison);
  });
  it('rejects traversal, suffix spoofing, URLs, unknown files and malformed numbers', () => {
    for (const path of [file + '.private', join(root, '../private/auth.ts'), poison, 'https://private.invalid/auth.ts']) {
      expect(safeLocation({ file: path, line: 1, column: 1 })).toBeNull();
    }
    for (const line of [-1, 0, 1.5, Infinity, poison, 100001]) expect(safeLocation({ file, line, column: 1 })).toBeNull();
    expect(safeLocation({ file, line: 1, column: poison })).toBeNull();
  });
  it('never serializes unknown titles, error fields, attachments or malformed result fields', () => {
    const result = safeTestRecord({ ...known, title: poison }, { status: poison, retry: poison, duration: Infinity,
      errors: [{ message: poison, stack: poison, value: poison }], attachments: [{ path: poison }] });
    expect(result).toEqual({ testId: 'UNKNOWN_TEST', status: 'unknown', retry: null, durationMs: null, failureLocations: [], failureCodes: [] });
    expect(safeTestRecord(null, null)).toEqual(result);
    expect(safeTestRecord({ ...known, location: { ...known.location, file: join(root, 'tests/e2e/onboarding.spec.ts') } }, {} ).testId).toBe('UNKNOWN_TEST');
    const error = { location: { file, line: 40, column: 7 },
      get message() { throw new Error('Private message must never be read'); },
      get stack() { throw new Error('Private stack must never be read'); } };
    expect(safeTestRecord(known, { status: 'failed', errors: [null, error] }).failureLocations)
      .toEqual([{ file: 'tests/e2e/golden-path.spec.ts', line: 40, column: 7 }]);
  });
  it.each([
    ['route.fetch: read ECONNRESET', 'CONNECTION_RESET'],
    ['route.fetch: socket hang up', 'CONNECTION_RESET'],
    ['route.fetch: connect ECONNREFUSED 127.0.0.1:3000', 'CONNECTION_REFUSED'],
    ['route.fetch: Request context disposed.', 'REQUEST_CONTEXT_DISPOSED'],
    ['route.fetch: Target page, context or browser has been closed', 'BROWSER_CONTEXT_CLOSED'],
    ['route.fetch: Timeout 30000ms exceeded.', 'REQUEST_TIMEOUT'],
    ['Test timeout of 90000ms exceeded.', 'TEST_TIMEOUT'],
    ['Error: expect(received).toBe(expected)', 'ASSERTION_FAILED'],
    ['Non-lane network connection blocked by isolated emulator guard', 'ISOLATED_EGRESS_BLOCKED'],
    [poison, 'UNCLASSIFIED_ERROR'],
  ])('projects %s to a fixed category without exporting private context', (message, code) => {
    const error = { message: `${message}\n${poison}`, stack: poison, snippet: poison };
    expect(classifyTestError(error)).toBe(code);
    const result = safeTestRecord(known, { status: 'failed', errors: [error] });
    expect(result.failureCodes).toEqual([code]);
    expect(JSON.stringify(result)).not.toContain(poison);
    expect(JSON.stringify(result)).not.toContain(message);
  });
  it('reads no error getters and bounds classification and arbitrary step categories', () => {
    const error = { get message() { throw new Error(poison); }, get stack() { throw new Error(poison); } };
    expect(classifyTestError(error)).toBe('UNCLASSIFIED_ERROR');
    expect(classifyTestError({ message: 'x'.repeat(64 * 1024) + 'ECONNRESET' })).toBe('UNCLASSIFIED_ERROR');
    expect(safeTestRecord(known, { status: 'failed', errors: [] }, [], [poison, 'CONNECTION_RESET']).failureCodes)
      .toEqual(['CONNECTION_RESET']);
    expect(safeTestRecord(known, { status: 'passed', errors: [{ message: poison }] }, [], ['CONNECTION_RESET']).failureCodes)
      .toEqual([]);
    expect(safeTestRecord(known, { status: 'timedOut', errors: [] }).failureCodes).toEqual(['TEST_TIMEOUT']);
  });
  it('derives only two fixed filenames and refuses unknown phases or unsafe receipt paths', () => {
    const receipt = join(tmpdir(), 'praxis-emulator-unit', 'acceptance.json');
    expect(reporterDestination(receipt, 'first-login-onboarding')).toBe(join(tmpdir(), 'praxis-emulator-unit', 'onboarding-tests.json'));
    expect(reporterDestination(receipt, 'authenticated-personas')).toBe(join(tmpdir(), 'praxis-emulator-unit', 'persona-tests.json'));
    for (const [path, phase] of [[receipt, poison], ['relative/acceptance.json', 'authenticated-personas'],
      [join(tmpdir(), 'praxis-emulator-unit', 'other.json'), 'authenticated-personas'],
      [join(tmpdir(), 'praxis-emulator-unit') + '/nested/../acceptance.json', 'authenticated-personas']]) {
      expect(() => reporterDestination(path, phase)).toThrow('SAFE_REPORTER_DESTINATION_INVALID');
    }
  });
  it('retains a known failure line when column is absent but rejects a malformed present column', () => {
    expect(safeLocation({ file, line: 40 })).toEqual({ file: 'tests/e2e/golden-path.spec.ts', line: 40, column: null });
    expect(safeLocation({ file, line: 40, column: poison })).toBeNull();
  });
  it('records the Playwright full-run lowercase timeout status without accepting arbitrary statuses', () => {
    const reporter = new SafeReporter({ receipt: join(tmpdir(), 'praxis-emulator-unavailable-unit', 'acceptance.json'), phase: 'authenticated-personas' });
    reporter.onEnd({ status: 'timedout' });
    expect(reporter.status).toBe('timedout');
    reporter.onEnd({ status: poison });
    expect(reporter.status).toBe('unknown');
  });
  it('persists bounded fixed records after each case, including failed step locations, without private values', () => {
    const folder = mkdtempSync(join(tmpdir(), 'praxis-emulator-'));
    try {
      const reporter = new SafeReporter({ receipt: join(folder, 'acceptance.json'), phase: 'authenticated-personas' });
      reporter.onBegin();
      reporter.onStepEnd(known, {}, { error: { message: poison }, location: { file: join(root, 'tests/e2e/helpers/auth.ts'), line: 55, column: 3 }, title: poison });
      reporter.onTestEnd(known, { status: 'failed', retry: 0, duration: 1, errors: [{ message: poison }] });
      reporter.onError({ message: poison, stack: poison });
      reporter.onEnd({ status: 'failed', error: poison });
      const text = readFileSync(join(folder, 'persona-tests.json'), 'utf8');
      const data = JSON.parse(text);
      expect(data.tests[0].failureLocations).toEqual([{ file: 'tests/e2e/helpers/auth.ts', line: 55, column: 3 }]);
      expect(data.status).toBe('failed');
      expect(data.globalError).toBe(true);
      expect(data.tests).toHaveLength(1);
      expect(text).not.toContain(poison);
    } finally { rmSync(folder, { recursive: true, force: true }); }
  });
  it('retains the failed fetch category even when the final assertion has no underlying message', () => {
    const folder = mkdtempSync(join(tmpdir(), 'praxis-emulator-'));
    const file = join(root, 'tests/e2e/workbench-context-readiness.emulator.spec.ts');
    const readiness = { title: 'waits for owner context before sending the requested conversation turn', location: { file } };
    try {
      const reporter = new SafeReporter({ receipt: join(folder, 'acceptance.json'), phase: 'authenticated-personas' });
      reporter.onStepEnd(readiness, {}, { error: { message: `route.fetch: read ECONNRESET\n${poison}` }, location: { file, line: 39, column: 34 } });
      reporter.onTestEnd(readiness, { status: 'failed', retry: 0, duration: 1000, errors: [] });
      const text = readFileSync(join(folder, 'persona-tests.json'), 'utf8');
      const record = JSON.parse(text).tests[0];
      expect(record.testId).toBe('WORKBENCH_CONTEXT_READINESS');
      expect(record.failureLocations).toEqual([{ file: 'tests/e2e/workbench-context-readiness.emulator.spec.ts', line: 39, column: 34 }]);
      expect(record.failureCodes).toEqual(['CONNECTION_RESET']);
      expect(text).not.toContain(poison);
      expect(text).not.toContain('ECONNRESET');
    } finally { rmSync(folder, { recursive: true, force: true }); }
  });
  it('does not replace suite errors if receipt persistence is unavailable and caps output records', () => {
    const reporter = new SafeReporter({ receipt: join(tmpdir(), 'praxis-emulator-unavailable-unit', 'acceptance.json'), phase: 'authenticated-personas' });
    expect(() => reporter.onBegin()).not.toThrow();
    for (let i = 0; i < 100; i++) reporter.onTestEnd(known, { status: 'failed', errors: [] });
    expect(reporter.tests).toHaveLength(8);
    expect(() => reporter.onEnd({ status: 'failed' })).not.toThrow();
  });
});
