import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const failures: string[] = [];
const warnings: string[] = [];

const graphPath = join(root, 'graphify-out/graph.json');
const reportPath = join(root, 'graphify-out/GRAPH_REPORT.md');
const todoPath = join(root, 'TODO.md');
const handoffPath = join(root, 'docs/audits/2026-05-16-tasklet-codebase-cleanup-audit.md');

if (!existsSync(graphPath)) failures.push('missing graphify-out/graph.json');
if (!existsSync(reportPath)) failures.push('missing graphify-out/GRAPH_REPORT.md');
if (!existsSync(handoffPath)) failures.push('missing repo-shape handoff audit');

if (existsSync(graphPath)) {
  const graph = JSON.parse(readFileSync(graphPath, 'utf8')) as {
    built_at_commit?: string;
    nodes?: unknown[];
    links?: unknown[];
  };
  const nodeCount = graph.nodes?.length ?? 0;
  const edgeCount = graph.links?.length ?? 0;
  if (nodeCount < 1000) failures.push(`graphify node count unexpectedly low: ${nodeCount}`);
  if (edgeCount < 1000) failures.push(`graphify edge count unexpectedly low: ${edgeCount}`);

  const htmlPath = join(root, 'graphify-out/graph.html');
  if (nodeCount > 5000 && existsSync(htmlPath)) {
    warnings.push('graphify-out/graph.html exists even though graphify skips HTML above 5000 nodes; confirm it is not stale');
  }
  if (nodeCount <= 5000 && !existsSync(htmlPath)) {
    failures.push('graphify-out/graph.html missing for graph under visualization limit');
  }

  const head = execSync('git rev-parse --short=8 HEAD', { cwd: root, encoding: 'utf8' }).trim();
  const previousHead = execSync('git rev-parse --short=8 HEAD~1', { cwd: root, encoding: 'utf8' }).trim();
  if (
    graph.built_at_commit &&
    !graph.built_at_commit.startsWith(head) &&
    !graph.built_at_commit.startsWith(previousHead)
  ) {
    warnings.push(`graphify built_at_commit is ${graph.built_at_commit}; current head is ${head}`);
  }
}

if (existsSync(reportPath)) {
  const report = readFileSync(reportPath, 'utf8');
  for (const marker of ['God Nodes', 'Surprising Connections', 'Knowledge Gaps', 'Suggested Questions']) {
    if (!report.includes(marker)) failures.push(`graphify report missing ${marker}`);
  }
}

if (existsSync(todoPath)) {
  const todo = readFileSync(todoPath, 'utf8');
  for (const marker of ['Repo Shape And Next-Round Readiness', 'graphify', 'Knip']) {
    if (!todo.includes(marker)) failures.push(`TODO.md missing repo-shape marker: ${marker}`);
  }
}

if (warnings.length > 0) {
  console.warn('Repo shape warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length > 0) {
  console.error('Repo shape audit failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Repo shape audit passed. (static-marker)');
