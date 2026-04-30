#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Generates the tool-by-tool PRAXIS sprint backlog from live registry,
 * operating contracts, route audits, and page source inspection.
 *
 * Run: npx tsx scripts/generate-tool-sprint-backlog.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const { TOOL_REGISTRY } = require('../src/lib/constants/tool-registry.ts') as typeof import('../src/lib/constants/tool-registry');
const { getToolOperatingContract } = require('../src/lib/tools/tool-operating-contracts.ts') as typeof import('../src/lib/tools/tool-operating-contracts');
const {
  getToolPathMembership,
  isToolInActiveGenericOrPoliticalPath,
} = require('../src/lib/tools/tool-path-taxonomy.ts') as typeof import('../src/lib/tools/tool-path-taxonomy');

interface ToolBacklogRow {
  id: string;
  name: string;
  category: string;
  routeName: string;
  routeScore: number | null;
  pagePath: string | null;
  hasRegistryInfo: boolean;
  usesShell: boolean;
  hasToolOutputFrame: boolean;
  outputKinds: string[];
  activePathTool: boolean;
  pathMembership: string[];
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  sprintTasks: string[];
  verification: string[];
}

const PAGE_ALIASES: Record<string, string> = {
  'actor-profiles': 'actors',
  'auto-briefing': 'auto-briefings',
  'report-studio': 'reports',
  'sources-library': 'sources',
  'pir': 'requirements',
};

const CRITICAL_IDS = new Set([
  'dashboard',
  'assistant',
  'conflict-graph',
  'timeline',
  'early-warning',
  'risk-monitor',
  'stakeholder-map',
  'geospatial-monitor',
  'sources-library',
  'deep-search-agent',
  'argus',
  'policy-memo',
  'talking-points',
  'briefing',
  'dossier',
  'documents',
]);

const TRUST_RISK_IDS = new Set([
  'assistant',
  'deep-search-agent',
  'sources-library',
  'argus',
  'sanctions',
  'legal-tracker',
  'treaty-analyzer',
  'human-rights',
  'policy-memo',
  'talking-points',
]);

function latestAuditPath(prefix: string): string | null {
  const auditsDir = join(process.cwd(), 'docs', 'audits');
  if (!existsSync(auditsDir)) return null;
  const { readdirSync } = require('node:fs') as typeof import('node:fs');
  const matches = readdirSync(auditsDir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.md'))
    .sort();
  return matches.length ? join(auditsDir, matches[matches.length - 1]) : null;
}

function parseRouteScores(): Record<string, number> {
  const audit = latestAuditPath('tools-');
  if (!audit) return {};
  const src = readFileSync(audit, 'utf8');
  const scores: Record<string, number> = {};
  for (const line of src.split('\n')) {
    const match = line.match(/^\|\s*([^|]+?)\s*\|\s*(\d+)\/12\s*\|/);
    if (match && match[1] !== 'Tool') {
      scores[match[1].trim()] = Number(match[2]);
    }
  }
  return scores;
}

function routeNameFromApiRoute(aiRoute: string): string {
  const parts = aiRoute.split('/').filter(Boolean);
  return parts[2] ?? aiRoute;
}

function pagePathFor(toolId: string): string | null {
  const page = PAGE_ALIASES[toolId] ?? toolId;
  const candidates = [
    join(process.cwd(), 'src', 'app', 'app', page, 'page.tsx'),
    join(process.cwd(), 'src', 'app', 'app', page, '_demo.tsx'),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function inspectPage(pagePath: string | null) {
  if (!pagePath) return { hasRegistryInfo: false, usesShell: false, hasToolOutputFrame: false };
  const src = readFileSync(pagePath, 'utf8');
  const usesShell = /ToolPageShell/.test(src);
  return {
    hasRegistryInfo: usesShell || /RegistryToolInfo|ToolOperatingContractPanel/.test(src),
    usesShell,
    hasToolOutputFrame: /ToolOutputFrame/.test(src),
  };
}

function priorityFor(input: {
  id: string;
  routeScore: number | null;
  pagePath: string | null;
  hasRegistryInfo: boolean;
  activePathTool: boolean;
}): ToolBacklogRow['priority'] {
  if (input.activePathTool && ((input.routeScore ?? 0) < 8 || !input.hasRegistryInfo)) return 'P0';
  if (CRITICAL_IDS.has(input.id) && ((input.routeScore ?? 0) < 8 || !input.hasRegistryInfo)) return 'P0';
  if (TRUST_RISK_IDS.has(input.id) && (input.routeScore ?? 0) < 10) return 'P0';
  if (input.activePathTool && (input.routeScore ?? 0) < 10) return 'P1';
  if ((input.routeScore ?? 0) < 8 || !input.pagePath) return 'P1';
  if ((input.routeScore ?? 0) < 10 || !input.hasRegistryInfo) return 'P2';
  return 'P3';
}

function graphicsTask(kind: string): string {
  switch (kind) {
    case 'map':
      return 'Review map graphics: location precision, empty map state, hotspot legend, source/freshness badges, and click-through event details.';
    case 'graph':
      return 'Review graph graphics: node labels, edge meaning, centrality/cluster legend, click-to-edit details, and missing-link prompts.';
    case 'timeline':
      return 'Review timeline graphics: causal arrows, event confidence, date uncertainty, source fragments, and add/correct event affordances.';
    case 'draft':
      return 'Review drafting UI: section navigation, regenerate/rewrite actions, source/confidence panel, export, and audience/tone controls.';
    case 'feed':
      return 'Review feed UI: source receipts, freshness, credibility, filters, saved-source actions, and empty/degraded states.';
    case 'scorecard':
      return 'Review scorecard graphics: driver decomposition, confidence per score, method note, and assumption-edit controls.';
    case 'dashboard':
      return 'Review dashboard layout: one-line diagnosis, next-best action, source coverage, stale outputs, and no-config/no-data states.';
    default:
      return 'Review UI output state: meaningful visualization, empty/error/loading states, provenance, and export/readback actions.';
  }
}

function tasksFor(row: Omit<ToolBacklogRow, 'sprintTasks' | 'verification'>): string[] {
  const tasks: string[] = [];
  const contract = getToolOperatingContract(row.id);

  tasks.push(`Clarify tool purpose in the page header: ${contract.objective}`);
  if (!row.hasRegistryInfo) tasks.push('Wire RegistryToolInfo so methodology, sources, operating contract, and related tools are visible.');
  if (!row.usesShell && row.category !== 'workspace') tasks.push('Evaluate migration to ToolPageShell or shared page scaffolding for consistent guard, generation, and contract UI.');
  if (!row.hasToolOutputFrame && row.category !== 'workspace') tasks.push('Wrap generated outputs in ToolOutputFrame or equivalent confidence/provenance/degraded-state surface.');
  for (const kind of row.outputKinds.slice(0, 2)) tasks.push(graphicsTask(kind));
  tasks.push(`Add required-question preflight: ${contract.requiredQuestions.map((q) => q.label).join(' / ')}`);
  if (row.routeScore === null) {
    tasks.push('Confirm whether this tool should have an AI route; if yes, add calibrated route, schema, persistence, and smoke test.');
  } else if (row.routeScore < 10) {
    tasks.push(`Upgrade AI route from ${row.routeScore}/12 to >=10/12: schema, audience/language/red-line usage, SKC/source receipts, canonical persistence, model metadata.`);
  }
  if (contract.persistence.editableByAskPraxis) tasks.push('Add or verify Ask PRAXIS writeback schema so user corrections update the saved tool output instead of staying in chat.');
  if (TRUST_RISK_IDS.has(row.id)) tasks.push('Add trust controls: do not use training-data fallbacks for current legal/sanctions/research claims; show degraded/uncertain state instead.');
  tasks.push('Add one browser smoke path for a realistic user flow and one unit/schema test for the generated output contract.');

  return Array.from(new Set(tasks));
}

function verificationFor(row: Omit<ToolBacklogRow, 'sprintTasks' | 'verification'>): string[] {
  const checks = [
    `Open /demo/${PAGE_ALIASES[row.id] ?? row.id} or /app/${PAGE_ALIASES[row.id] ?? row.id} and verify header, operating contract, loading, empty, error, and generated states.`,
    'Ask PRAXIS: "this output is wrong, update it because..." and verify it asks missing required questions before writing.',
  ];
  if (row.routeName.startsWith('/')) {
    checks.push('No AI route check required unless this workspace tool becomes generative.');
  } else {
    checks.push(`POST ${row.routeName} route with a realistic situation fixture and verify non-empty, schema-valid output.`);
  }
  checks.push('Verify export/reload path reads the saved output with provenance.');
  return checks;
}

function buildRows(): ToolBacklogRow[] {
  const scores = parseRouteScores();
  return TOOL_REGISTRY.map((tool) => {
    const routeName = routeNameFromApiRoute(tool.aiRoute);
    const pagePath = pagePathFor(tool.id);
    const page = inspectPage(pagePath);
    const contract = getToolOperatingContract(tool.id);
    const routeScore = scores[routeName] ?? scores[tool.id] ?? null;
    const memberships = getToolPathMembership(tool.id);
    const base = {
      id: tool.id,
      name: tool.name,
      category: tool.category,
      routeName,
      routeScore,
      pagePath,
      hasRegistryInfo: page.hasRegistryInfo,
      usesShell: page.usesShell,
      hasToolOutputFrame: page.hasToolOutputFrame,
      outputKinds: contract.expectedOutputs.map((output) => output.kind),
      activePathTool: isToolInActiveGenericOrPoliticalPath(tool.id),
      pathMembership: memberships.map((membership) => `${membership.pathId}:${membership.tier}`),
      priority: 'P3' as ToolBacklogRow['priority'],
    };
    const priority = priorityFor(base);
    return {
      ...base,
      priority,
      sprintTasks: tasksFor({ ...base, priority }),
      verification: verificationFor({ ...base, priority }),
    };
  }).sort((a, b) => {
    const order = { P0: 0, P1: 1, P2: 2, P3: 3 };
    return order[a.priority] - order[b.priority] || (a.routeScore ?? 99) - (b.routeScore ?? 99) || a.id.localeCompare(b.id);
  });
}

function renderRow(row: ToolBacklogRow): string {
  const score = row.routeScore == null ? 'n/a' : `${row.routeScore}/12`;
  const page = row.pagePath ? row.pagePath.replace(process.cwd() + '\\', '').replaceAll('\\', '/') : 'missing';
  return [
    `### ${row.priority} - ${row.name} (${row.id})`,
    '',
    `- Category: ${row.category}`,
    `- AI route: ${row.routeName} (${score})`,
    `- Page: ${page}`,
    `- UI contract surface: ${row.hasRegistryInfo ? 'yes' : 'no'}; shared shell: ${row.usesShell ? 'yes' : 'no'}; output frame: ${row.hasToolOutputFrame ? 'yes' : 'no'}`,
    `- Output mode: ${row.outputKinds.join(', ')}`,
    `- Active generic/political path: ${row.activePathTool ? 'yes' : 'no'}`,
    `- Path membership: ${row.pathMembership.length ? row.pathMembership.join(', ') : 'none'}`,
    '',
    'To do:',
    ...row.sprintTasks.map((task) => `- [ ] ${task}`),
    '',
    'Verification:',
    ...row.verification.map((check) => `- [ ] ${check}`),
  ].join('\n');
}

function render(rows: ToolBacklogRow[]): string {
  const date = new Date().toISOString().slice(0, 10);
  const counts = rows.reduce((acc, row) => {
    acc[row.priority] = (acc[row.priority] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topThirty = rows.slice(0, 30);
  return [
    `# PRAXIS Tool-by-Tool Sprint Backlog - ${date}`,
    '',
    'This backlog is generated from the live PRAXIS tool registry, operating contracts, page inspection, and latest AI route audit. It turns every sidebar/tool surface into a concrete product-engineering sprint item: objective, graphics, usage, AI wiring, Ask PRAXIS writeback, persistence, and verification.',
    '',
    'Current implementation focus: generic core + conflict/political analyst path. Other workflow paths are codified for future activation, but they should not distract this sprint from making the common and political-analysis tools excellent.',
    '',
    `Summary: ${rows.length} registered tools; P0=${counts.P0 ?? 0}, P1=${counts.P1 ?? 0}, P2=${counts.P2 ?? 0}, P3=${counts.P3 ?? 0}.`,
    '',
    '## Cross-Tool Non-Negotiables',
    '',
    '- Every tool must explain why it exists and what professional workflow it supports.',
    '- Every generative tool must ask missing required questions before producing confident output.',
    '- Every generated output must show provenance, confidence, limits, and degraded-state language.',
    '- Every useful output must save to canonical tool data and reload/export cleanly.',
    '- Ask PRAXIS must be able to explain, challenge, and write structured corrections to the active tool after user confirmation.',
    '- Maps, graphs, timelines, scorecards, drafts, and feeds must be real product outputs, not decorative panels.',
    '',
    '## Immediate Top 30 Sprint Queue',
    '',
    ...topThirty.map(renderRow),
    '',
    '## Remaining Tools',
    '',
    ...rows.slice(30).map(renderRow),
    '',
    '## Regeneration',
    '',
    'Run `npm run generate:tool-backlog` after changing the registry, contracts, pages, or route audits.',
  ].join('\n');
}

function main() {
  const rows = buildRows();
  const out = join(process.cwd(), 'docs', `PRAXIS_TOOL_BY_TOOL_SPRINT_BACKLOG_${new Date().toISOString().slice(0, 10)}.md`);
  const dir = join(process.cwd(), 'docs');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(out, render(rows));
  console.log(`Wrote ${out}`);
  console.log(rows.slice(0, 10).map((row) => `${row.priority} ${row.id} ${row.routeScore ?? 'n/a'}/12`).join('\n'));
}

main();
