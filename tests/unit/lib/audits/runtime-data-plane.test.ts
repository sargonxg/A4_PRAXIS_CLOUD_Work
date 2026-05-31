import { describe, expect, it } from 'vitest';
import {
  buildAiProviderPosture,
  buildRuntimeDataPlaneReport,
  buildSecretsIamPosture,
  compareCloudSqlSchema,
  inventoryFirestorePaths,
  redactString,
  renderRuntimeDataPlaneMarkdown,
  type CloudSqlIntrospection,
} from '@/lib/audits/runtime-data-plane';

function env(values: Record<string, string>): NodeJS.ProcessEnv {
  return { NODE_ENV: 'test', ...values };
}

describe('runtime data plane diagnostic', () => {
  it('redacts secrets, emails, service accounts, database URLs, tokens, and private URLs', () => {
    const raw = [
      'postgres://user:pass@host.internal:5432/praxis',
      'https://service-token:secret@example.run.app/path',
      'agent@praxisbytacitus.iam.gserviceaccount.com',
      'analyst@example.com',
      'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      'ya29.a0AfB_byVeryLongBearerTokenValueForRuntime',
      '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
    ].join('\n');

    const redacted = redactString(raw);

    expect(redacted).not.toContain('postgres://');
    expect(redacted).not.toContain('example.run.app');
    expect(redacted).not.toContain('gserviceaccount.com');
    expect(redacted).not.toContain('analyst@example.com');
    expect(redacted).not.toContain('AIza');
    expect(redacted).not.toContain('ya29');
    expect(redacted).not.toContain('PRIVATE KEY');
    expect(redacted).toContain('[redacted-database-url]');
    expect(redacted).toContain('[redacted-service-account]');
  });

  it('flags missing Cloud SQL tables, columns, and indexes', () => {
    const introspection: CloudSqlIntrospection = {
      tables: {
        ask_threads: {
          columns: ['owner_uid', 'capsule_id', 'thread_id'],
          indexes: ['ask_threads_pkey'],
        },
        agent_runs: {
          columns: ['id', 'owner_uid', 'capsule_id', 'trace_id'],
          indexes: ['agent_runs_pkey'],
        },
      },
    };

    const checks = compareCloudSqlSchema(introspection);

    expect(checks.find((check) => check.table === 'ask_threads')?.status).toBe('FAIL');
    expect(checks.find((check) => check.table === 'ask_threads')?.missingColumns).toContain('updated_at');
    expect(checks.find((check) => check.table === 'ask_threads')?.missingIndexes).toContain('ask_threads_owner_updated_idx');
    expect(checks.find((check) => check.table === 'agent_run_events')?.status).toBe('FAIL');
    expect(checks.find((check) => check.table === 'agent_run_events')?.missingColumns).toContain('run_id');
  });

  it('passes a healthy Cloud SQL schema inventory', () => {
    const checks = compareCloudSqlSchema({
      tables: Object.fromEntries(
        compareCloudSqlSchema(null).map((expected) => [
          expected.table,
          { columns: expected.requiredColumns, indexes: expected.requiredIndexes },
        ]),
      ),
    });

    expect(checks.every((check) => check.status === 'PASS')).toBe(true);
  });

  it('flags missing Firestore capsule and thread structures from bounded samples', () => {
    const checks = inventoryFirestorePaths({
      'users/{uid}': true,
      'users/{uid}/capsules/{capsuleId}': false,
      'users/{uid}/capsules/{capsuleId}/askThreads/{threadId}/turns/{turnId}': false,
      'users/{uid}/outputCapsules/{outputId}': true,
    });

    expect(checks.find((check) => check.path === 'users/{uid}')?.status).toBe('PASS');
    expect(checks.find((check) => check.path === 'users/{uid}/capsules/{capsuleId}')?.status).toBe('FAIL');
    expect(checks.find((check) => check.path.includes('turns/{turnId}'))?.status).toBe('FAIL');
    expect(checks.find((check) => check.path === 'users/{uid}/capsules/{capsuleId}/researchDossiers/starter-dossier')?.status).toBe('BLOCKED');
    expect(checks.find((check) => check.path === 'users/{uid}/capsules/{capsuleId}/claimLedgers/starter-claims')?.status).toBe('BLOCKED');
    expect(checks.find((check) => check.path === 'users/{uid}/capsules/{capsuleId}/humanWorkflowExamples/starter-workflow')?.status).toBe('BLOCKED');
    expect(checks.find((check) => check.path === 'users/{uid}/capsules/{capsuleId}/sourceRefreshDockets/starter-refresh')?.status).toBe('BLOCKED');
    expect(checks.find((check) => check.path === 'users/{uid}/capsules/{capsuleId}/graphProjections/graphlite-starter-projection')?.status).toBe('BLOCKED');
  });

  it('reports Vertex, fallback, and unconfigured AI provider states', () => {
    const posture = buildAiProviderPosture(env({
      GOOGLE_VERTEX_PROJECT: '',
      GOOGLE_VERTEX_GEMINI_LOCATION: 'us-central1',
      GOOGLE_GENERATIVE_AI_API_KEY: 'configured',
    }));

    expect(posture.vertexProjectConfigured).toBe(false);
    expect(posture.googleAiFallbackConfigured).toBe(true);
    expect(posture.frontierModels.every((model) => model.startsWith('gemini-3'))).toBe(true);
    expect(posture.fallbackModels.every((model) => model.startsWith('gemini-2.5'))).toBe(true);
    expect(posture.warnings.some((warning) => warning.includes('GOOGLE_VERTEX_PROJECT'))).toBe(true);
  });

  it('reports Cloud Tasks worker auth as failed when OIDC and shared secret are absent', () => {
    const posture = buildSecretsIamPosture(env({
      FIREBASE_SERVICE_ACCOUNT_KEY_FILE: 'configured',
      GOOGLE_APPLICATION_CREDENTIALS: 'configured',
    }));

    expect(posture.firebaseAdminCredentials).toBe('PASS');
    expect(posture.applicationDefaultCredentials).toBe('PASS');
    expect(posture.cloudTasksWorkerAuth).toBe('FAIL');
  });

  it('builds a redacted report with architecture ownership and repair findings', async () => {
    const report = await buildRuntimeDataPlaneReport({
      env: env({
        GOOGLE_VERTEX_PROJECT: '',
        GOOGLE_GENERATIVE_AI_API_KEY: 'AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        FIREBASE_SERVICE_ACCOUNT_KEY: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
      }),
      runtimeHealth: null,
      sqlIntrospection: null,
      now: new Date('2026-05-18T12:00:00.000Z'),
    });
    const markdown = renderRuntimeDataPlaneMarkdown(report);

    expect(report.architecture.canonicalStateOwner).toBe('PRAXIS');
    expect(report.findings.some((finding) => finding.id === 'cloud-sql-url-missing')).toBe(true);
    expect(markdown).toContain('Firestore remains canonical');
    expect(JSON.stringify(report)).not.toContain('PRIVATE KEY');
    expect(markdown).not.toContain('AIza');
  });
});
