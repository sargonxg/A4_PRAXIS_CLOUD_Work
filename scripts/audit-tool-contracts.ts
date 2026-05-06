#!/usr/bin/env tsx
/**
 * Audits the product operating contract for every registered PRAXIS tool.
 *
 * Run: npx tsx scripts/audit-tool-contracts.ts
 */
/* eslint-disable @typescript-eslint/no-require-imports */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const { TOOL_REGISTRY } = require('../src/lib/constants/tool-registry.ts') as typeof import('../src/lib/constants/tool-registry');
const { getToolOperatingContract } = require('../src/lib/tools/tool-operating-contracts.ts') as typeof import('../src/lib/tools/tool-operating-contracts');
const { hrefForTool } = require('../src/lib/tools/tool-navigation.ts') as typeof import('../src/lib/tools/tool-navigation');

interface ContractAuditRow {
  toolId: string;
  name: string;
  routeExists: boolean;
  pageExists: boolean;
  hasObjective: boolean;
  hasRequiredQuestions: boolean;
  hasOutputs: boolean;
  askPraxisEditable: boolean;
  hasQualityBar: boolean;
  score: number;
}

function routeExists(aiRoute: string): boolean {
  if (!aiRoute) return true;
  if (!aiRoute.startsWith('/api/')) return true;
  const parts = aiRoute.split('/').filter(Boolean).slice(1);
  return existsSync(join(process.cwd(), 'src', 'app', 'api', ...parts, 'route.ts'));
}

function pageExists(toolId: string): boolean {
  const href = hrefForTool(toolId).split(/[?#]/)[0].replace(/^\//, '');
  const pageDir = join(process.cwd(), 'src', 'app', 'app', href);
  return existsSync(join(pageDir, 'page.tsx')) || existsSync(join(pageDir, 'layout.tsx'));
}

function scoreTool(tool: (typeof TOOL_REGISTRY)[number]): ContractAuditRow {
  const contract = getToolOperatingContract(tool.id);
  const checks = {
    routeExists: routeExists(tool.aiRoute),
    pageExists: pageExists(tool.id),
    hasObjective: contract.objective.length > 40 && contract.userValue.length > 40,
    hasRequiredQuestions: contract.requiredQuestions.length >= 2,
    hasOutputs: contract.expectedOutputs.length >= 1,
    askPraxisEditable: contract.persistence.editableByAskPraxis && contract.askPraxisActions.length >= 2,
    hasQualityBar: contract.qualityBar.length >= 3,
  };
  return {
    toolId: tool.id,
    name: tool.name,
    ...checks,
    score: Object.values(checks).filter(Boolean).length,
  };
}

function mark(value: boolean): string {
  return value ? 'yes' : 'no';
}

function render(rows: ContractAuditRow[]): string {
  const date = new Date().toISOString().slice(0, 10);
  const passing = rows.filter((row) => row.score >= 6).length;
  const header = `# PRAXIS Tool Operating Contract Audit - ${date}\n\n` +
    `Audited ${rows.length} registered tools. Passing threshold: 6/7 checks. Current passing: ${passing}/${rows.length}.\n\n`;
  const table = [
    '| Tool | Score | Route | Page | Objective | Questions | Outputs | Ask PRAXIS | Quality |',
    '|---|---:|---|---|---|---|---|---|---|',
    ...rows.map((row) => `| ${row.toolId} | ${row.score}/7 | ${mark(row.routeExists)} | ${mark(row.pageExists)} | ${mark(row.hasObjective)} | ${mark(row.hasRequiredQuestions)} | ${mark(row.hasOutputs)} | ${mark(row.askPraxisEditable)} | ${mark(row.hasQualityBar)} |`),
  ].join('\n');
  const gaps = rows
    .filter((row) => row.score < 7)
    .map((row) => `- ${row.toolId}: ${[
      !row.routeExists ? 'missing route' : '',
      !row.pageExists ? 'missing page' : '',
      !row.hasObjective ? 'thin objective' : '',
      !row.hasRequiredQuestions ? 'missing required questions' : '',
      !row.hasOutputs ? 'missing output contract' : '',
      !row.askPraxisEditable ? 'Ask PRAXIS writeback unclear' : '',
      !row.hasQualityBar ? 'quality bar thin' : '',
    ].filter(Boolean).join(', ')}`)
    .join('\n');
  return `${header}${table}\n\n## Gaps\n\n${gaps || 'No contract gaps detected.'}\n`;
}

function main() {
  const rows = TOOL_REGISTRY.map(scoreTool).sort((a, b) => a.score - b.score || a.toolId.localeCompare(b.toolId));
  const auditsDir = join(process.cwd(), 'docs', 'audits');
  if (!existsSync(auditsDir)) mkdirSync(auditsDir, { recursive: true });
  const out = join(auditsDir, `tool-contracts-${new Date().toISOString().slice(0, 10)}.md`);
  writeFileSync(out, render(rows));
  console.log(`Wrote ${out}`);
  console.log(`${rows.filter((row) => row.score >= 6).length}/${rows.length} tools pass >=6/7 operating-contract checks`);
}

main();
