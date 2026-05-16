#!/usr/bin/env node
/**
 * audit-single-h1 — fail when a workbench surface (the
 * PraxisWorkspaceShell + nested components rendered into it) ships
 * more than one <h1>.
 *
 * Why: persona-smoke uses Playwright strict mode locator('h1') which
 * rejects duplicates. The shell owns the canonical page-level h1
 * ("{caseName} workbench"); nested surfaces must use h2/h3.
 *
 * Strategy: every component file under src/components/workbench/ that
 * is rendered inside the shell may emit at most zero h1s. The shell
 * itself is the single allowed source of <h1> for that surface.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const WORKBENCH_DIR = join(REPO_ROOT, 'src', 'components', 'workbench');
const ALLOWED_H1_FILES = new Set([
  // Shell owns the page-level h1.
  'src/components/app/praxis-workspace-shell.tsx',
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

function relPath(p) {
  return p.replace(REPO_ROOT + sep, '').replaceAll('\\', '/');
}

const offenders = [];
if (!existsSync(WORKBENCH_DIR)) {
  console.log('audit-single-h1: ok - retired workbench component tree is absent.');
  process.exit(0);
}
for (const file of walk(WORKBENCH_DIR)) {
  const rel = relPath(file);
  if (ALLOWED_H1_FILES.has(rel)) continue;
  const src = readFileSync(file, 'utf8');
  const matches = src.match(/<h1[\s>]/g);
  if (matches && matches.length > 0) {
    offenders.push(`${rel} (${matches.length} h1)`);
  }
}

if (offenders.length > 0) {
  console.error('audit-single-h1: workbench files render <h1>; demote to <h2>:');
  for (const off of offenders) console.error('  - ' + off);
  process.exit(1);
}

console.log('audit-single-h1: ok — workbench surfaces ship 0 h1s (shell owns it).');
