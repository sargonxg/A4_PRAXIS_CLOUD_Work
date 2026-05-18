import { exec as execCallback } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

type DoctorMode = 'quick' | 'full' | 'canary';
type DoctorStatus = 'PASS' | 'WARN' | 'FAIL' | 'BLOCKED';

export type DoctorOptions = {
  baseUrl: string;
  project: string;
  region: string;
  mode: DoctorMode;
  outDir: string;
  jsonOnly: boolean;
  skipBuild: boolean;
  skipDeployCheck: boolean;
};

export type DoctorCheckResult = {
  id: string;
  lane: string;
  status: DoctorStatus;
  summary: string;
  evidence?: unknown[];
  remediation?: string[];
};

export type CanaryArtifact = {
  tag: string;
  kind: string;
  id?: string;
  cleanupStatus: 'planned' | 'not-needed' | 'cleaned' | 'leftover' | 'blocked';
  detail?: string;
};

export type DoctorReport = {
  runId: string;
  timestamp: string;
  commit: string;
  branch: string;
  baseUrl: string;
  project: string;
  region: string;
  cloudRunRevision?: string | null;
  checks: DoctorCheckResult[];
  artifacts?: CanaryArtifact[];
  cleanup?: {
    status: 'not-needed' | 'planned' | 'cleaned' | 'leftover' | 'blocked';
    leftovers: string[];
  };
};

type ExecResult = {
  code: number;
  stdout: string;
  stderr: string;
};

type ExecFn = (command: string) => Promise<ExecResult>;
type FetchFn = (url: string, init?: RequestInit) => Promise<{
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
  headers?: Headers;
}>;

type RunDeps = {
  options: DoctorOptions;
  exec?: ExecFn;
  fetch?: FetchFn;
  now?: Date;
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>;
  writeArtifacts?: boolean;
};

const execAsync = promisify(execCallback);

const DEFAULT_OPTIONS: DoctorOptions = {
  baseUrl: 'https://praxis.tacitus.me',
  project: 'praxisbytacitus',
  region: 'us-central1',
  mode: 'quick',
  outDir: 'docs/audits',
  jsonOnly: false,
  skipBuild: false,
  skipDeployCheck: false,
};

export function parseDoctorArgs(args: string[]): DoctorOptions {
  const options = { ...DEFAULT_OPTIONS };
  for (const arg of args) {
    const equalIndex = arg.indexOf('=');
    const name = equalIndex === -1 ? arg : arg.slice(0, equalIndex);
    const value = equalIndex === -1 ? undefined : arg.slice(equalIndex + 1);
    switch (name) {
      case '--base-url':
        options.baseUrl = requireValue(name, value).replace(/\/+$/, '');
        break;
      case '--project':
        options.project = requireValue(name, value);
        break;
      case '--region':
        options.region = requireValue(name, value);
        break;
      case '--mode': {
        const mode = requireValue(name, value);
        if (!['quick', 'full', 'canary'].includes(mode)) {
          throw new Error(`Invalid --mode value: ${mode}`);
        }
        options.mode = mode as DoctorMode;
        break;
      }
      case '--out':
        options.outDir = requireValue(name, value);
        break;
      case '--json':
        options.jsonOnly = true;
        break;
      case '--skip-build':
        options.skipBuild = true;
        break;
      case '--skip-deploy-check':
        options.skipDeployCheck = true;
        break;
      case '':
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

export function redactSecrets<T>(value: T): T {
  if (typeof value === 'string') {
    return redactString(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, redactSecrets(nested)])
    ) as T;
  }
  return value;
}

export function summarizeStatus(checks: DoctorCheckResult[]): Record<DoctorStatus, number> {
  return checks.reduce<Record<DoctorStatus, number>>(
    (summary, check) => {
      summary[check.status] += 1;
      return summary;
    },
    { PASS: 0, WARN: 0, FAIL: 0, BLOCKED: 0 }
  );
}

export function buildDoctorReport(input: DoctorReport): DoctorReport {
  return redactSecrets({
    ...input,
    checks: input.checks.map((check) => ({
      ...check,
      evidence: check.evidence ? redactSecrets(check.evidence) : undefined,
      remediation: check.remediation ? redactSecrets(check.remediation) : undefined,
    })),
    artifacts: input.artifacts ? redactSecrets(input.artifacts) : undefined,
    cleanup: input.cleanup ? redactSecrets(input.cleanup) : undefined,
  });
}

export function renderMarkdownReport(report: DoctorReport): string {
  const counts = summarizeStatus(report.checks);
  const lines = [
    `# PRAXIS Doctor - ${report.timestamp.slice(0, 10)}`,
    '',
    `- Run ID: \`${report.runId}\``,
    `- Base URL: \`${report.baseUrl}\``,
    `- Project: \`${report.project}\``,
    `- Region: \`${report.region}\``,
    `- Branch: \`${report.branch}\``,
    `- Commit: \`${report.commit}\``,
    `- Cloud Run revision: \`${report.cloudRunRevision ?? 'unknown'}\``,
    `- Summary: PASS=${counts.PASS}, WARN=${counts.WARN}, FAIL=${counts.FAIL}, BLOCKED=${counts.BLOCKED}`,
    '',
    '## Checks',
    '',
    '| Status | Lane | Check | Summary |',
    '| --- | --- | --- | --- |',
    ...report.checks.map((check) =>
      `| ${check.status} | ${escapeTable(check.lane)} | ${escapeTable(check.id)} | ${escapeTable(check.summary)} |`
    ),
    '',
  ];

  const withDetails = report.checks.filter((check) => check.evidence?.length || check.remediation?.length);
  if (withDetails.length > 0) {
    lines.push('## Evidence And Remediation', '');
    for (const check of withDetails) {
      lines.push(`### ${check.status} ${check.id}`, '');
      if (check.evidence?.length) {
        lines.push('Evidence:', '');
        for (const item of check.evidence) {
          lines.push(`- \`${stringifyEvidence(item)}\``);
        }
        lines.push('');
      }
      if (check.remediation?.length) {
        lines.push('Remediation:', '');
        for (const command of check.remediation) {
          lines.push(`- \`${command}\``);
        }
        lines.push('');
      }
    }
  }

  if (report.artifacts?.length) {
    lines.push('## Canary Artifacts', '');
    for (const artifact of report.artifacts) {
      lines.push(`- ${artifact.cleanupStatus}: ${artifact.kind} \`${artifact.id ?? artifact.tag}\``);
    }
    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

export function buildCanaryPlan(input: {
  now: Date;
  env: NodeJS.ProcessEnv | Record<string, string | undefined>;
}): {
  enabled: boolean;
  status: DoctorStatus;
  tag: string;
  email?: string;
  missing: string[];
  artifacts: CanaryArtifact[];
} {
  const tag = `praxis-doctor-canary-${formatStamp(input.now)}`;
  const email = input.env.PRAXIS_CANARY_EMAIL || input.env.TEST_FIREBASE_EMAIL;
  const password = input.env.PRAXIS_CANARY_PASSWORD || input.env.TEST_FIREBASE_PASSWORD;
  const missing = [
    input.env.PRAXIS_DOCTOR_WRITE_CANARY === '1' ? null : 'PRAXIS_DOCTOR_WRITE_CANARY=1',
    email ? null : 'PRAXIS_CANARY_EMAIL or TEST_FIREBASE_EMAIL',
    password ? null : 'PRAXIS_CANARY_PASSWORD or TEST_FIREBASE_PASSWORD',
  ].filter(Boolean) as string[];
  const enabled = missing.length === 0;
  return {
    enabled,
    status: enabled ? 'PASS' : 'BLOCKED',
    tag,
    email,
    missing,
    artifacts: [
      {
        tag,
        kind: 'doctor-canary-workflow',
        id: tag,
        cleanupStatus: enabled ? 'planned' : 'blocked',
        detail: enabled
          ? 'Canary write gate is enabled. Generated artifacts must be tagged and cleaned.'
          : `Canary write gate is disabled or missing credentials: ${missing.join(', ')}`,
      },
    ],
  };
}

export async function runPraxisDoctor(deps: RunDeps): Promise<DoctorReport> {
  const options = deps.options;
  const env = deps.env ?? process.env;
  const now = deps.now ?? new Date();
  const exec = deps.exec ?? shellExec;
  const fetchImpl = deps.fetch ?? globalThis.fetch.bind(globalThis);
  const checks: DoctorCheckResult[] = [];
  const runId = `doctor-${now.toISOString().replace(/[-:.]/g, '')}`;

  const [branch, commit, dirty, sync] = await Promise.all([
    commandText(exec, 'git branch --show-current'),
    commandText(exec, 'git rev-parse HEAD'),
    commandText(exec, 'git status --short'),
    commandText(exec, 'git rev-list --left-right --count origin/main...HEAD'),
  ]);

  checks.push(repoCheck('repo-branch', 'Repo is on main', branch, branch.stdout.trim() === 'main'));
  checks.push(repoCheck('repo-commit', 'Commit SHA resolved', commit, commit.code === 0 && commit.stdout.trim().length >= 7));
  checks.push({
    id: 'repo-dirty-state',
    lane: 'repo-and-deployability',
    status: dirty.code === 0 && dirty.stdout.trim() === '' ? 'PASS' : 'WARN',
    summary: dirty.stdout.trim() === '' ? 'Working tree is clean' : 'Working tree has uncommitted changes',
    evidence: [dirty.stdout.trim() || 'clean'],
  });
  checks.push({
    id: 'repo-origin-sync',
    lane: 'repo-and-deployability',
    status: sync.code === 0 && sync.stdout.trim() === '0\t0' ? 'PASS' : sync.code === 0 ? 'WARN' : 'BLOCKED',
    summary: sync.code === 0 ? `origin/main...HEAD = ${sync.stdout.trim() || 'unknown'}` : 'Could not compare with origin/main',
    evidence: [sync.stderr || sync.stdout],
    remediation: sync.code === 0 ? undefined : ['git fetch origin main', 'git rev-list --left-right --count origin/main...HEAD'],
  });

  if (!options.skipBuild) {
    const validationCommands = options.mode === 'quick'
      ? ['npm run typecheck']
      : [
          'npm run typecheck',
          'npm run build',
          'npm run lint',
          'npx vitest run tests/unit/lib/agent-runtime tests/unit/lib/health',
          'node scripts/audit-ai-routes.mjs',
          'npm run audit:repo-shape',
          'npm run audit:gcp',
          ...(options.mode === 'full' || options.mode === 'canary' ? ['npm run audit:gate'] : []),
        ];
    for (const command of validationCommands) {
      checks.push(await commandCheck(exec, commandId(command), 'repo-and-deployability', command));
    }
  }

  checks.push(await commandCheck(exec, 'auth-doctor', 'local-cloud-auth', 'npm run auth:doctor', {
    blockedOnFailure: true,
    remediation: [
      `gcloud auth application-default login --project=${options.project}`,
      'firebase login --reauth',
      'npm run auth:doctor -- --fix',
    ],
  }));

  let cloudRunRevision: string | null = null;
  if (!options.skipDeployCheck) {
    const cloudRun = await commandText(
      exec,
      `gcloud run services describe praxis-frontend --region=${options.region} --project=${options.project} --format=json`
    );
    cloudRunRevision = extractCloudRunRevision(cloudRun.stdout);
    checks.push({
      id: 'cloud-run-praxis-frontend',
      lane: 'gcp-firebase-infrastructure',
      status: cloudRun.code === 0 && cloudRunRevision ? 'PASS' : 'FAIL',
      summary: cloudRunRevision ? `praxis-frontend serving ${cloudRunRevision}` : 'Could not resolve Cloud Run revision for praxis-frontend',
      evidence: [cloudRun.code === 0 ? summarizeCloudRunService(cloudRun.stdout) : cloudRun.stderr],
      remediation: cloudRun.code === 0 && cloudRunRevision
        ? undefined
        : [`gcloud run services describe praxis-frontend --region=${options.region} --project=${options.project}`],
    });

    for (const check of infrastructureCommandChecks(options, env)) {
      checks.push(await commandCheck(exec, check.id, 'gcp-firebase-infrastructure', check.command, {
        soft: check.soft,
        remediation: check.remediation,
      }));
    }
  }

  for (const healthCheck of liveHealthChecks(options, env)) {
    checks.push(await fetchCheck(fetchImpl, healthCheck.id, 'live-production-health', healthCheck.url, healthCheck.init, healthCheck.soft));
  }

  const canaryPlan = buildCanaryPlan({ now, env });
  checks.push({
    id: 'canary-write-gate',
    lane: 'authenticated-full-canary',
    status: options.mode === 'canary' ? canaryPlan.status : 'WARN',
    summary: canaryPlan.enabled
      ? `Canary writes enabled for ${canaryPlan.email}`
      : `Canary writes disabled: ${canaryPlan.missing.join(', ')}`,
    evidence: [{ tag: canaryPlan.tag, email: canaryPlan.email ?? null }],
    remediation: canaryPlan.enabled ? undefined : [
      'Set PRAXIS_DOCTOR_WRITE_CANARY=1',
      'Set PRAXIS_CANARY_EMAIL and PRAXIS_CANARY_PASSWORD for the isolated canary account',
    ],
  });

  if (options.mode === 'canary' && canaryPlan.enabled) {
    checks.push(await runAuthenticatedCanary(fetchImpl, options, env, canaryPlan));
  }

  const report = buildDoctorReport({
    runId,
    timestamp: now.toISOString(),
    commit: commit.stdout.trim() || 'unknown',
    branch: branch.stdout.trim() || 'unknown',
    baseUrl: options.baseUrl,
    project: options.project,
    region: options.region,
    cloudRunRevision,
    checks,
    artifacts: canaryPlan.artifacts,
    cleanup: {
      status: canaryPlan.enabled ? 'planned' : 'blocked',
      leftovers: [],
    },
  });

  if (deps.writeArtifacts !== false) {
    await writeDoctorArtifacts(report, options.outDir);
  }

  return report;
}

async function runAuthenticatedCanary(
  fetchImpl: FetchFn,
  options: DoctorOptions,
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  canaryPlan: ReturnType<typeof buildCanaryPlan>
): Promise<DoctorCheckResult> {
  const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY || env.FIREBASE_WEB_API_KEY;
  if (!apiKey) {
    return {
      id: 'canary-authenticated-session',
      lane: 'authenticated-full-canary',
      status: 'BLOCKED',
      summary: 'Canary credentials are present, but Firebase Web API key is not available locally',
      evidence: [{ tag: canaryPlan.tag }],
      remediation: ['Set NEXT_PUBLIC_FIREBASE_API_KEY or FIREBASE_WEB_API_KEY before canary mode'],
    };
  }

  const email = canaryPlan.email!;
  const password = env.PRAXIS_CANARY_PASSWORD || env.TEST_FIREBASE_PASSWORD || '';
  const authResponse = await fetchImpl(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const authPayload = await readResponse(authResponse);
  if (!authResponse.ok || !isRecord(authPayload) || typeof authPayload.idToken !== 'string') {
    return {
      id: 'canary-authenticated-session',
      lane: 'authenticated-full-canary',
      status: 'FAIL',
      summary: `Firebase canary login failed with HTTP ${authResponse.status}`,
      evidence: [authPayload],
    };
  }

  const sessionResponse = await fetchImpl(`${options.baseUrl}/api/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: options.baseUrl,
    },
    body: JSON.stringify({ token: authPayload.idToken }),
  });
  return {
    id: 'canary-authenticated-session',
    lane: 'authenticated-full-canary',
    status: sessionResponse.ok ? 'PASS' : 'FAIL',
    summary: sessionResponse.ok
      ? `Authenticated canary session established for ${email}; write artifacts are planned with tag ${canaryPlan.tag}`
      : `App session establishment failed with HTTP ${sessionResponse.status}`,
    evidence: [{ status: sessionResponse.status, tag: canaryPlan.tag }],
    remediation: sessionResponse.ok ? undefined : ['Verify /api/auth/session and canary account Firebase status'],
  };
}

async function writeDoctorArtifacts(report: DoctorReport, outDir: string): Promise<void> {
  await mkdir(outDir, { recursive: true });
  const date = report.timestamp.slice(0, 10);
  await Promise.all([
    writeFile(`${outDir}/${date}-PRAXIS_DOCTOR.json`, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
    writeFile(`${outDir}/${date}-PRAXIS_DOCTOR.md`, renderMarkdownReport(report), 'utf8'),
  ]);
}

function infrastructureCommandChecks(
  options: DoctorOptions,
  env: NodeJS.ProcessEnv | Record<string, string | undefined>
): Array<{ id: string; command: string; soft?: boolean; remediation?: string[] }> {
  const queue = getRuntimeAgentQueue(env, options);
  return [
    {
      id: 'agent-run-queue',
      command: `gcloud tasks queues describe ${queue.queue} --location=${queue.location} --project=${queue.project}`,
      remediation: [`gcloud tasks queues create ${queue.queue} --location=${queue.location} --project=${queue.project}`],
    },
    { id: 'cloud-sql-instance', command: `gcloud sql instances describe praxisbytacitus-instance --project=${options.project}` },
    { id: 'firestore-database', command: `gcloud firestore databases describe --database="(default)" --project=${options.project}` },
    { id: 'secret-manager-cookie', command: `gcloud secrets describe praxis-cookie-secret --project=${options.project}` },
    { id: 'secret-manager-cron', command: `gcloud secrets describe praxis-cron-secret --project=${options.project}` },
    { id: 'pubsub-profile-events', command: `gcloud pubsub topics describe profile.events --project=${options.project}` },
    { id: 'pubsub-praxis-events', command: `gcloud pubsub topics describe praxis.events --project=${options.project}` },
    { id: 'scheduler-jobs', command: `gcloud scheduler jobs list --location=${options.region} --project=${options.project}`, soft: true },
    {
      id: 'agent-service-account',
      command: `gcloud iam service-accounts describe praxis-agents-sa@${options.project}.iam.gserviceaccount.com --project=${options.project}`,
    },
  ];
}

function getRuntimeAgentQueue(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
  options: DoctorOptions
): { project: string; location: string; queue: string; path: string } {
  const project = env.AGENT_RUN_TASKS_PROJECT || env.GOOGLE_CLOUD_PROJECT || env.GCLOUD_PROJECT || options.project;
  const location = env.AGENT_RUN_TASKS_LOCATION || env.GOOGLE_CLOUD_LOCATION || env.GCP_REGION || options.region;
  const queue = env.AGENT_RUN_TASKS_QUEUE || 'agent-runs';
  return {
    project,
    location,
    queue,
    path: `projects/${project}/locations/${location}/queues/${queue}`,
  };
}

function liveHealthChecks(
  options: DoctorOptions,
  env: NodeJS.ProcessEnv | Record<string, string | undefined>
): Array<{ id: string; url: string; init?: RequestInit; soft?: boolean }> {
  const checks: Array<{ id: string; url: string; init?: RequestInit; soft?: boolean }> = [
    { id: 'production-home', url: options.baseUrl },
    { id: 'production-login', url: `${options.baseUrl}/login` },
    { id: 'health-core', url: `${options.baseUrl}/api/health` },
    { id: 'health-runtime', url: `${options.baseUrl}/api/health/runtime` },
  ];
  if (env.CRON_SECRET) {
    checks.push({
      id: 'health-diagnostics',
      url: `${options.baseUrl}/api/health/diagnostics`,
      init: { headers: { Authorization: `Bearer ${env.CRON_SECRET}` } },
    });
  }
  return checks;
}

async function fetchCheck(
  fetchImpl: FetchFn,
  id: string,
  lane: string,
  url: string,
  init?: RequestInit,
  soft?: boolean
): Promise<DoctorCheckResult> {
  try {
    const response = await fetchImpl(url, init);
    const payload = await readResponse(response);
    const optionalDegraded = isOptionalHealthWarning(payload);
    return {
      id,
      lane,
      status: response.ok ? optionalDegraded ? 'WARN' : 'PASS' : soft ? 'WARN' : 'FAIL',
      summary: response.ok ? `HTTP ${response.status} from ${url}` : `HTTP ${response.status} from ${url}`,
      evidence: [payload],
      remediation: response.ok ? undefined : [`curl -i ${url}`],
    };
  } catch (error) {
    return {
      id,
      lane,
      status: soft ? 'WARN' : 'BLOCKED',
      summary: `Request failed for ${url}`,
      evidence: [error instanceof Error ? error.message : String(error)],
      remediation: [`curl -i ${url}`],
    };
  }
}

async function commandCheck(
  exec: ExecFn,
  id: string,
  lane: string,
  command: string,
  opts: { soft?: boolean; blockedOnFailure?: boolean; remediation?: string[] } = {}
): Promise<DoctorCheckResult> {
  const result = await commandText(exec, command);
  const ok = result.code === 0;
  return {
    id,
    lane,
    status: ok ? 'PASS' : opts.blockedOnFailure ? 'BLOCKED' : opts.soft ? 'WARN' : 'FAIL',
    summary: ok ? `${command} passed` : `${command} exited ${result.code}`,
    evidence: [result.stdout || result.stderr],
    remediation: ok ? undefined : opts.remediation ?? [command],
  };
}

async function commandText(exec: ExecFn, command: string): Promise<ExecResult> {
  try {
    return await exec(command);
  } catch (error) {
    return {
      code: 1,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
    };
  }
}

function repoCheck(id: string, successSummary: string, result: ExecResult, ok: boolean): DoctorCheckResult {
  return {
    id,
    lane: 'repo-and-deployability',
    status: ok ? 'PASS' : 'FAIL',
    summary: ok ? successSummary : `${id} failed`,
    evidence: [result.stdout || result.stderr],
  };
}

async function shellExec(command: string): Promise<ExecResult> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 20,
      windowsHide: true,
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const err = error as { code?: number; stdout?: string; stderr?: string; message?: string };
    return {
      code: typeof err.code === 'number' ? err.code : 1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? err.message ?? 'command failed',
    };
  }
}

async function readResponse(response: Awaited<ReturnType<FetchFn>>): Promise<unknown> {
  try {
    if (response.json) return await response.json();
  } catch {
    // Fall through to text.
  }
  try {
    if (response.text) return await response.text();
  } catch {
    // Return status if the body cannot be consumed.
  }
  return { status: response.status };
}

function isOptionalHealthWarning(payload: unknown): boolean {
  if (!isRecord(payload)) return false;
  const checks = isRecord(payload.checks) ? payload.checks : null;
  if (!checks) return false;
  return checks.cognee_memory === 'unconfigured' || checks.polar === 'unconfigured';
}

function extractCloudRunRevision(output: string): string | null {
  try {
    const parsed = JSON.parse(output) as {
      status?: { latestReadyRevisionName?: string; traffic?: Array<{ revisionName?: string }> };
    };
    return parsed.status?.traffic?.find((item) => item.revisionName)?.revisionName
      || parsed.status?.latestReadyRevisionName
      || null;
  } catch {
    return output.trim() || null;
  }
}

function summarizeCloudRunService(output: string): unknown {
  try {
    const parsed = JSON.parse(output) as {
      metadata?: { name?: string };
      status?: {
        latestReadyRevisionName?: string;
        traffic?: Array<{ revisionName?: string; percent?: number; latestRevision?: boolean }>;
        conditions?: Array<{ type?: string; status?: string }>;
      };
    };
    return {
      service: parsed.metadata?.name ?? 'praxis-frontend',
      latestReadyRevisionName: parsed.status?.latestReadyRevisionName ?? null,
      traffic: parsed.status?.traffic?.map((item) => ({
        revisionName: item.revisionName ?? null,
        percent: item.percent ?? null,
        latestRevision: item.latestRevision === true,
      })) ?? [],
      ready: parsed.status?.conditions?.find((item) => item.type === 'Ready')?.status ?? null,
    };
  } catch {
    return output;
  }
}

function commandId(command: string): string {
  return command
    .replace(/^npm run /, '')
    .replace(/^npx /, '')
    .replace(/^node scripts\//, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function stringifyEvidence(item: unknown): string {
  if (typeof item === 'string') return item.replace(/\s+/g, ' ').trim().slice(0, 500);
  return JSON.stringify(item).replace(/\s+/g, ' ').trim().slice(0, 500);
}

function redactString(value: string): string {
  return value
    .replace(/AIza[0-9A-Za-z_-]+/g, '[REDACTED_API_KEY]')
    .replace(/\bAQ\.[0-9A-Za-z_-]+/g, '[REDACTED_APP_CHECK_KEY]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]*gserviceaccount\.com/gi, '[REDACTED_SERVICE_ACCOUNT]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/(Authorization:\s*)([^\r\n]+)/gi, '$1[REDACTED]')
    .replace(/(X-Diagnostic-Token:\s*)([^\r\n"]+)/gi, '$1[REDACTED]')
    .replace(/(tacitus-auth-session=)[^;\s"]+/gi, '$1[REDACTED]')
    .replace(/(key=)[A-Za-z0-9_-]+/gi, '$1[REDACTED]')
    .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]')
    .replace(/("?(?:password|token|secret|cookie|private_key|client_email)"?\s*[:=]\s*"?)([^",\s}]+)/gi, '$1[REDACTED]');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function formatStamp(date: Date): string {
  return date.toISOString().replace(/[-:.]/g, '').replace('Z', 'Z');
}

function requireValue(name: string, value?: string): string {
  if (!value) throw new Error(`${name} requires a value`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

async function main() {
  const options = parseDoctorArgs(process.argv.slice(2));
  const report = await runPraxisDoctor({ options });
  if (options.jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(renderMarkdownReport(report));
  }
  const counts = summarizeStatus(report.checks);
  if (counts.FAIL > 0 || counts.BLOCKED > 0) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
