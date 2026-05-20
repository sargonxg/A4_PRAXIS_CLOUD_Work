import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import {
  APP_SEARCH_COMMANDS,
  buildCapsuleSearchItem,
  rankAppSearchItems,
} from '@/lib/app-search/shared-contracts';
import { buildAppDiagnosticSummary, type AppDiagnosticRedFlag } from '@/lib/diagnostics/app-red-flags';
import { CAPSULE_STARTER_DEFINITIONS } from '@/lib/product/context-capsules';

type AuditInput = {
  cwd: string;
  headCommit?: string;
  graphReport?: string;
};

export type AppSearchAuditResult = {
  failures: string[];
  redFlags: AppDiagnosticRedFlag[];
};

const ROUTE_FILES: Record<string, string> = {
  '/app': 'src/app/app/page.tsx',
  '/app/capsules': 'src/app/app/capsules/page.tsx',
  '/app/settings?tab=system': 'src/app/app/settings/page.tsx',
  '/api/health/runtime': 'src/app/api/health/runtime/route.ts',
  '/api/health/agentic-search': 'src/app/api/health/agentic-search/route.ts',
  '/api/admin/system-health': 'src/app/api/admin/system-health/route.ts',
};

export function auditAppSearchContracts(input: AuditInput): AppSearchAuditResult {
  const failures: string[] = [];
  const ids = APP_SEARCH_COMMANDS.map((item) => item.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) failures.push(`Duplicate app-search command ids: ${Array.from(new Set(duplicateIds)).join(', ')}`);

  for (const item of APP_SEARCH_COMMANDS) {
    if (item.href && !isAllowedHref(item.href)) failures.push(`${item.id} points outside existing app routes: ${item.href}`);
    if (item.href && !routeExists(input.cwd, item.href)) failures.push(`${item.id} route target is missing: ${item.href}`);
  }

  for (const expected of ['action:runtime-doctor', 'diagnostic:research-runtime', 'diagnostic:source-gaps', 'setting:system', 'action:praxis-import-export']) {
    if (!ids.includes(expected)) failures.push(`Missing app-search command: ${expected}`);
  }

  const starterItems = CAPSULE_STARTER_DEFINITIONS.map(buildCapsuleSearchItem);
  const assumptionResults = rankAppSearchItems('Assumption Stress Test', [...APP_SEARCH_COMMANDS, ...starterItems]);
  if (assumptionResults[0]?.id !== 'capsule:starter-tool-assumption-stress-test') {
    failures.push('Assumption Stress Test must rank above generic commands for exact device search.');
  }

  const redFlags = buildAppDiagnosticSummary({
    appSearchAudit: { status: failures.length ? 'blocked' : 'ok', detail: failures.length ? failures.join('; ') : 'Search contracts passed.' },
    graphFreshness: graphFreshness(input),
    authCanary: {
      missingEnvVars: ['TEST_FIREBASE_EMAIL', 'TEST_FIREBASE_PASSWORD'].filter((name) => !process.env[name]),
    },
  }).groups;

  return {
    failures,
    redFlags: Object.values(redFlags).flat(),
  };
}

function routeExists(cwd: string, href: string): boolean {
  if (href.startsWith('/agents/[')) return true;
  const path = ROUTE_FILES[href];
  return path ? existsSync(join(cwd, path)) : false;
}

function isAllowedHref(href: string): boolean {
  return href === '/app' || href === '/app/capsules' || href === '/app/settings?tab=system' || href.startsWith('/agents/[') || href.startsWith('/app/conversations/');
}

function graphFreshness(input: AuditInput): { status: 'healthy' | 'stale' | 'degraded'; detail: string } {
  const report = input.graphReport ?? readGraphReport(input.cwd);
  const builtFrom = report.match(/Built from commit:\s*`([^`]+)`/)?.[1] ?? null;
  const head = input.headCommit ?? readHeadCommit(input.cwd);
  if (!builtFrom || !head) return { status: 'degraded', detail: 'Graphify report or HEAD commit could not be read.' };
  if (head.startsWith(builtFrom) || builtFrom.startsWith(head.slice(0, builtFrom.length))) {
    return { status: 'healthy', detail: `Graphify report is built from HEAD ${builtFrom}.` };
  }
  return { status: 'stale', detail: `Graphify built from ${builtFrom} but HEAD is ${head.slice(0, 8)}.` };
}

function readGraphReport(cwd: string): string {
  const graphReportPath = join(cwd, 'graphify-out', 'GRAPH_REPORT.md');
  return existsSync(graphReportPath) ? readFileSync(graphReportPath, 'utf8') : '';
}

function readHeadCommit(cwd: string): string | null {
  try {
    return execSync('git rev-parse HEAD', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

if (require.main === module) {
  const result = auditAppSearchContracts({ cwd: process.cwd() });
  if (result.failures.length) {
    console.error('audit:app-search failed:');
    for (const failure of result.failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  const staleGraph = result.redFlags.find((flag) => flag.id === 'graphify-freshness' && flag.status === 'stale');
  if (staleGraph) console.warn(`audit:app-search warning: ${staleGraph.detail}`);
  console.log('audit:app-search OK');
}
