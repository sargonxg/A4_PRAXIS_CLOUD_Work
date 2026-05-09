import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredPaths = [
  'docs/v7/INDEX.md',
  'docs/v7/00_VISION_AND_OPERATING_PRINCIPLES.md',
  'docs/v7/01_FRONTEND_AND_UX.md',
  'docs/v7/02_BACKEND_DATABASE_AND_DEPLOYMENT.md',
  'docs/v7/03_CONTEXT_CORES_AND_DYNAMIC_ONTOLOGIES.md',
  'docs/v7/04_ANALYST_SKILLS_POLICY_PRODUCT_AND_OUTPUTS.md',
  'docs/v7/STATUS.md',
  'docs/v7/SLICE_TEMPLATE.md',
  'docs/v7/PROMPTS.md',
  'docs/v7/prompts/BOOTSTRAP.md',
  'docs/v7/prompts/VERIFY.md',
  'docs/v7/prompts/ADVANCE.md',
  'docs/v7/VERIFICATION_LOG.md',
  'docs/v7/FIX_LOG.md',
  'docs/v7/V7_EXECUTION_TODO.md',
];

const failures: string[] = [];

for (const rel of requiredPaths) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) {
    failures.push(`missing ${rel}`);
    continue;
  }
  const text = readFileSync(abs, 'utf8').trim();
  if (text.length < 40) failures.push(`${rel} appears empty or truncated`);
}

const indexPath = path.join(root, 'docs/v7/INDEX.md');
if (existsSync(indexPath)) {
  const index = readFileSync(indexPath, 'utf8');
  for (const rel of requiredPaths.filter((p) => p !== 'docs/v7/INDEX.md')) {
    if (!index.includes(rel)) failures.push(`INDEX.md does not reference ${rel}`);
  }
}

const promptMarkers: Record<string, string[]> = {
  'docs/v7/prompts/BOOTSTRAP.md': ['Bootstrap Prompt', 'DO NOT begin Slice 1 implementation'],
  'docs/v7/prompts/VERIFY.md': ['Verify Prompt', 'READ-ONLY session', 'VERIFICATION_LOG.md'],
  'docs/v7/prompts/ADVANCE.md': ['Advance Prompt', 'ONE bounded step', 'FIX_LOG.md'],
};

for (const [rel, markers] of Object.entries(promptMarkers)) {
  const abs = path.join(root, rel);
  if (!existsSync(abs)) continue;
  const text = readFileSync(abs, 'utf8');
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${rel} missing marker: ${marker}`);
  }
}

if (failures.length > 0) {
  console.error('[audit:v7-index-current] failures:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[audit:v7-index-current] ok (static-marker)');
