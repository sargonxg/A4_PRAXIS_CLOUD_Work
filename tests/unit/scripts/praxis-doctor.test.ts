import { describe, expect, it, vi } from 'vitest';
import {
  buildArtifactFreshness,
  buildCanaryPlan,
  buildDoctorReport,
  classifyDoctorRedFlags,
  parseAuditAdvisorySummary,
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
        {
          id: 'health-runtime',
          lane: 'live-production-health',
          status: 'PASS',
          summary: 'Runtime health is ready',
        },
        {
          id: 'health-agentic-search',
          lane: 'live-production-health',
          status: 'PASS',
          summary: 'Agentic search is ready',
        },
      ],
      artifactFreshness: {
        commit: 'abc123',
        cloudRunRevision: 'praxis-frontend-00001-abc',
        staleArtifactCount: 0,
      },
    });

    const markdown = renderMarkdownReport(report);

    expect(summarizeStatus(report.checks)).toEqual({ PASS: 3, WARN: 0, FAIL: 0, BLOCKED: 1 });
    expect(markdown).toContain('| BLOCKED | local-cloud-auth | auth-doctor | ADC is expired |');
    expect(markdown).toContain('## Red Flags');
    expect(markdown).toContain('local only');
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

  it('classifies blocking, local-auth, stale-artifact, dependency, and canary-gated red flags', () => {
    const redFlags = classifyDoctorRedFlags({
      commit: 'current',
      cloudRunRevision: 'praxis-frontend-00002-def',
      artifactFreshness: {
        commit: 'current',
        cloudRunRevision: 'praxis-frontend-00002-def',
        staleArtifactCount: 2,
      },
      checks: [
        { id: 'auth-doctor', lane: 'local-cloud-auth', status: 'BLOCKED', summary: 'ADC expired' },
        { id: 'health-runtime', lane: 'live-production-health', status: 'PASS', summary: 'Runtime ready' },
        { id: 'health-agentic-search', lane: 'live-production-health', status: 'PASS', summary: 'Agentic search ready' },
        { id: 'cloud-run-praxis-frontend', lane: 'gcp-firebase-infrastructure', status: 'FAIL', summary: 'Revision unavailable' },
        { id: 'package-audit-summary', lane: 'repo-and-deployability', status: 'WARN', summary: '2 advisory groups require forced or breaking updates' },
        { id: 'canary-write-gate', lane: 'authenticated-full-canary', status: 'WARN', summary: 'Canary writes disabled' },
      ],
    });

    expect(redFlags).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'cloud-run-praxis-frontend', lane: 'blocking', severity: 'blocked' }),
      expect.objectContaining({ id: 'auth-doctor', lane: 'needs-auth', summary: expect.stringContaining('local only') }),
      expect.objectContaining({ id: 'stale-diagnostic-artifacts', lane: 'stale-artifact', severity: 'warn' }),
      expect.objectContaining({ id: 'package-audit-summary', lane: 'security-dependency', severity: 'warn' }),
      expect.objectContaining({ id: 'canary-write-gate', lane: 'canary-gated', severity: 'warn' }),
    ]));
  });

  it('counts stale audit artifacts against the current commit and Cloud Run revision', () => {
    expect(buildArtifactFreshness({
      commit: 'current',
      cloudRunRevision: 'praxis-frontend-00002-def',
      artifacts: [
        { path: 'docs/audits/current.json', commit: 'current', cloudRunRevision: 'praxis-frontend-00002-def' },
        { path: 'docs/audits/old-commit.json', commit: 'old', cloudRunRevision: 'praxis-frontend-00002-def' },
        { path: 'docs/audits/old-revision.json', commit: 'current', cloudRunRevision: 'praxis-frontend-00001-abc' },
      ],
    })).toMatchObject({
      commit: 'current',
      cloudRunRevision: 'praxis-frontend-00002-def',
      staleArtifactCount: 2,
    });
  });

  it('summarizes forced or breaking npm audit advisories without failing the deploy gate', () => {
    expect(parseAuditAdvisorySummary(JSON.stringify({
      vulnerabilities: {
        alpha: { fixAvailable: { name: 'alpha', version: '2.0.0', isSemVerMajor: true } },
        beta: { fixAvailable: false },
        gamma: { fixAvailable: true },
      },
    }))).toMatchObject({
      forcedOrBreaking: 1,
      total: 3,
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
    expect(report.redFlags).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'auth-doctor', lane: 'needs-auth' }),
      expect.objectContaining({ id: 'canary-write-gate', lane: 'canary-gated' }),
    ]));
    expect(report.artifactFreshness).toMatchObject({ commit: 'abc123', staleArtifactCount: 0 });
    expect(report.artifacts?.some((artifact) => artifact.tag === 'praxis-doctor-canary-20260517T120000000Z')).toBe(true);
  });

  it('warns when the deployed frontend lacks Direct VPC egress or worker OIDC env', async () => {
    const cloudRunService = {
      status: { latestReadyRevisionName: 'praxis-frontend-00001-abc' },
      spec: {
        template: {
          metadata: {
            annotations: {
              'run.googleapis.com/cloudsql-instances': 'praxisbytacitus:us-east4:praxisbytacitus-instance',
            },
          },
          spec: {
            containers: [
              {
                env: [
                  { name: 'AGENT_RUNTIME_DATABASE_URL', valueFrom: { secretKeyRef: { name: 'praxis-agent-runtime-database-url' } } },
                ],
              },
            ],
          },
        },
      },
    };
    const exec = vi.fn(async (command: string) => {
      if (command === 'git branch --show-current') return { code: 0, stdout: 'main\n', stderr: '' };
      if (command === 'git rev-parse HEAD') return { code: 0, stdout: 'abc123\n', stderr: '' };
      if (command === 'git status --short') return { code: 0, stdout: '', stderr: '' };
      if (command === 'git rev-list --left-right --count origin/main...HEAD') return { code: 0, stdout: '0\t0\n', stderr: '' };
      if (command.includes('run services describe praxis-frontend')) return { code: 0, stdout: JSON.stringify(cloudRunService), stderr: '' };
      return { code: 0, stdout: 'ok', stderr: '' };
    });
    const fetch = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', url }),
      text: async () => 'ok',
    }));

    const report = await runPraxisDoctor({
      options: parseDoctorArgs(['--skip-build']),
      exec,
      fetch,
      now: new Date('2026-05-17T12:00:00.000Z'),
      env: {},
      writeArtifacts: false,
    });

    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'cloud-run-private-sql-networking',
      status: 'WARN',
    }));
    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'agent-worker-runtime-env',
      status: 'WARN',
    }));
  });

  it('records the authenticated canary golden path when all production steps pass', async () => {
    const exec = vi.fn(async (command: string) => {
      if (command === 'git branch --show-current') return { code: 0, stdout: 'main\n', stderr: '' };
      if (command === 'git rev-parse HEAD') return { code: 0, stdout: 'abc123\n', stderr: '' };
      if (command === 'git status --short') return { code: 0, stdout: '', stderr: '' };
      if (command === 'git rev-list --left-right --count origin/main...HEAD') return { code: 0, stdout: '0\t0\n', stderr: '' };
      if (command.startsWith('npm run auth:doctor')) return { code: 0, stdout: 'ok', stderr: '' };
      return { code: 0, stdout: 'ok', stderr: '' };
    });
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('identitytoolkit.googleapis.com')) {
        return jsonResponse(200, { idToken: 'firebase-id-token' });
      }
      if (url.endsWith('/api/auth/session') && init?.method === 'POST') {
        return jsonResponse(200, { success: true }, {
          'set-cookie': 'tacitus-auth-session=signed-cookie-value; Path=/; HttpOnly',
        });
      }
      if (url.endsWith('/api/auth/session') && init?.method === 'GET') {
        return jsonResponse(200, { authenticated: true, user: { id: 'uid-1' } });
      }
      if (url.endsWith('/api/context/capsules')) {
        return jsonResponse(201, { capsule: { capsuleId: 'praxis-doctor-canary-20260517T120000000Z' } });
      }
      if (url.includes('/api/conversations/') && url.endsWith('/turns')) {
        return textResponse(200, 'answer stream');
      }
      if (url.endsWith('/api/agents/runs')) {
        return jsonResponse(201, {
          runId: 'run-canary-1',
          status: 'queued',
          capsuleId: 'praxis-doctor-canary-20260517T120000000Z',
          outputDestination: 'memo_studio',
          outputHref: '/app?panel=memo',
        });
      }
      if (url.endsWith('/api/agents/runs/run-canary-1/dispatch')) {
        return jsonResponse(200, { taskName: 'agent-runs/run-canary-1' });
      }
      if (url.endsWith('/api/agents/runs/run-canary-1')) {
        return jsonResponse(200, {
          run: {
            runId: 'run-canary-1',
            status: 'succeeded',
            outputDestination: 'memo_studio',
            outputHref: '/app?panel=memo&memoId=canary-memo',
          },
          toolCalls: [],
          approvals: [],
          persisted: true,
        });
      }
      if (url.endsWith('/api/memos/from-ask-pack')) {
        return jsonResponse(200, { success: true, memo: { memoId: 'canary-memo' }, versions: [] });
      }
      if (url.includes('/api/conversations/praxis-doctor-canary-20260517T120000000Z-thread')) {
        return jsonResponse(200, {
          persisted: true,
          conversation: { conversationId: 'praxis-doctor-canary-20260517T120000000Z-thread' },
          turns: [{ turnId: 'turn-1' }],
        });
      }
      return jsonResponse(200, { status: 'ok', url });
    });

    const report = await runPraxisDoctor({
      options: parseDoctorArgs(['--mode=canary', '--skip-build', '--skip-deploy-check']),
      exec,
      fetch,
      now: new Date('2026-05-17T12:00:00.000Z'),
      env: {
        PRAXIS_DOCTOR_WRITE_CANARY: '1',
        PRAXIS_CANARY_EMAIL: 'canary@example.test',
        PRAXIS_CANARY_PASSWORD: 'secret-password',
        NEXT_PUBLIC_FIREBASE_API_KEY: 'AIza-test-key',
        PRAXIS_CANARY_POLL_MS: '0',
        PRAXIS_CANARY_POLL_ATTEMPTS: '1',
      },
      writeArtifacts: false,
    });

    expect(report.checks).toContainEqual(expect.objectContaining({
      id: 'canary-authenticated-golden-path',
      status: 'PASS',
      summary: expect.stringContaining('AgentRun run-canary-1'),
    }));
    expect(report.artifacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'context-capsule', id: 'praxis-doctor-canary-20260517T120000000Z' }),
      expect.objectContaining({ kind: 'conversation-thread', id: 'praxis-doctor-canary-20260517T120000000Z-thread' }),
      expect.objectContaining({ kind: 'agent-run', id: 'run-canary-1' }),
      expect.objectContaining({ kind: 'memo-draft', id: 'canary-memo' }),
    ]));
    expect(JSON.stringify(report)).not.toContain('secret-password');
    expect(JSON.stringify(report)).not.toContain('signed-cookie-value');
  });
});

function jsonResponse(status: number, payload: unknown, headers?: Record<string, string>) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}

function textResponse(status: number, payload: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: async () => {
      throw new Error('not json');
    },
    text: async () => payload,
  };
}
