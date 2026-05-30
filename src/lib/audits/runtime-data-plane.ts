import { buildModelRuntimeHealthCheck, getAskPraxisModelRuntimePolicy } from '@/lib/ai/model-runtime-policy';
import { collectRuntimeHealth, type RuntimeHealthSummary } from '@/lib/health/runtime-health';

export type RuntimeDataPlaneStatus = 'PASS' | 'WARN' | 'FAIL' | 'BLOCKED';

export type RuntimeDataPlaneFinding = {
  id: string;
  status: RuntimeDataPlaneStatus;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'preflight' | 'architecture' | 'firestore' | 'cloud-sql' | 'ai-runtime' | 'secrets-iam' | 'agentic-chain';
  summary: string;
  evidence: string[];
  affectedFlow: string;
  remediation: string[];
};

export type RuntimeDataPlaneReport = {
  generatedAt: string;
  mode: 'read-only' | 'write-canary';
  architecture: {
    canonicalStateOwner: 'PRAXIS';
    firestoreOwnership: string;
    cloudSqlOwnership: string;
    executionSubstrates: string;
  };
  inventory: {
    firestorePaths: FirestorePathCheck[];
    cloudSqlSchema: CloudSqlSchemaCheck[];
    aiProvider: AiProviderPosture;
    secretsIam: SecretsIamPosture;
    continuity: RuntimeContinuityCheck;
  };
  runtimeHealth: RuntimeHealthSummary | null;
  findings: RuntimeDataPlaneFinding[];
};

export type FirestorePathCheck = {
  path: string;
  purpose: string;
  required: boolean;
  status: RuntimeDataPlaneStatus;
  evidence: string;
};

export type CloudSqlSchemaCheck = {
  table: string;
  requiredColumns: string[];
  requiredIndexes: string[];
  status: RuntimeDataPlaneStatus;
  missingColumns: string[];
  missingIndexes: string[];
};

export type CloudSqlIntrospection = {
  tables: Record<string, {
    columns: string[];
    indexes: string[];
  }>;
};

export type AiProviderPosture = {
  vertexProjectConfigured: boolean;
  vertexLocation: string;
  frontierModels: string[];
  fallbackModels: string[];
  googleAiFallbackConfigured: boolean;
  embeddingsConfigured: boolean;
  warnings: string[];
};

export type SecretsIamPosture = {
  firebaseAdminCredentials: RuntimeDataPlaneStatus;
  applicationDefaultCredentials: RuntimeDataPlaneStatus;
  cloudRunServiceAccount: RuntimeDataPlaneStatus;
  cloudTasksWorkerAuth: RuntimeDataPlaneStatus;
  secretManagerHints: RuntimeDataPlaneStatus;
  evidence: string[];
};

export type RuntimeContinuityCheck = {
  ownerUid: RuntimeDataPlaneStatus;
  capsuleId: RuntimeDataPlaneStatus;
  threadId: RuntimeDataPlaneStatus;
  traceId: RuntimeDataPlaneStatus;
  evidence: string[];
};

export const EXPECTED_FIRESTORE_PATHS: FirestorePathCheck[] = [
  pathCheck('users/{uid}', 'Profile, credits, onboarding, API-key metadata, and AI settings.', true),
  pathCheck('users/{uid}/profile/analyst', 'Onboarding/profile metadata for the analyst core.', true),
  pathCheck('users/{uid}/usage/{period}', 'Usage and credit accounting.', true),
  pathCheck('users/{uid}/settings/api_keys_encrypted/providers/{provider}', 'Server-owned API-key metadata and encrypted provider key records.', false),
  pathCheck('users/{uid}/capsules/{capsuleId}', 'Canonical ContextCapsule state.', true),
  pathCheck('users/{uid}/capsules/{capsuleId}/versions/{version}', 'Capsule version history and lockability.', true),
  pathCheck('users/{uid}/capsules/{capsuleId}/ontologyGraphs/starter-seed', 'Starter ontology graph seed with review-gated node and edge templates.', true),
  pathCheck('users/{uid}/capsules/{capsuleId}/askThreads/{threadId}', 'Capsule-scoped Ask thread metadata.', true),
  pathCheck('users/{uid}/capsules/{capsuleId}/askThreads/{threadId}/turns/{turnId}', 'Capsule-scoped Ask turns.', true),
  pathCheck('users/{uid}/contextStacks/default', 'Default active ContextCapsule stack.', true),
  pathCheck('users/{uid}/conversations/{conversationId}/turns/{turnId}', 'Conversation continuity outside capsule-specific threads.', true),
  pathCheck('users/{uid}/situations/{situationId}/memos/{memoId}', 'Memo outputs and versions.', false),
  pathCheck('users/{uid}/situations/{situationId}/documents/{documentId}', 'User document corpus and chunks.', false),
  pathCheck('users/{uid}/outputCapsules/{outputId}', 'Durable output capsules created by Ask/agent runs.', true),
  pathCheck('users/{uid}/capsules/{capsuleId}/outputs/{outputId}', 'Capsule-linked output capsule index.', true),
];

export const EXPECTED_CLOUD_SQL_SCHEMA: CloudSqlSchemaCheck[] = [
  schemaCheck('ask_threads', [
    'owner_uid', 'capsule_id', 'thread_id', 'situation_id', 'capsule_version',
    'last_prompt', 'last_output_preview', 'turn_count', 'created_at', 'updated_at',
  ], ['ask_threads_pkey', 'ask_threads_owner_updated_idx']),
  schemaCheck('ask_thread_turns', [
    'id', 'owner_uid', 'capsule_id', 'thread_id', 'situation_id', 'prompt', 'output',
    'capsule_version', 'runtime', 'path_id', 'path_version', 'framework_steps',
    'tool_invocations', 'created_at',
  ], ['ask_thread_turns_pkey', 'ask_thread_turns_thread_created_idx']),
  schemaCheck('agent_runs', [
    'id', 'agent_spec_id', 'owner_uid', 'capsule_id', 'context_stack_id',
    'context_package_id', 'selected_core_ids', 'status', 'trigger_type', 'objective',
    'trace_id', 'parent_run_id', 'idempotency_key', 'max_step', 'max_session_minutes',
    'internal_estimated_cost_cents', 'internal_spend_cents', 'metadata', 'created_at',
    'updated_at', 'queued_at', 'started_at', 'completed_at', 'expires_at',
  ], ['agent_runs_pkey', 'agent_runs_owner_capsule_created_idx']),
  schemaCheck('agent_run_events', [
    'id', 'run_id', 'owner_uid', 'capsule_id', 'event_type', 'from_status',
    'to_status', 'message', 'data', 'trace_id', 'created_at',
  ], ['agent_run_events_pkey', 'agent_run_events_run_created_idx']),
  schemaCheck('agent_tool_calls', [
    'id', 'run_id', 'owner_uid', 'capsule_id', 'tool_id', 'risk', 'status',
    'input', 'output', 'error', 'started_at', 'completed_at', 'created_at', 'updated_at',
  ], ['agent_tool_calls_pkey', 'agent_tool_calls_run_created_idx']),
  schemaCheck('agent_approvals', [
    'id', 'run_id', 'owner_uid', 'capsule_id', 'tool_call_id', 'status', 'reason',
    'risk', 'requested_at', 'decided_at', 'decided_by_uid', 'expires_at',
  ], ['agent_approvals_pkey', 'agent_approvals_run_requested_idx']),
];

const SECRETISH_ENV_NAMES = [
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'FIREBASE_SERVICE_ACCOUNT_KEY_FILE',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'AGENT_RUNTIME_DATABASE_URL',
  'ASK_THREAD_DATABASE_URL',
  'PRAXIS_DATABASE_URL',
  'DATABASE_URL',
  'GOOGLE_GENERATIVE_AI_API_KEY',
  'GOOGLE_API_KEY',
  'AGENT_RUN_WORKER_SHARED_SECRET',
  'AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL',
  'AGENT_RUN_WORKER_OIDC_AUDIENCE',
  'COOKIE_SIGNING_SECRET',
];

export async function buildRuntimeDataPlaneReport(input: {
  env?: NodeJS.ProcessEnv;
  now?: Date;
  runtimeHealth?: RuntimeHealthSummary | null;
  firestoreSamples?: Partial<Record<string, boolean>>;
  sqlIntrospection?: CloudSqlIntrospection | null;
} = {}): Promise<RuntimeDataPlaneReport> {
  const env = input.env ?? process.env;
  const writeCanary = env.PRAXIS_DIAGNOSTIC_WRITE_CANARY === '1';
  const runtimeHealth = input.runtimeHealth === undefined
    ? await safeRuntimeHealth()
    : input.runtimeHealth;
  const firestorePaths = inventoryFirestorePaths(input.firestoreSamples);
  const cloudSqlSchema = compareCloudSqlSchema(input.sqlIntrospection ?? null);
  const aiProvider = buildAiProviderPosture(env);
  const secretsIam = buildSecretsIamPosture(env);
  const continuity = buildContinuityCheck(env, firestorePaths, cloudSqlSchema);

  const findings = [
    architectureFinding(),
    ...findingsForFirestore(firestorePaths, env),
    ...findingsForCloudSql(cloudSqlSchema, env),
    ...findingsForAiProvider(aiProvider),
    ...findingsForSecretsIam(secretsIam),
    ...findingsForRuntimeHealth(runtimeHealth),
    continuityFinding(continuity),
    canaryFinding(writeCanary),
  ];

  return redactReport({
    generatedAt: (input.now ?? new Date()).toISOString(),
    mode: writeCanary ? 'write-canary' : 'read-only',
    architecture: {
      canonicalStateOwner: 'PRAXIS',
      firestoreOwnership: 'Firestore remains canonical for user/app state, profiles, ContextCapsules, context stacks, conversations, documents, and output capsules.',
      cloudSqlOwnership: 'Cloud SQL Postgres is the durable ledger for Ask SQL memory and agent runs: ask_threads, ask_thread_turns, agent_runs, agent_run_events, agent_tool_calls, and agent_approvals.',
      executionSubstrates: 'ADK, Genkit, Vertex, Gemini, Cloud Tasks, and Cloud Run execute work but do not become the product source of truth.',
    },
    inventory: {
      firestorePaths,
      cloudSqlSchema,
      aiProvider,
      secretsIam,
      continuity,
    },
    runtimeHealth,
    findings: sortFindings(findings),
  });
}

export function redactValue(value: unknown): unknown {
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map(redactValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        SECRETISH_ENV_NAMES.includes(key) ? statusOnly(nested) : redactValue(nested),
      ]),
    );
  }
  return value;
}

export function redactString(value: string): string {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s"'`<>]+/gi, '[redacted-database-url]')
    .replace(/https?:\/\/[^@\s"'`<>]+:[^@\s"'`<>]+@[^\s"'`<>]+/gi, '[redacted-private-url]')
    .replace(/https?:\/\/[^\s"'`<>]*\.run\.app[^\s"'`<>]*/gi, '[redacted-private-url]')
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted-api-key]')
    .replace(/\b(?:ya29|eyJ)[0-9A-Za-z._-]{20,}\b/g, '[redacted-token]')
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, '[redacted-private-key]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]*gserviceaccount\.com/gi, '[redacted-service-account]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
    .replace(/\b(?:sk|pk|rk|AIza|xox[baprs])-?[A-Za-z0-9_-]{16,}\b/g, '[redacted-key]');
}

export function compareCloudSqlSchema(introspection: CloudSqlIntrospection | null): CloudSqlSchemaCheck[] {
  if (!introspection) {
    return EXPECTED_CLOUD_SQL_SCHEMA.map((check) => ({
      ...check,
      status: 'BLOCKED',
      missingColumns: [],
      missingIndexes: [],
    }));
  }

  return EXPECTED_CLOUD_SQL_SCHEMA.map((expected) => {
    const actual = introspection.tables[expected.table];
    if (!actual) {
      return {
        ...expected,
        status: 'FAIL',
        missingColumns: expected.requiredColumns,
        missingIndexes: expected.requiredIndexes,
      };
    }
    const actualColumns = new Set(actual.columns);
    const actualIndexes = new Set(actual.indexes);
    const missingColumns = expected.requiredColumns.filter((column) => !actualColumns.has(column));
    const missingIndexes = expected.requiredIndexes.filter((index) => !actualIndexes.has(index));
    return {
      ...expected,
      status: missingColumns.length || missingIndexes.length ? 'FAIL' : 'PASS',
      missingColumns,
      missingIndexes,
    };
  });
}

export function inventoryFirestorePaths(samples: Partial<Record<string, boolean>> | undefined): FirestorePathCheck[] {
  if (!samples) {
    return EXPECTED_FIRESTORE_PATHS.map((check) => ({
      ...check,
      status: check.required ? 'BLOCKED' : 'WARN',
      evidence: check.required
        ? 'No bounded Firestore diagnostic sample was supplied.'
        : 'Optional path recorded for coverage; no bounded Firestore diagnostic sample was supplied.',
    }));
  }

  return EXPECTED_FIRESTORE_PATHS.map((check) => {
    const exists = samples[check.path];
    if (exists === true) return { ...check, status: 'PASS', evidence: 'Bounded sample exists.' };
    if (exists === false && check.required) return { ...check, status: 'FAIL', evidence: 'Bounded sample missing.' };
    if (exists === false) return { ...check, status: 'WARN', evidence: 'Optional bounded sample missing.' };
    return { ...check, status: check.required ? 'BLOCKED' : 'WARN', evidence: 'Path was not sampled.' };
  });
}

export function buildAiProviderPosture(env: NodeJS.ProcessEnv): AiProviderPosture {
  const health = buildModelRuntimeHealthCheck(env);
  return {
    vertexProjectConfigured: health.configuredVertexProject,
    vertexLocation: health.configuredVertexLocation,
    frontierModels: health.frontierPrimaryModels,
    fallbackModels: health.stableFallbackModels,
    googleAiFallbackConfigured: Boolean(env.GOOGLE_GENERATIVE_AI_API_KEY || env.GOOGLE_API_KEY),
    embeddingsConfigured: Boolean(env.GOOGLE_VERTEX_EMBEDDING_MODEL || env.EMBEDDING_MODEL || env.GOOGLE_GENERATIVE_AI_EMBEDDING_MODEL),
    warnings: health.warnings,
  };
}

export function buildSecretsIamPosture(env: NodeJS.ProcessEnv): SecretsIamPosture {
  const firebaseAdmin = Boolean(env.FIREBASE_SERVICE_ACCOUNT_KEY || env.FIREBASE_SERVICE_ACCOUNT_KEY_FILE || env.GOOGLE_APPLICATION_CREDENTIALS);
  const adc = Boolean(env.GOOGLE_APPLICATION_CREDENTIALS || env.GOOGLE_AUTH_IMPERSONATE_SERVICE_ACCOUNT);
  const workerOidc = Boolean(env.AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL && env.AGENT_RUN_WORKER_OIDC_AUDIENCE);
  const workerSecret = Boolean(env.AGENT_RUN_WORKER_SHARED_SECRET);
  const cloudRunSa = Boolean(env.GOOGLE_CLOUD_RUN_SERVICE_ACCOUNT || env.K_SERVICE || env.GOOGLE_AUTH_IMPERSONATE_SERVICE_ACCOUNT);
  const secretHints = SECRETISH_ENV_NAMES.some((name) => Boolean(env[name]));

  return {
    firebaseAdminCredentials: firebaseAdmin ? 'PASS' : 'BLOCKED',
    applicationDefaultCredentials: adc ? 'PASS' : 'WARN',
    cloudRunServiceAccount: cloudRunSa ? 'PASS' : 'WARN',
    cloudTasksWorkerAuth: workerOidc || workerSecret ? 'PASS' : 'FAIL',
    secretManagerHints: secretHints ? 'PASS' : 'WARN',
    evidence: [
      `Firebase Admin credential source: ${firebaseAdmin ? 'configured' : 'missing'}`,
      `ADC/impersonation: ${adc ? 'configured' : 'not visible in env'}`,
      `Cloud Tasks worker auth: ${workerOidc ? 'OIDC' : workerSecret ? 'shared secret' : 'missing'}`,
      `Cloud Run service account hint: ${cloudRunSa ? 'present' : 'not visible in env'}`,
    ],
  };
}

export function buildContinuityCheck(
  env: NodeJS.ProcessEnv,
  firestorePaths: FirestorePathCheck[],
  cloudSqlSchema: CloudSqlSchemaCheck[],
): RuntimeContinuityCheck {
  const firestoreHasCapsules = pathStatus(firestorePaths, 'users/{uid}/capsules/{capsuleId}');
  const firestoreHasTurns = pathStatus(firestorePaths, 'users/{uid}/capsules/{capsuleId}/askThreads/{threadId}/turns/{turnId}');
  const sqlHasAgentRuns = tableStatus(cloudSqlSchema, 'agent_runs');
  const sqlHasAskTurns = tableStatus(cloudSqlSchema, 'ask_thread_turns');

  return {
    ownerUid: firestoreHasCapsules === 'PASS' || Boolean(env.PRAXIS_DIAGNOSTIC_UID) ? 'PASS' : 'BLOCKED',
    capsuleId: firestoreHasCapsules === 'PASS' && (sqlHasAgentRuns === 'PASS' || sqlHasAskTurns === 'PASS') ? 'PASS' : 'WARN',
    threadId: firestoreHasTurns === 'PASS' || sqlHasAskTurns === 'PASS' ? 'PASS' : 'WARN',
    traceId: sqlHasAgentRuns === 'PASS' ? 'PASS' : 'WARN',
    evidence: [
      `Firestore capsule path: ${firestoreHasCapsules}`,
      `Firestore capsule turns path: ${firestoreHasTurns}`,
      `SQL ask turns: ${sqlHasAskTurns}`,
      `SQL agent runs: ${sqlHasAgentRuns}`,
    ],
  };
}

export function renderRuntimeDataPlaneMarkdown(report: RuntimeDataPlaneReport): string {
  const counts = report.findings.reduce<Record<RuntimeDataPlaneStatus, number>>((acc, finding) => {
    acc[finding.status] += 1;
    return acc;
  }, { PASS: 0, WARN: 0, FAIL: 0, BLOCKED: 0 });

  const lines = [
    '# PRAXIS Runtime Data Plane Diagnostic',
    '',
    `Generated: ${report.generatedAt}`,
    `Mode: ${report.mode}`,
    '',
    '## Architecture',
    '',
    `- Canonical state owner: ${report.architecture.canonicalStateOwner}`,
    `- Firestore: ${report.architecture.firestoreOwnership}`,
    `- Cloud SQL: ${report.architecture.cloudSqlOwnership}`,
    `- Execution: ${report.architecture.executionSubstrates}`,
    '',
    '## Status Summary',
    '',
    `- PASS: ${counts.PASS}`,
    `- WARN: ${counts.WARN}`,
    `- FAIL: ${counts.FAIL}`,
    `- BLOCKED: ${counts.BLOCKED}`,
    '',
    '## Findings',
    '',
    ...report.findings.flatMap((finding) => [
      `### ${finding.status} / ${finding.severity.toUpperCase()} / ${finding.id}`,
      '',
      finding.summary,
      '',
      `Affected flow: ${finding.affectedFlow}`,
      '',
      'Evidence:',
      ...finding.evidence.map((item) => `- ${item}`),
      '',
      'Remediation:',
      ...finding.remediation.map((item) => `- ${item}`),
      '',
    ]),
    '## Firestore Inventory',
    '',
    '| Status | Required | Path | Purpose | Evidence |',
    '| --- | --- | --- | --- | --- |',
    ...report.inventory.firestorePaths.map((check) =>
      `| ${check.status} | ${check.required ? 'yes' : 'no'} | \`${check.path}\` | ${check.purpose} | ${check.evidence} |`),
    '',
    '## Cloud SQL Schema',
    '',
    '| Status | Table | Missing columns | Missing indexes |',
    '| --- | --- | --- | --- |',
    ...report.inventory.cloudSqlSchema.map((check) =>
      `| ${check.status} | \`${check.table}\` | ${check.missingColumns.join(', ') || 'none'} | ${check.missingIndexes.join(', ') || 'none'} |`),
    '',
    '## AI Provider',
    '',
    `- Vertex project configured: ${report.inventory.aiProvider.vertexProjectConfigured ? 'yes' : 'no'}`,
    `- Vertex location: ${report.inventory.aiProvider.vertexLocation}`,
    `- Frontier models: ${report.inventory.aiProvider.frontierModels.join(', ')}`,
    `- Stable fallback models: ${report.inventory.aiProvider.fallbackModels.join(', ')}`,
    `- Google AI key fallback: ${report.inventory.aiProvider.googleAiFallbackConfigured ? 'configured' : 'not configured'}`,
    `- Embeddings: ${report.inventory.aiProvider.embeddingsConfigured ? 'configured' : 'not configured'}`,
    '',
    '## Runtime Health',
    '',
    report.runtimeHealth
      ? `Runtime health summary: ${report.runtimeHealth.status} (${report.runtimeHealth.summary})`
      : 'Runtime health collection was blocked.',
    '',
  ];

  return redactString(lines.join('\n'));
}

function pathCheck(path: string, purpose: string, required: boolean): FirestorePathCheck {
  return { path, purpose, required, status: 'BLOCKED', evidence: 'Not checked yet.' };
}

function schemaCheck(table: string, requiredColumns: string[], requiredIndexes: string[]): CloudSqlSchemaCheck {
  return { table, requiredColumns, requiredIndexes, status: 'BLOCKED', missingColumns: [], missingIndexes: [] };
}

function architectureFinding(): RuntimeDataPlaneFinding {
  const policy = getAskPraxisModelRuntimePolicy();
  return {
    id: 'architecture-ownership',
    status: 'PASS',
    severity: 'low',
    category: 'architecture',
    summary: 'Database ownership is explicit: Firestore owns user/app/capsule state; Cloud SQL owns Ask SQL memory and agent-run ledgers; PRAXIS remains canonical over execution substrates.',
    evidence: [
      'Firestore path inventory includes profiles, capsules, context stacks, conversations, documents, and output capsules.',
      'Cloud SQL schema inventory includes Ask thread tables and agent runtime tables.',
      `Ask PRAXIS model policy provider: ${policy.provider}`,
    ],
    affectedFlow: 'Architecture and operator repair decisions.',
    remediation: ['Do not introduce a replacement database owner without updating the architecture docs and migration plan.'],
  };
}

function findingsForFirestore(paths: FirestorePathCheck[], env: NodeJS.ProcessEnv): RuntimeDataPlaneFinding[] {
  const blocked = paths.filter((path) => path.status === 'BLOCKED' && path.required);
  const failed = paths.filter((path) => path.status === 'FAIL');
  const findings: RuntimeDataPlaneFinding[] = [];
  if (blocked.length) {
    findings.push({
      id: 'firestore-sample-blocked',
      status: 'BLOCKED',
      severity: 'medium',
      category: 'firestore',
      summary: 'Required Firestore data-plane paths were not sampled in this run.',
      evidence: blocked.map((path) => `${path.path}: ${path.evidence}`),
      affectedFlow: 'Profile, ContextCapsule, conversation, and output-capsule continuity.',
      remediation: [
        'Set PRAXIS_DIAGNOSTIC_UID to a non-demo diagnostic user and rerun npm run audit:runtime-data-plane.',
        'Confirm Firebase Admin credentials with npm run auth:doctor.',
      ],
    });
  }
  if (failed.length) {
    findings.push({
      id: 'firestore-required-path-missing',
      status: 'FAIL',
      severity: 'high',
      category: 'firestore',
      summary: 'One or more required Firestore paths were missing in the bounded diagnostic sample.',
      evidence: failed.map((path) => `${path.path}: ${path.evidence}`),
      affectedFlow: 'Capsule creation, Ask continuity, and output retrieval.',
      remediation: [
        'Seed or repair the affected diagnostic user record.',
        'Check Firestore rules/index changes before enabling a write canary.',
      ],
    });
  }
  if (env.PRAXIS_DIAGNOSTIC_WRITE_CANARY === '1') {
    findings.push({
      id: 'firestore-write-canary-enabled',
      status: 'WARN',
      severity: 'medium',
      category: 'firestore',
      summary: 'Write canary mode was explicitly enabled.',
      evidence: ['PRAXIS_DIAGNOSTIC_WRITE_CANARY=1'],
      affectedFlow: 'Production diagnostic behavior.',
      remediation: ['Ensure this run is targeting a disposable canary user before adding any write probes.'],
    });
  }
  return findings;
}

function findingsForCloudSql(schema: CloudSqlSchemaCheck[], env: NodeJS.ProcessEnv): RuntimeDataPlaneFinding[] {
  const sqlUrlConfigured = Boolean(env.ASK_THREAD_DATABASE_URL || env.AGENT_RUNTIME_DATABASE_URL || env.PRAXIS_DATABASE_URL || env.DATABASE_URL);
  const blocked = schema.filter((check) => check.status === 'BLOCKED');
  const failed = schema.filter((check) => check.status === 'FAIL');
  const findings: RuntimeDataPlaneFinding[] = [];
  if (!sqlUrlConfigured) {
    findings.push({
      id: 'cloud-sql-url-missing',
      status: 'WARN',
      severity: 'medium',
      category: 'cloud-sql',
      summary: 'Cloud SQL URL was not visible in this environment; Firestore can still carry app state but Ask SQL memory and durable agent ledgers are degraded.',
      evidence: ['Checked ASK_THREAD_DATABASE_URL, AGENT_RUNTIME_DATABASE_URL, PRAXIS_DATABASE_URL, and DATABASE_URL.'],
      affectedFlow: 'Ask SQL memory and queued agent-run durability.',
      remediation: [
        'Set ASK_THREAD_DATABASE_URL or AGENT_RUNTIME_DATABASE_URL from Secret Manager in the Cloud Run service.',
        'Rerun npm run audit:runtime-data-plane after the secret is mounted.',
      ],
    });
  } else if (blocked.length) {
    findings.push({
      id: 'cloud-sql-introspection-blocked',
      status: 'BLOCKED',
      severity: 'medium',
      category: 'cloud-sql',
      summary: 'A database URL exists, but schema introspection was not supplied or could not complete.',
      evidence: blocked.map((check) => `${check.table}: not introspected`),
      affectedFlow: 'Ask thread SQL memory and agent-run ledger proof.',
      remediation: ['Verify Cloud SQL network/auth and rerun the audit from an environment allowed to connect.'],
    });
  }
  if (failed.length) {
    findings.push({
      id: 'cloud-sql-schema-drift',
      status: 'FAIL',
      severity: 'critical',
      category: 'cloud-sql',
      summary: 'Cloud SQL schema is missing required tables, columns, or indexes.',
      evidence: failed.map((check) =>
        `${check.table}: missing columns [${check.missingColumns.join(', ') || 'none'}], indexes [${check.missingIndexes.join(', ') || 'none'}]`),
      affectedFlow: 'Ask persistence, agent receipts, approvals, tool calls, and dispatch retries.',
      remediation: [
        'Run the in-code schema initializer through a controlled app boot or migration.',
        'Compare src/lib/agent-runtime/postgres.ts and src/lib/agent-runtime/ask-thread-postgres.ts against production schema.',
      ],
    });
  }
  return findings;
}

function findingsForAiProvider(posture: AiProviderPosture): RuntimeDataPlaneFinding[] {
  const findings: RuntimeDataPlaneFinding[] = [];
  if (!posture.vertexProjectConfigured) {
    findings.push({
      id: 'vertex-project-missing',
      status: posture.googleAiFallbackConfigured ? 'WARN' : 'FAIL',
      severity: posture.googleAiFallbackConfigured ? 'medium' : 'high',
      category: 'ai-runtime',
      summary: posture.googleAiFallbackConfigured
        ? 'Vertex project is missing but Google AI key fallback is configured.'
        : 'Vertex project is missing and no Google AI fallback is visible.',
      evidence: [
        `Vertex location: ${posture.vertexLocation}`,
        `Google AI fallback: ${posture.googleAiFallbackConfigured ? 'configured' : 'missing'}`,
      ],
      affectedFlow: 'Ask model selection, Gemini runtime routing, and queued agent execution.',
      remediation: [
        'Set GOOGLE_VERTEX_PROJECT and GOOGLE_VERTEX_LOCATION/GOOGLE_VERTEX_GEMINI_LOCATION.',
        'Keep Google AI fallback configured only as a controlled fallback, not the canonical production posture.',
      ],
    });
  }
  if (!posture.embeddingsConfigured) {
    findings.push({
      id: 'embeddings-unconfigured',
      status: 'WARN',
      severity: 'medium',
      category: 'ai-runtime',
      summary: 'Embeddings configuration was not visible in this environment.',
      evidence: ['Checked GOOGLE_VERTEX_EMBEDDING_MODEL, EMBEDDING_MODEL, and GOOGLE_GENERATIVE_AI_EMBEDDING_MODEL.'],
      affectedFlow: 'Context retrieval, capsule evidence packs, and semantic memory.',
      remediation: ['Configure the approved embedding model or document why deterministic retrieval is sufficient for this environment.'],
    });
  }
  for (const warning of posture.warnings) {
    findings.push({
      id: `ai-provider-warning-${slug(warning)}`,
      status: 'WARN',
      severity: 'medium',
      category: 'ai-runtime',
      summary: warning,
      evidence: [`Frontier models: ${posture.frontierModels.join(', ')}`, `Fallback models: ${posture.fallbackModels.join(', ')}`],
      affectedFlow: 'Ask PRAXIS model routing.',
      remediation: ['Run npm run audit:ai-provider-vertex-default and align env with src/lib/ai/model-runtime-policy.ts.'],
    });
  }
  return findings;
}

function findingsForSecretsIam(posture: SecretsIamPosture): RuntimeDataPlaneFinding[] {
  const findings: RuntimeDataPlaneFinding[] = [];
  if (posture.firebaseAdminCredentials !== 'PASS') {
    findings.push({
      id: 'firebase-admin-credentials-blocked',
      status: 'BLOCKED',
      severity: 'high',
      category: 'secrets-iam',
      summary: 'Firebase Admin credentials are not visible to the diagnostic environment.',
      evidence: posture.evidence,
      affectedFlow: 'Profile, ContextCapsule, conversation, and output-capsule reads.',
      remediation: ['Run npm run auth:doctor and configure FIREBASE_SERVICE_ACCOUNT_KEY_FILE, FIREBASE_SERVICE_ACCOUNT_KEY, or ADC.'],
    });
  }
  if (posture.cloudTasksWorkerAuth !== 'PASS') {
    findings.push({
      id: 'cloud-tasks-worker-auth-missing',
      status: 'FAIL',
      severity: 'critical',
      category: 'secrets-iam',
      summary: 'Cloud Tasks worker authentication is not configured.',
      evidence: posture.evidence,
      affectedFlow: 'Durable queued agent dispatch and worker execution.',
      remediation: [
        'Set AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL and AGENT_RUN_WORKER_OIDC_AUDIENCE for OIDC worker auth.',
        'Use AGENT_RUN_WORKER_SHARED_SECRET only as a documented fallback.',
      ],
    });
  }
  return findings;
}

function findingsForRuntimeHealth(runtimeHealth: RuntimeHealthSummary | null): RuntimeDataPlaneFinding[] {
  if (!runtimeHealth) {
    return [{
      id: 'runtime-health-blocked',
      status: 'BLOCKED',
      severity: 'medium',
      category: 'preflight',
      summary: 'Runtime health collection did not complete.',
      evidence: ['collectRuntimeHealth returned null after catching an error.'],
      affectedFlow: 'Backend, database, and agent-platform readiness.',
      remediation: ['Run npm run audit:runtime-health-live and inspect /api/health/runtime.'],
    }];
  }
  if (runtimeHealth.status === 'ok') {
    return [{
      id: 'runtime-health-ok',
      status: 'PASS',
      severity: 'low',
      category: 'preflight',
      summary: 'Runtime health collection completed with ok status.',
      evidence: runtimeHealth.checks.map((check) => `${check.id}: ${check.status}`),
      affectedFlow: 'Runtime semaphore and Settings/System diagnostics.',
      remediation: ['Keep /api/health/runtime sanitized and linked from Settings/System.'],
    }];
  }
  return [{
    id: 'runtime-health-degraded',
    status: runtimeHealth.status === 'down' ? 'FAIL' : 'WARN',
    severity: runtimeHealth.status === 'down' ? 'critical' : 'medium',
    category: 'preflight',
    summary: `Runtime health is ${runtimeHealth.status}.`,
    evidence: runtimeHealth.checks.map((check) => `${check.id}: ${check.status}`),
    affectedFlow: 'Runtime semaphore, Settings/System, and operator debugging.',
    remediation: ['Open /app/settings?tab=system with an authenticated user and repair down checks first.'],
  }];
}

function continuityFinding(continuity: RuntimeContinuityCheck): RuntimeDataPlaneFinding {
  const statuses = [continuity.ownerUid, continuity.capsuleId, continuity.threadId, continuity.traceId];
  const status: RuntimeDataPlaneStatus = statuses.includes('FAIL')
    ? 'FAIL'
    : statuses.includes('BLOCKED')
      ? 'BLOCKED'
      : statuses.includes('WARN')
        ? 'WARN'
        : 'PASS';
  return {
    id: 'capsule-thread-agent-continuity',
    status,
    severity: status === 'PASS' ? 'low' : status === 'FAIL' ? 'critical' : 'high',
    category: 'agentic-chain',
    summary: 'Continuity check maps ownerUid, capsuleId, threadId, and traceId across Firestore and Cloud SQL.',
    evidence: continuity.evidence,
    affectedFlow: 'User asks a capsule, continues a conversation, queues a deep agent run, and reads the resulting receipt.',
    remediation: [
      'Ensure Ask requests persist capsuleId/threadId in Firestore and SQL.',
      'Ensure agent_runs carries owner_uid, capsule_id, context_package_id, and trace_id.',
    ],
  };
}

function canaryFinding(enabled: boolean): RuntimeDataPlaneFinding {
  return {
    id: 'write-canary-gate',
    status: enabled ? 'WARN' : 'PASS',
    severity: enabled ? 'medium' : 'low',
    category: 'preflight',
    summary: enabled
      ? 'Write canary mode is enabled by explicit environment flag.'
      : 'Write canary mode is disabled; this diagnostic is read-only.',
    evidence: [`PRAXIS_DIAGNOSTIC_WRITE_CANARY=${enabled ? '1' : 'not set'}`],
    affectedFlow: 'Production diagnostics and safety posture.',
    remediation: enabled
      ? ['Use only a canary user and remove the flag after the controlled write probe.']
      : ['Set PRAXIS_DIAGNOSTIC_WRITE_CANARY=1 only for an explicit controlled canary phase.'],
  };
}

function pathStatus(paths: FirestorePathCheck[], path: string): RuntimeDataPlaneStatus {
  return paths.find((check) => check.path === path)?.status ?? 'BLOCKED';
}

function tableStatus(schema: CloudSqlSchemaCheck[], table: string): RuntimeDataPlaneStatus {
  return schema.find((check) => check.table === table)?.status ?? 'BLOCKED';
}

function sortFindings(findings: RuntimeDataPlaneFinding[]): RuntimeDataPlaneFinding[] {
  const statusWeight: Record<RuntimeDataPlaneStatus, number> = { FAIL: 0, BLOCKED: 1, WARN: 2, PASS: 3 };
  const severityWeight = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...findings].sort((a, b) =>
    statusWeight[a.status] - statusWeight[b.status]
    || severityWeight[a.severity] - severityWeight[b.severity]
    || a.id.localeCompare(b.id));
}

function redactReport(report: RuntimeDataPlaneReport): RuntimeDataPlaneReport {
  return redactValue(report) as RuntimeDataPlaneReport;
}

function statusOnly(value: unknown): string {
  if (value === undefined || value === null || value === '') return 'missing';
  return 'configured';
}

async function safeRuntimeHealth(): Promise<RuntimeHealthSummary | null> {
  try {
    return await collectRuntimeHealth();
  } catch {
    return null;
  }
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'warning';
}
