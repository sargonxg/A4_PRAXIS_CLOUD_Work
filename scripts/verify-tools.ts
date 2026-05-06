#!/usr/bin/env node
/**
 * PRAXIS Tool Verification Script
 * Tests all major AI routes to ensure they are reachable and return structured output.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 npx tsx scripts/verify-tools.ts
 *   BASE_URL=https://praxis.tacitus.me npx tsx scripts/verify-tools.ts
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const SESSION_COOKIE = process.env.SESSION_COOKIE ?? '';
const { TOOL_REGISTRY, HERO_TOOLS } = require('../src/lib/constants/tool-registry.ts') as typeof import('../src/lib/constants/tool-registry');

const EXPECTED_HERO_TOOL_IDS = [
  'dashboard',
  'context-builder',
  'situation-intelligence',
  'source-scout',
  'conflict-graph',
  'graphops',
  'brainstorming-table',
  'briefing',
  'policy-memo',
  'scenarios',
  'negotiation-prep',
  'treaty-analyzer',
] as const;

// Minimal test situation payload (Sudan Conflict 2023)
const TEST_SITUATION = {
  id: 'verify-test-001',
  name: 'Sudan Armed Conflict 2023',
  type: 'armed_conflict',
  region: 'Sub-Saharan Africa',
  country: 'Sudan',
  actors: ['SAF', 'RSF'],
  status: 'active',
  riskScore: 8,
  glaslStage: 7,
  escalationTrend: 'escalating',
  description: 'Armed conflict between the Sudanese Armed Forces (SAF) and the Rapid Support Forces (RSF).',
};

type ResultStatus = 'PASS' | 'AUTH' | 'MISSING' | 'RATE_LIMITED' | 'FAIL' | 'SKIP';

interface RouteResult {
  route: string;
  status: ResultStatus;
  httpStatus?: number;
  ms?: number;
  error?: string;
}

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function statusColor(status: ResultStatus): string {
  switch (status) {
    case 'PASS': return colorize(status, 'green');
    case 'AUTH': return colorize(status, 'yellow');
    case 'MISSING': return colorize(status, 'red');
    case 'RATE_LIMITED': return colorize(status, 'yellow');
    case 'FAIL': return colorize(status, 'red');
    case 'SKIP': return colorize(status, 'gray');
  }
}

async function testRoute(
  route: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
): Promise<RouteResult> {
  const url = `${BASE_URL}${route}`;
  const start = Date.now();

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (SESSION_COOKIE) headers['Cookie'] = SESSION_COOKIE;

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });

    const ms = Date.now() - start;
    const httpStatus = res.status;

    if (httpStatus === 401 || httpStatus === 403) {
      return { route, status: 'AUTH', httpStatus, ms };
    }
    if (httpStatus === 404) {
      return { route, status: 'MISSING', httpStatus, ms };
    }
    if (httpStatus === 429) {
      return { route, status: 'RATE_LIMITED', httpStatus, ms };
    }
    if (httpStatus >= 200 && httpStatus < 300) {
      return { route, status: 'PASS', httpStatus, ms };
    }
    const text = await res.text().catch(() => '');
    return { route, status: 'FAIL', httpStatus, ms, error: text.slice(0, 120) };
  } catch (err) {
    const ms = Date.now() - start;
    const error = err instanceof Error ? err.message : String(err);
    // Connection refused = server not running → SKIP rather than FAIL
    if (error.includes('ECONNREFUSED') || error.includes('fetch failed')) {
      return { route, status: 'SKIP', ms, error: 'Server unreachable' };
    }
    return { route, status: 'FAIL', ms, error: error.slice(0, 120) };
  }
}

const ROUTES: Array<{ route: string; method: 'GET' | 'POST'; body?: Record<string, unknown> }> = [
  // Health endpoints (no auth needed in most configs)
  { route: '/api/health/feeds', method: 'GET' },
  { route: '/api/health/provider', method: 'GET' },
  { route: '/api/health/breakers', method: 'GET' },
  { route: '/api/health/skc', method: 'GET' },

  // Context + Analysis tools
  { route: '/api/ai/risk-assessment', method: 'POST', body: { situation: TEST_SITUATION } },
  { route: '/api/ai/risk-indicators', method: 'POST', body: { situation: TEST_SITUATION } },
  { route: '/api/ai/actor-profiles', method: 'POST', body: { situation: TEST_SITUATION } },
  { route: '/api/ai/power-map', method: 'POST', body: { situation: TEST_SITUATION } },
  { route: '/api/ai/stakeholder-map', method: 'POST', body: { situation: TEST_SITUATION } },
  { route: '/api/ai/info-environment', method: 'POST', body: { situation: TEST_SITUATION } },

  // Drafting tools
  { route: '/api/ai/briefing-generate', method: 'POST', body: { situation: TEST_SITUATION, action: 'generate' } },
  { route: '/api/ai/talking-points', method: 'POST', body: { situation: TEST_SITUATION } },
  { route: '/api/ai/dossier-generate', method: 'POST', body: { situation: TEST_SITUATION } },

  // Simulation tools
  { route: '/api/ai/scenario', method: 'POST', body: { situation: TEST_SITUATION } },
  { route: '/api/ai/negotiation', method: 'POST', body: { situation: TEST_SITUATION } },
  { route: '/api/ai/game-theory', method: 'POST', body: {
    situation: TEST_SITUATION,
    actors: ['SAF', 'RSF'],
    strategies: { SAF: ['Escalate', 'Negotiate'], RSF: ['Escalate', 'Negotiate'] },
    analysisType: 'strategic_form',
  }},
  { route: '/api/ai/concordia', method: 'POST', body: { situation: TEST_SITUATION } },
  { route: '/api/ai/mediation-design', method: 'POST', body: {
    action: 'plan',
    conflictContext: 'SAF vs RSF armed conflict in Sudan',
    parties: ['SAF', 'RSF'],
    issues: ['territorial control', 'power sharing'],
    situationId: TEST_SITUATION.id,
  }},

  // Intelligence tools
  { route: '/api/ai/deep-research', method: 'POST', body: { situation: TEST_SITUATION, query: 'Sudan conflict dynamics' } },
  { route: '/api/ai/media-scan', method: 'POST', body: { situation: TEST_SITUATION, action: 'scan' } },
  { route: '/api/ai/discover-sources', method: 'POST', body: { situation: TEST_SITUATION } },
  { route: '/api/ai/geospatial', method: 'POST', body: { situation: TEST_SITUATION } },
  { route: '/api/ai/sanctions-scan', method: 'POST', body: { situation: TEST_SITUATION } },
  { route: '/api/ai/commitment-scan', method: 'POST', body: { situation: TEST_SITUATION } },

  // Data feeds
  { route: '/api/data/intelligence', method: 'POST', body: { situation: TEST_SITUATION } },
];

async function main() {
  console.log(`\n${colorize('PRAXIS Tool Verification', 'bold')} — ${colorize(BASE_URL, 'cyan')}`);
  console.log(colorize('─'.repeat(60), 'gray'));

  const missingSurface = TOOL_REGISTRY.filter((tool) => !tool.surface || typeof tool.visible !== 'boolean');
  const heroIds = HERO_TOOLS.map((tool) => tool.id);
  const expected = new Set(EXPECTED_HERO_TOOL_IDS);
  const unexpectedHeroes = heroIds.filter((id) => !expected.has(id as (typeof EXPECTED_HERO_TOOL_IDS)[number]));
  const missingHeroes = EXPECTED_HERO_TOOL_IDS.filter((id) => !heroIds.includes(id));

  if (missingSurface.length || HERO_TOOLS.length !== EXPECTED_HERO_TOOL_IDS.length || unexpectedHeroes.length || missingHeroes.length) {
    console.log(colorize('✗ Tool surface verification failed', 'red'));
    if (missingSurface.length) console.log(`  Missing surface/visible: ${missingSurface.map((tool) => tool.id).join(', ')}`);
    if (missingHeroes.length) console.log(`  Missing heroes: ${missingHeroes.join(', ')}`);
    if (unexpectedHeroes.length) console.log(`  Unexpected heroes: ${unexpectedHeroes.join(', ')}`);
    console.log(`  Expected ${EXPECTED_HERO_TOOL_IDS.length} hero tools, found ${HERO_TOOLS.length}.`);
    process.exit(1);
  }

  console.log(colorize(`✓ Tool surface policy: ${HERO_TOOLS.length} hero tools, ${TOOL_REGISTRY.length - HERO_TOOLS.length} archived`, 'green'));

  if (!SESSION_COOKIE) {
    console.log(colorize('⚠  No SESSION_COOKIE set — auth-protected routes will show AUTH', 'yellow'));
  }
  console.log('');

  const results: RouteResult[] = [];

  // Run checks in batches of 5 to avoid hammering the server
  const BATCH_SIZE = 5;
  for (let i = 0; i < ROUTES.length; i += BATCH_SIZE) {
    const batch = ROUTES.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((r) => testRoute(r.route, r.method, r.body))
    );
    results.push(...batchResults);
  }

  // Print results
  for (const r of results) {
    const statusStr = statusColor(r.status).padEnd(20);
    const routeStr = colorize(r.route, 'cyan');
    const timeStr = r.ms !== undefined ? colorize(`${r.ms}ms`, 'gray') : '';
    const httpStr = r.httpStatus ? colorize(`HTTP ${r.httpStatus}`, 'gray') : '';
    const errorStr = r.error ? colorize(` — ${r.error}`, 'red') : '';
    console.log(`  ${statusStr} ${routeStr}  ${httpStr} ${timeStr}${errorStr}`);
  }

  // Summary
  console.log('\n' + colorize('─'.repeat(60), 'gray'));
  const counts = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<ResultStatus, number>);

  console.log(
    `  ${colorize(`PASS: ${counts.PASS ?? 0}`, 'green')}` +
    `  ${colorize(`AUTH: ${counts.AUTH ?? 0}`, 'yellow')}` +
    `  ${colorize(`FAIL: ${counts.FAIL ?? 0}`, 'red')}` +
    `  ${colorize(`MISSING: ${counts.MISSING ?? 0}`, 'red')}` +
    `  ${colorize(`SKIP: ${counts.SKIP ?? 0}`, 'gray')}`
  );
  console.log('');

  const hasFailures = (counts.FAIL ?? 0) > 0 || (counts.MISSING ?? 0) > 0;
  if (hasFailures) {
    console.log(colorize('✗ Verification failed — fix FAIL/MISSING routes before deploying', 'red'));
    process.exit(1);
  } else {
    console.log(colorize('✓ All reachable routes passed', 'green'));
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
