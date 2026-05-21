import { exec as execCallback } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

type DoctorMode = 'quick' | 'full' | 'canary';
type DoctorStatus = 'PASS' | 'WARN' | 'FAIL' | 'BLOCKED';
type DiagnosticsStatus = 'ok' | 'warn' | 'blocked';
type RedFlagLane = 'blocking' | 'needs-auth' | 'stale-artifact' | 'security-dependency' | 'canary-gated';

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

export type DoctorRedFlag = {
  id: string;
  label: string;
  severity: DiagnosticsStatus;
  lane: RedFlagLane;
  summary: string;
  actionHref?: string;
};

export type AuditArtifactSnapshot = {
  path: string;
  commit?: string | null;
  cloudRunRevision?: string | null;
};

export type ArtifactFreshnessSummary = {
  commit: string;
  cloudRunRevision?: string | null;
  staleArtifactCount: number;
  artifacts?: AuditArtifactSnapshot[];
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
  status?: DiagnosticsStatus;
  redFlags?: DoctorRedFlag[];
  artifactFreshness?: ArtifactFreshnessSummary;
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

type CanaryStepResult = {
  step: string;
  status: DoctorStatus;
  httpStatus?: number;
  id?: string | null;
  detail?: string;
};

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
  const artifactFreshness = input.artifactFreshness ?? buildArtifactFreshness({
    commit: input.commit,
    cloudRunRevision: input.cloudRunRevision,
    artifacts: [],
  });
  const redFlags = input.redFlags ?? classifyDoctorRedFlags({
    commit: input.commit,
    cloudRunRevision: input.cloudRunRevision,
    checks: input.checks,
    artifactFreshness,
  });
  const status: DiagnosticsStatus = input.status ?? (
    redFlags.some((flag) => flag.severity === 'blocked')
      ? 'blocked'
      : redFlags.length > 0
        ? 'warn'
        : 'ok'
  );
  return redactSecrets({
    ...input,
    status,
    redFlags,
    artifactFreshness,
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
    `- Diagnostics status: \`${report.status ?? 'ok'}\``,
    `- Stale diagnostic artifacts: \`${report.artifactFreshness?.staleArtifactCount ?? 0}\``,
    `- Summary: PASS=${counts.PASS}, WARN=${counts.WARN}, FAIL=${counts.FAIL}, BLOCKED=${counts.BLOCKED}`,
    '',
    '## Red Flags',
    '',
    ...(report.redFlags?.length
      ? [
          '| Severity | Lane | Finding | Summary |',
          '| --- | --- | --- | --- |',
          ...report.redFlags.map((flag) =>
            `| ${flag.severity} | ${escapeTable(flag.lane)} | ${escapeTable(flag.label)} | ${escapeTable(flag.summary)} |`
          ),
        ]
      : ['No blocking red flags.']),
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

export function buildArtifactFreshness(input: {
  commit: string;
  cloudRunRevision?: string | null;
  artifacts: AuditArtifactSnapshot[];
}): ArtifactFreshnessSummary {
  const staleArtifacts = input.artifacts.filter((artifact) => {
    const staleCommit = Boolean(artifact.commit && artifact.commit !== input.commit);
    const staleRevision = Boolean(
      input.cloudRunRevision
        && artifact.cloudRunRevision
        && artifact.cloudRunRevision !== input.cloudRunRevision
    );
    return staleCommit || staleRevision;
  });
  return {
    commit: input.commit,
    cloudRunRevision: input.cloudRunRevision ?? null,
    staleArtifactCount: staleArtifacts.length,
    artifacts: input.artifacts,
  };
}

export function classifyDoctorRedFlags(input: {
  commit: string;
  cloudRunRevision?: string | null;
  checks: DoctorCheckResult[];
  artifactFreshness?: ArtifactFreshnessSummary;
}): DoctorRedFlag[] {
  const liveRuntimeReady = input.checks.some((check) =>
    check.id === 'health-runtime' && check.status === 'PASS'
  );
  const liveAgenticReady = input.checks.some((check) =>
    check.id === 'health-agentic-search' && check.status === 'PASS'
  );
  const redFlags: DoctorRedFlag[] = [];

  for (const check of input.checks) {
    if (check.id === 'auth-doctor' && check.status !== 'PASS') {
      redFlags.push({
        id: check.id,
        label: 'Local cloud auth',
        severity: check.status === 'BLOCKED' ? 'blocked' : 'warn',
        lane: 'needs-auth',
        summary: liveRuntimeReady && liveAgenticReady
          ? `${check.summary}; local only while production runtime and agentic-search health are ready.`
          : check.summary,
        actionHref: '/app/settings?tab=system',
      });
      continue;
    }
    if (check.id === 'canary-write-gate' && check.status !== 'PASS') {
      redFlags.push({
        id: check.id,
        label: 'Authenticated canary gate',
        severity: 'warn',
        lane: 'canary-gated',
        summary: check.summary,
        actionHref: '/app/settings?tab=system',
      });
      continue;
    }
    if (check.id === 'package-audit-summary' && check.status !== 'PASS') {
      redFlags.push({
        id: check.id,
        label: 'Dependency advisory summary',
        severity: 'warn',
        lane: 'security-dependency',
        summary: check.summary,
        actionHref: '/app/settings?tab=system',
      });
      continue;
    }
    if (check.status === 'FAIL' || (check.status === 'BLOCKED' && check.lane !== 'local-cloud-auth')) {
      redFlags.push({
        id: check.id,
        label: check.id,
        severity: 'blocked',
        lane: 'blocking',
        summary: check.summary,
        actionHref: '/app/settings?tab=system',
      });
    }
  }

  if ((input.artifactFreshness?.staleArtifactCount ?? 0) > 0) {
    redFlags.push({
      id: 'stale-diagnostic-artifacts',
      label: 'Stale diagnostic artifacts',
      severity: 'warn',
      lane: 'stale-artifact',
      summary: `${input.artifactFreshness?.staleArtifactCount ?? 0} saved doctor/eval artifact(s) do not match HEAD or the latest ready Cloud Run revision.`,
      actionHref: '/app/settings?tab=system',
    });
  }

  return redFlags;
}

export function parseAuditAdvisorySummary(stdout: string): {
  total: number;
  forcedOrBreaking: number;
  summary: string;
} {
  const parsed = safeJsonParse(stdout);
  const parsedRecord = isRecord(parsed) ? parsed : {};
  const vulnerabilities = isRecord(parsedRecord.vulnerabilities) ? parsedRecord.vulnerabilities : {};
  const entries = Object.values(vulnerabilities).filter(isRecord);
  const forcedOrBreaking = entries.filter((entry) => {
    const fixAvailable = entry.fixAvailable;
    return isRecord(fixAvailable) && (fixAvailable.isSemVerMajor === true || fixAvailable.force === true);
  }).length;
  return {
    total: entries.length,
    forcedOrBreaking,
    summary: forcedOrBreaking > 0
      ? `${forcedOrBreaking} advisory group(s) require forced or breaking updates`
      : entries.length > 0
        ? `${entries.length} advisory group(s) remain without forced breaking fixes`
        : 'No npm audit advisories reported',
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

  const auditResult = await commandText(exec, 'npm audit --json');
  const auditSummary = parseAuditAdvisorySummary(auditResult.stdout || auditResult.stderr || '{}');
  checks.push({
    id: 'package-audit-summary',
    lane: 'repo-and-deployability',
    status: auditSummary.forcedOrBreaking > 0 ? 'WARN' : 'PASS',
    summary: auditSummary.summary,
    evidence: [{ total: auditSummary.total, forcedOrBreaking: auditSummary.forcedOrBreaking }],
    remediation: auditSummary.forcedOrBreaking > 0 ? ['Review npm audit --json before forced or SemVer-major dependency changes.'] : undefined,
  });

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
    if (cloudRun.code === 0) {
      checks.push(...cloudRunRuntimeConfigChecks(cloudRun.stdout, options));
    }

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

  const artifactFreshness = buildArtifactFreshness({
    commit: commit.stdout.trim() || 'unknown',
    cloudRunRevision,
    artifacts: deps.writeArtifacts === false ? [] : await readAuditArtifactSnapshots(options.outDir),
  });

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
    artifactFreshness,
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
  const steps: CanaryStepResult[] = [];
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

  const publicHomeResponse = await fetchImpl(`${options.baseUrl}/?canary=${encodeURIComponent(canaryPlan.tag)}`);
  steps.push({
    step: 'public-home',
    status: publicHomeResponse.ok ? 'PASS' : 'FAIL',
    httpStatus: publicHomeResponse.status,
    detail: 'Public prompt surface reachable before login.',
  });
  if (!publicHomeResponse.ok) {
    return canaryResult({
      status: 'FAIL',
      canaryPlan,
      steps,
      summary: `Public Home failed before authenticated canary with HTTP ${publicHomeResponse.status}`,
      remediation: [`curl -i ${options.baseUrl}`],
    });
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
  steps.push({
    step: 'firebase-login',
    status: 'PASS',
    httpStatus: authResponse.status,
    detail: `Firebase accepted the canary user ${email}.`,
  });

  const sessionResponse = await fetchImpl(`${options.baseUrl}/api/auth/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: options.baseUrl,
    },
    body: JSON.stringify({ token: authPayload.idToken }),
  });
  const sessionPayload = await readResponse(sessionResponse);
  const cookieHeader = extractCookieHeader(sessionResponse.headers, 'tacitus-auth-session');
  steps.push({
    step: 'app-session',
    status: sessionResponse.ok && cookieHeader ? 'PASS' : 'FAIL',
    httpStatus: sessionResponse.status,
    detail: cookieHeader
      ? 'App session cookie established.'
      : 'App session response did not include tacitus-auth-session.',
  });
  if (!sessionResponse.ok || !cookieHeader) {
    return canaryResult({
      status: 'FAIL',
      canaryPlan,
      steps,
      summary: sessionResponse.ok
        ? 'App session endpoint responded, but no session cookie was available for authenticated writes'
        : `App session establishment failed with HTTP ${sessionResponse.status}`,
      evidence: [sessionPayload],
      remediation: ['Verify /api/auth/session, cookie signing secrets, and canary account Firebase status'],
    });
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    Cookie: cookieHeader,
    Origin: options.baseUrl,
  };
  const sessionCheckResponse = await fetchImpl(`${options.baseUrl}/api/auth/session`, {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  const sessionCheckPayload = await readResponse(sessionCheckResponse);
  const authenticated = isRecord(sessionCheckPayload) && sessionCheckPayload.authenticated === true;
  steps.push({
    step: 'authenticated-session-read',
    status: sessionCheckResponse.ok && authenticated ? 'PASS' : 'FAIL',
    httpStatus: sessionCheckResponse.status,
    detail: authenticated ? 'Authenticated session readback succeeded.' : 'Session readback did not return authenticated=true.',
  });
  if (!sessionCheckResponse.ok || !authenticated) {
    return canaryResult({
      status: 'FAIL',
      canaryPlan,
      steps,
      summary: `Authenticated session readback failed with HTTP ${sessionCheckResponse.status}`,
      evidence: [sessionCheckPayload],
      remediation: ['Verify canary user onboarding state and auth middleware cookie parsing'],
    });
  }

  const capsuleId = canaryPlan.tag;
  const threadId = `${canaryPlan.tag}-thread`.slice(0, 96);
  const outputDestination = 'memo_studio';
  const capsuleResponse = await fetchImpl(`${options.baseUrl}/api/context/capsules`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'create',
      capsuleId,
      label: `Doctor canary ${canaryPlan.tag}`,
      scope: 'situation',
      coreRefs: {
        situationCoreId: canaryPlan.tag,
        sourceCoreIds: [`${canaryPlan.tag}:source`],
        documentCoreIds: [],
        outputCoreIds: [outputDestination],
        toolCoreIds: ['ask-praxis', 'research-memo'],
        memoryCoreId: `${canaryPlan.tag}:memory`,
      },
      retrievalPolicy: {
        layers: ['sources', 'documents'],
        limit: 5,
        checkFreshness: true,
        freshnessWindowDays: 30,
      },
      community: {
        tags: ['doctor-canary', canaryPlan.tag, 'cleanup:planned'],
        listedInMarketplace: false,
      },
      activeForSituationIds: [canaryPlan.tag],
    }),
  });
  const capsulePayload = await readResponse(capsuleResponse);
  const capsuleStatus = canaryHttpStatus(capsuleResponse.status);
  steps.push({
    step: 'active-capsule-create',
    status: capsuleResponse.ok ? 'PASS' : capsuleStatus,
    httpStatus: capsuleResponse.status,
    id: capsuleId,
    detail: 'Canary ContextCapsule created for the authenticated user.',
  });
  if (!capsuleResponse.ok) {
    return canaryResult({
      status: capsuleStatus,
      canaryPlan,
      steps,
      summary: `Canary capsule creation failed with HTTP ${capsuleResponse.status}`,
      evidence: [capsulePayload],
      remediation: ['Verify Firestore admin access and /api/context/capsules owner-scoped writes'],
    });
  }
  canaryPlan.artifacts.push({
    tag: canaryPlan.tag,
    kind: 'context-capsule',
    id: capsuleId,
    cleanupStatus: 'planned',
    detail: 'Created by doctor canary; safe to remove by tag after validation.',
  });

  const activateResponse = await fetchImpl(`${options.baseUrl}/api/context/capsules`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'activate',
      capsuleId,
      situationId: canaryPlan.tag,
    }),
  });
  const activatePayload = await readResponse(activateResponse);
  const activateStatus = canaryHttpStatus(activateResponse.status);
  steps.push({
    step: 'active-capsule-activate',
    status: activateResponse.ok ? 'PASS' : activateStatus,
    httpStatus: activateResponse.status,
    id: capsuleId,
    detail: 'Canary ContextCapsule activated for the golden path thread.',
  });
  if (!activateResponse.ok) {
    return canaryResult({
      status: activateStatus,
      canaryPlan,
      steps,
      summary: `Canary capsule activation failed with HTTP ${activateResponse.status}`,
      evidence: [activatePayload],
      remediation: ['Verify capsule activation and activeForSituationIds writes'],
    });
  }

  const activeContextStack = {
    stackId: 'default',
    capsuleId,
    userModelId: null,
    situationId: canaryPlan.tag,
    sourceIds: [`${canaryPlan.tag}:source`],
    documentIds: [],
    outputGoal: outputDestination,
    evidenceGaps: [`${canaryPlan.tag}:source-gap`],
    canvasLayout: {},
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
  };
  const askResponse = await fetchImpl(`${options.baseUrl}/api/conversations/${encodeURIComponent(threadId)}/turns`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: `Doctor canary ${canaryPlan.tag}: produce a concise source-aware memo receipt for this active capsule.`,
        },
      ],
      capsuleId,
      appliedCapsules: [{ id: capsuleId, label: `Doctor canary ${canaryPlan.tag}`, role: 'situation' }],
      currentToolId: 'ask-praxis',
      currentPath: `/app?thread=${encodeURIComponent(threadId)}&capsuleId=${encodeURIComponent(capsuleId)}`,
      activeContextStack,
      aiSettings: {
        provider: 'vertex',
        analysisDepth: 'standard',
        agenticSearchPremium: false,
      },
    }),
  });
  const askPayload = await readResponse(askResponse);
  const askStatus = canaryHttpStatus(askResponse.status);
  steps.push({
    step: 'ask-praxis-thread',
    status: askResponse.ok ? 'PASS' : askStatus,
    httpStatus: askResponse.status,
    id: threadId,
    detail: 'Ask PRAXIS turn submitted against the active capsule.',
  });
  if (!askResponse.ok) {
    return canaryResult({
      status: askStatus,
      canaryPlan,
      steps,
      summary: `Ask PRAXIS canary turn failed with HTTP ${askResponse.status}`,
      evidence: [askPayload],
      remediation: [
        'Verify logged-in Ask PRAXIS model/runtime env and monthly test-user allowance',
        'npm run test:auth-runtime:product',
      ],
    });
  }
  canaryPlan.artifacts.push({
    tag: canaryPlan.tag,
    kind: 'conversation-thread',
    id: threadId,
    cleanupStatus: 'planned',
    detail: 'Created by doctor canary; same-thread receipt is verified before pass.',
  });

  const runResponse = await fetchImpl(`${options.baseUrl}/api/agents/runs`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      capsuleId,
      contextStackId: 'default',
      contextPackageId: `capsule:${capsuleId}:v1`,
      selectedCoreIds: {
        situationCoreId: canaryPlan.tag,
        sourceCoreIds: [`${canaryPlan.tag}:source`],
        documentCoreIds: [],
        toolCoreIds: ['ask-praxis', 'research-memo'],
        outputCoreIds: [outputDestination],
        memoryCoreId: `${canaryPlan.tag}:memory`,
      },
      policyAgentId: 'research-memo',
      outputDestination,
      triggerType: 'manual',
      objective: `Doctor canary ${canaryPlan.tag}: prove queued AgentRun worker output returns to Memo Studio.`,
      traceId: canaryPlan.tag,
      idempotencyKey: `${canaryPlan.tag}-research-memo`,
      metadata: {
        canary: true,
        tag: canaryPlan.tag,
        threadId,
        activeContextStack,
        appliedCapsules: [{ id: capsuleId, label: `Doctor canary ${canaryPlan.tag}`, role: 'situation' }],
        sourcePosture: 'doctor-canary',
        selectedTools: ['ask-praxis', 'research-memo'],
      },
    }),
  });
  const runPayload = await readResponse(runResponse);
  const runId = extractRunId(runPayload);
  const runCreateStatus = canaryHttpStatus(runResponse.status);
  steps.push({
    step: 'agent-run-create',
    status: runResponse.ok && runId ? 'PASS' : runCreateStatus,
    httpStatus: runResponse.status,
    id: runId,
    detail: `AgentRun created for ${outputDestination}.`,
  });
  if (!runResponse.ok || !runId) {
    return canaryResult({
      status: runCreateStatus,
      canaryPlan,
      steps,
      summary: `AgentRun creation failed with HTTP ${runResponse.status}`,
      evidence: [runPayload],
      remediation: ['Verify AGENT_RUNTIME_DATABASE_URL / PRAXIS_DATABASE_URL / DATABASE_URL and Cloud SQL connectivity'],
    });
  }
  canaryPlan.artifacts.push({
    tag: canaryPlan.tag,
    kind: 'agent-run',
    id: runId,
    cleanupStatus: 'planned',
    detail: 'Created by doctor canary; should complete through the worker and remain auditable by run id.',
  });

  const dispatchResponse = await fetchImpl(`${options.baseUrl}/api/agents/runs/${encodeURIComponent(runId)}/dispatch`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ attempt: 1 }),
  });
  const dispatchPayload = await readResponse(dispatchResponse);
  const dispatchStatus = canaryHttpStatus(dispatchResponse.status);
  steps.push({
    step: 'agent-run-dispatch',
    status: dispatchResponse.ok ? 'PASS' : dispatchStatus,
    httpStatus: dispatchResponse.status,
    id: runId,
    detail: 'AgentRun dispatch requested through Cloud Tasks.',
  });
  if (!dispatchResponse.ok) {
    return canaryResult({
      status: dispatchStatus,
      canaryPlan,
      steps,
      summary: `AgentRun dispatch failed with HTTP ${dispatchResponse.status}`,
      evidence: [dispatchPayload],
      remediation: ['Verify AGENT_RUN_WORKER_BASE_URL and worker auth/OIDC env on praxis-frontend'],
    });
  }

  let runReadPayload: unknown = runPayload;
  let runReadStatus = extractRunStatus(runPayload) ?? null;
  const pollMs = Math.max(0, Number(env.PRAXIS_CANARY_POLL_MS ?? 1500));
  const pollAttempts = Math.max(1, Math.min(10, Number(env.PRAXIS_CANARY_POLL_ATTEMPTS ?? 5)));
  for (let attempt = 1; attempt <= pollAttempts; attempt += 1) {
    if (attempt > 1 && pollMs > 0) await sleep(pollMs);
    const readResponse = await fetchImpl(`${options.baseUrl}/api/agents/runs/${encodeURIComponent(runId)}`, {
      method: 'GET',
      headers: { Cookie: cookieHeader },
    });
    runReadPayload = await readResponseJsonOrText(readResponse);
    runReadStatus = extractRunStatus(runReadPayload) ?? runReadStatus;
    if (!readResponse.ok) {
      steps.push({
        step: 'agent-run-read',
        status: canaryHttpStatus(readResponse.status),
        httpStatus: readResponse.status,
        id: runId,
        detail: 'AgentRun readback failed.',
      });
      return canaryResult({
        status: canaryHttpStatus(readResponse.status),
        canaryPlan,
        steps,
        summary: `AgentRun readback failed with HTTP ${readResponse.status}`,
        evidence: [runReadPayload],
        remediation: ['Verify owner-scoped AgentRun read route and Cloud SQL ledger connectivity'],
      });
    }
    if (runReadStatus && ['succeeded', 'failed', 'cancelled', 'expired'].includes(runReadStatus)) break;
  }
  const workerStatus: DoctorStatus = runReadStatus === 'succeeded'
    ? 'PASS'
    : runReadStatus && ['failed', 'cancelled', 'expired'].includes(runReadStatus)
      ? 'FAIL'
      : 'BLOCKED';
  steps.push({
    step: 'agent-run-worker-completion',
    status: workerStatus,
    id: runId,
    detail: runReadStatus
      ? `AgentRun status after polling: ${runReadStatus}.`
      : 'AgentRun status was not available after polling.',
  });
  if (workerStatus !== 'PASS') {
    return canaryResult({
      status: workerStatus,
      canaryPlan,
      steps,
      summary: runReadStatus
        ? `AgentRun ${runId} did not complete successfully; final observed status ${runReadStatus}`
        : `AgentRun ${runId} did not report a terminal worker status during the canary window`,
      evidence: [runReadPayload],
      remediation: ['Inspect Cloud Tasks delivery, praxis-agent-worker logs, and agent_run_events for the canary run id'],
    });
  }

  const memoResponse = await fetchImpl(`${options.baseUrl}/api/memos/from-ask-pack`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      situationId: canaryPlan.tag,
      askTurnId: `${threadId}:doctor-canary`,
      pack: {
        title: `Doctor canary memo ${canaryPlan.tag}`,
        prompt: `Doctor canary ${canaryPlan.tag}`,
        answer: `Authenticated canary ${canaryPlan.tag} produced an AgentRun ${runId} with Memo Studio output destination.`,
        sourceCards: [
          {
            id: `${canaryPlan.tag}:source`,
            title: 'Doctor canary source receipt',
            label: 'Canary source',
            sourceType: 'doctor-canary',
            quotePreview: 'Synthetic doctor canary source card used only for write-path validation.',
            confidence: 0.8,
          },
        ],
        gaps: ['Synthetic doctor canary artifacts are tagged cleanup:planned.'],
        provenance: {
          capsuleId,
          capsuleVersion: 1,
          threadId,
          model: 'doctor-canary',
          provider: 'deterministic',
          contextPackageId: `capsule:${capsuleId}:v1`,
          generatedAt: new Date().toISOString(),
        },
      },
    }),
  });
  const memoPayload = await readResponse(memoResponse);
  const memoStatus = canaryHttpStatus(memoResponse.status);
  const memoId = extractMemoId(memoPayload);
  steps.push({
    step: 'memo-output-capsule',
    status: memoResponse.ok ? 'PASS' : memoStatus,
    httpStatus: memoResponse.status,
    id: memoId,
    detail: 'Memo Studio draft persisted from the Ask document pack.',
  });
  if (!memoResponse.ok) {
    return canaryResult({
      status: memoStatus,
      canaryPlan,
      steps,
      summary: `Memo/OutputCapsule persistence failed with HTTP ${memoResponse.status}`,
      evidence: [memoPayload],
      remediation: ['Verify /api/memos/from-ask-pack and Firestore memo writes for the canary user'],
    });
  }
  canaryPlan.artifacts.push({
    tag: canaryPlan.tag,
    kind: 'memo-draft',
    id: memoId ?? `${canaryPlan.tag}__policy-memo`,
    cleanupStatus: 'planned',
    detail: 'Created by doctor canary from the Ask document pack.',
  });

  const threadResponse = await fetchImpl(`${options.baseUrl}/api/conversations/${encodeURIComponent(threadId)}`, {
    method: 'GET',
    headers: { Cookie: cookieHeader },
  });
  const threadPayload = await readResponse(threadResponse);
  const sameThread = isRecord(threadPayload)
    && isRecord(threadPayload.conversation)
    && threadPayload.conversation.conversationId === threadId;
  const threadStatus = canaryHttpStatus(threadResponse.status);
  steps.push({
    step: 'same-thread-receipt',
    status: threadResponse.ok && sameThread ? 'PASS' : threadStatus,
    httpStatus: threadResponse.status,
    id: threadId,
    detail: sameThread ? 'Conversation receipt resolved on the original thread.' : 'Original conversation thread was not found.',
  });
  if (!threadResponse.ok || !sameThread) {
    return canaryResult({
      status: threadStatus,
      canaryPlan,
      steps,
      summary: `Same-thread receipt failed with HTTP ${threadResponse.status}`,
      evidence: [threadPayload],
      remediation: ['Verify conversation persistence and saved-thread readback for authenticated Ask turns'],
    });
  }

  return canaryResult({
    status: 'PASS',
    canaryPlan,
    steps,
    summary: `Authenticated canary passed for ${email}: capsule ${capsuleId}, Ask thread ${threadId}, AgentRun ${runId}, output ${outputDestination}, memo ${memoId ?? 'recorded'}, cleanup planned`,
    evidence: [{
      tag: canaryPlan.tag,
      email,
      capsuleId,
      threadId,
      runId,
      runStatus: runReadStatus,
      outputDestination,
      outputHref: extractOutputHref(runReadPayload) ?? '/app?panel=memo',
      memoId,
      cleanup: 'planned',
    }],
  });
}

function canaryResult(input: {
  status: DoctorStatus;
  canaryPlan: ReturnType<typeof buildCanaryPlan>;
  steps: CanaryStepResult[];
  summary: string;
  evidence?: unknown[];
  remediation?: string[];
}): DoctorCheckResult {
  return {
    id: 'canary-authenticated-golden-path',
    lane: 'authenticated-full-canary',
    status: input.status,
    summary: input.summary,
    evidence: [
      ...(input.evidence ?? []),
      {
        tag: input.canaryPlan.tag,
        steps: input.steps,
        artifacts: input.canaryPlan.artifacts,
        cleanup: input.canaryPlan.enabled ? 'planned' : 'blocked',
      },
    ],
    remediation: input.remediation,
  };
}

function canaryHttpStatus(status: number): DoctorStatus {
  return [402, 429, 503].includes(status) ? 'BLOCKED' : 'FAIL';
}

function extractCookieHeader(headers: Headers | undefined, name: string): string | null {
  if (!headers) return null;
  const values: string[] = [];
  const extendedHeaders = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof extendedHeaders.getSetCookie === 'function') {
    values.push(...extendedHeaders.getSetCookie());
  }
  const direct = headers.get('set-cookie') ?? headers.get('Set-Cookie');
  if (direct) values.push(direct);
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = values.join('\n').match(new RegExp(`(?:^|[,\\n]\\s*)(${escaped}=[^;\\n]+)`, 'i'));
  return match?.[1] ?? null;
}

async function readResponseJsonOrText(response: Awaited<ReturnType<FetchFn>>): Promise<unknown> {
  return readResponse(response);
}

function extractRunId(payload: unknown): string | null {
  const run = extractRunRecord(payload);
  return typeof run?.runId === 'string' ? run.runId : null;
}

function extractRunStatus(payload: unknown): string | null {
  const run = extractRunRecord(payload);
  return typeof run?.status === 'string' ? run.status : null;
}

function extractOutputHref(payload: unknown): string | null {
  const run = extractRunRecord(payload);
  return typeof run?.outputHref === 'string' ? run.outputHref : null;
}

function extractRunRecord(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) return null;
  if (isRecord(payload.run)) return payload.run;
  if (typeof payload.runId === 'string') return payload;
  return null;
}

function extractMemoId(payload: unknown): string | null {
  if (!isRecord(payload)) return null;
  if (isRecord(payload.memo)) {
    if (typeof payload.memo.memoId === 'string') return payload.memo.memoId;
    if (typeof payload.memo.id === 'string') return payload.memo.id;
  }
  if (typeof payload.memoId === 'string') return payload.memoId;
  if (typeof payload.id === 'string') return payload.id;
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeDoctorArtifacts(report: DoctorReport, outDir: string): Promise<void> {
  await mkdir(outDir, { recursive: true });
  const date = report.timestamp.slice(0, 10);
  await Promise.all([
    writeFile(`${outDir}/${date}-PRAXIS_DOCTOR.json`, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
    writeFile(`${outDir}/${date}-PRAXIS_DOCTOR.md`, renderMarkdownReport(report), 'utf8'),
  ]);
}

async function readAuditArtifactSnapshots(outDir: string): Promise<AuditArtifactSnapshot[]> {
  let names: string[];
  try {
    names = await readdir(outDir);
  } catch {
    return [];
  }

  const candidateNames = names.filter((name) =>
    name.endsWith('.json') && (
      name.includes('PRAXIS_DOCTOR')
        || name.toLowerCase().includes('agentic')
        || name.toLowerCase().includes('eval')
    )
  );
  const snapshots = await Promise.all(candidateNames.map(async (name) => {
    const path = `${outDir}/${name}`;
    try {
      const parsed = safeJsonParse(await readFile(path, 'utf8'));
      if (!isRecord(parsed)) return null;
      return {
        path,
        commit: typeof parsed.commit === 'string' ? parsed.commit : null,
        cloudRunRevision: typeof parsed.cloudRunRevision === 'string' ? parsed.cloudRunRevision : null,
      } satisfies AuditArtifactSnapshot;
    } catch {
      return null;
    }
  }));
  return snapshots.filter((item): item is NonNullable<typeof item> => Boolean(item));
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

function cloudRunRuntimeConfigChecks(output: string, options: DoctorOptions): DoctorCheckResult[] {
  const parsed = parseCloudRunService(output);
  if (!parsed) {
    return [{
      id: 'cloud-run-runtime-config',
      lane: 'gcp-firebase-infrastructure',
      status: 'WARN',
      summary: 'Could not parse Cloud Run service config for runtime networking checks',
      evidence: [output.slice(0, 500)],
      remediation: [`gcloud run services describe praxis-frontend --region=${options.region} --project=${options.project} --format=json`],
    }];
  }

  const annotations = parsed.spec?.template?.metadata?.annotations ?? {};
  const containers = parsed.spec?.template?.spec?.containers ?? [];
  const envNames = new Set(containers.flatMap((container) => (container.env ?? []).map((env) => env.name).filter(Boolean)));
  const cloudSqlInstances = annotations['run.googleapis.com/cloudsql-instances'] ?? '';
  const hasCloudSql = cloudSqlInstances.includes('praxisbytacitus:us-east4:praxisbytacitus-instance');
  const networkInterfaces = annotations['run.googleapis.com/network-interfaces'] ?? '';
  const vpcConnector = annotations['run.googleapis.com/vpc-access-connector'] ?? '';
  const vpcEgress = annotations['run.googleapis.com/vpc-access-egress'] ?? '';
  const hasDirectVpc = networkInterfaces.includes('default') && vpcEgress === 'private-ranges-only';
  const hasVpcConnector = Boolean(vpcConnector) && vpcEgress === 'private-ranges-only';
  const hasPrivateSqlNetworking = !hasCloudSql || hasDirectVpc || hasVpcConnector;
  const hasWorkerBase = envNames.has('AGENT_RUN_WORKER_BASE_URL');
  const hasWorkerOidc = envNames.has('AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL') && envNames.has('AGENT_RUN_WORKER_OIDC_AUDIENCE');
  const hasWorkerSecretFallback = envNames.has('AGENT_RUN_WORKER_SHARED_SECRET');
  const hasWorkerRuntimeEnv = hasWorkerBase && (hasWorkerOidc || hasWorkerSecretFallback);

  return [
    {
      id: 'cloud-run-private-sql-networking',
      lane: 'gcp-firebase-infrastructure',
      status: hasPrivateSqlNetworking ? 'PASS' : 'WARN',
      summary: hasPrivateSqlNetworking
        ? 'Cloud Run has private networking for the attached Cloud SQL instance'
        : 'Cloud Run has Cloud SQL attached but no private VPC egress path',
      evidence: [{
        cloudSqlAttached: hasCloudSql,
        directVpcEgress: hasDirectVpc,
        connectorEgress: hasVpcConnector,
        vpcEgress: vpcEgress || null,
      }],
      remediation: hasPrivateSqlNetworking ? undefined : [
        'Deploy praxis-frontend with --network=default --subnet=default --vpc-egress=private-ranges-only',
      ],
    },
    {
      id: 'agent-worker-runtime-env',
      lane: 'gcp-firebase-infrastructure',
      status: hasWorkerRuntimeEnv ? 'PASS' : 'WARN',
      summary: hasWorkerRuntimeEnv
        ? 'Agent worker dispatch URL and auth env are configured'
        : 'Agent worker dispatch URL or worker auth env is missing',
      evidence: [{
        workerBaseUrl: hasWorkerBase,
        workerOidc: hasWorkerOidc,
        workerSecretFallback: hasWorkerSecretFallback,
      }],
      remediation: hasWorkerRuntimeEnv ? undefined : [
        'Set AGENT_RUN_WORKER_BASE_URL, AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL, and AGENT_RUN_WORKER_OIDC_AUDIENCE on praxis-frontend.',
      ],
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
    { id: 'health-agentic-search', url: `${options.baseUrl}/api/health/agentic-search` },
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

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
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
  const parsed = parseCloudRunService(output);
  if (parsed) {
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
  }
  return output;
}

function parseCloudRunService(output: string): {
  metadata?: { name?: string };
  spec?: {
    template?: {
      metadata?: { annotations?: Record<string, string> };
      spec?: { containers?: Array<{ env?: Array<{ name?: string }> }> };
    };
  };
  status?: {
    latestReadyRevisionName?: string;
    traffic?: Array<{ revisionName?: string; percent?: number; latestRevision?: boolean }>;
    conditions?: Array<{ type?: string; status?: string }>;
  };
} | null {
  try {
    return JSON.parse(output);
  } catch {
    return null;
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
