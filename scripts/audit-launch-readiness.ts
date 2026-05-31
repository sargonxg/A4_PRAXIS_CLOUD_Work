import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REQUIRED_LEGAL_SLUGS = [
  'privacy',
  'cookies',
  'gdpr',
  'data-processing',
  'terms',
  'security',
  'sub-processors',
  'data-retention',
] as const;

const REQUIRED_HEADER_MARKERS = [
  'Content-Security-Policy',
  'Strict-Transport-Security',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
] as const;

const LIVE_HEADER_PATHS = [
  '/',
  '/login',
  '/pricing',
  '/guide',
  '/changelog',
  '/legal/privacy',
  '/legal/cookies',
  '/legal/gdpr',
  '/legal/data-processing',
  '/legal/terms',
  '/app',
  '/api/health',
  '/api/health/runtime',
] as const;

const SAFE_PUBLIC_ENV_NAMES = new Set([
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_PRAXIS_BACKEND_URL',
  'NEXT_PUBLIC_GA_MEASUREMENT_ID',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
]);

type FileMap = Record<string, string>;

export interface HeaderEvidence {
  path: string;
  status: number;
  headers: Record<string, string | null>;
}

export interface LaunchReadinessInput {
  files: FileMap;
  liveHeaderEvidence: HeaderEvidence[] | null;
  now: Date;
}

export interface LaunchReadinessResult {
  generatedAt: string;
  status: 'pass' | 'fail';
  failures: string[];
  warnings: string[];
  checks: Array<{
    id: string;
    status: 'pass' | 'fail' | 'warn';
    evidence: string;
  }>;
}

function hasFile(files: FileMap, rel: string): boolean {
  return Object.prototype.hasOwnProperty.call(files, rel);
}

function body(files: FileMap, rel: string): string {
  return files[rel] ?? '';
}

function pushCheck(
  checks: LaunchReadinessResult['checks'],
  failures: string[],
  warnings: string[],
  id: string,
  ok: boolean,
  evidence: string,
  severity: 'failure' | 'warning' = 'failure',
) {
  if (ok) {
    checks.push({ id, status: 'pass', evidence: 'contract satisfied' });
    return;
  }
  checks.push({ id, status: severity === 'failure' ? 'fail' : 'warn', evidence });
  if (severity === 'failure') failures.push(evidence);
  else warnings.push(evidence);
}

export function redactSensitiveEvidence(value: string): string {
  return value
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[REDACTED]')
    .replace(/((?:token|secret|password|private[_-]?key|api[_-]?key)\s*[:=]\s*)("[^"]+"|'[^']+'|[^\s,}]+)/gi, '$1[REDACTED]')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.gserviceaccount\.com/gi, '[REDACTED_SERVICE_ACCOUNT]')
    .replace(/-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g, '[REDACTED_PRIVATE_KEY]');
}

function findPublicEnvNames(files: FileMap): string[] {
  const names = new Set<string>();
  const pattern = /\bNEXT_PUBLIC_[A-Z0-9_]+\b/g;
  for (const [rel, text] of Object.entries(files)) {
    if (!rel.startsWith('src/') && !rel.endsWith('.env.example') && rel !== '.env.example') continue;
    for (const match of text.matchAll(pattern)) names.add(match[0]);
  }
  return [...names].sort();
}

function unsafePublicEnvNames(files: FileMap): string[] {
  return findPublicEnvNames(files).filter((name) => {
    if (SAFE_PUBLIC_ENV_NAMES.has(name)) return false;
    return /(SECRET|TOKEN|PASSWORD|PRIVATE|SERVICE_ACCOUNT|DATABASE|PROVIDER|OPENAI|ANTHROPIC|VERTEX|GOOGLE_AI|GEMINI)/.test(name);
  });
}

function legalSlugPresent(files: FileMap, slug: string): boolean {
  const legalData = body(files, 'src/lib/legal/pages.ts');
  return legalData.includes(`slug: '${slug}'`) || legalData.includes(`slug: "${slug}"`);
}

function assertLiveHeaders(evidence: HeaderEvidence[] | null): { failures: string[]; summary: string } {
  if (!evidence) {
    return { failures: [], summary: 'live header probe skipped; set PRAXIS_LAUNCH_LIVE_HEADERS=1 to enable' };
  }
  const failures: string[] = [];
  for (const item of evidence) {
    for (const header of REQUIRED_HEADER_MARKERS) {
      const key = header.toLowerCase();
      if (!item.headers[key]) failures.push(`${item.path} missing live security header ${header}`);
    }
  }
  return { failures, summary: `${evidence.length} live routes probed` };
}

export function evaluateLaunchReadiness(input: LaunchReadinessInput): LaunchReadinessResult {
  const failures: string[] = [];
  const warnings: string[] = [];
  const checks: LaunchReadinessResult['checks'] = [];

  const packageJson = body(input.files, 'package.json');
  pushCheck(
    checks,
    failures,
    warnings,
    'package-script',
    packageJson.includes('"audit:launch-readiness"') && packageJson.includes('scripts/audit-launch-readiness.ts'),
    'package.json missing audit:launch-readiness script',
  );

  const legalRouteExists = hasFile(input.files, 'src/app/legal/[slug]/page.tsx');
  pushCheck(
    checks,
    failures,
    warnings,
    'legal-route',
    legalRouteExists,
    'missing legal dynamic page src/app/legal/[slug]/page.tsx',
  );

  const landingLayout = body(input.files, 'src/app/(landing)/layout.tsx');
  for (const slug of REQUIRED_LEGAL_SLUGS) {
    pushCheck(
      checks,
      failures,
      warnings,
      `legal-page-${slug}`,
      legalSlugPresent(input.files, slug),
      `missing legal page slug ${slug}`,
    );
    pushCheck(
      checks,
      failures,
      warnings,
      `legal-link-${slug}`,
      landingLayout.includes(`/legal/${slug}`),
      `public navigation missing legal link /legal/${slug}`,
    );
  }

  const proxy = body(input.files, 'src/proxy.ts');
  pushCheck(
    checks,
    failures,
    warnings,
    'legal-header-matcher',
    proxy.includes("'/legal/:path*'") || proxy.includes('"/legal/:path*"'),
    'src/proxy.ts matcher missing /legal/:path* security-header coverage',
  );
  for (const path of ['/', '/pricing', '/learn', '/guide', '/release-notes', '/changelog', '/api/health', '/api/health/:path*']) {
    pushCheck(
      checks,
      failures,
      warnings,
      `header-matcher-${path}`,
      proxy.includes(`'${path}'`) || proxy.includes(`"${path}"`),
      `src/proxy.ts matcher missing ${path} security-header coverage`,
    );
  }
  for (const marker of REQUIRED_HEADER_MARKERS) {
    pushCheck(
      checks,
      failures,
      warnings,
      `header-${marker}`,
      proxy.includes(marker),
      `src/proxy.ts missing security header marker ${marker}`,
    );
  }
  const healthRoute = body(input.files, 'src/app/api/health/route.ts');
  for (const marker of REQUIRED_HEADER_MARKERS) {
    pushCheck(
      checks,
      failures,
      warnings,
      `health-route-header-${marker}`,
      healthRoute.includes(marker),
      `/api/health route missing direct security header marker ${marker}`,
    );
  }

  const unsafeEnv = unsafePublicEnvNames(input.files);
  pushCheck(
    checks,
    failures,
    warnings,
    'public-env-exposure',
    unsafeEnv.length === 0,
    unsafeEnv.length ? `unsafe public env name ${unsafeEnv.join(', ')}` : 'no unsafe public env names found',
  );

  const apiKeyRoute = body(input.files, 'src/app/api/settings/api-keys/route.ts');
  const apiKeyRouteSafe =
    apiKeyRoute.includes('listUserKeyStatuses') &&
    !/NextResponse\.json\([\s\S]*(payload|secretValue|apiKeyValue|privateKey)/.test(apiKeyRoute);
  pushCheck(
    checks,
    failures,
    warnings,
    'user-api-key-response-minimization',
    apiKeyRouteSafe,
    'api key status route appears to expose payload/plaintext instead of statuses only',
  );

  const securityDoc = body(input.files, 'SECURITY.md');
  for (const marker of ['Do not commit secrets', 'User API keys are encrypted', 'withCalibration', 'Incident Response']) {
    pushCheck(
      checks,
      failures,
      warnings,
      `security-doc-${marker}`,
      securityDoc.includes(marker),
      `SECURITY.md missing launch security marker: ${marker}`,
    );
  }

  const complianceDoc = body(input.files, 'docs/COMPLIANCE.md');
  for (const marker of ['GDPR', 'Sub-processor inventory', 'Data Processing Agreement']) {
    pushCheck(
      checks,
      failures,
      warnings,
      `compliance-doc-${marker}`,
      complianceDoc.includes(marker),
      `docs/COMPLIANCE.md missing compliance marker: ${marker}`,
    );
  }

  const liveHeaders = assertLiveHeaders(input.liveHeaderEvidence);
  for (const failure of liveHeaders.failures) failures.push(failure);
  checks.push({
    id: 'live-header-probe',
    status: liveHeaders.failures.length ? 'fail' : input.liveHeaderEvidence ? 'pass' : 'warn',
    evidence: liveHeaders.summary,
  });
  if (!input.liveHeaderEvidence) warnings.push(liveHeaders.summary);

  return {
    generatedAt: input.now.toISOString(),
    status: failures.length ? 'fail' : 'pass',
    failures,
    warnings,
    checks,
  };
}

function readIfExists(root: string, rel: string): string | null {
  const full = join(root, rel);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
}

function collectFiles(root: string): FileMap {
  const files: FileMap = {};
  const direct = [
    'package.json',
    'SECURITY.md',
    'docs/COMPLIANCE.md',
    'src/proxy.ts',
    'src/app/(landing)/layout.tsx',
    'src/app/legal/[slug]/page.tsx',
    'src/lib/legal/pages.ts',
    'src/app/api/settings/api-keys/route.ts',
    'src/app/api/health/route.ts',
    '.env.example',
  ];
  for (const rel of direct) {
    const text = readIfExists(root, rel);
    if (text !== null) files[rel] = text;
  }
  return files;
}

async function collectLiveHeaderEvidence(baseUrl: string): Promise<HeaderEvidence[]> {
  const normalized = baseUrl.replace(/\/$/, '');
  const result: HeaderEvidence[] = [];
  for (const path of LIVE_HEADER_PATHS) {
    const response = await fetch(`${normalized}${path}`, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
    });
    const headers: Record<string, string | null> = {};
    for (const marker of REQUIRED_HEADER_MARKERS) {
      headers[marker.toLowerCase()] = response.headers.get(marker);
    }
    result.push({ path, status: response.status, headers });
  }
  return result;
}

function renderMarkdown(result: LaunchReadinessResult): string {
  const lines = [
    '# PRAXIS Launch Readiness Audit',
    '',
    `Generated: ${result.generatedAt}`,
    `Status: **${result.status.toUpperCase()}**`,
    '',
    `Summary: ${result.checks.filter((check) => check.status === 'pass').length} PASS, ${result.warnings.length} WARN, ${result.failures.length} FAIL.`,
    '',
    '## Failures',
    '',
    ...(result.failures.length ? result.failures.map((failure) => `- ${failure}`) : ['- None.']),
    '',
    '## Warnings',
    '',
    ...(result.warnings.length ? result.warnings.map((warning) => `- ${warning}`) : ['- None.']),
    '',
    '## Checks',
    '',
    '| Status | Check | Evidence |',
    '|---|---|---|',
    ...result.checks.map((check) => `| ${check.status.toUpperCase()} | ${check.id} | ${check.evidence.replace(/\|/g, '\\|')} |`),
    '',
  ];
  return redactSensitiveEvidence(lines.join('\n'));
}

async function main() {
  const root = process.cwd();
  const liveHeaderEvidence = process.env.PRAXIS_LAUNCH_LIVE_HEADERS === '1'
    ? await collectLiveHeaderEvidence(process.env.PRAXIS_LIVE_BASE_URL ?? 'https://praxis.tacitus.me')
    : null;
  const result = evaluateLaunchReadiness({
    files: collectFiles(root),
    liveHeaderEvidence,
    now: new Date(),
  });

  const stamp = result.generatedAt.slice(0, 10);
  const auditDir = join(root, 'docs', 'audits');
  mkdirSync(auditDir, { recursive: true });
  const jsonPath = join(auditDir, `${stamp}-launch-readiness.json`);
  const mdPath = join(auditDir, `${stamp}-launch-readiness.md`);
  writeFileSync(jsonPath, redactSensitiveEvidence(JSON.stringify(result, null, 2)));
  writeFileSync(mdPath, renderMarkdown(result));

  console.log(`[audit:launch-readiness] wrote ${relative(root, mdPath)} and ${relative(root, jsonPath)}`);
  console.log(`[audit:launch-readiness] ${result.status.toUpperCase()} (${result.failures.length} failure(s), ${result.warnings.length} warning(s))`);
  for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
  if (result.failures.length) {
    for (const failure of result.failures) console.error(`FAIL: ${failure}`);
    process.exit(1);
  }
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) {
  void main().catch((error) => {
    console.error(`audit:launch-readiness failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
