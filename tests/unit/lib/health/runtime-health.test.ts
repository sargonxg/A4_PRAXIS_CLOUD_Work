import { describe, expect, it } from 'vitest';
import {
  buildRuntimeHealthSummary,
  sanitizeRuntimeHealth,
  type RuntimeHealthCheck,
} from '@/lib/health/runtime-health';

const okChecks: RuntimeHealthCheck[] = [
  { id: 'frontend', label: 'Frontend runtime', status: 'ok', latencyMs: 1 },
  { id: 'firestore', label: 'Firestore', status: 'ok', latencyMs: 2 },
  { id: 'backend', label: 'Private backend', status: 'ok', latencyMs: 3 },
  { id: 'database', label: 'Backend checkpoint store', status: 'ok', latencyMs: 4 },
  { id: 'agent_platform', label: 'Vertex ADK', status: 'unconfigured' },
];

describe('runtime health summary', () => {
  it('returns ok when all critical checks are ok and optional integrations are unconfigured', () => {
    expect(buildRuntimeHealthSummary(okChecks, new Date('2026-05-17T12:00:00Z'))).toMatchObject({
      status: 'ok',
      summary: 'Systems ready',
      checkedAt: '2026-05-17T12:00:00.000Z',
    });
  });

  it('treats backend reachability failure as degraded', () => {
    const checks = okChecks.map((check) =>
      check.id === 'backend' ? { ...check, status: 'down' as const } : check,
    );

    expect(buildRuntimeHealthSummary(checks, new Date('2026-05-17T12:00:00Z')).status).toBe('degraded');
  });

  it('treats Firestore failure as down', () => {
    const checks = okChecks.map((check) =>
      check.id === 'firestore' ? { ...check, status: 'down' as const } : check,
    );

    expect(buildRuntimeHealthSummary(checks, new Date('2026-05-17T12:00:00Z')).status).toBe('down');
  });

  it('sanitizes public output by removing details, raw URLs, and environment names', () => {
    const report = buildRuntimeHealthSummary([
      {
        id: 'backend',
        label: 'Private backend',
        status: 'down',
        latencyMs: 12,
        detail: 'https://praxis-backend-abc.run.app failed because FIREBASE_SERVICE_ACCOUNT_KEY was missing',
        endpoint: 'https://praxis-backend-abc.run.app/agents/health',
      },
    ], new Date('2026-05-17T12:00:00Z'));

    const sanitized = sanitizeRuntimeHealth(report);
    const json = JSON.stringify(sanitized);
    expect(json).not.toContain('https://');
    expect(json).not.toContain('FIREBASE_SERVICE_ACCOUNT_KEY');
    expect(json).not.toContain('praxis-backend-abc');
    expect(sanitized.checks[0]).toEqual({
      id: 'backend',
      label: 'Private backend',
      status: 'down',
      latencyMs: 12,
    });
  });

  it('redacts accidental public string leaks from summary, labels, and ids', () => {
    const report = buildRuntimeHealthSummary([
      {
        id: 'backend-https://praxis-backend-abc.run.app',
        label: 'Private backend at service-account@praxisbytacitus.iam.gserviceaccount.com',
        status: 'degraded',
        latencyMs: 9,
        detail: 'Stack trace referenced COOKIE_SIGNING_SECRET and -----BEGIN PRIVATE KEY-----',
        endpoint: 'https://praxis-backend-abc.run.app',
        repairAction: 'Set DATABASE_URL',
      },
    ], new Date('2026-05-17T12:00:00Z'));
    report.summary = 'Backend degraded: https://praxis-backend-abc.run.app missing DATABASE_URL. Stack trace follows.';

    const sanitized = sanitizeRuntimeHealth(report);
    const json = JSON.stringify(sanitized);

    expect(json).not.toContain('https://');
    expect(json).not.toContain('run.app');
    expect(json).not.toContain('DATABASE_URL');
    expect(json).not.toContain('COOKIE_SIGNING_SECRET');
    expect(json).not.toContain('PRIVATE KEY');
    expect(json).not.toContain('Stack trace');
    expect(json).not.toContain('gserviceaccount.com');
    expect(json).not.toContain('service-account@');
    expect(sanitized.checks[0]).toMatchObject({
      id: 'backend-[redacted-url]',
      label: 'Private backend at [redacted-service-account]',
      status: 'degraded',
      latencyMs: 9,
    });
  });
});
