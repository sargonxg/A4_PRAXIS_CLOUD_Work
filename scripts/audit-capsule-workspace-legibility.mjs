#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const targets = [
  'src/components/praxis/tasklet-praxis-workbench.tsx',
  'src/components/ui/instrument.tsx',
  'src/app/globals.css',
];

const requiredMarkers = [
  'praxis-workbench-panel',
  'praxis-shelf-panel',
  'praxis-menu-panel',
  'praxis-card-panel',
  'praxis-select-control',
];

const transparencyPattern = /\bbg-white\/(?:5\d|6\d|7\d|8\d)\b|\bbg-\[color:var\(--color-archive-paper(?:-strong)?\)\]\/(?:5\d|6\d|7\d|8\d)\b/g;
const allowlisted = [
  'bg-white/10',
  'bg-white/15',
  'hover:bg-white/50',
  'text-white/60',
  'text-white/70',
  'text-white/80',
];

const violations = [];
const sources = [];

function lineOf(src, index) {
  return src.slice(0, index).split(/\r?\n/).length;
}

for (const target of targets) {
  const path = resolve(ROOT, target);
  const src = await readFile(path, 'utf8');
  sources.push({ target, src });

  let match;
  transparencyPattern.lastIndex = 0;
  while ((match = transparencyPattern.exec(src)) !== null) {
    const token = match[0];
    const nearby = src.slice(Math.max(0, match.index - 80), Math.min(src.length, match.index + 120));
    if (allowlisted.some((allowed) => nearby.includes(allowed))) continue;
    violations.push(`${target}:${lineOf(src, match.index)}: operational transparency token ${token}`);
  }
}

const combined = sources.map(({ src }) => src).join('\n');
for (const marker of requiredMarkers) {
  if (!combined.includes(marker)) {
    violations.push(`capsule workspace sources: missing ${marker}`);
  }
}

if (violations.length > 0) {
  console.error(`audit:capsule-legibility - ${violations.length} issue(s)`);
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}

console.log(`audit:capsule-legibility - ok (${targets.length} files scanned)`);
