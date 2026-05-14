#!/usr/bin/env node
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('tsx/cjs');

const { PATH_IDS } = require('../src/lib/path/types.ts');
const { PATH_SEEDS } = require('../src/lib/path/seeds.ts');

const failures = [];

for (const pathId of PATH_IDS) {
  const path = PATH_SEEDS[pathId];
  if (!path) {
    failures.push(`${pathId}: missing seed`);
    continue;
  }
  if (!path.toolBundle?.length) failures.push(`${pathId}: missing toolBundle`);
  if (!path.frameworkPath?.length) failures.push(`${pathId}: missing frameworkPath`);
  if (!path.sourceMix?.length) failures.push(`${pathId}: missing sourceMix`);
  if (!path.contextRecipe?.includes('path')) failures.push(`${pathId}: contextRecipe must include Path Core`);
  if (!Number.isFinite(path.creditMultiplier)) failures.push(`${pathId}: creditMultiplier must be numeric`);
}

if (failures.length) {
  console.error('audit:path-tool-coverage failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`audit:path-tool-coverage OK (${PATH_IDS.length} paths)`);
