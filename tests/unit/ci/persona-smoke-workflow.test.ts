import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('persona-smoke GitHub workflow', () => {
  const source = readFileSync(join(process.cwd(), '.github/workflows/persona-smoke.yml'), 'utf8');
  const authDocs = readFileSync(join(process.cwd(), 'docs/testing/AUTHENTICATED_RUNTIME_TEST_LANE.md'), 'utf8');

  it('requires disposable Firebase secrets so authenticated E2E actually gates CI', () => {
    expect(source).toContain('cron:');
    expect(source).toContain('Verify Firebase disposable test credentials');
    expect(source).toContain('TEST_FIREBASE_EMAIL');
    expect(source).toContain('TEST_FIREBASE_PASSWORD');
    expect(source).toContain('GitHub Actions secrets TEST_FIREBASE_EMAIL and TEST_FIREBASE_PASSWORD are required');
    expect(source).not.toContain("if: ${{ env.TEST_FIREBASE_EMAIL != '' && env.TEST_FIREBASE_PASSWORD != '' }}");
    expect(source).toContain('npm run smoke:authenticated-app');
    expect(source).toContain('Run live authenticated agentic canary');
    expect(source).toContain('PRAXIS_DOCTOR_WRITE_CANARY: "1"');
    expect(source).toContain('npm run doctor:praxis:canary');
  });

  it('documents the GitHub Actions secret setup without committing values', () => {
    expect(authDocs).toContain('GitHub Actions secrets');
    expect(authDocs).toContain('TEST_FIREBASE_EMAIL');
    expect(authDocs).toContain('TEST_FIREBASE_PASSWORD');
    expect(authDocs).toContain('PRAXIS_DOCTOR_WRITE_CANARY=1');
    expect(authDocs).toContain('doctor:praxis:canary');
    expect(authDocs).toContain('Do not commit');
  });
});
