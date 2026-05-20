import { describe, expect, it } from 'vitest';
import { buildAppDiagnosticSummary } from '@/lib/diagnostics/app-red-flags';

describe('app diagnostic red flags', () => {
  it('classifies missing env, stale graphify, blocked research, and healthy runtime', () => {
    const summary = buildAppDiagnosticSummary({
      runtimeHealth: { status: 'ok', summary: 'Runtime ready', checkedAt: '2026-05-20T00:00:00.000Z', checks: [] },
      agenticSearchHealth: { status: 'blocked', summary: 'Agentic search blocked', checkedAt: '2026-05-20T00:00:00.000Z', missing: ['Cloud SQL URL'], checks: [] },
      graphFreshness: { status: 'stale', detail: 'Graphify built from abc123 but HEAD is def456.' },
      authCanary: { missingEnvVars: ['TEST_FIREBASE_EMAIL', 'TEST_FIREBASE_PASSWORD'] },
      appSearchAudit: { status: 'ok', detail: 'Search contracts passed.' },
    });

    expect(summary.groups.Runtime[0]).toMatchObject({ status: 'healthy' });
    expect(summary.groups['Agentic research'][0]).toMatchObject({ status: 'blocked', source: 'local audit' });
    expect(summary.groups['Graph/provenance'][0]).toMatchObject({ status: 'stale' });
    expect(summary.groups['Auth canary'][0]).toMatchObject({
      status: 'needs-auth',
      detail: expect.stringContaining('TEST_FIREBASE_EMAIL'),
    });
  });

  it('redacts raw env values from diagnostic details and repair actions', () => {
    const summary = buildAppDiagnosticSummary({
      authCanary: { missingEnvVars: ['TEST_FIREBASE_EMAIL'], presentEnvVars: ['TEST_FIREBASE_PASSWORD=secret-value'] },
    });
    const rendered = JSON.stringify(summary);

    expect(rendered).toContain('TEST_FIREBASE_EMAIL');
    expect(rendered).not.toContain('secret-value');
  });
});
