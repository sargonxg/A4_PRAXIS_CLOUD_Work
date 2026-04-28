#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const AI_ROUTES_DIR = 'src/app/api/ai';
// 'ask-praxis' is a thin re-export of the calibrated 'chat' route — it
// inherits withCalibration via re-export, so the static text scan misses it.
const EXEMPT = new Set(['chat', 'terminology', 'grounded-search', 'advisor-chat', 'ask-praxis']);

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (name === 'route.ts') acc.push(full);
  }
  return acc;
}

const files = walk(AI_ROUTES_DIR);
const fails = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const toolId = f.split(/[\\/]/).slice(-2, -1)[0];
  if (EXEMPT.has(toolId)) continue;
  if (!/withCalibration\s*\(/.test(src)) {
    fails.push(`${f}  (tool ${toolId})`);
  }
}
if (fails.length) {
  console.error('Routes missing withCalibration wrapper:');
  fails.forEach((f) => console.error('  ' + f));
  process.exit(1);
}
console.log(`OK — ${files.length} AI route files, ${files.length - fails.length} calibrated, ${EXEMPT.size} exempt.`);
