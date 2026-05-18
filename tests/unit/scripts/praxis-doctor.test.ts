import { describe, expect, it, vi } from 'vitest';
import {
  buildCanaryPlan,
  buildDoctorReport,
  parseDoctorArgs,
  redactSecrets,
  renderMarkdownReport,
  runPraxisDoctor,
  summarizeStatus,
} from '../../../scripts/praxis-doctor';

describe('praxis doctor helpers', () => {
  it('parses defaults and explicit canary options', () => {
    expect(parseDoctorArgs([])).toMatchObject({
      baseUrl: 'https://praxis.tacitus.me',
      project: 'praxisbytacitus',
      region: 'us-central1',
      mode: 'quick',
      outDir: 'docs/audits',
      jsonOnly: false,
      skipBuild: false,
      skipDeployCheck: false,
    });

    expect(parseDoctorArgs([
      '--mode=canary',
      '--base-url=https://example.test',
      '--project=custom',
      '--region=europe-west1',
      '--out=tmp/audits',
      '--json',
      '--skip-build',
      '--skip-deploy-check',
    ])).toMatchObject({
      baseUrl: 'https://example.test',
      project: 'custom',
      region: 'europe-west1',
      mode: 'canary',
      outDir: 'tmp/audits',
      jsonOnly: true,
      skipBuild: true,
      skipDeployCheck: true,
    });
  });

  it('redacts secrets in nested evidence and remediation fields', () => {
    const redacted = redactSecrets({
      header: 'Authorization: Bearer abc.def.ghi',
      cookie: 'tacitus-auth-session=signed-cookie-value',
      url: 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIza-secret',
      nested: {
        serviceAccount: '-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----',
        command: 'curl -H "X-Diagnostic-Token: token-123" https://example.test',
      },
    });

    expect(JSON.stringify(redacted)).not.toContain('abc.def.ghi');
    expect(JSON.stringify(redacted)).not.toContain('signed-cookie-value');
    expect(JSON.stringify(redacted)).not.toContain('AIza-secret');
    expect(JSON.stringify(redacted)).not.toContain('token-123');
    expect(JSON.stringify(redacted)).toContain('[REDACTED]');
  });

  it('renders report statuses and remediation without leaking secret material', () => {
    const report = buildDoctorReport({
      runId: 'doctor-2026-05-17T120000000Z',
      timestamp: '2026-05-17T12:00:00.000Z',
      commit: 'abc123',
      branch: 'main',
      baseUrl: 'https://praxis.tacitus.me',
      project: 'praxisbytacitus',
      region: 'us-central1',
      cloudRunRevision: 'praxis-frontend-00001-abc',
      checks: [
        {
          id: 'auth-doctor',
          lane: 'local-cloud-auth',
          status: 'BLOCKED',
          summary: 'ADC is expired',
          evidence: ['Authorization: Bearer should-not-leak'],
          remediation: ['gcloud auth application-default login --project=praxisbytacitus'],
        },
        {
          id: 'health-core',
          lane: 'live-production-health',
          status: 'PASS',
          summary: 'Core health is ok',
          evidence: [{ checks: { firestore: 'ok', cookie_secret: 'ok' } }],
        },
      ],
    });

    const markdown = renderMarkdownReport(report);

    expect(summarizeStatus(report.checks)).toEqual({ PASS: 1, WARN: 0, FAIL: 0, BLOCKED: 1 });
    expect(markdown).toContain('| BLOCKED | local-cloud-auth | auth-doctor | ADC is expired |');
    expect(markdown).toContain('gcloud auth application-default login --project=praxisbytacitus');
    expect(markdown).not.toContain('should-not-leak');
  });

  it('builds a dry-run canary plan unless write canary and credentials are present', () => {
    expect(buildCanaryPlan({
      now: new Date('2026-05-17T12:00:00.000Z'),
      env: {},
    })).toMatchObject({
      enabled: false,
      status: 'BLOCKED',
      tag: 'praxis-doctor-canary-20260517T120000000Z',
    });

    expect(buildCanaryPlan({
      now: new Date('2026-05-17T12:00:00.000Z'),
      env: {
        PRAXIS_DOCTOR_WRITE_CANARY: '1',
        PRAXIS_CANARY_EMAIL: 'canary@example.test',
        PRAXIS_CANARY_PASSWORD: 'secret-password',
      },
    })).toMatchObject({
      enabled: true,
      status: 'PASS',
      email: 'canary@example.test',
      tag: 'praxis-doctor-canary-20260517T120000000Z',
    });
  });
});

describe('runPraxisDoctor', () => {
  it('uses the runtime queue path and converts command failures to blocked checks', async () => {
    const exec = vi.fn(async (command: string) => {
      if (command === 'git branch --show-current') return { code: 0, stdout: 'main\n', stderr: '' };
      if (command === 'git rev-parse HEAD') return { code: 0, stdout: 'abc123\n', stderr: '' };
      if (command === 'git status --short') return { code: 0, stdout: '', stderr: '' };
      if (command === 'git rev-list --left-right --count origin/main...HEAD') return { code: 0, stdout: '0\t0\n', stderr: '' };
      if (command.startsWith('npm run auth:doctor')) return { code: 1, stdout: '', stderr: 'ADC expired' };
      if (command.includes('tasks queues describe agent-runs')) return { code: 0, stdout: 'agent-runs', stderr: '' };
      return { code: 0, stdout: 'ok', stderr: '' };
    });
    const fetch = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', url }),
      text: async () => 'ok',
    }));

    const report = await runPraxisDoctor({
      options: parseDoctorArgs(['--mode=quick', '--skip-build']),
      exec,
      fetch,
      now: new Date('2026-05-17T12:00:00.000Z'),
      env: {
        AGENT_RUN_TASKS_PROJECT: 'praxisbytacitus',
        AGENT_RUN_TASKS_LOCATION: 'us-central1',
        AGENT_RUN_TASKS_QUEUE: 'agent-runs',
      },
      writeArtifacts: false,
    });

    expect(exec).toHaveBeenCalledWith('gcloud tasks queues describe agent-runs --location=us-central1 --project=praxisbytacitus');
    expect(report.checks.some((check) => check.id === 'auth-doctor' && check.status === 'BLOCKED')).toBe(true);
    expect(report.checks.some((check) => check.id === 'agent-run-queue' && check.status === 'PASS')).toBe(true);
    expect(report.artifacts?.some((artifact) => artifact.tag === 'praxis-doctor-canary-20260517T120000000Z')).toBe(true);
  });
});
