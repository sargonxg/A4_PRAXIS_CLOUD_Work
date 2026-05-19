import { describe, expect, it } from 'vitest';
import { evaluateAuthenticatedRuntimePreflight } from '../../../scripts/run-authenticated-runtime-lane';

describe('authenticated runtime preflight', () => {
  it('reports missing browser credentials as blocked with exact env var names', () => {
    const result = evaluateAuthenticatedRuntimePreflight({
      env: {},
      capture: () => ({ ok: true, output: 'praxisbytacitus' }),
    });

    expect(result.status).toBe('blocked');
    expect(result.missingEnvVars).toEqual(['TEST_FIREBASE_EMAIL', 'TEST_FIREBASE_PASSWORD']);
    expect(result.checks.find((check) => check.name === 'TEST_FIREBASE_EMAIL')?.status).toBe('blocked');
    expect(result.checks.find((check) => check.name === 'TEST_FIREBASE_PASSWORD')?.status).toBe('blocked');
  });
});
