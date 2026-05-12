import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const required = [
  'src/lib/sources/tiers.ts',
  'src/components/sources/TierBadge.tsx',
  'backend/types/source.py',
  'backend/migrations/0024_source_tier.py',
  'src/components/contexts/panels/SourcesPanel.tsx',
];

for (const file of required) {
  if (!existsSync(join(root, file))) failures.push(`missing ${file}`);
}

const tiers = read('src/lib/sources/tiers.ts');
for (const tier of ['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']) {
  if (!tiers.includes(`${tier}:`)) failures.push(`source tier definition missing ${tier}`);
}
for (const marker of ['confidenceCapForTier', 'canPromoteToVerdict', 'TIER_DEFINITIONS']) {
  if (!tiers.includes(marker)) failures.push(`source tier helper missing ${marker}`);
}

const migration = read('backend/migrations/0024_source_tier.py');
for (const marker of ['workspace_chunks', 'document_chunks', "DEFAULT 'T7'", 'tier IN', 'case_id, tier']) {
  if (!migration.includes(marker)) failures.push(`source tier migration missing ${marker}`);
}

const sourceReceipt = read('src/types/source-receipt.ts');
if (!sourceReceipt.includes('tier?:')) failures.push('CanonicalSourceReceipt must expose optional tier');
if (!read('src/components/contexts/panels/SourcesPanel.tsx').includes('SourceTierBadge')) {
  failures.push('SourcesPanel must render SourceTierBadge');
}

const gate = read('package.json');
if (!gate.includes('npm run audit:source-tier-discipline')) failures.push('audit:gate missing audit:source-tier-discipline');

if (failures.length > 0) {
  console.error('audit:source-tier-discipline failed');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('audit:source-tier-discipline passed for T0-T7 definitions, migration, receipt typing, and UI badge usage. (static-marker)');

function read(file: string): string {
  const path = join(root, file);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}
